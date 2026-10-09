FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MALLOC_TRIM_THRESHOLD_=100000 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY ml_service/requirements.txt .
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir "uvicorn[standard]" gdown

COPY ml_service/ ./ml_service/

WORKDIR /app/ml_service

# Allow Railway to route to dynamic PORT, fallback to 8080
ENV PORT=8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]