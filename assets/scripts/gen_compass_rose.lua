-- Compass Rose (96x96) - transparent bg
local spr = Sprite(96, 96, ColorMode.RGB)
spr.filename = "compass_rose.png"
local cel = spr.cels[1]
local img = cel.image

local DEEP_NAVY = Color{r=13, g=27, b=42, a=255}
local WHITE = Color{r=255, g=241, b=232, a=255}
local LIGHT_GREY = Color{r=194, g=195, b=199, a=255}
local DARK_GREY = Color{r=95, g=87, b=79, a=255}
local RED = Color{r=255, g=0, b=77, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}
local BRASS = Color{r=200, g=170, b=80, a=255}
local BRASS_DARK = Color{r=160, g=130, b=50, a=255}
local YELLOW = Color{r=255, g=236, b=39, a=255}

local cx = 48
local cy = 48
local outerR = 46
local innerR = 42
local faceR = 40

-- Clear to transparent
for y = 0, 95 do
  for x = 0, 95 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Brass rim
for y = 0, 95 do
  for x = 0, 95 do
    local d = math.sqrt((x - cx)^2 + (y - cy)^2)
    if d <= outerR and d > innerR then
      img:drawPixel(x, y, BRASS)
    elseif d <= innerR and d > faceR then
      img:drawPixel(x, y, BRASS_DARK)
    elseif d <= faceR then
      img:drawPixel(x, y, DEEP_NAVY)
    end
  end
end

-- Degree tick marks
for deg = 0, 355, 5 do
  local rad = math.rad(deg - 90) -- -90 so 0 = north
  local isMajor = (deg % 90 == 0)
  local isMid = (deg % 45 == 0) and not isMajor
  local tickLen = isMajor and 8 or (isMid and 6 or 3)

  local r1 = faceR - 1
  local r2 = faceR - 1 - tickLen
  for t = 0, 1, 0.03 do
    local r = r1 + (r2 - r1) * t
    local px = math.floor(cx + math.cos(rad) * r)
    local py = math.floor(cy + math.sin(rad) * r)
    if px >= 0 and px < 96 and py >= 0 and py < 96 then
      img:drawPixel(px, py, WHITE)
    end
  end
end

-- Compass points (diamond shapes)
-- N point (red, pointing up)
local pointLen = 22
local pointWidth = 6

-- Helper to draw a filled triangle
local function drawTriangle(x1,y1, x2,y2, x3,y3, col)
  -- Simple scanline fill
  local minY = math.min(y1, y2, y3)
  local maxY = math.max(y1, y2, y3)
  for y = math.floor(minY), math.ceil(maxY) do
    local xs = {}
    -- Check each edge
    local edges = {{x1,y1,x2,y2}, {x2,y2,x3,y3}, {x3,y3,x1,y1}}
    for _, e in ipairs(edges) do
      local ax, ay, bx, by = e[1], e[2], e[3], e[4]
      if (ay <= y and by >= y) or (by <= y and ay >= y) then
        if math.abs(by - ay) > 0.01 then
          local t = (y - ay) / (by - ay)
          local ix = ax + (bx - ax) * t
          table.insert(xs, ix)
        end
      end
    end
    table.sort(xs)
    if #xs >= 2 then
      for x = math.floor(xs[1]), math.ceil(xs[#xs]) do
        if x >= 0 and x < 96 and y >= 0 and y < 96 then
          local d = math.sqrt((x - cx)^2 + (y - cy)^2)
          if d <= faceR then
            img:drawPixel(x, y, col)
          end
        end
      end
    end
  end
end

-- N (up) - red
drawTriangle(cx, cy - pointLen, cx - pointWidth, cy, cx, cy, RED)
drawTriangle(cx, cy - pointLen, cx + pointWidth, cy, cx, cy, Color{r=200, g=0, b=60, a=255})

-- S (down) - white
drawTriangle(cx, cy + pointLen, cx - pointWidth, cy, cx, cy, LIGHT_GREY)
drawTriangle(cx, cy + pointLen, cx + pointWidth, cy, cx, cy, DARK_GREY)

-- E (right) - white
drawTriangle(cx + pointLen, cy, cx, cy - pointWidth, cx, cy, LIGHT_GREY)
drawTriangle(cx + pointLen, cy, cx, cy + pointWidth, cx, cy, DARK_GREY)

-- W (left) - white
drawTriangle(cx - pointLen, cy, cx, cy - pointWidth, cx, cy, LIGHT_GREY)
drawTriangle(cx - pointLen, cy, cx, cy + pointWidth, cx, cy, DARK_GREY)

-- Center circle
for dy = -3, 3 do
  for dx = -3, 3 do
    if math.sqrt(dx*dx + dy*dy) <= 3 then
      img:drawPixel(cx + dx, cy + dy, BRASS)
    end
  end
end

-- Letter labels
-- N (above north point) - just a few pixels
local function drawPixelChar(ox, oy, pixels, col)
  for _, p in ipairs(pixels) do
    local px = ox + p[1]
    local py = oy + p[2]
    if px >= 0 and px < 96 and py >= 0 and py < 96 then
      img:drawPixel(px, py, col)
    end
  end
end

-- N letter at top
local N_pixels = {
  {0,0},{0,1},{0,2},{0,3},{0,4},
  {1,1},{2,2},{3,3},
  {4,0},{4,1},{4,2},{4,3},{4,4}
}
drawPixelChar(cx - 2, cy - pointLen - 8, N_pixels, RED)

-- S letter at bottom
local S_pixels = {
  {1,0},{2,0},{3,0},
  {0,1},
  {1,2},{2,2},{3,2},
  {4,3},
  {0,4},{1,4},{2,4},{3,4}
}
drawPixelChar(cx - 2, cy + pointLen + 4, S_pixels, WHITE)

-- E letter at right
local E_pixels = {
  {0,0},{1,0},{2,0},{3,0},
  {0,1},
  {0,2},{1,2},{2,2},
  {0,3},
  {0,4},{1,4},{2,4},{3,4}
}
drawPixelChar(cx + pointLen + 4, cy - 2, E_pixels, WHITE)

-- W letter at left
local W_pixels = {
  {0,0},{4,0},
  {0,1},{4,1},
  {0,2},{2,2},{4,2},
  {0,3},{1,3},{3,3},{4,3},
  {0,4},{4,4}
}
drawPixelChar(cx - pointLen - 8, cy - 2, W_pixels, WHITE)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\compass_rose.png")
app.command.CloseFile()
