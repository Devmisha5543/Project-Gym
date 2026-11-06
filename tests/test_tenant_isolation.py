import datetime
import os
import unittest
from unittest.mock import MagicMock, patch

import jwt
import app as backend


class TenantIsolationTests(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()

    def headers(self, gym_id):
        token = jwt.encode(
            {
                "gym_id": gym_id,
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
            },
            os.getenv("JWT_SECRET", "test-secret-key-12345"),
            algorithm="HS256",
        )
        return {"Authorization": f"Bearer {token}"}

    def request_with_db(self, method, path, *, gym_id=1, json=None, data=None, fetchone=None, rowcount=1):
        connection = MagicMock()
        cursor = MagicMock()
        connection.cursor.return_value = cursor
        cursor.fetchall.return_value = []
        if isinstance(fetchone, list):
            cursor.fetchone.side_effect = fetchone
        else:
            cursor.fetchone.return_value = fetchone
        cursor.rowcount = rowcount
        with patch.object(backend, "get_db_connection", return_value=connection), \
             patch.object(backend.redis_client, "get", return_value=None) as cache_get, \
             patch.object(backend.redis_client, "setex"), \
             patch.object(backend.redis_client, "delete"), \
             patch.object(backend.redis_client, "incr"):
            response = self.client.open(
                path,
                method=method,
                headers=self.headers(gym_id),
                json=json,
                data=data,
            )
        return response, cursor, connection, cache_get

    def test_tenant_gets_bind_the_authenticated_gym_and_use_scoped_cache_keys(self):
        endpoints = (
            "/trainers",
            "/personaltrainingassignments",
            "/classbookings",
            "/classes",
            "/payments",
            "/equipment",
            "/trainerbranch",
        )
        for gym_id in (101, 202):
            for path in endpoints:
                with self.subTest(gym_id=gym_id, path=path):
                    response, cursor, _, cache_get = self.request_with_db("GET", path, gym_id=gym_id)
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.get_json(), [])
                    sql, params = cursor.execute.call_args.args
                    self.assertIn("gym_id = %s", sql.lower())
                    self.assertIn(gym_id, params)
                    self.assertTrue(cache_get.call_args.args[0].endswith(f":{gym_id}"))

    def test_cross_tenant_updates_and_deletes_are_not_found(self):
        update_payloads = {
            "/trainers/702": {"name": "N", "phone": "P", "email": "E", "certification": "C"},
            "/personaltrainingassignments/703": {"trainer_id": 704, "member_id": 705, "speciality": "S", "start_date": "2026-01-01", "status": "active"},
            "/classbookings/706": {"member_id": 705, "class_id": 707, "booking_date": "2026-01-01", "status": "booked"},
            "/classes/707": {"trainer_id": 704, "branch_id": 708, "class_name": "C", "schedule_time": "09:00", "duration_minutes": 30, "capacity": 10},
            "/payments/709": {"membership_id": 710, "amount": 20, "payment_date": "2026-01-01", "payment_method": "cash"},
            "/equipment/711": {"branch_id": 708, "name": "E", "quantity": 1, "condition": "good"},
            "/trainerbranch/704/708": {"trainer_id": 704, "branch_id": 708},
            "/members/712": {"branch_id": 708, "name": "N", "gender": "X", "phone": "P", "address": "", "join_date": "2026-01-01", "wants_trainer": "false"},
            "/memberships/713": {"member_id": 705, "plan_id": 2, "start_date": "2026-01-01", "status": "active"},
        }
        delete_paths = (
            "/trainers/702",
            "/personaltrainingassignments/703",
            "/classbookings/706",
            "/classes/707",
            "/payments/709",
            "/equipment/711",
            "/trainerbranch/704/708",
            "/members/712",
            "/memberships/713",
        )

        for gym_id in (101, 202):
            for path, payload in update_payloads.items():
                with self.subTest(gym_id=gym_id, method="PUT", path=path):
                    response, cursor, _, _ = self.request_with_db(
                        "PUT", path, gym_id=gym_id,
                        data=payload if path == "/members/712" else None,
                        json=None if path == "/members/712" else payload,
                        rowcount=0,
                        fetchone=(30,) if path == "/memberships/713" else
                        (704,) if path == "/trainerbranch/704/708" else None,
                    )
                    self.assertEqual(response.status_code, 404)
                    scoped = [(call.args[0], call.args[1]) for call in cursor.execute.call_args_list
                              if "gym_id = %s" in call.args[0].lower()]
                    self.assertTrue(scoped)
                    self.assertTrue(all(gym_id in params for _, params in scoped))

            for path in delete_paths:
                with self.subTest(gym_id=gym_id, method="DELETE", path=path):
                    response, cursor, _, _ = self.request_with_db("DELETE", path, gym_id=gym_id, rowcount=0)
                    self.assertEqual(response.status_code, 404)
                    scoped = [(call.args[0], call.args[1]) for call in cursor.execute.call_args_list
                              if "gym_id = %s" in call.args[0].lower()]
                    self.assertTrue(scoped)
                    self.assertTrue(all(gym_id in params for _, params in scoped))

    def test_cross_tenant_references_are_rejected_on_create(self):
        json_requests = (
            ("/personaltrainingassignments", {"trainer_id": 704, "member_id": 705, "speciality": "S", "start_date": "2026-01-01", "status": "active"}, None),
            ("/classbookings", {"member_id": 705, "class_id": 707, "booking_date": "2026-01-01", "status": "booked"}, None),
            ("/classes", {"trainer_id": 704, "branch_id": 708, "class_name": "C", "schedule_time": "09:00", "duration_minutes": 30, "capacity": 10}, None),
            ("/payments", {"membership_id": 710, "amount": 20, "payment_date": "2026-01-01", "payment_method": "cash"}, None),
            ("/equipment", {"branch_id": 708, "name": "E", "quantity": 1, "condition": "good"}, None),
            ("/trainerbranch", {"trainer_id": 704, "branch_id": 708}, None),
            ("/trainers", {"name": "N", "phone": "P", "email": "E", "certification": "C", "branch_id": 708}, None),
            ("/memberships", {"member_id": 705, "plan_id": 2, "start_date": "2026-01-01", "status": "active"}, [(30,), None]),
        )
        for gym_id in (101, 202):
            for path, payload, fetch_results in json_requests:
                with self.subTest(gym_id=gym_id, path=path):
                    response, cursor, _, _ = self.request_with_db(
                        "POST", path, gym_id=gym_id, json=payload,
                        fetchone=(704,) if path == "/trainerbranch" else fetch_results,
                        rowcount=0 if path == "/trainerbranch" else 1,
                    )
                    self.assertEqual(response.status_code, 404)
                    scoped = [(call.args[0], call.args[1]) for call in cursor.execute.call_args_list
                              if "gym_id = %s" in call.args[0].lower()]
                    self.assertTrue(scoped)
                    self.assertTrue(all(gym_id in params for _, params in scoped))

    def test_member_creation_rejects_a_branch_outside_the_token_gym(self):
        response, cursor, _, _ = self.request_with_db(
            "POST",
            "/members",
            gym_id=101,
            data={
                "branch_id": "708", "name": "N", "gender": "X", "phone": "P",
                "address": "", "join_date": "2026-01-01", "wants_trainer": "false",
                "plan_id": "2",
            },
            fetchone=[(30,), None],
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(cursor.execute.call_count, 2)
        branch_sql, branch_params = cursor.execute.call_args_list[1].args
        self.assertIn("gym_id = %s", branch_sql.lower())
        self.assertEqual(branch_params, ("708", 101))

    def test_trainer_creation_links_the_selected_owned_branch_atomically(self):
        connection = MagicMock()
        cursor = MagicMock()
        connection.cursor.return_value = cursor
        cursor.fetchone.side_effect = [(408,), (509,)]
        with patch.object(backend, "get_db_connection", return_value=connection), \
             patch.object(backend.redis_client, "get", return_value=None), \
             patch.object(backend.redis_client, "delete"), \
             patch.object(backend.redis_client, "incr"):
            response = self.client.post(
                "/trainers",
                headers=self.headers(101),
                json={"name": "N", "phone": "P", "email": "E", "certification": "C", "branch_id": 408},
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(cursor.execute.call_count, 3)
        branch_query, branch_params = cursor.execute.call_args_list[0].args
        self.assertIn("gym_id = %s", branch_query.lower())
        self.assertIn("FOR SHARE", branch_query.upper())
        self.assertEqual(branch_params, (408, 101))
        self.assertEqual(cursor.execute.call_args_list[2].args[1], (509, 408))
        connection.commit.assert_called_once()

    def test_trainer_can_be_linked_to_an_additional_branch_in_the_same_gym(self):
        response, cursor, connection, _ = self.request_with_db(
            "POST",
            "/trainerbranch",
            gym_id=101,
            json={"trainer_id": 509, "branch_id": 409},
            fetchone=(509,),
            rowcount=1,
        )

        self.assertEqual(response.status_code, 201)
        link_sql, params = cursor.execute.call_args_list[1].args
        self.assertIn("own_branch.gym_id = %s", link_sql)
        self.assertIn(101, params)
        self.assertEqual(params[0:3], (509, 409, 101))
        connection.commit.assert_called_once()

    def test_trainer_branch_changes_invalidate_gym_scoped_dependent_lists(self):
        with backend.app.test_request_context():
            backend.request.decoded_token = {"gym_id": 101}
            with patch.object(backend.redis_client, "delete") as delete_cache:
                backend.invalidate_trainer_branches_cache()

        deleted_keys = delete_cache.call_args.args
        self.assertIn("trainer_branches:all:101", deleted_keys)
        self.assertIn("trainers:all:101", deleted_keys)
        self.assertIn("personal_training_assignments:all:101", deleted_keys)


if __name__ == "__main__":
    unittest.main()
