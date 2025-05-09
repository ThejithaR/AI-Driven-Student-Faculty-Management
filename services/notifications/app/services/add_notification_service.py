from app.db import supabase
import uuid
from datetime import datetime

async def add_notification(data: dict):
    title = data.get("title")
    message = data.get("message")
    priority = data.get("priority", "low")  # Default to "low"
    course_code = data.get("course_code")
    sender_id = data.get("sender_id")

    # Validate input data
    if not title or not message or not course_code or not sender_id:
        return {"status": "error", "message": "Missing required fields: title, message, course_code, or sender_id"}

    try:
        # Step 1: Get all students enrolled in the course
        enroll_response = supabase.table("Enrollments").select("reg_number").eq("course_code", course_code).execute()
        if enroll_response.error:
            print(f"❌ Error fetching enrollments: {enroll_response.error}")
            return {"status": "error", "message": "Failed to fetch enrollments"}
        if not enroll_response.data:
            return {"status": "error", "message": f"No students enrolled in course {course_code}"}

        reg_numbers = [e['reg_number'] for e in enroll_response.data]

        # Step 2: Get UIDs of those students from Student profiles
        student_response = supabase.table("Student profiles").select("UID, reg_number").in_("reg_number", reg_numbers).execute()
        if student_response.error:
            print(f"❌ Error fetching student UIDs: {student_response.error}")
            return {"status": "error", "message": "Failed to fetch student profiles"}
        if not student_response.data:
            return {"status": "error", "message": "No matching student profiles found"}

        students = student_response.data

        # Step 3: Create notifications for each student
        notifications = []
        for student in students:
            notif = {
                "Notification_id": str(uuid.uuid4()),
                "Recipient_id": student["UID"],
                "Title": title,
                "Message": message,
                "Course_code": course_code,
                "Priority": priority,
                "Sender_ID": sender_id,
                "Created_at": datetime.now().isoformat()
            }
            notifications.append(notif)

        # Step 4: Batch insert notifications
        response = supabase.table("Notifications").insert(notifications).execute()
        if response.error:
            print(f"❌ Error inserting notifications: {response.error}")
            return {"status": "error", "message": "Failed to send notifications"}

        print(f"✅ Sent notifications to {len(notifications)} students in course {course_code}")
        return {"status": "success", "count": len(notifications)}

    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return {"status": "error", "message": str(e)}