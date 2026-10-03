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
    motif: str = "rose"
    kind: str = "sister"
    key: str = ""
    beard: bool = False


SPECS = [
    DollSpec(
        "Matryona", "Матрёна", 37, 55, 2, True,
        SCARLET, SCARLET_D, ROSE_L, SCARLET, SCARLET_D, CREAM,
        ROSE, ROSE_L, GOLD, GOLD, kokoshnik=True, motif="rose", key="matryona",
    ),
    DollSpec(
        "Darya", "Дарья", 27, 41, 2, True,
        BLUE, BLUE_D, BLUE_L, BLUE, BLUE_D, LINEN,
        ROSE, PINK_L, GOLD, GOLD, motif="frost", key="darya",
    ),
    DollSpec(
        "Olga", "Ольга", 19, 29, 1, True,
        GREEN_M, LEAF_D, GREEN_L, GREEN_M, LEAF_D, CREAM,
        YELLOW, YELLOW_L, ORANGE, GOLD, motif="sunflower", key="olga",
    ),
    DollSpec(
        "Natasha", "Наташа", 13, 21, 1, True,
        YELLOW, YELLOW_D, YELLOW_L, YELLOW_D, BROWN, LINEN,
        RASP, PINK_L, GOLD, SCARLET, motif="berry", key="natasha",
    ),
    DollSpec(
        "Masha", "Маша", 9, 15, 0, False,
        PINK, RASP_D, PINK_L, RASP, RASP_D, PINK_L,
        ROSE, ROSE_L, GOLD, GOLD, motif="bloom", key="masha",
    ),
]

HUSBAND_SPECS = [
    DollSpec(
        "Ivan", "Иван", 37, 55, 2, True,
        BLACK, BARK, BROWN, SCARLET, SCARLET_D, CREAM,
        GOLD, YELLOW_L, GOLD, GOLD, motif="wheat", kind="husband", key="ivan", beard=True,
    ),
    DollSpec(
        "Pavel", "Павел", 27, 41, 2, True,
        BLUE_D, BLUE, BLUE_L, BLUE, BLUE_D, LINEN,
        GOLD, WHITE, GOLD, GOLD, motif="frost", kind="husband", key="pavel", beard=True,
    ),
    DollSpec(
        "Boris", "Борис", 19, 29, 1, True,
        LEAF_D, BROWN, GREEN_L, GREEN_M, LEAF_D, CREAM,
        YELLOW, YELLOW_L, GOLD, GOLD, motif="sunflower", kind="husband", key="boris", beard=True,
    ),
    DollSpec(
        "Yuri", "Юрий", 13, 21, 1, True,
        BROWN, BARK, ORANGE, ORANGE, YELLOW_D, LINEN,
        GOLD, YELLOW_L, GOLD, SCARLET, motif="berry", kind="husband", key="yuri",
    ),
    DollSpec(
        "Kolya", "Коля", 9, 15, 0, False,
        BROWN, BARK, PALE, BLUE_M, BLUE_D, PINK_L,
        ROSE, ROSE_L, GOLD, GOLD, motif="bloom", kind="husband", key="kolya",
    ),
]


