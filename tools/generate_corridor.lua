-- Generate Ship Corridor Background (960x540) for DNA Game
-- PICO-8 palette, LucasArts adventure style side-view corridor
-- Run: Aseprite.exe -b --script tools/generate_corridor.lua

local W = 960
local H = 540

-- Layout constants (must match ShipHubScene.js)
local CEILING_H = math.floor(H * 0.08) -- 43
local FLOOR_Y = math.floor(H * 0.62)   -- 335
local WALL_TOP = CEILING_H
local WALL_H = FLOOR_Y - WALL_TOP       -- 292

-- PICO-8-ish palette
local C = {
    DEEP_NAVY  = Color(13, 27, 42),
    DARK_BLUE  = Color(27, 40, 56),
    MED_BLUE   = Color(45, 74, 106),
    BRIGHT_BLUE= Color(41, 173, 255),
    CYAN       = Color(83, 216, 251),
    WHITE      = Color(255, 241, 232),
    LIGHT_GREY = Color(194, 195, 199),
    DARK_GREY  = Color(95, 87, 79),
    RED        = Color(255, 0, 77),
    ORANGE     = Color(255, 163, 0),
    YELLOW     = Color(255, 236, 39),
    GREEN      = Color(0, 228, 54),
    BROWN      = Color(171, 82, 54),
    BLACK      = Color(0, 0, 0),
}

-- Create sprite
local spr = Sprite(W, H, ColorMode.RGB)
spr.filename = "corridor_bg.png"
local img = spr.cels[1].image

-- Helper: fill rectangle
local function fillRect(x1, y1, w, h, color)
    for py = math.max(0, y1), math.min(H - 1, y1 + h - 1) do
        for px = math.max(0, x1), math.min(W - 1, x1 + w - 1) do
            img:drawPixel(px, py, color)
        end
    end
end

-- Helper: horizontal line
local function hline(x1, x2, y, color)
    if y < 0 or y >= H then return end
    for px = math.max(0, x1), math.min(W - 1, x2) do
        img:drawPixel(px, y, color)
    end
end

-- Helper: vertical line
local function vline(x, y1, y2, color)
    if x < 0 or x >= W then return end
    for py = math.max(0, y1), math.min(H - 1, y2) do
        img:drawPixel(x, py, color)
    end
end

-- Helper: fill circle
local function fillCircle(cx, cy, r, color)
    for py = cy - r, cy + r do
        for px = cx - r, cx + r do
            if (px - cx)^2 + (py - cy)^2 <= r^2 then
                if px >= 0 and px < W and py >= 0 and py < H then
                    img:drawPixel(px, py, color)
                end
            end
        end
    end
end

-- Helper: stroke circle (outline only)
local function strokeCircle(cx, cy, r, color, thickness)
    thickness = thickness or 1
    local r2_outer = r * r
    local r2_inner = (r - thickness) * (r - thickness)
    for py = cy - r - 1, cy + r + 1 do
        for px = cx - r - 1, cx + r + 1 do
            local d2 = (px - cx)^2 + (py - cy)^2
            if d2 <= r2_outer and d2 >= r2_inner then
                if px >= 0 and px < W and py >= 0 and py < H then
                    img:drawPixel(px, py, color)
                end
            end
        end
    end
end

-- Helper: lerp color
local function lerpColor(c1, c2, t)
    t = math.max(0, math.min(1, t))
    return Color(
        math.floor(c1.red + (c2.red - c1.red) * t),
        math.floor(c1.green + (c2.green - c1.green) * t),
        math.floor(c1.blue + (c2.blue - c1.blue) * t)
    )
end

-- Helper: blend color with alpha
local function blendColor(base, overlay, alpha)
    return Color(
        math.floor(base.red + (overlay.red - base.red) * alpha),
        math.floor(base.green + (overlay.green - base.green) * alpha),
        math.floor(base.blue + (overlay.blue - base.blue) * alpha)
    )
end

print("Drawing ceiling...")

-- ==========================================
-- CEILING (0 to CEILING_H)
-- ==========================================
fillRect(0, 0, W, CEILING_H, C.DEEP_NAVY)

