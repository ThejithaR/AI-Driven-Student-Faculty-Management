from app.supabase.supabaseClient import supabase

async def handle_signin(data: dict):
    print(f"✅ Handling signin: {data}")

    response = supabase.auth.sign_in_with_password(
        {
            "email": data.get("email"), 
            "password": data.get("password"),
        }
    )

    print(f"Response: {response}")
    print(f"Error: {response.error}")
    if response.error:
        print(f"⚠️ Signin error: {response.error}")
        return {"status": "error", "message": "Signin failed", "error": response.error}

    return {"status": "success", "message": "User signed in successfully", "data": response.data}
    # Your signin logic here
