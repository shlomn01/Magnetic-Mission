-- Generate Bridge Background (960x540) for DNA Game
-- PICO-8 palette, ship bridge with stormy ocean through windows
-- Run: "C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe" -b --script tools/generate_bridge.lua

local W = 960
local H = 540

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
    INDIGO     = Color(131, 118, 156),
    BLACK      = Color(0, 0, 0),
}

local spr = Sprite(W, H, ColorMode.RGB)
spr.filename = "bridge_bg.png"
local img = spr.cels[1].image

local function fillRect(x1, y1, w, h, color)
    for py = math.max(0, y1), math.min(H - 1, y1 + h - 1) do
        for px = math.max(0, x1), math.min(W - 1, x1 + w - 1) do
            img:drawPixel(px, py, color)
        end
    end
end

local function hline(x1, x2, y, color)
    if y < 0 or y >= H then return end
    for px = math.max(0, x1), math.min(W - 1, x2) do
        img:drawPixel(px, y, color)
    end
end

local function vline(x, y1, y2, color)
    if x < 0 or x >= W then return end
    for py = math.max(0, y1), math.min(H - 1, y2) do
        img:drawPixel(x, py, color)
    end
end

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

local function lerpColor(c1, c2, t)
    t = math.max(0, math.min(1, t))
    return Color(
        math.floor(c1.red + (c2.red - c1.red) * t),
        math.floor(c1.green + (c2.green - c1.green) * t),
        math.floor(c1.blue + (c2.blue - c1.blue) * t)
    )
end

local function blendColor(base, overlay, alpha)
    return Color(
        math.floor(base.red + (overlay.red - base.red) * alpha),
        math.floor(base.green + (overlay.green - base.green) * alpha),
        math.floor(base.blue + (overlay.blue - base.blue) * alpha)
    )
end

local function safePixel(x, y, color)
    if x >= 0 and x < W and y >= 0 and y < H then
        img:drawPixel(x, y, color)
    end
end

math.randomseed(77)

print("Drawing sky and ocean...")

-- ==========================================
-- SKY through windows (y: 30-220)
-- ==========================================
local windowTop = 30
local windowBot = 220
local horizonY = 160

-- Dark stormy sky
for y = windowTop, horizonY do
    local t = (y - windowTop) / (horizonY - windowTop)
    local c = lerpColor(Color(8, 12, 22), Color(18, 25, 40), t)
    hline(100, W - 101, y, c)
end

-- Stormy ocean
for y = horizonY + 1, windowBot do
    local t = (y - horizonY) / (windowBot - horizonY)
    local c = lerpColor(Color(12, 20, 35), Color(8, 15, 28), t)
    -- Wave pattern
    local wave = math.sin(y * 0.08) * 3
    for x = 100, W - 101 do
        local waveC = c
        if math.sin(x * 0.03 + wave) > 0.7 then
            waveC = blendColor(c, C.MED_BLUE, 0.15)
        end
        safePixel(x, y, waveC)
    end
end

-- Horizon line (bright cyan strip)
hline(100, W - 101, horizonY, blendColor(Color(12, 20, 35), C.CYAN, 0.08))

-- Lightning bolt (frozen frame effect)
local lx = 380
for ly = windowTop + 5, windowTop + 60 do
    local wobble = math.floor(math.sin(ly * 0.3) * 3)
    safePixel(lx + wobble, ly, C.WHITE)
    safePixel(lx + wobble + 1, ly, blendColor(C.DARK_BLUE, C.WHITE, 0.5))
    -- Branch at midpoint
    if ly == windowTop + 30 then
        for bx = 0, 15 do
            safePixel(lx + wobble + bx, ly + math.floor(bx * 0.3), blendColor(C.DARK_BLUE, C.WHITE, 0.3))
        end
    end
end

-- Lightning glow on sky
for gy = windowTop, windowTop + 70 do
    for gx = lx - 30, lx + 30 do
        if gx >= 100 and gx < W - 100 and gy >= windowTop and gy <= windowBot then
            local dist = math.sqrt((gx - lx)^2 + (gy - (windowTop + 30))^2)
            if dist < 35 then
                local base = img:getPixel(gx, gy)
                local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
                safePixel(gx, gy, blendColor(bc, C.WHITE, math.max(0, 0.08 - dist * 0.002)))
            end
        end
    end
end

-- Cloud silhouettes
for ci = 1, 6 do
    local ccx = 150 + ci * 120
    local ccy = windowTop + 20 + math.random(-5, 10)
    for dx = -25, 25 do
        for dy = -8, 8 do
            local d = (dx * dx) / (25 * 25) + (dy * dy) / (8 * 8)
            if d < 1 and ccx + dx >= 100 and ccx + dx < W - 100 then
                local base = img:getPixel(ccx + dx, ccy + dy)
                local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
                safePixel(ccx + dx, ccy + dy, blendColor(bc, C.DARK_BLUE, 0.2))
            end
        end
    end
end

print("Drawing bridge structure...")

-- ==========================================
-- BRIDGE WALLS AND STRUCTURE
-- ==========================================
-- Ceiling
fillRect(0, 0, W, windowTop, C.DEEP_NAVY)

