"""
Generate a detailed 384x384 tangent galvanometer sprite.
PICO-8 palette, steampunk scientific instrument aesthetic.
High-res for clarity when scaled in-game.
"""
import math
from PIL import Image, ImageDraw, ImageFont

# PICO-8 palette
P = {
    'BLACK':       (0x00, 0x00, 0x00),
    'DEEP_NAVY':   (0x0d, 0x1b, 0x2a),
    'DARK_BLUE':   (0x1b, 0x28, 0x38),
    'MED_BLUE':    (0x2d, 0x4a, 0x6a),
    'BRIGHT_BLUE': (0x29, 0xad, 0xff),
    'CYAN':        (0x53, 0xd8, 0xfb),
    'WHITE':       (0xff, 0xf1, 0xe8),
    'LIGHT_GREY':  (0xc2, 0xc3, 0xc7),
    'DARK_GREY':   (0x5f, 0x57, 0x4f),
    'RED':         (0xff, 0x00, 0x4d),
    'ORANGE':      (0xff, 0xa3, 0x00),
    'YELLOW':      (0xff, 0xec, 0x27),
    'GREEN':       (0x00, 0xe4, 0x36),
    'PINK':        (0xff, 0x77, 0xa8),
    'INDIGO':      (0x83, 0x76, 0x9c),
    'BROWN':       (0xab, 0x52, 0x36),
    'SKIN':        (0xff, 0xcc, 0xaa),
}

SIZE = 384
CX, CY = SIZE // 2, SIZE // 2

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

def circle(cx, cy, r, fill=None, outline=None, width=1):
    box = [cx - r, cy - r, cx + r, cy + r]
    if fill:
        draw.ellipse(box, fill=fill)
    if outline:
        draw.ellipse(box, outline=outline, width=width)

def polar(cx, cy, r, angle_deg):
    rad = math.radians(angle_deg)
    return (cx + r * math.cos(rad), cy - r * math.sin(rad))

def line_polar(cx, cy, r1, r2, angle_deg, color, width=1):
    x1, y1 = polar(cx, cy, r1, angle_deg)
    x2, y2 = polar(cx, cy, r2, angle_deg)
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)

# === MOUNTING PLATE CORNERS (behind everything) ===
plate_color = (*P['DARK_GREY'], 180)
draw.polygon([(CX-180, CY-180), (CX-140, CY-180), (CX-180, CY-140)], fill=plate_color)
draw.polygon([(CX+180, CY-180), (CX+140, CY-180), (CX+180, CY-140)], fill=plate_color)
draw.polygon([(CX-180, CY+180), (CX-140, CY+180), (CX-180, CY+140)], fill=plate_color)
draw.polygon([(CX+180, CY+180), (CX+140, CY+180), (CX+180, CY+140)], fill=plate_color)

# === COPPER COIL RING (outermost) ===
# Thick copper ring
circle(CX, CY, 186, fill=P['ORANGE'])
circle(CX, CY, 186, outline=P['BROWN'], width=3)
# Coil wire wrapping texture
for a in range(0, 360, 3):
    x1, y1 = polar(CX, CY, 176, a)
    x2, y2 = polar(CX, CY, 186, a)
    draw.line([(x1, y1), (x2, y2)], fill=P['BROWN'], width=2)
# Copper highlight (upper-left area for 3D effect)
for a in range(200, 320, 4):
    x, y = polar(CX, CY, 181, a)
    draw.rectangle([x-2, y-2, x+2, y+2], fill=(*P['YELLOW'], 90))
# Inner copper ring edge
circle(CX, CY, 172, outline=P['BROWN'], width=3)

# === BRASS BEZEL (outer metallic ring) ===
circle(CX, CY, 168, fill=P['DARK_GREY'])
circle(CX, CY, 168, outline=P['LIGHT_GREY'], width=3)
# Bezel highlights (top-left arc for 3D)
for a in range(120, 240, 2):
    x, y = polar(CX, CY, 165, a)
    draw.rectangle([x, y, x+2, y+2], fill=(*P['LIGHT_GREY'], 100))
# Bezel shadow (bottom-right arc)
for a in range(300, 420, 2):
    aa = a % 360
    x, y = polar(CX, CY, 165, aa)
    draw.rectangle([x, y, x+2, y+2], fill=(*P['BLACK'], 80))

# === INNER FACE (dark blue) ===
circle(CX, CY, 155, fill=P['DEEP_NAVY'])
circle(CX, CY, 155, outline=P['MED_BLUE'], width=2)

# === DEGREE MARKINGS ===
for deg in range(0, 360, 5):
    angle = 90 - deg  # 0 at top (north), clockwise
    if deg % 90 == 0:
        line_polar(CX, CY, 130, 155, angle, P['WHITE'], width=4)
    elif deg % 45 == 0:
        line_polar(CX, CY, 134, 155, angle, P['WHITE'], width=3)
    elif deg % 15 == 0:
        line_polar(CX, CY, 138, 155, angle, P['LIGHT_GREY'], width=3)
    elif deg % 10 == 0:
        line_polar(CX, CY, 141, 155, angle, P['LIGHT_GREY'], width=2)
    else:
        line_polar(CX, CY, 145, 155, angle, P['LIGHT_GREY'], width=1)

