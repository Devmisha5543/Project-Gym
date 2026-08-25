from flask import Flask, jsonify, request
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask import send_from_directory

load_dotenv()

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
CORS(app)

REQUEST_BODY_JSON_ERROR = "Request body must be valid JSON"

@app.route("/uploads/<filename>")
def get_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/")
def home():
    return "Gym Management System backend is running!"

@app.route("/branches")
def get_branches():
    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def create_branch():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "address", "phone", "city"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def delete_branch(branch_id):

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("DELETE FROM Branch WHERE branch_id = %s;", (branch_id,))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Branch {branch_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Branch {branch_id} deleted"}), 200

@app.route("/branches/<int:branch_id>", methods=["PUT"])
def update_branch(branch_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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

    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def delete_member(member_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_member(member_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
    cursor=conn.cursor()
    cursor.execute("UPDATE Member SET name = %s, phone = %s WHERE member_id = %s;",
                   (data["name"], data["phone"], member_id))

    if cursor.rowcount == 0:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Member {member_id} not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message":f"Member {member_id} updated"}), 200
    

@app.route("/trainers")
def get_trainers():
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("SELECT trainer_id, name, phone, email, certification FROM trainer;")
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
def create_trainer():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["name", "phone", "email", "certification"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn =psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")

    )

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
def delete_trainer(trainer_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_trainer(trainer_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
    cursor = conn.cursor()
    cursor.execute("""
        SELECT membership.membership_id, member.name, member.phone, membership.end_date, membership.status
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
            "member_name": row[1],
            "member_phone": row[2],
            "end_date": row[3].isoformat(),
            "status": row[4]
        })

    return jsonify(expiring)

@app.route("/memberships", methods=["POST"])
def create_membership():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["member_id", "plan_id", "start_date", "end_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Membership (member_id, plan_id, start_date, end_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING membership_id;",
                   (data["member_id"], data["plan_id"], data["start_date"], data["end_date"], data["status"] ))
    

    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Membership created", "membership_id": new_id}), 201

@app.route("/memberships/<int:membership_id>", methods=["DELETE"])
def delete_membership(membership_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_membership(membership_id):
    data=request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")

    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def create_personal_trainer_assignment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "member_id", "speciality", "start_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO PersonalTrainingAssignment (trainer_id, member_id, speciality, start_date, status) VALUES(%s, %s, %s, %s, %s) RETURNING assignment_id;",
                   (data["trainer_id"], data["member_id"], data["speciality"], data["start_date"], data["status"]))

    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Personal trainer assignment created", "assignment_id": new_id}), 201

@app.route("/personaltrainingassignments/<int:assignment_id>", methods=["DELETE"])
def delete_personal_trainer_assignment(assignment_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_personal_trainer_assignment(assignment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def create_class_booking():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["member_id", "class_id", "booking_date", "cancel_date", "status"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO ClassBooking (member_id, class_id, booking_date, cancel_date, status) VALUES(%s,%s, %s, %s, %s) RETURNING booking_id;",
                   (data["member_id"], data["class_id"], data["booking_date"], data.get("cancel_date"), data["status"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Class booking created", "booking_id": new_id}), 201

@app.route("/classbookings/<int:booking_id>", methods=["DELETE"])
def delete_class_booking(booking_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_class_booking(booking_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def create_class():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "branch_id", "class_name", "schedule_time", "duration_minutes", "capacity"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Class (trainer_id, branch_id, class_name, schedule_time, duration_minutes, capacity) VALUES(%s, %s, %s, %s, %s, %s) RETURNING class_id;",
                   (data["trainer_id"], data["branch_id"], data["class_name"], data["schedule_time"], data["duration_minutes"], data["capacity"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Class created", "class_id": new_id}), 201

@app.route("/classes/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_class(class_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def create_payment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["membership_id", "amount", "payment_date", "payment_method"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Payment (membership_id, amount, payment_date, payment_method) VALUES(%s, %s, %s, %s) RETURNING payment_id;",
                   (data["membership_id"], data["amount"], data["payment_date"], data["payment_method"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Payment created", "payment_id": new_id}), 201

@app.route("/payments/<int:payment_id>", methods=["DELETE"])
def delete_payment(payment_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_payment(payment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def create_equipment():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["branch_id", "name", "quantity", "condition"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO Equipment (branch_id, name, quantity, condition) VALUES(%s, %s, %s, %s) RETURNING equipment_id;",
                   (data["branch_id"], data["name"], data["quantity"], data["condition"]))
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Equipment created", "equipment_id": new_id}), 201

@app.route("/equipment/<int:equipment_id>", methods=["DELETE"])
def delete_equipment(equipment_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def update_equipment(equipment_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
def create_trainer_branch():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["trainer_id", "branch_id"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

    cursor=conn.cursor()
    cursor.execute("INSERT INTO TrainerBranch (trainer_id,branch_id) VALUES(%s, %s);",
                   (data["trainer_id"],data["branch_id"])
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Trainer-Branch relationship created"}), 201

@app.route("/trainerbranch/<int:trainer_id>/<int:branch_id>", methods=["DELETE"])
def delete_trainer_branch(trainer_id, branch_id):
    conn=psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )

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
    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def create_membership_plan():
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    required_fields = ["plan_name", "price", "perks"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def delete_membership_plan(plan_id):
    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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
def update_membership_plan(plan_id):
    data = request.json

    if not data:
        return jsonify({"error": REQUEST_BODY_JSON_ERROR}), 400

    conn = psycopg2.connect(
        host="localhost",
        database="gym_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )
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


if __name__ == "__main__":
    app.run(debug=True)
