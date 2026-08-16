#!/usr/bin/env python3
"""Generate a nested voxel matryoshka (матрёшка) set.

Creates MagicaVoxel .vox files, dolls.json for the web viewer, and
isometric / front preview PNGs.
"""

from __future__ import annotations

import json
import math
import struct
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"
PREVIEWS = ROOT / "previews"


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


# Shared MagicaVoxel palette (index 0 unused; voxels use 1-based indices).
PALETTE_HEX = [
    "#000000",  # 0 placeholder
    "#E8C7A0",  # 1 skin
    "#D4A07A",  # 2 skin shadow
    "#F0DCC4",  # 3 skin light
    "#E89A8A",  # 4 blush
    "#1A120C",  # 5 hair / eyes
    "#3B2A1E",  # 6 hair mid
    "#F7F3EA",  # 7 white
    "#C62828",  # 8 lips
    "#8D6E4C",  # 9 wood dark
    "#E2C9A0",  # 10 wood / birch
    "#C4A574",  # 11 wood rim
    "#FFD54F",  # 12 gold
    "#F6C445",  # 13 gold deep
    "#FFF6C8",  # 14 gold light
    "#1B5E20",  # 15 leaf
    "#43A047",  # 16 leaf light
    "#0D3B12",  # 17 leaf dark
    "#B71C1C",  # 18 scarlet
    "#E53935",  # 19 rose
    "#FFCDD2",  # 20 rose light
    "#7F1010",  # 21 scarlet dark
    "#0D47A1",  # 22 blue
    "#1976D2",  # 23 blue mid
    "#82B1FF",  # 24 blue light
    "#05224A",  # 25 blue dark
    "#1B5E20",  # 26 green (dup leaf, reserved)
    "#2E7D32",  # 27 green mid
    "#A5D6A7",  # 28 green light
    "#F9A825",  # 29 yellow
    "#F57F17",  # 30 yellow deep
    "#FFF59D",  # 31 yellow light
    "#AD1457",  # 32 raspberry
    "#EC407A",  # 33 pink
    "#F8BBD0",  # 34 pink light
    "#880E4F",  # 35 raspberry dark
    "#4A148C",  # 36 plum
    "#7B1FA2",  # 37 plum mid
    "#E1BEE7",  # 38 plum light
    "#212121",  # 39 black trim
    "#6D4C41",  # 40 brown
    "#FF8A65",  # 41 peach flower
    "#FFB74D",  # 42 orange
    "#80CBC4",  # 43 teal accent
    "#FFF8E1",  # 44 cream apron
    "#F5E6C8",  # 45 linen
    "#D32F2F",  # 46 berry
    "#FCE4EC",  # 47 pale blush
    "#5D4037",  # 48 bark
]

PALETTE = [hex_rgb(h) for h in PALETTE_HEX]
while len(PALETTE) < 256:
    PALETTE.append((0, 0, 0))

# Named indices
SKIN, SKIN_D, SKIN_L, BLUSH = 1, 2, 3, 4
HAIR, HAIR_M, WHITE, LIPS = 5, 6, 7, 8
WOOD_D, WOOD, WOOD_RIM = 9, 10, 11
GOLD, GOLD_D, GOLD_L = 12, 13, 14
LEAF, LEAF_L, LEAF_D = 15, 16, 17
SCARLET, ROSE, ROSE_L, SCARLET_D = 18, 19, 20, 21
BLUE, BLUE_M, BLUE_L, BLUE_D = 22, 23, 24, 25
GREEN_M, GREEN_L = 27, 28
YELLOW, YELLOW_D, YELLOW_L = 29, 30, 31
RASP, PINK, PINK_L, RASP_D = 32, 33, 34, 35
PLUM, PLUM_M, PLUM_L = 36, 37, 38
BLACK, BROWN, PEACH_F, ORANGE = 39, 40, 41, 42
TEAL, CREAM, LINEN, BERRY, PALE, BARK = 43, 44, 45, 46, 47, 48


@dataclass
class DollSpec:
    name: str
    name_ru: str
    width: int
    height: int
    wall: int
    hollow: bool
    scarf: int
    scarf_d: int
    scarf_l: int
    dress: int
    dress_d: int
    apron: int
    flower: int
    flower_l: int
    flower_c: int
    accent: int
    kokoshnik: bool = False


