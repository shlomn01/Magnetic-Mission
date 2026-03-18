-- Generate Ship Corridor V2 Background (960x540) for DNA Game
-- PICO-8 palette, sci-fi research vessel, detailed pixel art
-- Much richer than v1: panelled walls, industrial ceiling, grated floor,
-- atmospheric lighting, 4 recessed door alcoves with act labels
--
-- HOW TO RUN:
--   Option A (headless):
--     "C:\Program Files\Aseprite\Aseprite.exe" -b --script "C:\Users\shlom\projects\DNA Game\tools\generate_corridor_v2.lua"
--
--   Option B (inside Aseprite):
--     File -> Scripts -> Open Scripts Folder
--     Copy this file there, then File -> Scripts -> generate_corridor_v2
--
-- OUTPUT: assets/backgrounds/corridor_bg.png (960x540)

local W = 960
local H = 540

-- Layout constants (must match ShipHubScene.js)
local CEILING_H = math.floor(H * 0.08) -- 43
local FLOOR_Y   = math.floor(H * 0.62) -- 335
local WALL_TOP  = CEILING_H
local WALL_H    = FLOOR_Y - WALL_TOP    -- 292

-- PICO-8 palette (strict)
local C = {
    DEEP_NAVY   = Color(13, 27, 42),
    DARK_BLUE   = Color(27, 40, 56),
    MED_BLUE    = Color(45, 74, 106),
    BRIGHT_BLUE = Color(41, 173, 255),
    CYAN        = Color(83, 216, 251),
    WHITE       = Color(255, 241, 232),
    LIGHT_GREY  = Color(194, 195, 199),
    DARK_GREY   = Color(95, 87, 79),
    RED         = Color(255, 0, 77),
    ORANGE      = Color(255, 163, 0),
    YELLOW      = Color(255, 236, 39),
    GREEN       = Color(0, 228, 54),
    PINK        = Color(255, 119, 168),
    INDIGO      = Color(131, 118, 156),
    BROWN       = Color(171, 82, 54),
    BLACK       = Color(0, 0, 0),
}

-- Create sprite
local spr = Sprite(W, H, ColorMode.RGB)
spr.filename = "corridor_bg_v2.png"
local img = spr.cels[1].image

-- ============================================================
-- Drawing helpers
-- ============================================================

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

local function strokeCircle(cx, cy, r, color, thickness)
    thickness = thickness or 1
    local r2o = r * r
    local r2i = (r - thickness) * (r - thickness)
    for py = cy - r - 1, cy + r + 1 do
        for px = cx - r - 1, cx + r + 1 do
            local d2 = (px - cx)^2 + (py - cy)^2
            if d2 <= r2o and d2 >= r2i then
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
        math.floor(c1.red   + (c2.red   - c1.red)   * t),
        math.floor(c1.green + (c2.green - c1.green) * t),
        math.floor(c1.blue  + (c2.blue  - c1.blue)  * t)
    )
end

local function blendColor(base, overlay, alpha)
    return Color(
        math.floor(base.red   + (overlay.red   - base.red)   * alpha),
        math.floor(base.green + (overlay.green - base.green) * alpha),
        math.floor(base.blue  + (overlay.blue  - base.blue)  * alpha)
    )
end

-- Dithered blend: alternating pixels for a retro look
local function ditherRect(x1, y1, w, h, color, density)
    for py = math.max(0, y1), math.min(H - 1, y1 + h - 1) do
        for px = math.max(0, x1), math.min(W - 1, x1 + w - 1) do
            if ((px + py) % math.floor(1 / density + 0.5)) == 0 then
                img:drawPixel(px, py, color)
            end
        end
    end
end

-- Pseudo-random (seeded, deterministic for reproducibility)
local _seed = 42
local function prand()
    _seed = (_seed * 1103515245 + 12345) % 2147483648
    return _seed / 2147483648
end

-- Door positions (must match ShipHubScene.js: w / 5 * i for i=1..4)
local doorPositions = {192, 384, 576, 768}
local doorW = 120
local doorH = 180

print("[v2] Drawing ceiling...")

-- ============================================================
-- 1. CEILING - industrial ducts, exposed pipes, conduits
-- ============================================================

-- Base ceiling fill
fillRect(0, 0, W, CEILING_H, C.DEEP_NAVY)

-- Bottom edge trim (2px metal lip)
hline(0, W - 1, CEILING_H - 1, C.DARK_GREY)
hline(0, W - 1, CEILING_H - 2, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.3))

