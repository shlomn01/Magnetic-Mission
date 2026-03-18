-- UI Elements: button, clock icon, evidence icon, quest icon

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
local BLACK = Color{r=0, g=0, b=0, a=255}
local BROWN = Color{r=171, g=82, b=54, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}
local INDIGO = Color{r=131, g=118, b=156, a=255}

-- ===== MEASURE BUTTON (120x40) =====
local spr = Sprite(120, 40, ColorMode.RGB)
local cel = spr.cels[1]
local img = cel.image

for y = 0, 39 do
  for x = 0, 119 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Button body
for y = 2, 37 do
  for x = 2, 117 do
    img:drawPixel(x, y, MED_BLUE)
  end
end

-- Rounded corners (remove corner pixels)
local corners = {{2,2},{3,2},{2,3},{117,2},{116,2},{117,3},{2,37},{3,37},{2,36},{117,37},{116,37},{117,36}}
for _, c in ipairs(corners) do
  img:drawPixel(c[1], c[2], TRANS)
end

-- Top highlight
for x = 4, 115 do
  img:drawPixel(x, 3, BRIGHT_BLUE)
end

-- Bottom shadow
for x = 4, 115 do
  img:drawPixel(x, 36, DARK_BLUE)
  img:drawPixel(x, 37, DARK_BLUE)
end

-- Pixel border
-- Top
for x = 4, 115 do img:drawPixel(x, 1, CYAN) end
-- Bottom
for x = 4, 115 do img:drawPixel(x, 38, DARK_BLUE) end
-- Left
for y = 4, 35 do img:drawPixel(1, y, CYAN) end
-- Right
for y = 4, 35 do img:drawPixel(118, y, DARK_BLUE) end

-- "MEASURE" text (simple pixel font, centered)
-- Each letter is roughly 5 wide, 7 tall. "MEASURE" = 7 letters
-- Total width ~= 7*6 = 42, centered at 60 -> start at 39
local letters = {
  M = {
    {0,0},{0,1},{0,2},{0,3},{0,4},{0,5},{0,6},
    {1,1},{3,1},
    {2,2},
    {4,0},{4,1},{4,2},{4,3},{4,4},{4,5},{4,6},
  },
  E = {
    {0,0},{0,1},{0,2},{0,3},{0,4},{0,5},{0,6},
    {1,0},{2,0},{3,0},
    {1,3},{2,3},
    {1,6},{2,6},{3,6},
  },
  A = {
    {0,1},{0,2},{0,3},{0,4},{0,5},{0,6},
    {1,0},{2,0},{3,0},
    {4,1},{4,2},{4,3},{4,4},{4,5},{4,6},
    {1,3},{2,3},{3,3},
  },
  S = {
    {1,0},{2,0},{3,0},{4,0},
    {0,1},{0,2},
    {1,3},{2,3},{3,3},
    {4,4},{4,5},
    {0,6},{1,6},{2,6},{3,6},
  },
  U = {
    {0,0},{0,1},{0,2},{0,3},{0,4},{0,5},
    {4,0},{4,1},{4,2},{4,3},{4,4},{4,5},
    {1,6},{2,6},{3,6},
  },
  R = {
    {0,0},{0,1},{0,2},{0,3},{0,4},{0,5},{0,6},
    {1,0},{2,0},{3,0},
    {4,1},{4,2},
    {1,3},{2,3},{3,3},
    {3,4},{4,5},{4,6},
  },
}

local word = {"M","E","A","S","U","R","E"}
local startX = 39
local startY = 13
for i, ch in ipairs(word) do
  local letterData = letters[ch]
  if letterData then
    for _, p in ipairs(letterData) do
      local px = startX + (i - 1) * 6 + p[1]
      local py = startY + p[2]
      if px >= 0 and px < 120 and py >= 0 and py < 40 then
        img:drawPixel(px, py, WHITE)
      end
    end
  end
end

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\btn_measure.png")
app.command.CloseFile()

