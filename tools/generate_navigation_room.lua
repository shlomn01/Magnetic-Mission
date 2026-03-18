-- Generate Navigation Room Background (960x540) for DNA Game
-- PICO-8 palette, sci-fi ship navigation control room
-- Run: Aseprite.exe -b --script tools/generate_navigation_room.lua

local W = 960
local H = 540

-- Layout constants
local VP_X = 480          -- vanishing point X
local VP_Y = 200          -- vanishing point Y
local CEILING_H = 40      -- ceiling bottom at front
local FLOOR_Y = 340       -- floor top at front
local CONSOLE_Y = 400     -- console desk top
local BACK_TOP = 130
local BACK_BOT = 270
local BACK_LEFT = 280
local BACK_RIGHT = 680

-- PICO-8 palette
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
spr.filename = "navigation_bg.png"
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

-- Helper: stroke circle
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

-- Helper: safe pixel
local function safePixel(x, y, color)
    if x >= 0 and x < W and y >= 0 and y < H then
        img:drawPixel(x, y, color)
    end
end

print("Drawing background fill...")

-- ==========================================
-- BACKGROUND GRADIENT (full canvas)
-- ==========================================
for y = 0, H - 1 do
    local t = y / H
    local c = lerpColor(C.DEEP_NAVY, C.DARK_BLUE, t * 0.6)
    hline(0, W - 1, y, c)
end

print("Drawing back wall...")

-- ==========================================
-- BACK WALL
-- ==========================================
-- Slightly lighter rectangle at back
for y = BACK_TOP, BACK_BOT do
    local t = (y - BACK_TOP) / (BACK_BOT - BACK_TOP)
    local c = lerpColor(Color(18, 30, 48), Color(24, 38, 58), t)
    hline(BACK_LEFT, BACK_RIGHT, y, c)
end

-- Panel seam lines on back wall
for py = BACK_TOP + 30, BACK_BOT, 35 do
    hline(BACK_LEFT, BACK_RIGHT, py, blendColor(C.DARK_BLUE, C.DEEP_NAVY, 0.4))
    hline(BACK_LEFT, BACK_RIGHT, py + 1, blendColor(C.DARK_BLUE, C.MED_BLUE, 0.08))
end

-- Vertical seams on back wall
for px = BACK_LEFT + 80, BACK_RIGHT - 1, 80 do
    vline(px, BACK_TOP, BACK_BOT, blendColor(C.DARK_BLUE, C.DEEP_NAVY, 0.35))
end

-- Central display screen on back wall
local scrL = 380
local scrT = 145
local scrW = 200
local scrH = 95
fillRect(scrL - 3, scrT - 3, scrW + 6, scrH + 6, C.DARK_GREY)
fillRect(scrL - 1, scrT - 1, scrW + 2, scrH + 2, C.DEEP_NAVY)
fillRect(scrL, scrT, scrW, scrH, C.DARK_BLUE)
-- Screen inner glow border
hline(scrL, scrL + scrW - 1, scrT, C.MED_BLUE)
hline(scrL, scrL + scrW - 1, scrT + scrH - 1, blendColor(C.DARK_BLUE, C.MED_BLUE, 0.3))
vline(scrL, scrT, scrT + scrH - 1, C.MED_BLUE)
vline(scrL + scrW - 1, scrT, scrT + scrH - 1, blendColor(C.DARK_BLUE, C.MED_BLUE, 0.3))

-- Screen content: faint grid
for gx = scrL + 20, scrL + scrW - 1, 20 do
    vline(gx, scrT + 2, scrT + scrH - 3, blendColor(C.DARK_BLUE, C.MED_BLUE, 0.15))
end
for gy = scrT + 15, scrT + scrH - 1, 15 do
    hline(scrL + 2, scrL + scrW - 3, gy, blendColor(C.DARK_BLUE, C.MED_BLUE, 0.12))
end

-- Screen content: wavy line (signal)
for sx = scrL + 5, scrL + scrW - 6 do
    local phase = (sx - scrL) * 0.06
    local sy = math.floor(scrT + scrH / 2 + math.sin(phase) * 15 + math.sin(phase * 2.7) * 6)
    if sy >= scrT + 2 and sy < scrT + scrH - 2 then
        safePixel(sx, sy, C.CYAN)
        safePixel(sx, sy + 1, blendColor(C.DARK_BLUE, C.CYAN, 0.3))
    end
