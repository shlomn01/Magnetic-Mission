# Navigation Room Background — Pixel Art Drawing Guide

**Canvas:** 960 × 540 px | **Palette:** PICO-8 only | **Tool:** Aseprite
**Save to:** `assets/backgrounds/navigation_bg.png`

---

## PICO-8 Palette Reference

| Name        | Hex       | Use for                        |
|-------------|-----------|--------------------------------|
| DEEP_NAVY   | `#0d1b2a` | Deepest shadows, recesses      |
| DARK_BLUE   | `#1b2838` | Wall base, dark panels         |
| MED_BLUE    | `#2d4a6a` | Wall mid-tone, door frames     |
| BRIGHT_BLUE | `#29adff` | Accent lights, active elements |
| CYAN        | `#53d8fb` | Highlight glow, instrument screens |
| WHITE       | `#fff1e8` | Brightest highlights, specular |
| LIGHT_GREY  | `#c2c3c7` | Metal surfaces lit side        |
| DARK_GREY   | `#5f574f` | Metal surfaces shadow side     |
| RED         | `#ff004d` | Warning zones, error indicators|
| ORANGE      | `#ffa300` | Warm warning lights, caution   |
| YELLOW      | `#ffec27` | Brightest warm light           |
| GREEN       | `#00e436` | Active/correct indicators      |
| PINK        | `#ff77a8` | Subtle accent                  |
| INDIGO      | `#83769c` | Cool distant surfaces          |
| BROWN       | `#ab5236` | Rust, aged metal, wood trim    |

---

## Room Concept

A **ship's navigation control room** viewed from the front. The player stands at the entrance looking at a curved console desk spanning the lower half of the room. Three instrument panels are built into the desk. Dark metal walls with industrial pipes, riveted plating, and overhead strip lighting. The mood is tense — cyan instrument glow against deep navy walls, with orange warning lights punctuating the darkness.

---

## Perspective Setup

**1-point perspective, vanishing point at (480, 200).**