# === DEGREE NUMBERS (big, bold) ===
# Try fonts at different sizes
def get_font(size):
    for path in [
        "arial.ttf",
        "arialbd.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()

num_font = get_font(22)
big_font = get_font(34)

# For tangent galvanometer: scale -90 to +90
# 0 at top, 90 at east (right), -90 at west (left)
num_positions = [
    (0,   '0'),
    (30,  '30'),
    (45,  '45'),
    (60,  '60'),
    (90,  '90'),
    (330, '30'),     # -30 displayed as 30 (symmetric)
    (315, '45'),     # -45
    (300, '60'),     # -60
    (270, '90'),     # -90
]

for (deg, label) in num_positions:
    angle = 90 - deg
    tx, ty = polar(CX, CY, 118, angle)
    bbox = draw.textbbox((0, 0), label, font=num_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((tx - tw/2, ty - th/2), label, fill=P['WHITE'], font=num_font)

# === N and S LABELS (large, prominent) ===
# N at top (red) - inside the markings
bbox = draw.textbbox((0, 0), 'N', font=big_font)
nw, nh = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((CX - nw/2, CY - 142 - nh/2), 'N', fill=P['RED'], font=big_font)

# S at bottom (blue)
bbox = draw.textbbox((0, 0), 'S', font=big_font)
sw, sh = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((CX - sw/2, CY + 142 - sh/2), 'S', fill=P['BRIGHT_BLUE'], font=big_font)

# + and - signs on the sides
bbox = draw.textbbox((0, 0), '+', font=big_font)
pw, ph = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((CX + 92 - pw/2, CY - 68), '+', fill=P['YELLOW'], font=big_font)

bbox = draw.textbbox((0, 0), '-', font=big_font)
mw, mh = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((CX - 92 - mw/2, CY - 68), '-', fill=P['YELLOW'], font=big_font)

# === CONCENTRIC GUIDE RINGS ===
circle(CX, CY, 100, outline=(*P['MED_BLUE'], 50), width=1)
circle(CX, CY, 70, outline=(*P['MED_BLUE'], 35), width=1)

# === CROSS HAIRS (thin reference lines) ===
# Vertical center line
draw.line([(CX, CY - 95), (CX, CY - 10)], fill=(*P['MED_BLUE'], 40), width=1)
draw.line([(CX, CY + 10), (CX, CY + 95)], fill=(*P['MED_BLUE'], 40), width=1)
# Horizontal center line
draw.line([(CX - 95, CY), (CX - 10, CY)], fill=(*P['MED_BLUE'], 40), width=1)
draw.line([(CX + 10, CY), (CX + 95, CY)], fill=(*P['MED_BLUE'], 40), width=1)

# === CENTER PIVOT ===
circle(CX, CY, 10, fill=P['LIGHT_GREY'])
circle(CX, CY, 7, fill=P['WHITE'])
circle(CX, CY, 4, fill=(*P['YELLOW'], 220))
circle(CX, CY, 2, fill=P['WHITE'])

# === BRASS SCREWS at 4 mounting positions ===
screw_positions = [(CX-160, CY-160), (CX+160, CY-160), (CX-160, CY+160), (CX+160, CY+160)]
for sx, sy in screw_positions:
    if 8 < sx < SIZE-8 and 8 < sy < SIZE-8:
        circle(sx, sy, 8, fill=P['DARK_GREY'])
        circle(sx, sy, 8, outline=P['LIGHT_GREY'], width=2)
        draw.line([(sx-5, sy), (sx+5, sy)], fill=P['BLACK'], width=2)
        draw.rectangle([sx-2, sy-5, sx+1, sy-3], fill=(*P['WHITE'], 100))

# === GLASS REFLECTION HIGHLIGHTS ===
for i in range(25):
    x = CX - 60 + i * 3
    y = CY - 90 + int(math.sin(i * 0.25) * 12)
    w = max(1, 4 - i // 7)
    draw.rectangle([x, y, x+w, y+2], fill=(*P['WHITE'], 35 + i * 2))

circle(CX - 45, CY - 75, 5, fill=(*P['WHITE'], 50))

for i in range(12):
    x = CX - 35 + i * 3
    y = CY - 70 + i * 2
    draw.rectangle([x, y, x+2, y+1], fill=(*P['WHITE'], 25))

# Save
output_path = r'C:\Users\shlom\projects\DNA Game\assets\sprites\galvanometer.png'
img.save(output_path)
print(f'Saved galvanometer sprite to {output_path} ({img.size[0]}x{img.size[1]})')