-- Main duct (wide, 10px)
local ductY = math.floor(CEILING_H * 0.15)
fillRect(0, ductY, W, 10, C.DARK_GREY)
hline(0, W - 1, ductY, C.LIGHT_GREY)           -- top highlight
hline(0, W - 1, ductY + 1, C.LIGHT_GREY)
hline(0, W - 1, ductY + 9, C.DEEP_NAVY)        -- bottom shadow
-- Rivets on main duct
for rx = 30, W - 1, 64 do
    fillRect(rx, ductY + 3, 3, 3, C.LIGHT_GREY)
    fillRect(rx + 1, ductY + 4, 1, 1, C.WHITE)  -- highlight dot
end

-- Secondary conduit (thinner, 6px, slightly lower)
local condY = math.floor(CEILING_H * 0.55)
fillRect(0, condY, W, 6, blendColor(C.DARK_GREY, C.DARK_BLUE, 0.4))
hline(0, W - 1, condY, blendColor(C.LIGHT_GREY, C.DARK_GREY, 0.5))
-- Small pipe brackets
for bx = 50, W - 1, 120 do
    fillRect(bx - 3, condY - 2, 6, 2, C.DARK_GREY)
    fillRect(bx - 2, condY - 2, 4, 1, C.LIGHT_GREY)
end

-- Tertiary thin cable tray
local cableY = math.floor(CEILING_H * 0.82)
fillRect(0, cableY, W, 3, blendColor(C.DEEP_NAVY, C.DARK_BLUE, 0.7))
hline(0, W - 1, cableY, blendColor(C.DARK_GREY, C.DEEP_NAVY, 0.5))

-- Pipe joints / clamps every ~130px
for jx = 65, W - 1, 130 do
    -- Main duct clamp
    fillRect(jx - 6, ductY - 3, 12, 16, C.DARK_GREY)
    hline(jx - 6, jx + 5, ductY - 3, C.LIGHT_GREY)
    -- Hex bolt
    fillRect(jx - 1, ductY + 4, 3, 3, C.LIGHT_GREY)
    fillRect(jx, ductY + 5, 1, 1, C.WHITE)
end

-- Vertical drops between ducts
for dx = 180, W - 1, 280 do
    fillRect(dx, ductY + 10, 3, condY - ductY - 10, C.DARK_GREY)
    vline(dx, ductY + 10, condY - 1, C.LIGHT_GREY)
end

-- Small warning stripes near edges
for wx = 10, 50, 8 do
    fillRect(wx, ductY + 2, 4, 6, C.YELLOW)
    fillRect(wx + 4, ductY + 2, 4, 6, C.DEEP_NAVY)
end
for wx = W - 58, W - 18, 8 do
    fillRect(wx, ductY + 2, 4, 6, C.YELLOW)
    fillRect(wx + 4, ductY + 2, 4, 6, C.DEEP_NAVY)
end

print("[v2] Drawing walls...")

-- ============================================================
-- 2. WALLS - gradient with inset panel detail, rivets, trim
-- ============================================================

local wallTopC = Color(13, 27, 42)
local wallBotC = Color(48, 72, 100)

-- Base gradient
for y = WALL_TOP, FLOOR_Y - 1 do
    local ratio = (y - WALL_TOP) / WALL_H
    local c = lerpColor(wallTopC, wallBotC, ratio)
    hline(0, W - 1, y, c)
end

-- Upper trim strip (accent line)
fillRect(0, WALL_TOP, W, 3, C.DARK_GREY)
hline(0, W - 1, WALL_TOP, C.LIGHT_GREY)
hline(0, W - 1, WALL_TOP + 2, C.DEEP_NAVY)

-- Lower trim strip (baseboard area will be drawn with floor)

-- Horizontal panel seams every 44px
local panelSeamSpacing = 44
for py = WALL_TOP + 30, FLOOR_Y - 10, panelSeamSpacing do
    local baseC = lerpColor(wallTopC, wallBotC, (py - WALL_TOP) / WALL_H)
    local seamDark  = blendColor(baseC, C.DEEP_NAVY, 0.55)
    local seamLight = blendColor(baseC, C.MED_BLUE, 0.12)
    hline(0, W - 1, py, seamDark)
    hline(0, W - 1, py + 1, seamLight)
end

