-- Tangent Galvanometer (192x192) - Detailed scientific instrument
local spr = Sprite(192, 192, ColorMode.RGB)
spr.filename = "galvanometer.png"
local cel = spr.cels[1]
local img = cel.image

-- PICO-8 Palette
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
local BROWN = Color{r=171, g=82, b=54, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}

-- Brass tones
local BRASS = Color{r=200, g=170, b=80, a=255}
local BRASS_DARK = Color{r=140, g=110, b=40, a=255}
local BRASS_LIGHT = Color{r=230, g=205, b=120, a=255}
local BRASS_BRIGHT = Color{r=245, g=225, b=160, a=255}

local cx = 96
local cy = 96
local PI = 3.14159265

-- Clear to transparent
for y = 0, 191 do
  for x = 0, 191 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Helper: distance
local function dist(x, y)
  return math.sqrt((x - cx)*(x - cx) + (y - cy)*(y - cy))
end

-- Helper: simple atan2 replacement
local function myatan2(dy, dx)
  if dx > 0 then return math.atan(dy / dx)
  elseif dx < 0 and dy >= 0 then return math.atan(dy / dx) + PI
  elseif dx < 0 and dy < 0 then return math.atan(dy / dx) - PI
  elseif dx == 0 and dy > 0 then return PI / 2
  elseif dx == 0 and dy < 0 then return -PI / 2
  else return 0 end
end

-- Helper: blend colors
local function blendC(c1, c2, t)
  if t < 0 then t = 0 end
  if t > 1 then t = 1 end
  return Color{
    r = math.floor(c1.red * (1-t) + c2.red * t),
    g = math.floor(c1.green * (1-t) + c2.green * t),
    b = math.floor(c1.blue * (1-t) + c2.blue * t),
    a = 255
  }
end

-- ── PASS 1: Draw all rings ──
for y = 0, 191 do
  for x = 0, 191 do
    local d = dist(x, y)
    local dx = x - cx
    local dy = y - cy
    local angle = myatan2(dy, dx)
    local lightFactor = math.cos(angle + PI * 0.75) * 0.5 + 0.5

    if d <= 94 and d > 88 then
      -- COPPER COIL RING with winding texture
      local windingPhase = math.sin(angle * 30)
      if windingPhase > 0.3 then
        img:drawPixel(x, y, blendC(ORANGE, YELLOW, 0.3))
      elseif windingPhase > -0.3 then
        img:drawPixel(x, y, ORANGE)
      else
        img:drawPixel(x, y, blendC(ORANGE, BROWN, 0.5))
      end

    elseif d <= 88 and d > 82 then
      -- BRASS BEZEL with metallic shading
      if d > 86 then
        img:drawPixel(x, y, blendC(BRASS_DARK, BRASS, lightFactor * 0.5))
      elseif d < 83 then
        img:drawPixel(x, y, blendC(BRASS_DARK, BRASS, lightFactor * 0.4))
      else
        img:drawPixel(x, y, blendC(BRASS_DARK, BRASS_BRIGHT, lightFactor))
      end

    elseif d <= 82 and d > 60 then
      -- SCALE RING area (dark)
      local normD = (d - 60) / 22
      img:drawPixel(x, y, blendC(DEEP_NAVY, DARK_BLUE, normD * 0.3))

    elseif d <= 60 then
      -- FACE CENTER with subtle gradient
      local normD = d / 60
      img:drawPixel(x, y, blendC(DEEP_NAVY, MED_BLUE, normD * 0.12))
    end
  end
end

-- ── DECORATIVE INNER RING ──
for y = 0, 191 do
  for x = 0, 191 do
    local d = dist(x, y)
    if d <= 62 and d > 59 then
      img:drawPixel(x, y, MED_BLUE)
    end
  end
end

-- ── DEGREE TICK MARKS (upper semicircle: -90 to 90) ──
for deg = -90, 90, 5 do
  local rad = (deg - 90) * PI / 180
  local isMajor = (deg % 45 == 0)
  local isMedium = (deg % 15 == 0)

  local r1 = 80
  local r2
  if isMajor then r2 = 62
  elseif isMedium then r2 = 68
  else r2 = 74 end

  local tickColor = WHITE
  if not isMajor and not isMedium then tickColor = LIGHT_GREY end

  for t = 0, 100 do
    local frac = t / 100
    local r = r1 + (r2 - r1) * frac
    local px = math.floor(cx + math.cos(rad) * r)
    local py = math.floor(cy + math.sin(rad) * r)
    if px >= 0 and px < 192 and py >= 0 and py < 192 then
      img:drawPixel(px, py, tickColor)
      if isMajor then
        -- Thicker
        local px2 = math.floor(cx + math.cos(rad + 0.008) * r)
        local py2 = math.floor(cy + math.sin(rad + 0.008) * r)
        if px2 >= 0 and px2 < 192 and py2 >= 0 and py2 < 192 then
          img:drawPixel(px2, py2, tickColor)
        end
        local px3 = math.floor(cx + math.cos(rad - 0.008) * r)
        local py3 = math.floor(cy + math.sin(rad - 0.008) * r)
        if px3 >= 0 and px3 < 192 and py3 >= 0 and py3 < 192 then
          img:drawPixel(px3, py3, tickColor)
        end
      end
    end
  end
end