SPECS = [
    DollSpec(
        "Matryona", "Матрёна", 37, 55, 2, True,
        SCARLET, SCARLET_D, ROSE_L, SCARLET, SCARLET_D, CREAM,
        ROSE, ROSE_L, GOLD, GOLD, kokoshnik=True,
    ),
    DollSpec(
        "Darya", "Дарья", 27, 41, 2, True,
        BLUE, BLUE_D, BLUE_L, BLUE, BLUE_D, LINEN,
        ROSE, PINK_L, GOLD, GOLD,
    ),
    DollSpec(
        "Olga", "Ольга", 19, 29, 1, True,
        GREEN_M, LEAF_D, GREEN_L, GREEN_M, LEAF_D, CREAM,
        YELLOW, YELLOW_L, ORANGE, GOLD,
    ),
    DollSpec(
        "Natasha", "Наташа", 13, 21, 1, True,
        YELLOW, YELLOW_D, YELLOW_L, YELLOW_D, BROWN, LINEN,
        RASP, PINK_L, GOLD, SCARLET,
    ),
    DollSpec(
        "Masha", "Маша", 9, 15, 0, False,
        PINK, RASP_D, PINK_L, RASP, RASP_D, PINK_L,
        ROSE, ROSE_L, GOLD, GOLD,
    ),
]


PROFILE = [
    (0.00, 0.60),
    (0.05, 0.78),
    (0.28, 1.00),
    (0.46, 0.90),
    (0.52, 0.78),  # gentle neck — must stay wide enough to nest
    (0.58, 0.80),
    (0.72, 0.86),
    (0.90, 0.58),
    (1.00, 0.20),
]

SPLIT_T = 0.48


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def profile_radius(t: float, rmax: float) -> float:
    t = max(0.0, min(1.0, t))
    for i in range(len(PROFILE) - 1):
        t0, r0 = PROFILE[i]
        t1, r1 = PROFILE[i + 1]
        if t0 <= t <= t1:
            u = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            # smoothstep
            u = u * u * (3 - 2 * u)
            return rmax * lerp(r0, r1, u)
    return rmax * PROFILE[-1][1]


def hypot2(dx: float, dz: float) -> float:
    return math.sqrt(dx * dx + dz * dz)


@dataclass
class Doll:
    spec: DollSpec
    voxels: dict[tuple[int, int, int], int] = field(default_factory=dict)
    split_y: int = 0

    @property
    def w(self) -> int:
        return self.spec.width

    @property
    def h(self) -> int:
        return self.spec.height

    @property
    def d(self) -> int:
        return self.spec.width


def generate_doll(spec: DollSpec) -> Doll:
    doll = Doll(spec)
    w, h, d = spec.width, spec.height, spec.width
    cx = (w - 1) / 2.0
    cz = (d - 1) / 2.0
    rmax = min(w, d) / 2.0 - 0.15
    doll.split_y = int(round(SPLIT_T * (h - 1)))
    wall = spec.wall

    # Occupancy: shell + solid cap/floor. Cavity carved after.
    occupied: set[tuple[int, int, int]] = set()
    for y in range(h):
        t = y / (h - 1)
        r_out = profile_radius(t, rmax)
        # Flatten the very bottom into a stable stand.
        if t < 0.03:
            r_out *= 0.92
        for x in range(w):
            for z in range(d):
                r = hypot2(x - cx, z - cz)
                if r <= r_out + 0.02:
                    occupied.add((x, y, z))

    if spec.hollow and wall > 0:
        cavity: set[tuple[int, int, int]] = set()
        for y in range(wall, h - wall):
            t = y / (h - 1)
            r_out = profile_radius(t, rmax)
            r_in = r_out - wall
            # Widen only through the neck/shoulders so children fit, without
            # chewing through the scarf cap or the stand.
            if 0.42 < t < 0.78:
                r_in = max(r_in, rmax * 0.40)
            r_in = min(r_in, r_out - 0.92)
            if r_in < 0.65:
                continue
            for x in range(w):
                for z in range(d):
                    r = hypot2(x - cx, z - cz)
                    if r <= r_in - 0.12:
                        cavity.add((x, y, z))
        occupied -= cavity

    occupied_list = list(occupied)
    for x, y, z in occupied_list:
        color = paint_voxel(spec, x, y, z, cx, cz, h, w, rmax, occupied, doll.split_y)
        doll.voxels[(x, y, z)] = color

    return doll


