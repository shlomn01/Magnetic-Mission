-- Ship Sprite (280x100) - Research vessel with transparent background
local spr = Sprite(280, 100, ColorMode.RGB)
spr.filename = "ship.png"
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
local TRANS = Color{r=0, g=0, b=0, a=0}

-- Clear to transparent
for y = 0, 99 do
  for x = 0, 279 do
    img:drawPixel(x, y, TRANS)
  end
end

-- Helper: filled rectangle
local function rect(x1, y1, x2, y2, col)
  for y = y1, y2 do
    for x = x1, x2 do
      if x >= 0 and x < 280 and y >= 0 and y < 100 then
        img:drawPixel(x, y, col)
      end
    end
  end
end

-- Helper: line
local function hline(x1, x2, y, col)
  for x = x1, x2 do
    if x >= 0 and x < 280 and y >= 0 and y < 100 then
      img:drawPixel(x, y, col)
    end
  end
end

-- HULL - main body (dark grey-blue)
-- Hull shape: flat bottom, angled bow (right side), squared stern (left)
local hullTop = 55
local hullBottom = 85
local bowStart = 220  -- where bow angle starts
local sternX = 20

-- Main hull body
rect(sternX, hullTop, bowStart, hullBottom, DARK_BLUE)

-- Bow (angled, right side)
for y = hullTop, hullBottom do
  local t = (y - hullTop) / (hullBottom - hullTop)
  local bx = bowStart + math.floor((1 - t) * 30 + t * 50)
  hline(bowStart, bx, y, DARK_BLUE)
end

-- Stern (left side, slightly angled)
for y = hullTop, hullBottom do
  local t = (y - hullTop) / (hullBottom - hullTop)
  local sx = sternX - math.floor((1 - t) * 5)
  hline(sx, sternX, y, DARK_BLUE)
end

-- Keel line (bottom, black)
for y = hullTop, hullBottom do
  local t = (y - hullTop) / (hullBottom - hullTop)
  local bx = bowStart + math.floor((1 - t) * 30 + t * 50)
  local sx = sternX - math.floor((1 - t) * 5)
  if y == hullBottom then
    hline(sx, bx, y, BLACK)
  end
end

-- Hull outline top
hline(sternX - 5, bowStart + 30, hullTop, BLACK)

-- Rust stripe
rect(sternX - 2, hullTop + 8, bowStart + 35, hullTop + 11, BROWN)

-- Waterline (medium blue below rust)
rect(sternX, hullTop + 18, bowStart + 42, hullBottom, MED_BLUE)

-- Portholes with yellow glow
for i = 0, 8 do
  local px = 40 + i * 22
  local py = hullTop + 5
  img:drawPixel(px, py, YELLOW)
  img:drawPixel(px+1, py, YELLOW)
  img:drawPixel(px, py+1, YELLOW)
  img:drawPixel(px+1, py+1, YELLOW)
  -- Porthole rim
  img:drawPixel(px-1, py, DARK_GREY)
  img:drawPixel(px+2, py, DARK_GREY)
  img:drawPixel(px-1, py+1, DARK_GREY)
  img:drawPixel(px+2, py+1, DARK_GREY)
  img:drawPixel(px, py-1, DARK_GREY)
  img:drawPixel(px+1, py-1, DARK_GREY)
  img:drawPixel(px, py+2, DARK_GREY)
  img:drawPixel(px+1, py+2, DARK_GREY)
end

-- DECK
rect(sternX, hullTop - 3, bowStart + 25, hullTop, DARK_GREY)

-- Railing posts
for i = 0, 15 do
  local rx = 25 + i * 14
  if rx < bowStart + 20 then
    rect(rx, hullTop - 8, rx, hullTop - 3, LIGHT_GREY)
  end
end
-- Railing top bar
hline(25, bowStart + 15, hullTop - 8, LIGHT_GREY)

-- SUPERSTRUCTURE

-- Bridge (tall structure, right-center area)
local bridgeL = 150
local bridgeR = 195
local bridgeTop = 22
local bridgeBot = hullTop - 3
rect(bridgeL, bridgeTop, bridgeR, bridgeBot, DARK_GREY)
-- Bridge outline
hline(bridgeL, bridgeR, bridgeTop, BLACK)
for y = bridgeTop, bridgeBot do
  img:drawPixel(bridgeL, y, BLACK)
  img:drawPixel(bridgeR, y, BLACK)
end
-- Bridge windows (blue)
for i = 0, 3 do
  rect(bridgeL + 4 + i * 10, bridgeTop + 3, bridgeL + 4 + i * 10 + 6, bridgeTop + 8, BRIGHT_BLUE)
end

-- Cabin section (left of bridge)
local cabinL = 60
local cabinR = 148
local cabinTop = 35
rect(cabinL, cabinTop, cabinR, hullTop - 3, DARK_GREY)
hline(cabinL, cabinR, cabinTop, BLACK)
-- Cabin windows (lit, yellow)
for i = 0, 5 do
  rect(cabinL + 5 + i * 14, cabinTop + 4, cabinL + 5 + i * 14 + 5, cabinTop + 9, YELLOW)
end

-- Lab section (right of bridge)
local labL = 197
local labR = 235
local labTop = 32
rect(labL, labTop, labR, hullTop - 3, DARK_GREY)
hline(labL, labR, labTop, BLACK)
-- Lab windows (green glow)
for i = 0, 2 do
  rect(labL + 4 + i * 12, labTop + 4, labL + 4 + i * 12 + 5, labTop + 9, GREEN)
end

-- SMOKESTACK (on bridge)
local stackL = 165
local stackR = 178
local stackTop = 8
rect(stackL, stackTop, stackR, bridgeTop, LIGHT_GREY)
-- Red/white stripes
for y = stackTop, bridgeTop do
  local stripe = math.floor((y - stackTop) / 3) % 2
  if stripe == 0 then
    hline(stackL, stackR, y, RED)
  end
end
-- Smoke wisps
img:drawPixel(170, 5, LIGHT_GREY)
img:drawPixel(168, 3, LIGHT_GREY)
img:drawPixel(172, 2, LIGHT_GREY)
img:drawPixel(166, 1, LIGHT_GREY)
img:drawPixel(174, 4, LIGHT_GREY)

-- CRANE (left side)
local craneBase = 45
rect(craneBase, 20, craneBase + 3, hullTop - 3, DARK_GREY)
-- Crane arm
hline(craneBase - 10, craneBase + 3, 20, DARK_GREY)
-- Cable
for y = 20, 35 do
  img:drawPixel(craneBase - 10, y, LIGHT_GREY)
end

-- RADAR MAST (on bridge top)
rect(173, 5, 174, bridgeTop, LIGHT_GREY)
-- Radar dish
hline(169, 178, 7, LIGHT_GREY)
hline(170, 177, 6, LIGHT_GREY)
-- Red blinking light
img:drawPixel(173, 4, RED)
img:drawPixel(174, 4, RED)

-- LIFEBOATS (orange, on cabin side)
for i = 0, 1 do
  local lbx = 75 + i * 30
  local lby = cabinTop - 5
  rect(lbx, lby, lbx + 10, lby + 4, ORANGE)
  -- Rounded ends
  img:drawPixel(lbx, lby, TRANS)
  img:drawPixel(lbx + 10, lby, TRANS)
  img:drawPixel(lbx, lby + 4, TRANS)
  img:drawPixel(lbx + 10, lby + 4, TRANS)
end

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\ship.png")
app.command.CloseFile()
