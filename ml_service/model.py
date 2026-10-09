import gc
from pathlib import Path
import gdown
import torch
from torch import nn

GDRIVE_FILE_ID = "1L4bM_TjBKAT_B5iIF1INbOdfb71IodB7"


def load_model(model_path: Path, device: torch.device):
    # Download weights if missing or pointer (< 1 MB)
    if not model_path.exists() or model_path.stat().st_size < 1_000_000:
        print("Downloading binary weights via gdown...")
        model_path.parent.mkdir(parents=True, exist_ok=True)
        gdown.download(id=GDRIVE_FILE_ID, output=str(model_path), quiet=False)
        print(f"Downloaded model weights: {model_path.stat().st_size} bytes")

    # Keep single-thread CPU to avoid thread memory multiplication
    torch.set_num_threads(1)
    gc.collect()

    try:
        # Load TorchScript model directly
        model = torch.jit.load(str(model_path), map_location=device)
    except Exception:
        # Fallback if state dict
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

        model = EfficientNetBiLSTM(num_classes=3)
        state_dict = torch.load(model_path, map_location=device, weights_only=False)
        if isinstance(state_dict, dict) and "state_dict" in state_dict:
            state_dict = state_dict["state_dict"]
        elif isinstance(state_dict, dict) and "model_state_dict" in state_dict:
            state_dict = state_dict["model_state_dict"]
        model.load_state_dict(state_dict)

    gc.collect()
    model.to(device)
    model.eval()
    return model