FROM python:3.10-slim

WORKDIR /app

# Force Python output directly to the terminal (so logs appear in Railway)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU first, then requirements
COPY ml_service/requirements.txt .
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir "uvicorn[standard]"

# Copy source code and model weights
COPY ml_service/ ./ml_service/
COPY model.pth .

WORKDIR /app/ml_service

EXPOSE 8000

# Shell form expands ${PORT:-8000} properly on Railway
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}