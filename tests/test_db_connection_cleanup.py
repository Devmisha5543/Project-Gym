import os
import unittest
from unittest.mock import patch, MagicMock
import datetime
import jwt
import psycopg2
import psycopg2.errors
from werkzeug.security import generate_password_hash
import app as backend

class TestDatabaseConnectionCleanup(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()
        self.jwt_secret = os.getenv("JWT_SECRET", "test-secret-key-12345")
        self.now = datetime.datetime.now(datetime.timezone.utc)
        self.token = jwt.encode(
            {
                "admin_id": 2,
                "gym_id": 1,
                "iat": self.now.timestamp(),
                "exp": self.now + datetime.timedelta(hours=1)
            },
            self.jwt_secret,
            algorithm="HS256"
        )
        self.super_admin_token = jwt.encode(
            {
                "admin_id": 1,
                "gym_id": 1,
                "iat": self.now.timestamp(),
                "exp": self.now + datetime.timedelta(hours=1)
            },
            self.jwt_secret,
            algorithm="HS256"
        )
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.super_headers = {"Authorization": f"Bearer {self.super_admin_token}"}

    def _mock_redis_get(self, key):
        if str(key).startswith("auth:revoked_at:"):
            return "none"
        return None

    def _mock_db(self):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        return mock_conn, mock_cursor

    def test_read_route_cleanup_on_success(self):
        """Read route closes cursor and connection on normal success (cache miss)."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.fetchall.return_value = []

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.get("/branches", headers=self.headers)
                self.assertEqual(response.status_code, 200)
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_read_route_cleanup_on_query_exception(self):
        """Read route closes cursor and connection even when SQL query raises an exception."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("Query execution failed")

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                with self.assertRaises(psycopg2.DatabaseError):
                    self.client.get("/branches", headers=self.headers)
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_write_route_cleanup_and_rollback_on_query_exception(self):
        """Write route executes rollback and closes cursor & conn when query raises exception."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("Insert failed")

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                with self.assertRaises(psycopg2.DatabaseError):
                    self.client.post(
                        "/branches",
                        json={"name": "Branch X", "address": "Addr", "phone": "123", "city": "City"},
                        headers=self.headers
                    )
                mock_conn.rollback.assert_called_once()
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_delete_route_foreign_key_violation_rollback_and_cleanup(self):
        """Delete route rolls back, returns 409, and closes connections on foreign key violation."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.errors.ForeignKeyViolation("Referential integrity error")

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.delete("/branches/1", headers=self.headers)
                self.assertEqual(response.status_code, 409)
                mock_conn.rollback.assert_called_once()
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_write_route_not_found_rollback_and_cleanup(self):
        """Write route rolls back, returns 404, and closes connections when rowcount == 0."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.rowcount = 0

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.put(
                    "/branches/999",
                    json={"name": "New", "address": "New", "phone": "123", "city": "City"},
                    headers=self.headers
                )
                self.assertEqual(response.status_code, 404)
                mock_conn.rollback.assert_called_once()
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_get_authenticated_gym_id_cursor_and_conn_cleanup_on_error(self):
        """get_authenticated_gym_id closes both cursor and conn even on exception."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("DB read failed")

        with patch.object(backend, "get_db_connection", return_value=mock_conn):
            with backend.app.test_request_context():
                backend.request.decoded_token = {"admin_id": 99}
                with self.assertRaises(psycopg2.DatabaseError):
                    backend.get_authenticated_gym_id()

            mock_cursor.close.assert_called_once()
            mock_conn.close.assert_called_once()

    def test_analytics_connection_and_route_cleanup_on_error(self):
        """Analytics routes close cursor and connection in finally even when query fails."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("Analytics query failed")

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                with self.assertRaises(psycopg2.DatabaseError):
                    self.client.get("/analytics/retention", headers=self.headers)
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_login_connection_and_cursor_cleanup_on_success(self):
        """Login closes cursor and connection on success."""
        mock_conn, mock_cursor = self._mock_db()
        pwd_hash = generate_password_hash("securepassword123")
        mock_cursor.fetchone.return_value = (1, "Admin", pwd_hash, 1)

        with patch.object(backend, "get_db_connection", return_value=mock_conn):
            response = self.client.post("/login", json={"email": "admin@gym.com", "password": "securepassword123"})
            self.assertEqual(response.status_code, 200)
            mock_cursor.close.assert_called_once()
            mock_conn.close.assert_called_once()

    def test_login_connection_and_cursor_cleanup_on_invalid_credentials(self):
        """Login closes cursor and connection on invalid credentials."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.fetchone.return_value = None

        with patch.object(backend, "get_db_connection", return_value=mock_conn):
            response = self.client.post("/login", json={"email": "bad@gym.com", "password": "wrong"})
            self.assertEqual(response.status_code, 401)
            mock_cursor.close.assert_called_once()
            mock_conn.close.assert_called_once()

    def test_create_payment_renewal_not_found_rollback_and_cleanup(self):
        """Renewal payment with invalid membership rolls back and closes DB connections."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.fetchone.return_value = None

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.post(
                    "/payments",
                    json={"membership_id": 999, "amount": 100, "payment_date": "2026-10-04", "payment_method": "cash", "renewal": True},
                    headers=self.headers
                )
                self.assertEqual(response.status_code, 404)
                mock_conn.rollback.assert_called_once()
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_trainer_branch_unique_violation_rollback_and_cleanup(self):
        """TrainerBranch duplicate insertion rolls back, returns 409, and closes connections."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.execute.side_effect = psycopg2.errors.UniqueViolation("Duplicate link")

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.post(
                    "/trainerbranch",
                    json={"trainer_id": 1, "branch_id": 1},
                    headers=self.headers
                )
                self.assertEqual(response.status_code, 409)
                mock_conn.rollback.assert_called_once()
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

    def test_delete_admin_last_admin_check_cleanup(self):
        """Deleting the last remaining admin closes connections and returns 400."""
        mock_conn, mock_cursor = self._mock_db()
        mock_cursor.fetchone.side_effect = [(2,), (1,)]  # admin exists, count is 1

        with patch.object(backend.redis_client, "get", side_effect=self._mock_redis_get):
            with patch.object(backend, "get_db_connection", return_value=mock_conn):
                response = self.client.delete("/admins/2", headers=self.super_headers)
                self.assertEqual(response.status_code, 400)
                mock_cursor.close.assert_called_once()
                mock_conn.close.assert_called_once()

if __name__ == "__main__":
    unittest.main()
