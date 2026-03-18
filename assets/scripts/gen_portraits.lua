-- Character Portraits (64x64 each) - 4 portraits
-- Captain, Magneta, Navi, Geo

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
local PINK = Color{r=255, g=119, b=168, a=255}
local BROWN = Color{r=171, g=82, b=54, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}
local INDIGO = Color{r=131, g=118, b=156, a=255}
local SKIN = Color{r=255, g=204, b=170, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}

local function rect(img, x1, y1, x2, y2, col)
  for y = math.max(0, y1), math.min(63, y2) do
    for x = math.max(0, x1), math.min(63, x2) do
      img:drawPixel(x, y, col)
    end
  end
end

local function circle(img, cx, cy, r, col)
  for y = -r, r do
    for x = -r, r do
      if math.sqrt(x*x + y*y) <= r then
        local px, py = cx + x, cy + y
        if px >= 0 and px < 64 and py >= 0 and py < 64 then
          img:drawPixel(px, py, col)
        end
      end
    end
  end
end

local function clearImg(img)
  for y = 0, 63 do
    for x = 0, 63 do
      img:drawPixel(x, y, TRANS)
    end
  end
end

-- Base face shape (shared)
local function drawFace(img, skinCol)
  skinCol = skinCol or SKIN
  -- Head (oval)
  for y = 12, 48 do
    local t = (y - 12) / 36
    local halfW = math.floor(14 * math.sin(t * math.pi))
    halfW = math.max(halfW, 4)
    for x = 32 - halfW, 32 + halfW do
      if x >= 0 and x < 64 and y >= 0 and y < 64 then
        img:drawPixel(x, y, skinCol)
      end
    end
  end
end

local function drawEyes(img, lx, rx, y, col)
  -- Simple 3x2 eyes
  for dy = 0, 1 do
    for dx = 0, 2 do
      img:drawPixel(lx + dx, y + dy, WHITE)
      img:drawPixel(rx + dx, y + dy, WHITE)
    end
  end
  -- Pupils
  img:drawPixel(lx + 1, y + 1, col)
  img:drawPixel(rx + 1, y + 1, col)
end

local function drawMouth(img, x, y, w, col)
  for dx = 0, w do
    img:drawPixel(x + dx, y, col)
  end
end

---------- CAPTAIN ----------
local spr = Sprite(64, 64, ColorMode.RGB)
local cel = spr.cels[1]
local img = cel.image
clearImg(img)

-- Neck / uniform visible at bottom
rect(img, 24, 46, 40, 63, DARK_BLUE) -- uniform
-- Gold epaulettes
rect(img, 18, 50, 23, 54, YELLOW)
rect(img, 41, 50, 46, 54, YELLOW)
-- Uniform body
rect(img, 18, 54, 46, 63, DARK_BLUE)

drawFace(img)

-- Grey stubble (dots on chin area)
for y = 40, 46 do
  for x = 26, 38 do
    local d = math.sqrt((x-32)^2 + (y-30)^2)
    if d < 16 and (x + y) % 3 == 0 then
      img:drawPixel(x, y, LIGHT_GREY)
    end
  end
end

drawEyes(img, 25, 35, 28, DARK_BLUE)

-- Stern mouth (straight line)
drawMouth(img, 28, 38, 8, BROWN)

-- Captain hat (blue with gold band)
rect(img, 18, 8, 46, 20, DARK_BLUE) -- hat body
rect(img, 15, 18, 49, 21, DARK_BLUE) -- hat brim
rect(img, 20, 14, 44, 16, YELLOW) -- gold band
-- Hat badge
img:drawPixel(32, 11, YELLOW)
img:drawPixel(31, 12, YELLOW)
img:drawPixel(33, 12, YELLOW)

-- Eyebrows (stern)
rect(img, 24, 26, 29, 26, DARK_GREY)
rect(img, 35, 26, 40, 26, DARK_GREY)

-- Ears
rect(img, 18, 28, 20, 34, SKIN)
rect(img, 44, 28, 46, 34, SKIN)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\portrait_captain.png")
app.command.CloseFile()