end

-- Screen glow on back wall
for gy = scrT - 8, scrT + scrH + 8 do
    for gx = scrL - 12, scrL + scrW + 12 do
        if gx >= BACK_LEFT and gx <= BACK_RIGHT and gy >= BACK_TOP and gy <= BACK_BOT then
            if gx < scrL - 1 or gx > scrL + scrW or gy < scrT - 1 or gy > scrT + scrH then
                local dist = 0
                if gx < scrL then dist = dist + (scrL - gx) end
                if gx > scrL + scrW then dist = dist + (gx - scrL - scrW) end
                if gy < scrT then dist = dist + (scrT - gy) end
                if gy > scrT + scrH then dist = dist + (gy - scrT - scrH) end
                local alpha = math.max(0, 0.06 - dist * 0.005)
                if alpha > 0 then
                    local base = img:getPixel(gx, gy)
                    local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
                    safePixel(gx, gy, blendColor(baseC, C.CYAN, alpha))
                end
            end
        end
    end
end

-- Warning lights flanking screen
fillCircle(350, 185, 3, C.ORANGE)
fillCircle(350, 185, 5, blendColor(C.DARK_BLUE, C.ORANGE, 0.10))
fillCircle(612, 185, 3, C.ORANGE)
fillCircle(612, 185, 5, blendColor(C.DARK_BLUE, C.ORANGE, 0.10))

print("Drawing ceiling...")

-- ==========================================
-- CEILING
-- ==========================================
fillRect(0, 0, W, CEILING_H, C.DEEP_NAVY)

-- Ceiling bottom edge
hline(0, W - 1, CEILING_H - 1, C.DARK_BLUE)
hline(0, W - 1, CEILING_H - 2, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.5))

-- Cable conduit at top
fillRect(0, 6, W, 4, C.DARK_GREY)
hline(0, W - 1, 6, C.LIGHT_GREY)
hline(0, W - 1, 9, C.DEEP_NAVY)

-- Conduit rivets
for rx = 30, W - 1, 60 do
    fillRect(rx, 7, 2, 2, C.LIGHT_GREY)
end

-- 3 overhead light strips
local lightStripX = {240, 480, 720}
for _, lsx in ipairs(lightStripX) do
    -- Housing
    fillRect(lsx - 3, 14, 6, CEILING_H - 14, C.DARK_GREY)
    -- Light surface (bright line)
    vline(lsx, 16, CEILING_H - 3, C.WHITE)
    -- Cyan glow flanking the light
    vline(lsx - 1, 16, CEILING_H - 3, blendColor(C.DEEP_NAVY, C.CYAN, 0.5))
    vline(lsx + 1, 16, CEILING_H - 3, blendColor(C.DEEP_NAVY, C.CYAN, 0.5))
    vline(lsx - 2, 18, CEILING_H - 3, blendColor(C.DEEP_NAVY, C.CYAN, 0.2))
    vline(lsx + 2, 18, CEILING_H - 3, blendColor(C.DEEP_NAVY, C.CYAN, 0.2))
end

-- Light cone glow on walls below ceiling strips
for _, lsx in ipairs(lightStripX) do
    local coneTop = CEILING_H
    local coneBot = FLOOR_Y - 20
    local coneH = coneBot - coneTop
    for s = 0, 10 do
        local ratio = s / 10
        local cy = math.floor(coneTop + ratio * coneH)
        local halfW = math.floor(6 + ratio * 50)
        local alpha = 0.025 * (1 - ratio * 0.8)
        for px = lsx - halfW, lsx + halfW do
            if px >= 0 and px < W and cy >= 0 and cy < H then
                local base = img:getPixel(px, cy)
                local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
                safePixel(px, cy, blendColor(baseC, C.CYAN, alpha))
            end
        end
    end
end

