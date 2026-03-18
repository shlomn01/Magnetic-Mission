-- Lab Background (960x540)
local spr = Sprite(960, 540, ColorMode.RGB)
spr.filename = "lab_bg.png"
local cel = spr.cels[1]
local img = cel.image

-- PICO-8 palette
local DEEP_NAVY = Color{r=13, g=27, b=42, a=255}
local DARK_BLUE = Color{r=27, g=40, b=56, a=255}
local MED_BLUE = Color{r=45, g=74, b=106, a=255}
local BRIGHT_BLUE = Color{r=41, g=173, b=255, a=255}
local CYAN = Color{r=83, g=216, b=251, a=255}
local WHITE = Color{r=255, g=241, b=232, a=255}
local LIGHT_GREY = Color{r=194, g=195, b=199, a=255}
local DARK_GREY = Color{r=95, g=87, b=79, a=255}
local RED = Color{r=255, g=0, b=77, a=255}
local ORANGE = Color{r=255, g=163, b=0, a=255}
local YELLOW = Color{r=255, g=236, b=39, a=255}
local GREEN = Color{r=0, g=228, b=54, a=255}
local DARK_GREEN = Color{r=0, g=135, b=81, a=255}
local BROWN = Color{r=171, g=82, b=54, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}
local INDIGO = Color{r=131, g=118, b=156, a=255}
local PINK = Color{r=255, g=119, b=168, a=255}
local SKIN = Color{r=255, g=204, b=170, a=255}

local function rect(x1, y1, x2, y2, col)
  for y = math.max(0, y1), math.min(539, y2) do
    for x = math.max(0, x1), math.min(959, x2) do
      img:drawPixel(x, y, col)
    end
  end
end

local function hline(x1, x2, y, col)
  if y < 0 or y >= 540 then return end
  for x = math.max(0, x1), math.min(959, x2) do
    img:drawPixel(x, y, col)
  end
end

local function vline(x, y1, y2, col)
  if x < 0 or x >= 960 then return end
  for y = math.max(0, y1), math.min(539, y2) do
    img:drawPixel(x, y, col)
  end
end

-- CEILING (rows 0-70)
rect(0, 0, 959, 70, Color{r=50, g=45, b=40, a=255})

-- Ceiling pipes
rect(0, 10, 959, 16, DARK_BLUE)
rect(0, 12, 959, 14, MED_BLUE)
rect(0, 40, 959, 46, DARK_BLUE)
rect(0, 42, 959, 44, MED_BLUE)

-- 3 overhead lights with glow cones
local lights = {200, 480, 760}
for _, lx in ipairs(lights) do
  -- Light fixture
  rect(lx - 24, 55, lx + 24, 64, LIGHT_GREY)
  rect(lx - 18, 64, lx + 18, 68, WHITE)
  -- Glow cone
  for dy = 0, 160 do
    local spread = math.floor(dy * 0.7)
    local intensity = math.max(0, 80 - math.floor(dy * 0.5))
    for dx = -spread, spread do
      local px = lx + dx
      local py = 70 + dy
      if px >= 0 and px < 960 and py >= 0 and py < 540 then
        local dist = math.abs(dx) / math.max(1, spread)
        local fade = (1 - dist) * intensity / 255
        -- Read-modify not possible, just do additive approximation
        local base_r, base_g, base_b = 50, 45, 40
        if py > 380 then base_r, base_g, base_b = 70, 62, 54 end
        local nr = math.min(255, math.floor(base_r + (255 - base_r) * fade * 0.4))
        local ng = math.min(255, math.floor(base_g + (241 - base_g) * fade * 0.4))
        local nb = math.min(255, math.floor(base_b + (200 - base_b) * fade * 0.3))
        img:drawPixel(px, py, Color{r=nr, g=ng, b=nb, a=255})
      end
    end
  end
end

-- WALLS (rows 70-380)
rect(0, 70, 959, 380, Color{r=50, g=45, b=40, a=255})

-- Wall panel lines
for i = 0, 11 do
  vline(i * 80 + 40, 70, 380, Color{r=42, g=38, b=34, a=255})
end
hline(0, 959, 200, Color{r=42, g=38, b=34, a=255})

-- Ceiling-wall junction
hline(0, 959, 70, BLACK)