-- Ceiling panel lines
for cx = 0, W - 1, 80 do
    vline(cx, 0, windowTop - 1, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.3))
end
hline(0, W - 1, 10, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.2))

-- Window frames (3 large windows)
local windows = {
    {left = 100, right = 340},
    {left = 360, right = 600},
    {left = 620, right = 860}
}

for _, win in ipairs(windows) do
    -- Frame
    fillRect(win.left - 4, windowTop - 4, win.right - win.left + 8, windowBot - windowTop + 8, C.DARK_GREY)
    fillRect(win.left - 2, windowTop - 2, win.right - win.left + 4, windowBot - windowTop + 4, C.DARK_BLUE)
    -- Frame highlight
    hline(win.left - 4, win.right + 3, windowTop - 4, C.LIGHT_GREY)
    vline(win.left - 4, windowTop - 4, windowBot + 3, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))
    -- Frame bolts
    for bi = 0, 3 do
        local bx = win.left + bi * math.floor((win.right - win.left) / 3)
        fillRect(bx, windowTop - 3, 2, 2, C.LIGHT_GREY)
        fillRect(bx, windowBot + 1, 2, 2, C.LIGHT_GREY)
    end
end

-- Wall pillars between windows
for _, px in ipairs({96, 344, 614, 864}) do
    fillRect(px, windowTop, 8, windowBot - windowTop, C.DARK_GREY)
    vline(px, windowTop, windowBot, C.LIGHT_GREY)
    vline(px + 7, windowTop, windowBot, C.DEEP_NAVY)
end

-- Side walls (left of first window, right of last)
fillRect(0, windowTop, 96, windowBot - windowTop, C.DARK_BLUE)
fillRect(868, windowTop, W - 868, windowBot - windowTop, C.DARK_BLUE)
-- Wall panel lines
for wy = windowTop + 20, windowBot, 30 do
    hline(0, 95, wy, blendColor(C.DARK_BLUE, C.DEEP_NAVY, 0.3))
    hline(868, W - 1, wy, blendColor(C.DARK_BLUE, C.DEEP_NAVY, 0.3))
end

-- Below windows — console area wall
for y = windowBot + 4, 300 do
    local t = (y - windowBot) / (300 - windowBot)
    hline(0, W - 1, y, lerpColor(C.DARK_BLUE, Color(20, 30, 45), t))
end

print("Drawing console desk...")

-- ==========================================
-- CONSOLE DESK (y: 300-540)
-- ==========================================
local deskY = 300

-- Desk surface
for y = deskY, H - 1 do
    local t = (y - deskY) / (H - deskY)
    local c = lerpColor(Color(35, 42, 55), Color(22, 28, 38), t)
    hline(0, W - 1, y, c)
end

-- Desk top edge
fillRect(0, deskY, W, 4, C.DARK_GREY)
hline(0, W - 1, deskY, C.LIGHT_GREY)
hline(0, W - 1, deskY + 3, C.DEEP_NAVY)
-- Cyan accent line
hline(20, W - 21, deskY + 1, blendColor(C.DARK_GREY, C.CYAN, 0.15))

-- 3 console sections
local sections = {
    {left = 20, right = 300, label = "LEFT"},
    {left = 320, right = 640, label = "CENTER"},
    {left = 660, right = 940, label = "RIGHT"}
}

for _, sec in ipairs(sections) do
    -- Panel border
    fillRect(sec.left, deskY + 10, sec.right - sec.left, 4, C.DARK_GREY)
    -- Inset panel
    fillRect(sec.left + 4, deskY + 16, sec.right - sec.left - 8, 180, C.DEEP_NAVY)
    -- Cyan border on inset
    hline(sec.left + 4, sec.right - 5, deskY + 16, blendColor(C.DEEP_NAVY, C.CYAN, 0.25))
    hline(sec.left + 4, sec.right - 5, deskY + 195, blendColor(C.DEEP_NAVY, C.CYAN, 0.12))
    vline(sec.left + 4, deskY + 16, deskY + 195, blendColor(C.DEEP_NAVY, C.CYAN, 0.2))
    vline(sec.right - 5, deskY + 16, deskY + 195, blendColor(C.DEEP_NAVY, C.CYAN, 0.12))
end

-- Blinking indicator lights on desk edge
local ledColors = {C.RED, C.GREEN, C.ORANGE, C.CYAN, C.RED, C.GREEN, C.YELLOW, C.ORANGE, C.GREEN, C.RED, C.CYAN, C.GREEN}
for li, lc in ipairs(ledColors) do
    local lx = 40 + (li - 1) * 78
    fillRect(lx, deskY + 6, 4, 4, lc)
    -- Glow
    for dx = -2, 5 do
        for dy = -2, 5 do
            local dist = math.max(math.abs(dx - 1), math.abs(dy - 1))
            if dist > 2 and dist < 5 then
                local gx, gy = lx + dx, deskY + 6 + dy
                if gx >= 0 and gx < W and gy >= 0 and gy < H then
                    local base = img:getPixel(gx, gy)
                    local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
                    safePixel(gx, gy, blendColor(bc, lc, 0.06))
                end
            end
        end
    end