-- Orange warning lights on ceiling
fillCircle(150, 28, 2, C.ORANGE)
fillCircle(150, 28, 6, blendColor(C.DEEP_NAVY, C.ORANGE, 0.08))
fillCircle(810, 28, 2, C.ORANGE)
fillCircle(810, 28, 6, blendColor(C.DEEP_NAVY, C.ORANGE, 0.08))

print("Drawing walls...")

-- ==========================================
-- LEFT WALL (perspective trapezoid area)
-- ==========================================
-- Left wall spans from x=0 to BACK_LEFT, y=CEILING_H to FLOOR_Y
for y = CEILING_H, FLOOR_Y - 1 do
    local t = (y - CEILING_H) / (FLOOR_Y - CEILING_H)
    local wallC = lerpColor(Color(13, 27, 42), Color(22, 36, 54), t)
    -- Perspective: wall extends further right at top/bottom, narrower at VP level
    local rightEdge = BACK_LEFT
    hline(0, rightEdge - 1, y, wallC)
end

-- Right wall
for y = CEILING_H, FLOOR_Y - 1 do
    local t = (y - CEILING_H) / (FLOOR_Y - CEILING_H)
    local wallC = lerpColor(Color(13, 27, 42), Color(22, 36, 54), t)
    hline(BACK_RIGHT + 1, W - 1, y, wallC)
end

-- Wall rivet grids (left wall)
for rx = 20, BACK_LEFT - 20, 30 do
    for ry = CEILING_H + 15, FLOOR_Y - 15, 30 do
        local t = (ry - CEILING_H) / (FLOOR_Y - CEILING_H)
        local rc = blendColor(lerpColor(Color(13, 27, 42), Color(22, 36, 54), t), C.DARK_GREY, 0.35)
        fillRect(rx, ry, 2, 2, rc)
    end
end

-- Wall rivet grids (right wall)
for rx = BACK_RIGHT + 20, W - 20, 30 do
    for ry = CEILING_H + 15, FLOOR_Y - 15, 30 do
        local t = (ry - CEILING_H) / (FLOOR_Y - CEILING_H)
        local rc = blendColor(lerpColor(Color(13, 27, 42), Color(22, 36, 54), t), C.DARK_GREY, 0.35)
        fillRect(rx, ry, 2, 2, rc)
    end
end

-- Horizontal panel seams on walls
for py = CEILING_H + 40, FLOOR_Y - 1, 50 do
    local t = (py - CEILING_H) / (FLOOR_Y - CEILING_H)
    local seamC = blendColor(lerpColor(Color(13, 27, 42), Color(22, 36, 54), t), C.DEEP_NAVY, 0.4)
    hline(0, BACK_LEFT - 1, py, seamC)
    hline(BACK_RIGHT + 1, W - 1, py, seamC)
end

-- ==========================================
-- VERTICAL PIPES (2 per side)
-- ==========================================

-- Left wall pipes
local leftPipes = {40, 90}
for _, px in ipairs(leftPipes) do
    -- Pipe body
    fillRect(px, CEILING_H, 6, FLOOR_Y - CEILING_H, C.DARK_GREY)
    -- Highlight
    vline(px, CEILING_H, FLOOR_Y - 1, C.LIGHT_GREY)
    vline(px + 1, CEILING_H, FLOOR_Y - 1, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))
    -- Shadow
    vline(px + 5, CEILING_H, FLOOR_Y - 1, C.DEEP_NAVY)
    -- Bracket straps
    for by = CEILING_H + 30, FLOOR_Y - 20, 60 do
        fillRect(px - 2, by, 10, 3, C.DARK_GREY)
        hline(px - 2, px + 7, by, C.LIGHT_GREY)
    end
end

-- Right wall pipes (mirrored)
local rightPipes = {W - 46, W - 96}
for _, px in ipairs(rightPipes) do
    fillRect(px, CEILING_H, 6, FLOOR_Y - CEILING_H, C.DARK_GREY)
    vline(px + 5, CEILING_H, FLOOR_Y - 1, C.LIGHT_GREY)
    vline(px + 4, CEILING_H, FLOOR_Y - 1, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))
    vline(px, CEILING_H, FLOOR_Y - 1, C.DEEP_NAVY)
    for by = CEILING_H + 30, FLOOR_Y - 20, 60 do
        fillRect(px - 2, by, 10, 3, C.DARK_GREY)
        hline(px - 2, px + 7, by, C.LIGHT_GREY)
    end