def neighbors6(p: tuple[int, int, int]) -> list[tuple[int, int, int]]:
    x, y, z = p
    return [
        (x + 1, y, z), (x - 1, y, z),
        (x, y + 1, z), (x, y - 1, z),
        (x, y, z + 1), (x, y, z - 1),
    ]


def paint_voxel(
    spec: DollSpec,
    x: int, y: int, z: int,
    cx: float, cz: float, h: int, w: int, rmax: float,
    occupied: set[tuple[int, int, int]],
    split_y: int,
) -> int:
    t = y / (h - 1)
    dx, dz = x - cx, z - cz
    phi = math.atan2(dx, dz)  # 0 = +Z (face toward camera)
    r = hypot2(dx, dz)
    r_out = profile_radius(t, rmax)

    n_empty = sum(1 for q in neighbors6((x, y, z)) if q not in occupied)
    innerish = r < r_out - 0.55 and n_empty > 0 and spec.hollow

    on_split = spec.hollow and (y == split_y or y == split_y - 1)
    if on_split and r < r_out - 0.4:
        return WOOD_RIM
    if innerish and abs(phi) > 0.9:
        return WOOD
    if innerish and t < SPLIT_T and r < r_out - 0.8:
        return WOOD
    if innerish and t > SPLIT_T and r < r_out - 0.8:
        return WOOD

    scale = h
    face_open = abs(phi) < face_half_width(t, spec) and 0.56 < t < 0.88

    if t >= 0.53:
        if face_open:
            return paint_face(spec, x, y, z, cx, cz, h, w)
        return paint_scarf(spec, phi, t, r, r_out, scale)

    return paint_body(spec, phi, t, scale)


def face_half_width(t: float, spec: DollSpec) -> float:
    # Oval scarf window. Kokoshnik is a bit narrower and taller.
    u = (t - 0.56) / 0.32
    u = max(0.0, min(1.0, u))
    oval = math.sin(u * math.pi)
    base = 0.72 if spec.kokoshnik else 0.78
    return base * (0.35 + 0.65 * oval)


def paint_face(spec: DollSpec, x: int, y: int, z: int, cx: float, cz: float, h: int, w: int) -> int:
    """Paint facial features in voxel space so eyes stay round at every scale."""
    fx = x - cx
    y_eyes = 0.738 * (h - 1)
    y_brows = y_eyes + (2.0 if h > 36 else 1.35 if h > 22 else 1.0)
    y_nose = 0.698 * (h - 1)
    y_mouth = 0.652 * (h - 1)
    y_blush = 0.680 * (h - 1)
    y_hair = 0.818 * (h - 1)

    eye_sep = max(1.55, w * 0.095)
    if h >= 40:
        eye_r = 1.15
    elif h >= 26:
        eye_r = 0.95
    elif h >= 18:
        eye_r = 0.72
    else:
        eye_r = 0.55

    for sign in (-1.0, 1.0):
        ex = cx + sign * eye_sep
        dx = x - ex
        dy = y - y_eyes
        dist2 = dx * dx + dy * dy
        if dist2 <= eye_r * eye_r:
            if dx * sign <= 0 and dy >= 0.15 and dist2 <= (eye_r * 0.42) ** 2:
                return WHITE
            return HAIR
        if h > 20:
            bx = x - ex
            by = y - y_brows
            if abs(bx) <= eye_r + 0.7 and abs(by) <= 0.62:
                return HAIR_M

    if abs(fx) <= (0.7 if h > 20 else 0.45) and abs(y - y_nose) <= (0.7 if h > 20 else 0.45):
        return SKIN_D

    mouth_w = max(1.35, w * 0.10)
    smile_y = y_mouth + (0.055 if h > 30 else 0.04) * (fx * fx)
    if abs(fx) <= mouth_w and abs(y - smile_y) <= (0.72 if h > 22 else 0.5):
        return LIPS

    blush_x = max(2.2, w * 0.155)
    blush_r = max(1.15, w * 0.068)
    for sign in (-1.0, 1.0):
        dx = x - (cx + sign * blush_x)
        dy = (y - y_blush) * 1.35
        if dx * dx + dy * dy <= blush_r * blush_r:
            return BLUSH

    if y >= y_hair:
        return HAIR
    if y >= y_hair - (1.4 if h > 24 else 0.9) and abs(fx) > w * 0.07:
        return HAIR
    if abs(fx) > w * 0.17 and y > 0.62 * (h - 1):
        return HAIR

    if y > 0.77 * (h - 1):
        return SKIN_L
    if abs(fx) > w * 0.15:
        return SKIN_D
    return SKIN


