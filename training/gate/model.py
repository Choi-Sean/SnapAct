"""MobileNetV3-Small backbone + 5-logit head (track A).

Lives here rather than inside train_gate.py because eval and export must
build the *same* architecture to load a checkpoint. Emits raw LOGITS:
sigmoid is applied by BCEWithLogitsLoss during training and baked into the
exported model at export time, so it is never applied twice.
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torchvision

from .classes import CLASSES, NUM_CLASSES


def build_model(pretrained: bool = True, dropout: float = 0.2) -> nn.Module:
    weights = (
        torchvision.models.MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
    )
    model = torchvision.models.mobilenet_v3_small(weights=weights)

    # classifier == Sequential(Linear(576,1024), Hardswish, Dropout, Linear(1024,1000))
    in_features = model.classifier[-1].in_features
    model.classifier[-2] = nn.Dropout(p=dropout, inplace=True)
    model.classifier[-1] = nn.Linear(in_features, NUM_CLASSES)
    return model


def save_checkpoint(path, model: nn.Module, meta: dict | None = None) -> None:
    torch.save(
        {
            "state_dict": model.state_dict(),
            # Stored so a checkpoint can never be silently loaded against a
            # different class order than it was trained with.
            "classes": list(CLASSES),
            "meta": meta or {},
        },
        path,
    )


def load_checkpoint(path, device: torch.device, dropout: float = 0.2) -> tuple[nn.Module, dict]:
    ckpt = torch.load(path, map_location=device, weights_only=False)

    saved = tuple(ckpt.get("classes", ()))
    if saved and saved != CLASSES:
        raise ValueError(
            "checkpoint class order does not match gate.classes.CLASSES.\n"
            f"  checkpoint: {saved}\n"
            f"  current:    {CLASSES}\n"
            "Reordering CLASSES silently breaks the app's positional indexing."
        )

    model = build_model(pretrained=False, dropout=dropout)
    model.load_state_dict(ckpt["state_dict"])
    model.to(device).eval()
    return model, ckpt.get("meta", {})


def resolve_device(spec: str = "auto") -> torch.device:
    if spec != "auto":
        return torch.device(spec)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")
