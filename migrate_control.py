import os
import sys

import psycopg2
from dotenv import load_dotenv


def run_migration():
    load_dotenv()
    database_url = os.getenv("CONTROL_DATABASE_URL")
    if not database_url:
        raise RuntimeError("CONTROL_DATABASE_URL must be configured")

    migration_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "migrations",
        "control_001_platform.sql",
    )
    with open(migration_path, "r", encoding="utf-8") as migration_file:
        migration_sql = migration_file.read()

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cursor:
            cursor.execute(migration_sql)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as error:
        print(f"Control database migration failed: {error}", file=sys.stderr)
        sys.exit(1)
    print("Control database migration completed successfully.")