def paint_scarf(spec: DollSpec, phi: float, t: float, r: float, r_out: float, scale: float) -> int:
    # Gold edge around the face window
    hw = face_half_width(t, spec)
    near_face = 0.54 < t < 0.90 and abs(abs(phi) - hw) < 0.10
    if near_face and abs(phi) >= hw * 0.92:
        return spec.accent

    # Kokoshnik crest: gold band + jewels
    if spec.kokoshnik and t > 0.90:
        if t > 0.96:
            return GOLD_L
        # jewel dots
        jewels = (-0.6, -0.3, 0.0, 0.3, 0.6)
        for j in jewels:
            if abs(phi - j) < 0.08 and abs(t - 0.935) < 0.02:
                return GOLD
        return spec.scarf_d

    # Forehead band
    if 0.84 < t < 0.89 and abs(phi) > hw * 0.85:
        return spec.accent

    # Scarf flower, off-center top-right
    if scale > 18:
        col = stamp_rose(phi - 0.95, t - 0.78, 0.16 if scale > 30 else 0.20, spec)
        if col is not None:
            return col

    # Polka / berry dots on scarf
    if scale > 16:
        gx = math.sin(phi * 5.0 + t * 18.0)
        gy = math.cos(phi * 7.0 - t * 14.0)
        if gx > 0.72 and gy > 0.35 and 0.60 < t < 0.92 and abs(phi) > hw + 0.05:
            return spec.flower if (int((phi + 3) * 8) + int(t * 20)) % 3 else spec.accent

    # Side ties / drape darker
    if t < 0.62 and abs(abs(phi) - 1.15) < 0.35:
        return spec.scarf_d

    # Hem highlight
    if t < 0.58:
        return spec.scarf_d

    # Lighting
    if r > r_out - 0.7 and phi > 0.4:
        return spec.scarf_d
    if phi < -0.3 and t > 0.7:
        return spec.scarf_l
    return spec.scarf


def stamp_rose(u: float, v: float, radius: float, spec: DollSpec) -> int | None:
    rr = math.hypot(u, v * 1.15)
    if rr > radius:
        return None
    ang = math.atan2(v, u)
    petal = radius * (0.72 + 0.28 * math.sin(ang * 5.0))
    if rr < radius * 0.22:
        return spec.flower_c
    if rr < petal:
        # inner shading
        if rr < radius * 0.45:
            return spec.flower
        return spec.flower_l
    # tiny leaves
    if rr < radius * 1.05 and abs(math.cos(ang * 2.5)) > 0.85:
        return LEAF
    return None


def stamp_leaf(u: float, v: float, radius: float) -> int | None:
    # Leaf pointed along +v
    if abs(u) > radius * 0.45:
        return None
    if v < -radius * 0.2 or v > radius:
        return None
    # taper
    width = radius * 0.45 * (1.0 - abs(v / radius))
    if abs(u) < width * 0.35:
        return LEAF_D
    if abs(u) < width:
        return LEAF
    return None


