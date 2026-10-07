import os
import time
from io import BytesIO
from pathlib import Path

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from clip_validator import ClipBrainCtValidator
from model import load_model


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PATH = BASE_DIR.parent / "model.pth"
MODEL_PATH = Path(os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)).resolve()
CLASS_NAMES = [
    label.strip()
    for label in os.getenv("CLASS_NAMES", "Normal,Bleeding,Ischemia").split(",")
]
if len(CLASS_NAMES) != 3:
    CLASS_NAMES = ["Normal", "Bleeding", "Ischemia"]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

preprocess = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)

app = FastAPI(title="CT Scan Inference Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

model = load_model(MODEL_PATH, DEVICE)
clip_validator = ClipBrainCtValidator(DEVICE)


def read_image(image_bytes: bytes) -> Image.Image:
    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image") from exc


def is_brain_ct(image: Image.Image):
    return clip_validator.validate(image)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "model_path": str(MODEL_PATH),
        "classes": CLASS_NAMES,
        "clip_model": clip_validator.model_name,
        "clip_pretrained": clip_validator.pretrained,
        "clip_brain_ct_threshold": clip_validator.brain_ct_threshold,
        "clip_not_brain_ct_threshold": clip_validator.not_brain_ct_threshold,
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    started = time.perf_counter()
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    pil_image = read_image(image_bytes)
    validation = is_brain_ct(pil_image)
    if not validation.is_brain_ct:
        return {
            "class_index": None,
            "predicted_class": "Other",
            "prediction": "Other",
            "confidence": validation.confidence,
            "probabilities": {
                "Other": validation.confidence,
            },
            "validation": {
                "label": validation.label,
                "scores": validation.scores,
            },
            "processing_time_ms": round((time.perf_counter() - started) * 1000, 2),
        }

    tensor = preprocess(pil_image).unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        confidence, class_index = torch.max(probabilities, dim=0)

    predicted_index = int(class_index.item())
    return {
        "class_index": predicted_index,
        "predicted_class": CLASS_NAMES[predicted_index],
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": round(float(confidence.item()), 4),
        "probabilities": {
            CLASS_NAMES[index]: round(float(value), 4)
            for index, value in enumerate(probabilities.cpu())
        },
        "validation": {
            "label": validation.label,
            "scores": validation.scores,
        },
        "processing_time_ms": round((time.perf_counter() - started) * 1000, 2),
    }



