-- Generate Research Room: 1990s University Geology Professor's Office
-- 960x540, PICO-8 palette only
-- Run: Aseprite.exe -b --script tools/generate_research_room.lua

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
    PINK       = Color(255, 119, 168),
    BLACK      = Color(0, 0, 0),
}

local spr = Sprite(W, H, ColorMode.RGB)
spr.filename = "bg_research.png"
local img = spr.cels[1].image

-- Helpers
local function fillRect(x1, y1, w, h, color)
    for py = math.max(0, y1), math.min(H-1, y1+h-1) do
        for px = math.max(0, x1), math.min(W-1, x1+w-1) do img:drawPixel(px, py, color) end
    end
end
local function hline(x1, x2, y, color)
    if y<0 or y>=H then return end
    for px = math.max(0,x1), math.min(W-1,x2) do img:drawPixel(px, y, color) end
end
local function vline(x, y1, y2, color)
    if x<0 or x>=W then return end
    for py = math.max(0,y1), math.min(H-1,y2) do img:drawPixel(x, py, color) end
end
local function fillCircle(cx, cy, r, color)
    for py=cy-r,cy+r do for px=cx-r,cx+r do
        if (px-cx)^2+(py-cy)^2 <= r^2 and px>=0 and px<W and py>=0 and py<H then
            img:drawPixel(px, py, color)
        end
    end end
end
local function strokeCircle(cx, cy, r, color, th)
    th = th or 1
    local ro2, ri2 = r*r, (r-th)*(r-th)
    for py=cy-r-1,cy+r+1 do for px=cx-r-1,cx+r+1 do
        local d2 = (px-cx)^2+(py-cy)^2
        if d2<=ro2 and d2>=ri2 and px>=0 and px<W and py>=0 and py<H then
            img:drawPixel(px, py, color)
        end
    end end
end
local function lerpColor(c1, c2, t)
    t = math.max(0, math.min(1, t))
    return Color(math.floor(c1.red+(c2.red-c1.red)*t), math.floor(c1.green+(c2.green-c1.green)*t), math.floor(c1.blue+(c2.blue-c1.blue)*t))
end
local function blendColor(b, o, a)
    return Color(math.floor(b.red+(o.red-b.red)*a), math.floor(b.green+(o.green-b.green)*a), math.floor(b.blue+(o.blue-b.blue)*a))
end
local function px(x,y,c)
    if x>=0 and x<W and y>=0 and y<H then img:drawPixel(x,y,c) end
end
local function rd(x,y)
    local p = img:getPixel(x,y)
    return Color(app.pixelColor.rgbaR(p), app.pixelColor.rgbaG(p), app.pixelColor.rgbaB(p))
end

math.randomseed(42)

local FLOOR_Y = 400
local CEIL_H = 30

print("Floor: wooden planks...")

-- ==========================================
-- FLOOR — warm wooden planks, horizontal grain every 12px
-- ==========================================
for y = FLOOR_Y, H-1 do
    local t = (y - FLOOR_Y) / (H - FLOOR_Y)
    local c = lerpColor(C.BROWN, lerpColor(C.BROWN, C.DARK_GREY, 0.2), t * 0.4)
    hline(0, W-1, y, c)
end
for gy = FLOOR_Y, H-1, 12 do
    hline(0, W-1, gy, blendColor(C.BROWN, C.DARK_GREY, 0.35))
end
-- Subtle vertical joins
for gx = 0, W-1, 48 do
    for gy = FLOOR_Y, H-1 do
        px(gx, gy, blendColor(rd(gx,gy), C.DARK_GREY, 0.12))
    end
end

print("Ceiling: dark with Edison bulbs...")

-- ==========================================
-- CEILING — dark, 4 hanging bulbs
-- ==========================================
fillRect(0, 0, W, CEIL_H, C.DEEP_NAVY)
-- Ceiling trim
hline(0, W-1, CEIL_H-1, blendColor(C.DEEP_NAVY, C.DARK_GREY, 0.3))
hline(0, W-1, CEIL_H-2, blendColor(C.DEEP_NAVY, C.DARK_GREY, 0.15))

