FROM python:3.10-slim

WORKDIR /app

# System libraries for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Base Python build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU first
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

# Copy & install the rest of requirements
COPY ml_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code & model weights
COPY ml_service/ ./ml_service/
COPY model.pth .

WORKDIR /app/ml_service

EXPOSE 8000

# Start via python -m uvicorn binding dynamically to Render's $PORT
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}