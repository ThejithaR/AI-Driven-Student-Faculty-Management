from fastapi import FastAPI

# Import your routers
from routers.exam_routes import router as exam_router

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# Include routers
app.include_router(exam_router, prefix="/api")