-- Vertical panel seams every 120px
local vpanelSpacing = 120
for px = vpanelSpacing, W - 1, vpanelSpacing do
    -- Skip if inside a door alcove
    local inDoor = false
    for _, dx in ipairs(doorPositions) do
        if math.abs(px - dx) < doorW / 2 + 12 then inDoor = true end
    end
    if not inDoor then
        for py = WALL_TOP + 3, FLOOR_Y - 1 do
            local baseC = lerpColor(wallTopC, wallBotC, (py - WALL_TOP) / WALL_H)
            local seamC = blendColor(baseC, C.DEEP_NAVY, 0.35)
            img:drawPixel(px, py, seamC)
            -- Highlight 1px right
            if px + 1 < W then
                local hlC = blendColor(baseC, C.MED_BLUE, 0.08)
                img:drawPixel(px + 1, py, hlC)
            end
        end
    end
end

-- Rivets at seam intersections
for rx = vpanelSpacing, W - 1, vpanelSpacing do
    local inDoor = false
    for _, dx in ipairs(doorPositions) do
        if math.abs(rx - dx) < doorW / 2 + 12 then inDoor = true end
    end
    if not inDoor then
        for ry = WALL_TOP + 30, FLOOR_Y - 10, panelSeamSpacing do
            local baseC = lerpColor(wallTopC, wallBotC, (ry - WALL_TOP) / WALL_H)
            local rivetC = blendColor(baseC, C.LIGHT_GREY, 0.25)
            -- Two rivets flanking the vertical seam
            if rx - 6 >= 0 then
                fillRect(rx - 6, ry - 1, 2, 2, rivetC)
                fillRect(rx - 5, ry, 1, 1, blendColor(rivetC, C.WHITE, 0.3))
            end
            if rx + 5 < W then
                fillRect(rx + 5, ry - 1, 2, 2, rivetC)
                fillRect(rx + 6, ry, 1, 1, blendColor(rivetC, C.WHITE, 0.3))
            end
        end
    end
end

-- Subtle wall texture noise (sparse dither dots)
for n = 1, 600 do
    local nx = math.floor(prand() * W)
    local ny = WALL_TOP + math.floor(prand() * WALL_H)
    if ny < FLOOR_Y then
        local baseC = lerpColor(wallTopC, wallBotC, (ny - WALL_TOP) / WALL_H)
        local noiseC = blendColor(baseC, C.MED_BLUE, 0.05 + prand() * 0.05)
        img:drawPixel(nx, ny, noiseC)
    end
end

print("[v2] Drawing door alcoves...")

-- ============================================================
-- 3. DOOR ALCOVES - deep recessed frames with depth shading
-- ============================================================

local alcoveW = doorW + 20
local alcoveH = doorH + 16

for di, doorX in ipairs(doorPositions) do
    local aLeft = math.floor(doorX - alcoveW / 2)
    local aTop  = FLOOR_Y - alcoveH

    -- Deep recess: slightly lighter inner wall to show depth
    for y = aTop, aTop + alcoveH - 1 do
        local ratio = (y - aTop) / alcoveH
        local innerC = lerpColor(Color(10, 18, 30), Color(18, 30, 48), ratio)
        hline(math.max(0, aLeft), math.min(W - 1, aLeft + alcoveW - 1), y, innerC)
    end

    -- Outer frame bevels (3D look)
    -- Top: lit from above (bright)
    for i = 0, 2 do
        local brightness = 1 - i * 0.3
        local tc = blendColor(C.DARK_GREY, C.LIGHT_GREY, brightness * 0.5)
        hline(aLeft - i, aLeft + alcoveW - 1 + i, aTop - 3 + i, tc)
    end

    -- Left bevel: slightly lit
    for i = 0, 2 do
        local lc = blendColor(C.DARK_GREY, C.LIGHT_GREY, (1 - i * 0.35) * 0.3)
        vline(aLeft - 3 + i, aTop - 3, aTop + alcoveH + 2, lc)
    end

    -- Right bevel: deep shadow
    for i = 0, 2 do
        local rc = blendColor(C.BLACK, C.DEEP_NAVY, i * 0.3)
        vline(aLeft + alcoveW + i, aTop - 3, aTop + alcoveH + 2, rc)
    end

    -- Bottom: shadow
    for i = 0, 1 do
        hline(aLeft, aLeft + alcoveW - 1, aTop + alcoveH + i, C.BLACK)
    end

    -- Inner edge highlights (1px bright line at top-inside of alcove)
    hline(aLeft + 1, aLeft + alcoveW - 2, aTop, blendColor(C.MED_BLUE, C.BRIGHT_BLUE, 0.3))

    -- Door threshold: metal strip at bottom
    fillRect(aLeft + 2, aTop + alcoveH - 4, alcoveW - 4, 4, C.DARK_GREY)
    hline(aLeft + 2, aLeft + alcoveW - 3, aTop + alcoveH - 4, C.LIGHT_GREY)
    hline(aLeft + 2, aLeft + alcoveW - 3, aTop + alcoveH - 1, C.DEEP_NAVY)
    -- Threshold bolts
    for bx = aLeft + 10, aLeft + alcoveW - 10, 20 do
        fillRect(bx, aTop + alcoveH - 3, 2, 2, C.LIGHT_GREY)
    end

    -- Small status light above door (color-coded per act)
    local actColors = {C.PINK, C.CYAN, C.GREEN, C.ORANGE}
    local statusColor = actColors[di] or C.BRIGHT_BLUE
    fillRect(doorX - 3, aTop - 8, 6, 4, C.DARK_GREY)
    fillRect(doorX - 2, aTop - 7, 4, 2, statusColor)
    -- Glow dot
    fillRect(doorX - 1, aTop - 7, 2, 1, C.WHITE)

    -- Small vent slits inside each alcove (above door area)
    for vy = aTop + 6, aTop + 18, 4 do
        hline(aLeft + 6, aLeft + 20, vy, C.BLACK)
        hline(aLeft + 6, aLeft + 20, vy + 1, blendColor(C.DEEP_NAVY, C.BLACK, 0.5))
    end