local bulbs = {160, 360, 600, 800}
for _, bx in ipairs(bulbs) do
    -- Wire
    vline(bx, 0, CEIL_H+8, C.DARK_GREY)
    -- Socket
    fillRect(bx-2, CEIL_H+6, 5, 3, C.DARK_GREY)
    -- Bulb glass
    fillRect(bx-3, CEIL_H+9, 7, 8, C.YELLOW)
    fillRect(bx-2, CEIL_H+9, 5, 6, blendColor(C.YELLOW, C.WHITE, 0.3))
    px(bx, CEIL_H+9, C.WHITE) -- filament
    -- Large warm glow halo (r=35, alpha 0.2 peak)
    for dy = -40, 60 do
        for dx = -40, 40 do
            local d = math.sqrt(dx*dx + dy*dy)
            if d < 38 then
                local alpha = (1 - d/38) * 0.2
                local gx, gy = bx+dx, CEIL_H+12+dy
                if gx>=0 and gx<W and gy>=0 and gy<H then
                    px(gx, gy, blendColor(rd(gx,gy), C.YELLOW, alpha * 0.5))
                    px(gx, gy, blendColor(rd(gx,gy), C.ORANGE, alpha * 0.5))
                end
            end
        end
    end
end

print("Back wall: dark green chalkboard...")

-- ==========================================
-- BACK WALL — dark green like a chalkboard
-- ==========================================
local WALL_GREEN = Color(26, 46, 26)
for y = CEIL_H, FLOOR_Y-1 do
    local t = (y - CEIL_H) / (FLOOR_Y - CEIL_H)
    local c = lerpColor(WALL_GREEN, Color(20, 38, 20), t)
    hline(200, 760, y, c)
end
-- Chalkboard texture: faint dust
for i = 1, 200 do
    local rx = 210 + math.random(0, 540)
    local ry = CEIL_H + 5 + math.random(0, FLOOR_Y - CEIL_H - 10)
    px(rx, ry, blendColor(rd(rx,ry), C.WHITE, 0.015))
end

-- LEFT side wall (behind bookshelf)
for y = CEIL_H, FLOOR_Y-1 do
    hline(0, 199, y, lerpColor(Color(22, 38, 22), Color(18, 32, 18), (y-CEIL_H)/(FLOOR_Y-CEIL_H)))
end
-- RIGHT side wall
for y = CEIL_H, FLOOR_Y-1 do
    hline(761, W-1, y, lerpColor(Color(22, 38, 22), Color(18, 32, 18), (y-CEIL_H)/(FLOOR_Y-CEIL_H)))
end

print("Aquarium: the centerpiece...")

-- ==========================================
-- AQUARIUM — built into back wall
-- ==========================================
local AQ_X, AQ_Y, AQ_W, AQ_H = 250, 45, 460, 260
local AQ_FRAME = 6

-- Metal frame (#5f574f, 6px)
fillRect(AQ_X - AQ_FRAME, AQ_Y - AQ_FRAME, AQ_W + AQ_FRAME*2, AQ_H + AQ_FRAME*2, C.DARK_GREY)
-- Frame highlights
hline(AQ_X - AQ_FRAME, AQ_X + AQ_W + AQ_FRAME - 1, AQ_Y - AQ_FRAME, C.LIGHT_GREY)
vline(AQ_X - AQ_FRAME, AQ_Y - AQ_FRAME, AQ_Y + AQ_H + AQ_FRAME - 1, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.2))
-- Frame shadow
hline(AQ_X - AQ_FRAME, AQ_X + AQ_W + AQ_FRAME - 1, AQ_Y + AQ_H + AQ_FRAME - 1, blendColor(C.DARK_GREY, C.BLACK, 0.3))
vline(AQ_X + AQ_W + AQ_FRAME - 1, AQ_Y - AQ_FRAME, AQ_Y + AQ_H + AQ_FRAME - 1, blendColor(C.DARK_GREY, C.BLACK, 0.2))

-- Corner bolts
local boltPos = {
    {AQ_X - AQ_FRAME + 1, AQ_Y - AQ_FRAME + 1},
    {AQ_X + AQ_W + AQ_FRAME - 4, AQ_Y - AQ_FRAME + 1},
    {AQ_X - AQ_FRAME + 1, AQ_Y + AQ_H + AQ_FRAME - 4},
    {AQ_X + AQ_W + AQ_FRAME - 4, AQ_Y + AQ_H + AQ_FRAME - 4}
}
for _, bp in ipairs(boltPos) do
    fillRect(bp[1], bp[2], 3, 3, C.LIGHT_GREY)
    px(bp[1]+2, bp[2]+2, blendColor(C.LIGHT_GREY, C.BLACK, 0.3))
