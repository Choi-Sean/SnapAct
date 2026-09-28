"""Preprocessing. Shared by train / eval / export so the three cannot drift.

Resize mode matters here more than usual. Squashing everything to a square
throws away aspect ratio, and aspect ratio is a real discriminator in this
task (a receipt is long, a card is not). Letterbox keeps it, at the cost of
padding bars the model can also learn from. Default is letterbox; set
`data.resize_mode: stretch` in the config to compare.

Whatever is chosen must be reproduced exactly in Swift — export_coreml.py
folds normalization into the .mlpackage, but the resize happens before the
model, so it goes in the interface doc.
"""

from __future__ import annotations

from PIL import Image
from torchvision import transforms

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Neutral grey rather than black: black bars read as "dark photo" to the
# lighting-sensitive features we are about to train on.
LETTERBOX_FILL = (128, 128, 128)


class LetterboxResize:
    """Resize preserving aspect ratio, pad the remainder to a square."""

    def __init__(self, size: int, fill=LETTERBOX_FILL):
        self.size = size
        self.fill = fill

    def __call__(self, img: Image.Image) -> Image.Image:
        w, h = img.size
        scale = self.size / max(w, h)
        new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
        img = img.resize((new_w, new_h), Image.BILINEAR)

        canvas = Image.new("RGB", (self.size, self.size), self.fill)
        canvas.paste(img, ((self.size - new_w) // 2, (self.size - new_h) // 2))
        return canvas

    def __repr__(self) -> str:
        return f"{type(self).__name__}(size={self.size})"


def build_transform(input_size: int = 224, *, resize_mode: str = "letterbox", train: bool = False):
    if resize_mode == "letterbox":
        resize = LetterboxResize(input_size)
    elif resize_mode == "stretch":
        resize = transforms.Resize((input_size, input_size))
    else:
        raise ValueError(f"unknown resize_mode {resize_mode!r}; expected letterbox|stretch")

    steps = [resize]
    if train:
        # Photometric-only here. Geometric distortion (perspective, rotation,
        # occlusion) is baked into the synthetic images by synth/augment.py so
        # that real training photos are not warped twice.
        steps.append(transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2))

    steps += [transforms.ToTensor(), transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)]
    return transforms.Compose(steps)