-- ===== CLOCK ICON (24x24) =====
spr = Sprite(24, 24, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image

for y = 0, 23 do
  for x = 0, 23 do
    img:drawPixel(x, y, TRANS)
  end
end

local cx, cy, r = 12, 12, 10
-- Clock face
for y2 = -r, r do
  for x2 = -r, r do
    local d = math.sqrt(x2*x2 + y2*y2)
    if d <= r then
      local px = cx + x2
      local py = cy + y2
      if px >= 0 and px < 24 and py >= 0 and py < 24 then
        if d > r - 2 then
          img:drawPixel(px, py, DARK_GREY)
        else
          img:drawPixel(px, py, WHITE)
        end
      end
    end
  end
end

-- Hour markers
for h = 0, 11 do
  local angle = math.rad(h * 30 - 90)
  local mx = math.floor(cx + math.cos(angle) * (r - 3))
  local my = math.floor(cy + math.sin(angle) * (r - 3))
  if mx >= 0 and mx < 24 and my >= 0 and my < 24 then
    img:drawPixel(mx, my, BLACK)
  end
end

-- Hour hand (pointing to 10)
local hAngle = math.rad(10 * 30 - 90)
for t = 0, 5 do
  local hx = math.floor(cx + math.cos(hAngle) * t)
  local hy = math.floor(cy + math.sin(hAngle) * t)
  if hx >= 0 and hx < 24 and hy >= 0 and hy < 24 then
    img:drawPixel(hx, hy, BLACK)
  end
end

-- Minute hand (pointing to 2)
local mAngle = math.rad(2 * 30 - 90)
for t = 0, 7 do
  local mx2 = math.floor(cx + math.cos(mAngle) * t)
  local my2 = math.floor(cy + math.sin(mAngle) * t)
  if mx2 >= 0 and mx2 < 24 and my2 >= 0 and my2 < 24 then
    img:drawPixel(mx2, my2, BLACK)
  end
end

-- Center dot
img:drawPixel(cx, cy, RED)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\icon_clock.png")
app.command.CloseFile()

-- ===== EVIDENCE ICON (24x24) - Magnifying glass =====
spr = Sprite(24, 24, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image

for y = 0, 23 do
  for x = 0, 23 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Glass circle (upper left area)
local gcx, gcy, gr = 10, 10, 8
for y2 = -gr, gr do
  for x2 = -gr, gr do
    local d = math.sqrt(x2*x2 + y2*y2)
    if d <= gr and d > gr - 2 then
      local px = gcx + x2
      local py = gcy + y2
      if px >= 0 and px < 24 and py >= 0 and py < 24 then
        img:drawPixel(px, py, BRIGHT_BLUE)
      end
    elseif d <= gr - 2 then
      local px = gcx + x2
      local py = gcy + y2
      if px >= 0 and px < 24 and py >= 0 and py < 24 then
        img:drawPixel(px, py, Color{r=50, g=80, b=120, a=128})
      end
    end
  end
end

-- Handle (diagonal, lower right)
for t = 0, 8 do
  local hx = 16 + t
  local hy = 16 + t
  if hx >= 0 and hx < 24 and hy >= 0 and hy < 24 then
    img:drawPixel(hx, hy, BROWN)
    if hx + 1 < 24 then img:drawPixel(hx + 1, hy, BROWN) end
    if hy + 1 < 24 then img:drawPixel(hx, hy + 1, BROWN) end
  end
end

-- Shine on glass
img:drawPixel(7, 7, WHITE)
img:drawPixel(8, 7, WHITE)
img:drawPixel(7, 8, WHITE)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\icon_evidence.png")
app.command.CloseFile()

-- ===== QUEST ICON (16x16) - Yellow exclamation in diamond =====
spr = Sprite(16, 16, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image

for y = 0, 15 do
  for x = 0, 15 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Diamond shape (rotated square)
local dcx, dcy = 8, 8
for y2 = 0, 15 do
  for x2 = 0, 15 do
    local dist = math.abs(x2 - dcx) + math.abs(y2 - dcy)
    if dist <= 7 then
      img:drawPixel(x2, y2, YELLOW)
    end
    if dist == 7 then
      img:drawPixel(x2, y2, ORANGE)
    end
  end
end

-- Exclamation mark (dark, centered)
-- Stem
for y2 = 3, 9 do
  img:drawPixel(8, y2, BLACK)
end
-- Dot
img:drawPixel(8, 11, BLACK)
img:drawPixel(8, 12, BLACK)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\icon_quest.png")
app.command.CloseFile()
