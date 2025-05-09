from fastapi import FastAPI
import asyncio
from app.rabbitmq.consumer import consume

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume())

@app.get("/")
async def root():
    return {"message": "Notifications Service Running 🚀"}