-- Bottom edge of ceiling
hline(0, W - 1, CEILING_H - 1, C.DARK_BLUE)
hline(0, W - 1, CEILING_H - 2, C.DARK_BLUE)

-- Main pipe (thick, 8px)
local pipeY1 = math.floor(CEILING_H * 0.25)
fillRect(0, pipeY1, W, 8, C.DARK_GREY)
hline(0, W - 1, pipeY1, C.LIGHT_GREY)       -- highlight top
hline(0, W - 1, pipeY1 + 1, C.LIGHT_GREY)
hline(0, W - 1, pipeY1 + 7, C.DEEP_NAVY)    -- shadow bottom

-- Second thinner pipe
local pipeY2 = math.floor(CEILING_H * 0.65)
fillRect(0, pipeY2, W, 5, C.DARK_GREY)
hline(0, W - 1, pipeY2, C.LIGHT_GREY)

-- Pipe joints every 160px
for jx = 80, W - 1, 160 do
    -- Joint on pipe 1
    fillRect(jx - 5, pipeY1 - 2, 10, 12, C.DARK_GREY)
    hline(jx - 5, jx + 4, pipeY1 - 2, C.LIGHT_GREY)
    -- Valve handle
    fillRect(jx - 1, pipeY1 - 5, 2, 4, C.BROWN)
    fillRect(jx - 4, pipeY1 - 6, 8, 2, C.BROWN)

    -- Joint on pipe 2
    fillRect(jx + 37, pipeY2 - 1, 6, 7, C.DARK_GREY)
    hline(jx + 37, jx + 42, pipeY2 - 1, C.LIGHT_GREY)
end

-- Vertical connectors between pipes
for cx = 200, W - 1, 300 do
    fillRect(cx, pipeY1 + 8, 4, pipeY2 - pipeY1 - 8, C.DARK_GREY)
    vline(cx, pipeY1 + 8, pipeY2 - 1, C.LIGHT_GREY)
end

print("Drawing walls...")

-- ==========================================
-- WALL GRADIENT (WALL_TOP to FLOOR_Y)
-- ==========================================
local wallTopColor = Color(13, 27, 42)     -- dark navy at top
local wallBotColor = Color(55, 85, 115)    -- visible blue-grey at bottom

for y = WALL_TOP, FLOOR_Y - 1 do
    local ratio = (y - WALL_TOP) / WALL_H
    local c = lerpColor(wallTopColor, wallBotColor, ratio)
    hline(0, W - 1, y, c)
end

-- Horizontal panel seams every 50px
for py = WALL_TOP + 25, FLOOR_Y - 1, 50 do
    -- Dark seam line
    local seamColor = blendColor(lerpColor(wallTopColor, wallBotColor, (py - WALL_TOP) / WALL_H), C.DEEP_NAVY, 0.5)
    hline(0, W - 1, py, seamColor)
    -- Light highlight 1px below
    local hlColor = blendColor(lerpColor(wallTopColor, wallBotColor, (py + 1 - WALL_TOP) / WALL_H), C.MED_BLUE, 0.15)
    hline(0, W - 1, py + 1, hlColor)
end

-- Vertical panel seams every 150px
for px = 75, W - 1, 150 do
    for py = WALL_TOP, FLOOR_Y - 1 do
        local baseC = lerpColor(wallTopColor, wallBotColor, (py - WALL_TOP) / WALL_H)
        local seamC = blendColor(baseC, C.DEEP_NAVY, 0.3)
        img:drawPixel(px, py, seamC)
    end
end

-- Rivets at panel intersections
for rx = 75, W - 1, 150 do
    for ry = WALL_TOP + 25, FLOOR_Y - 1, 50 do
        -- Two small rivets on each side
        local rivetC = blendColor(lerpColor(wallTopColor, wallBotColor, (ry - WALL_TOP) / WALL_H), C.LIGHT_GREY, 0.3)
        if rx - 8 >= 0 then fillRect(rx - 8, ry - 1, 2, 2, rivetC) end
        if rx + 6 < W then fillRect(rx + 6, ry - 1, 2, 2, rivetC) end
    end
end

print("Drawing door alcoves...")

