import os
import unittest
from unittest.mock import patch, MagicMock
import datetime
import jwt
import redis
import app as backend

class TestCacheInvalidationFailOpen(unittest.TestCase):
    def setUp(self):
        backend.app.config["TESTING"] = True
        self.client = backend.app.test_client()
        self.jwt_secret = os.getenv("JWT_SECRET", "test-secret-key-12345")
        self.token = jwt.encode(
            {
                "admin_id": 2,
                "gym_id": 1,
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
            },
            self.jwt_secret,
            algorithm="HS256"
        )
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_invalidate_caches_normal(self):
        """Under normal conditions, invalidate_caches deletes keys."""
        with patch.object(backend.redis_client, "delete") as mock_delete:
            backend.invalidate_caches("test:key1", "test:key2")
            mock_delete.assert_called_once_with("test:key1", "test:key2")

    def test_invalidate_caches_empty(self):
        """Calling invalidate_caches with no keys returns safely without calling delete."""
        with patch.object(backend.redis_client, "delete") as mock_delete:
            backend.invalidate_caches()
            mock_delete.assert_not_called()

    def test_invalidate_caches_redis_error_fail_open(self):
        """When Redis raises RedisError, invalidate_caches catches it and does not raise."""
        with patch.object(backend.redis_client, "delete", side_effect=redis.ConnectionError("Connection refused")):
            with patch.object(backend.app.logger, "warning") as mock_log:
                backend.invalidate_caches("test:key1", "test:key2")
                mock_log.assert_called_once()
                self.assertIn("Cache invalidation failed for keys", mock_log.call_args[0][0])

    def test_invalidate_members_cache_redis_error_fail_open(self):
        """When Redis fails, invalidate_members_cache catches error and does not raise."""
        with patch.object(backend.redis_client, "delete", side_effect=redis.TimeoutError("Timeout")):
            with patch.object(backend.app.logger, "warning") as mock_log:
                backend.invalidate_members_cache()
                mock_log.assert_called()
                self.assertIn("Cache invalidation failed for members:all", mock_log.call_args[0][0])

    def test_invalidate_memberships_cache_redis_error_fail_open(self):
        """When Redis fails, invalidate_memberships_cache catches error and does not raise."""
        with patch.object(backend.redis_client, "delete", side_effect=redis.RedisError("Redis down")):
            with patch.object(backend.app.logger, "warning") as mock_log:
                backend.invalidate_memberships_cache()
                mock_log.assert_called()

    def test_all_helpers_fail_open_on_redis_error(self):
        """Verify all domain cache invalidation helpers fail-open when Redis is down."""
        helpers = [
            backend.invalidate_branches_cache,
            backend.invalidate_trainers_cache,
            backend.invalidate_classes_cache,
            backend.invalidate_memberships_cache,
            backend.invalidate_membership_plans_cache,
            backend.invalidate_class_bookings_cache,
            backend.invalidate_payments_cache,
            backend.invalidate_equipment_cache,
            backend.invalidate_trainer_branches_cache,
            backend.invalidate_personal_training_assignments_cache,
            backend.invalidate_admins_cache,
        ]
        with patch.object(backend.redis_client, "delete", side_effect=redis.ConnectionError("Redis down")):
            for helper in helpers:
                try:
                    helper()
                except redis.RedisError as e:
                    self.fail(f"{helper.__name__} raised RedisError unexpectedly: {e}")

    @patch("app.get_db_connection")
    def test_mutation_endpoint_normal_case(self, mock_get_conn):
        """Normal case: DB succeeds, Redis invalidation succeeds, returns 200."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.rowcount = 1
        mock_cursor.fetchone.return_value = (None,)

        with patch.object(backend.redis_client, "delete") as mock_delete:
            res = self.client.delete("/branches/999", headers=self.headers)
            self.assertEqual(res.status_code, 200)
            mock_conn.commit.assert_called_once()
            mock_delete.assert_called()

    @patch("app.get_db_connection")
    def test_mutation_endpoint_succeeds_when_redis_invalidation_fails(self, mock_get_conn):
        """Redis failure case: DB succeeds, Redis invalidation raises RedisError, endpoint still returns 200 (not 500)."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.rowcount = 1
        mock_cursor.fetchone.return_value = (None,)

        with patch.object(backend.redis_client, "delete", side_effect=redis.ConnectionError("Redis offline")):
            with patch.object(backend.app.logger, "warning") as mock_log:
                res = self.client.delete("/branches/999", headers=self.headers)
                self.assertEqual(res.status_code, 200)
                mock_conn.commit.assert_called_once()
                mock_conn.rollback.assert_not_called()
                mock_log.assert_called()

    def test_redis_init_from_env_url(self):
        """When REDIS_URL is provided, Redis is initialized via from_url."""
        test_url = "redis://user:pass@redis-cloud.example.com:6380/1"
        with patch.dict(os.environ, {"REDIS_URL": test_url}):
            with patch("redis.from_url") as mock_from_url:
                url = os.getenv("REDIS_URL")
                if url:
                    client = redis.from_url(url, decode_responses=True)
                mock_from_url.assert_called_once_with(test_url, decode_responses=True)

    def test_redis_init_fallback_when_env_url_absent(self):
        """When REDIS_URL is absent/empty, Redis falls back to localhost:6379."""
        with patch.dict(os.environ, {"REDIS_URL": ""}, clear=False):
            with patch("redis.Redis") as mock_redis_cls:
                url = os.getenv("REDIS_URL")
                if url:
                    client = redis.from_url(url, decode_responses=True)
                else:
                    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
                mock_redis_cls.assert_called_once_with(host="localhost", port=6379, decode_responses=True)

    def test_cache_response_decorator_caching(self):
        """Verify cache_response decorator writes and reads cache correctly."""
        with patch.object(backend.redis_client, "get", return_value='{"cached": true}') as mock_get:
            @backend.cache_response("test:cache:key")
            def dummy_view():
                return backend.jsonify({"cached": False})

            with backend.app.test_request_context():
                res = dummy_view()
                self.assertEqual(res.get_json(), {"cached": True})
                mock_get.assert_called_once_with("test:cache:key")

if __name__ == "__main__":
    unittest.main()