end

print("[v2] Drawing porthole...")

-- ============================================================
-- 4. PORTHOLE - between doors 2 and 3, stormy sea view
-- ============================================================

local portX = math.floor(W * 0.5)
local portY = math.floor(WALL_TOP + WALL_H * 0.28)
local portR = 32

-- Outer metal ring with rivets
fillCircle(portX, portY, portR + 10, C.DARK_GREY)
fillCircle(portX, portY, portR + 7,  C.BROWN)
fillCircle(portX, portY, portR + 4,  C.DARK_GREY)

-- Frame highlight arc (top half brighter)
for a = 0, 180 do
    local rad = math.rad(a - 90)
    local px = math.floor(portX + math.cos(rad) * (portR + 7))
    local py = math.floor(portY + math.sin(rad) * (portR + 7))
    if px >= 0 and px < W and py >= 0 and py < H then
        img:drawPixel(px, py, C.LIGHT_GREY)
    end
end

-- Sky through porthole (dark, stormy)
fillCircle(portX, portY, portR, C.DEEP_NAVY)

-- Storm clouds (layered)
fillCircle(portX - 12, portY - 14, 14, C.DARK_BLUE)
fillCircle(portX + 10, portY - 10, 11, C.DARK_BLUE)
fillCircle(portX - 2,  portY - 8,  9,  blendColor(C.DARK_BLUE, C.MED_BLUE, 0.2))

-- Lightning flash (small zigzag)
local lx = portX + 5
local ly = portY - 12
for step = 0, 3 do
    local nx = lx + (step % 2 == 0 and 2 or -1)
    local ny = ly + 3
    if nx >= 0 and nx < W and ny >= 0 and ny < H then
        img:drawPixel(lx, ly, C.YELLOW)
        img:drawPixel(nx, ny, C.YELLOW)
    end
    lx = nx
    ly = ny
end

-- Ocean in bottom half
for py = portY + 2, portY + portR do
    for px = portX - portR, portX + portR do
        if (px - portX)^2 + (py - portY)^2 <= portR^2 then
            if px >= 0 and px < W and py >= 0 and py < H then
                local waveOff = math.sin(px * 0.12) * 2
                if py > portY + 4 + waveOff then
                    img:drawPixel(px, py, C.DARK_BLUE)
                else
                    img:drawPixel(px, py, C.MED_BLUE)
                end
            end
        end
    end
end

-- Wave crest highlights
for px = portX - 18, portX + 18 do
    if px >= 0 and px < W then
        local wy = portY + 4 + math.floor(math.sin(px * 0.12) * 2)
        if wy >= 0 and wy < H then
            img:drawPixel(px, wy, C.CYAN)
        end
    end
end

-- Bolts around frame (10 evenly spaced)
for a = 0, 9 do
    local angle = (a / 10) * math.pi * 2
    local bx = math.floor(portX + math.cos(angle) * (portR + 6))
    local by = math.floor(portY + math.sin(angle) * (portR + 6))
    if bx >= 1 and bx < W - 2 and by >= 1 and by < H - 2 then
        fillRect(bx, by, 3, 3, C.LIGHT_GREY)
        fillRect(bx + 1, by + 1, 1, 1, C.WHITE)  -- highlight
    end
end

-- Glass reflection (subtle arc)
for a = 200, 260 do
    local rad = math.rad(a)
    local rx = math.floor(portX + math.cos(rad) * (portR - 6))
    local ry = math.floor(portY + math.sin(rad) * (portR - 6))
    if rx >= 0 and rx < W and ry >= 0 and ry < H then
        img:drawPixel(rx, ry, blendColor(C.DEEP_NAVY, C.WHITE, 0.12))
    end