-- ==========================================
-- DOOR ALCOVES (recessed frames for 4 doors)
-- ==========================================
-- Door positions: 192, 384, 576, 768 (w / 5 * i for i=1..4)
local doorPositions = {192, 384, 576, 768}
local doorW = 120
local doorH = 180
local alcoveW = doorW + 16
local alcoveH = doorH + 12

for _, doorX in ipairs(doorPositions) do
    local aLeft = doorX - alcoveW / 2
    local aTop = FLOOR_Y - alcoveH

    -- Deep recessed area (darker than wall)
    fillRect(math.floor(aLeft), math.floor(aTop), math.floor(alcoveW), math.floor(alcoveH), C.DEEP_NAVY)

    -- Inner frame shadow/highlight for depth effect
    -- Top edge: bright (lit from above)
    hline(math.floor(aLeft), math.floor(aLeft + alcoveW - 1), math.floor(aTop), C.MED_BLUE)
    hline(math.floor(aLeft + 1), math.floor(aLeft + alcoveW - 2), math.floor(aTop + 1), blendColor(C.MED_BLUE, C.DARK_BLUE, 0.5))

    -- Left edge: slightly bright
    vline(math.floor(aLeft), math.floor(aTop), math.floor(aTop + alcoveH - 1), blendColor(C.MED_BLUE, C.DARK_BLUE, 0.6))
    vline(math.floor(aLeft + 1), math.floor(aTop + 1), math.floor(aTop + alcoveH - 2), blendColor(C.MED_BLUE, C.DEEP_NAVY, 0.3))

    -- Right edge: dark shadow
    vline(math.floor(aLeft + alcoveW - 1), math.floor(aTop), math.floor(aTop + alcoveH - 1), C.BLACK)
    vline(math.floor(aLeft + alcoveW - 2), math.floor(aTop + 1), math.floor(aTop + alcoveH - 2), blendColor(C.DEEP_NAVY, C.BLACK, 0.4))

    -- Bottom edge: dark
    hline(math.floor(aLeft), math.floor(aLeft + alcoveW - 1), math.floor(aTop + alcoveH - 1), C.BLACK)

    -- Inner wall gradient (slightly lighter than deep navy to show depth)
    for y = math.floor(aTop + 2), math.floor(aTop + alcoveH - 2) do
        local ratio = (y - aTop) / alcoveH
        local innerC = lerpColor(Color(15, 25, 40), Color(20, 35, 55), ratio)
        hline(math.floor(aLeft + 2), math.floor(aLeft + alcoveW - 3), y, innerC)
    end

    -- Door threshold (bright line at bottom of alcove on floor)
    hline(math.floor(aLeft + 2), math.floor(aLeft + alcoveW - 3), math.floor(aTop + alcoveH - 2), C.DARK_GREY)
end

print("Drawing porthole...")

-- ==========================================
-- PORTHOLE WINDOW (between door 2 and 3)
-- ==========================================
local portX = math.floor(W * 0.5)
local portY = math.floor(WALL_TOP + WALL_H * 0.28)
local portR = 30

-- Outer metal ring
fillCircle(portX, portY, portR + 8, C.DARK_GREY)
fillCircle(portX, portY, portR + 5, C.BROWN)

-- Frame highlight top
for px = portX - portR - 2, portX + portR + 2 do
    if px >= 0 and px < W and portY - portR - 6 >= 0 then
        img:drawPixel(px, portY - portR - 5, C.LIGHT_GREY)
    end
end

-- Dark sky through porthole
fillCircle(portX, portY, portR, C.DEEP_NAVY)

-- Storm clouds
fillCircle(portX - 10, portY - 12, 12, C.DARK_BLUE)
fillCircle(portX + 8, portY - 8, 10, C.DARK_BLUE)
fillCircle(portX - 5, portY - 6, 8, C.DARK_BLUE)

-- Ocean bottom half
fillRect(portX - portR, portY + 2, portR * 2, portR, C.DARK_BLUE)
-- Wave highlight
fillRect(portX - 18, portY + 2, 36, 3, C.MED_BLUE)
fillRect(portX - 12, portY + 2, 24, 1, C.CYAN)