def paint_body(spec: DollSpec, phi: float, t: float, scale: float) -> int:
    # Waist gold band near the split
    if abs(t - SPLIT_T) < 0.018 + 0.6 / scale:
        return spec.accent
    if abs(t - 0.08) < 0.016 + 0.5 / scale:
        return spec.accent  # hem

    apron = abs(phi) < 0.62 and 0.10 < t < 0.46
    if apron:
        # Bouquet
        col = bouquet(phi, t, scale, spec)
        if col is not None:
            return col
        # Apron panel
        if abs(phi) < 0.50:
            if abs(abs(phi) - 0.48) < 0.04 or abs(t - 0.45) < 0.015 or abs(t - 0.11) < 0.015:
                return spec.accent
            # linen shading
            if phi > 0.25:
                return WOOD_RIM if spec.apron == CREAM else spec.apron
            return spec.apron

    # Side flowers on dress for larger dolls
    if scale > 22 and not apron:
        col = stamp_rose(phi - 1.35, t - 0.30, 0.14, spec)
        if col:
            return col
        col = stamp_rose(phi + 1.45, t - 0.26, 0.12, spec)
        if col:
            return col

    # Khokhloma-ish dash pattern
    if scale > 18:
        wave = math.sin(phi * 6.0 + t * 22.0)
        if wave > 0.82 and 0.14 < t < 0.44 and abs(phi) > 0.7:
            return spec.accent if (int(t * 30) % 2 == 0) else spec.flower

    # Hands on the apron edge for the two largest
    if scale > 24 and 0.28 < t < 0.36 and 0.58 < abs(phi) < 0.78:
        return SKIN

    # Dress shading
    if abs(t - 0.28) < 0.02 and abs(phi) > 1.2:
        return spec.dress_d
    if phi > 0.9:
        return spec.dress_d
    if phi < -0.8 and t > 0.2:
        return spec.scarf_l if spec.scarf_l != spec.dress else spec.dress
    return spec.dress


def bouquet(phi: float, t: float, scale: float, spec: DollSpec) -> int | None:
    s = 1.0 if scale > 30 else 1.25 if scale > 20 else 1.55
    roses = [
        (0.00, 0.34, 0.13 * s),
        (-0.22, 0.27, 0.10 * s),
        (0.20, 0.28, 0.10 * s),
    ]
    if scale > 36:
        roses.append((0.02, 0.22, 0.08 * s))
    for ru, rv, rr in roses:
        col = stamp_rose(phi - ru, t - rv, rr, spec)
        if col is not None:
            return col

    # Leaves
    leaves = [
        (-0.34, 0.24, 0.12, 0.6),
        (0.32, 0.23, 0.12, -0.5),
        (-0.08, 0.18, 0.10, 0.2),
        (0.12, 0.18, 0.10, -0.2),
    ]
    for lu, lv, lr, rot in leaves:
        u = phi - lu
        v = t - lv
        # rotate
        c, s_ = math.cos(rot), math.sin(rot)
        uu = u * c - v * s_
        vv = u * s_ + v * c
        col = stamp_leaf(uu, vv, lr * s)
        if col is not None:
            return col

    # Berries / gold dots
    dots = [(-0.12, 0.31), (0.14, 0.32), (-0.05, 0.21), (0.08, 0.21)]
    for du, dv in dots:
        if math.hypot(phi - du, (t - dv) * 1.4) < 0.035 * s:
            return BERRY if spec.flower != BERRY else GOLD

    # Stems
    if abs(phi) < 0.04 and 0.12 < t < 0.22:
        return LEAF_D
    return None


def write_vox(path: Path, voxels: dict[tuple[int, int, int], int], size: tuple[int, int, int]) -> None:
    """MagicaVoxel .vox — Z is up, so store (x, z, y)."""
    w, h, d = size  # x, y-up, z
    entries = []
    for (x, y, z), c in voxels.items():
        if 0 <= x < w and 0 <= y < h and 0 <= z < d:
            entries.append((x, z, y, c))  # (x, y_vox, z_vox, color)
    n = len(entries)
    xyzi = struct.pack("<I", n) + b"".join(struct.pack("<BBBB", x, yv, zv, c) for x, yv, zv, c in entries)

    def chunk(cid: bytes, content: bytes, children: bytes = b"") -> bytes:
        return cid + struct.pack("<ii", len(content), len(children)) + content + children

    size_chunk = chunk(b"SIZE", struct.pack("<iii", w, d, h))
    xyzi_chunk = chunk(b"XYZI", xyzi)
    rgba = b"".join(struct.pack("<BBBB", r, g, b, 255) for r, g, b in PALETTE[:256])
    rgba_chunk = chunk(b"RGBA", rgba)
    main = chunk(b"MAIN", b"", size_chunk + xyzi_chunk + rgba_chunk)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"VOX " + struct.pack("<i", 150) + main)


