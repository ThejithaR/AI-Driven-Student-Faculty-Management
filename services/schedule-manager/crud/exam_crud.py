from database import supabase

def check_exam_clash(group_id: str, exam_date: str, start_time: str, end_time: str):
    response = supabase.table("Exams").select("*").eq("group_id", group_id).eq("exam_date", exam_date).execute()
    exams = response.data

    for exam in exams:
        if not (end_time <= exam["start_time"] or start_time >= exam["end_time"]):
            return True  # clash exists

    return False  # no clash

def create_exam(data: dict):
    response = supabase.table("Exams").insert(data).execute()
    return response


def get_exam_by_id(exam_id: str):
    response = supabase.table("Exams").select("*").eq("id", exam_id).single().execute()
    return response.data

def get_all_exams():
    response = supabase.table("Exams").select("*").execute()
    return response.data

def update_exam(exam_id: str, update_data: dict):
    response = supabase.table("Exams").update(update_data).eq("id", exam_id).execute()
    if response.data:
        return response.data
    return None

def delete_exam(exam_id: str):
    response = supabase.table("Exams").delete().eq("id", exam_id).execute()
    if response.data:
        return response.data
    return None
