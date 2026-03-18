-- Title Screen Background (960x540)
-- Night sky with stars, moon, and ocean waves

local spr = Sprite(960, 540, ColorMode.RGB)
spr.filename = "title_bg.png"
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
local INDIGO = Color{r=131, g=118, b=156, a=255}
local SKIN = Color{r=255, g=204, b=170, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}

-- Simple pseudo-random (seed-based)
local seed = 12345
local function rng()
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed
end
local function rnd(n)
  return rng() % n
end

-- Sky gradient: deep navy at top to dark blue at horizon (row 324 = 60% mark)
local skyBottom = 324
for y = 0, skyBottom - 1 do
  local t = y / skyBottom
  local r = math.floor(13 + (27 - 13) * t)
  local g = math.floor(27 + (40 - 27) * t)
  local b = math.floor(42 + (56 - 42) * t)
  local c = Color{r=r, g=g, b=b, a=255}
  for x = 0, 959 do
    img:drawPixel(x, y, c)
  end
end

-- Stars (120+ stars)
local starColors = {WHITE, LIGHT_GREY, CYAN, SKIN, INDIGO}
for i = 1, 140 do
  local sx = rnd(960)
  local sy = rnd(skyBottom - 10)
  local size = rnd(3) + 1  -- 1..3
  local col = starColors[rnd(#starColors) + 1]
  if size == 1 then
    img:drawPixel(sx, sy, col)
  elseif size == 2 then
    img:drawPixel(sx, sy, col)
    img:drawPixel(sx+1, sy, col)
    img:drawPixel(sx, sy+1, col)
    img:drawPixel(sx+1, sy+1, col)
  else
    -- 3px cross shape
    img:drawPixel(sx, sy, col)
    img:drawPixel(sx-1, sy, col)
    img:drawPixel(sx+1, sy, col)
    img:drawPixel(sx, sy-1, col)
    img:drawPixel(sx, sy+1, col)
  end
end

-- Moon (36px diameter) in upper-right area
local moonCx = 800
local moonCy = 80
local moonR = 18
for y = -moonR, moonR do
  for x = -moonR, moonR do
    local d = math.sqrt(x*x + y*y)
    if d <= moonR then
      local px = moonCx + x
      local py = moonCy + y
      if px >= 0 and px < 960 and py >= 0 and py < 540 then
        -- Moon base color
        local c = Color{r=255, g=241, b=232, a=255}
        -- Slight shading on right edge
        if d > moonR - 3 then
          c = LIGHT_GREY
        end
        img:drawPixel(px, py, c)
      end
    end
  end
end

-- Moon craters
local craters = {
  {-5, -3, 4}, {6, 2, 3}, {-2, 7, 3}, {3, -6, 2}, {8, -4, 2},
  {-8, 1, 2}, {1, 3, 3}, {-4, -8, 2}
}
for _, cr in ipairs(craters) do
  local cx = moonCx + cr[1]
  local cy = moonCy + cr[2]
  local cr_r = cr[3]
  for y = -cr_r, cr_r do
    for x = -cr_r, cr_r do
      if math.sqrt(x*x + y*y) <= cr_r then
        local px = cx + x
        local py = cy + y
        local dist = math.sqrt((px - moonCx)^2 + (py - moonCy)^2)
        if dist <= moonR and px >= 0 and px < 960 and py >= 0 and py < 540 then
          img:drawPixel(px, py, LIGHT_GREY)
        end
      end
    end
  end
end

-- Ocean in bottom 40% (rows 324-539)
-- 3 wave layers with different blues
local oceanTop = 324

-- Base ocean fill: dark blue
for y = oceanTop, 539 do
  local t = (y - oceanTop) / (539 - oceanTop)
  local r = math.floor(13 + (0 - 13) * t)
  local g = math.floor(27 + (0 - 27) * t)
  local b = math.floor(56 + (42 - 56) * t)
  local c = Color{r=math.max(0,r), g=math.max(0,g), b=math.max(0,b), a=255}
  for x = 0, 959 do
    img:drawPixel(x, y, c)
  end
end

-- Wave layer 1 (top, medium blue)
for x = 0, 959 do
  local waveY = oceanTop + math.floor(math.sin(x * 0.02) * 4 + math.sin(x * 0.05) * 2)
  for dy = 0, 5 do
    local py = waveY + dy
    if py >= oceanTop and py < 540 then
      img:drawPixel(x, py, MED_BLUE)
    end
  end
end

-- Wave layer 2 (middle)
for x = 0, 959 do
  local waveY = oceanTop + 40 + math.floor(math.sin(x * 0.015 + 2) * 5 + math.sin(x * 0.04) * 3)
  for dy = 0, 4 do
    local py = waveY + dy
    if py >= oceanTop and py < 540 then
      img:drawPixel(x, py, DARK_BLUE)
    end
  end
end

-- Wave layer 3 (lower, subtle)
for x = 0, 959 do
  local waveY = oceanTop + 90 + math.floor(math.sin(x * 0.01 + 4) * 3 + math.sin(x * 0.03) * 2)
  for dy = 0, 3 do
    local py = waveY + dy
    if py >= oceanTop and py < 540 then
      img:drawPixel(x, py, DEEP_NAVY)
    end
  end
end

-- Wave highlights (bright blue foam lines)
for x = 0, 959 do
  local waveY = oceanTop + math.floor(math.sin(x * 0.02) * 4 + math.sin(x * 0.05) * 2)
  if rnd(3) == 0 then
    img:drawPixel(x, waveY, BRIGHT_BLUE)
  end
end

-- Moon reflection on water
for y = oceanTop, oceanTop + 80 do
  local t = (y - oceanTop) / 80
  local reflWidth = math.floor(6 + t * 20)
  local reflAlpha = math.max(40, math.floor(180 * (1 - t)))
  for dx = -reflWidth, reflWidth do
    local px = moonCx + dx + math.floor(math.sin(y * 0.1) * 3)
    if px >= 0 and px < 960 and rnd(3) > 0 then
      img:drawPixel(px, y, Color{r=200, g=200, b=220, a=reflAlpha})
    end
  end
end

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\title_bg.png")
app.command.CloseFile()
