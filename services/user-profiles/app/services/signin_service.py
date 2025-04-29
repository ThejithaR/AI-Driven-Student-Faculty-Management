async def handle_signin(data: dict):
    print(f"✅ Handling signin: {data}")
    return {"status": "success", "message": "User signed in successfully"}
    # Your signup logic here