-- Bolts around edge (8 of them)
for a = 0, 7 do
    local angle = (a / 8) * math.pi * 2
    local bx = math.floor(portX + math.cos(angle) * (portR + 5))
    local by = math.floor(portY + math.sin(angle) * (portR + 5))
    if bx >= 0 and bx < W - 2 and by >= 0 and by < H - 2 then
        fillRect(bx, by, 3, 3, C.LIGHT_GREY)
    end
end

-- Glass reflection
fillCircle(portX - 8, portY - 8, 6, blendColor(C.DEEP_NAVY, C.WHITE, 0.08))

print("Drawing notice board...")

-- ==========================================
-- NOTICE BOARD (shifted to left of porthole)
-- ==========================================
local nbX = math.floor(W * 0.35)
local nbY = math.floor(WALL_TOP + WALL_H * 0.45)
local nbW, nbH = 70, 44

-- Cork board
fillRect(nbX - nbW / 2, nbY - nbH / 2, nbW, nbH, C.BROWN)
-- Frame
for i = 0, 1 do
    hline(math.floor(nbX - nbW / 2), math.floor(nbX + nbW / 2 - 1), math.floor(nbY - nbH / 2 + i), C.DARK_GREY)
    hline(math.floor(nbX - nbW / 2), math.floor(nbX + nbW / 2 - 1), math.floor(nbY + nbH / 2 - 1 - i), C.DARK_GREY)
    vline(math.floor(nbX - nbW / 2 + i), math.floor(nbY - nbH / 2), math.floor(nbY + nbH / 2 - 1), C.DARK_GREY)
    vline(math.floor(nbX + nbW / 2 - 1 - i), math.floor(nbY - nbH / 2), math.floor(nbY + nbH / 2 - 1), C.DARK_GREY)
end

-- Notes pinned to board
fillRect(nbX - 22, nbY + 2, 16, 12, C.YELLOW)
fillCircle(nbX - 14, nbY + 2, 2, C.RED)
fillRect(nbX + 6, nbY, 18, 14, C.WHITE)
fillCircle(nbX + 15, nbY, 2, C.RED)
fillRect(nbX - 6, nbY + 4, 10, 8, C.BRIGHT_BLUE)
fillCircle(nbX - 1, nbY + 4, 2, C.ORANGE)

print("Drawing light fixtures...")

-- ==========================================
-- CEILING LIGHT FIXTURES (above each door)
-- ==========================================
for _, lx in ipairs(doorPositions) do
    -- Bracket
    fillRect(lx - 14, CEILING_H - 4, 28, 6, C.DARK_GREY)
    hline(lx - 14, lx + 13, CEILING_H - 4, C.LIGHT_GREY)
    hline(lx - 14, lx + 13, CEILING_H - 3, C.LIGHT_GREY)

    -- Bulb (bright)
    fillRect(lx - 8, CEILING_H + 2, 16, 4, blendColor(C.DEEP_NAVY, C.YELLOW, 0.15))
    fillRect(lx - 6, CEILING_H + 2, 12, 3, blendColor(C.DEEP_NAVY, C.WHITE, 0.25))

    -- Light cone glow on wall (subtle gradient getting wider)
    local coneTop = CEILING_H + 6
    local coneBot = FLOOR_Y - 10
    local coneH = coneBot - coneTop
    for s = 0, 7 do
        local ratio = s / 8
        local cy = math.floor(coneTop + ratio * coneH)
        local halfW = math.floor(8 + ratio * 60)
        local alpha = 0.03 * (1 - ratio * 0.7)
        local glowC = blendColor(lerpColor(wallTopColor, wallBotColor, (cy - WALL_TOP) / WALL_H), C.WHITE, alpha)
        fillRect(lx - halfW, cy, halfW * 2, math.floor(coneH / 8) + 1, glowC)
    end
end

print("Drawing floor...")

-- ==========================================
-- FLOOR (FLOOR_Y to H)
-- ==========================================
local floorH = H - FLOOR_Y
local floorTopColor = Color(50, 55, 65)    -- lighter at top
local floorBotColor = Color(25, 30, 38)    -- darker at bottom

for y = FLOOR_Y, H - 1 do
    local ratio = (y - FLOOR_Y) / floorH
    local c = lerpColor(floorTopColor, floorBotColor, ratio)
    hline(0, W - 1, y, c)
end

