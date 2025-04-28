from fastapi import APIRouter, HTTPException
from models.exam import ExamCreateRequest, ExamUpdateRequest
from crud.exam_crud import (
    check_exam_clash,
    create_exam,
    get_exam_by_id,
    get_all_exams,
    update_exam,
    delete_exam
)

router = APIRouter()

@router.post("/exams/schedule")
def schedule_exam(exam: ExamCreateRequest):
    clash = check_exam_clash(
        group_id=exam.group_id,
        exam_date=exam.exam_date,
        start_time=exam.start_time,
        end_time=exam.end_time
    )

    if clash:
        raise HTTPException(status_code=400, detail="Exam clash detected! Group already has an exam at that time.")

    data = exam.dict()
    create_exam(data)

    return {"message": "Exam scheduled successfully."}

@router.get("/exams/{exam_id}")
def get_exam(exam_id: str):
    exam = get_exam_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    return exam


@router.get("/exams")
def list_exams():
    exams = get_all_exams()
    return exams

@router.put("/exams/{exam_id}")
def update_exam_route(exam_id: str, exam: ExamUpdateRequest):
    updated_data = exam.dict(exclude_unset=True)  # Only the fields user passed
    updated_exam = update_exam(exam_id, updated_data)
    if not updated_exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    return {"message": "Exam updated successfully."}


@router.delete("/exams/{exam_id}")
def delete_exam_route(exam_id: str):
    deleted = delete_exam(exam_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exam not found or delete failed.")
    return {"message": "Exam deleted successfully."}