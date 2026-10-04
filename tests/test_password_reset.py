import datetime
import os
import unittest
from unittest.mock import patch

os.environ["JWT_SECRET"] = "password-reset-tests-only-secret-123456"

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

import app as backend


class FakeDatabase:
    def __init__(self):
        self.admin = {
            "admin_id": 1,
            "email": "admin@example.com",
            "password_hash": generate_password_hash("old-password"),
        }
        self.tokens = []
        self.next_token_id = 1


class FakeCursor:
    def __init__(self, database):
        self.database = database
        self.result = None

    def execute(self, query, params=()):
        sql = " ".join(query.lower().split())
        self.result = None
        if sql.startswith("select t.id, t.user_id, a.email"):
            token_hash = params[0]
            token = next((row for row in self.database.tokens if row["token_hash"] == token_hash), None)
            if token and token["used_at"] is None and token["expires_at"] > datetime.datetime.now(datetime.timezone.utc):
                self.result = (token["id"], token["user_id"], self.database.admin["email"])
        elif sql.startswith("update admin set password_hash"):
            self.database.admin["password_hash"] = params[0]
        elif sql.startswith("update password_reset_tokens set expires_at"):
            user_id = params[0]
            excluded_id = params[1] if len(params) > 1 else None
            for token in self.database.tokens:
                if token["user_id"] == user_id and token["id"] != excluded_id and token["used_at"] is None:
                    token["expires_at"] = datetime.datetime.now(datetime.timezone.utc)
        elif sql.startswith("update password_reset_tokens set used_at"):
            token_id = params[0]
            for token in self.database.tokens:
                if token["id"] == token_id:
                    token["used_at"] = datetime.datetime.now(datetime.timezone.utc)
        elif sql.startswith("select exists"):
            user_id = params[0]
            issued_at = params[1] if len(params) > 1 else None
            revoked = any(
                token["user_id"] == user_id
                and token["used_at"] is not None
                and (issued_at is None or token["used_at"].timestamp() >= issued_at)
                for token in self.database.tokens
            )
            self.result = (revoked,)
        elif sql.startswith("select max(used_at)"):
            user_id = params[0]
            used_at = [
                token["used_at"] for token in self.database.tokens
                if token["user_id"] == user_id and token["used_at"] is not None
            ]
            self.result = (max(used_at) if used_at else None,)

    def fetchone(self):
        return self.result

    def close(self):
        pass


class FakeConnection:
    def __init__(self, database):
        self.database = database
        self.committed = False

    def cursor(self):
        return FakeCursor(self.database)

    def commit(self):
        self.committed = True

    def rollback(self):
        pass

    def close(self):
        pass


@backend.app.get("/__test/password-reset/protected")
@backend.token_required
def _protected_test_route():
    return {"ok": True}


class PasswordResetTests(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()
        self.database = FakeDatabase()

    def add_token(self, raw_token, *, expires_at=None, used_at=None):
        token = {
            "id": self.database.next_token_id,
            "user_id": self.database.admin["admin_id"],
            "token_hash": backend.hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
            "expires_at": expires_at or datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
            "used_at": used_at,
        }
        self.database.next_token_id += 1
        self.database.tokens.append(token)
        return token

    def test_valid_reset_updates_password_and_revokes_existing_jwt(self):
        raw_token = "valid-reset-token"
        token = self.add_token(raw_token)
        issued_at = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)).timestamp()
        old_jwt = jwt.encode(
            {"admin_id": 1, "iat": issued_at, "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)},
            "password-reset-tests-only-secret-123456",
            algorithm="HS256",
        )
        connection = FakeConnection(self.database)
        with patch.object(backend, "get_db_connection", return_value=connection), patch.object(backend._password_reset_executor, "submit"):
            response = self.client.post("/auth/reset-password", json={"token": raw_token, "new_password": "new-password"})
            protected = self.client.get("/__test/password-reset/protected", headers={"Authorization": f"Bearer {old_jwt}"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(check_password_hash(self.database.admin["password_hash"], "new-password"))
        self.assertIsNotNone(token["used_at"])
        self.assertTrue(connection.committed)
        self.assertEqual(protected.status_code, 401)

    def test_expired_reused_and_unknown_tokens_share_one_error(self):
        expired = self.add_token("expired", expires_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=1))
        reused = self.add_token("reused", used_at=datetime.datetime.now(datetime.timezone.utc))
        self.assertIsNotNone(expired)
        self.assertIsNotNone(reused)
        responses = []
        for raw_token in ("expired", "reused", "unknown"):
            with patch.object(backend, "get_db_connection", side_effect=lambda: FakeConnection(self.database)):
                response = self.client.post("/auth/reset-password", json={"token": raw_token, "new_password": "new-password"})
            responses.append((response.status_code, response.get_json()))

        self.assertEqual(responses, [(400, {"error": "Invalid or expired link."})] * 3)

    def test_known_and_unknown_email_return_same_generic_response(self):
        responses = []
        with patch.object(backend.redis_client, "eval", return_value=1), patch.object(backend._password_reset_executor, "submit"):
            for email in ("admin@example.com", "missing@example.com"):
                response = self.client.post("/auth/forgot-password", json={"email": email})
                responses.append((response.status_code, response.get_json()))

        self.assertEqual(responses[0], responses[1])
        self.assertEqual(responses[0], (200, {"message": "If that email is registered, a reset link has been sent."}))


if __name__ == "__main__":
    unittest.main()
