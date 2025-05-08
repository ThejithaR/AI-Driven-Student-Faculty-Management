from app.supabase.supabaseClient import supabase

async def get_enrolled_courses(data: dict):
    reg_number = data.get("reg_number")
    try:
        response = (
            supabase
            .from_("Enrollments")
            .select("Courses(*)")
            .eq("reg_number", reg_number)
            .execute()
        )

        # if response.error:
        #     raise Exception(f"Error fetching enrolled courses: {response.status_code} - {response.error}")

        # Flatten "Courses" into top-level dicts
        enrolled_courses = [row["Courses"] for row in response.data if "Courses" in row]

        print(f"✅ Enrolled Courses: {enrolled_courses}")
        return enrolled_courses

    except Exception as e:
        raise Exception(f"An error occurred while fetching enrolled courses: {str(e)}")
    
async def get_eligible_courses(data: dict):
    reg_number = data.get("reg_number")
    try:
        # Step 1: Get student's semester
        student_response = (
            supabase
            .from_("Student profiles")
            .select("semester")
            .eq("reg_number", reg_number)
            .single()
            .execute()
        )

        # if student_response:
        #     raise Exception(f"Failed to fetch semester: {student_response.error}")

        semester = student_response.data["semester"]
        print(f"🎓 Student Semester: {semester}")

        # Step 2: Get eligible courses for that semester
        courses_response = (
            supabase
            .from_("Courses")
            .select("*")
            .eq("semester", semester)
            .execute()
        )

        # if courses_response:
        #     raise Exception(f"Failed to fetch courses: {courses_response.error}")

        print(f"✅ Eligible Courses: {courses_response.data}")
        return courses_response.data

    except Exception as e:
        raise Exception(f"An error occurred while fetching eligible courses: {str(e)}")
    
async def get_assigned_courses(data: dict):
    reg_number = data.get("reg_number")
    try:
        response = (
            supabase
            .from_("Assigned")
            .select("Courses(*)")
            .eq("lecturer_reg_number", reg_number)
            .execute()
        )

        # if response.error:
        #     raise Exception(f"Error fetching assigned courses: {response.status_code} - {response.error}")

        # Flatten "Courses" into top-level dicts
        assigned_courses = [row["Courses"] for row in response.data if "Courses" in row]

        print(f"✅ Assigned Courses: {assigned_courses}")
        return assigned_courses

    except Exception as e:
        raise Exception(f"An error occurred while fetching assigned courses: {str(e)}")
    
async def get_all_courses():
    try:
        response = (
            supabase
            .from_("Courses")
            .select("*")
            .execute()
        )

        # if response.error:
        #     raise Exception(f"Error fetching all courses: {response.status_code} - {response.error}")

        print(f"✅ All Courses: {response.data}")
        return response.data
    except Exception as e: 
        raise Exception(f"An error occurred while fetching all courses: {str(e)}")
    