def shade(rgb: tuple[int, int, int], k: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(c * k))) for c in rgb)  # type: ignore[return-value]


def render_front(doll: Doll, px: int = 10, pad: int = 16) -> Image.Image:
    w, h, d = doll.w, doll.h, doll.d
    img_w = w * px + pad * 2
    img_h = h * px + pad * 2
    img = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
    pix = img.load()
    # painter: back to front (+z last)
    items = sorted(doll.voxels.items(), key=lambda it: it[0][2])
    for (x, y, z), c in items:
        col = PALETTE[c]
        # side shading by z proximity to center
        k = 0.72 + 0.28 * (z / max(1, d - 1))
        col = shade(col, k)
        sx = pad + x * px
        sy = pad + (h - 1 - y) * px
        for i in range(px):
            for j in range(px):
                pix[sx + i, sy + j] = (*col, 255)
        # grid
        if px >= 6:
            dark = shade(col, 0.55) + (255,)
            for i in range(px):
                pix[sx + i, sy] = dark
                pix[sx, sy + i] = dark
    return img


def render_iso(doll: Doll, s: int = 8, yaw: float = 0.45) -> Image.Image:
    cy, sy_ = math.cos(yaw), math.sin(yaw)
    pts = []
    for (x, y, z), c in doll.voxels.items():
        # rotate around Y so the face (+Z) is visible
        xc = x - (doll.w - 1) / 2
        zc = z - (doll.d - 1) / 2
        xr = xc * cy - zc * sy_
        zr = xc * sy_ + zc * cy
        pts.append((xr, y, zr, c, x, z))

    hw, hh = s, s // 2
    xs, ys = [], []
    projected = []
    for xr, y, zr, c, x, z in pts:
        sx = (xr - zr) * hw
        sy = (xr + zr) * hh - y * s
        projected.append((sx, sy, xr, y, zr, c))
        xs.append(sx)
        ys.append(sy)
    minx, maxx = min(xs) - s * 2, max(xs) + s * 2
    miny, maxy = min(ys) - s * 2, max(ys) + s * 2
    img_w = int(maxx - minx) + 8
    img_h = int(maxy - miny) + 8
    img = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # draw far to near
    projected.sort(key=lambda p: p[2] + p[4] + p[3])
    for sx, sy, xr, y, zr, c in projected:
        ox = sx - minx
        oy = sy - miny
        col = PALETTE[c]
        top = col
        left = shade(col, 0.82)
        right = shade(col, 0.62)
        # diamond top
        p_top = (ox, oy - hh)
        p_l = (ox - hw, oy)
        p_r = (ox + hw, oy)
        p_b = (ox, oy + hh)
        p_lb = (ox - hw, oy + s)
        p_rb = (ox + hw, oy + s)
        p_bb = (ox, oy + s + hh)
        draw.polygon([p_top, p_r, p_b, p_l], fill=top)
        draw.polygon([p_l, p_b, p_bb, p_lb], fill=left)
        draw.polygon([p_r, p_b, p_bb, p_rb], fill=right)
    return img


def compose_row(images: list[Image.Image], bg: tuple[int, int, int] = (48, 22, 22), pad: int = 24) -> Image.Image:
    h = max(im.height for im in images)
    w = sum(im.width for im in images) + pad * (len(images) + 1)
    canvas = Image.new("RGBA", (w, h + pad * 2), bg + (255,))
    x = pad
    for im in images:
        y = pad + (h - im.height) // 2
        canvas.alpha_composite(im, (x, y))
        x += im.width + pad
    return canvas


def doll_to_json(doll: Doll) -> dict:
    lid, base = [], []
    for (x, y, z), c in sorted(doll.voxels.items()):
        entry = [x, y, z, c]
        if y >= doll.split_y and doll.spec.hollow:
            lid.append(entry)
        else:
            base.append(entry)
    return {
        "name": doll.spec.name,
        "nameRu": doll.spec.name_ru,
        "size": [doll.w, doll.h, doll.d],
        "splitY": doll.split_y,
        "hollow": doll.spec.hollow,
        "wall": doll.spec.wall,
        "lid": lid,
        "base": base,
    }