end

-- Valve wheel on left pipe
strokeCircle(leftPipes[1] + 3, 220, 6, C.BROWN, 1)
fillRect(leftPipes[1] + 2, 219, 2, 2, C.DARK_GREY)

print("Drawing floor...")

-- ==========================================
-- FLOOR (FLOOR_Y to CONSOLE_Y)
-- ==========================================
local floorTop = Color(40, 48, 58)
local floorBot = Color(25, 32, 42)

for y = FLOOR_Y, CONSOLE_Y - 1 do
    local t = (y - FLOOR_Y) / (CONSOLE_Y - FLOOR_Y)
    local c = lerpColor(floorTop, floorBot, t)
    hline(0, W - 1, y, c)
end

-- Baseboard / wall-floor trim
fillRect(0, FLOOR_Y, W, 3, C.DARK_GREY)
hline(0, W - 1, FLOOR_Y, C.LIGHT_GREY)
hline(0, W - 1, FLOOR_Y + 2, C.DEEP_NAVY)

-- Floor grid lines (perspective: closer together toward bottom)
for gy = FLOOR_Y + 10, CONSOLE_Y - 1, 18 do
    local t = (gy - FLOOR_Y) / (CONSOLE_Y - FLOOR_Y)
    local lineC = blendColor(lerpColor(floorTop, floorBot, t), C.DEEP_NAVY, 0.25)
    hline(0, W - 1, gy, lineC)
end

-- Vertical floor grid (converging toward VP)
for gx = 0, W - 1, 40 do
    for gy = FLOOR_Y + 4, CONSOLE_Y - 1 do
        local t = (gy - FLOOR_Y) / (CONSOLE_Y - FLOOR_Y)
        local lineC = blendColor(lerpColor(floorTop, floorBot, t), C.MED_BLUE, 0.08)
        safePixel(gx, gy, lineC)
    end
end

-- Floor bolts at grid intersections
for gx = 40, W - 1, 40 do
    for gy = FLOOR_Y + 10, CONSOLE_Y - 5, 18 do
        local t = (gy - FLOOR_Y) / (CONSOLE_Y - FLOOR_Y)
        local bc = blendColor(lerpColor(floorTop, floorBot, t), C.LIGHT_GREY, 0.12)
        fillRect(gx - 1, gy - 1, 2, 2, bc)
    end
end

-- Anti-fatigue mat strip
fillRect(80, CONSOLE_Y - 12, W - 160, 8, blendColor(C.DARK_GREY, C.BROWN, 0.25))
hline(80, W - 81, CONSOLE_Y - 12, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.1))

-- Light reflections on floor (under each ceiling strip)
for _, lsx in ipairs(lightStripX) do
    for fy = FLOOR_Y + 4, CONSOLE_Y - 1 do
        for px = lsx - 25, lsx + 24 do
            if px >= 0 and px < W then
                local dist = math.abs(px - lsx) / 25
                local alpha = 0.02 * (1 - dist)
                local t = (fy - FLOOR_Y) / (CONSOLE_Y - FLOOR_Y)
                local baseC = lerpColor(floorTop, floorBot, t)
                safePixel(px, fy, blendColor(baseC, C.CYAN, alpha))
            end
        end
    end
end

print("Drawing console desk...")

-- ==========================================
-- CONSOLE DESK (CONSOLE_Y to H)
-- ==========================================

-- Desk top surface (slightly curved — center is 4px higher)
for y = CONSOLE_Y - 4, CONSOLE_Y do
    local curveAlpha = 1 - math.abs(y - CONSOLE_Y) / 5
    for x = 80, W - 81 do
        local distFromCenter = math.abs(x - VP_X) / (W / 2 - 80)
        -- Curve: center pixels draw higher, edges draw at CONSOLE_Y
        if y >= CONSOLE_Y - math.floor((1 - distFromCenter) * 4) then
            safePixel(x, y, blendColor(C.DARK_GREY, C.MED_BLUE, 0.15))
        end
    end
end

