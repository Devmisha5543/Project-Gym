import unittest
from decimal import Decimal
from unittest.mock import patch

import app as backend


class AnalyticsCursor:
    def __init__(self, path, empty=False):
        self.path = path
        self.empty = empty
        self.rows = []
        self.query_count = 0
        self.queries = []

    def execute(self, sql, params=None):
        self.queries.append((sql, params))
        self.query_count += 1
        if self.empty:
            if "member_totals AS" in sql:
                self.rows = []
            elif "mp.plan_id, mp.plan_name" in sql:
                self.rows = []
            elif "l.member_id IS NULL" in sql:
                self.rows = [(0, 0, 0, 0, 0)]
            elif "WITH latest AS" in sql:
                self.rows = [(0, 0, 0, 0, 0, 0, 0, 0)]
            elif "COUNT(DISTINCT m.member_id)" in sql:
                self.rows = [(Decimal(0), 0)]
            elif "SELECT COUNT(*) FROM member" in sql:
                self.rows = [(0,)]
            elif "SELECT to_char(date_trunc" in sql or "SELECT mp.plan_id" in sql:
                self.rows = []
            elif "SELECT COALESCE(SUM(p.amount)" in sql:
                self.rows = [(Decimal(0), Decimal(0))] if self.path == "/analytics/financial" else [(Decimal(0), Decimal(0), Decimal(0), Decimal(0), Decimal(0))]
            elif "WITH buckets AS" in sql:
                self.rows = [("2026-10", 0)]
            else:
                self.rows = []
            return
        if "WITH buckets AS" in sql:
            self.rows = [("2026-10-01", 2)]
        elif "member_totals AS" in sql:
            self.rows = [(4, "North", 5, 3, 1, Decimal("25.00"))]
        elif "SELECT mp.plan_id, mp.plan_name" in sql:
            self.rows = [(1, "Monthly", 2, 1, 1, 30)]
        elif "SELECT mp.plan_id, COALESCE(SUM(p.amount)" in sql:
            self.rows = [(1, Decimal("55.00"))]
        elif "SELECT to_char(date_trunc" in sql:
            self.rows = [("2026-10-01", Decimal("25.00"))]
        elif "WITH latest AS" in sql and "COUNT(*) FILTER" in sql:
            if "l.member_id IS NULL" in sql:
                self.rows = [(2, 1, 0, 1, 1)]
            elif "member_totals AS" not in sql:
                self.rows = [(5, 3, 1, 1, 1, 0, 2, 1)]
        elif "COUNT(DISTINCT m.member_id)" in sql:
            self.rows = [(Decimal("25.00"), 2)] if self.query_count == 1 else [(Decimal("10.00"), 1)]
        elif "SELECT COUNT(*) FROM member" in sql:
            self.rows = [(3,)]
        elif "SELECT COALESCE(SUM(p.amount)" in sql:
            if self.path == "/analytics/financial":
                self.rows = [(Decimal("15.00"), Decimal("12.00"))]
            else:
                self.rows = [(Decimal("100.00"), Decimal("40.00"), Decimal("20.00"), Decimal("15.00"), Decimal("12.00"))]
        else:
            self.rows = []

    def fetchone(self):
        return self.rows.pop(0) if self.rows else None

    def fetchall(self):
        rows, self.rows = self.rows, []
        return rows

    def close(self):
        pass


class AnalyticsConnection:
    def __init__(self, path):
        self.cursor_instance = AnalyticsCursor(path)

    def cursor(self):
        return self.cursor_instance

    def close(self):
        pass


class MutationCursor:
    rowcount = 1

    def __init__(self):
        self.next_id = 100

    def execute(self, sql, params=None):
        if "RETURNING member_id" in sql:
            self.next_id = 101
        elif "RETURNING membership_id" in sql:
            self.next_id = 201
        elif "RETURNING payment_id" in sql:
            self.next_id = 301

    def fetchone(self):
        return (self.next_id,)

    def close(self):
        pass


class MutationConnection:
    def __init__(self):
        self.cursor_instance = MutationCursor()

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


