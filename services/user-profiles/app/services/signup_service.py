import re
from datetime import datetime
from app.supabase.supabaseClient import supabase
from app.assets.departments import departments

# Two patterns: student with batch, lecturer without batch
STUDENT_EMAIL_PATTERN = re.compile(r'^([a-zA-Z]+)\.(\d{2})@([a-z]+)\.lk$')
LECTURER_EMAIL_PATTERN = re.compile(r'^([a-zA-Z]+)@([a-z]+)\.lk$')

async def handle_signup(data: dict):
    print(f"✅ Handling signup: {data}")

    email = data.get("email")
    password = data.get("password")
    display_name = data.get("username")

    match = STUDENT_EMAIL_PATTERN.match(email)
    print(f"Match: {match}")
    if match:
        name, batch_str, dep = match.groups()
        role = "student"
        batch = int(batch_str)
        year = datetime.now().year - (2000 + batch)
        semester = 1 if datetime.now().month < 7 else 2
        print(f"Name: {name}, Batch: {batch}, Department: {dep}, Role: {role}, Year: {year}, Semester: {semester}")
    else:
        match = LECTURER_EMAIL_PATTERN.match(email)
        print(f"Match: {match}")
        if match:
            name, dep = match.groups()
            role = "lecturer"
            print(f"Name: {name}, Department: {dep}, Role: {role}")
        else:
            return {"status": "error", "message": "Email must be in the format name.22@dep.lk or name@dep.lk"}

    if dep not in departments:
        return {"status": "error", "message": "Invalid department"}
    else:
        department = departments[dep][0]
        faculty = departments[dep][1]

    response = supabase.auth.sign_up({
        "email": email,
        "password": password,
        "options": {
            "data": {
                "role": role,
                "display_name": display_name,
            }
        }
    })

    #print(f"Response: {response}")

    if role == "student":

        last_reg_number = supabase.table("Student profiles") \
            .select("reg_number") \
            .ilike("reg_number", f"{batch}%") \
            .order("reg_number", desc=True) \
            .limit(1) \
            .execute()
        print(f"Last reg number: {last_reg_number}")

        next_reg_number = int(last_reg_number.data[0]["reg_number"]) + 1 if last_reg_number.data else batch * 10000 + 1

        student = supabase.table("Student profiles").insert({
            "UID": response.user.id,
            "reg_number": str(next_reg_number),
            "name": display_name,
            "faculty": faculty,
            "department": department,
            "year_of_study": year,
            "semester": semester,
        }).execute()

        print(f"Student profile created: {student}")

    if role == "lecturer":
        lecturer = supabase.table("faculty_member_profiles").insert({
            "UID": response.user.id,
            "reg_number": None,
            "name": display_name,
            "designation": response.user.user_metadata.get("role"),
            "faculty": faculty,
            "department": department,
        }).execute()

        print(f"Lecturer profile created: {lecturer}")

    return {
        "status": "success",
        "message": "User signed up successfully",
        "data": {
            "id": response.user.id,
            "email": response.user.email,
            "role": response.user.user_metadata.get("role"),
            "name": response.user.user_metadata.get("display_name")
        }
    }
