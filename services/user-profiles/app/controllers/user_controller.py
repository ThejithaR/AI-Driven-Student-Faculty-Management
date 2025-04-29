from app.services.signup_service import handle_signup
from app.services.signin_service import handle_signin
from app.services.profile_update_service import handle_profile_update
from app.services.get_user_service import get_user as handle_get_user
from fastapi import APIRouter, Request

async def handle_message(payload: dict):
    action = payload.get("action")
    data = payload.get("payload")

    response = None

    if action == "signUp":
        response = await handle_signup(data)
    elif action == "signIn":
        response = await handle_signin(data)
    elif action == "updateProfile":
        response = await handle_profile_update(data)
    elif action == "getUser":
        response = await handle_get_user(data)
    else:
        print(f"⚠️ Unknown action received: {action}")
        response = {"error": "Unknown action"}

    return response