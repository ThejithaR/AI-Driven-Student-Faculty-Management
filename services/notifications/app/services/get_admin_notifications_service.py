from app.db import supabase

async def get_admin_notifications(data: dict):
    faculty_id = data.get("facultyId")
    print(f"📥 Retrieving notifications sent by faculty: {faculty_id}")

    if not faculty_id:
        return {"status": "error", "message": "Faculty ID is required"}

    try:
        # Query the database for notifications sent by the admin
        response = supabase.table("Notifications").select("*").eq("Sender_ID", faculty_id).execute()

        if response.error:
            print(f"❌ Error fetching admin notifications: {response.error}")
            return {"status": "error", "message": "Failed to fetch admin notifications"}

        notifications = response.data
        print(f"✅ Admin notifications retrieved: {notifications}")

        return {"status": "success", "notifications": notifications}
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return {"status": "error", "message": str(e)}