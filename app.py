from flask import Flask, jsonify, request
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask import send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from flask import request

load_dotenv()

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
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
CORS(app, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.4:5173",
    "http://192.168.1.3:5173",
    "http://192.168.1.7:5173",
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

        request.decoded_token = decoded
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

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT gym_id FROM Admin WHERE admin_id = %s;", (admin_id,))
        row = cursor.fetchone()
        cursor.close()
        if row and row[0] is not None:
            return row[0]
        return None
    finally:
        if should_close:
            conn.close()

REQUEST_BODY_JSON_ERROR = "Request body must be valid JSON"

@app.route("/gym", methods=["GET"])
@token_required
def get_gym():
    try:
        conn = get_db_connection()
        gym_id = get_authenticated_gym_id(conn)
        if not gym_id:
            conn.close()
            return jsonify({"error": "Gym not found"}), 404

        cursor = conn.cursor()
        cursor.execute(
            "SELECT gym_id, name, phone, email, address, currency, logo_url, created_at FROM gym WHERE gym_id = %s;",
            (gym_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()

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

@app.route("/gym", methods=["PUT"])
@token_required
def update_gym():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    if "name" in data and (data["name"] is None or not str(data["name"]).strip()):
        return jsonify({"error": "Gym name cannot be empty"}), 400

    try:
        conn = get_db_connection()
        gym_id = get_authenticated_gym_id(conn)
        if not gym_id:
            conn.close()
            return jsonify({"error": "Gym not found"}), 404

        cursor = conn.cursor()
        cursor.execute(
            "SELECT gym_id, name, phone, email, address, currency, logo_url, created_at FROM gym WHERE gym_id = %s;",
            (gym_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
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
        cursor.close()
        conn.close()

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
        return jsonify({"error": "Failed to update gym details"}), 500

@app.route("/uploads/<filename>")
def get_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/")
def home():
    return "Gym Management System backend is running!"

@app.route("/db-check", methods=["GET"])
def db_check():
    conn = get_db_connection()
    cursor = conn.cursor()

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

    cursor.close()
    conn.close()

    return jsonify({
        "database": db_name,
        "schema": schema,
        "admin_has_gym_id": gym_column is not None
    })

@app.route("/branches")
def get_branches():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT branch_id, name, address, phone, city FROM branch;")
    rows = cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Branch (name, address, phone, city) VALUES(%s, %s, %s, %s)RETURNING branch_id;",
                   (data["name"], data["address"], data["phone"], data["city"])
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Branch created", "branch_id": new_id}), 201

@app.route("/branches/<int:branch_id>", methods=["DELETE"])
@token_required
def delete_branch(branch_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM Branch WHERE branch_id = %s;",
            (branch_id,)
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({
                "error": f"Branch {branch_id} not found"
            }), 404

        conn.commit()

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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Branch SET name = %s, address = %s, phone = %s, city=%s WHERE branch_id = %s;",
                   (data["name"], data["address"], data["phone"], data["city"], branch_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Branch {branch_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Branch {branch_id} updated"}), 200

@app.route("/members")
def get_members():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT member_id, branch_id,name, gender, phone, address, join_date, wants_trainer, photo_filename FROM member;")
    rows = cursor.fetchall()
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
            "photo_filename": row[8]
        })

    return jsonify(members)

@app.route("/members", methods=["POST"])
@token_required
def create_member():
    data=request.form

    if not data:

        return jsonify({"error": "Request body must be valid JSON"}), 400
    
    required_fields = ["branch_id", "name", "gender", "phone", "address", "join_date", "wants_trainer"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    photo_filename = None
    if "photo" in request.files:
        file = request.files["photo"]
        if file.filename != "":
            photo_filename = secure_filename(file.filename)
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], photo_filename))

    conn = get_db_connection()
    cursor= conn.cursor()
    cursor.execute(
        "INSERT INTO Member (branch_id, name, gender, phone, address, join_date, wants_trainer, photo_filename) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING member_id;",
        (data["branch_id"], data["name"], data["gender"], data["phone"], data["address"], data["join_date"], data["wants_trainer"]=="true", photo_filename)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Member created", "member_id": new_id}), 201

@app.route("/members/<int:member_id>", methods=["DELETE"])
@token_required
def delete_member(member_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Member WHERE member_id = %s;", (member_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Member {member_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Member {member_id} deleted"}), 200

@app.route("/members/<int:member_id>", methods=["PUT"])
@token_required
def update_member(member_id):
    data = request.form if request.form else request.get_json(silent=True)
    is_multipart = bool(request.form)

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = (
        ["branch_id", "name", "gender", "phone", "address", "join_date", "wants_trainer"]
        if is_multipart else ["name", "phone"]
    )
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    photo_filename = None
    if is_multipart and "photo" in request.files:
        file = request.files["photo"]
        if file.filename != "":
            photo_filename = secure_filename(file.filename)
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], photo_filename))

    conn=get_db_connection()
    cursor=conn.cursor()
    if not is_multipart:
        cursor.execute("UPDATE Member SET name = %s, phone = %s WHERE member_id = %s;",
                       (data["name"], data["phone"], member_id))
    elif photo_filename:
        cursor.execute(
            "UPDATE Member SET branch_id = %s, name = %s, gender = %s, phone = %s, address = %s, join_date = %s, wants_trainer = %s, photo_filename = %s WHERE member_id = %s;",
            (data["branch_id"], data["name"], data["gender"], data["phone"], data["address"], data["join_date"], str(data["wants_trainer"]).lower() == "true", photo_filename, member_id)
        )
    else:
        cursor.execute(
            "UPDATE Member SET branch_id = %s, name = %s, gender = %s, phone = %s, address = %s, join_date = %s, wants_trainer = %s WHERE member_id = %s;",
            (data["branch_id"], data["name"], data["gender"], data["phone"], data["address"], data["join_date"], str(data["wants_trainer"]).lower() == "true", member_id)
        )

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Member {member_id} not found"}), 404

    conn.commit()

    cursor.execute("SELECT member_id, branch_id, name, gender, phone, address, join_date, wants_trainer, photo_filename FROM member WHERE member_id = %s;", (member_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

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
def get_trainers():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("""
    SELECT trainer_id, name, phone, email, certification
    FROM trainer
    ORDER BY trainer_id ASC;
    """)
    rows = cursor.fetchall()
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

    conn =get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Trainer (name, phone, email, certification) VALUES(%s, %s, %s, %s) RETURNING trainer_id;",
                  (  data["name"], data["phone"], data["email"], data["certification"])
    )

    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Trainer created", "trainer_id": new_id}), 201

@app.route("/trainers/<int:trainer_id>", methods=["DELETE"])
@token_required
def delete_trainer(trainer_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Trainer WHERE trainer_id = %s;", (trainer_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Trainer {trainer_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Trainer {trainer_id} deleted"}), 200

@app.route("/trainers/<int:trainer_id>", methods=["PUT"])
@token_required
def update_trainer(trainer_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Trainer SET name = %s, phone = %s, email = %s, certification = %s WHERE trainer_id = %s",
                 (data["name"], data["phone"], data["email"], data["certification"], trainer_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Trainer {trainer_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Trainer {trainer_id} updated"}), 200

@app.route("/memberships")
def get_memberships():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT membership_id, member_id, plan_id, start_date, end_date, status FROM membership;")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    memberships = []
    for row in rows:
        memberships.append({
            "membership_id": row[0],
            "member_id": row[1],
            "plan_id": row[2],
            "start_date": row[3],
            "end_date": row[4],
            "status": row[5]
        })

    return jsonify(memberships)

@app.route("/memberships/expiring")
def get_expiring_memberships():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT membership.membership_id, membership.member_id, member.branch_id,
               member.name, member.gender, member.phone, member.address,
               member.join_date, member.wants_trainer, member.photo_filename,
               membership.start_date, membership.end_date, membership.status
        FROM membership
        JOIN member ON membership.member_id = member.member_id
        WHERE membership.end_date <= CURRENT_DATE + INTERVAL '7 days'
        AND membership.status = 'active'
        ORDER BY membership.end_date ASC;
    """)
    rows = cursor.fetchall()
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
            "join_date": row[7],
            "wants_trainer": row[8],
            "photo_filename": row[9],
            "start_date": row[10].isoformat(),
            "end_date": row[11].isoformat(),
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Membership (member_id, plan_id, start_date, end_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING membership_id;",
                   (data["member_id"], data["plan_id"], data["start_date"], data["end_date"], data["status"] ))
    

    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Membership created", "membership_id": new_id}), 201

@app.route("/memberships/<int:membership_id>", methods=["DELETE"])
@token_required
def delete_membership(membership_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Membership WHERE membership_id = %s;", (membership_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Membership {membership_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Membership {membership_id} deleted"}), 200

@app.route("/memberships/<int:membership_id>", methods=["PUT"])
@token_required
def update_membership(membership_id):
    data=request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Membership SET member_id = %s, plan_id = %s, start_date = %s, end_date = %s, status = %s WHERE membership_id = %s;",
                   (data["member_id"], data["plan_id"], data["start_date"], data["end_date"], data["status"], membership_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Membership {membership_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Membership {membership_id} updated"}), 200

@app.route("/personaltrainingassignments")

def get_personal_trainer_assignments():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT assignment_id, trainer_id, member_id, speciality, start_date, status FROM personaltrainingassignment;")
    rows = cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO PersonalTrainingAssignment (trainer_id, member_id, speciality, start_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING assignment_id;",
                   (data["trainer_id"], data["member_id"], data["speciality"], data["start_date"], data["status"]))

    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Personal trainer assignment created", "assignment_id": new_id}), 201

@app.route("/personaltrainingassignments/<int:assignment_id>", methods=["DELETE"])
@token_required
def delete_personal_trainer_assignment(assignment_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM PersonalTrainingAssignment WHERE assignment_id = %s;", (assignment_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"PersonalTrainingAssignment {assignment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Personal trainer assignment {assignment_id} deleted"}), 200

@app.route("/personaltrainingassignments/<int:assignment_id>", methods=["PUT"])
@token_required
def update_personal_trainer_assignment(assignment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE PersonalTrainingAssignment SET trainer_id = %s, member_id = %s, speciality = %s, start_date = %s, status = %s WHERE assignment_id = %s;",
                   (data["trainer_id"], data["member_id"], data["speciality"], data["start_date"], data["status"], assignment_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"PersonalTrainingAssignment {assignment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Personal trainer assignment {assignment_id} updated"}), 200

@app.route("/classbookings")
def get_class_bookings():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT booking_id, member_id, class_id, booking_date, status FROM classbooking;")
    rows = cursor.fetchall()
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

    required_fields = ["member_id", "class_id", "booking_date", "cancel_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO ClassBooking (member_id, class_id, booking_date, cancel_date, status) VALUES(%s,%s, %s, %s, %s) RETURNING booking_id;",
                   (data["member_id"], data["class_id"], data["booking_date"], data.get("cancel_date"), data["status"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Class booking created", "booking_id": new_id}), 201

@app.route("/classbookings/<int:booking_id>", methods=["DELETE"])
@token_required
def delete_class_booking(booking_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM ClassBooking WHERE booking_id = %s;", (booking_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"ClassBooking {booking_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Class booking {booking_id} deleted"}), 200

@app.route("/classbookings/<int:booking_id>", methods=["PUT"])
@token_required
def update_class_booking(booking_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE ClassBooking SET member_id = %s, class_id = %s, booking_date = %s, cancel_date = %s, status = %s WHERE booking_id = %s;",
                   (data["member_id"], data["class_id"], data["booking_date"], data["cancel_date"], data["status"], booking_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"ClassBooking {booking_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Class booking {booking_id} updated"}), 200

@app.route("/classes")
def get_classes():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT class_id, trainer_id, branch_id, class_name, schedule_time, duration_minutes, capacity FROM class;")
    rows = cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Class (trainer_id, branch_id, class_name, schedule_time, duration_minutes, capacity) VALUES(%s, %s, %s, %s, %s, %s) RETURNING class_id;",
                   (data["trainer_id"], data["branch_id"], data["class_name"], data["schedule_time"], data["duration_minutes"], data["capacity"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Class created", "class_id": new_id}), 201

@app.route("/classes/<int:class_id>", methods=["DELETE"])
@token_required
def delete_class(class_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Class WHERE class_id = %s;", (class_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Class {class_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Class {class_id} deleted"}), 200

@app.route("/classes/<int:class_id>", methods=["PUT"])
@token_required
def update_class(class_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Class SET trainer_id = %s, branch_id = %s, class_name = %s, schedule_time = %s, duration_minutes = %s, capacity = %s WHERE class_id = %s;",
                   (data["trainer_id"], data["branch_id"], data["class_name"], data["schedule_time"], data["duration_minutes"], data["capacity"], class_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Class {class_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Class {class_id} updated"}), 200

@app.route("/payments")
def get_payments():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT payment_id, membership_id, amount, payment_date, payment_method FROM payment;")
    rows = cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Payment (membership_id, amount, payment_date, payment_method) VALUES(%s, %s, %s, %s) RETURNING payment_id;",
                   (data["membership_id"], data["amount"], data["payment_date"], data["payment_method"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Payment created", "payment_id": new_id}), 201

@app.route("/payments/<int:payment_id>", methods=["DELETE"])
@token_required
def delete_payment(payment_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Payment WHERE payment_id = %s;", (payment_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Payment {payment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Payment {payment_id} deleted"}), 200

@app.route("/payments/<int:payment_id>", methods=["PUT"])
@token_required
def update_payment(payment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Payment SET membership_id = %s, amount = %s, payment_date = %s, payment_method = %s WHERE payment_id = %s;",
                   (data["membership_id"], data["amount"], data["payment_date"], data["payment_method"], payment_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Payment {payment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Payment {payment_id} updated"}), 200

@app.route("/equipment")
def get_equipment():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT equipment_id, branch_id, name, quantity, condition FROM equipment;")
    rows = cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Equipment (branch_id, name, quantity, condition) VALUES(%s, %s, %s, %s) RETURNING equipment_id;",
                   (data["branch_id"], data["name"], data["quantity"], data["condition"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Equipment created", "equipment_id": new_id}), 201

@app.route("/equipment/<int:equipment_id>", methods=["DELETE"])
@token_required
def delete_equipment(equipment_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Equipment WHERE equipment_id = %s;", (equipment_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Equipment {equipment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Equipment {equipment_id} deleted"}), 200

@app.route("/equipment/<int:equipment_id>", methods=["PUT"])
@token_required
def update_equipment(equipment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("UPDATE Equipment SET branch_id = %s, name = %s, quantity = %s, condition = %s WHERE equipment_id = %s;",
                   (data["branch_id"], data["name"], data["quantity"], data["condition"], equipment_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Equipment {equipment_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Equipment {equipment_id} updated"}), 200

@app.route("/trainerbranch")
def get_trainer_branch():
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("SELECT trainer_id,branch_id FROM trainerbranch;")
    rows= cursor.fetchall()
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

    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("INSERT INTO TrainerBranch (trainer_id,branch_id) VALUES(%s, %s);",
                   (data["trainer_id"],data["branch_id"])
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Trainer-Branch relationship created"}), 201

@app.route("/trainerbranch/<int:trainer_id>/<int:branch_id>", methods=["DELETE"])
@token_required
def delete_trainer_branch(trainer_id, branch_id):
    conn=get_db_connection()

    cursor=conn.cursor()
    cursor.execute("DELETE FROM TrainerBranch WHERE trainer_id = %s AND branch_id = %s;", (trainer_id, branch_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"TrainerBranch trainer_id {trainer_id} branch_id {branch_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Trainer-Branch relationship deleted for trainer {trainer_id} and branch {branch_id}"}), 200

@app.route("/membershipplans")
def get_membership_plans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT plan_id, plan_name, price, perks FROM membershipplan;")
    rows = cursor.fetchall()
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
    cursor.execute(
        "INSERT INTO MembershipPlan (plan_name, price, perks) VALUES (%s, %s, %s) RETURNING plan_id;",
        (data["plan_name"], data["price"], data["perks"])
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Membership plan created", "plan_id": new_id}), 201


@app.route("/membershipplans/<int:plan_id>", methods=["DELETE"])
@token_required
def delete_membership_plan(plan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM MembershipPlan WHERE plan_id = %s;", (plan_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"MembershipPlan {plan_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"MembershipPlan {plan_id} deleted"}), 200


@app.route("/membershipplans/<int:plan_id>", methods=["PUT"])
@token_required
def update_membership_plan(plan_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE MembershipPlan SET plan_name = %s, price = %s, perks = %s WHERE plan_id = %s;",
        (data["plan_name"], data["price"], data["perks"], plan_id)
    )

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"MembershipPlan {plan_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"MembershipPlan {plan_id} updated"}), 200

@app.route("/admins", methods=["POST"])
@token_required
def create_admin():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "email", "phone", "password"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    password_hash = generate_password_hash(data["password"])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Admin (name, email, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING admin_id;",
        (data["name"], data["email"], data["phone"], password_hash)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Admin created", "admin_id": new_id}), 201

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
    cursor.execute("SELECT admin_id, name, password_hash, gym_id FROM Admin WHERE email = %s;", (data["email"],))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row is None:
        return jsonify({"error": "Invalid email or password"}), 401

    admin_id, name, password_hash, gym_id = row

    if not check_password_hash(password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {
            "admin_id": admin_id,
            "role": "admin",
            "gym_id": gym_id,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=8)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    return jsonify({"message": "Login successful", "token": token, "name": name, "gym_id": gym_id}), 200


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0")