-- ── Minor ticks on bottom half (subtle) ──
for deg = -85, 85, 15 do
  local rad = (deg + 90) * PI / 180
  for t = 0, 100 do
    local frac = t / 100
    local r = 80 + (76 - 80) * frac
    local px = math.floor(cx + math.cos(rad) * r)
    local py = math.floor(cy + math.sin(rad) * r)
    if px >= 0 and px < 192 and py >= 0 and py < 192 then
      img:drawPixel(px, py, DARK_GREY)
    end
  end
end

-- ── DEGREE LABELS at major positions ──
-- 3x5 pixel font for digits
local digitData = {
  ["0"] = {"111","101","101","101","111"},
  ["4"] = {"101","101","111","001","001"},
  ["5"] = {"111","100","111","001","111"},
  ["9"] = {"111","101","111","001","111"},
  ["-"] = {"000","000","111","000","000"},
}

local function drawChar(ox, oy, ch, color)
  local data = digitData[ch]
  if not data then return end
  for row = 1, #data do
    local line = data[row]
    for col = 1, #line do
      if line:sub(col, col) == "1" then
        local px = ox + col - 1
        local py = oy + row - 1
        if px >= 0 and px < 192 and py >= 0 and py < 192 then
          img:drawPixel(px, py, color)
        end
      end
    end
  end
end

local function drawString(ox, oy, str, color)
  for i = 1, #str do
    drawChar(ox + (i-1) * 4, oy, str:sub(i, i), color)
  end
end

-- Place labels at key degree positions
local labels = {
  {deg=-90, text="-90"},
  {deg=-45, text="-45"},
  {deg=0, text="0"},
  {deg=45, text="45"},
  {deg=90, text="90"},
}
for _, lbl in ipairs(labels) do
  local rad = (lbl.deg - 90) * PI / 180
  local r = 50
  local lx = math.floor(cx + math.cos(rad) * r)
  local ly = math.floor(cy + math.sin(rad) * r)
  local textW = #lbl.text * 4
  drawString(lx - math.floor(textW / 2), ly - 2, lbl.text, LIGHT_GREY)
end

-- ── "N" LABEL (RED) at top ──
local nData = {
  "10001",
  "11001",
  "10101",
  "10011",
  "10001",
}
local nx = cx - 2
local ny = cy - 55
for row = 1, #nData do
  local line = nData[row]
  for col = 1, #line do
    if line:sub(col, col) == "1" then
      img:drawPixel(nx + col - 1, ny + row - 1, RED)
    end
  end
end

-- ── "S" LABEL (BLUE) at bottom ──
local sData = {
  "01110",
  "10000",
  "01100",
  "00010",
  "11100",
}
local sx2 = cx - 2
local sy2 = cy + 51
for row = 1, #sData do
  local line = sData[row]
  for col = 1, #line do
    if line:sub(col, col) == "1" then
      img:drawPixel(sx2 + col - 1, sy2 + row - 1, BRIGHT_BLUE)
    end
  end
end

-- ── CENTER PIVOT ──
for y2 = -5, 5 do
  for x2 = -5, 5 do
    local d = math.sqrt(x2*x2 + y2*y2)
    if d <= 5 and d > 3 then
      img:drawPixel(cx + x2, cy + y2, BRASS)
    elseif d <= 3 and d > 1 then
      img:drawPixel(cx + x2, cy + y2, BRASS_LIGHT)
    elseif d <= 1 then
      img:drawPixel(cx + x2, cy + y2, WHITE)
    end
  end
end

-- ── GLASS REFLECTION ──
-- Upper-left reflection arc
for y = 0, 191 do
  for x = 0, 191 do
    local d = dist(x, y)
    if d <= 58 and d > 48 then
      local angle = myatan2(y - cy, x - cx)
      if angle > -2.6 and angle < -1.4 then
        -- Soft white highlight
        local existing = img:getPixel(x, y)
        local ec = Color(existing)
        if ec.alpha > 0 then
          local highlight = blendC(ec, WHITE, 0.12)
          img:drawPixel(x, y, highlight)
        end
      end
    end
  end
end

-- Small bright specular dot
for y2 = -2, 2 do
  for x2 = -2, 2 do
    local d = math.sqrt(x2*x2 + y2*y2)
    if d <= 2 then
      local px = cx - 25 + x2
      local py = cy - 30 + y2
      if px >= 0 and px < 192 and py >= 0 and py < 192 then
        img:drawPixel(px, py, blendC(WHITE, CYAN, 0.4))
      end
    end
  end
end

-- ── BEZEL SCREWS ──
local screws = {
  {cx, cy - 85}, {cx, cy + 85},
  {cx - 60, cy - 60}, {cx + 60, cy - 60},
  {cx - 60, cy + 60}, {cx + 60, cy + 60},
}
for _, pos in ipairs(screws) do
  local scx, scy = pos[1], pos[2]
  local d = dist(scx, scy)
  if d < 89 and d > 82 then
    for dy = -2, 2 do
      for dx = -2, 2 do
        local dd = math.sqrt(dx*dx + dy*dy)
        if dd <= 2 then
          local px = scx + dx
          local py = scy + dy
          if px >= 0 and px < 192 and py >= 0 and py < 192 then
            if dd <= 1 then
              img:drawPixel(px, py, BRASS_BRIGHT)
            else
              img:drawPixel(px, py, BRASS_DARK)
            end
          end
        end
      end
    end
    -- Screw slot line
    if scx >= 1 and scx < 191 then
      img:drawPixel(scx - 1, scy, BRASS_DARK)
      img:drawPixel(scx, scy, BRASS_DARK)
      img:drawPixel(scx + 1, scy, BRASS_DARK)
    end
  end
end

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\galvanometer.png")
app.command.CloseFile()