end

print("Drawing captain's chair...")

-- ==========================================
-- CAPTAIN'S CHAIR (center-back, between windows and desk)
-- ==========================================
local chairX = 480
local chairY = 260

-- Chair back (tall rectangle)
fillRect(chairX - 20, chairY - 30, 40, 35, C.DARK_GREY)
fillRect(chairX - 18, chairY - 28, 36, 31, Color(50, 40, 35))
-- Headrest
fillRect(chairX - 12, chairY - 32, 24, 6, C.BROWN)
hline(chairX - 12, chairX + 11, chairY - 32, blendColor(C.BROWN, C.LIGHT_GREY, 0.15))
-- Armrests
fillRect(chairX - 24, chairY - 5, 6, 20, C.DARK_GREY)
fillRect(chairX + 18, chairY - 5, 6, 20, C.DARK_GREY)
hline(chairX - 24, chairX - 19, chairY - 5, C.LIGHT_GREY)
hline(chairX + 18, chairX + 23, chairY - 5, C.LIGHT_GREY)
-- Seat
fillRect(chairX - 18, chairY + 5, 36, 12, Color(50, 40, 35))
-- Base
fillRect(chairX - 4, chairY + 17, 8, 10, C.DARK_GREY)
fillRect(chairX - 14, chairY + 27, 28, 4, C.DARK_GREY)

print("Drawing side instruments...")

-- ==========================================
-- SIDE INSTRUMENT DETAILS
-- ==========================================

-- Left wall panel — radar display
local radarX, radarY = 48, 120
fillRect(radarX - 20, radarY - 20, 40, 40, C.DARK_GREY)
fillRect(radarX - 18, radarY - 18, 36, 36, C.DEEP_NAVY)
fillCircle(radarX, radarY, 14, blendColor(C.DEEP_NAVY, C.GREEN, 0.08))
-- Radar rings
for ri = 5, 13, 4 do
    for a = 0, 359 do
        local rad = math.rad(a)
        local px = math.floor(radarX + math.cos(rad) * ri)
        local py = math.floor(radarY + math.sin(rad) * ri)
        if a % 3 == 0 then
            safePixel(px, py, blendColor(C.DEEP_NAVY, C.GREEN, 0.2))
        end
    end
end
-- Radar sweep
for ri = 0, 12 do
    local angle = 0.8
    local px = math.floor(radarX + math.cos(angle) * ri)
    local py = math.floor(radarY + math.sin(angle) * ri)
    safePixel(px, py, C.GREEN)
end

-- Right wall panel — status indicators
local statusX = W - 48
for si = 0, 4 do
    local sy = 100 + si * 25
    fillRect(statusX - 16, sy, 32, 18, C.DARK_GREY)
    fillRect(statusX - 14, sy + 2, 28, 14, C.DEEP_NAVY)
    -- Bar
    local barW = 8 + math.random(0, 16)
    fillRect(statusX - 12, sy + 5, barW, 8, ledColors[(si % #ledColors) + 1])
end

-- Steering wheel hint (below center window)
local wheelX, wheelY = 480, 275
for a = 0, 359, 15 do
    local rad = math.rad(a)
    local px = math.floor(wheelX + math.cos(rad) * 18)
    local py = math.floor(wheelY + math.sin(rad) * 18)
    safePixel(px, py, C.DARK_GREY)
end
fillCircle(wheelX, wheelY, 3, C.DARK_GREY)
safePixel(wheelX, wheelY, C.LIGHT_GREY)

print("Drawing vignette...")

-- ==========================================
-- VIGNETTE & ATMOSPHERE
-- ==========================================
-- Left/right vignette
for x = 0, 40 do
    local alpha = (40 - x) / 40 * 0.3
    for y = 0, H - 1 do
        local base = img:getPixel(x, y)
        local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(bc, C.DEEP_NAVY, alpha))
    end
end
for x = W - 41, W - 1 do
    local alpha = (x - (W - 41)) / 40 * 0.3
    for y = 0, H - 1 do
        local base = img:getPixel(x, y)
        local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(bc, C.DEEP_NAVY, alpha))
    end
end

-- Top vignette
for y = 0, 15 do
    local alpha = (15 - y) / 15 * 0.2
    for x = 0, W - 1 do
        local base = img:getPixel(x, y)
        local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
        safePixel(x, y, blendColor(bc, C.DEEP_NAVY, alpha))
    end
end

-- Rain streaks on windows
for ri = 1, 40 do
    local rx = 110 + math.random(0, 740)
    local ry = windowTop + 5 + math.random(0, 60)
    local rlen = 6 + math.random(0, 12)
    for dy = 0, rlen do
        if ry + dy < windowBot then
            local base = img:getPixel(rx, ry + dy)
            local bc = Color(app.pixelColor.rgbaR(base), app.pixelColor.rgbaG(base), app.pixelColor.rgbaB(base))
            safePixel(rx, ry + dy, blendColor(bc, C.WHITE, 0.06))
        end
    end
end

print("Saving...")

spr:saveCopyAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\bg_bridge.png")
print("Done! Saved bg_bridge.png")
spr:close()
