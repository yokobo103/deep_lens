"""Cut the icon sheet into the app's two faces.

The set arrives as one RGBA sheet: a grid of drawings whose alpha already holds
clean silhouettes. Every icon is emitted twice, because in this app a thing has
two faces — alive and left behind.

    src/assets/icons/color/<id>.png   the drawing as-is, for the living Earth
    src/assets/icons/trace/<id>.png   the same drawing in browns, for what is left

Re-run this after replacing the sheet. Nothing else needs to change: the app
reads whatever files are in those folders.

    python tools/build-icons.py <sheet.png>

The grid is found from the alpha channel rather than hard-coded, so a redrawn
sheet with slightly different spacing still cuts correctly. Order is read
left-to-right, top-to-bottom against ICON_ORDER.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COLOR_DIR = ROOT / "src" / "assets" / "icons" / "color"
TRACE_DIR = ROOT / "src" / "assets" / "icons" / "trace"

#: The present is one colour. A flat silhouette was tried first and lost every
#: shell rib and spiral, because these drawings carry their shape in interior
#: lines; mapping luminance onto a brown ramp keeps all of it and still leaves
#: the whole present-day Earth in a single quiet family of colour.
TRACE_RAMP = ((0.0, (44, 30, 18)), (0.45, (108, 76, 46)), (0.78, (168, 126, 82)), (1.0, (214, 180, 134)))

#: Reading order of the sheet. Empty trailing cells are allowed.
ICON_ORDER = [
    "world-sea", "world-delta", "world-river", "world-dryland", "life-theropod", "life-spinosaur",
    "life-sauropod", "life-ornithopod", "life-crocodilian", "life-pterosaur", "life-shark", "life-ray",
    "life-fish", "life-ammonite", "life-bivalve", "life-conifer", "life-fern", "trace-bone",
    "trace-frond", "trace-coiled-shell", "trace-bivalve-shell", "trace-leaf-impression", "trace-footprint",
]

OUTPUT_SIZE = 128
#: How much of its square each icon fills. Uniform occupancy matters more than
#: uniform crops: the time shift morphs one icon into another, and a pair that
#: disagrees on scale reads as a swap rather than a change.
OCCUPANCY = 0.84
ALPHA_THRESHOLD = 150


def bands(profile: np.ndarray, minimum_length: int = 12) -> list[tuple[int, int]]:
    threshold = profile.max() * 0.05
    found: list[tuple[int, int]] = []
    start: int | None = None
    for index, value in enumerate(profile):
        if value > threshold and start is None:
            start = index
        elif value <= threshold and start is not None:
            if index - start > minimum_length:
                found.append((start, index))
            start = None
    if start is not None:
        found.append((start, len(profile)))
    return found


def to_trace(icon: Image.Image) -> Image.Image:
    """The same drawing with the life taken out of it: brown, but not flat."""
    rgba = np.asarray(icon, dtype=np.float32)
    luminance = (rgba[..., 0] * 0.299 + rgba[..., 1] * 0.587 + rgba[..., 2] * 0.114) / 255.0
    stops = np.asarray([stop for stop, _ in TRACE_RAMP], dtype=np.float32)
    colours = np.asarray([colour for _, colour in TRACE_RAMP], dtype=np.float32)
    channels = [np.interp(luminance, stops, colours[:, index]) for index in range(3)]
    out = np.dstack([*channels, rgba[..., 3]]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def normalise(cell: np.ndarray, alpha: np.ndarray) -> Image.Image:
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    crop = cell[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    height, width = crop.shape[:2]
    side = int(max(height, width) / OCCUPANCY)
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    top, left = (side - height) // 2, (side - width) // 2
    canvas[top:top + height, left:left + width] = crop
    return Image.fromarray(canvas, "RGBA").resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("sheet", type=Path)
    args = parser.parse_args()

    sheet = np.asarray(Image.open(args.sheet).convert("RGBA"))
    solid = sheet[..., 3] > 190
    rows = bands(solid.sum(axis=1))
    columns = bands(solid.sum(axis=0))
    print(f"grid: {len(rows)} rows x {len(columns)} columns")

    COLOR_DIR.mkdir(parents=True, exist_ok=True)
    TRACE_DIR.mkdir(parents=True, exist_ok=True)
    for stale in (*COLOR_DIR.glob("*.png"), *TRACE_DIR.glob("*.png")):
        stale.unlink()

    pad = 14
    written = 0
    for index, name in enumerate(ICON_ORDER):
        row, column = divmod(index, len(columns))
        if row >= len(rows):
            break
        y0, y1 = rows[row]
        x0, x1 = columns[column]
        cell = sheet[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
        if (cell[..., 3] > ALPHA_THRESHOLD).sum() < 400:
            print(f"  {name}: empty cell, skipped")
            continue

        icon = normalise(cell, cell[..., 3])
        icon.save(COLOR_DIR / f"{name}.png", optimize=True)

        to_trace(icon).save(TRACE_DIR / f"{name}.png", optimize=True)
        written += 1

    colour_size = sum(f.stat().st_size for f in COLOR_DIR.glob("*.png"))
    trace_size = sum(f.stat().st_size for f in TRACE_DIR.glob("*.png"))
    print(f"{written} icons -> color {colour_size / 1024:.0f} KB + trace {trace_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