-- Desk top edge highlight
hline(80, W - 81, CONSOLE_Y - 4, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.25))

-- Desk front face
for y = CONSOLE_Y + 1, H - 1 do
    local t = (y - CONSOLE_Y) / (H - CONSOLE_Y)
    local c = lerpColor(C.MED_BLUE, C.DARK_BLUE, t * 0.7)
    hline(80, W - 81, y, c)
end

-- Desk bottom shadow
for y = H - 6, H - 1 do
    local t = (y - (H - 6)) / 6
    hline(80, W - 81, y, blendColor(C.DARK_BLUE, C.DEEP_NAVY, t * 0.5))
end

-- Panel division lines on desk front face
local panelDividers = {280, 480, 680}
-- Actually we need 2 dividers to make 3 sections
local dividers = {320, 640}
for _, dx in ipairs(dividers) do
    vline(dx, CONSOLE_Y + 1, H - 1, blendColor(C.MED_BLUE, C.DEEP_NAVY, 0.5))
    vline(dx + 1, CONSOLE_Y + 1, H - 1, blendColor(C.MED_BLUE, C.DARK_BLUE, 0.3))
    vline(dx - 1, CONSOLE_Y + 1, H - 1, blendColor(C.MED_BLUE, C.DEEP_NAVY, 0.3))
end

-- 3 instrument panel recesses in the desk
local panels = {
    {cx = 200, y = CONSOLE_Y + 15, w = 180, h = 55},
    {cx = 480, y = CONSOLE_Y + 12, w = 200, h = 60},
    {cx = 760, y = CONSOLE_Y + 15, w = 180, h = 55},
}

for _, p in ipairs(panels) do
    local px1 = p.cx - math.floor(p.w / 2)
    local py1 = p.y
    -- Dark recess
    fillRect(px1, py1, p.w, p.h, C.DEEP_NAVY)
    -- Beveled inset border
    hline(px1, px1 + p.w - 1, py1, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.6))
    vline(px1, py1, py1 + p.h - 1, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.6))
    hline(px1, px1 + p.w - 1, py1 + p.h - 1, blendColor(C.DEEP_NAVY, C.DARK_GREY, 0.25))
    vline(px1 + p.w - 1, py1, py1 + p.h - 1, blendColor(C.DEEP_NAVY, C.DARK_GREY, 0.25))
    -- Faint screen glow inner border
    hline(px1 + 1, px1 + p.w - 2, py1 + 1, blendColor(C.DEEP_NAVY, C.CYAN, 0.12))
    hline(px1 + 1, px1 + p.w - 2, py1 + p.h - 2, blendColor(C.DEEP_NAVY, C.CYAN, 0.06))
    vline(px1 + 1, py1 + 1, py1 + p.h - 2, blendColor(C.DEEP_NAVY, C.CYAN, 0.10))
    vline(px1 + p.w - 2, py1 + 1, py1 + p.h - 2, blendColor(C.DEEP_NAVY, C.CYAN, 0.06))
end

-- Orange indicator lights along desk top edge
math.randomseed(42) -- deterministic
for i = 1, 18 do
    local ix = 100 + math.random(0, W - 200)
    local iy = CONSOLE_Y - 2
    fillRect(ix, iy, 4, 4, C.ORANGE)
    -- Tiny glow
    safePixel(ix - 1, iy + 1, blendColor(C.DARK_GREY, C.ORANGE, 0.15))
    safePixel(ix + 4, iy + 1, blendColor(C.DARK_GREY, C.ORANGE, 0.15))
end

-- Status LED strips below each instrument panel
for _, p in ipairs(panels) do
    local ledY = p.y + p.h + 6
    local ledX = p.cx - 12
    local colors = {C.GREEN, C.ORANGE, C.RED}
    for li, lc in ipairs(colors) do
        fillRect(ledX + (li - 1) * 8, ledY, 2, 2, lc)
    end
end

print("Drawing side equipment racks...")

-- ==========================================
-- SIDE INSTRUMENT RACKS
-- ==========================================