-- Baseboard / wall-floor trim
fillRect(0, FLOOR_Y, W, 4, C.DARK_GREY)
hline(0, W - 1, FLOOR_Y, C.LIGHT_GREY)
hline(0, W - 1, FLOOR_Y + 3, C.DEEP_NAVY)

-- Bright accent line at wall-floor junction
hline(0, W - 1, FLOOR_Y - 1, blendColor(C.MED_BLUE, C.BRIGHT_BLUE, 0.2))

-- Checkerboard floor tiles
local tileW = 48
local tileH = 24
for fx = 0, W - 1, tileW do
    for fy = FLOOR_Y + 4, H - 1, tileH do
        local checker = ((math.floor(fx / tileW) + math.floor((fy - FLOOR_Y) / tileH)) % 2 == 0)
        if checker then
            local baseC = lerpColor(floorTopColor, floorBotColor, (fy - FLOOR_Y) / floorH)
            local tileC = blendColor(baseC, C.WHITE, 0.06)
            fillRect(fx, fy, tileW, tileH, tileC)
        end
    end
end

-- Grid lines on floor (darker)
for fy = FLOOR_Y + 4, H - 1, tileH do
    local lineC = blendColor(lerpColor(floorTopColor, floorBotColor, (fy - FLOOR_Y) / floorH), C.DEEP_NAVY, 0.3)
    hline(0, W - 1, fy, lineC)
end
for fx = 0, W - 1, tileW do
    for fy = FLOOR_Y + 5, H - 1 do
        local lineC = blendColor(lerpColor(floorTopColor, floorBotColor, (fy - FLOOR_Y) / floorH), C.DEEP_NAVY, 0.2)
        img:drawPixel(fx, fy, lineC)
    end
end

-- Floor bolts at tile corners
for fx = tileW, W - 1, tileW do
    for fy = FLOOR_Y + 4 + tileH, H - 1, tileH do
        local boltC = blendColor(lerpColor(floorTopColor, floorBotColor, (fy - FLOOR_Y) / floorH), C.LIGHT_GREY, 0.15)
        if fx >= 0 and fx < W - 1 and fy >= 0 and fy < H - 1 then
            fillRect(fx - 1, fy - 1, 2, 2, boltC)
        end
    end
end

-- Drainage grate
local grateX = math.floor(W * 0.72)
local grateY = FLOOR_Y + 20
local grateW, grateH = 48, 24
fillRect(grateX, grateY, grateW, grateH, C.DEEP_NAVY)
for sx = grateX + 4, grateX + grateW - 3, 6 do
    fillRect(sx, grateY + 3, 3, grateH - 6, C.BLACK)
end
-- Grate frame
hline(grateX, grateX + grateW - 1, grateY, C.DARK_GREY)
hline(grateX, grateX + grateW - 1, grateY + grateH - 1, C.DARK_GREY)
vline(grateX, grateY, grateY + grateH - 1, C.DARK_GREY)
vline(grateX + grateW - 1, grateY, grateY + grateH - 1, C.DARK_GREY)

-- Light reflections on floor (under each light fixture)
for _, lx in ipairs(doorPositions) do
    for fy = FLOOR_Y + 5, H - 1 do
        for px = lx - 30, lx + 29 do
            if px >= 0 and px < W then
                local dist = math.abs(px - lx) / 30
                local alpha = 0.03 * (1 - dist)
                local baseC = lerpColor(floorTopColor, floorBotColor, (fy - FLOOR_Y) / floorH)
                -- Check checker pattern
                local checker = ((math.floor(px / tileW) + math.floor((fy - FLOOR_Y) / tileH)) % 2 == 0)
                if checker then
                    baseC = blendColor(baseC, C.WHITE, 0.06)
                end
                local reflC = blendColor(baseC, C.BRIGHT_BLUE, alpha)
                img:drawPixel(px, fy, reflC)
            end
        end
    end
end

print("Saving...")

-- Export
local outputPath = app.fs.joinPath(app.fs.filePath(spr.filename), "..", "assets", "backgrounds", "corridor_bg.png")
-- Use a simpler approach - save directly
spr:saveCopyAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\corridor_bg.png")

print("Done! Saved corridor_bg.png")

-- Close without saving the .ase
spr:close()