end

print("[v2] Drawing wall details...")

-- ============================================================
-- 5. WALL DETAILS - notice board, fire extinguisher, panels
-- ============================================================

-- Notice board (shifted left of porthole, between door 1 and 2)
local nbX = math.floor(W * 0.30)
local nbY = math.floor(WALL_TOP + WALL_H * 0.40)
local nbW, nbH = 72, 48

-- Cork board base
fillRect(nbX - nbW / 2, nbY - nbH / 2, nbW, nbH, C.BROWN)
-- Metal frame (2px)
for i = 0, 1 do
    hline(math.floor(nbX - nbW / 2 - i), math.floor(nbX + nbW / 2 + i - 1), math.floor(nbY - nbH / 2 - i), C.DARK_GREY)
    hline(math.floor(nbX - nbW / 2 - i), math.floor(nbX + nbW / 2 + i - 1), math.floor(nbY + nbH / 2 + i - 1), C.DARK_GREY)
    vline(math.floor(nbX - nbW / 2 - i), math.floor(nbY - nbH / 2 - i), math.floor(nbY + nbH / 2 + i - 1), C.DARK_GREY)
    vline(math.floor(nbX + nbW / 2 + i - 1), math.floor(nbY - nbH / 2 - i), math.floor(nbY + nbH / 2 + i - 1), C.DARK_GREY)
end
-- Frame highlight (top/left)
hline(math.floor(nbX - nbW / 2 - 1), math.floor(nbX + nbW / 2), math.floor(nbY - nbH / 2 - 2), C.LIGHT_GREY)
vline(math.floor(nbX - nbW / 2 - 2), math.floor(nbY - nbH / 2 - 1), math.floor(nbY + nbH / 2), C.LIGHT_GREY)

-- Pinned notes
fillRect(nbX - 24, nbY - 10, 18, 14, C.YELLOW)
fillRect(nbX - 23, nbY - 9, 16, 12, blendColor(C.YELLOW, C.WHITE, 0.15))
fillCircle(nbX - 14, nbY - 10, 2, C.RED)          -- pin

fillRect(nbX + 6, nbY - 6, 20, 16, C.WHITE)
fillRect(nbX + 7, nbY - 5, 18, 14, blendColor(C.WHITE, C.LIGHT_GREY, 0.2))
fillCircle(nbX + 16, nbY - 6, 2, C.RED)            -- pin

fillRect(nbX - 8, nbY + 6, 14, 10, C.BRIGHT_BLUE)
fillCircle(nbX - 1, nbY + 6, 2, C.ORANGE)          -- pin

-- Fire extinguisher (right of porthole, between door 3 and 4)
local feX = math.floor(W * 0.71)
local feY = math.floor(FLOOR_Y - 50)
-- Bracket
fillRect(feX - 3, feY - 24, 6, 4, C.DARK_GREY)
hline(feX - 3, feX + 2, feY - 24, C.LIGHT_GREY)
-- Body
fillRect(feX - 6, feY - 20, 12, 36, C.RED)
-- Highlight stripe
fillRect(feX - 5, feY - 18, 2, 32, blendColor(C.RED, C.WHITE, 0.2))
-- Handle
fillRect(feX - 3, feY - 22, 6, 3, C.DARK_GREY)
fillRect(feX + 2, feY - 26, 4, 6, C.DARK_GREY)
-- Label band
fillRect(feX - 5, feY - 4, 10, 6, C.WHITE)
-- Nozzle
fillRect(feX - 2, feY + 16, 4, 4, C.DARK_GREY)

-- Emergency panel (left wall near door 1)
local epX = math.floor(W * 0.07)
local epY = math.floor(WALL_TOP + WALL_H * 0.55)
fillRect(epX, epY, 36, 28, C.DARK_BLUE)
fillRect(epX + 1, epY + 1, 34, 26, blendColor(C.DARK_BLUE, C.BLACK, 0.3))
-- Frame
hline(epX, epX + 35, epY, C.DARK_GREY)
hline(epX, epX + 35, epY + 27, C.DARK_GREY)
vline(epX, epY, epY + 27, C.DARK_GREY)
vline(epX + 35, epY, epY + 27, C.DARK_GREY)
-- Indicator lights
fillRect(epX + 6,  epY + 8,  4, 4, C.GREEN)
fillRect(epX + 15, epY + 8,  4, 4, C.GREEN)
fillRect(epX + 24, epY + 8,  4, 4, C.YELLOW)
-- Small button
fillRect(epX + 10, epY + 18, 16, 6, C.RED)
fillRect(epX + 11, epY + 19, 14, 4, blendColor(C.RED, C.WHITE, 0.15))