---------- MAGNETA ----------
spr = Sprite(64, 64, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image
clearImg(img)

-- White lab coat at bottom
rect(img, 18, 50, 46, 63, WHITE)
-- Neck
rect(img, 28, 46, 36, 52, SKIN)

drawFace(img)

-- Pink hair in bun
-- Hair sides
for y = 10, 32 do
  for x = 17, 47 do
    local d = math.sqrt((x-32)^2 + (y-22)^2)
    if d <= 16 and d > 13 then
      img:drawPixel(x, y, PINK)
    end
  end
end
-- Hair top
rect(img, 22, 8, 42, 14, PINK)
-- Bun on top
circle(img, 32, 6, 5, PINK)

-- Blue glasses with cyan lenses
rect(img, 22, 27, 30, 33, DARK_BLUE) -- left frame
rect(img, 34, 27, 42, 33, DARK_BLUE) -- right frame
rect(img, 24, 28, 29, 32, CYAN) -- left lens
rect(img, 35, 28, 41, 32, CYAN) -- right lens
-- Bridge
rect(img, 30, 29, 34, 30, DARK_BLUE)
-- Arms
rect(img, 19, 29, 22, 30, DARK_BLUE)
rect(img, 42, 29, 45, 30, DARK_BLUE)

-- Warm smile (curved)
img:drawPixel(28, 39, BROWN)
rect(img, 29, 40, 35, 40, BROWN)
img:drawPixel(36, 39, BROWN)

-- Ears (behind hair)
rect(img, 18, 28, 20, 34, SKIN)
rect(img, 44, 28, 46, 34, SKIN)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\portrait_magneta.png")
app.command.CloseFile()

---------- NAVI ----------
spr = Sprite(64, 64, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image
clearImg(img)

-- Blue uniform
rect(img, 18, 50, 46, 63, DARK_BLUE)
rect(img, 28, 46, 36, 52, SKIN)

drawFace(img)

-- Dark hair (short, neat)
rect(img, 20, 10, 44, 22, DARK_BLUE)
rect(img, 18, 14, 46, 20, DARK_BLUE)

-- Eyes with one raised eyebrow
drawEyes(img, 25, 35, 28, DARK_BLUE)
-- Left eyebrow raised higher
rect(img, 24, 24, 29, 25, BLACK)
-- Right eyebrow normal
rect(img, 35, 26, 40, 27, BLACK)

-- Slight smirk
rect(img, 30, 39, 36, 39, BROWN)
img:drawPixel(37, 38, BROWN)

-- Blue headset with mic
-- Headband
rect(img, 14, 18, 16, 34, BRIGHT_BLUE)
rect(img, 48, 18, 50, 34, BRIGHT_BLUE)
rect(img, 16, 10, 48, 12, BRIGHT_BLUE)
-- Earpiece (left)
rect(img, 12, 26, 16, 34, MED_BLUE)
-- Mic boom
rect(img, 12, 34, 12, 42, BRIGHT_BLUE)
rect(img, 13, 34, 13, 42, BRIGHT_BLUE)
-- Mic
circle(img, 14, 43, 2, DARK_GREY)

-- Ears (behind headset)
rect(img, 17, 28, 19, 34, SKIN)
rect(img, 45, 28, 47, 34, SKIN)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\portrait_navi.png")
app.command.CloseFile()

---------- GEO ----------
spr = Sprite(64, 64, ColorMode.RGB)
cel = spr.cels[1]
img = cel.image
clearImg(img)

-- Brown field vest
rect(img, 18, 50, 46, 63, BROWN)
-- Vest pockets
rect(img, 20, 54, 30, 60, Color{r=150, g=70, b=44, a=255})
rect(img, 34, 54, 44, 60, Color{r=150, g=70, b=44, a=255})
-- Shirt underneath
rect(img, 28, 50, 36, 56, DARK_GREEN)
rect(img, 28, 46, 36, 52, SKIN)

drawFace(img)

-- Wild orange curly hair
for y = 4, 26 do
  for x = 14, 50 do
    local d = math.sqrt((x-32)^2 + (y-18)^2)
    if d <= 18 then
      -- Curly effect - sine pattern
      local curl = math.sin(x * 0.8) * 2 + math.sin(y * 0.6) * 2
      if d <= 16 + curl then
        img:drawPixel(x, y, ORANGE)
      end
    end
  end
end
-- Extra wild bits sticking out
for _, p in ipairs({{16, 8}, {48, 10}, {14, 14}, {50, 12}, {20, 4}, {44, 5}, {32, 2}}) do
  img:drawPixel(p[1], p[2], ORANGE)
  img:drawPixel(p[1]+1, p[2], ORANGE)
  img:drawPixel(p[1], p[2]-1, ORANGE)
end

-- Green goggles on forehead
rect(img, 22, 18, 42, 24, DARK_GREEN)
-- Goggle lenses (circles)
circle(img, 28, 21, 3, GREEN)
circle(img, 36, 21, 3, GREEN)
-- Strap
rect(img, 16, 20, 22, 22, DARK_GREEN)
rect(img, 42, 20, 48, 22, DARK_GREEN)

-- Eyes
drawEyes(img, 25, 35, 29, GREEN)

-- Big grin
img:drawPixel(26, 38, BROWN)
for x = 27, 37 do
  img:drawPixel(x, 39, BROWN)
  img:drawPixel(x, 40, Color{r=200, g=50, b=50, a=255}) -- open mouth
end
img:drawPixel(38, 38, BROWN)
-- Teeth
for x = 29, 35 do
  img:drawPixel(x, 39, WHITE)
end

-- Ears
rect(img, 17, 28, 19, 34, SKIN)
rect(img, 45, 28, 47, 34, SKIN)

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\portrait_geo.png")
app.command.CloseFile()
