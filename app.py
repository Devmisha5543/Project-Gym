from flask import Flask, jsonify, request, has_request_context, redirect
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask import send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import hashlib
import secrets
from functools import wraps
from flask import request
import redis
import json
import re
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from concurrent.futures import ThreadPoolExecutor
from email_service import send_password_changed_email, send_reset_email

load_dotenv()

redis_url = os.getenv("REDIS_URL")
if redis_url:
    redis_client = redis.from_url(redis_url, decode_responses=True)
else:
    redis_client = redis.Redis(
        host="localhost",
        port=6379,
        decode_responses=True
    )

try:
    redis_client.ping()
    print("Redis connected successfully")
except redis.RedisError as e:
    print(f"Redis connection failed: {e}")

def invalidate_members_cache():
    try:
        redis_client.delete("members:all")
        print("Members cache invalidated")
    except redis.RedisError as e:
        app.logger.warning("Cache invalidation failed for members:all: %s", e)
    invalidate_analytics_cache() 

def invalidate_analytics_cache():
    if not has_request_context():
        return
    gym_id = getattr(request, "decoded_token", {}).get("gym_id")
    if gym_id is None:
        return
    try:
        redis_client.incr(f"analytics:version:{gym_id}")
    except redis.RedisError:
        app.logger.warning("Analytics cache version could not be updated")

def cache_response(cache_key):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            key = cache_key() if callable(cache_key) else cache_key
            try:
                cached = redis_client.get(key)
            except redis.RedisError:
                cached = None
            if cached:
                payload = json.loads(cached)
                if isinstance(payload, list):
                    for item in payload:
                        if isinstance(item, dict) and "photo_filename" in item:
                            item["photo_filename"] = available_member_photo(
                                item.get("photo_filename")
                            )
                return jsonify(payload)

            response = app.make_response(f(*args, **kwargs))
            if response.status_code == 200:
                try:
                    redis_client.setex(key, 300, response.get_data(as_text=True))
                except redis.RedisError:
                    app.logger.warning("Response cache write failed for %s", key)
            return response
        return decorated
    return decorator

def invalidate_caches(*keys):
    if not keys:
        return
    try:
        redis_client.delete(*keys)
    except redis.RedisError as e:
        app.logger.warning("Cache invalidation failed for keys %s: %s", keys, e)

def invalidate_branches_cache():
    invalidate_analytics_cache()
    gym_id = (
        getattr(request, "decoded_token", {}).get("gym_id")
        if has_request_context() else None
    )
    invalidate_caches(
        f"branches:{gym_id}" if gym_id is not None else "branches:all",
        "branches:all", "classes:all", "equipment:all", "trainer_branches:all"
    )

def invalidate_trainers_cache():
    invalidate_caches("trainers:all", "classes:all", "trainer_branches:all", "personal_training_assignments:all")

def invalidate_classes_cache():
    invalidate_caches("classes:all", "class_bookings:all")

def invalidate_memberships_cache():
    try:
        invalidate_analytics_cache()
        invalidate_caches(
            "memberships:all", "payments:all",
            f"memberships:expiring:{datetime.date.today().isoformat()}"
        )
    except redis.RedisError as e:
        app.logger.warning("Cache invalidation failed for memberships: %s", e)

def invalidate_membership_plans_cache():
    invalidate_analytics_cache()
    invalidate_caches("membership_plans:all", "memberships:all")

def invalidate_class_bookings_cache():
    invalidate_caches("class_bookings:all")

def invalidate_payments_cache():
    invalidate_analytics_cache()
    invalidate_caches("payments:all")

def invalidate_equipment_cache():
    invalidate_caches("equipment:all")

def invalidate_trainer_branches_cache():
    invalidate_caches("trainer_branches:all")

def invalidate_personal_training_assignments_cache():
    invalidate_caches("personal_training_assignments:all")

def invalidate_admins_cache():
    invalidate_caches("admins:all")

def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    else:
        return psycopg2.connect(
            host="localhost",
            database="gym_db",
            user="postgres",
            password=os.getenv("DB_PASSWORD")
        )

app = Flask(__name__)
_password_reset_executor = ThreadPoolExecutor(max_workers=2)
_PASSWORD_RESET_RATE_LIMIT = 3
_PASSWORD_RESET_RATE_WINDOW = 60 * 60
_GOOGLE_STATE_MAX_AGE = 600
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
CORS(app, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    re.compile(r"^http://(?:localhost|127\.0\.0\.1):\d+$"),
    re.compile(r"^http://(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):5173$"),
    "https://project-gym-zeta.vercel.app"
])


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(" ")[1]

        try:
            decoded = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        admin_id = decoded.get("admin_id")
        if admin_id is not None:
            conn = None
            cursor = None
            try:
                cache_key = f"auth:revoked_at:{admin_id}"
                revoked_at = None
                try:
                    cached_revocation = redis_client.get(cache_key)
                    if cached_revocation is not None:
                        revoked_at = (
                            datetime.datetime.fromisoformat(cached_revocation)
                            if cached_revocation != "none" else False
                        )
                except (redis.RedisError, ValueError):
                    pass

                if revoked_at is None:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT MAX(used_at) FROM password_reset_tokens WHERE user_id = %s AND used_at IS NOT NULL;",
                        (admin_id,)
                    )
                    revoked_at = cursor.fetchone()[0] or False
                    try:
                        redis_client.setex(
                            cache_key, 300,
                            revoked_at.isoformat() if revoked_at else "none"
                        )
                    except redis.RedisError:
                        pass

                issued_at = decoded.get("iat")
                if revoked_at and (
                    issued_at is None or revoked_at >= datetime.datetime.fromtimestamp(
                        issued_at, datetime.timezone.utc
                    )
                ):
                    return jsonify({"error": "Invalid token"}), 401
            except Exception:
                app.logger.error("Authentication token revocation check failed")
                return jsonify({"error": "Authentication service unavailable"}), 503
            finally:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()

        request.decoded_token = decoded
        return f(*args, **kwargs)

    return decorated


def _allow_password_reset_request(email, ip_address):
    email_key = "email:" + hashlib.sha256(email.lower().encode("utf-8")).hexdigest()
    ip_key = "ip:" + hashlib.sha256((ip_address or "unknown").encode("utf-8")).hexdigest()
    rate_limit_script = """
        local email_count = tonumber(redis.call('GET', KEYS[1]) or '0')
        local ip_count = tonumber(redis.call('GET', KEYS[2]) or '0')
        if email_count >= tonumber(ARGV[1]) or ip_count >= tonumber(ARGV[1]) then
            return 0
        end
        if email_count == 0 then
            redis.call('SET', KEYS[1], 1, 'EX', ARGV[2])
        else
            redis.call('INCR', KEYS[1])
        end
        if ip_count == 0 then
            redis.call('SET', KEYS[2], 1, 'EX', ARGV[2])
        else
            redis.call('INCR', KEYS[2])
        end
        return 1
    """
    try:
        return bool(redis_client.eval(
            rate_limit_script, 2, "password-reset-rate:" + email_key,
            "password-reset-rate:" + ip_key, _PASSWORD_RESET_RATE_LIMIT,
            _PASSWORD_RESET_RATE_WINDOW
        ))
    except redis.RedisError:
        app.logger.error("Password reset rate limiter unavailable")
        return False


def _process_password_reset_request(email):
    conn = None
    cursor = None
    raw_token = None
    recipient = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT admin_id, email FROM admin WHERE LOWER(email) = LOWER(%s) LIMIT 1 FOR UPDATE;", (email,))
        user = cursor.fetchone()
        if not user:
            return

        user_id, recipient = user
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        cursor.execute(
            "UPDATE password_reset_tokens SET expires_at = CURRENT_TIMESTAMP WHERE user_id = %s AND used_at IS NULL;",
            (user_id,)
        )
        cursor.execute(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, CURRENT_TIMESTAMP + INTERVAL '30 minutes');",
            (user_id, token_hash)
        )
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        app.logger.error("Password reset request processing failed")
        return
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    if recipient and raw_token:
        try:
            send_reset_email(recipient, raw_token)
        except Exception:
            app.logger.error("Password reset email delivery failed")


def _send_password_changed_notification(email):
    try:
        send_password_changed_email(email)
    except Exception:
        app.logger.error("Password change confirmation email delivery failed")


def _google_oauth_config():
    return {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv(
            "GOOGLE_REDIRECT_URI",
            "http://localhost:5000/auth/google/callback"
        ),
        "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:5173")
    }


def _google_oauth_ready(config):
    return bool(config["client_id"] and config["client_secret"])


def _google_state_serializer():
    return URLSafeTimedSerializer(
        os.getenv("JWT_SECRET"),
        salt="project-gym-google-oauth"
    )