-- Deck number stencil (right wall)
local dnX = math.floor(W * 0.91)
local dnY = math.floor(WALL_TOP + WALL_H * 0.35)
-- "D2" in blocky pixel letters
-- D
fillRect(dnX, dnY, 2, 14, C.MED_BLUE)
fillRect(dnX + 2, dnY, 6, 2, C.MED_BLUE)
fillRect(dnX + 2, dnY + 12, 6, 2, C.MED_BLUE)
fillRect(dnX + 8, dnY + 2, 2, 10, C.MED_BLUE)
-- 2
fillRect(dnX + 14, dnY, 8, 2, C.MED_BLUE)
fillRect(dnX + 20, dnY + 2, 2, 4, C.MED_BLUE)
fillRect(dnX + 14, dnY + 6, 8, 2, C.MED_BLUE)
fillRect(dnX + 14, dnY + 8, 2, 4, C.MED_BLUE)
fillRect(dnX + 14, dnY + 12, 8, 2, C.MED_BLUE)

print("[v2] Drawing light fixtures...")

-- ============================================================
-- 6. CEILING LIGHTS - industrial fluorescent fixtures
-- ============================================================

for li, lx in ipairs(doorPositions) do
    -- Mounting bracket (wider, more industrial)
    fillRect(lx - 20, CEILING_H - 5, 40, 7, C.DARK_GREY)
    hline(lx - 20, lx + 19, CEILING_H - 5, C.LIGHT_GREY)
    hline(lx - 20, lx + 19, CEILING_H - 4, blendColor(C.LIGHT_GREY, C.DARK_GREY, 0.5))
    -- Bracket bolts
    fillRect(lx - 17, CEILING_H - 3, 2, 2, C.LIGHT_GREY)
    fillRect(lx + 15, CEILING_H - 3, 2, 2, C.LIGHT_GREY)

    -- Housing (metal shell)
    fillRect(lx - 16, CEILING_H + 2, 32, 8, C.DARK_GREY)
    hline(lx - 16, lx + 15, CEILING_H + 2, C.LIGHT_GREY)

    -- Bulb (warm white glow)
    fillRect(lx - 12, CEILING_H + 4, 24, 4, blendColor(C.DEEP_NAVY, C.WHITE, 0.35))
    fillRect(lx - 10, CEILING_H + 5, 20, 2, blendColor(C.DEEP_NAVY, C.WHITE, 0.5))

    -- Light cone on wall (widening downward, subtle)
    local coneTop = CEILING_H + 10
    local coneBot = FLOOR_Y - 5
    local coneH = coneBot - coneTop
    for s = 0, 12 do
        local ratio = s / 12
        local cy = math.floor(coneTop + ratio * coneH)
        local halfW = math.floor(12 + ratio * 65)
        local alpha = 0.04 * (1 - ratio * 0.6)
        local sliceH = math.floor(coneH / 12) + 1
        for py = cy, math.min(cy + sliceH - 1, FLOOR_Y - 1) do
            local wallRatio = (py - WALL_TOP) / WALL_H
            local baseC = lerpColor(wallTopC, wallBotC, wallRatio)
            local litC = blendColor(baseC, C.WHITE, alpha)
            for px = math.max(0, lx - halfW), math.min(W - 1, lx + halfW - 1) do
                local distRatio = math.abs(px - lx) / halfW
                if distRatio < 1 then
                    local pxAlpha = alpha * (1 - distRatio * distRatio)
                    if pxAlpha > 0.005 then
                        local finalC = blendColor(baseC, C.WHITE, pxAlpha)
                        img:drawPixel(px, py, finalC)
                    end
                end
            end
        end
    end
end

-- Also add two between-door ambient wall sconces
local sconcePositions = {
    math.floor((doorPositions[1] + doorPositions[2]) / 2),
    math.floor((doorPositions[3] + doorPositions[4]) / 2)
}
for _, sx in ipairs(sconcePositions) do
    local sy = math.floor(WALL_TOP + WALL_H * 0.18)
    -- Bracket
    fillRect(sx - 4, sy - 2, 8, 4, C.DARK_GREY)
    hline(sx - 4, sx + 3, sy - 2, C.LIGHT_GREY)
    -- Small orange light
    fillRect(sx - 2, sy + 2, 4, 3, C.ORANGE)
    fillRect(sx - 1, sy + 2, 2, 2, C.YELLOW)
    -- Tiny downward glow
    for gy = 1, 20 do
        local ga = 0.06 * (1 - gy / 20)
        local hw = math.floor(2 + gy * 0.5)
        for px = math.max(0, sx - hw), math.min(W - 1, sx + hw) do
            local wallRatio = (sy + 5 + gy - WALL_TOP) / WALL_H
            if wallRatio >= 0 and wallRatio <= 1 then
                local baseC = lerpColor(wallTopC, wallBotC, wallRatio)
                img:drawPixel(px, sy + 5 + gy, blendColor(baseC, C.ORANGE, ga))
            end
        end
    end
