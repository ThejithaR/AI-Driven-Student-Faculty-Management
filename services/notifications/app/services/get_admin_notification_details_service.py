from app.db import supabase

async def get_admin_notification_details(data: dict):
    notification_id = data.get("notificationId")
    print(f"📥 Retrieving details for admin notification: {notification_id}")

    if not notification_id:
        return {"status": "error", "message": "Notification ID is required"}

    try:
        # Query the database for the specific notification
        response = supabase.table("Notifications").select("*").eq("Notification_id", notification_id).single().execute()

        if response.error:
            print(f"❌ Error fetching admin notification details: {response.error}")
            return {"status": "error", "message": "Failed to fetch admin notification details"}

        notification = response.data
        print(f"✅ Admin notification details retrieved: {notification}")

        return {"status": "success", "notification": notification}
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return {"status": "error", "message": str(e)}