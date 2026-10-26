import datetime
import os
import unittest
from unittest.mock import patch

import jwt
import app as backend


class DateCursor:
    rowcount = 1

    def __init__(self, *, fail_membership_update=False, expiring_rows=None):
        self.queries = []
        self.results = []
        self.fail_membership_update = fail_membership_update
        self.expiring_rows = expiring_rows or []

    def execute(self, sql, params=None):
        self.queries.append((sql, params))
        if "SELECT duration_days FROM MembershipPlan" in sql:
            self.results.append((45,))
        elif "SELECT 1 FROM branch" in sql or "SELECT 1 FROM member m" in sql:
            self.results.append((1,))
        elif "RETURNING member_id" in sql:
            self.results.append((10,))
        elif "RETURNING membership_id" in sql:
            self.results.append((20,))
        elif "SELECT membership_id FROM Membership WHERE member_id" in sql:
            self.results.append((20,))
        elif "SELECT ms.membership_id, mp.duration_days" in sql:
            self.results.append((20, 45))
        elif "UPDATE Membership SET start_date" in sql:
            if self.fail_membership_update:
                raise RuntimeError("database write failed")
        elif "SELECT member_id, branch_id, name, gender" in sql:
            self.results.append((10, 1, "Test Member", "Female", "123", "", datetime.date(2026, 10, 1), False, None))
        elif "FROM membership" in sql and "NOT EXISTS" in sql:
            self.results.extend(self.expiring_rows)
        elif "UPDATE Membership SET member_id" in sql and "RETURNING membership_id, member_id" in sql:
            self.results.append((20, 10))

    def fetchone(self):
        return self.results.pop(0) if self.results else None

    def fetchall(self):
        rows, self.results = self.results, []
        return rows

    def close(self):
        pass


class DateConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        pass


class MembershipDateTests(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()
        token = jwt.encode({
            "gym_id": 1,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
        }, os.getenv("JWT_SECRET", "test-secret-key-12345"), algorithm="HS256")
        self.headers = {"Authorization": f"Bearer {token}"}

    def run_with_db(self, cursor, callback):
        connection = DateConnection(cursor)
        with patch.object(backend, "get_db_connection", return_value=connection), \
             patch.object(backend.redis_client, "get", return_value=None), \
             patch.object(backend.redis_client, "delete"), \
             patch.object(backend.redis_client, "incr"):
            result = callback()
        return connection, result

    def test_create_member_uses_plan_duration_and_join_date(self):
        cursor = DateCursor()
        connection, response = self.run_with_db(cursor, lambda: self.client.post("/members", headers=self.headers, data={
            "branch_id": "1", "name": "Test Member", "gender": "Female", "phone": "123",
            "address": "", "join_date": "2026-10-01", "wants_trainer": "false", "plan_id": "2",
            "membership_end_date": "2099-01-01",
        }))
        self.assertEqual(response.status_code, 201)
        membership_insert = next(params for sql, params in cursor.queries if "INSERT INTO Membership" in sql)
        self.assertEqual(membership_insert[2:], (datetime.date(2026, 10, 1), datetime.date(2026, 11, 15)))
        self.assertTrue(connection.committed)

    def test_join_date_edit_updates_current_membership_and_response(self):
        cursor = DateCursor()
        connection, response = self.run_with_db(cursor, lambda: self.client.put("/members/10", headers=self.headers, data={
            "branch_id": "1", "name": "Test Member", "gender": "Female", "phone": "123",
            "address": "", "join_date": "2026-10-01", "wants_trainer": "false",
        }))
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["member"]["join_date"], "2026-10-01")
        self.assertEqual(payload["membership"]["start_date"], "2026-10-01")
        self.assertEqual(payload["membership"]["end_date"], "2026-11-15")
        date_update = next((sql, params) for sql, params in cursor.queries if "UPDATE Membership SET start_date" in sql)
        self.assertIn("WHERE membership_id = %s", date_update[0])
        self.assertEqual(date_update[1][2], 20)
        self.assertTrue(connection.committed)

    def test_failed_membership_date_update_rolls_back_member_edit(self):
        cursor = DateCursor(fail_membership_update=True)
        connection = DateConnection(cursor)
        with patch.object(backend, "get_db_connection", return_value=connection), \
             patch.object(backend.redis_client, "get", return_value=None):
            with self.assertRaises(RuntimeError):
                self.client.put("/members/10", headers=self.headers, data={
                    "branch_id": "1", "name": "Test Member", "gender": "Female", "phone": "123",
                    "address": "", "join_date": "2026-10-01", "wants_trainer": "false",
                })
        self.assertTrue(connection.rolled_back)
        self.assertFalse(connection.committed)

    def test_membership_start_edit_recalculates_expiration_and_join_date(self):
        cursor = DateCursor()
        connection, response = self.run_with_db(cursor, lambda: self.client.put("/memberships/20", headers=self.headers, json={
            "member_id": 10, "plan_id": 2, "start_date": "2026-10-01", "end_date": "2099-01-01", "status": "active",
        }))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["start_date"], "2026-10-01")
        self.assertEqual(response.get_json()["end_date"], "2026-11-15")
        self.assertTrue(any("UPDATE Member SET join_date" in sql for sql, _ in cursor.queries))
        self.assertTrue(connection.committed)

    def test_expiring_soon_uses_persisted_membership_end_date_and_existing_window(self):
        row = (20, 10, 1, "Test Member", "Female", "123", "", datetime.date(2026, 10, 1), False,
               None, datetime.date(2026, 10, 1), datetime.date(2026, 10, 29), "active")
        cursor = DateCursor(expiring_rows=[row])
        _, response = self.run_with_db(cursor, lambda: self.client.get("/memberships/expiring", headers=self.headers))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()[0]["end_date"], "2026-10-29")
        query = next(sql for sql, _ in cursor.queries if "NOT EXISTS" in sql)
        self.assertNotIn("membership.end_date >= CURRENT_DATE", query)
        self.assertIn("CURRENT_DATE + INTERVAL '7 days'", query)
        self.assertIn("membership.status <> 'cancelled'", query)

    def test_expiring_soon_includes_recently_expired_memberships(self):
        row = (22, 53, 2, "Milkesa Alemu", "Male", "123", "", datetime.date(2026, 9, 24), False,
               None, datetime.date(2026, 9, 24), datetime.date(2026, 10, 24), "active")
        cursor = DateCursor(expiring_rows=[row])
        _, response = self.run_with_db(cursor, lambda: self.client.get("/memberships/expiring", headers=self.headers))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()[0]["member_id"], 53)
        self.assertEqual(response.get_json()[0]["end_date"], "2026-10-24")
        query = next(sql for sql, _ in cursor.queries if "NOT EXISTS" in sql)
        self.assertNotIn("membership.end_date >= CURRENT_DATE", query)

    def test_expiring_soon_leaves_result_when_expiration_moves_outside_window(self):
        cursor = DateCursor(expiring_rows=[])
        _, response = self.run_with_db(cursor, lambda: self.client.get("/memberships/expiring", headers=self.headers))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])


if __name__ == "__main__":
    unittest.main()