end

print("[v2] Drawing floor...")

-- ============================================================
-- 7. FLOOR - metal grating, industrial panels, reflections
-- ============================================================

local floorH = H - FLOOR_Y
local floorTopC = Color(50, 55, 65)
local floorBotC = Color(20, 24, 32)

-- Base gradient
for y = FLOOR_Y, H - 1 do
    local ratio = (y - FLOOR_Y) / floorH
    local c = lerpColor(floorTopC, floorBotC, ratio)
    hline(0, W - 1, y, c)
end

-- Baseboard / wall-floor trim (heavy metal strip)
fillRect(0, FLOOR_Y, W, 5, C.DARK_GREY)
hline(0, W - 1, FLOOR_Y, C.LIGHT_GREY)
hline(0, W - 1, FLOOR_Y + 1, blendColor(C.LIGHT_GREY, C.DARK_GREY, 0.5))
hline(0, W - 1, FLOOR_Y + 4, C.DEEP_NAVY)
-- Bright accent line above baseboard
hline(0, W - 1, FLOOR_Y - 1, blendColor(C.MED_BLUE, C.BRIGHT_BLUE, 0.25))

-- Floor panels: wider rectangles with visible gap lines
local panelW = 64
local panelH = 32
for fx = 0, W - 1, panelW do
    for fy = FLOOR_Y + 5, H - 1, panelH do
        local checker = ((math.floor(fx / panelW) + math.floor((fy - FLOOR_Y) / panelH)) % 2 == 0)
        local baseC = lerpColor(floorTopC, floorBotC, (fy - FLOOR_Y) / floorH)
        if checker then
            -- Lighter panel
            local tileC = blendColor(baseC, C.WHITE, 0.05)
            fillRect(fx + 1, fy + 1, panelW - 2, panelH - 2, tileC)
        end
        -- Panel gap lines (dark grid)
        local gapC = blendColor(baseC, C.BLACK, 0.4)
        hline(fx, math.min(W - 1, fx + panelW - 1), fy, gapC)
        if fx > 0 then
            vline(fx, math.max(FLOOR_Y + 5, fy), math.min(H - 1, fy + panelH - 1), gapC)
        end
    end
end

-- Diamond-plate texture (small dithered crosses on every other panel)
for fx = 0, W - 1, panelW do
    for fy = FLOOR_Y + 5, H - 1, panelH do
        local checker = ((math.floor(fx / panelW) + math.floor((fy - FLOOR_Y) / panelH)) % 2 == 1)
        if checker then
            -- Subtle diamond pattern
            for dx = fx + 6, math.min(W - 2, fx + panelW - 6), 8 do
                for dy = fy + 4, math.min(H - 2, fy + panelH - 4), 8 do
                    local baseC = lerpColor(floorTopC, floorBotC, (dy - FLOOR_Y) / floorH)
                    img:drawPixel(dx, dy, blendColor(baseC, C.LIGHT_GREY, 0.08))
                    if dx + 1 < W then
                        img:drawPixel(dx + 1, dy, blendColor(baseC, C.LIGHT_GREY, 0.04))
                    end
                end
            end
        end
    end
end

-- Floor bolts at panel corners
for fx = panelW, W - 1, panelW do
    for fy = FLOOR_Y + 5 + panelH, H - 1, panelH do
        local baseC = lerpColor(floorTopC, floorBotC, (fy - FLOOR_Y) / floorH)
        local boltC = blendColor(baseC, C.LIGHT_GREY, 0.2)
        if fx >= 1 and fx < W - 1 and fy >= 1 and fy < H - 1 then
            fillRect(fx - 1, fy - 1, 3, 3, boltC)
            img:drawPixel(fx, fy, blendColor(boltC, C.WHITE, 0.25))
        end
    end
end