end

-- WATER: gradient top to bottom
for y = AQ_Y, AQ_Y + AQ_H - 1 do
    local t = (y - AQ_Y) / AQ_H
    local waterC = lerpColor(C.DARK_BLUE, C.DEEP_NAVY, t)
    hline(AQ_X, AQ_X + AQ_W - 1, y, waterC)
end

-- AQUARIUM LIGHT: bright white strip at very top of tank
for x = AQ_X + 4, AQ_X + AQ_W - 5 do
    px(x, AQ_Y, blendColor(C.DARK_BLUE, C.WHITE, 0.35))
    px(x, AQ_Y + 1, blendColor(C.DARK_BLUE, C.WHITE, 0.2))
    px(x, AQ_Y + 2, blendColor(C.DARK_BLUE, C.CYAN, 0.12))
end
-- Light rays going down
for ri = 1, 8 do
    local rx = AQ_X + 30 + ri * 50
    for ry = AQ_Y + 3, AQ_Y + AQ_H - 20 do
        local wobble = math.floor(math.sin(ry * 0.05 + ri) * 2)
        local alpha = 0.06 * (1 - (ry - AQ_Y) / AQ_H)
        if rx + wobble >= AQ_X and rx + wobble < AQ_X + AQ_W then
            px(rx + wobble, ry, blendColor(rd(rx+wobble, ry), C.CYAN, alpha))
        end
    end
end

-- SEAWEED (5 clumps from bottom)
local seaweedX = {AQ_X + 30, AQ_X + 120, AQ_X + 230, AQ_X + 340, AQ_X + 420}
for _, sx in ipairs(seaweedX) do
    local sheight = 40 + math.random(0, 50)
    local baseY = AQ_Y + AQ_H - 5
    for dy = 0, sheight do
        local wobble = math.floor(math.sin(dy * 0.1 + sx * 0.01) * (3 + dy * 0.03))
        local green = blendColor(C.GREEN, C.DEEP_NAVY, 0.4 + dy * 0.004)
        px(sx + wobble, baseY - dy, green)
        px(sx + wobble + 1, baseY - dy, green)
        -- Second frond
        if dy > 10 then
            local w2 = math.floor(math.sin(dy * 0.12 + 2) * (2 + dy * 0.02))
            px(sx + 4 + w2, baseY - dy + 5, green)
        end
    end
end

-- SAND at bottom
for y = AQ_Y + AQ_H - 8, AQ_Y + AQ_H - 1 do
    local t = (y - (AQ_Y + AQ_H - 8)) / 8
    local sandC = lerpColor(C.DARK_BLUE, C.BROWN, 0.15 + t * 0.12)
    hline(AQ_X, AQ_X + AQ_W - 1, y, sandC)
end
-- Small rocks on sand
for ri = 1, 12 do
    local rx = AQ_X + 10 + math.random(0, AQ_W - 20)
    local ry = AQ_Y + AQ_H - 6 + math.random(0, 3)
    fillRect(rx, ry, 3 + math.random(0,2), 2, blendColor(C.DARK_BLUE, C.DARK_GREY, 0.2))
end

-- FISH (6 fish, varied sizes and heights)
local fishList = {
    {x=AQ_X+60,  y=AQ_Y+50,  dir=1,  sz=10, color=C.ORANGE},
    {x=AQ_X+180, y=AQ_Y+100, dir=-1, sz=8,  color=C.RED},
    {x=AQ_X+300, y=AQ_Y+70,  dir=1,  sz=12, color=C.YELLOW},
    {x=AQ_X+100, y=AQ_Y+150, dir=-1, sz=7,  color=C.PINK},
    {x=AQ_X+380, y=AQ_Y+130, dir=1,  sz=9,  color=C.CYAN},
    {x=AQ_X+250, y=AQ_Y+180, dir=-1, sz=11, color=C.ORANGE}
}
for _, f in ipairs(fishList) do
    local fx, fy, fd, fs, fc = f.x, f.y, f.dir, f.sz, f.color
    -- Darken fish color to look underwater
    local fishC = blendColor(fc, C.DARK_BLUE, 0.35)
    -- Body (ellipse)
    for dy = -math.floor(fs*0.35), math.floor(fs*0.35) do
        local hw = math.floor(fs * 0.5 * math.sqrt(math.max(0, 1 - (dy/(fs*0.4))^2)))
        for dx = -hw, hw do
            local fpx = fx + dx * fd
            if fpx >= AQ_X+1 and fpx < AQ_X+AQ_W-1 then
                px(fpx, fy + dy, fishC)
            end
        end
    end
    -- Tail (triangle)
    for dy = -math.floor(fs*0.3), math.floor(fs*0.3) do
        local tailX = fx - math.floor(fs*0.55) * fd
        px(tailX + math.abs(dy) * fd, fy + dy, fishC)
        px(tailX + (math.abs(dy)+1) * fd, fy + dy, fishC)
    end
    -- Eye
    local eyeX = fx + math.floor(fs * 0.25) * fd
    px(eyeX, fy - 1, blendColor(fishC, C.WHITE, 0.5))