-- LEFT WALL: Shelves with bottles/beakers (x: 30-280)
-- Shelf brackets
for sy = 0, 2 do
  local shelfY = 120 + sy * 60
  rect(30, shelfY, 280, shelfY + 3, BROWN)
  -- Shelf supports
  vline(30, shelfY, shelfY + 12, BROWN)
  vline(280, shelfY, shelfY + 12, BROWN)

  -- Bottles on shelf
  local bottleColors = {RED, GREEN, BRIGHT_BLUE, YELLOW, PINK, CYAN, ORANGE, INDIGO}
  for bx = 0, 6 do
    local px = 45 + bx * 32
    local col = bottleColors[(bx + sy * 3) % #bottleColors + 1]
    -- Bottle body
    rect(px, shelfY - 18, px + 8, shelfY - 1, col)
    -- Bottle neck
    rect(px + 2, shelfY - 24, px + 6, shelfY - 18, col)
    -- Bottle cap
    rect(px + 1, shelfY - 25, px + 7, shelfY - 24, DARK_GREY)
    -- Highlight
    vline(px + 1, shelfY - 22, shelfY - 6, Color{r=math.min(255, col.red + 60), g=math.min(255, col.green + 60), b=math.min(255, col.blue + 60), a=255})
  end
end

-- Radio on top shelf
rect(240, 95, 270, 117, DARK_GREY)
rect(242, 97, 268, 107, DARK_GREEN)
-- Antenna
vline(255, 78, 95, LIGHT_GREY)
-- Dial
img:drawPixel(250, 112, YELLOW)
img:drawPixel(260, 112, RED)

-- RIGHT WALL: Whiteboard and periodic table poster
-- Whiteboard (x: 680-920)
rect(680, 100, 920, 250, WHITE)
rect(682, 102, 918, 248, Color{r=240, g=240, b=240, a=255})
-- Whiteboard frame
hline(680, 920, 100, LIGHT_GREY)
hline(680, 920, 250, LIGHT_GREY)
vline(680, 100, 250, LIGHT_GREY)
vline(920, 100, 250, LIGHT_GREY)
-- Some writing on whiteboard (squiggles)
for i = 0, 4 do
  hline(700, 700 + 40 + i * 10, 120 + i * 20, MED_BLUE)
end
-- Marker tray
rect(700, 250, 900, 256, DARK_GREY)
rect(710, 248, 720, 253, RED)
rect(730, 248, 740, 253, BRIGHT_BLUE)
rect(750, 248, 760, 253, GREEN)

-- Periodic table poster (below whiteboard)
rect(700, 270, 900, 360, Color{r=240, g=230, b=200, a=255})
-- Grid of colored cells
for row = 0, 4 do
  for col = 0, 9 do
    local cx = 706 + col * 19
    local cy = 276 + row * 16
    local colors = {RED, BRIGHT_BLUE, GREEN, YELLOW, ORANGE, PINK, CYAN, INDIGO}
    local c = colors[(row + col) % #colors + 1]
    rect(cx, cy, cx + 15, cy + 12, c)
  end
end

-- WORKBENCH (center, large wooden table)
local benchL = 300
local benchR = 660
local benchTop = 300
local benchBot = 380

-- Table top (brown with wood grain)
rect(benchL, benchTop, benchR, benchTop + 12, BROWN)
-- Wood grain lines
for gy = benchTop + 1, benchTop + 11, 3 do
  hline(benchL + 5, benchR - 5, gy, Color{r=150, g=70, b=44, a=255})
end
-- Table front
rect(benchL + 5, benchTop + 12, benchR - 5, benchBot, Color{r=140, g=65, b=40, a=255})
-- Drawers
for i = 0, 2 do
  local dx = benchL + 30 + i * 110
  rect(dx, benchTop + 20, dx + 80, benchBot - 10, BROWN)
  -- Drawer handle
  hline(dx + 30, dx + 50, benchTop + 35, DARK_GREY)
end
-- Table legs
rect(benchL + 5, benchBot, benchL + 12, benchBot + 20, BROWN)
rect(benchR - 12, benchBot, benchR - 5, benchBot + 20, BROWN)

-- Items on workbench
-- Beaker
rect(350, benchTop - 20, 370, benchTop, CYAN)
rect(348, benchTop - 22, 372, benchTop - 20, LIGHT_GREY)
-- Green liquid
rect(352, benchTop - 10, 368, benchTop, GREEN)

-- Microscope silhouette
rect(450, benchTop - 35, 460, benchTop, DARK_GREY)
rect(445, benchTop - 5, 465, benchTop, DARK_GREY)
rect(440, benchTop - 38, 470, benchTop - 35, DARK_GREY)
rect(453, benchTop - 50, 457, benchTop - 38, DARK_GREY)
rect(448, benchTop - 52, 462, benchTop - 50, BLACK)

-- FLOOR (rows 380-540)
rect(0, 380, 959, 539, Color{r=70, g=62, b=54, a=255})

-- Floor seam grid
for gx = 0, 959, 48 do
  vline(gx, 380, 539, Color{r=60, g=52, b=44, a=255})
end
for gy = 380, 539, 48 do
  hline(0, 959, gy, Color{r=60, g=52, b=44, a=255})
end

-- Cables on floor
-- Yellow cable snaking across
local cableY = 440
for x = 100, 500 do
  local cy = cableY + math.floor(math.sin(x * 0.03) * 8)
  img:drawPixel(x, cy, YELLOW)
  img:drawPixel(x, cy + 1, YELLOW)
end
-- Green cable
cableY = 480
for x = 400, 800 do
  local cy = cableY + math.floor(math.sin(x * 0.02 + 1) * 6)
  img:drawPixel(x, cy, GREEN)
  img:drawPixel(x, cy + 1, GREEN)
end

-- Red emergency light (right side, near ceiling)
rect(930, 80, 950, 95, RED)
-- Glow
for dy = -10, 10 do
  for dx = -10, 10 do
    local d = math.sqrt(dx*dx + dy*dy)
    if d < 10 then
      local px = 940 + dx
      local py = 87 + dy
      if px >= 0 and px < 960 and py >= 0 and py < 540 then
        img:drawPixel(px, py, Color{r=255, g=math.floor(50 * (1 - d/10)), b=math.floor(77 * (1 - d/10)), a=255})
      end
    end
  end
end

-- Wall-floor junction
hline(0, 959, 380, BLACK)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\lab_bg.png")
app.command.CloseFile()