-- Drainage grate (right side)
local grateX = math.floor(W * 0.74)
local grateY = FLOOR_Y + 22
local grateW, grateH = 56, 28
fillRect(grateX, grateY, grateW, grateH, C.BLACK)
-- Grate slats
for sx = grateX + 4, grateX + grateW - 4, 7 do
    fillRect(sx, grateY + 3, 3, grateH - 6, C.DEEP_NAVY)
    fillRect(sx + 1, grateY + 3, 1, grateH - 6, blendColor(C.DEEP_NAVY, C.DARK_GREY, 0.3))
end
-- Cross bars
hline(grateX + 2, grateX + grateW - 3, grateY + math.floor(grateH / 3), C.DARK_GREY)
hline(grateX + 2, grateX + grateW - 3, grateY + math.floor(grateH * 2 / 3), C.DARK_GREY)
-- Frame
hline(grateX, grateX + grateW - 1, grateY, C.DARK_GREY)
hline(grateX, grateX + grateW - 1, grateY + grateH - 1, C.DARK_GREY)
vline(grateX, grateY, grateY + grateH - 1, C.DARK_GREY)
vline(grateX + grateW - 1, grateY, grateY + grateH - 1, C.DARK_GREY)
-- Frame highlights
hline(grateX, grateX + grateW - 1, grateY, C.LIGHT_GREY)

-- Floor caution stripe (near a grate or emergency area)
local csX = math.floor(W * 0.73)
local csY = FLOOR_Y + 6
for sx = csX, csX + 60, 8 do
    fillRect(sx, csY, 4, 3, C.YELLOW)
end

-- Light reflections on floor (pools of light under fixtures)
for _, lx in ipairs(doorPositions) do
    local reflW = 50
    for fy = FLOOR_Y + 6, math.min(H - 1, FLOOR_Y + 40) do
        local yRatio = (fy - FLOOR_Y - 6) / 34
        local fadeAlpha = 0.04 * (1 - yRatio)
        local hw = math.floor(reflW * (1 - yRatio * 0.3))
        for px = math.max(0, lx - hw), math.min(W - 1, lx + hw) do
            local xDist = math.abs(px - lx) / hw
            local alpha = fadeAlpha * (1 - xDist * xDist)
            if alpha > 0.002 then
                local baseC = lerpColor(floorTopC, floorBotC, (fy - FLOOR_Y) / floorH)
                -- Check checker
                local checker = ((math.floor(px / panelW) + math.floor((fy - FLOOR_Y) / panelH)) % 2 == 0)
                if checker then baseC = blendColor(baseC, C.WHITE, 0.05) end
                img:drawPixel(px, fy, blendColor(baseC, C.BRIGHT_BLUE, alpha))
            end
        end
    end
end

print("[v2] Drawing ambient effects...")

-- ============================================================
-- 8. AMBIENT EFFECTS - subtle haze, edge vignette
-- ============================================================

-- Left edge shadow
for px = 0, 30 do
    local alpha = 0.15 * (1 - px / 30)
    for py = WALL_TOP, H - 1 do
        local existing = img:getPixel(px, py)
        local r = app.pixelColor.rgbaR(existing)
        local g = app.pixelColor.rgbaG(existing)
        local b = app.pixelColor.rgbaB(existing)
        local baseC = Color(r, g, b)
        img:drawPixel(px, py, blendColor(baseC, C.BLACK, alpha))
    end
end

-- Right edge shadow
for px = W - 31, W - 1 do
    local alpha = 0.15 * ((px - (W - 31)) / 30)
    for py = WALL_TOP, H - 1 do
        local existing = img:getPixel(px, py)
        local r = app.pixelColor.rgbaR(existing)
        local g = app.pixelColor.rgbaG(existing)
        local b = app.pixelColor.rgbaB(existing)
        local baseC = Color(r, g, b)
        img:drawPixel(px, py, blendColor(baseC, C.BLACK, alpha))
    end
end

-- Bottom floor edge darkening
for py = H - 20, H - 1 do
    local alpha = 0.12 * ((py - (H - 20)) / 20)
    for px = 0, W - 1 do
        local existing = img:getPixel(px, py)
        local r = app.pixelColor.rgbaR(existing)
        local g = app.pixelColor.rgbaG(existing)
        local b = app.pixelColor.rgbaB(existing)
        local baseC = Color(r, g, b)
        img:drawPixel(px, py, blendColor(baseC, C.BLACK, alpha))
    end
end

print("[v2] Saving...")

-- ============================================================
-- EXPORT
-- ============================================================

spr:saveCopyAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\corridor_bg.png")

print("[v2] Done! Saved to assets/backgrounds/corridor_bg.png")
print("The ShipHubScene will automatically use it (checks textures.exists('bg_corridor'))")

spr:close()
