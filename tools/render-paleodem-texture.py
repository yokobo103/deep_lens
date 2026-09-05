"""Render an equirectangular Deep Lens texture from a PALEOMAP PaleoDEM grid.

Requires Pillow, numpy, and netCDF4. The source grid is kept outside the public
bundle; only the rendered image is loaded by the browser.

The source is 1x1 degree — about 111 km per cell — and no amount of rendering
adds information that is not in it. What earlier versions did was stretch that
grid 5.7x with a bilinear filter, which spent 2048x1024 pixels carrying
359x180 of actual data and looked soft everywhere. This version spends the same
pixels on the three things the grid genuinely supports:

  * a shoreline drawn as the 0 m boundary of the field rather than a gradient,
    so the one edge the eye looks for is a line instead of a blur;
  * relief shading derived from the real elevations, which gives basins and
    highlands form without inventing any;
  * depth bands at the shelf break and below, because a Cretaceous epeiric sea
    is the thing this app is usually asking about.

Interpolation is still interpolation: the coastline is where the model's 0 m
contour falls, not a surveyed shore. Keep saying 1 degree in the credit.
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

#: Depths that get a faint line. The shelf break is the one that matters most:
#: it separates a shallow sea a river could reach from open ocean.
DEPTH_CONTOURS = (-200.0, -1000.0, -3000.0)
LAND_CONTOURS = (500.0, 1500.0)

OUTPUT_SIZE = (4096, 2048)
#: 1 degree cells make real slopes almost flat, so relief needs some
#: exaggeration to read at all. Push it far and the bicubic ripples between
#: cells turn into mountain ranges that are not in the data — an earlier pass
#: at 190 made the Sahara look like crumpled foil. Keep it low enough that only
#: features a 111 km cell can actually resolve show up.
RELIEF_EXAGGERATION = 34.0


def colorize(elevation: np.ndarray) -> np.ndarray:
    stops = np.asarray([stop[0] for stop in COLOR_STOPS], dtype=np.float32)
    colors = np.asarray([stop[1] for stop in COLOR_STOPS], dtype=np.float32)
    channels = [np.interp(elevation, stops, colors[:, index]) for index in range(3)]
    return np.stack(channels, axis=-1).clip(0, 255).astype(np.uint8)


def upsample(field: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Resample elevation itself, so shading and contours agree with the fill."""
    image = Image.fromarray(field.astype(np.float32), mode="F")
    return np.asarray(image.resize(size, Image.Resampling.BICUBIC), dtype=np.float32)


def smooth(field: np.ndarray, radius: int) -> np.ndarray:
    """Separable box blur, applied only to the copy the shading reads."""
    kernel = np.ones(radius * 2 + 1, dtype=np.float32) / (radius * 2 + 1)
    padded = np.pad(field, ((radius, radius), (radius, radius)), mode="edge")
    rows = np.apply_along_axis(lambda row: np.convolve(row, kernel, mode="valid"), 1, padded)
    return np.apply_along_axis(lambda col: np.convolve(col, kernel, mode="valid"), 0, rows)


def relief(elevation: np.ndarray) -> np.ndarray:
    """Hillshade with the light in the usual cartographic corner (north-west)."""
    dy, dx = np.gradient(elevation * RELIEF_EXAGGERATION)
    slope = np.arctan(np.hypot(dx, dy) / 1000.0)
    aspect = np.arctan2(-dx, dy)
    altitude = np.radians(45.0)
    azimuth = np.radians(315.0)
    shade = (
        np.sin(altitude) * np.cos(slope)
        + np.cos(altitude) * np.sin(slope) * np.cos(azimuth - aspect)
    )
    return np.clip(shade, 0.0, 1.0)


def boundary_mask(field: np.ndarray, level: float) -> np.ndarray:
    """Pixels where the field crosses `level` between neighbours."""
    above = field >= level
    crossing = np.zeros_like(above)
    crossing[:, :-1] |= above[:, :-1] != above[:, 1:]
    crossing[:-1, :] |= above[:-1, :] != above[1:, :]
    return crossing


def render(source: Path, destination: Path) -> None:
    with netCDF4.Dataset(source) as dataset:
        latitudes = np.asarray(dataset.variables["lat"][:])
        elevation = np.asarray(dataset.variables["z"][:], dtype=np.float32)

    # Cesium expects north at the top of a global equirectangular image.
    if latitudes[0] < latitudes[-1]:
        elevation = np.flipud(elevation)

    # The source contains both -180 and +180. Keep one edge to avoid a seam.
    elevation = elevation[:, :-1]
    source_shape = elevation.shape

    field = upsample(elevation, OUTPUT_SIZE)
    # A touch of smoothing before shading, or every 1 degree cell edge becomes a
    # visible terrace. This blurs the shading, never the coastline or the fill.
    shading_field = smooth(field, radius=7)

    rgb = colorize(field).astype(np.float32)

    shade = relief(shading_field)[..., None]
    # The seafloor takes a lighter touch than the land: bathymetry at 1 degree is
    # softer evidence than topography, and it should not shout.
    land = (field >= 0.0)[..., None]
    strength = np.where(land, 0.30, 0.16)
    rgb *= (1.0 - strength) + strength * (0.55 + 0.95 * shade)

    for level in DEPTH_CONTOURS:
        rgb[boundary_mask(field, level)] *= 0.82
    for level in LAND_CONTOURS:
        rgb[boundary_mask(field, level)] *= 1.10

    # The shoreline last, so nothing draws over it.
    coast = boundary_mask(field, 0.0)
    rgb[coast] = np.asarray((233, 205, 150), dtype=np.float32)

    image = Image.fromarray(rgb.clip(0, 255).astype(np.uint8), mode="RGB")

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for longitude in range(-150, 180, 30):
        x = round((longitude + 180) / 360 * image.width)
        draw.line((x, 0, x, image.height), fill=(209, 223, 203, 13), width=1)
    for latitude in range(-60, 90, 30):
        y = round((90 - latitude) / 180 * image.height)
        draw.line((0, y, image.width, y), fill=(209, 223, 203, 13), width=1)
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")

    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.suffix.lower() == ".webp":
        image.save(destination, "WEBP", quality=90, method=6)
    else:
        image.save(destination, "PNG", optimize=True)
    print(f"source grid {source_shape[1]}x{source_shape[0]} -> {image.width}x{image.height} {destination.name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    render(args.source, args.destination)


if __name__ == "__main__":
    main()