end

-- BUBBLES (scattered, small cyan circles)
for bi = 1, 35 do
    local bx = AQ_X + 8 + math.random(0, AQ_W - 16)
    local by = AQ_Y + 8 + math.random(0, AQ_H - 30)
    local br = 1 + math.random(0, 2)
    strokeCircle(bx, by, br, blendColor(rd(bx,by), C.CYAN, 0.6), 1)
    if br >= 2 then
        px(bx - 1, by - 1, blendColor(rd(bx-1,by-1), C.WHITE, 0.2))
    end
end

-- Caustic wavy light lines
for ci = 1, 6 do
    local cy = AQ_Y + 15 + ci * 35
    for lx = AQ_X + 5, AQ_X + AQ_W - 6 do
        local ly = cy + math.floor(math.sin(lx * 0.04 + ci * 1.7) * 4)
        if ly >= AQ_Y + 3 and ly < AQ_Y + AQ_H - 8 then
            px(lx, ly, blendColor(rd(lx,ly), C.BRIGHT_BLUE, 0.18))
        end
    end
end

-- Aquarium glow on wall below
for y = AQ_Y + AQ_H + AQ_FRAME, AQ_Y + AQ_H + AQ_FRAME + 30 do
    local alpha = math.max(0, 0.04 - (y - AQ_Y - AQ_H - AQ_FRAME) * 0.0013)
    for x = AQ_X, AQ_X + AQ_W do
        if x >= 200 and x <= 760 and y < FLOOR_Y then
            px(x, y, blendColor(rd(x,y), C.CYAN, alpha))
        end
    end
end

print("Left side: bookshelf...")

-- ==========================================
-- BOOKSHELF (x:0-200, floor to ceiling)
-- ==========================================
local SH_L, SH_R = 4, 196
local SH_T, SH_B = CEIL_H + 2, FLOOR_Y - 2

-- Shelf back
fillRect(SH_L, SH_T, SH_R - SH_L, SH_B - SH_T, blendColor(C.BROWN, C.BLACK, 0.45))

-- Frame
vline(SH_L, SH_T, SH_B, blendColor(C.BROWN, C.LIGHT_GREY, 0.08))
vline(SH_R, SH_T, SH_B, blendColor(C.BROWN, C.BLACK, 0.25))
hline(SH_L, SH_R, SH_T, blendColor(C.BROWN, C.LIGHT_GREY, 0.1))

local ROWS = 7
local rowH = math.floor((SH_B - SH_T) / ROWS)
local bookPalette = {C.RED, C.ORANGE, C.YELLOW, C.GREEN, C.BRIGHT_BLUE, C.CYAN, C.INDIGO, C.PINK, C.BROWN, C.WHITE, C.LIGHT_GREY}

