# Use an official Python base image
FROM python:3.10-slim

# Install system dependencies for face_recognition
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgtk2.0-dev \
    libboost-all-dev \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy everything in attendance service
COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose port
EXPOSE 8000

# Start the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
