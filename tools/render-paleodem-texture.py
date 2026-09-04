"""Render an equirectangular Deep Lens texture from a PALEOMAP PaleoDEM grid.

Requires Pillow, numpy, and netCDF4. The source grid is kept outside the public
bundle; only the rendered PNG is loaded by the browser.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import netCDF4
import numpy as np
from PIL import Image, ImageDraw


COLOR_STOPS = (
    (-6000.0, (5, 20, 29)),
    (-3000.0, (7, 42, 55)),
    (-800.0, (14, 72, 86)),
    (-200.0, (31, 105, 116)),
    (-1.0, (67, 139, 139)),
    (0.0, (164, 147, 104)),
    (200.0, (153, 132, 86)),
    (800.0, (131, 106, 71)),
    (1800.0, (111, 86, 66)),
    (3000.0, (190, 180, 155)),
)


def colorize(elevation: np.ndarray) -> np.ndarray:
    stops = np.asarray([stop[0] for stop in COLOR_STOPS], dtype=np.float32)
    colors = np.asarray([stop[1] for stop in COLOR_STOPS], dtype=np.float32)
    channels = [np.interp(elevation, stops, colors[:, index]) for index in range(3)]
    return np.stack(channels, axis=-1).clip(0, 255).astype(np.uint8)


def render(source: Path, destination: Path) -> None:
    with netCDF4.Dataset(source) as dataset:
        latitudes = np.asarray(dataset.variables["lat"][:])
        elevation = np.asarray(dataset.variables["z"][:], dtype=np.float32)

    # Cesium expects north at the top of a global equirectangular image.
    if latitudes[0] < latitudes[-1]:
        elevation = np.flipud(elevation)

    # The source contains both -180 and +180. Keep one edge to avoid a seam.
    elevation = elevation[:, :-1]
    image = Image.fromarray(colorize(elevation), mode="RGB")
    image = image.resize((2048, 1024), Image.Resampling.BILINEAR)

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for longitude in range(-150, 180, 30):
        x = round((longitude + 180) / 360 * image.width)
        draw.line((x, 0, x, image.height), fill=(209, 223, 203, 15), width=1)
    for latitude in range(-60, 90, 30):
        y = round((90 - latitude) / 180 * image.height)
        draw.line((0, y, image.width, y), fill=(209, 223, 203, 15), width=1)

    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    render(args.source, args.destination)


if __name__ == "__main__":
    main()