class AnalyticsTests(unittest.TestCase):
    def setUp(self):
        self.client = backend.app.test_client()
        self.connections = []
        self.cache = {}

        def connection_factory():
            connection = AnalyticsConnection(backend.request.path)
            connection.cursor_instance.empty = backend.request.args.get("empty") == "1"
            self.connections.append(connection)
            return connection

        self.patches = [
            patch.object(backend.jwt, "decode", return_value={"gym_id": 77}),
            patch.object(backend.redis_client, "get", side_effect=lambda key: self.cache.get(key)),
            patch.object(backend.redis_client, "setex", side_effect=lambda key, ttl, value: self.cache.__setitem__(key, value)),
            patch.object(backend, "_analytics_connection", side_effect=lambda: (connection_factory(), 77)),
        ]
        for mocked in self.patches:
            mocked.start()
            self.addCleanup(mocked.stop)

    def test_endpoints_require_authentication(self):
        for endpoint in ("overview", "retention", "financial", "memberships", "growth", "branches"):
            response = self.client.get(f"/analytics/{endpoint}")
            self.assertEqual(response.status_code, 401)

    def test_all_analytics_endpoints_return_data_for_authenticated_gym(self):
        for endpoint in ("overview", "retention", "financial", "memberships", "growth", "branches"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(f"/analytics/{endpoint}?range=6m", headers={"Authorization": "Bearer test"})
                self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
                payload = response.get_json()
                self.assertIsInstance(payload, dict)
                self.assertGreaterEqual(len(self.connections[-1].cursor_instance.queries), 1)
                for sql, params in self.connections[-1].cursor_instance.queries:
                    self.assertIn("77", str(params))
                    self.assertIn("gym_id", sql)

    def test_financial_periods_and_custom_dates_are_validated(self):
        for period in ("this_month", "last_month", "3m", "6m", "12m", "this_year"):
            response = self.client.get(f"/analytics/financial?range={period}", headers={"Authorization": "Bearer test"})
            self.assertEqual(response.status_code, 200, period)
        response = self.client.get(
            "/analytics/financial?range=custom&start_date=2026-09-01&end_date=2026-09-30",
            headers={"Authorization": "Bearer test"},
        )
        self.assertEqual(response.status_code, 200)
        invalid = self.client.get("/analytics/financial?range=custom&start_date=bad&end_date=bad", headers={"Authorization": "Bearer test"})
        self.assertEqual(invalid.status_code, 400)

    def test_expiry_is_not_reported_as_churn_and_cache_is_gym_scoped(self):
        response = self.client.get("/analytics/retention?range=6m", headers={"Authorization": "Bearer test"})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.get_json()["churn_rate"])
        cache_key = backend.redis_client.setex.call_args.args[0]
        self.assertIn("analytics:v1:77:", cache_key)

    def test_redis_serves_cached_analytics_until_version_changes(self):
        headers = {"Authorization": "Bearer test"}
        first = self.client.get("/analytics/overview?range=6m", headers=headers)
        second = self.client.get("/analytics/overview?range=6m", headers=headers)
        self.assertEqual(first.get_json(), second.get_json())
        self.assertEqual(len(self.connections), 1)

    def test_empty_analytics_shapes_and_versioned_invalidation(self):
        for endpoint in ("overview", "retention", "financial", "memberships", "growth", "branches"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(f"/analytics/{endpoint}?range=6m&empty=1", headers={"Authorization": "Bearer test"})
                self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        with backend.app.test_request_context("/analytics/overview"):
            backend.request.decoded_token = {"gym_id": 77}
            with patch.object(backend.redis_client, "incr") as increment, patch.object(backend.redis_client, "delete"):
                backend.invalidate_members_cache()
                backend.invalidate_memberships_cache()
                backend.invalidate_membership_plans_cache()
                backend.invalidate_payments_cache()
                backend.invalidate_branches_cache()
                self.assertEqual(increment.call_count, 5)
                self.assertTrue(all(call.args[0] == "analytics:version:77" for call in increment.call_args_list))

    def test_member_membership_and_payment_creation_bump_analytics_version(self):
        headers = {"Authorization": "Bearer test"}
        with patch.object(backend, "get_db_connection", return_value=MutationConnection()), \
             patch.object(backend.redis_client, "delete"), \
             patch.object(backend.redis_client, "incr") as increment:
            member = self.client.post("/members", headers=headers, data={
                "branch_id": "1", "name": "Analytics test", "gender": "Female", "phone": "000",
                "address": "", "join_date": "2026-01-01", "wants_trainer": "false",
                "plan_id": "1", "membership_end_date": "2026-02-01",
            })
            self.assertEqual(member.status_code, 201)
            self.assertEqual(increment.call_count, 2)

            increment.reset_mock()
            membership = self.client.post("/memberships", headers=headers, json={
                "member_id": 1, "plan_id": 1, "start_date": "2026-01-01",
                "end_date": "2026-02-01", "status": "active",
            })
            self.assertEqual(membership.status_code, 201)
            increment.assert_called_once_with("analytics:version:77")

            increment.reset_mock()
            membership_update = self.client.put("/memberships/1", headers=headers, json={
                "member_id": 1, "plan_id": 1, "start_date": "2026-01-01",
                "end_date": "2026-03-01", "status": "active",
            })
            self.assertEqual(membership_update.status_code, 200)
            increment.assert_called_once_with("analytics:version:77")

            increment.reset_mock()
            payment = self.client.post("/payments", headers=headers, json={
                "membership_id": 1, "amount": 20, "payment_date": "2026-01-01", "payment_method": "cash",
            })
            self.assertEqual(payment.status_code, 201)
            increment.assert_called_once_with("analytics:version:77")


if __name__ == "__main__":
    unittest.main()
