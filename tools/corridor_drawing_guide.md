# ShipHub Corridor Background — Pixel Art Drawing Guide

**Canvas:** 960 × 540 px | **Palette:** PICO-8 only | **Tool:** Aseprite
**Save to:** `assets/backgrounds/corridor_bg.png`

---

## PICO-8 Palette Reference

| Name        | Hex       | Use for                        |
|-------------|-----------|--------------------------------|
| DEEP_NAVY   | `#0d1b2a` | Deepest shadows, recesses      |
| DARK_BLUE   | `#1b2838` | Wall base, dark panels         |
| MED_BLUE    | `#2d4a6a` | Wall mid-tone, door frames     |
| BRIGHT_BLUE | `#29adff` | Accent lights, active elements |
| CYAN        | `#53d8fb`  | Highlight glow, status lights  |
| WHITE       | `#fff1e8` | Brightest highlights, specular |
| LIGHT_GREY  | `#c2c3c7` | Metal surfaces lit side        |
| DARK_GREY   | `#5f574f` | Metal surfaces shadow side     |
| RED         | `#ff004d` | Warning lights, locked doors   |
| ORANGE      | `#ffa300` | Warm lights, Act 1 indicator   |
| YELLOW      | `#ffec27` | Brightest warm light, caution  |
| GREEN       | `#00e436` | Active/unlocked indicators     |
| PINK        | `#ff77a8` | Dr. Magneta accent             |
| INDIGO      | `#83769c` | Distant/cool surfaces          |
| BROWN       | `#ab5236` | Rust, aged metal               |

---

## Perspective Setup

**1-point perspective, vanishing point at center.**

1. Place a guide dot at **(480, 200)** — this is the vanishing point (VP).
   It sits above center to give the feeling of looking slightly down a corridor.
2. Draw 4 converging guide lines from VP to each canvas corner.
   These define where ceiling meets walls and walls meet floor.
3. The corridor is a **front-facing hallway** — the viewer stands at one end
   looking toward the VP. Walls recede left and right, ceiling recedes up,
   floor recedes down.

---

## Step-by-Step Drawing Order

### Step 1 — Back Wall (deepest layer)

