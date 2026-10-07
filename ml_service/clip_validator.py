import os
from dataclasses import dataclass

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

import open_clip
import torch
from PIL import Image


CLIP_LABELS = ["brain CT scan", "not a brain CT scan"]
DEFAULT_CLIP_MODEL = "ViT-B-32"
DEFAULT_CLIP_PRETRAINED = "openai"


@dataclass
class ClipValidationResult:
    is_brain_ct: bool
    label: str
    confidence: float
    scores: dict[str, float]


class ClipBrainCtValidator:
    def __init__(self, device: torch.device):
        self.device = device
        self.brain_ct_threshold = float(os.getenv("CLIP_BRAIN_CT_THRESHOLD", "0.55"))
        self.not_brain_ct_threshold = float(os.getenv("CLIP_NOT_BRAIN_CT_THRESHOLD", "0.75"))
        self.model_name = os.getenv("CLIP_MODEL_NAME", DEFAULT_CLIP_MODEL)
        self.pretrained = os.getenv("CLIP_PRETRAINED", DEFAULT_CLIP_PRETRAINED)
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            self.model_name,
            pretrained=self.pretrained,
            device=device,
        )
        self.tokenizer = open_clip.get_tokenizer(self.model_name)
        self.model.eval()

    def validate(self, image: Image.Image) -> ClipValidationResult:
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        text_input = self.tokenizer(CLIP_LABELS).to(self.device)

        with torch.inference_mode():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_input)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            logits = 100.0 * image_features @ text_features.T
            probabilities = logits.softmax(dim=1)[0].detach().cpu()

        scores = {
            label: round(float(score), 4)
            for label, score in zip(CLIP_LABELS, probabilities)
        }
        brain_ct_score = scores["brain CT scan"]
        not_brain_ct_score = scores["not a brain CT scan"]

        is_confident_not_brain_ct = (
            not_brain_ct_score >= self.not_brain_ct_threshold
            and not_brain_ct_score > brain_ct_score
        )

        return ClipValidationResult(
            is_brain_ct=not is_confident_not_brain_ct,
            label="brain CT scan" if brain_ct_score >= not_brain_ct_score else "not a brain CT scan",
            confidence=max(brain_ct_score, not_brain_ct_score),
            scores=scores,
        )
