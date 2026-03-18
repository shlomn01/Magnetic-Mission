-- Galvanometer Needle (8x96) - transparent bg
local spr = Sprite(8, 96, ColorMode.RGB)
spr.filename = "needle.png"
local cel = spr.cels[1]
local img = cel.image

local RED = Color{r=255, g=0, b=77, a=255}
local BRIGHT_BLUE = Color{r=41, g=173, b=255, a=255}
local DARK_GREY = Color{r=95, g=87, b=79, a=255}
local WHITE = Color{r=255, g=241, b=232, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}

-- Clear to transparent
for y = 0, 95 do
  for x = 0, 7 do
    img:drawPixel(x, y, TRANS)
  end
end

local cx = 4
local midY = 48  -- center pivot

-- Top half (north, red) - pointed tip
for y = 0, midY - 1 do
  local t = y / midY  -- 0 at tip, 1 at center
  local halfWidth = math.max(0, math.floor(t * 3))
  for dx = -halfWidth, halfWidth do
    local px = cx + dx
    if px >= 0 and px < 8 then
      img:drawPixel(px, y, RED)
    end
  end
end

-- Bottom half (south, blue) - pointed tip
for y = midY, 95 do
  local t = (95 - y) / (95 - midY)  -- 1 at center, 0 at tip
  local halfWidth = math.max(0, math.floor(t * 3))
  for dx = -halfWidth, halfWidth do
    local px = cx + dx
    if px >= 0 and px < 8 then
      img:drawPixel(px, y, BRIGHT_BLUE)
    end
  end
end

-- Center pivot circle
for dy = -3, 3 do
  for dx = -3, 3 do
    if math.sqrt(dx*dx + dy*dy) <= 3 then
      local px = cx + dx
      local py = midY + dy
      if px >= 0 and px < 8 and py >= 0 and py < 96 then
        img:drawPixel(px, py, WHITE)
      end
    end
  end
end
-- Inner pivot
for dy = -1, 1 do
  for dx = -1, 1 do
    img:drawPixel(cx + dx, midY + dy, DARK_GREY)
  end
end

app.command.FlattenLayers()
spr:saveAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\needle.png")
app.command.CloseFile()
