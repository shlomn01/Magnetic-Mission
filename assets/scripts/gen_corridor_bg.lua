-- Ship Corridor Background (960x540)
local spr = Sprite(960, 540, ColorMode.RGB)
spr.filename = "corridor_bg.png"
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
local BROWN = Color{r=171, g=82, b=54, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}
local INDIGO = Color{r=131, g=118, b=156, a=255}

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

-- CEILING (top 80px)
rect(0, 0, 959, 80, DARK_GREY)

-- Ceiling pipes (2 horizontal pipes)
rect(0, 15, 959, 20, MED_BLUE)
rect(0, 16, 959, 19, DARK_BLUE)
rect(0, 55, 959, 60, MED_BLUE)
rect(0, 56, 959, 59, DARK_BLUE)

-- Ceiling lights (4 evenly spaced)
local lightPositions = {160, 380, 580, 800}
for _, lx in ipairs(lightPositions) do
  -- Light fixture
  rect(lx - 20, 65, lx + 20, 72, LIGHT_GREY)
  rect(lx - 16, 72, lx + 16, 76, WHITE)
  -- Light glow cone on walls below
  for dy = 0, 120 do
    local spread = math.floor(dy * 0.8)
    local alpha = math.max(20, 100 - dy)
    for dx = -spread, spread do
      local px = lx + dx
      local py = 80 + dy
      if px >= 0 and px < 960 and py < 540 then
        local existing_r = 95
        local blend = alpha / 255
        local nr = math.min(255, math.floor(existing_r + (255 - existing_r) * blend * 0.3))
        local ng = math.min(255, math.floor(87 + (241 - 87) * blend * 0.3))
        local nb = math.min(255, math.floor(79 + (200 - 79) * blend * 0.3))
        img:drawPixel(px, py, Color{r=nr, g=ng, b=nb, a=255})
      end
    end
  end
end

-- WALLS (rows 80-400)
-- Left wall
rect(0, 80, 959, 400, DARK_GREY)

-- Wall panel lines (vertical)
for i = 0, 11 do
  local px = i * 80 + 40
  vline(px, 80, 400, Color{r=80, g=72, b=64, a=255})
end

-- Horizontal panel divider
hline(0, 959, 200, Color{r=80, g=72, b=64, a=255})
hline(0, 959, 201, Color{r=110, g=100, b=90, a=255})

-- Rivets along panel lines
for i = 0, 11 do
  local px = i * 80 + 40
  for ry = 90, 390, 30 do
    img:drawPixel(px - 1, ry, LIGHT_GREY)
    img:drawPixel(px + 1, ry, LIGHT_GREY)
    img:drawPixel(px, ry - 1, LIGHT_GREY)
    img:drawPixel(px, ry + 1, LIGHT_GREY)
  end
end

-- PORTHOLE (right side of corridor, showing stormy ocean)
local phCx = 750
local phCy = 170
local phR = 30
for y = -phR, phR do
  for x = -phR, phR do
    local d = math.sqrt(x*x + y*y)
    local px = phCx + x
    local py = phCy + y
    if px >= 0 and px < 960 and py >= 0 and py < 540 then
      if d <= phR and d > phR - 4 then
        -- Brass rim
        img:drawPixel(px, py, Color{r=171, g=140, b=54, a=255})
      elseif d <= phR - 4 then
        -- Stormy ocean view
        local t = (y + phR) / (2 * phR)
        if t < 0.4 then
          -- Dark stormy sky
          img:drawPixel(px, py, Color{r=27, g=40, b=56, a=255})
        elseif t < 0.45 then
          -- Wave line
          img:drawPixel(px, py, MED_BLUE)
        else
          -- Dark water
          img:drawPixel(px, py, DEEP_NAVY)
        end
      end
    end
  end
end
-- Porthole bolts
local boltAngles = {0, 1.57, 3.14, 4.71}
for _, a in ipairs(boltAngles) do
  local bx = phCx + math.floor(math.cos(a) * (phR - 2))
  local by = phCy + math.floor(math.sin(a) * (phR - 2))
  img:drawPixel(bx, by, DARK_GREY)
end

-- NOTICE BOARD (between door positions, center area)
rect(420, 120, 540, 230, BROWN)
rect(422, 122, 538, 228, Color{r=200, g=180, b=140, a=255})
-- Papers pinned
rect(430, 130, 470, 170, WHITE)
rect(480, 140, 530, 190, Color{r=255, g=236, b=39, a=255})
rect(440, 180, 490, 220, WHITE)
-- Pins
img:drawPixel(440, 130, RED)
img:drawPixel(500, 140, RED)
img:drawPixel(455, 180, RED)

-- FLOOR (rows 400-540)
rect(0, 400, 959, 539, Color{r=80, g=72, b=64, a=255})

-- Floor grid pattern
for gx = 0, 959, 40 do
  vline(gx, 400, 539, Color{r=70, g=62, b=54, a=255})
end
for gy = 400, 539, 40 do
  hline(0, 959, gy, Color{r=70, g=62, b=54, a=255})
end

-- Floor highlights (metallic sheen under lights)
for _, lx in ipairs(lightPositions) do
  for dx = -30, 30 do
    local px = lx + dx
    if px >= 0 and px < 960 then
      img:drawPixel(px, 401, Color{r=110, g=100, b=90, a=255})
      img:drawPixel(px, 402, Color{r=100, g=92, b=84, a=255})
    end
  end
end

-- Wall-floor junction line
hline(0, 959, 400, BLACK)
hline(0, 959, 399, Color{r=70, g=62, b=54, a=255})

-- Ceiling-wall junction
hline(0, 959, 80, BLACK)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\corridor_bg.png")
app.command.CloseFile()