def nest_offset(parent: Doll, child: Doll) -> tuple[int, int, int]:
    ox = (parent.w - child.w) // 2
    oz = (parent.d - child.d) // 2
    oy = parent.spec.wall if parent.spec.hollow else 0
    return ox, oy, oz


def main() -> None:
    MODELS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)

    dolls = [generate_doll(spec) for spec in SPECS]
    for doll in dolls:
        print(f"{doll.spec.name}: {len(doll.voxels)} voxels, splitY={doll.split_y}, size={doll.w}x{doll.h}x{doll.d}")

    # Individual vox
    for doll in dolls:
        slug = doll.spec.name.lower()
        write_vox(MODELS / f"{slug}.vox", doll.voxels, (doll.w, doll.h, doll.d))

    # Nested combined model
    nested: dict[tuple[int, int, int], int] = {}
    ox = oy = oz = 0
    # place all inside the largest's coordinate frame
    offsets = [(0, 0, 0)]
    for i in range(1, len(dolls)):
        dx, dy, dz = nest_offset(dolls[i - 1], dolls[i])
        prev = offsets[-1]
        offsets.append((prev[0] + dx, prev[1] + dy, prev[2] + dz))
    for doll, (ox, oy, oz) in zip(dolls, offsets):
        for (x, y, z), c in doll.voxels.items():
            nested[(x + ox, y + oy, z + oz)] = c
    nw, nh, nd = dolls[0].w, dolls[0].h, dolls[0].d
    write_vox(MODELS / "matryoshka-nested.vox", nested, (nw, nh, nd))

    # Lineup combined model
    lineup: dict[tuple[int, int, int], int] = {}
    gap = 4
    xcursor = 0
    max_h = max(d.h for d in dolls)
    max_d = max(d.d for d in dolls)
    for doll in dolls:
        ox = xcursor
        oy = 0
        oz = (max_d - doll.d) // 2
        for (x, y, z), c in doll.voxels.items():
            lineup[(x + ox, y + oy, z + oz)] = c
        xcursor += doll.w + gap
    write_vox(MODELS / "matryoshka-lineup.vox", lineup, (xcursor - gap, max_h, max_d))

    # JSON for the viewer
    data = {
        "palette": PALETTE_HEX[:49],
        "splitT": SPLIT_T,
        "dolls": [doll_to_json(d) for d in dolls],
        "nestOffsets": [list(nest_offset(dolls[i], dolls[i + 1])) for i in range(len(dolls) - 1)],
    }
    (MODELS / "dolls.json").write_text(json.dumps(data, separators=(",", ":")))
    print("wrote", MODELS / "dolls.json", "bytes", (MODELS / "dolls.json").stat().st_size)

    # Previews
    fronts, isos = [], []
    for doll in dolls:
        slug = doll.spec.name.lower()
        front = render_front(doll, px=max(6, 14 - doll.h // 8))
        iso = render_iso(doll, s=max(5, 12 - doll.h // 10))
        front.save(PREVIEWS / f"{slug}-front.png")
        iso.save(PREVIEWS / f"{slug}-iso.png")
        fronts.append(front)
        isos.append(iso)

    compose_row(fronts, bg=(92, 24, 28)).save(PREVIEWS / "set-front.png")
    compose_row(isos, bg=(92, 24, 28)).save(PREVIEWS / "set-iso.png")

    class Tmp:
        pass

    tmp = Tmp()
    tmp.w, tmp.h, tmp.d = nw, nh, nd
    tmp.voxels = nested
    tmp.spec = SPECS[0]
    render_front(tmp, px=8).save(PREVIEWS / "nested-front.png")  # type: ignore
    render_iso(tmp, s=6).save(PREVIEWS / "nested-iso.png")  # type: ignore

    cut = {(x, y, z): c for (x, y, z), c in nested.items() if x >= nw // 2}
    cut_tmp = Tmp()
    cut_tmp.w, cut_tmp.h, cut_tmp.d = nw, nh, nd
    cut_tmp.voxels = cut
    cut_tmp.spec = SPECS[0]
    render_iso(cut_tmp, s=7, yaw=-0.55).save(PREVIEWS / "nested-cutaway.png")  # type: ignore

    print("previews in", PREVIEWS)


if __name__ == "__main__":
    main()