PROFILE = [
    (0.00, 0.62),
    (0.07, 0.84),
    (0.26, 1.00),  # pear belly
    (0.44, 0.90),
    (0.50, 0.78),  # neck, still wide enough to nest
    (0.57, 0.80),
    (0.70, 0.86),  # round head
    (0.88, 0.64),
    (1.00, 0.30),  # scarf crown, not a pointed cap
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
            if 0.38 < t < 0.82:
                r_in = max(r_in, rmax * 0.46)
            r_in = min(r_in, r_out - 0.82)
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

    # Only cavity-facing voxels (empty neighbor closer to the axis) are wood.
    # The stand and crown stay painted so the doll does not show a birch floor.
    innerish = False
    if spec.hollow and 0 < y < h - 1 and r < r_out - 0.45:
        for nx, ny, nz in neighbors6((x, y, z)):
            if (nx, ny, nz) not in occupied and hypot2(nx - cx, nz - cz) < r - 0.15:
                innerish = True
                break

    on_split = spec.hollow and (y == split_y or y == split_y - 1)
    if on_split and r < r_out - 0.35:
        return WOOD_RIM
    if innerish:
        return WOOD

    if y == 0:
        return spec.accent if r > r_out - 1.4 else spec.dress_d

    scale = h
    if spec.kind == "husband":
        face_open = abs(phi) < face_half_width(t, spec) * 1.08 and 0.52 < t < 0.90
        if t >= 0.50:
            if face_open:
                return paint_man_face(spec, x, y, z, cx, cz, h, w)
            return paint_man_hat(spec, phi, t, r, r_out, scale)
        return paint_shirt(spec, phi, t, scale)

    face_open = abs(phi) < face_half_width(t, spec) and 0.54 < t < 0.88
    if t >= 0.52:
        if face_open:
            return paint_face(spec, x, y, z, cx, cz, h, w)
        return paint_scarf(spec, phi, t, r, r_out, scale)
    return paint_body(spec, phi, t, scale)


def face_half_width(t: float, spec: DollSpec) -> float:
    """Wide oval scarf window so the face reads as a round matryoshka visage."""
    u = (t - 0.54) / 0.34
    u = max(0.0, min(1.0, u))
    oval = math.sin(u * math.pi) ** 0.85
    return 0.95 * (0.42 + 0.58 * oval)


def paint_face(spec: DollSpec, x: int, y: int, z: int, cx: float, cz: float, h: int, w: int) -> int:
    """Round Semenov-style face: big cheeks, small eyes, thin bangs, little hair."""
    y0 = 0.55 * (h - 1)
    y1 = 0.87 * (h - 1)
    span = max(1.0, y1 - y0)
    v = (y - y0) / span  # 0 chin … 1 forehead
    u = (x - cx) / max(2.2, w * 0.20)  # -1 … 1 across the face

    # Bangs only — a thin fringe, not a hair helmet.
    if v > 0.91 and abs(u) < 0.75:
        return HAIR
    if v > 0.86 and 0.35 < abs(u) < 0.95:
        return HAIR
    if abs(u) > 1.55 and v > 0.30:
        return HAIR

    eye_u, eye_v = 0.34, 0.58
    if h >= 40:
        er_u, er_v = 0.16, 0.11
    elif h >= 26:
        er_u, er_v = 0.20, 0.13
    elif h >= 16:
        er_u, er_v = 0.24, 0.16
    else:
        er_u, er_v = 0.30, 0.20

    for sign in (-1.0, 1.0):
        du = (u - sign * eye_u) / er_u
        dv = (v - eye_v) / er_v
        if du * du + dv * dv <= 1.0:
            if h < 18:
                return HAIR
            if du * sign < -0.18 and dv < -0.08:
                return WHITE
            return HAIR
        brow_v = eye_v + (0.15 if h > 20 else 0.17)
        if abs(u - sign * eye_u) < er_u * 1.25 and abs(v - brow_v) < (0.05 if h > 16 else 0.08):
            return HAIR

    if abs(u) < 0.11 and abs(v - 0.42) < 0.07:
        return SKIN_D

    mouth_v = 0.25 + 0.12 * (u * u)
    if abs(u) < 0.40 and abs(v - mouth_v) < (0.055 if h > 20 else 0.085):
        return LIPS

    for sign in (-1.0, 1.0):
        du = (u - sign * 0.50) / 0.32
        dv = (v - 0.35) / 0.18
        if du * du + dv * dv <= 1.0:
            return BLUSH

    if v > 0.72:
        return SKIN_L
    if abs(u) > 0.72:
        return SKIN_D
    return SKIN


def paint_man_face(spec: DollSpec, x: int, y: int, z: int, cx: float, cz: float, h: int, w: int) -> int:
    y0 = 0.52 * (h - 1)
    y1 = 0.90 * (h - 1)
    span = max(1.0, y1 - y0)
    v = (y - y0) / span
    u = (x - cx) / max(2.2, w * 0.20)

    if spec.beard and v < (0.40 if h > 24 else 0.34) and abs(u) < 1.15:
        if abs(u) > 0.85 or v < 0.28:
            return HAIR
        if abs(u) < 0.55 and v < 0.36:
            return HAIR_M

    if v > 0.86 and abs(u) < 0.95:
        return HAIR
    if abs(u) > 1.35 and v > 0.28:
        return HAIR

    eye_u, eye_v = 0.32, 0.62
    if h >= 40:
        er_u, er_v = 0.15, 0.10
    elif h >= 26:
        er_u, er_v = 0.19, 0.12
    elif h >= 16:
        er_u, er_v = 0.23, 0.15
    else:
        er_u, er_v = 0.28, 0.18

    for sign in (-1.0, 1.0):
        du = (u - sign * eye_u) / er_u
        dv = (v - eye_v) / er_v
        if du * du + dv * dv <= 1.0:
            return HAIR
        if abs(u - sign * eye_u) < er_u * 1.2 and abs(v - (eye_v + 0.14)) < 0.05:
            return HAIR

    if spec.beard and abs(u) < 0.42 and abs(v - 0.44) < 0.06:
        return HAIR
    if abs(u) < 0.12 and abs(v - 0.48) < 0.06:
        return SKIN_D
    if abs(u) < 0.28 and abs(v - 0.32) < (0.05 if h > 18 else 0.08):
        return LIPS
    if v > 0.74:
        return SKIN_L
    if abs(u) > 0.78:
        return SKIN_D
    return SKIN


def paint_man_hat(spec: DollSpec, phi: float, t: float, r: float, r_out: float, scale: float) -> int:
    if t > 0.90:
        if 0.93 < t < 0.97:
            return spec.accent
        return spec.scarf
    if 0.84 < t < 0.90:
        return spec.scarf_d
    if scale > 16 and abs(phi) > 1.1:
        if spec.motif == "wheat":
            col = stamp_wheat(phi - 1.6, t - 0.70, 0.16)
        elif spec.motif == "frost":
            col = stamp_snow(phi - 1.4, t - 0.70, 0.14)
        elif spec.motif == "sunflower":
            col = stamp_sunflower(phi - 1.35, t - 0.70, 0.14)
        else:
            col = stamp_rose(phi - 1.3, t - 0.70, 0.13, spec)
        if col is not None:
            return col
    if phi > 0.6:
        return spec.scarf_d
    return spec.scarf


def stamp_wheat(u: float, v: float, radius: float) -> int | None:
    if abs(u) > radius * 0.55:
        return None
    if -radius * 0.2 < v < radius and abs(u) < radius * 0.16:
        return GOLD
    if 0.0 < v < radius * 0.85 and abs(abs(u) - radius * 0.28) < radius * 0.14:
        return YELLOW
    return None


def paint_shirt(spec: DollSpec, phi: float, t: float, scale: float) -> int:
    if abs(t - SPLIT_T) < 0.022 + 0.6 / scale:
        return spec.accent
    if abs(t - 0.08) < 0.016:
        return spec.accent
    if abs(phi) < 0.16 and 0.14 < t < 0.46:
        return spec.accent if int(t * 22) % 2 == 0 else WHITE
    if spec.motif == "wheat":
        col = stamp_wheat(phi, t - 0.30, 0.18 if scale > 24 else 0.22)
        if col:
            return col
    elif spec.motif == "frost":
        col = stamp_snow(phi, t - 0.30, 0.16 if scale > 24 else 0.20)
        if col:
            return col
    elif spec.motif == "sunflower":
        col = stamp_sunflower(phi, t - 0.30, 0.16 if scale > 24 else 0.20)
        if col:
            return col
    if scale > 16 and abs(phi) > 0.8:
        wave = math.sin(phi * 5.0 + t * 18.0)
        if wave > 0.78 and 0.16 < t < 0.44:
            return spec.accent
    if phi > 0.85:
        return spec.dress_d
    return spec.dress


def paint_scarf(spec: DollSpec, phi: float, t: float, r: float, r_out: float, scale: float) -> int:
    hw = face_half_width(t, spec)

    if spec.kokoshnik and t > 0.92:
        jewel = abs(math.sin(phi * 6.5)) > 0.78
        if t > 0.96:
            return ROSE if jewel else GOLD
        if t > 0.935:
            return GOLD

    if 0.54 < t < 0.90 and abs(abs(phi) - hw) < 0.11 and abs(phi) >= hw * 0.72:
        return spec.accent

    if t > 0.90:
        if 0.935 < t < 0.97:
            return spec.accent
        return spec.scarf

    if 0.86 < t < 0.91:
        return spec.accent

    if scale > 14 and abs(phi) > hw + 0.08:
        spots = [(-1.12, 0.73), (1.12, 0.73), (-1.95, 0.70), (1.95, 0.70), (2.85, 0.68)]
        for dp, dt in spots:
            if spec.motif == "frost":
                col = stamp_snow(phi - dp, t - dt, 0.15 if scale > 24 else 0.18)
            elif spec.motif == "sunflower":
                col = stamp_sunflower(phi - dp, t - dt, 0.14 if scale > 24 else 0.17)
            elif spec.motif == "berry":
                col = stamp_berry(phi - dp, t - dt, 0.13)
            else:
                col = stamp_rose(phi - dp, t - dt, 0.15 if scale > 28 else 0.18, spec)
            if col is not None:
                return col
            leaf = stamp_leaf(phi - dp + 0.16, t - dt - 0.07, 0.10)
            if leaf is not None:
                return leaf

    if scale > 14 and 0.60 < t < 0.88 and abs(phi) > hw + 0.14:
        if math.sin(phi * 5.0 + t * 16.0) > 0.82 and math.cos(phi * 7.0 - t * 10.0) > 0.2:
            return spec.flower if int((phi + 3) * 8 + t * 20) % 2 == 0 else spec.accent

    if t < 0.60:
        return spec.scarf_d
    if r > r_out - 0.7 and phi > 0.5:
        return spec.scarf_d
    if phi < -0.4 and t > 0.7:
        return spec.scarf_l
    return spec.scarf


def stamp_snow(u: float, v: float, radius: float) -> int | None:
    rr = math.hypot(u, v)
    if rr > radius:
        return None
    if rr < radius * 0.20:
        return WHITE
    ang = abs(math.atan2(v, u))
    arm = min(ang % (math.pi / 3), math.pi / 3 - (ang % (math.pi / 3)))
    if arm < 0.22 and rr < radius * 0.95:
        return GOLD_L if rr > radius * 0.55 else WHITE
    if rr < radius * 0.38:
        return GOLD
    return None


def stamp_sunflower(u: float, v: float, radius: float) -> int | None:
    rr = math.hypot(u, v)
    if rr > radius:
        return None
    if rr < radius * 0.30:
        return BROWN
    ang = math.atan2(v, u)
    petal = radius * (0.68 + 0.32 * (0.5 + 0.5 * math.cos(ang * 10.0)))
    if rr < petal:
        return YELLOW_L if rr > radius * 0.72 else YELLOW
    return None


def stamp_berry(u: float, v: float, radius: float) -> int | None:
    for dx, dy in ((0.0, 0.04), (-0.48, -0.12), (0.46, -0.10), (-0.18, -0.42), (0.20, -0.40)):
        if math.hypot(u - dx * radius, v - dy * radius) < radius * 0.34:
            return BERRY
    if math.hypot(u, v + radius * 0.42) < radius * 0.30:
        return LEAF
    if math.hypot(u - radius * 0.38, v + radius * 0.28) < radius * 0.22:
        return LEAF_L
    return None


def stamp_rose(u: float, v: float, radius: float, spec: DollSpec) -> int | None:
    rr = math.hypot(u, v * 1.02)
    if rr > radius:
        return None
    ang = math.atan2(v, u)
    petal = radius * (0.58 + 0.42 * (0.5 + 0.5 * math.cos(ang * 5.0)))
    if rr < petal:
        if rr < radius * 0.20:
            return spec.flower_c
        if rr < radius * 0.78 or math.cos(ang * 5.0) < 0.15:
            return spec.flower
        return spec.flower_l
    return None


def stamp_leaf(u: float, v: float, radius: float) -> int | None:
    if v < -radius * 0.15 or v > radius:
        return None
    width = radius * 0.42 * max(0.0, 1.0 - abs(v / radius))
    if abs(u) < width * 0.35:
        return LEAF_D
    if abs(u) < width:
        return LEAF
    return None


def paint_body(spec: DollSpec, phi: float, t: float, scale: float) -> int:
    if abs(t - SPLIT_T) < 0.018 + 0.6 / scale:
        return spec.accent
    if abs(t - 0.08) < 0.016 + 0.5 / scale:
        return spec.accent
    if abs(t - 0.20) < 0.010 + 0.35 / scale and abs(phi) > 0.55:
        return spec.accent

    apron = abs(phi) < 0.68 and 0.10 < t < 0.47
    if apron:
        col = bouquet(phi, t, scale, spec)
        if col is not None:
            return col
        if abs(phi) < 0.54:
            if abs(abs(phi) - 0.50) < 0.045 or abs(t - 0.455) < 0.016 or abs(t - 0.115) < 0.016:
                return spec.accent
            if abs(phi) < 0.46 and 0.14 < t < 0.42:
                if math.sin(phi * 18.0) > 0.88 and math.cos(t * 40.0) > 0.4:
                    return spec.accent
            if phi > 0.28:
                return WOOD_RIM if spec.apron == CREAM else spec.apron
            return spec.apron

    if scale > 16 and not apron:
        for dp, dt, rad in ((-1.28, 0.31, 0.16), (1.38, 0.27, 0.14), (-1.55, 0.18, 0.11), (1.60, 0.17, 0.11)):
            if spec.motif == "frost":
                col = stamp_snow(phi - dp, t - dt, rad)
            elif spec.motif == "sunflower":
                col = stamp_sunflower(phi - dp, t - dt, rad)
            elif spec.motif == "berry":
                col = stamp_berry(phi - dp, t - dt, rad * 0.9)
            else:
                col = stamp_rose(phi - dp, t - dt, rad, spec)
            if col:
                return col
            leaf = stamp_leaf(phi - dp + 0.14, t - dt - 0.08, rad * 0.7)
            if leaf:
                return leaf

    if scale > 16:
        wave = math.sin(phi * 5.5 + t * 20.0)
        if wave > 0.74 and 0.13 < t < 0.45 and abs(phi) > 0.7:
            return spec.accent if (int(t * 28 + phi * 4) % 2 == 0) else spec.flower

    if scale > 22 and 0.27 < t < 0.37 and 0.56 < abs(phi) < 0.80:
        return SKIN
    if scale > 22 and 0.36 < t < 0.42 and 0.54 < abs(phi) < 0.78:
        return spec.scarf_d

    if abs(t - 0.28) < 0.02 and abs(phi) > 1.2:
        return spec.dress_d
    if phi > 0.9:
        return spec.dress_d
    if phi < -0.8 and t > 0.2:
        return spec.scarf_l if spec.scarf_l != spec.dress else spec.dress
    return spec.dress


def bouquet(phi: float, t: float, scale: float, spec: DollSpec) -> int | None:
    s = 1.25 if scale > 30 else 1.45 if scale > 20 else 1.7
    motif = spec.motif
    if motif == "frost":
        col = stamp_snow(phi, t - 0.33, 0.20 * s)
        if col:
            return col
        for dp, dt in ((0.26, 0.23), (-0.26, 0.23), (0.0, 0.20)):
            col = stamp_berry(phi + dp, t - dt, 0.10 * s)
            if col:
                return col
    elif motif == "sunflower":
        col = stamp_sunflower(phi, t - 0.32, 0.20 * s)
        if col:
            return col
        col = stamp_leaf(phi + 0.32, t - 0.20, 0.14 * s)
        if col:
            return col
        col = stamp_leaf(-(phi + 0.32), t - 0.20, 0.14 * s)
        if col:
            return col
    elif motif == "berry":
        return stamp_berry(phi, t - 0.30, 0.22 * s)
    elif motif == "bloom":
        return stamp_rose(phi, t - 0.31, 0.20 * s, spec)
    else:
        roses = [
            (0.00, 0.34, 0.145 * s),
            (-0.22, 0.26, 0.11 * s),
            (0.22, 0.27, 0.11 * s),
        ]
        for ru, rv, rr in roses:
            col = stamp_rose(phi - ru, t - rv, rr, spec)
            if col is not None:
                return col
        leaves = [
            (-0.34, 0.22, 0.13, 0.7),
            (0.34, 0.22, 0.13, -0.7),
            (0.00, 0.16, 0.10, 0.0),
            (-0.18, 0.17, 0.09, 0.4),
            (0.18, 0.17, 0.09, -0.4),
        ]
        for lu, lv, lr, rot in leaves:
            u, v = phi - lu, t - lv
            c, s_ = math.cos(rot), math.sin(rot)
            col = stamp_leaf(u * c - v * s_, u * s_ + v * c, lr * s)
            if col is not None:
                return col
        if abs(phi) < 0.04 and 0.11 < t < 0.18:
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
        "key": doll.spec.key or doll.spec.name.lower(),
        "kind": doll.spec.kind,
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


def write_family(prefix: str, specs: list[DollSpec], json_name: str) -> list[Doll]:
    dolls = [generate_doll(spec) for spec in specs]
    for doll in dolls:
        print(f"{doll.spec.name}: {len(doll.voxels)} voxels, splitY={doll.split_y}, size={doll.w}x{doll.h}x{doll.d}")
        slug = doll.spec.name.lower()
        write_vox(MODELS / f"{slug}.vox", doll.voxels, (doll.w, doll.h, doll.d))

    nested: dict[tuple[int, int, int], int] = {}
    offsets = [(0, 0, 0)]
    for i in range(1, len(dolls)):
        dx, dy, dz = nest_offset(dolls[i - 1], dolls[i])
        prev = offsets[-1]
        offsets.append((prev[0] + dx, prev[1] + dy, prev[2] + dz))
    for doll, (ox, oy, oz) in zip(dolls, offsets):
        for (x, y, z), c in doll.voxels.items():
            nested[(x + ox, y + oy, z + oz)] = c
    nw, nh, nd = dolls[0].w, dolls[0].h, dolls[0].d
    write_vox(MODELS / f"{prefix}-nested.vox", nested, (nw, nh, nd))

    lineup: dict[tuple[int, int, int], int] = {}
    gap = 4
    xcursor = 0
    max_h = max(d.h for d in dolls)
    max_d = max(d.d for d in dolls)
    for doll in dolls:
        ox = xcursor
        oz = (max_d - doll.d) // 2
        for (x, y, z), c in doll.voxels.items():
            lineup[(x + ox, y, z + oz)] = c
        xcursor += doll.w + gap
    write_vox(MODELS / f"{prefix}-lineup.vox", lineup, (xcursor - gap, max_h, max_d))

    data = {
        "palette": PALETTE_HEX[:49],
        "splitT": SPLIT_T,
        "id": prefix,
        "dolls": [doll_to_json(d) for d in dolls],
        "nestOffsets": [list(nest_offset(dolls[i], dolls[i + 1])) for i in range(len(dolls) - 1)],
    }
    path = MODELS / json_name
    path.write_text(json.dumps(data, separators=(",", ":")))
    print("wrote", path, "bytes", path.stat().st_size)

    fronts, isos = [], []
    for doll in dolls:
        slug = doll.spec.name.lower()
        front = render_front(doll, px=max(6, 14 - doll.h // 8))
        iso = render_iso(doll, s=max(5, 12 - doll.h // 10))
        front.save(PREVIEWS / f"{slug}-front.png")
        iso.save(PREVIEWS / f"{slug}-iso.png")
        fronts.append(front)
        isos.append(iso)
    compose_row(fronts, bg=(92, 24, 28)).save(PREVIEWS / f"{prefix}-front.png")
    compose_row(isos, bg=(92, 24, 28)).save(PREVIEWS / f"{prefix}-iso.png")
    return dolls


def main() -> None:
    MODELS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)

    sisters = write_family("matryoshka", SPECS, "dolls.json")
    write_family("husbands", HUSBAND_SPECS, "husbands.json")

    # Keep the original preview names used by the README.
    nw, nh, nd = sisters[0].w, sisters[0].h, sisters[0].d
    nested = {}
    offsets = [(0, 0, 0)]
    for i in range(1, len(sisters)):
        dx, dy, dz = nest_offset(sisters[i - 1], sisters[i])
        prev = offsets[-1]
        offsets.append((prev[0] + dx, prev[1] + dy, prev[2] + dz))
    for doll, (ox, oy, oz) in zip(sisters, offsets):
        for (x, y, z), c in doll.voxels.items():
            nested[(x + ox, y + oy, z + oz)] = c

    class Tmp:
        pass

    tmp = Tmp()
    tmp.w, tmp.h, tmp.d = nw, nh, nd
    tmp.voxels = nested
    tmp.spec = SPECS[0]
    render_front(tmp, px=8).save(PREVIEWS / "nested-front.png")  # type: ignore
    render_iso(tmp, s=6).save(PREVIEWS / "nested-iso.png")  # type: ignore
    fronts = [render_front(d, px=max(6, 14 - d.h // 8)) for d in sisters]
    compose_row(fronts, bg=(92, 24, 28)).save(PREVIEWS / "set-front.png")

    cut = {(x, y, z): c for (x, y, z), c in nested.items() if x >= nw // 2}
    cut_tmp = Tmp()
    cut_tmp.w, cut_tmp.h, cut_tmp.d = nw, nh, nd
    cut_tmp.voxels = cut
    cut_tmp.spec = SPECS[0]
    render_iso(cut_tmp, s=7, yaw=-0.55).save(PREVIEWS / "nested-cutaway.png")  # type: ignore

    print("previews in", PREVIEWS)


if __name__ == "__main__":
    main()
