# Research Center Background — Pixel Art Drawing Guide

**Canvas:** 960 × 540 px | **Palette:** PICO-8 only | **Tool:** Aseprite
**Save to:** `assets/backgrounds/research_bg.png`

---

## PICO-8 Palette Reference

| Name        | Hex       | Use for                         |
|-------------|-----------|-------------------------------- |
| DEEP_NAVY   | `#0d1b2a` | Deepest shadows, recesses       |
| DARK_BLUE   | `#1b2838` | Dark rock, deep walls           |
| MED_BLUE    | `#2d4a6a` | Mid-tone stone, tech panels     |
| BRIGHT_BLUE | `#29adff` | Tech accent, screen glow        |
| CYAN        | `#53d8fb` | Terminal screens, data readouts |
| WHITE       | `#fff1e8` | Brightest highlights, specular  |
| LIGHT_GREY  | `#c2c3c7` | Metal surfaces lit side         |
| DARK_GREY   | `#5f574f` | Metal surfaces, stone mid-tone  |
| RED         | `#ff004d` | Inner core glow, heat indicators|
| ORANGE      | `#ffa300` | Magma glow, warm ambient light  |
| YELLOW      | `#ffec27` | Hottest magma, brightest warm   |
| GREEN       | `#00e436` | Active indicators, safe zones   |
| PINK        | `#ff77a8` | Subtle accent                   |
| INDIGO      | `#83769c` | Cool stone, distant surfaces    |
| BROWN       | `#ab5236` | Exposed rock, rust, stone warm  |

---

## Room Concept

A **deep underground research facility** carved into rock, where scientists study Earth's interior. The centerpiece is a large circular observation window showing a stylized cross-section of Earth's layers. Four research terminal stations are positioned around the room. The aesthetic blends natural stone cavern walls with embedded high-tech panels and wiring. Warm amber light from magma seeps through cracks in the rock, contrasting with cool cyan terminal glow.

---

## Perspective Setup

**1-point perspective, vanishing point at (480, 200).**

1. Place a guide dot at **(480, 200)**.
2. This room feels more enclosed than the corridor — the back wall is closer.
3. The circular window is the dominant focal point, drawing the eye to VP.
4. Stone walls have irregular edges (not perfectly straight like metal walls).

**Key Y landmarks:**
- `CEILING_Y = 35` (rough cave ceiling at front)
- `FLOOR_Y = 345` (floor top at front)
- `BACK_WALL_TOP = 100`
- `BACK_WALL_BOTTOM = 300`
- `BACK_WALL_LEFT = 240`
- `BACK_WALL_RIGHT = 720`

---

## Step-by-Step Drawing Order

### Step 1 — Back Wall (deepest layer)