-- Left rack
local lrX = 120
local lrY = 160
local lrW = 60
local lrH = 140
fillRect(lrX, lrY, lrW, lrH, C.DEEP_NAVY)
-- Frame
hline(lrX, lrX + lrW - 1, lrY, C.DARK_GREY)
hline(lrX, lrX + lrW - 1, lrY + lrH - 1, C.DARK_GREY)
vline(lrX, lrY, lrY + lrH - 1, C.DARK_GREY)
vline(lrX + lrW - 1, lrY, lrY + lrH - 1, C.DARK_GREY)
-- Highlight top/left
hline(lrX, lrX + lrW - 1, lrY, C.LIGHT_GREY)
vline(lrX, lrY, lrY + lrH - 1, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))

-- Modules inside left rack
for mi = 0, 4 do
    local my = lrY + 4 + mi * 27
    local mw = lrW - 8
    fillRect(lrX + 4, my, mw, 22, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.3))
    hline(lrX + 4, lrX + 4 + mw - 1, my, C.DARK_BLUE)
    hline(lrX + 4, lrX + 4 + mw - 1, my + 21, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.5))
    -- LED dots
    local ledColors = {C.GREEN, C.CYAN, C.ORANGE, C.RED}
    for li = 1, 2 + (mi % 2) do
        fillRect(lrX + 8 + (li - 1) * 10, my + 8, 2, 2, ledColors[((mi + li) % #ledColors) + 1])
    end
end

-- Bar graph in module 2
local bgX = lrX + 38
local bgY = lrY + 4 + 1 * 27 + 5
local heights = {12, 8, 16, 10}
for bi, bh in ipairs(heights) do
    fillRect(bgX + (bi - 1) * 4, bgY + 16 - bh, 2, bh, C.CYAN)
end

-- Right rack (mirrored)
local rrX = W - 120 - 60
local rrY = 160
fillRect(rrX, rrY, lrW, lrH, C.DEEP_NAVY)
hline(rrX, rrX + lrW - 1, rrY, C.DARK_GREY)
hline(rrX, rrX + lrW - 1, rrY + lrH - 1, C.DARK_GREY)
vline(rrX, rrY, rrY + lrH - 1, C.DARK_GREY)
vline(rrX + lrW - 1, rrY, rrY + lrH - 1, C.DARK_GREY)
hline(rrX, rrX + lrW - 1, rrY, C.LIGHT_GREY)
vline(rrX + lrW - 1, rrY, rrY + lrH - 1, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))

for mi = 0, 4 do
    local my = rrY + 4 + mi * 27
    local mw = lrW - 8
    fillRect(rrX + 4, my, mw, 22, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.3))
    hline(rrX + 4, rrX + 4 + mw - 1, my, C.DARK_BLUE)
    hline(rrX + 4, rrX + 4 + mw - 1, my + 21, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.5))
    local ledColors = {C.GREEN, C.CYAN, C.ORANGE, C.RED}
    for li = 1, 2 + ((mi + 1) % 2) do
        fillRect(rrX + 8 + (li - 1) * 10, my + 8, 2, 2, ledColors[((mi + li + 1) % #ledColors) + 1])
    end
end

-- Mini radar sweep in right rack module 1
local radarCx = rrX + 35
local radarCy = rrY + 4 + 14
strokeCircle(radarCx, radarCy, 7, C.GREEN, 1)
fillCircle(radarCx, radarCy, 1, C.GREEN)
-- Radar sweep line
for ri = 0, 6 do
    local angle = 0.7
    local rx = math.floor(radarCx + math.cos(angle) * ri)
    local ry = math.floor(radarCy + math.sin(angle) * ri)
    safePixel(rx, ry, C.GREEN)
end

print("Drawing environmental details...")

-- ==========================================
-- ENVIRONMENTAL DETAILS
-- ==========================================

-- Clock on back wall above screen
local clockX = 480
local clockY = 138
strokeCircle(clockX, clockY, 8, C.DARK_GREY, 1)
fillCircle(clockX, clockY, 6, blendColor(C.DARK_BLUE, C.WHITE, 0.15))
-- Hour hand
safePixel(clockX, clockY - 3, C.DEEP_NAVY)
safePixel(clockX, clockY - 2, C.DEEP_NAVY)
-- Minute hand
safePixel(clockX + 2, clockY, C.DEEP_NAVY)
safePixel(clockX + 3, clockY, C.DEEP_NAVY)
safePixel(clockX + 4, clockY, C.DEEP_NAVY)
-- Center
safePixel(clockX, clockY, C.RED)

-- Coffee mug on desk left
local mugX = 115
local mugY = CONSOLE_Y - 6
fillRect(mugX, mugY, 6, 8, C.BROWN)
fillRect(mugX + 5, mugY + 2, 3, 4, C.BROWN) -- handle
safePixel(mugX + 2, mugY - 2, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.15)) -- steam
safePixel(mugX + 3, mugY - 3, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.10))

-- Clipboard on desk right
local cbX = 660
local cbY = CONSOLE_Y - 5
fillRect(cbX, cbY, 10, 14, blendColor(C.DARK_GREY, C.WHITE, 0.35))
-- Text lines
for tl = 0, 3 do
    hline(cbX + 1, cbX + 8, cbY + 3 + tl * 3, C.DARK_GREY)
end
-- Clip
fillRect(cbX + 3, cbY - 2, 4, 3, C.DARK_GREY)

-- Headset on desk center-left
local hsX = 350
local hsY = CONSOLE_Y - 3
-- Band
for hi = -6, 6 do
    local hy = hsY - math.floor(math.sqrt(math.max(0, 36 - hi * hi)) * 0.5)
    safePixel(hsX + hi, hy, C.DARK_GREY)
end
-- Ear cups
fillRect(hsX - 7, hsY - 1, 4, 4, C.DARK_GREY)
safePixel(hsX - 6, hsY, C.LIGHT_GREY)
fillRect(hsX + 4, hsY - 1, 4, 4, C.DARK_GREY)
safePixel(hsX + 5, hsY, C.LIGHT_GREY)

-- Emergency panel on right wall
local epX = 870
local epY = 230
fillRect(epX, epY, 24, 18, C.DARK_GREY)
fillRect(epX + 2, epY + 2, 20, 14, C.DEEP_NAVY)
-- Indicator dots
fillRect(epX + 5, epY + 7, 2, 2, C.RED)
fillRect(epX + 10, epY + 7, 2, 2, C.YELLOW)
fillRect(epX + 15, epY + 7, 2, 2, C.GREEN)
-- Warning triangle
safePixel(epX + 11, epY + 3, C.ORANGE)
safePixel(epX + 10, epY + 4, C.ORANGE)
safePixel(epX + 12, epY + 4, C.ORANGE)
hline(epX + 9, epX + 13, epY + 5, C.ORANGE)

print("Drawing vignette and shadows...")

-- ==========================================
-- VIGNETTE & SHADOWS
-- ==========================================

-- Left edge vignette
for x = 0, 50 do
    local alpha = (50 - x) / 50 * 0.25
    for y = 0, H - 1 do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end

-- Right edge vignette
for x = W - 51, W - 1 do
    local alpha = (x - (W - 51)) / 50 * 0.25
    for y = 0, H - 1 do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end

-- Top edge vignette
for y = 0, 20 do
    local alpha = (20 - y) / 20 * 0.15
    for x = 0, W - 1 do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end

-- Console desk shadow on floor
for y = CONSOLE_Y - 8, CONSOLE_Y - 1 do
    local alpha = (y - (CONSOLE_Y - 8)) / 8 * 0.15
    for x = 80, W - 81 do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end

-- Wall-back wall corner shadows
for x = BACK_LEFT, BACK_LEFT + 8 do
    local alpha = (8 - (x - BACK_LEFT)) / 8 * 0.2
    for y = BACK_TOP, BACK_BOT do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end
for x = BACK_RIGHT - 8, BACK_RIGHT do
    local alpha = ((x - (BACK_RIGHT - 8))) / 8 * 0.2
    for y = BACK_TOP, BACK_BOT do
        local base = img:getPixel(x, y)
        local baseC = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(baseC, C.DEEP_NAVY, alpha))
    end
end

print("Saving...")

-- Export
spr:saveCopyAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\bg_navigation.png")

print("Done! Saved bg_navigation.png")

-- Close without saving .ase
spr:close()
