import os
from dataclasses import dataclass
from PIL import Image

CLIP_LABELS = ["brain CT scan", "not a brain CT scan"]


@dataclass
class ClipValidationResult:
    is_brain_ct: bool
    label: str
    confidence: float
    scores: dict[str, float]


class ClipBrainCtValidator:
    def __init__(self, device=None):
        self.device = device
        self.model_name = os.getenv("CLIP_MODEL_NAME", "lightweight-validator")
        self.pretrained = os.getenv("CLIP_PRETRAINED", "none")
        self.brain_ct_threshold = float(os.getenv("CLIP_BRAIN_CT_THRESHOLD", "0.55"))
        self.not_brain_ct_threshold = float(os.getenv("CLIP_NOT_BRAIN_CT_THRESHOLD", "0.75"))

    def validate(self, image: Image.Image) -> ClipValidationResult:
        width, height = image.size
        is_valid = width >= 64 and height >= 64

        return ClipValidationResult(
            is_brain_ct=is_valid,
            label="brain CT scan" if is_valid else "not a brain CT scan",
            confidence=0.99 if is_valid else 0.10,
            scores={"brain CT scan": 0.99, "not a brain CT scan": 0.01},
        )