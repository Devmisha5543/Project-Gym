import datetime
import unittest
import uuid
from unittest.mock import MagicMock, patch

import psycopg2

import app as backend


class SignupTests(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()
        self.signup_data = {
            "gym_name": "North Star Gym",
            "owner_name": "Owner Example",
            "owner_email": "OWNER@EXAMPLE.COM",
            "owner_password": "secure-password",
        }

    def make_control_connection(self, tenant_id=None, trial_ends_at=None):
        connection = MagicMock()
        cursor = connection.cursor.return_value
        cursor.fetchone.return_value = (
            tenant_id or uuid.uuid4(),
            trial_ends_at or datetime.datetime(
                2026, 12, 1, tzinfo=datetime.timezone.utc
            ),
        )
        return connection

    def test_signup_rejects_missing_and_short_password(self):
        response = self.client.post("/auth/signup", json={
            "gym_name": "Gym",
            "owner_name": "Owner",
            "owner_email": "owner@example.com",
            "owner_password": "short",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("at least 8 characters", response.get_json()["error"])

    def test_signup_creates_trial_and_provisions_tenant(self):
        tenant_id = uuid.uuid4()
        trial_ends_at = datetime.datetime(
            2026, 12, 1, tzinfo=datetime.timezone.utc
        )
        control_connection = self.make_control_connection(tenant_id, trial_ends_at)
        status_connection = MagicMock()

        with patch.object(
            backend, "get_control_db_connection",
            side_effect=[control_connection, status_connection],
        ) as get_control_db, patch.object(
            backend, "provision_tenant_database"
        ) as provision:
            response = self.client.post("/auth/signup", json=self.signup_data)

        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["tenant_id"], str(tenant_id))
        self.assertEqual(payload["status"], "trial")
        provision.assert_called_once_with(
            tenant_id,
            "North Star Gym",
            "Owner Example",
            "owner@example.com",
            "secure-password",
        )
        self.assertEqual(get_control_db.call_count, 2)
        control_connection.commit.assert_called_once()
        status_connection.commit.assert_called_once()

    def test_signup_returns_conflict_for_existing_owner_email(self):
        connection = MagicMock()
        connection.cursor.return_value.execute.side_effect = psycopg2.errors.UniqueViolation()

        with patch.object(
            backend, "get_control_db_connection", return_value=connection
        ), patch.object(backend, "provision_tenant_database") as provision:
            response = self.client.post("/auth/signup", json=self.signup_data)

        self.assertEqual(response.status_code, 409)
        self.assertIn("already exists", response.get_json()["error"])
        connection.rollback.assert_called_once()
        provision.assert_not_called()

    def test_signup_marks_tenant_failed_when_provisioning_fails(self):
        tenant_id = uuid.uuid4()
        trial_ends_at = datetime.datetime(
            2026, 12, 1, tzinfo=datetime.timezone.utc
        )
        control_connection = self.make_control_connection(tenant_id, trial_ends_at)
        failed_connection = MagicMock()

        with patch.object(
            backend, "get_control_db_connection",
            side_effect=[control_connection, failed_connection],
        ), patch.object(
            backend, "provision_tenant_database",
            side_effect=RuntimeError("migration failed"),
        ):
            response = self.client.post("/auth/signup", json=self.signup_data)

        self.assertEqual(response.status_code, 503)
        self.assertIn("could not be completed", response.get_json()["error"])
        failed_connection.commit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
