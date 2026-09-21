import os
import sys
import psycopg2
from dotenv import load_dotenv

def run_migration():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(dotenv_path=env_path)

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        conn = psycopg2.connect(db_url)
    else:
        conn = psycopg2.connect(
            host="localhost",
            database="gym_db",
            user="postgres",
            password=os.getenv("DB_PASSWORD")
        )

    sql_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migrations", "001_create_gym_table.sql")
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Executing migration: 001_create_gym_table.sql ...")
    try:
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()
        print("Migration executed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Migration FAILED and was rolled back: {e}", file=sys.stderr)
        cur.close()
        conn.close()
        sys.exit(1)

    # Verification queries
    print("\n--- VERIFICATION ---")
    cur.execute("SELECT gym_id, name, currency, created_at FROM gym;")
    gyms = cur.fetchall()
    print("Gym records:", gyms)

    cur.execute("SELECT admin_id, name, email, gym_id FROM admin;")
    admins = cur.fetchall()
    print("Admin records (with gym_id):", admins)

    cur.execute("SELECT branch_id, name, city, gym_id FROM branch;")
    branches = cur.fetchall()
    print("Branch records (with gym_id):", branches)

    cur.execute("""
        SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('admin', 'branch') AND kcu.column_name = 'gym_id';
    """)
    fks = cur.fetchall()
    print("Foreign key constraints on gym_id:", fks)

    cur.close()
    conn.close()

if __name__ == "__main__":
    run_migration()