def _google_request(url, data=None, headers=None):
    encoded_data = urlencode(data).encode("utf-8") if data else None
    request_headers = headers or {}
    if data:
        request_headers = {
            **request_headers,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    request = UrlRequest(url, data=encoded_data, headers=request_headers)
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def _create_admin_token(admin_id, gym_id):
    issued_at = datetime.datetime.now(datetime.timezone.utc)
    return jwt.encode(
        {
            "admin_id": admin_id,
            "role": "admin",
            "gym_id": gym_id,
            "iat": issued_at.timestamp(),
            "exp": issued_at + datetime.timedelta(hours=8)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )


def _oauth_callback_redirect(config, **params):
    callback_url = f"{config['frontend_url'].rstrip('/')}/oauth/callback"
    return redirect(f"{callback_url}?{urlencode(params)}")


@app.route("/auth/google/start")
def google_oauth_start():
    config = _google_oauth_config()
    if not _google_oauth_ready(config):
        return jsonify({"error": "Google sign-in is not configured."}), 503

    state = _google_state_serializer().dumps({"nonce": secrets.token_urlsafe(24)})
    query = urlencode({
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "state": state,
        "prompt": "select_account"
    })
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@app.route("/auth/google/callback")
def google_oauth_callback():
    config = _google_oauth_config()
    if not _google_oauth_ready(config):
        return _oauth_callback_redirect(config, error="google_not_configured")

    state = request.args.get("state", "")
    code = request.args.get("code", "")
    if not state or not code:
        return _oauth_callback_redirect(config, error="google_authorization_failed")

    try:
        _google_state_serializer().loads(state, max_age=_GOOGLE_STATE_MAX_AGE)
        token_data = _google_request(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": config["redirect_uri"],
                "grant_type": "authorization_code"
            }
        )
        access_token = token_data.get("access_token")
        if not access_token:
            raise ValueError("Google did not return an access token")
        google_user = _google_request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    except (BadSignature, SignatureExpired):
        return _oauth_callback_redirect(config, error="google_state_expired")
    except Exception:
        app.logger.exception("Google OAuth callback failed")
        return _oauth_callback_redirect(config, error="google_authorization_failed")

    google_sub = google_user.get("sub")
    email = google_user.get("email", "").strip().lower()
    if not google_sub or not email or google_user.get("email_verified") is not True:
        return _oauth_callback_redirect(config, error="google_email_unverified")

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT admin_id, name, email, gym_id FROM admin WHERE google_sub = %s LIMIT 1;",
            (google_sub,)
        )
        admin = cursor.fetchone()
        if admin is None:
            cursor.execute(
                "SELECT admin_id, name, email, gym_id FROM admin WHERE LOWER(email) = %s LIMIT 1 FOR UPDATE;",
                (email,)
            )
            admin = cursor.fetchone()
            if admin is None:
                conn.rollback()
                return _oauth_callback_redirect(config, error="google_account_not_found")
            cursor.execute(
                "UPDATE admin SET google_sub = %s WHERE admin_id = %s;",
                (google_sub, admin[0])
            )
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        app.logger.exception("Google OAuth account linking failed")
        return _oauth_callback_redirect(config, error="google_sign_in_failed")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    admin_id, name, _, gym_id = admin
    return _oauth_callback_redirect(
        config,
        token=_create_admin_token(admin_id, gym_id),
        name=name
    )


@app.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if isinstance(email, str) and email.strip():
        email = email.strip()
        if _allow_password_reset_request(email, request.remote_addr):
            _password_reset_executor.submit(_process_password_reset_request, email)
    return jsonify({"message": "If that email is registered, a reset link has been sent."}), 200