**Area:** Rectangle centered on VP.
**Coords:** x: 240–720, y: 100–300
**Color:** Base fill `DARK_BLUE` (#1b2838).

**Rock texture:**
- Irregular horizontal strata lines at y=130, y=170, y=220, y=260: 1px `DEEP_NAVY` at 40%
- Subtle vertical crack at x=350, running from y=110 to y=250: 1px `DEEP_NAVY`
- Another crack at x=600, y=150 to y=280: 1px `DEEP_NAVY`, with a tiny branching line
- Scattered small rock texture dots (1-2px): `DARK_GREY` at 15%, about 30 randomly placed in this area

**Magma glow cracks** (2 fissures in the rock):
- Crack 1: Zigzag line from (260, 200) to (300, 270), 1px `ORANGE` with 2px `ORANGE` glow at 10%
- Crack 2: Short line at (650, 160) to (680, 210), 1px `YELLOW` at 60% with 4px `ORANGE` glow at 8%
- These suggest magma/heat visible through the rock

---

### Step 2 — The Circular Window (Central Feature)

**Position:** Centered on the back wall at **(480, 200)**.
**Outer diameter:** 180px (radius 90px).

**Drawing order (outside-in):**

1. **Rock rim:** Irregular circle, 8px thick
   - Outer edge: `DARK_GREY` (#5f574f) — rough hewn stone
   - Add 6–8 small irregularities (2-3px bumps) on the outer edge to look carved
   - Inner edge: 2px `BROWN` (#ab5236) — exposed stone
   - 4 metal bolt clusters (at 12, 3, 6, 9 o'clock positions): 4×4px squares `LIGHT_GREY` with 1px `DARK_GREY` shadow

2. **Metal frame ring:** 4px thick inside the stone rim
   - Color: `LIGHT_GREY` (#c2c3c7)
   - 1px inner highlight: `WHITE` at 30% (top-left quadrant only)
   - 1px outer shadow: `DEEP_NAVY` at 30% (bottom-right quadrant)
   - 8 equally-spaced rivets on the ring: 2×2px `DARK_GREY`

3. **Glass/viewport interior:** Circle, 74px radius
   - Fill: Gradient from `MED_BLUE` (#2d4a6a) at edges to `DEEP_NAVY` at center
   - The game will draw the interactive Earth layers diagram over this area
   - Add a subtle reflection: Curved arc in upper-left quadrant, `WHITE` at 6%, 2px wide

4. **Window glow:** 200px diameter circle `ORANGE` at 3% opacity behind everything — the warm light from the viewport

---

### Step 3 — Ceiling (Cave Ceiling)

**Coords:** Irregular trapezoid from canvas top to back wall top.

Approximate bounds:
| Corner      | x   | y   |
|-------------|-----|-----|
| Top-left    | 0   | 0   |
| Top-right   | 960 | 0   |
| Back-right  | 720 | 100 |
| Back-left   | 240 | 100 |

**Color:** Base fill `DEEP_NAVY` (#0d1b2a).

**Cave ceiling details:**
- The bottom edge should be **irregular** — not a straight line. Add stalactite-like bumps hanging down 5–15px at random intervals (about 8-10 bumps across the width)
- Each bump: Triangular, 3–8px wide at base, `DARK_BLUE` with `DEEP_NAVY` shadow on one side
- **Tech panels embedded in ceiling** (3 panels):
  - Panel 1: x: 200–280, y: 10–30 — Rectangular `DARK_GREY` frame, `DEEP_NAVY` face, 2 LED dots (`GREEN`, `CYAN`)
  - Panel 2: x: 440–520, y: 5–25 — Same style, with a tiny screen `CYAN` at 30%
  - Panel 3: x: 680–760, y: 10–30 — Same style, `ORANGE` LED
- **Cable runs:** 2 cables snaking along the ceiling from left panel to right:
  - 1px lines, `DARK_GREY`, with slight sag between panels
  - Cable clips every ~80px: 1×3px `LIGHT_GREY`

---

### Step 4 — Floor

**Coords:** Trapezoid from bottom of canvas up to back wall bottom.

| Corner       | x   | y   |
|--------------|-----|-----|
| Front-left   | 0   | 540 |
| Front-right  | 960 | 540 |
| Back-right   | 720 | 300 |
| Back-left    | 240 | 300 |

**Color:** Base fill `DARK_GREY` (#5f574f).

**Floor texture — Rough stone with metal walkway:**

1. **Stone floor base:** Fill entire trapezoid with `DARK_GREY`
   - Scattered stone texture: 40+ random 1-2px dots in `BROWN` at 15% and `DEEP_NAVY` at 20%
   - Horizontal strata lines every ~30px: 1px `DEEP_NAVY` at 15%

2. **Central metal walkway** (where player would stand):
   - x: 340–620, full depth (front to back)
   - `DARK_GREY` base with diamond plate pattern:
     - Grid lines every 14px horizontal, 20px vertical, `DEEP_NAVY` at 30%
     - 2×2 rivet dots at intersections, `LIGHT_GREY` at 10%
   - 2px edge rails on each side: `LIGHT_GREY` at 30%

3. **Floor seam at wall junction** (y=345): 1px `DEEP_NAVY` at 40%

---

### Step 5 — Left Wall (Cave + Tech)

**Coords:** Trapezoid:

| Corner       | x   | y   |
|--------------|-----|-----|
| Top-front    | 0   | 35  |
| Top-back     | 240 | 100 |
| Bottom-back  | 240 | 300 |
| Bottom-front | 0   | 345 |

**Color:** Fill `DARK_BLUE` (#1b2838).

**Rock texture (base):**
- Irregular horizontal strata: Lines at varied intervals (30-50px), 1px `DEEP_NAVY` at 25%
- Vertical crack at x=80, y=80 to y=300: 1px `DEEP_NAVY`, branching at y=180
- Small rock texture dots: 15+ dots of `DARK_GREY` at 12% scattered randomly

**Embedded tech panels (2):**

**Terminal Station A** (upper, x: 20–100, y: 130–230):
- Outer frame: 2px `DARK_GREY` border, slightly recessed (1px `DEEP_NAVY` inset shadow)
- Screen area: 60×50px, `DEEP_NAVY` fill
- Screen glow: 1px inner border `CYAN` at 20%
- Below screen: Button row — 3 circles (3px each): `RED`, `YELLOW`, `GREEN`
- Side cable: 1px `DARK_GREY` running from panel up to ceiling cable run
- Small status bar below: 4 horizontal `CYAN` bars of varying width (2px tall)

**Terminal Station B** (lower, x: 30–110, y: 250–330):
- Same frame style as Station A
- Screen area: 60×40px, `DEEP_NAVY` fill with `GREEN` tint at 5%
- Tiny bar graph on screen: 5 vertical bars (2px wide, `GREEN`, varying heights)
- Keypad below: 3×3 grid of tiny buttons (2×2px each, `DARK_GREY` with `LIGHT_GREY` top pixel)

---

### Step 6 — Right Wall (Cave + Tech)

Mirror of left wall structure with different terminal details.

**Terminal Station C** (upper, x: 860–940, y: 130–230):
- Same frame as Station A
- Screen shows tiny circular radar sweep: 20px circle `DEEP_NAVY`, arc `GREEN` at 30%
- 2 status LEDs: `GREEN` and `ORANGE` (3px circles)

**Terminal Station D** (lower, x: 850–930, y: 250–330):
- Same frame as Station B
- Screen shows tiny waveform: `CYAN` sine wave, 3 cycles, 2px amplitude
- Toggle switch: 4×8px rectangle `DARK_GREY` with `WHITE` 1px indicator position

**Additional rock feature** (right wall only):
- A larger magma crack at x=900, y=200 to y=280
  - 2px wide `ORANGE` line with 6px `ORANGE` glow at 6%
  - A tiny drip of `YELLOW` at the bottom of the crack (2×3px)

---

### Step 7 — Lighting

**Primary warm ambient** from circular window:
- Radial glow centered on (480, 200): 250px radius
- `ORANGE` at 4% → 0% (use concentric circles with decreasing opacity)
- Stronger at bottom of window (magma is below)

**Secondary cool light** from terminal screens:
- Each of the 4 terminal screens casts a small rectangular glow
- 40×30px area in front of each screen, `CYAN` at 3%

**Floor spot** below window:
- Oval 80×20px at (480, 320), `ORANGE` at 5% — light falling from the window to the floor

**Ceiling tech panel indicators:**
- The 3 ceiling panels each cast a tiny colored dot on the floor below:
  - `GREEN` at 2%, 8px circles

---

### Step 8 — Depth & Shadow

**Vignette effect:**
- Left edge (x: 0–60): Darken `DEEP_NAVY` at 30% → 0%
- Right edge (x: 900–960): Same
- Top edge (y: 0–20): Darken `DEEP_NAVY` at 20%
- Bottom corners: Extra dark, `DEEP_NAVY` at 15% in 80×60px triangular areas

**Window recess shadow:**
- The circular window sits recessed in the rock
- 6px shadow ring on the right and bottom of the window rim: `DEEP_NAVY` at 25%
- This gives the window 3D depth

**Wall-floor junction:**
- At y=345 on the floor side: 6px gradient `DEEP_NAVY` from 30% → 0%
- Wider than corridor version because cave walls create deeper shadows

**Corner shadows:**
- Where side walls meet back wall (x=240 and x=720): 10px gradient `DEEP_NAVY` at 25%
- These are softer and wider than the corridor (organic rock vs clean metal)

**Terminal station shadows:**
- Each terminal casts a small shadow below it: 4px gradient `DEEP_NAVY` at 15%

---

### Step 9 — Environmental Details

**Geological sample tray** (on floor, front-left, x: 140, y: 370):
- Rectangular tray: 30×10px, `DARK_GREY` border, `BROWN` interior
- 4 tiny colored rock samples inside: `RED` (2px), `ORANGE` (2px), `BROWN` (2px), `INDIGO` (2px)

**Pickaxe leaning on left wall** (x: 130, y: 250–320):
- Handle: 2px wide, 70px tall, `BROWN` (#ab5236)
- Head: 12×6px, `LIGHT_GREY` with `DARK_GREY` shadow
- Angled at ~15° from vertical

**Safety helmet on floor** (x: 820, y: 365):
- Dome: 10×6px, `YELLOW` (#ffec27)
- Brim: 12×2px, `ORANGE`
- Light on front: 2px circle `WHITE` at 50%

**Seismograph printout** (pinned to back wall, x: 270, y: 140):
- Paper: 16×24px, `WHITE` at 60%
- Wavy line on paper: 1px `RED` zigzag

**Depth marker sign** (on back wall, x: 690, y: 150):
- 24×12px panel, `DARK_GREY` frame
- Text area: `ORANGE` colored (game may overlay actual text)
- Suggests "DEPTH: 2,900km" — positioning this in the outer core zone

**Power conduit junction box** (right wall, x: 870, y: 180):
- 16×20px box, `DARK_GREY` with `LIGHT_GREY` latch
- 3 cables emerging from top: `DARK_GREY` 1px lines going to ceiling
- Warning sticker: 4×4px `YELLOW` triangle

---

### Step 10 — Final Polish

1. **No anti-aliasing.** All edges pixel-sharp.
2. **Dithering:** Use for the window's radial glow and the magma crack glows. Ordered 2×2 Bayer pattern only.
3. **Rock texture variety:** Ensure left and right walls have different crack patterns (not a simple mirror). The cave should feel organic.
4. **Color temperature contrast:** The left half of the room should feel slightly warmer (closer to magma cracks), the right half slightly cooler (more tech panels). Achieve this with very subtle (2-3%) color overlays.
5. **Color check:** Verify only PICO-8 colors. No extras.
6. **Save as:** PNG, no transparency, 960×540 px exactly.

---

## Layer Suggestion (Aseprite)

| Layer Name       | Contents                                 |
|------------------|------------------------------------------|
| Vignette         | Edge darkening, corner shadows           |
| Lights           | Window glow, terminal glows, floor spots |
| Details          | Sample tray, pickaxe, helmet, printout   |
| Terminals        | All 4 terminal stations (A-D)            |
| Window           | Circular viewport + rim + bolts          |
| Back Wall        | Rock texture, magma cracks, signs        |
| Walls            | Left + right cave walls with rock texture|
| Floor            | Stone floor + metal walkway              |
| Ceiling          | Cave ceiling + stalactites + tech panels |
| Background       | Flat `DEEP_NAVY` fill                    |

Work from bottom layer up. Lock lower layers as you complete them.