for row = 0, ROWS - 1 do
    local ry = SH_T + row * rowH

    -- Shelf plank
    fillRect(SH_L, ry + rowH - 4, SH_R - SH_L, 4, C.BROWN)
    hline(SH_L, SH_R, ry + rowH - 4, blendColor(C.BROWN, C.LIGHT_GREY, 0.06))
    hline(SH_L, SH_R, ry + rowH - 1, blendColor(C.BROWN, C.BLACK, 0.15))

    -- Books (packed tight, 8px wide each)
    local bx = SH_L + 3
    local bookBot = ry + rowH - 5
    local maxBookH = rowH - 8
    while bx + 8 < SH_R - 2 do
        local bw = 6 + math.random(0, 4) -- ~8px average
        local bh = maxBookH - math.random(0, 8)
        local bc = bookPalette[math.random(1, #bookPalette)]

        fillRect(bx, bookBot - bh, bw, bh, bc)
        -- Dark spine edge
        vline(bx, bookBot - bh, bookBot - 1, blendColor(bc, C.BLACK, 0.3))
        -- Light top
        hline(bx + 1, bx + bw - 1, bookBot - bh, blendColor(bc, C.WHITE, 0.08))
        -- Spine detail
        if bw >= 7 and bh > 15 then
            hline(bx + 1, bx + bw - 2, bookBot - bh + 4, blendColor(bc, C.WHITE, 0.12))
            hline(bx + 1, bx + bw - 2, bookBot - math.floor(bh * 0.3), blendColor(bc, C.BLACK, 0.08))
        end
        bx = bx + bw + 1
    end
end

-- Globe on bottom shelf
local gx, gy = SH_R - 25, SH_B - rowH + 20
fillCircle(gx, gy, 9, C.BRIGHT_BLUE)
fillCircle(gx - 3, gy - 2, 4, C.GREEN)
fillCircle(gx + 4, gy + 3, 3, C.GREEN)
strokeCircle(gx, gy, 9, C.DARK_GREY, 1)
-- Stand
fillRect(gx - 1, gy + 9, 3, 5, C.DARK_GREY)
fillRect(gx - 5, gy + 13, 11, 2, C.DARK_GREY)

print("Center desk with Earth porthole...")

-- ==========================================
-- CENTER DESK (x:350-610, y:350-450) + EARTH PORTHOLE
-- ==========================================
local DESK_L, DESK_T, DESK_W, DESK_H = 350, 350, 260, 50

-- Desk surface
fillRect(DESK_L, DESK_T, DESK_W, DESK_H, C.BROWN)
hline(DESK_L, DESK_L + DESK_W - 1, DESK_T, blendColor(C.BROWN, C.LIGHT_GREY, 0.1))
hline(DESK_L, DESK_L + DESK_W - 1, DESK_T + DESK_H - 1, blendColor(C.BROWN, C.BLACK, 0.2))
-- Desk legs
fillRect(DESK_L + 8, DESK_T + DESK_H, 8, FLOOR_Y - DESK_T - DESK_H, blendColor(C.BROWN, C.DARK_GREY, 0.2))
fillRect(DESK_L + DESK_W - 16, DESK_T + DESK_H, 8, FLOOR_Y - DESK_T - DESK_H, blendColor(C.BROWN, C.DARK_GREY, 0.2))
-- Desk front panel
fillRect(DESK_L + 20, DESK_T + DESK_H, DESK_W - 40, FLOOR_Y - DESK_T - DESK_H - 5, blendColor(C.BROWN, C.DARK_GREY, 0.08))

-- EARTH PORTHOLE on the wall between aquarium and desk (radius 50)
local PORT_X = DESK_L + math.floor(DESK_W / 2)
local PORT_Y = DESK_T - 40
local PORT_R = 38

-- Metal frame ring (thick)
strokeCircle(PORT_X, PORT_Y, PORT_R + 7, C.DARK_GREY, 8)
strokeCircle(PORT_X, PORT_Y, PORT_R + 7, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.08), 1)
-- 6 bolts
for bi = 0, 5 do
    local angle = (bi / 6) * math.pi * 2
    local bpx = math.floor(PORT_X + math.cos(angle) * (PORT_R + 5))
    local bpy = math.floor(PORT_Y + math.sin(angle) * (PORT_R + 5))
    fillRect(bpx - 2, bpy - 2, 4, 4, C.LIGHT_GREY)
    px(bpx - 2, bpy - 2, C.DARK_GREY)
end

-- Space (black)
fillCircle(PORT_X, PORT_Y, PORT_R - 1, C.BLACK)

-- Stars
for si = 1, 20 do
    local sx = PORT_X - PORT_R + 6 + math.random(0, PORT_R * 2 - 12)
    local sy = PORT_Y - PORT_R + 6 + math.random(0, PORT_R * 2 - 12)
    if (sx-PORT_X)^2 + (sy-PORT_Y)^2 < (PORT_R-5)^2 then
        px(sx, sy, C.WHITE)
    end
end

-- Earth (blue circle with green landmasses)
local ER = 22
local ECX, ECY = PORT_X - 3, PORT_Y + 2
fillCircle(ECX, ECY, ER, C.BRIGHT_BLUE)
-- Continents
fillCircle(ECX - 8, ECY - 6, 6, C.GREEN)
fillCircle(ECX + 5, ECY - 2, 5, C.GREEN)
fillCircle(ECX - 2, ECY + 9, 6, C.GREEN)
fillCircle(ECX + 10, ECY + 6, 4, C.GREEN)
fillCircle(ECX - 8, ECY + 4, 3, C.GREEN)
-- Ice cap
fillCircle(ECX, ECY - ER + 4, 6, blendColor(C.BRIGHT_BLUE, C.WHITE, 0.2))
-- Cloud wisps
for ci = 1, 15 do
    local ca = math.random(0, 359)
    local cr = math.random(6, ER - 5)
    local rad = math.rad(ca)
    local ccx = math.floor(ECX + math.cos(rad) * cr)
    local ccy = math.floor(ECY + math.sin(rad) * cr)
    if (ccx-ECX)^2 + (ccy-ECY)^2 < (ER-2)^2 then
        for di = -2, 2 do
            local wx = ccx + di
            local wy = ccy + math.floor(math.sin(di * 0.8 + ci) * 1)
            if (wx-ECX)^2 + (wy-ECY)^2 < (ER-1)^2 then
                px(wx, wy, blendColor(rd(wx,wy), C.WHITE, 0.3))
            end
        end
    end
end
-- Atmosphere
strokeCircle(ECX, ECY, ER + 1, blendColor(C.BLACK, C.CYAN, 0.18), 1)

-- Glass reflection
for ri = 0, 8 do
    local rx = PORT_X - PORT_R + 14 + ri
    local ry = PORT_Y - PORT_R + 14 + math.floor(ri * 0.3)
    if (rx-PORT_X)^2 + (ry-PORT_Y)^2 < (PORT_R-4)^2 then
        px(rx, ry, blendColor(rd(rx,ry), C.WHITE, 0.06))
    end
end

-- Papers on desk
fillRect(DESK_L + 15, DESK_T + 5, 16, 12, blendColor(C.WHITE, C.BROWN, 0.05))
for tl = 0, 3 do hline(DESK_L + 17, DESK_L + 28, DESK_T + 7 + tl * 3, C.DARK_GREY) end
fillRect(DESK_L + 35, DESK_T + 3, 12, 14, blendColor(C.WHITE, C.BROWN, 0.1))

-- Coffee mug on desk
fillRect(DESK_L + DESK_W - 25, DESK_T + 4, 8, 10, C.RED)
fillRect(DESK_L + DESK_W - 18, DESK_T + 6, 3, 6, C.RED)

print("Right side: CRT monitors + filing cabinet...")

-- ==========================================
-- RIGHT SIDE (x:760-960)
-- ==========================================
-- Desk
local RD_L, RD_T, RD_W = 770, 280, 180
local RD_H = FLOOR_Y - RD_T
fillRect(RD_L, RD_T, RD_W, RD_H, C.BROWN)
hline(RD_L, RD_L + RD_W - 1, RD_T, blendColor(C.BROWN, C.LIGHT_GREY, 0.08))

-- Filing cabinet underneath desk
fillRect(RD_L + 10, RD_T + 60, 50, RD_H - 65, C.DARK_GREY)
hline(RD_L + 10, RD_L + 59, RD_T + 60, C.LIGHT_GREY)
-- Drawer lines
for di = 0, 2 do
    local dy = RD_T + 75 + di * 30
    hline(RD_L + 12, RD_L + 57, dy, blendColor(C.DARK_GREY, C.BLACK, 0.2))
    fillRect(RD_L + 30, dy + 4, 10, 2, blendColor(C.DARK_GREY, C.LIGHT_GREY, 0.15))
end

-- CRT Monitor 1
local M1X, M1Y, MW, MH = RD_L + 15, RD_T - 58, 60, 52
fillRect(M1X, M1Y, MW, MH, C.DARK_GREY)
fillRect(M1X + 1, M1Y + 1, MW - 2, 2, C.LIGHT_GREY)
fillRect(M1X + 4, M1Y + 5, MW - 8, MH - 12, C.BLACK)
-- Green screen content
for sy = M1Y + 8, M1Y + MH - 10, 4 do
    local lw = 10 + math.random(0, MW - 25)
    hline(M1X + 6, M1X + 6 + lw, sy, blendColor(C.BLACK, C.GREEN, 0.4))
end
-- Stand
fillRect(M1X + 22, M1Y + MH, 16, 5, C.DARK_GREY)
fillRect(M1X + 17, M1Y + MH + 4, 26, 3, C.DARK_GREY)

-- CRT Monitor 2
local M2X, M2Y = RD_L + 90, RD_T - 52
fillRect(M2X, M2Y, MW, MH, C.DARK_GREY)
fillRect(M2X + 1, M2Y + 1, MW - 2, 2, C.LIGHT_GREY)
fillRect(M2X + 4, M2Y + 5, MW - 8, MH - 12, C.BLACK)
-- Green phosphor graph
local gBase2 = M2Y + MH - 12
for gx2 = M2X + 6, M2X + MW - 7 do
    local gy2 = gBase2 - 5 - math.floor(math.sin((gx2 - M2X) * 0.14) * 10 + math.random(0, 3))
    if gy2 >= M2Y + 6 then
        px(gx2, gy2, blendColor(C.BLACK, C.GREEN, 0.55))
        px(gx2, gy2 + 1, blendColor(C.BLACK, C.GREEN, 0.2))
    end
end
fillRect(M2X + 22, M2Y + MH, 16, 5, C.DARK_GREY)
fillRect(M2X + 17, M2Y + MH + 4, 26, 3, C.DARK_GREY)

-- Green glow on wall from CRTs
for gy = M1Y - 5, RD_T + 5 do
    for gx2 = RD_L, RD_L + RD_W do
        if gx2 >= 0 and gx2 < W and gy >= CEIL_H then
            local d1 = math.sqrt((gx2-(M1X+MW/2))^2 + (gy-(M1Y+MH/2))^2)
            local d2 = math.sqrt((gx2-(M2X+MW/2))^2 + (gy-(M2Y+MH/2))^2)
            local dist = math.min(d1, d2)
            if dist > 30 and dist < 55 then
                local alpha = math.max(0, 0.025 - (dist-30)*0.001)
                px(gx2, gy, blendColor(rd(gx2,gy), C.GREEN, alpha))
            end
        end
    end
end

-- Desk lamp (right side)
fillRect(RD_L + RD_W - 25, RD_T - 25, 3, 23, C.DARK_GREY)
fillRect(RD_L + RD_W - 31, RD_T - 30, 15, 6, C.DARK_GREY)
fillRect(RD_L + RD_W - 28, RD_T - 25, 9, 2, C.YELLOW)
-- Lamp glow
for dy2 = -20, 20 do
    for dx2 = -20, 20 do
        local d = math.sqrt(dx2*dx2 + dy2*dy2)
        if d < 22 then
            local alpha = (1 - d/22) * 0.06
            local lx2 = RD_L + RD_W - 24 + dx2
            local ly2 = RD_T - 22 + dy2
            if lx2 >= 0 and lx2 < W and ly2 >= 0 and ly2 < H then
                px(lx2, ly2, blendColor(rd(lx2,ly2), C.ORANGE, alpha))
            end
        end
    end
end

print("Bulb light on floor...")

-- Light pools on floor from bulbs
for _, bx2 in ipairs(bulbs) do
    for dy = -30, 30 do
        for dx = -35, 35 do
            local d = math.sqrt(dx*dx + dy*dy)
            if d < 35 then
                local alpha = (1 - d/35) * 0.07
                local fx, fy = bx2 + dx, FLOOR_Y + 20 + dy
                if fx >= 0 and fx < W and fy >= FLOOR_Y and fy < H then
                    px(fx, fy, blendColor(rd(fx,fy), C.YELLOW, alpha))
                end
            end
        end
    end
end

print("Vignette...")

for x = 0, 40 do
    local alpha = (40-x)/40 * 0.2
    for y = 0, H-1 do px(x, y, blendColor(rd(x,y), C.BLACK, alpha)) end
end
for x = W-41, W-1 do
    local alpha = (x-(W-41))/40 * 0.2
    for y = 0, H-1 do px(x, y, blendColor(rd(x,y), C.BLACK, alpha)) end
end

print("Saving...")
spr:saveCopyAs("C:\\Users\\shlom\\projects\\DNA Game\\assets\\backgrounds\\bg_research.png")
print("Done! Saved bg_research.png")
spr:close()