1. Place a guide dot at **(480, 200)** — the vanishing point (VP).
2. The room is wider at the bottom (viewer's position) and narrows toward VP.
3. The back wall is visible as a rectangle roughly centered on VP.
4. Left and right walls angle inward from canvas edges toward the back wall.
5. The ceiling slopes down from top of canvas to the top of the back wall.
6. The floor slopes up from bottom of canvas to the bottom of the back wall.

**Key Y landmarks:**
- `CEILING_Y = 43` (ceiling bottom at front)
- `FLOOR_Y = 335` (floor top at front)
- `BACK_WALL_TOP = 130`
- `BACK_WALL_BOTTOM = 270`
- `BACK_WALL_LEFT = 280`
- `BACK_WALL_RIGHT = 680`

---

## Step-by-Step Drawing Order

### Step 1 — Back Wall (deepest layer)

**Area:** Rectangle centered on VP.
**Coords:** x: 280–680, y: 130–270
**Color:** Fill with `DEEP_NAVY` (#0d1b2a).

**Details:**
- 3 horizontal panel seam lines at y=160, y=200, y=240 in `DARK_BLUE` (#1b2838), 1px each
- A large **central display screen** mounted on the back wall:
  - Position: x: 380–580, y: 140–240 (200×100 px)
  - Outer frame: 3px border `DARK_GREY` (#5f574f)
  - Screen interior: Fill `DARK_BLUE` (#1b2838)
  - Screen glow: 1px inner border `MED_BLUE` (#2d4a6a)
  - The game will draw dynamic content over this area
- Two small **warning lights** flanking the screen:
  - Left: x=350, y=180 — 4px circle `ORANGE` (#ffa300) + 10px glow at 8%
  - Right: x=610, y=180 — 4px circle `ORANGE` (#ffa300) + 10px glow at 8%

---

### Step 2 — Ceiling

**Coords:** Trapezoid from canvas top to back wall top.

| Corner      | x   | y   |
|-------------|-----|-----|
| Top-left    | 0   | 0   |
| Top-right   | 960 | 0   |
| Back-right  | 680 | 130 |
| Back-left   | 280 | 130 |

**Color:** Fill with `DARK_BLUE` (#1b2838).

**Overhead lighting strips (3 strips):**
Position at x=240, x=480, x=720 running front-to-back.

Each strip:
1. **Housing:** 6px wide, full depth (y=0 to back wall), `DARK_GREY` (#5f574f)
2. **Light surface:** 2px wide centered inside housing, `CYAN` (#53d8fb) at 70%
3. **Glow cone below:** Expands downward as a gradient trapezoid
   - Width: starts at 8px, expands to ~80px at FLOOR_Y
   - Color: `CYAN` at 4% → 1% → 0% opacity
   - Draw as stacked horizontal rects, each wider than the last

**Ceiling panels:** Vertical seam lines every ~100px (perspective-adjusted), `DEEP_NAVY` at 15% opacity.

**Cable conduit:** 1 horizontal pipe at y=10:
- 3px tall, `DARK_GREY`, with 1px `LIGHT_GREY` top highlight
- Rivets every 60px: 2×2px `LIGHT_GREY` dots

---

### Step 3 — Floor

**Coords:** Trapezoid from bottom of canvas up to back wall bottom.

| Corner       | x   | y   |
|--------------|-----|-----|
| Front-left   | 0   | 540 |
| Front-right  | 960 | 540 |
| Back-right   | 680 | 270 |
| Back-left    | 280 | 270 |

**Color:** Base fill `DARK_GREY` (#5f574f).

**Floor texture — Metal grating:**
1. Draw horizontal lines every 16px in `DEEP_NAVY` at 35% opacity
2. Draw vertical lines every 24px in `DEEP_NAVY` at 25% opacity
3. Lines should follow perspective (tighter near VP, wider at front)
4. At grid intersections, place 2×2px rivet dots: `LIGHT_GREY` at 12% (specular catch)

**Anti-fatigue mat strip** at front of console desk (y: 370–380):
- 960px wide, 10px tall, `BROWN` (#ab5236) at 40%
- Adds a grounding visual element showing where someone would stand

**Floor highlight strip** at y=335 (wall-floor seam): 1px `LIGHT_GREY` at 12%

---

### Step 4 — Left Wall

**Coords:** Trapezoid:

| Corner       | x   | y   |
|--------------|-----|-----|
| Top-front    | 0   | 43  |
| Top-back     | 280 | 130 |
| Bottom-back  | 280 | 270 |
| Bottom-front | 0   | 335 |

**Color:** Fill `DARK_BLUE` (#1b2838).

**Wall details:**
- **Horizontal panel seams:** Every 48px, 1px lines in `DEEP_NAVY` at 30%
- **Vertical riveted column** at x=60: 4px wide `DARK_GREY`, with `LIGHT_GREY` 1px highlight on left edge
- **Pipe run:** A vertical pipe at x=30 from ceiling to floor
  - 3px wide `DARK_GREY`, 1px `LIGHT_GREY` highlight on left
  - 4 horizontal bracket straps crossing the pipe every 60px, 1×6px `DARK_GREY`
- **Small valve wheel** at x=50, y=220:
  - 8px circle outline `BROWN` (#ab5236), 1px thick
  - Center dot 2px `DARK_GREY`

---

### Step 5 — Right Wall

Mirror of left wall, flipped horizontally.

**Additional detail — Emergency panel:**
- Position: x=890, y=220 (mirrored from x=60 zone)
- 24×18px panel, `DARK_GREY` border, `DEEP_NAVY` interior
- 3 indicator dots in a row: `RED` (2px), `YELLOW` (2px), `GREEN` (2px)
- Small "!" triangle in `ORANGE` at top, 4×4px

---

### Step 6 — Console Desk (Main Feature)

The console is a **large curved desk** spanning most of the room width. It is the primary visual element.

**Desk surface:**
- Shape: A slightly curved horizontal band (convex toward viewer)
- Top edge y: 345 (just below FLOOR_Y)
- Bottom edge y: 420
- Left x: 80, Right x: 880
- The curve: center (x=480) is at y=340 (5px higher than edges)
- Draw as a series of 1px horizontal bands following a gentle arc

**Desk colors:**
- Top surface: `DARK_GREY` (#5f574f)
- Front face (y: 345–420): `MED_BLUE` (#2d4a6a)
- Front face highlight: 1px line at y=345 in `LIGHT_GREY` at 20% (desk edge catch)
- Front face shadow: Bottom 4px gradient to `DEEP_NAVY`

**Desk panel trim:**
- Vertical divider lines on the front face at x=280 and x=680, 2px wide `DARK_BLUE`
- These divide the desk into 3 sections (one per instrument panel)

**3 instrument panel recesses** (where game draws interactive UI):
Each is a dark rectangular inset in the desk surface.

| Panel         | Center X | Top Y | Width | Height | Purpose              |
|---------------|----------|-------|-------|--------|----------------------|
| Left panel    | 180      | 350   | 180   | 60     | Calibration Dial     |
| Center panel  | 480      | 348   | 200   | 64     | Signal Monitor       |
| Right panel   | 780      | 350   | 180   | 60     | Compass Module       |

For each panel recess:
1. Fill with `DEEP_NAVY` (#0d1b2a)
2. 1px inset border: top and left `DEEP_NAVY` at 60%, bottom and right `DARK_GREY` at 30% (beveled inset)
3. Faint screen glow: 1px inner border `CYAN` (#53d8fb) at 15%
4. The game will draw interactive instruments over these areas

**Status indicator strip** below each panel:
- 3 tiny LED dots below each panel (2px each), spaced 8px apart
- Colors: `GREEN`, `ORANGE`, `RED` — creating a subtle tech detail

---

### Step 7 — Side Instrument Racks

**Left rack** (against left wall, x: 10–70, y: 160–310):
- A tall narrow equipment rack, 60×150px
- Outer frame: `DARK_GREY` border 2px
- Interior: Stack of 5 horizontal modules (each 56×26px):
  - Module body: `DEEP_NAVY` fill
  - Module face: 1px `DARK_BLUE` border
  - Each module has 2-3 tiny LED dots (`GREEN`, `CYAN`, `ORANGE`) at random positions
  - One module has a tiny bar graph (4 vertical bars, 2px wide, varying heights, `CYAN`)

**Right rack** (mirror position, x: 890–950, y: 160–310):
- Same structure as left rack, mirrored
- One module should have a tiny circular radar sweep (6px circle, `GREEN` arc)

---

### Step 8 — Ceiling Fixtures & Ambient Light

**3 recessed ceiling lights** at x=240, x=480, x=720:
Each light (already drawn as strip in Step 2) casts a cone of light.

**Additional warm warning lights (2):**
- Position: x=150, y=50 and x=810, y=50 (on ceiling near walls)
- 3px circle `ORANGE` (#ffa300) at 80%
- 16px glow radius at 6% opacity

**Back wall ambient:** The central screen casts a soft rectangular glow:
- 220×120px rectangle centered on the screen, `CYAN` at 3% opacity
- Creates the impression of a lit display illuminating the wall

---

### Step 9 — Depth & Shadow

**Vignette effect:**
- Left edge (x: 0–50): Darken with `DEEP_NAVY` at 25% → 0%
- Right edge (x: 910–960): Same as left
- Top edge (y: 0–25): Darken with `DEEP_NAVY` at 15%

**Wall-floor shadow:**
- At y=335 on the floor side: 4px gradient `DEEP_NAVY` from 25% → 0%

**Console desk shadow on floor:**
- In front of the desk (y: 420–435): Gradient `DEEP_NAVY` from 20% → 0%
- This grounds the desk in the scene

**Between instrument panels:**
- Desk surface between panels is slightly lighter (receives more overhead light)

**Corner shadows:**
- Where left/right walls meet the back wall (x=280 and x=680): 8px vertical gradient `DEEP_NAVY` at 20%

---

### Step 10 — Environmental Details

**Clipboard on desk** (right side, x=650, y=346):
- 10×14px, `WHITE` (#fff1e8) at 50% with 4 tiny `DARK_GREY` "text" lines

**Coffee mug** (left side of desk, x=100, y=342):
- Cylinder: 6×8px, `BROWN` (#ab5236)
- Handle: 2px C-shape on right side, `BROWN`
- Steam: 2 single-pixel wisps above, `LIGHT_GREY` at 20%

**Headset** (on desk near center-left, x=320, y=344):
- Curved band: 12px wide arc, 2px thick, `DARK_GREY`
- Two ear cups: 4×4px circles at each end, `DARK_GREY` with `LIGHT_GREY` center dot

**Wall clock** (back wall, above screen, x=480, y=138):
- 12px circle `DARK_GREY` outline
- `WHITE` face, 2 tiny `DEEP_NAVY` hands
- Red second dot at 12 o'clock position (2px, `RED`)

---

### Step 11 — Final Polish

1. **No anti-aliasing.** Keep all edges pixel-sharp.
2. **Dithering:** Use sparingly — only for light cone gradients and vignette. Ordered 2×2 Bayer pattern only, never diffusion.
3. **Color check:** Verify only PICO-8 colors used. No extras.
4. **Save as:** PNG, no transparency, 960×540 px exactly.

---

## Layer Suggestion (Aseprite)

| Layer Name       | Contents                              |
|------------------|---------------------------------------|
| Vignette         | Edge darkening, shadows               |
| Lights           | Light cones, screen glows, LEDs       |
| Details          | Clipboard, mug, headset, clock        |
| Console          | Desk surface, front face, panel insets|
| Side Racks       | Left + right equipment racks          |
| Back Wall        | Central screen, warning lights        |
| Walls            | Left wall, right wall with pipes      |
| Floor            | Floor surface + grating texture       |
| Ceiling          | Ceiling surface + light strips + pipe |
| Background       | Flat `DEEP_NAVY` fill                 |

Work from bottom layer up. Lock lower layers as you complete them.

---

## Sprite Specifications (separate files)

These 3 instrument panels are drawn by the game engine at runtime, but if you want to create static reference sprites:

### Calibration Dial — `sprites/panel_calibration.png` (200×150 px)

- Background: `DEEP_NAVY`
- Circular dial: 100px diameter, centered
- Dial face: `DARK_BLUE` fill, 1px `MED_BLUE` ring
- Tick marks: 24 short marks around the rim, `LIGHT_GREY`, every 15°
- Major ticks: at 0°, 90°, 180°, 270° — 6px long, `WHITE`
- Minor ticks: 3px long, `LIGHT_GREY`
- **Red zone:** Arc from 300°–360°, 4px wide `RED` at 40% (danger zone)
- Needle: 2px wide, 45px long, `CYAN` (#53d8fb) with `WHITE` tip
- Center pivot: 4px circle `DARK_GREY` with `LIGHT_GREY` specular dot
- Number readout below dial: 60×20px rectangle `DEEP_NAVY`, with seven-segment style digits `CYAN`

### Signal Monitor — `sprites/panel_signal.png` (200×150 px)

- Background: `DEEP_NAVY`
- Screen area: 180×110px, 2px border `DARK_GREY`, `DARK_BLUE` fill
- Grid overlay: Faint lines every 20px, `MED_BLUE` at 15%
- Waveform: Sine wave, 2px thick `GREEN` (#00e436), amplitude ~30px, ~3 full cycles
- Center horizontal line: 1px `MED_BLUE` at 30% (zero-line)
- Status bar at bottom: 180×16px, `DEEP_NAVY`
- Status text area: left-aligned, `CYAN` colored placeholder text space
- Tiny signal strength bars (right side): 4 vertical bars `GREEN`, heights 4/8/12/16px

### Compass Module — `sprites/panel_compass.png` (200×150 px)

- Background: `DEEP_NAVY`
- Compass rose: 90px diameter circle, `DARK_BLUE` fill, 1px `MED_BLUE` ring
- Cardinal points: N (top, `RED` 6px text), S (bottom, `LIGHT_GREY`), E (right, `LIGHT_GREY`), W (left, `LIGHT_GREY`)
- 8 intercardinal tick marks: 3px `DARK_GREY`
- Outer degree ring: Tiny ticks every 10°, `DARK_GREY`
- Needle: Red triangle pointing N (8×30px), blue triangle pointing S (8×30px)
- Center: 3px circle `DARK_GREY` with `WHITE` specular
- Heading readout below: "000°" in `CYAN` seven-segment style, 50×18px `DEEP_NAVY` background