**Area:** A rectangle centered on VP, roughly **320 × 160 px**.
**Coords:** x: 320–640, y: 120–280
**Color:** Fill with `DEEP_NAVY` (#0d1b2a).
This is the farthest wall visible at the end of the corridor.

Add 2–3 horizontal panel lines in `DARK_BLUE` (#1b2838) across this rectangle at y=160, y=200, y=240 for depth.

---

### Step 2 — Ceiling

**Coords:** From top of canvas (y=0) down to the top perspective lines.

| Edge | Left x | Right x | y   |
|------|--------|---------|-----|
| Front edge (nearest) | 0 | 960 | 0   |
| Back edge (at VP depth) | 320 | 640 | 120 |

**Color:** Fill the trapezoid with `DARK_BLUE` (#1b2838).

**Details to add:**
- **3 horizontal pipes** running left-to-right at y=8, y=16, y=24:
  - Pipe body: 4px tall, `DARK_GREY` (#5f574f)
  - Top highlight: 1px, `LIGHT_GREY` (#c2c3c7) at 20% opacity
  - Bottom shadow: 1px, `DEEP_NAVY` (#0d1b2a)
  - Rivets every 40px: 2×2 px `LIGHT_GREY` dots
- Pipes should converge slightly toward VP as they go deeper
- **Ceiling panels:** Vertical lines every ~120px, `DEEP_NAVY` 15% opacity

---

### Step 3 — Floor

**Coords:** From bottom of canvas up to the bottom perspective lines.

| Edge | Left x | Right x | y   |
|------|--------|---------|-----|
| Front edge (nearest) | 0 | 960 | 540 |
| Back edge (at VP depth) | 320 | 640 | 280 |

This means: **FLOOR_Y at the nearest point = y 335** (62% of 540).
The floor plane is a trapezoid from y=335 (front) to y=280 (back).

**Color:** Base fill `DARK_GREY` (#5f574f).

**Floor texture — Diamond plate pattern:**
1. Draw a grid of horizontal lines every 18px and vertical lines every 28px in `DEEP_NAVY` at 40% opacity.
2. At each grid intersection, place a 2×2 px rivet dot:
   - Bottom-right pixel: `LIGHT_GREY` (#c2c3c7) at 15% (specular)
   - Other pixels: `DARK_GREY` (#5f574f) at 30%
3. The grid should follow perspective: lines closer to VP are tighter together, lines at the front are wider apart.

**Floor highlight strip:** At y=335 (the wall-floor seam), draw a 1px line of `LIGHT_GREY` at 15% opacity — this is the baseboard reflection.

---

### Step 4 — Left Wall

**Coords:** Trapezoid from canvas left edge to VP-area left edge.

| Corner      | x   | y   |
|-------------|-----|-----|
| Top-front   | 0   | 0   |
| Top-back    | 320 | 120 |
| Bottom-back | 320 | 280 |
| Bottom-front| 0   | 540 |

But the visible wall runs from ceiling bottom (~y=43 at front) to floor top (~y=335 at front).

**Color:** Fill with `DARK_BLUE` (#1b2838).

**Wall details:**
- **Horizontal paneling:** Lines every 4px in `#152030` at 25% opacity
- **Vertical panel dividers:** Every ~160px (perspective-adjusted), 2px wide, `DEEP_NAVY`
- **Wall gradient:** Slightly lighter at top (add `MED_BLUE` at 6% opacity, fading down)

---

### Step 5 — Right Wall

Mirror of left wall. Same colors and panel details, flipped horizontally.

---

### Step 6 — The 4 Doors

All doors are identical size. They sit on the wall plane.
At 960×540 with the game's layout:

| Door # | Room       | Center X | Width | Height | Status Color |
|--------|------------|----------|-------|--------|-------------|
| 0      | Lab        | 192      | 120   | 180    | ORANGE #ffa300 |
| 1      | Navigation | 384      | 120   | 180    | BRIGHT_BLUE #29adff |
| 2      | Research   | 576      | 120   | 180    | GREEN #00e436 |
| 3      | Bridge     | 768      | 120   | 180    | RED #ff004d |

**Door top y:** `FLOOR_Y - 180` = 335 - 180 = **y 155**
**Door bottom y:** **y 335** (flush with floor)

Note: Doors 0 and 3 are on the left and right walls respectively, so they should appear slightly angled/foreshortened in perspective. Doors 1 and 2 are closer to center and appear more front-facing.

**How to draw each door:**

1. **Door recess** (2px inset all around): `DEEP_NAVY` (#0d1b2a) — makes the door look set into the wall
2. **Door frame:** 4px border of `DARK_GREY` (#5f574f)
   - Top and left frame edges: 1px highlight of `LIGHT_GREY` (#c2c3c7) at 20%
   - Bottom and right frame edges: 1px shadow of `DEEP_NAVY`
3. **Door panel:** Fill interior with `DARK_BLUE` (#1b2838)
   - Draw a centered vertical split line (2-panel door) in `DEEP_NAVY`
   - Upper panel: small rectangular viewport/window, 40×20 px, filled `MED_BLUE` (#2d4a6a) with 1px `BRIGHT_BLUE` border
4. **Door handle:** Right side (or left for RTL), y = door center
   - 2×8 px rectangle, `LIGHT_GREY` (#c2c3c7)
   - 1×1 px white specular at top
5. **Status light above door:** Centered, 6px above door top
   - Circle: 6px diameter
   - Color: Use the status color from the table above
   - Add a 12px radius glow circle at 10% opacity of the same color
6. **Room label:** Centered below the status light, inside the door recess area
   - The game draws labels dynamically, but leave visual space for them

---

### Step 7 — Ceiling Lights

Place **3 overhead lights** at x = 192, 480, 768 (aligned with door spacing).

**Each light:**
1. **Fixture:** 8×4 px rectangle on ceiling, `DARK_GREY`
2. **Bulb:** 4×2 px below fixture, `YELLOW` (#ffec27) at 90%
3. **Light cone:** Triangular glow below each fixture
   - Starts narrow (16px wide) at the fixture
   - Expands to ~100px wide where it hits the floor
   - Use `YELLOW` at decreasing opacity: 6% → 2% → 0%
   - Draw as stacked horizontal rectangles, each wider than the last
4. **Specular on floor:** Directly below each light at floor level
   - Oval shape ~40×8 px, `YELLOW` at 5% opacity

---

### Step 8 — Depth & Shadow

**Vignette effect:**
- Left and right edges (0-60px and 900-960px): Darken with `DEEP_NAVY` at 20-40% opacity, fading toward center
- Top 30px: Darken with `DEEP_NAVY` at 15%

**Wall-floor shadow:**
- At y=335 (floor seam), add a 4px gradient shadow on the floor side:
  `DEEP_NAVY` from 30% → 0% opacity

**Wall-ceiling shadow:**
- At the ceiling-wall junction, add 2px of `DEEP_NAVY` at 20%

**Between doors:**
- The wall sections between doors should be slightly lighter than the wall sections at the edges, since they receive more light from the ceiling fixtures

**Door recesses cast shadows:**
- Each door recess has a 2px shadow on the right side and bottom, `DEEP_NAVY` at 30%

---

### Step 9 — Environmental Details

**Fire extinguisher** (between doors 0 and 1):
- x: ~288, y: ~260 (wall height, between Lab and Nav doors)
- Red cylinder: 8×16 px, `RED` (#ff004d)
- Nozzle: 2×4 px on top, `DARK_GREY`
- Wall bracket: 2×12 px behind it, `DARK_GREY`

**Emergency panel** (between doors 2 and 3):
- x: ~672, y: ~240
- 20×14 px panel, `DARK_GREY` border, `DEEP_NAVY` interior
- Small red and green indicator dots (2px each)
- "EMERGENCY" — very tiny, optional (the game may overlay text)

**Deck number sign** (on back wall, centered):
- Near VP, small sign: 24×12 px
- `DARK_GREY` background, `BRIGHT_BLUE` text "D2"

**Porthole** (optional, on back wall left of center):
- x: ~400, y: ~180
- Circular frame: 24px diameter, `DARK_GREY` ring, 2px thick
- Interior: `MED_BLUE` (#2d4a6a) with a hint of stormy sky
- Specular: 1-2 px of `WHITE` at top-left of glass

---

### Step 10 — Final Polish

1. **Ambient particles:** Not drawn (game adds these dynamically)
2. **Anti-aliasing:** Do NOT anti-alias. Keep all edges pixel-sharp.
3. **Dithering:** Use sparingly — only for light cone gradients and vignette edges. Use ordered 2×2 Bayer dithering, never diffusion.
4. **Color count check:** Verify you only used the 15 PICO-8 colors listed above. No other colors.
5. **Save as:** PNG, no transparency, 960×540 px exactly.

---

## Layer Suggestion (Aseprite)

| Layer Name      | Contents                           |
|-----------------|------------------------------------|
| Vignette        | Edge darkening, shadows            |
| Lights          | Light cones, specular highlights   |
| Details         | Fire extinguisher, panels, signs   |
| Doors           | All 4 doors + frames + status LEDs |
| Walls           | Left wall, right wall, back wall   |
| Floor           | Floor surface + texture            |
| Ceiling         | Ceiling surface + pipes            |
| Background      | Flat `DEEP_NAVY` fill              |

Work from bottom layer up. Lock lower layers as you complete them.
