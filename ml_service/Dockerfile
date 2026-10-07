FROM python:3.10-slim

WORKDIR /app

# Install dependencies needed for some Python packages (like opencv, etc. if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY ml_service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the ML service code
COPY ml_service/ ./ml_service/

# Copy the model file
COPY model.pth .

# Set working directory to ml_service so uvicorn can find main.py easily
WORKDIR /app/ml_service

# Pre-download the CLIP model so it doesn't happen on startup
RUN python -c "import open_clip; open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')"

# Expose FastAPI port
EXPOSE 8000

# Start the FastAPI service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