@app.route("/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    raw_token = data.get("token")
    new_password = data.get("new_password")
    invalid_link = {"error": "Invalid or expired link."}
    if not isinstance(raw_token, str) or not raw_token:
        return jsonify(invalid_link), 400
    if not isinstance(new_password, str) or len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT t.id, t.user_id, a.email FROM password_reset_tokens t JOIN admin a ON a.admin_id = t.user_id WHERE t.token_hash = %s AND t.used_at IS NULL AND t.expires_at > CURRENT_TIMESTAMP FOR UPDATE OF t, a;",
            (token_hash,)
        )
        reset = cursor.fetchone()
        if not reset:
            conn.rollback()
            return jsonify(invalid_link), 400

        token_id, user_id, email = reset
        password_hash = generate_password_hash(new_password)
        cursor.execute("UPDATE admin SET password_hash = %s WHERE admin_id = %s;", (password_hash, user_id))
        cursor.execute(
            "UPDATE password_reset_tokens SET expires_at = CURRENT_TIMESTAMP WHERE user_id = %s AND id <> %s AND used_at IS NULL;",
            (user_id, token_id)
        )
        cursor.execute("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = %s;", (token_id,))
        conn.commit()
        try:
            redis_client.delete(f"auth:revoked_at:{user_id}")
        except redis.RedisError:
            pass
    except Exception:
        if conn:
            conn.rollback()
        app.logger.error("Password reset transaction failed")
        return jsonify({"error": "Password reset could not be completed."}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    _password_reset_executor.submit(_send_password_changed_notification, email)
    return jsonify({"message": "Your password has been reset."}), 200

def super_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        admin_id = request.decoded_token.get("admin_id")

        if admin_id != 1:
            return jsonify({
                "error": "Only the super admin can manage administrator accounts"
            }), 403

        return f(*args, **kwargs)

    return decorated

def get_authenticated_gym_id(conn=None):
    decoded = getattr(request, "decoded_token", None)
    if not decoded:
        return None

    # Forward-compatible: use gym_id if present in token payload
    if "gym_id" in decoded and decoded["gym_id"] is not None:
        return decoded["gym_id"]

    admin_id = decoded.get("admin_id")
    if not admin_id:
        return None

    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT gym_id FROM Admin WHERE admin_id = %s;", (admin_id,))
        row = cursor.fetchone()
        if row and row[0] is not None:
            return row[0]
        return None
    finally:
        if cursor:
            cursor.close()
        if should_close:
            conn.close()

REQUEST_BODY_JSON_ERROR = "Request body must be valid JSON"
ALLOWED_MEMBER_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

def is_valid_member_photo(file):
    filename = secure_filename(file.filename)
    extension = os.path.splitext(filename)[1].lower()
    header = file.stream.read(12)
    file.stream.seek(0)
    valid_signatures = {
        ".jpg": header.startswith(b"\xff\xd8\xff"),
        ".jpeg": header.startswith(b"\xff\xd8\xff"),
        ".png": header.startswith(b"\x89PNG\r\n\x1a\n"),
        ".gif": header.startswith((b"GIF87a", b"GIF89a")),
        ".webp": header[:4] == b"RIFF" and header[8:12] == b"WEBP",
    }
    return extension in ALLOWED_MEMBER_PHOTO_EXTENSIONS and valid_signatures.get(extension, False)

def available_member_photo(filename):
    if not filename:
        return None

    safe_filename = secure_filename(str(filename))
    if safe_filename != str(filename):
        return None

    photo_path = os.path.join(app.config["UPLOAD_FOLDER"], safe_filename)
    return safe_filename if os.path.isfile(photo_path) else None

@app.route("/gym", methods=["GET"])
@token_required
def get_gym():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        gym_id = get_authenticated_gym_id(conn)
        if not gym_id:
            return jsonify({"error": "Gym not found"}), 404

        cursor = conn.cursor()
        cursor.execute(
            "SELECT gym_id, name, phone, email, address, currency, logo_url, created_at FROM gym WHERE gym_id = %s;",
            (gym_id,)
        )
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Gym not found"}), 404

        return jsonify({
            "gym_id": row[0],
            "name": row[1],
            "phone": row[2],
            "email": row[3],
            "address": row[4],
            "currency": row[5],
            "logo_url": row[6],
            "created_at": row[7].isoformat() if row[7] else None
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve gym details"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route("/gym", methods=["PUT"])
@token_required
def update_gym():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    if "name" in data and (data["name"] is None or not str(data["name"]).strip()):
        return jsonify({"error": "Gym name cannot be empty"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        gym_id = get_authenticated_gym_id(conn)
        if not gym_id:
            return jsonify({"error": "Gym not found"}), 404

        cursor = conn.cursor()
        cursor.execute(
            "SELECT gym_id, name, phone, email, address, currency, logo_url, created_at FROM gym WHERE gym_id = %s;",
            (gym_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Gym not found"}), 404

        name = data.get("name", existing[1])
        phone = data.get("phone", existing[2])
        email = data.get("email", existing[3])
        address = data.get("address", existing[4])
        currency = data.get("currency", existing[5])
        logo_url = data.get("logo_url", existing[6])

        cursor.execute(
            """
            UPDATE gym
            SET name = %s, phone = %s, email = %s, address = %s, currency = %s, logo_url = %s
            WHERE gym_id = %s
            RETURNING gym_id, name, phone, email, address, currency, logo_url, created_at;
            """,
            (name, phone, email, address, currency, logo_url, gym_id)
        )
        updated = cursor.fetchone()
        conn.commit()

        gym_data = {
            "gym_id": updated[0],
            "name": updated[1],
            "phone": updated[2],
            "email": updated[3],
            "address": updated[4],
            "currency": updated[5],
            "logo_url": updated[6],
            "created_at": updated[7].isoformat() if updated[7] else None
        }

        return jsonify({
            "message": "Gym updated successfully",
            "gym": gym_data,
            **gym_data
        }), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to update gym details"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route("/uploads/<filename>")
@token_required
def get_uploaded_file(filename):
    response = send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "private, no-store"
    return response

@app.route("/")
def home():
    return "Gym Management System backend is running!"

@app.route("/db-check", methods=["GET"])
@token_required
def db_check():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT current_database(), current_schema();")
        db_name, schema = cursor.fetchone()

        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'admin'
              AND column_name = 'gym_id';
        """)
        gym_column = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        "database": db_name,
        "schema": schema,
        "admin_has_gym_id": gym_column is not None
    })

@app.route("/branches")
@token_required
@cache_response(lambda: f"branches:{request.decoded_token.get('gym_id')}")
def get_branches():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT branch_id, name, address, phone, city "
            "FROM branch WHERE gym_id = %s;",
            (request.decoded_token.get("gym_id"),)
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    branches = []
    for row in rows:
        branches.append({
            "branch_id": row[0],
            "name": row[1],
            "address": row[2],
            "phone": row[3],
            "city": row[4]
        })

    return jsonify(branches)

@app.route("/branches", methods=["POST"])
@token_required
def create_branch():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "address", "phone", "city"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Branch (name, address, phone, city, gym_id) "
            "VALUES(%s, %s, %s, %s, %s) RETURNING branch_id;",
            (
                data["name"], data["address"], data["phone"], data["city"],
                request.decoded_token.get("gym_id")
            )
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_branches_cache()
    return jsonify({"message": "Branch created", "branch_id": new_id}), 201

@app.route("/branches/<int:branch_id>", methods=["DELETE"])
@token_required
def delete_branch(branch_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM Branch WHERE branch_id = %s AND gym_id = %s;",
            (branch_id, request.decoded_token.get("gym_id"))
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({
                "error": f"Branch {branch_id} not found"
            }), 404

        conn.commit()
        invalidate_branches_cache()

        return jsonify({
            "message": f"Branch {branch_id} deleted"
        }), 200

    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()

        return jsonify({
            "error": "This branch cannot be deleted because it is still being used by other records, such as classes."
        }), 409

    except Exception as e:
        conn.rollback()
        print(f"Failed to delete branch {branch_id}: {e}")

        return jsonify({
            "error": "Failed to delete branch."
        }), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/branches/<int:branch_id>", methods=["PUT"])
@token_required
def update_branch(branch_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Branch SET name = %s, address = %s, phone = %s, city=%s "
            "WHERE branch_id = %s AND gym_id = %s;",
            (
                data["name"], data["address"], data["phone"], data["city"],
                branch_id, request.decoded_token.get("gym_id")
            )
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Branch {branch_id} not found"}), 404

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_branches_cache()
    return jsonify({"message": f"Branch {branch_id} updated"}), 200


@app.route("/members")
@token_required
def get_members():
    cache_key = "members:all"

    # 1. Try Redis first, but never let Redis failure break the API
    try:
        cached_members = redis_client.get(cache_key)
    except redis.RedisError as e:
        app.logger.warning("Redis unavailable while loading members: %s", e)
        cached_members = None

    if cached_members:
        print("Members loaded from Redis")
        members = json.loads(cached_members)

        for member in members:
            member["photo_filename"] = available_member_photo(
                member.get("photo_filename")
            )

        return jsonify(members)

    # 2. Redis unavailable or cache miss → PostgreSQL
    print("Members loaded from PostgreSQL")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT member_id, branch_id, name, gender, phone, address,
                   join_date, wants_trainer, photo_filename
            FROM member;
        """)

        rows = cursor.fetchall()

    finally:
        cursor.close()
        conn.close()

    members = []

    for row in rows:
        members.append({
            "member_id": row[0],
            "branch_id": row[1],
            "name": row[2],
            "gender": row[3],
            "phone": row[4],
            "address": row[5],
            "join_date": row[6],
            "wants_trainer": row[7],
            "photo_filename": available_member_photo(row[8])
        })

    # 3. Try to cache, but don't fail the request if Redis is unavailable
    try:
        redis_client.setex(
            cache_key,
            300,
            json.dumps(members, default=str)
        )
    except redis.RedisError as e:
        app.logger.warning("Redis unavailable while caching members: %s", e)

    return jsonify(members)
@app.route("/members", methods=["POST"])
@token_required
def create_member():
    data = request.form

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required_fields = [
        "branch_id",
        "name",
        "gender",
        "phone",
        "address",
        "join_date",
        "wants_trainer",
        "plan_id",
        "membership_end_date"
    ]

    missing = [field for field in required_fields if field not in data]

    if missing:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    photo_filename = None

    if "photo" in request.files:
        file = request.files["photo"]

        if file.filename != "":
            if not is_valid_member_photo(file):
                return jsonify({
                    "error": "Upload a valid JPG, PNG, GIF, or WebP image."
                }), 400

            photo_filename = f"{secrets.token_hex(8)}_{secure_filename(file.filename)}"
            file.save(
                os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    photo_filename
                )
            )

    conn = cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO Member
            (branch_id, name, gender, phone, address, join_date,
             wants_trainer, photo_filename)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING member_id;
            """,
            (
                data["branch_id"], data["name"], data["gender"],
                data["phone"], data["address"], data["join_date"],
                data["wants_trainer"] == "true", photo_filename
            )
        )
        new_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO Membership (member_id, plan_id, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, 'active')
            RETURNING membership_id;
            """,
            (new_id, data["plan_id"], data["join_date"], data["membership_end_date"])
        )
        membership_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        if photo_filename:
            try:
                os.remove(os.path.join(app.config["UPLOAD_FOLDER"], photo_filename))
            except OSError:
                pass
        app.logger.exception("Failed to create member and initial membership")
        return jsonify({"error": "Failed to create member and initial membership."}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    # Invalidate cached member list after successful creation
    invalidate_members_cache()
    invalidate_memberships_cache()
    invalidate_caches("class_bookings:all", "personal_training_assignments:all")

    return jsonify({
        "message": "Member created",
        "member_id": new_id,
        "membership_id": membership_id
    }), 201


@app.route("/members/<int:member_id>", methods=["DELETE"])
@token_required
def delete_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM Payment WHERE membership_id IN "
            "(SELECT membership_id FROM Membership WHERE member_id = %s);",
            (member_id,)
        )
        cursor.execute(
            "DELETE FROM Membership WHERE member_id = %s;",
            (member_id,)
        )
        cursor.execute(
            "DELETE FROM ClassBooking WHERE member_id = %s;",
            (member_id,)
        )
        cursor.execute(
            "DELETE FROM PersonalTrainingAssignment WHERE member_id = %s;",
            (member_id,)
        )
        cursor.execute(
            "DELETE FROM Member WHERE member_id = %s;",
            (member_id,)
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({
                "error": f"Member {member_id} not found"
            }), 404

        conn.commit()
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "This member cannot be deleted while memberships, bookings, or assignments still reference them."}), 409
    except Exception:
        conn.rollback()
        app.logger.exception("Failed to delete member %s", member_id)
        return jsonify({"error": "Failed to delete member and related records."}), 500
    finally:
        cursor.close()
        conn.close()

    # Invalidate cached member list after successful deletion
    invalidate_members_cache()
    invalidate_memberships_cache()
    invalidate_class_bookings_cache()
    invalidate_personal_training_assignments_cache()
    invalidate_payments_cache()

    return jsonify({
        "message": f"Member {member_id} deleted"
    }), 200


@app.route("/members/<int:member_id>", methods=["PUT"])
@token_required
def update_member(member_id):
    data = request.form if request.form else request.get_json(silent=True)
    is_multipart = bool(request.form)

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = (
        [
            "branch_id",
            "name",
            "gender",
            "phone",
            "address",
            "join_date",
            "wants_trainer"
        ]
        if is_multipart
        else ["name", "phone"]
    )

    missing = [field for field in required_fields if field not in data]

    if missing:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    photo_filename = None

    if is_multipart and "photo" in request.files:
        file = request.files["photo"]

        if file.filename != "":
            if not is_valid_member_photo(file):
                return jsonify({
                    "error": "Upload a valid JPG, PNG, GIF, or WebP image."
                }), 400

            photo_filename = f"{secrets.token_hex(8)}_{secure_filename(file.filename)}"

            file.save(
                os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    photo_filename
                )
            )

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if not is_multipart:
            cursor.execute(
                """
                UPDATE Member
                SET name = %s, phone = %s
                WHERE member_id = %s;
                """,
                (
                    data["name"],
                    data["phone"],
                    member_id
                )
            )
        elif photo_filename:
            cursor.execute(
                """
                UPDATE Member
                SET branch_id = %s,
                    name = %s,
                    gender = %s,
                    phone = %s,
                    address = %s,
                    join_date = %s,
                    wants_trainer = %s,
                    photo_filename = %s
                WHERE member_id = %s;
                """,
                (
                    data["branch_id"],
                    data["name"],
                    data["gender"],
                    data["phone"],
                    data["address"],
                    data["join_date"],
                    str(data["wants_trainer"]).lower() == "true",
                    photo_filename,
                    member_id
                )
            )
        else:
            cursor.execute(
                """
                UPDATE Member
                SET branch_id = %s,
                    name = %s,
                    gender = %s,
                    phone = %s,
                    address = %s,
                    join_date = %s,
                    wants_trainer = %s
                WHERE member_id = %s;
                """,
                (
                    data["branch_id"],
                    data["name"],
                    data["gender"],
                    data["phone"],
                    data["address"],
                    data["join_date"],
                    str(data["wants_trainer"]).lower() == "true",
                    member_id
                )
            )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({
                "error": f"Member {member_id} not found"
            }), 404

        conn.commit()

        cursor.execute(
            """
            SELECT member_id, branch_id, name, gender, phone, address,
                   join_date, wants_trainer, photo_filename
            FROM member
            WHERE member_id = %s;
            """,
            (member_id,)
        )

        row = cursor.fetchone()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    # Invalidate cached member list after successful update
    invalidate_members_cache()
    invalidate_memberships_cache()
    invalidate_caches("class_bookings:all", "personal_training_assignments:all")

    return jsonify({
        "message": f"Member {member_id} updated",
        "member": {
            "member_id": row[0],
            "branch_id": row[1],
            "name": row[2],
            "gender": row[3],
            "phone": row[4],
            "address": row[5],
            "join_date": row[6],
            "wants_trainer": row[7],
            "photo_filename": row[8]
        }
    }), 200

@app.route("/trainers")
@token_required
@cache_response("trainers:all")
def get_trainers():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT trainer_id, name, phone, email, certification
        FROM trainer
        ORDER BY trainer_id ASC;
        """)
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    trainers = []

    for row in rows:
        trainers.append({
            "trainer_id": row[0],
            "name": row[1],
            "phone": row[2],
            "email": row[3],
            "certification": row[4],
        })

    return jsonify(trainers)


@app.route("/trainers", methods=["POST"])
@token_required
def create_trainer():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "phone", "email", "certification"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Trainer (name, phone, email, certification) VALUES(%s, %s, %s, %s) RETURNING trainer_id;",
            (data["name"], data["phone"], data["email"], data["certification"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainers_cache()
    return jsonify({"message": "Trainer created", "trainer_id": new_id}), 201

@app.route("/trainers/<int:trainer_id>", methods=["DELETE"])
@token_required
def delete_trainer(trainer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Trainer WHERE trainer_id = %s;", (trainer_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Trainer {trainer_id} not found"}), 404
        conn.commit()
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "This trainer cannot be deleted while classes, branch links, or assignments still reference them."}), 409
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainers_cache()
    return jsonify({"message": f"Trainer {trainer_id} deleted"}), 200

@app.route("/trainers/<int:trainer_id>", methods=["PUT"])
@token_required
def update_trainer(trainer_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Trainer SET name = %s, phone = %s, email = %s, certification = %s WHERE trainer_id = %s",
            (data["name"], data["phone"], data["email"], data["certification"], trainer_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Trainer {trainer_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainers_cache()
    return jsonify({"message": f"Trainer {trainer_id} updated"}), 200



@app.route("/memberships/expiring")
@token_required
@cache_response(lambda: f"memberships:expiring:{datetime.date.today().isoformat()}")
def get_expiring_memberships():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                membership.membership_id,
                member.member_id,
                member.branch_id,
                member.name,
                member.gender,
                member.phone,
                member.address,
                member.join_date,
                member.wants_trainer,
                member.photo_filename,
                membership.start_date,
                membership.end_date,
                membership.status
            FROM membership
            JOIN member
                ON membership.member_id = member.member_id
            WHERE membership.end_date >= CURRENT_DATE
              AND membership.end_date <= CURRENT_DATE + INTERVAL '7 days'
              AND membership.status <> 'cancelled'
              AND NOT EXISTS (
                  SELECT 1
                  FROM membership newer
                  WHERE newer.member_id = membership.member_id
                    AND (newer.end_date > membership.end_date
                         OR (newer.end_date = membership.end_date
                             AND newer.membership_id > membership.membership_id))
              )
            ORDER BY membership.end_date ASC;
        """)

        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    expiring = []

    for row in rows:
        expiring.append({
            "membership_id": row[0],
            "member_id": row[1],
            "branch_id": row[2],
            "member_name": row[3],
            "name": row[3],
            "gender": row[4],
            "member_phone": row[5],
            "phone": row[5],
            "address": row[6],
            "join_date": row[7].isoformat() if row[7] else None,
            "wants_trainer": row[8],
            "photo_filename": available_member_photo(row[9]),
            "start_date": row[10].isoformat() if row[10] else None,
            "end_date": row[11].isoformat() if row[11] else None,
            "status": row[12]
        })

    return jsonify(expiring)

@app.route("/memberships", methods=["POST"])
@token_required
def create_membership():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["member_id", "plan_id", "start_date", "end_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Membership (member_id, plan_id, start_date, end_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING membership_id;",
            (data["member_id"], data["plan_id"], data["start_date"], data["end_date"], data["status"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_memberships_cache()
    return jsonify({"message": "Membership created", "membership_id": new_id}), 201

@app.route("/memberships/<int:membership_id>", methods=["DELETE"])
@token_required
def delete_membership(membership_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Membership WHERE membership_id = %s;", (membership_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Membership {membership_id} not found"}), 404
        conn.commit()
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "This membership cannot be deleted while payments still reference it."}), 409
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_memberships_cache()
    return jsonify({"message": f"Membership {membership_id} deleted"}), 200

@app.route("/memberships/<int:membership_id>", methods=["PUT"])
@token_required
def update_membership(membership_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Membership SET member_id = %s, plan_id = %s, start_date = %s, end_date = %s, status = %s WHERE membership_id = %s;",
            (data["member_id"], data["plan_id"], data["start_date"], data["end_date"], data["status"], membership_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Membership {membership_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_memberships_cache()
    return jsonify({"message": f"Membership {membership_id} updated"}), 200

@app.route("/personaltrainingassignments")
@token_required
@cache_response("personal_training_assignments:all")
def get_personal_trainer_assignments():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT assignment_id, trainer_id, member_id, speciality, start_date, status FROM personaltrainingassignment;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    assignments = []
    for row in rows:
        assignments.append({
            "assignment_id": row[0],
            "trainer_id": row[1],
            "member_id": row[2],
            "speciality": row[3],
            "start_date": row[4],
            "status": row[5]
        })

    return jsonify(assignments)

@app.route("/personaltrainingassignments", methods=["POST"])
@token_required
def create_personal_trainer_assignment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "member_id", "speciality", "start_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO PersonalTrainingAssignment (trainer_id, member_id, speciality, start_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING assignment_id;",
            (data["trainer_id"], data["member_id"], data["speciality"], data["start_date"], data["status"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_personal_training_assignments_cache()
    return jsonify({"message": "Personal trainer assignment created", "assignment_id": new_id}), 201

@app.route("/personaltrainingassignments/<int:assignment_id>", methods=["DELETE"])
@token_required
def delete_personal_trainer_assignment(assignment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM PersonalTrainingAssignment WHERE assignment_id = %s;", (assignment_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"PersonalTrainingAssignment {assignment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_personal_training_assignments_cache()
    return jsonify({"message": f"Personal trainer assignment {assignment_id} deleted"}), 200

@app.route("/personaltrainingassignments/<int:assignment_id>", methods=["PUT"])
@token_required
def update_personal_trainer_assignment(assignment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE PersonalTrainingAssignment SET trainer_id = %s, member_id = %s, speciality = %s, start_date = %s, status = %s WHERE assignment_id = %s;",
            (data["trainer_id"], data["member_id"], data["speciality"], data["start_date"], data["status"], assignment_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"PersonalTrainingAssignment {assignment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_personal_training_assignments_cache()
    return jsonify({"message": f"Personal trainer assignment {assignment_id} updated"}), 200

@app.route("/classbookings")
@token_required
@cache_response("class_bookings:all")
def get_class_bookings():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT booking_id, member_id, class_id, booking_date, cancel_date, status FROM classbooking;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    bookings = []
    for row in rows:
        bookings.append({
            "booking_id": row[0],
            "member_id": row[1],
            "class_id": row[2],
            "booking_date": row[3],
            "cancel_date": row[4],
            "status": row[5]
        })

    return jsonify(bookings)

@app.route("/classbookings", methods=["POST"])
@token_required
def create_class_booking():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["member_id", "class_id", "booking_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO ClassBooking (member_id, class_id, booking_date, cancel_date, status) VALUES(%s,%s, %s, %s, %s) RETURNING booking_id;",
            (data["member_id"], data["class_id"], data["booking_date"], data.get("cancel_date"), data["status"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_class_bookings_cache()
    return jsonify({"message": "Class booking created", "booking_id": new_id}), 201

@app.route("/classbookings/<int:booking_id>", methods=["DELETE"])
@token_required
def delete_class_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM ClassBooking WHERE booking_id = %s;", (booking_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"ClassBooking {booking_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_class_bookings_cache()
    return jsonify({"message": f"Class booking {booking_id} deleted"}), 200

@app.route("/classbookings/<int:booking_id>", methods=["PUT"])
@token_required
def update_class_booking(booking_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE ClassBooking SET member_id = %s, class_id = %s, booking_date = %s, cancel_date = %s, status = %s WHERE booking_id = %s;",
            (data["member_id"], data["class_id"], data["booking_date"], data.get("cancel_date"), data["status"], booking_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"ClassBooking {booking_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_class_bookings_cache()
    return jsonify({"message": f"Class booking {booking_id} updated"}), 200

@app.route("/classes")
@token_required
@cache_response("classes:all")
def get_classes():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT class_id, trainer_id, branch_id, class_name, schedule_time, duration_minutes, capacity FROM class;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    classes = []
    for row in rows:
        classes.append({
            "class_id": row[0],
            "trainer_id": row[1],
            "branch_id": row[2],
            "class_name": row[3],
            "schedule_time": row[4],
            "duration_minutes": row[5],
            "capacity": row[6]
        })

    return jsonify(classes)

@app.route("/classes", methods=["POST"])
@token_required
def create_class():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "branch_id", "class_name", "schedule_time", "duration_minutes", "capacity"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Class (trainer_id, branch_id, class_name, schedule_time, duration_minutes, capacity) VALUES(%s, %s, %s, %s, %s, %s) RETURNING class_id;",
            (data["trainer_id"], data["branch_id"], data["class_name"], data["schedule_time"], data["duration_minutes"], data["capacity"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_classes_cache()
    return jsonify({"message": "Class created", "class_id": new_id}), 201

@app.route("/classes/<int:class_id>", methods=["DELETE"])
@token_required
def delete_class(class_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Class WHERE class_id = %s;", (class_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Class {class_id} not found"}), 404
        conn.commit()
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "This class cannot be deleted while bookings still reference it."}), 409
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_classes_cache()
    return jsonify({"message": f"Class {class_id} deleted"}), 200

@app.route("/classes/<int:class_id>", methods=["PUT"])
@token_required
def update_class(class_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Class SET trainer_id = %s, branch_id = %s, class_name = %s, schedule_time = %s, duration_minutes = %s, capacity = %s WHERE class_id = %s;",
            (data["trainer_id"], data["branch_id"], data["class_name"], data["schedule_time"], data["duration_minutes"], data["capacity"], class_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Class {class_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_classes_cache()
    return jsonify({"message": f"Class {class_id} updated"}), 200

@app.route("/payments")
@token_required
@cache_response("payments:all")
def get_payments():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT payment_id, membership_id, amount, payment_date, payment_method FROM payment;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    payments = []
    for row in rows:
        payments.append({
            "payment_id": row[0],
            "membership_id": row[1],
            "amount": row[2],
            "payment_date": row[3],
            "payment_method": row[4]
        })

    return jsonify(payments)

@app.route("/payments", methods=["POST"])
@token_required
def create_payment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["membership_id", "amount", "payment_date", "payment_method"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if data.get("renewal"):
            cursor.execute(
                "SELECT membership_id FROM Membership WHERE membership_id = %s AND status IN ('active', 'expired') FOR UPDATE;",
                (data["membership_id"],)
            )
            if not cursor.fetchone():
                conn.rollback()
                return jsonify({"error": "Membership cannot be renewed"}), 404

        cursor.execute(
            "INSERT INTO Payment (membership_id, amount, payment_date, payment_method) VALUES(%s, %s, %s, %s) RETURNING payment_id;",
            (data["membership_id"], data["amount"], data["payment_date"], data["payment_method"])
        )
        new_id = cursor.fetchone()[0]
        if data.get("renewal"):
            cursor.execute(
                "UPDATE Membership SET end_date = GREATEST(end_date, CURRENT_DATE) + 30, status = 'active' WHERE membership_id = %s;",
                (data["membership_id"],)
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    if data.get("renewal"):
        invalidate_memberships_cache()
    else:
        invalidate_payments_cache()

    return jsonify({"message": "Payment created", "payment_id": new_id}), 201

@app.route("/payments/<int:payment_id>", methods=["DELETE"])
@token_required
def delete_payment(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Payment WHERE payment_id = %s;", (payment_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Payment {payment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_payments_cache()
    return jsonify({"message": f"Payment {payment_id} deleted"}), 200

@app.route("/payments/<int:payment_id>", methods=["PUT"])
@token_required
def update_payment(payment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Payment SET membership_id = %s, amount = %s, payment_date = %s, payment_method = %s WHERE payment_id = %s;",
            (data["membership_id"], data["amount"], data["payment_date"], data["payment_method"], payment_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Payment {payment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_payments_cache()
    return jsonify({"message": f"Payment {payment_id} updated"}), 200

@app.route("/equipment")
@token_required
@cache_response("equipment:all")
def get_equipment():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT equipment_id, branch_id, name, quantity, condition FROM equipment;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    equipment_list = []
    for row in rows:
        equipment_list.append({
            "equipment_id": row[0],
            "branch_id": row[1],
            "name": row[2],
            "quantity": row[3],
            "condition": row[4]
        })

    return jsonify(equipment_list)

@app.route("/equipment", methods=["POST"])
@token_required
def create_equipment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["branch_id", "name", "quantity", "condition"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Equipment (branch_id, name, quantity, condition) VALUES(%s, %s, %s, %s) RETURNING equipment_id;",
            (data["branch_id"], data["name"], data["quantity"], data["condition"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_equipment_cache()
    return jsonify({"message": "Equipment created", "equipment_id": new_id}), 201

@app.route("/equipment/<int:equipment_id>", methods=["DELETE"])
@token_required
def delete_equipment(equipment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Equipment WHERE equipment_id = %s;", (equipment_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Equipment {equipment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_equipment_cache()
    return jsonify({"message": f"Equipment {equipment_id} deleted"}), 200

@app.route("/equipment/<int:equipment_id>", methods=["PUT"])
@token_required
def update_equipment(equipment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Equipment SET branch_id = %s, name = %s, quantity = %s, condition = %s WHERE equipment_id = %s;",
            (data["branch_id"], data["name"], data["quantity"], data["condition"], equipment_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"Equipment {equipment_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_equipment_cache()
    return jsonify({"message": f"Equipment {equipment_id} updated"}), 200

@app.route("/trainerbranch")
@token_required
@cache_response("trainer_branches:all")
def get_trainer_branch():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT trainer_id,branch_id FROM trainerbranch;")
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    trainer_branch = []
    for row in rows:
        trainer_branch.append({
            "trainer_id": row[0],
            "branch_id": row[1]
        })

    return jsonify(trainer_branch)

@app.route("/trainerbranch", methods=["POST"])
@token_required
def create_trainer_branch():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "branch_id"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO TrainerBranch (trainer_id,branch_id) VALUES(%s, %s);",
            (data["trainer_id"], data["branch_id"])
        )
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "This trainer is already linked to that branch."}), 409
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "Select an existing trainer and branch."}), 404
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainer_branches_cache()
    return jsonify({"message": "Trainer-Branch relationship created"}), 201

@app.route("/trainerbranch/<int:trainer_id>/<int:branch_id>", methods=["PUT"])
@token_required
def update_trainer_branch(trainer_id, branch_id):
    data = request.get_json(silent=True) or {}
    if not data.get("trainer_id") or not data.get("branch_id"):
        return jsonify({"error": "Both trainer_id and branch_id are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE TrainerBranch SET trainer_id = %s, branch_id = %s WHERE trainer_id = %s AND branch_id = %s;",
            (data["trainer_id"], data["branch_id"], trainer_id, branch_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Trainer branch link not found."}), 404
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "This trainer is already linked to that branch."}), 409
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "Select an existing trainer and branch."}), 404
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainer_branches_cache()
    return jsonify({"message": "Trainer-Branch relationship updated"}), 200

@app.route("/trainerbranch/<int:trainer_id>/<int:branch_id>", methods=["DELETE"])
@token_required
def delete_trainer_branch(trainer_id, branch_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM TrainerBranch WHERE trainer_id = %s AND branch_id = %s;", (trainer_id, branch_id))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"TrainerBranch trainer_id {trainer_id} branch_id {branch_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_trainer_branches_cache()
    return jsonify({"message": f"Trainer-Branch relationship deleted for trainer {trainer_id} and branch {branch_id}"}), 200

@app.route("/memberships")
@token_required
@cache_response("memberships:all")
def get_memberships():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                m.membership_id,
                m.member_id,
                mem.name AS member_name,
                m.plan_id,
                mp.plan_name,
                mp.price,
                m.start_date,
                m.end_date,
                m.status
            FROM membership m
            JOIN member mem
                ON m.member_id = mem.member_id
            JOIN membershipplan mp
                ON m.plan_id = mp.plan_id
            ORDER BY m.membership_id;
        """)

        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    memberships = []

    for row in rows:
        memberships.append({
            "membership_id": row[0],
            "member_id": row[1],
            "member_name": row[2],
            "plan_id": row[3],
            "plan_name": row[4],
            "price": row[5],
            "start_date": row[6],
            "end_date": row[7],
            "status": row[8]
        })

    return jsonify(memberships)

@app.route("/membershipplans")
@token_required
@cache_response("membership_plans:all")
def get_membership_plans():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT plan_id, plan_name, price, perks
            FROM membershipplan;
        """)

        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    plans = []

    for row in rows:
        plans.append({
            "plan_id": row[0],
            "plan_name": row[1],
            "price": row[2],
            "perks": row[3]
        })

    return jsonify(plans)


def _analytics_period():
    today = datetime.date.today()
    period = request.args.get("range", "6m")
    if period in ("this_month", "month"):
        start = today.replace(day=1)
        end = today + datetime.timedelta(days=1)
    elif period == "last_month":
        end = today.replace(day=1)
        start = (end - datetime.timedelta(days=1)).replace(day=1)
    elif period in ("3m", "6m", "12m"):
        months = int(period[:-1])
        end = today + datetime.timedelta(days=1)
        month_index = today.year * 12 + today.month - 1 - (months - 1)
        start = datetime.date(month_index // 12, month_index % 12 + 1, 1)
    elif period == "this_year":
        start = today.replace(month=1, day=1)
        end = today + datetime.timedelta(days=1)
    elif period == "custom":
        try:
            start = datetime.date.fromisoformat(request.args["start_date"])
            end = datetime.date.fromisoformat(request.args["end_date"]) + datetime.timedelta(days=1)
        except (KeyError, ValueError):
            raise ValueError("Custom ranges require valid start_date and end_date values.")
        if end <= start:
            raise ValueError("end_date must be on or after start_date.")
    else:
        raise ValueError("range must be this_month, last_month, 3m, 6m, 12m, this_year, or custom.")

    previous_start = start - (end - start)
    return start, end, previous_start


def _analytics_cache_key(metric):
    gym_id = get_authenticated_gym_id()
    try:
        version = redis_client.get(f"analytics:version:{gym_id}") or "0"
    except redis.RedisError:
        version = "uncached"
    filters = "&".join(f"{key}={value}" for key, value in sorted(request.args.items()))
    return f"analytics:v1:{gym_id}:{version}:{metric}:{filters}"


def _analytics_connection():
    conn = get_db_connection()
    try:
        gym_id = get_authenticated_gym_id(conn)
        if not gym_id:
            conn.close()
            return None, None
        return conn, gym_id
    except Exception:
        conn.close()
        raise


@app.route("/analytics/overview")
@token_required
@cache_response(lambda: _analytics_cache_key("overview"))
def analytics_overview():
    try:
        start, end, previous_start = _analytics_period()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    cursor = conn.cursor()
    try:
        today = datetime.date.today()
        month_start = today.replace(day=1)
        previous_month_start = (month_start - datetime.timedelta(days=1)).replace(day=1)
        cursor.execute("""
            WITH latest AS (
                SELECT DISTINCT ON (ms.member_id) ms.member_id, ms.status, ms.end_date
                FROM membership ms
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch b ON b.branch_id = m.branch_id
                WHERE b.gym_id = %s
                ORDER BY ms.member_id, ms.end_date DESC, ms.membership_id DESC
            )
            SELECT COUNT(*),
                   COUNT(*) FILTER (WHERE l.status = 'active' AND l.end_date >= CURRENT_DATE),
                   COUNT(*) FILTER (WHERE l.status = 'expired' OR (l.end_date < CURRENT_DATE AND l.status <> 'cancelled')),
                   COUNT(*) FILTER (WHERE l.status = 'cancelled'),
                   COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s),
                   COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s),
                   COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s),
                   COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s)
            FROM member m
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            LEFT JOIN latest l ON l.member_id = m.member_id;
        """, (gym_id, start, end, previous_start, start, month_start, today + datetime.timedelta(days=1),
              previous_month_start, month_start, gym_id))
        total, active, expired, cancelled, new_members, previous_new, new_this_month, new_previous_month = cursor.fetchone()
        cursor.execute("""
            SELECT COALESCE(SUM(p.amount), 0),
                   COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0),
                   COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0),
                   COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0),
                   COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0)
        FROM payment p
        JOIN membership ms ON ms.membership_id = p.membership_id
        JOIN member m ON m.member_id = ms.member_id
        JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s;
    """, (start, end, previous_start, start, month_start, today + datetime.timedelta(days=1),
          previous_month_start, month_start, gym_id))
        lifetime_revenue, revenue, previous_revenue, revenue_this_month, revenue_previous_month = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    growth = new_members - previous_new
    return jsonify({
        "range": {"start_date": start.isoformat(), "end_date": (end - datetime.timedelta(days=1)).isoformat()},
        "total_members": total,
        "active_members": active,
        "new_members": new_members,
        "new_members_previous_period": previous_new,
        "member_growth": growth,
        "member_growth_percent": round(growth * 100 / previous_new, 1) if previous_new else None,
        "new_members_this_month": new_this_month,
        "new_members_previous_month": new_previous_month,
        "member_growth_vs_previous_month": new_this_month - new_previous_month,
        "member_growth_vs_previous_month_percent": round((new_this_month - new_previous_month) * 100 / new_previous_month, 1) if new_previous_month else None,
        "expired_memberships": expired,
        "cancelled_memberships": cancelled,
        "total_recorded_revenue": float(lifetime_revenue or 0),
        "revenue_this_month": float(revenue_this_month or 0),
        "revenue_previous_month": float(revenue_previous_month or 0),
        "revenue": float(revenue or 0),
        "revenue_previous_period": float(previous_revenue or 0),
        "revenue_change": float((revenue or 0) - (previous_revenue or 0)),
        "revenue_change_percent": round(float((revenue - previous_revenue) * 100 / previous_revenue), 1) if previous_revenue else None,
        "renewals": None,
        "renewal_rate": None,
        "members_lost": None,
        "churn_rate": None,
        "unavailable_metrics": {
            "renewals": "Renewal payments extend a membership row in place, and the payment table does not record whether a payment was a renewal.",
            "retention_and_churn": "There is no membership lifecycle history or voluntary cancellation event. Expiration does not establish that a member quit."
        }
    })


@app.route("/analytics/retention")
@token_required
@cache_response(lambda: _analytics_cache_key("retention"))
def analytics_retention():
    try:
        start, end, _ = _analytics_period()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    cursor = conn.cursor()
    try:
        cursor.execute("""
            WITH latest AS (
                SELECT DISTINCT ON (ms.member_id) ms.member_id, ms.status, ms.end_date
                FROM membership ms
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch b ON b.branch_id = m.branch_id
                WHERE b.gym_id = %s
                ORDER BY ms.member_id, ms.end_date DESC, ms.membership_id DESC
            )
            SELECT COUNT(*) FILTER (WHERE l.status = 'active' AND l.end_date >= CURRENT_DATE),
                   COUNT(*) FILTER (WHERE l.status = 'expired' OR (l.end_date < CURRENT_DATE AND l.status <> 'cancelled')),
                   COUNT(*) FILTER (WHERE l.status = 'cancelled'),
                   COUNT(*) FILTER (WHERE l.member_id IS NULL),
                   COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s)
            FROM member m
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            LEFT JOIN latest l ON l.member_id = m.member_id;
        """, (gym_id, start, end, gym_id))
        active, expired, cancelled, no_membership, new_members = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    return jsonify({
        "current_active_memberships": active,
        "current_expired_memberships": expired,
        "explicitly_cancelled_memberships": cancelled,
        "members_without_membership_record": no_membership,
        "new_members_in_period": new_members,
        "renewed_memberships": None,
        "members_lost": None,
        "retention_rate": None,
        "churn_rate": None,
        "unavailable_reason": "Membership renewals update end_date in place; there is no lifecycle history or voluntary quit event. Historical continuation, renewal, retention, and churn cannot be reconstructed."
    })


@app.route("/analytics/financial")
@token_required
@cache_response(lambda: _analytics_cache_key("financial"))
def analytics_financial():
    try:
        start, end, previous_start = _analytics_period()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    cursor = conn.cursor()
    try:
        today = datetime.date.today()
        month_start = today.replace(day=1)
        previous_month_start = (month_start - datetime.timedelta(days=1)).replace(day=1)
        cursor.execute("""
            SELECT COALESCE(SUM(p.amount), 0), COUNT(DISTINCT m.member_id)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE p.payment_date >= %s AND p.payment_date < %s;
        """, (gym_id, start, end))
        revenue, paying_members = cursor.fetchone()
        cursor.execute("""
            SELECT COALESCE(SUM(p.amount), 0), COUNT(DISTINCT m.member_id)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE p.payment_date >= %s AND p.payment_date < %s;
        """, (gym_id, previous_start, start))
        previous_revenue = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0),
                   COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= %s AND p.payment_date < %s), 0)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE p.payment_date >= %s AND p.payment_date < %s;
        """, (month_start, today + datetime.timedelta(days=1), previous_month_start, month_start,
              gym_id, previous_month_start, today + datetime.timedelta(days=1)))
        revenue_this_month, revenue_previous_month = cursor.fetchone()
        grain = "day" if (end - start).days <= 45 else "month"
        date_format = "YYYY-MM-DD" if grain == "day" else "YYYY-MM"
        cursor.execute("""
            WITH buckets AS (
                SELECT generate_series(date_trunc(%s, %s::timestamp),
                                       date_trunc(%s, (%s::date - 1)),
                                       CASE WHEN %s = 'day' THEN interval '1 day' ELSE interval '1 month' END) AS bucket
            ), totals AS (
                SELECT date_trunc(%s, p.payment_date) AS bucket, SUM(p.amount) AS revenue
                FROM payment p
                JOIN membership ms ON ms.membership_id = p.membership_id
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
                WHERE p.payment_date >= %s AND p.payment_date < %s
                GROUP BY date_trunc(%s, p.payment_date)
            )
            SELECT to_char(b.bucket, %s), COALESCE(t.revenue, 0)
            FROM buckets b LEFT JOIN totals t ON t.bucket = b.bucket
            ORDER BY b.bucket;
        """, (grain, start, grain, end, grain, grain, gym_id, start, end, grain, date_format))
        trend = [{"label": row[0], "revenue": float(row[1] or 0)} for row in cursor.fetchall()]
        cursor.execute("""
            SELECT mp.plan_name, COALESCE(SUM(p.amount), 0)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN membershipplan mp ON mp.plan_id = ms.plan_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE p.payment_date >= %s AND p.payment_date < %s
            GROUP BY mp.plan_id, mp.plan_name ORDER BY SUM(p.amount) DESC;
        """, (gym_id, start, end))
        by_plan = [{"label": row[0], "revenue": float(row[1] or 0)} for row in cursor.fetchall()]
        cursor.execute("""
            SELECT b.name, COALESCE(SUM(p.amount), 0)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE p.payment_date >= %s AND p.payment_date < %s
            GROUP BY b.branch_id, b.name ORDER BY SUM(p.amount) DESC;
        """, (gym_id, start, end))
        by_branch = [{"label": row[0], "revenue": float(row[1] or 0)} for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()
    return jsonify({
        "range": {"start_date": start.isoformat(), "end_date": (end - datetime.timedelta(days=1)).isoformat()},
        "revenue": float(revenue or 0), "previous_period_revenue": float(previous_revenue or 0),
        "revenue_this_month": float(revenue_this_month or 0),
        "revenue_previous_month": float(revenue_previous_month or 0),
        "paying_members": paying_members,
        "average_revenue_per_paying_member": round(float(revenue or 0) / paying_members, 2) if paying_members else 0,
        "trend": trend, "revenue_by_plan": by_plan, "revenue_by_branch": by_branch,
        "revenue_from_new_memberships": None, "revenue_from_renewals": None,
        "outstanding_payments": None,
        "unavailable_metrics": {
            "payment_type": "Payments do not identify new memberships versus renewals.",
            "outstanding_payments": "The payment table has no unpaid balance or payment status field. Recorded payment rows are the only measurable revenue.",
            "historical_branch_and_plan_attribution": "Payments link to a membership, but do not store the branch or plan at payment time. Breakdown uses the member's current branch and membership's current plan."
        }
    })


@app.route("/analytics/memberships")
@token_required
@cache_response(lambda: _analytics_cache_key("memberships"))
def analytics_memberships():
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    cursor = conn.cursor()
    try:
        cursor.execute("""
            WITH latest AS (
                SELECT DISTINCT ON (ms.member_id) ms.membership_id, ms.member_id, ms.plan_id,
                       ms.start_date, ms.end_date, ms.status
                FROM membership ms
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch b ON b.branch_id = m.branch_id
                WHERE b.gym_id = %s
                ORDER BY ms.member_id, ms.end_date DESC, ms.membership_id DESC
            )
            SELECT mp.plan_id, mp.plan_name,
                   COUNT(l.membership_id) FILTER (WHERE l.status = 'active' AND l.end_date >= CURRENT_DATE),
                   COUNT(l.membership_id) FILTER (WHERE l.status = 'expired' OR (l.end_date < CURRENT_DATE AND l.status <> 'cancelled')),
                   COUNT(l.membership_id) FILTER (WHERE l.end_date >= CURRENT_DATE AND l.end_date < CURRENT_DATE + 8),
                   AVG(l.end_date - l.start_date)
            FROM latest l JOIN membershipplan mp ON mp.plan_id = l.plan_id
            GROUP BY mp.plan_id, mp.plan_name ORDER BY mp.plan_name;
        """, (gym_id,))
        plans = [{"plan_id": row[0], "plan_name": row[1], "active": row[2] or 0,
                  "expired": row[3] or 0, "expiring_soon": row[4] or 0,
                  "average_recorded_term_days": round(float(row[5]), 1) if row[5] is not None else None}
                 for row in cursor.fetchall()]
        cursor.execute("""
            SELECT mp.plan_id, COALESCE(SUM(p.amount), 0)
            FROM payment p
            JOIN membership ms ON ms.membership_id = p.membership_id
            JOIN membershipplan mp ON mp.plan_id = ms.plan_id
            JOIN member m ON m.member_id = ms.member_id
            JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            GROUP BY mp.plan_id;
        """, (gym_id,))
        revenue = {row[0]: float(row[1] or 0) for row in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()
    for plan in plans:
        plan["recorded_revenue"] = revenue.get(plan["plan_id"], 0)
    ranked = sorted(plans, key=lambda plan: (plan["active"], plan["plan_name"].lower()))
    return jsonify({
        "plans": plans,
        "most_popular_plan": next((plan["plan_name"] for plan in reversed(ranked) if plan["active"]), None),
        "least_popular_plan": next((plan["plan_name"] for plan in ranked if plan["active"]), None),
        "renewal_rate_by_plan": None,
        "unavailable_reason": "Membership history is overwritten during renewals, so a renewal rate by plan cannot be calculated. Average duration reflects the currently recorded term, which may have been extended. Recorded revenue uses the membership's current plan. MembershipPlan has no gym_id, so only plans used by this gym's current memberships are included."
    })


@app.route("/analytics/growth")
@token_required
@cache_response(lambda: _analytics_cache_key("growth"))
def analytics_growth():
    try:
        start, end, _ = _analytics_period()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    grain = "day" if (end - start).days <= 45 else "month"
    fmt = "YYYY-MM-DD" if grain == "day" else "YYYY-MM"
    cursor = conn.cursor()
    try:
        cursor.execute("""
            WITH buckets AS (
                SELECT generate_series(date_trunc(%s, %s::timestamp),
                                       date_trunc(%s, (%s::date - 1)),
                                       CASE WHEN %s = 'day' THEN interval '1 day' ELSE interval '1 month' END) AS bucket
            )
            SELECT to_char(b.bucket, %s), COUNT(m.member_id)
            FROM buckets b
            LEFT JOIN member m ON date_trunc(%s, m.join_date::timestamp) = b.bucket
            LEFT JOIN branch br ON br.branch_id = m.branch_id AND br.gym_id = %s
            WHERE m.member_id IS NULL OR br.branch_id IS NOT NULL
            GROUP BY b.bucket ORDER BY b.bucket;
        """, (grain, start, grain, end, grain, fmt, grain, gym_id))
        new_members = [{"label": row[0], "count": row[1]} for row in cursor.fetchall()]
        cursor.execute("""
            SELECT COUNT(*) FROM member m JOIN branch b ON b.branch_id = m.branch_id AND b.gym_id = %s
            WHERE m.join_date < %s;
        """, (gym_id, start))
        current_records_before_period = cursor.fetchone()[0]
    finally:
        cursor.close()
        conn.close()
    return jsonify({
        "new_members": new_members,
        "members_present_before_period_in_current_records": current_records_before_period,
        "active_members_over_time": None,
        "returning_members_over_time": None,
        "unavailable_reason": "The schema stores a member's current join date and current membership dates/status, without change history. It cannot reconstruct historical active-member snapshots or distinguish returning members from renewal events."
    })


@app.route("/analytics/branches")
@token_required
@cache_response(lambda: _analytics_cache_key("branches"))
def analytics_branches():
    try:
        start, end, _ = _analytics_period()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    conn, gym_id = _analytics_connection()
    if not conn:
        return jsonify({"error": "Authenticated gym not found."}), 403
    cursor = conn.cursor()
    try:
        cursor.execute("""
            WITH latest AS (
                SELECT DISTINCT ON (ms.member_id) ms.member_id, ms.status, ms.end_date
                FROM membership ms
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch br ON br.branch_id = m.branch_id AND br.gym_id = %s
                ORDER BY ms.member_id, ms.end_date DESC, ms.membership_id DESC
            ), member_totals AS (
                SELECT m.branch_id, COUNT(*) AS total_members,
                       COUNT(*) FILTER (WHERE m.join_date >= %s AND m.join_date < %s) AS new_members,
                       COUNT(*) FILTER (WHERE l.status = 'active' AND l.end_date >= CURRENT_DATE) AS active_members
                FROM member m JOIN branch br ON br.branch_id = m.branch_id AND br.gym_id = %s
                LEFT JOIN latest l ON l.member_id = m.member_id
                GROUP BY m.branch_id
            ), revenue AS (
                SELECT m.branch_id, SUM(p.amount) AS recorded_revenue
                FROM payment p
                JOIN membership ms ON ms.membership_id = p.membership_id
                JOIN member m ON m.member_id = ms.member_id
                JOIN branch br ON br.branch_id = m.branch_id AND br.gym_id = %s
                WHERE p.payment_date >= %s AND p.payment_date < %s
                GROUP BY m.branch_id
            )
            SELECT br.branch_id, br.name, COALESCE(mt.total_members, 0),
                   COALESCE(mt.active_members, 0), COALESCE(mt.new_members, 0),
                   COALESCE(r.recorded_revenue, 0)
            FROM branch br LEFT JOIN member_totals mt ON mt.branch_id = br.branch_id
            LEFT JOIN revenue r ON r.branch_id = br.branch_id
            WHERE br.gym_id = %s ORDER BY br.name;
        """, (gym_id, start, end, gym_id, gym_id, start, end, gym_id))
        branches = [{"branch_id": row[0], "branch_name": row[1], "total_members": row[2],
                     "active_members": row[3], "new_members": row[4], "recorded_revenue": float(row[5] or 0),
                     "renewal_rate": None} for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()
    return jsonify({"branches": branches, "unavailable_reason": "Branch renewal and retention rates require membership lifecycle history, which is not stored. Revenue is attributed using each member's current branch because payments do not store a branch at payment time."})

@app.route("/membershipplans", methods=["POST"])
@token_required
def create_membership_plan():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["plan_name", "price", "perks"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO MembershipPlan (plan_name, price, perks) VALUES (%s, %s, %s) RETURNING plan_id;",
            (data["plan_name"], data["price"], data["perks"])
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_membership_plans_cache()
    return jsonify({"message": "Membership plan created", "plan_id": new_id}), 201


@app.route("/membershipplans/<int:plan_id>", methods=["DELETE"])
@token_required
def delete_membership_plan(plan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM MembershipPlan WHERE plan_id = %s;", (plan_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"MembershipPlan {plan_id} not found"}), 404
        conn.commit()
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "This plan cannot be deleted while memberships still use it."}), 409
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_membership_plans_cache()
    return jsonify({"message": f"MembershipPlan {plan_id} deleted"}), 200


@app.route("/membershipplans/<int:plan_id>", methods=["PUT"])
@token_required
def update_membership_plan(plan_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE MembershipPlan SET plan_name = %s, price = %s, perks = %s WHERE plan_id = %s;",
            (data["plan_name"], data["price"], data["perks"], plan_id)
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": f"MembershipPlan {plan_id} not found"}), 404
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_membership_plans_cache()
    return jsonify({"message": f"MembershipPlan {plan_id} updated"}), 200

@app.route("/admins")
@token_required
@cache_response("admins:all")
def get_admins():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT admin_id, name, email, phone
            FROM Admin
            ORDER BY admin_id ASC;
        """)

        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    admins = []

    for row in rows:
        admins.append({
            "admin_id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3]
        })

    return jsonify(admins)


@app.route("/admins", methods=["POST"])
@token_required
@super_admin_required
def create_admin():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "email", "phone", "password"]

    missing = [
        field for field in required_fields
        if field not in data or not str(data[field]).strip()
    ]

    if missing:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    password_hash = generate_password_hash(data["password"])

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO Admin
            (name, email, phone, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING admin_id;
            """,
            (
                data["name"],
                data["email"],
                data["phone"],
                password_hash
            )
        )

        new_id = cursor.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_admins_cache()
    return jsonify({
        "message": "Admin created",
        "admin_id": new_id
    }), 201


@app.route("/admins/<int:admin_id>", methods=["PUT"])
@token_required
@super_admin_required
def update_admin(admin_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "email", "phone"]

    missing = [
        field
        for field in required_fields
        if field not in data or not str(data[field]).strip()
    ]

    if missing:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if data.get("password"):
            password_hash = generate_password_hash(data["password"])

            cursor.execute(
                """
                UPDATE Admin
                SET name = %s,
                    email = %s,
                    phone = %s,
                    password_hash = %s
                WHERE admin_id = %s;
                """,
                (
                    data["name"],
                    data["email"],
                    data["phone"],
                    password_hash,
                    admin_id
                )
            )

        else:
            cursor.execute(
                """
                UPDATE Admin
                SET name = %s,
                    email = %s,
                    phone = %s
                WHERE admin_id = %s;
                """,
                (
                    data["name"],
                    data["email"],
                    data["phone"],
                    admin_id
                )
            )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({
                "error": f"Admin {admin_id} not found"
            }), 404

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_admins_cache()
    return jsonify({
        "message": f"Admin {admin_id} updated"
    }), 200


@app.route("/admins/<int:admin_id>", methods=["DELETE"])
@token_required
def delete_admin(admin_id):
    current_admin_id = request.decoded_token.get("admin_id")

    # Only the Super Admin can delete administrators
    if current_admin_id != 1:
        return jsonify({
            "error": "Only the Super Admin can delete administrators"
        }), 403

    # Super Admin cannot delete themselves
    if admin_id == current_admin_id:
        return jsonify({
            "error": "The Super Admin cannot delete their own account"
        }), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Make sure the admin exists
        cursor.execute(
            "SELECT admin_id FROM Admin WHERE admin_id = %s;",
            (admin_id,)
        )

        admin = cursor.fetchone()

        if admin is None:
            return jsonify({
                "error": f"Admin {admin_id} not found"
            }), 404

        # Make sure at least one admin remains
        cursor.execute("SELECT COUNT(*) FROM Admin;")
        admin_count = cursor.fetchone()[0]

        if admin_count <= 1:
            return jsonify({
                "error": "At least one administrator must remain"
            }), 400

        cursor.execute(
            "DELETE FROM Admin WHERE admin_id = %s;",
            (admin_id,)
        )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    invalidate_admins_cache()

    return jsonify({
        "message": f"Admin {admin_id} deleted"
    }), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["email", "password"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT admin_id, name, password_hash, gym_id FROM Admin WHERE email = %s;", (data["email"],))
        row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if row is None:
        return jsonify({"error": "Invalid email or password"}), 401

    admin_id, name, password_hash, gym_id = row

    if not check_password_hash(password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    issued_at = datetime.datetime.now(datetime.timezone.utc)
    token = jwt.encode(
        {
            "admin_id": admin_id,
            "role": "admin",
            "gym_id": gym_id,
            "iat": issued_at.timestamp(),
            "exp": issued_at + datetime.timedelta(hours=8)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    return jsonify({"message": "Login successful", "token": token, "name": name, "gym_id": gym_id}), 200


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0")
