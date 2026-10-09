import os
import urllib.request
from pathlib import Path
import torch
from torch import nn
from torchvision import models


class EfficientNetBiLSTM(nn.Module):
    def __init__(self, num_classes: int = 3):
        super().__init__()
        self.features = models.efficientnet_b0(weights=None).features
        self.conv = nn.Conv2d(1280, 256, kernel_size=1)
        self.lstm = nn.LSTM(
            input_size=256,
            hidden_size=128,
            batch_first=True,
            bidirectional=True,
        )
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.conv(x)
        x = x.flatten(2).transpose(1, 2)
        x, _ = self.lstm(x)
        x = x[:, -1, :]
        return self.fc(x)


def load_model(model_path: Path, device: torch.device) -> EfficientNetBiLSTM:
    # Check if missing or invalid HTML/LFS pointer (< 1 MB)
    if not model_path.exists() or model_path.stat().st_size < 1_000_000:
        model_url = os.getenv("MODEL_URL")
        if not model_url:
            raise RuntimeError("model.pth missing and MODEL_URL not set.")

        print(f"Downloading binary model from {model_url}...")
        model_path.parent.mkdir(parents=True, exist_ok=True)
        # gdown automatically handles Google Drive confirmations & redirects
        gdown.download(model_url, str(model_path), quiet=False, fuzzy=True)
        print(f"Download complete: {model_path.stat().st_size} bytes.")

    model = EfficientNetBiLSTM(num_classes=3)
    state_dict = torch.load(model_path, map_location=device, weights_only=False)

    if isinstance(state_dict, dict) and "state_dict" in state_dict:
        state_dict = state_dict["state_dict"]
    elif isinstance(state_dict, dict) and "model_state_dict" in state_dict:
        state_dict = state_dict["model_state_dict"]

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model