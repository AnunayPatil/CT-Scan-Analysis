FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY ml_service/requirements.txt .
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir "uvicorn[standard]"

# Copy all source files
COPY ml_service/ ./ml_service/
COPY model.pth /app/model.pth
COPY model.pth /app/ml_service/model.pth

WORKDIR /app/ml_service

EXPOSE 8000

CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}