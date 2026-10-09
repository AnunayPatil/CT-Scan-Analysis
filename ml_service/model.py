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
    # Check if the file is missing or is just a Git LFS text pointer (< 1 MB)
    if not model_path.exists() or model_path.stat().st_size < 1_000_000:
        model_url = os.getenv("MODEL_URL")
        if not model_url:
            raise RuntimeError(
                f"Model file at {model_path} is an LFS pointer text file ({model_path.stat().st_size if model_path.exists() else 0} bytes), and MODEL_URL environment variable is not configured."
            )
        print(f"Downloading full binary weights from {model_url}...")
        model_path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(model_url, str(model_path))
        print(f"Downloaded model weights successfully ({model_path.stat().st_size} bytes).")

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