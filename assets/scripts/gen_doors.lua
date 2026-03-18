-- Door Sprites (80x120 each) - Open and Locked versions

local DEEP_NAVY = Color{r=13, g=27, b=42, a=255}
local DARK_BLUE = Color{r=27, g=40, b=56, a=255}
local MED_BLUE = Color{r=45, g=74, b=106, a=255}
local WHITE = Color{r=255, g=241, b=232, a=255}
local LIGHT_GREY = Color{r=194, g=195, b=199, a=255}
local DARK_GREY = Color{r=95, g=87, b=79, a=255}
local RED = Color{r=255, g=0, b=77, a=255}
local GREEN = Color{r=0, g=228, b=54, a=255}
local YELLOW = Color{r=255, g=236, b=39, a=255}
local BLACK = Color{r=0, g=0, b=0, a=255}
local BROWN = Color{r=171, g=82, b=54, a=255}
local TRANS = Color{r=0, g=0, b=0, a=0}
local CYAN = Color{r=83, g=216, b=251, a=255}

local function makeDoor(filename, isLocked)
  local spr = Sprite(80, 120, ColorMode.RGB)
  local cel = spr.cels[1]
  local img = cel.image

  -- Clear to transparent
  for y = 0, 119 do
    for x = 0, 79 do
      img:drawPixel(x, y, TRANS)
    end
  end

  local function rect(x1, y1, x2, y2, col)
    for y = math.max(0, y1), math.min(119, y2) do
      for x = math.max(0, x1), math.min(79, x2) do
        img:drawPixel(x, y, col)
      end
    end
  end

  local function hline(x1, x2, y, col)
    if y < 0 or y >= 120 then return end
    for x = math.max(0, x1), math.min(79, x2) do
      img:drawPixel(x, y, col)
    end
  end

  local function vline(x, y1, y2, col)
    if x < 0 or x >= 80 then return end
    for y = math.max(0, y1), math.min(119, y2) do
      img:drawPixel(x, y, col)
    end
  end

  -- Door frame (outer)
  rect(0, 0, 79, 119, DARK_GREY)

  -- Door body (inner)
  rect(4, 4, 75, 115, MED_BLUE)

  -- Door outline
  rect(3, 3, 76, 3, BLACK)
  rect(3, 116, 76, 116, BLACK)
  vline(3, 3, 116, BLACK)
  vline(76, 3, 116, BLACK)

  -- Upper panel
  rect(10, 10, 69, 50, DARK_BLUE)
  -- Panel border
  hline(10, 69, 10, BLACK)
  hline(10, 69, 50, BLACK)
  vline(10, 10, 50, BLACK)
  vline(69, 10, 50, BLACK)

  -- Porthole window in upper panel
  local phCx = 40
  local phCy = 30
  local phR = 12
  for y = -phR, phR do
    for x = -phR, phR do
      local d = math.sqrt(x*x + y*y)
      local px = phCx + x
      local py = phCy + y
      if px >= 0 and px < 80 and py >= 0 and py < 120 then
        if d <= phR and d > phR - 2 then
          img:drawPixel(px, py, DARK_GREY)
        elseif d <= phR - 2 then
          -- Glass (dark cyan tint)
          img:drawPixel(px, py, DEEP_NAVY)
        end
      end
    end
  end
  -- Glass highlight
  for y = -4, 0 do
    for x = -2, 2 do
      local px = phCx + x - 3
      local py = phCy + y - 3
      if px >= 0 and px < 80 and py >= 0 and py < 120 then
        local d = math.sqrt((px - phCx)^2 + (py - phCy)^2)
        if d < phR - 2 then
          img:drawPixel(px, py, MED_BLUE)
        end
      end
    end
  end

  -- Lower panel
  rect(10, 60, 69, 110, DARK_BLUE)
  hline(10, 69, 60, BLACK)
  hline(10, 69, 110, BLACK)
  vline(10, 60, 110, BLACK)
  vline(69, 60, 110, BLACK)

  -- Panel detail lines
  hline(15, 64, 85, Color{r=35, g=55, b=80, a=255})

  -- Door handle (right side)
  rect(62, 72, 66, 88, LIGHT_GREY)
  rect(63, 74, 65, 86, DARK_GREY)

  -- Status light (top right of door)
  local statusCol = isLocked and RED or GREEN
  rect(60, 6, 68, 9, BLACK)
  rect(61, 7, 67, 8, statusCol)

  -- Locked version: padlock icon
  if isLocked then
    -- Padlock body (bottom of door, center)
    local plx = 35
    local ply = 96
    rect(plx, ply, plx + 10, ply + 8, YELLOW)
    -- Shackle (U shape on top)
    vline(plx + 2, ply - 5, ply, YELLOW)
    vline(plx + 8, ply - 5, ply, YELLOW)
    hline(plx + 2, plx + 8, ply - 5, YELLOW)
    -- Keyhole
    img:drawPixel(plx + 5, ply + 3, BLACK)
    img:drawPixel(plx + 5, ply + 5, BLACK)
  end

  -- Rivets on frame
  for ry = 8, 112, 16 do
    img:drawPixel(1, ry, LIGHT_GREY)
    img:drawPixel(78, ry, LIGHT_GREY)
  end

  app.command.FlattenLayers()
  spr:saveAs(filename)
  app.command.CloseFile()
end

makeDoor("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\door_open.png", false)
makeDoor("C:\\Users\\shlom\\projects\\DNA Game\\assets\\sprites\\door_locked.png", true)
