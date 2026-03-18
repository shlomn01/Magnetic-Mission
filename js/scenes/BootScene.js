/**
 * BootScene - Generates ALL procedural pixel art textures
 * "The Magnetic Mission" - Point-and-click investigation game
 * Uses PICO-8-inspired palette, small textures scaled up via pixelArt: true
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    // PICO-8 inspired palette
    get C() {
        return {
            DEEP_NAVY:   0x0d1b2a,
            DARK_BLUE:   0x1b2838,
            MED_BLUE:    0x2d4a6a,
            BRIGHT_BLUE: 0x29adff,
            CYAN:        0x53d8fb,
            WHITE:       0xfff1e8,
            LIGHT_GREY:  0xc2c3c7,
            DARK_GREY:   0x5f574f,
            RED:         0xff004d,
            ORANGE:      0xffa300,
            YELLOW:      0xffec27,
            GREEN:       0x00e436,
            DARK_GREEN:  0x008751,
            PINK:        0xff77a8,
            INDIGO:      0x83769c,
            BROWN:       0xab5236,
            SKIN:        0xffccaa,
            BLACK:       0x000000,
        };
    }

    preload() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.cameras.main.setBackgroundColor(0x0d1b2a);
        this.add.text(w / 2, h / 2, 'LOADING...', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#29adff',
        }).setOrigin(0.5);

        // Load real pixel art assets (created with Aseprite)
        this.load.image('bg_title', 'assets/backgrounds/title_bg.png');
        this.load.image('bg_corridor', 'assets/backgrounds/corridor_bg.png');
        this.load.image('bg_lab', 'assets/backgrounds/lab_bg.png');
        this.load.image('bg_navigation', 'assets/backgrounds/bg_navigation.png');
        this.load.image('bg_research', 'assets/backgrounds/bg_research.png');
        this.load.image('bg_bridge', 'assets/backgrounds/bg_bridge.png');
        this.load.image('spr_ship', 'assets/sprites/ship.png');
        this.load.image('spr_galvanometer', 'assets/sprites/galvanometer.png');
        this.load.image('spr_needle', 'assets/sprites/needle.png');
        this.load.image('spr_compass_rose', 'assets/sprites/compass_rose.png');
        this.load.image('spr_portrait_captain', 'assets/sprites/portrait_captain.png');
        this.load.image('spr_portrait_magneta', 'assets/sprites/portrait_magneta.png');
        this.load.image('spr_portrait_navi', 'assets/sprites/portrait_navi.png');
        this.load.image('spr_portrait_geo', 'assets/sprites/portrait_geo.png');
        this.load.image('spr_door_open', 'assets/sprites/door_open.png');
        this.load.image('spr_door_locked', 'assets/sprites/door_locked.png');
        this.load.image('spr_btn_measure', 'assets/sprites/btn_measure.png');
        this.load.image('spr_icon_clock', 'assets/sprites/icon_clock.png');
        this.load.image('spr_icon_evidence', 'assets/sprites/icon_evidence.png');
        this.load.image('spr_icon_quest', 'assets/sprites/icon_quest.png');
    }

    create() {
        this.generateAllTextures();
        this.scene.start('Title');
    }

    /** Set a single pixel */
    px(g, x, y, color, alpha) {
        g.fillStyle(color, alpha !== undefined ? alpha : 1);
        g.fillRect(x, y, 1, 1);
    }

    /** Fill a rectangle */
    rect(g, x, y, w, h, color, alpha) {
        g.fillStyle(color, alpha !== undefined ? alpha : 1);
        g.fillRect(x, y, w, h);
    }

    /** Horizontal line (1px tall) */
    hline(g, x, y, len, color, alpha) {
        this.rect(g, x, y, len, 1, color, alpha);
    }

    /** Vertical line (1px wide) */
    vline(g, x, y, len, color, alpha) {
        this.rect(g, x, y, 1, len, color, alpha);
    }

    /** Bresenham circle outline */
    drawPixelCircle(g, cx, cy, r, color, alpha) {
        let x = r, y = 0, d = 1 - r;
        const a = alpha !== undefined ? alpha : 1;
        while (x >= y) {
            this.px(g, cx + x, cy + y, color, a);
            this.px(g, cx - x, cy + y, color, a);
            this.px(g, cx + x, cy - y, color, a);
            this.px(g, cx - x, cy - y, color, a);
            this.px(g, cx + y, cy + x, color, a);
            this.px(g, cx - y, cy + x, color, a);
            this.px(g, cx + y, cy - x, color, a);
            this.px(g, cx - y, cy - x, color, a);
            y++;
            if (d < 0) {
                d += 2 * y + 1;
            } else {
                x--;
                d += 2 * (y - x) + 1;
            }
        }
    }

    /** Filled pixel circle using scanlines */
    drawFilledCircle(g, cx, cy, r, color, alpha) {
        const a = alpha !== undefined ? alpha : 1;
        for (let dy = -r; dy <= r; dy++) {
            const dx = Math.floor(Math.sqrt(r * r - dy * dy));
            this.rect(g, cx - dx, cy + dy, dx * 2 + 1, 1, color, a);
        }
    }

    /** Bresenham line */
    drawLine(g, x0, y0, x1, y1, color, alpha) {
        const a = alpha !== undefined ? alpha : 1;
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        while (true) {
            this.px(g, x0, y0, color, a);
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    generateAllTextures() {
        const g = this.make.graphics({ add: false });
        const P = this.C;

        // ========================================
        // 1. UI ELEMENTS
        // ========================================

        // --- btn (48x14) ---
        g.clear();
        this.rect(g, 0, 0, 48, 14, P.MED_BLUE);
        this.hline(g, 1, 0, 46, P.BRIGHT_BLUE);       // top highlight
        this.hline(g, 1, 13, 46, P.DARK_BLUE);         // bottom shadow
        this.vline(g, 0, 1, 12, P.BRIGHT_BLUE, 0.6);
        this.vline(g, 47, 1, 12, P.DARK_BLUE, 0.6);
        // cut corners for rounded look
        this.px(g, 0, 0, P.DEEP_NAVY); this.px(g, 47, 0, P.DEEP_NAVY);
        this.px(g, 0, 13, P.DEEP_NAVY); this.px(g, 47, 13, P.DEEP_NAVY);
        g.generateTexture('btn', 48, 14);

        // --- btn_hover (48x14) ---
        g.clear();
        this.rect(g, 0, 0, 48, 14, P.BRIGHT_BLUE);
        this.hline(g, 1, 0, 46, P.CYAN);
        this.hline(g, 1, 13, 46, P.MED_BLUE);
        this.vline(g, 0, 1, 12, P.CYAN, 0.6);
        this.vline(g, 47, 1, 12, P.MED_BLUE, 0.6);
        this.px(g, 0, 0, P.DEEP_NAVY); this.px(g, 47, 0, P.DEEP_NAVY);
        this.px(g, 0, 13, P.DEEP_NAVY); this.px(g, 47, 13, P.DEEP_NAVY);
        g.generateTexture('btn_hover', 48, 14);

        // --- panel (64x48) ---
        g.clear();
        this.rect(g, 0, 0, 64, 48, P.DEEP_NAVY);
        // outer border
        this.hline(g, 0, 0, 64, P.MED_BLUE);
        this.hline(g, 0, 47, 64, P.DARK_BLUE);
        this.vline(g, 0, 0, 48, P.MED_BLUE);
        this.vline(g, 63, 0, 48, P.DARK_BLUE);
        // inner shadow
        this.hline(g, 1, 1, 62, P.DARK_BLUE, 0.4);
        this.vline(g, 1, 1, 46, P.DARK_BLUE, 0.3);
        g.generateTexture('panel', 64, 48);

        // --- dialog_box (200x50) ---
        g.clear();
        this.rect(g, 0, 0, 200, 50, P.DEEP_NAVY);
        // light border
        this.hline(g, 2, 0, 196, P.MED_BLUE);
        this.hline(g, 2, 49, 196, P.MED_BLUE);
        this.vline(g, 0, 2, 46, P.MED_BLUE);
        this.vline(g, 199, 2, 46, P.MED_BLUE);
        // rounded corners
        this.px(g, 1, 0, P.MED_BLUE); this.px(g, 198, 0, P.MED_BLUE);
        this.px(g, 0, 1, P.MED_BLUE); this.px(g, 199, 1, P.MED_BLUE);
        this.px(g, 1, 49, P.MED_BLUE); this.px(g, 198, 49, P.MED_BLUE);
        this.px(g, 0, 48, P.MED_BLUE); this.px(g, 199, 48, P.MED_BLUE);
        // inner top highlight
        this.hline(g, 3, 1, 194, P.DARK_BLUE, 0.5);
        g.generateTexture('dialog_box', 200, 50);

        // --- timer_bg (40x12) ---
        g.clear();
        this.rect(g, 0, 0, 40, 12, P.DEEP_NAVY);
        this.hline(g, 0, 0, 40, P.DARK_GREY);
        this.hline(g, 0, 11, 40, P.DARK_GREY);
        this.vline(g, 0, 0, 12, P.DARK_GREY);
        this.vline(g, 39, 0, 12, P.DARK_GREY);
        g.generateTexture('timer_bg', 40, 12);

        // ========================================
        // 2. CHARACTER PORTRAITS (24x24)
        // ========================================

        // --- portrait_captain ---
        g.clear();
        this.rect(g, 0, 0, 24, 24, P.DEEP_NAVY);
        // Captain hat (dark blue)
        this.rect(g, 5, 1, 14, 3, P.DARK_BLUE);
        this.rect(g, 3, 3, 18, 2, P.DARK_BLUE);
        this.hline(g, 5, 4, 14, P.YELLOW);           // gold hat band
        this.px(g, 11, 2, P.YELLOW); this.px(g, 12, 2, P.YELLOW); // badge
        // Face (skin)
        this.rect(g, 6, 5, 12, 11, P.SKIN);
        this.rect(g, 5, 7, 14, 8, P.SKIN);
        // Ears
        this.px(g, 4, 8, P.SKIN); this.px(g, 4, 9, P.SKIN);
        this.px(g, 19, 8, P.SKIN); this.px(g, 19, 9, P.SKIN);
        // Eyes (bright blue)
        this.px(g, 8, 9, P.BRIGHT_BLUE); this.px(g, 9, 9, P.DEEP_NAVY);
        this.px(g, 14, 9, P.BRIGHT_BLUE); this.px(g, 15, 9, P.DEEP_NAVY);
        // Stern brow
        this.hline(g, 7, 8, 4, P.DARK_GREY);
        this.hline(g, 13, 8, 4, P.DARK_GREY);
        // Square jaw
        this.rect(g, 5, 15, 14, 1, P.SKIN);
        // Nose
        this.px(g, 11, 11, P.BROWN, 0.5); this.px(g, 12, 11, P.BROWN, 0.5);
        // Mouth (stern thin line)
        this.hline(g, 9, 13, 6, P.BROWN, 0.7);
        // Grey stubble
        for (let sx = 7; sx < 17; sx += 2) {
            this.px(g, sx, 14, P.LIGHT_GREY, 0.35);
            this.px(g, sx + 1, 15, P.LIGHT_GREY, 0.3);
        }
        this.px(g, 5, 12, P.LIGHT_GREY, 0.25); this.px(g, 18, 12, P.LIGHT_GREY, 0.25);
        // Neck + uniform collar
        this.rect(g, 9, 16, 6, 2, P.SKIN);
        this.rect(g, 4, 18, 16, 6, P.DARK_BLUE);
        this.hline(g, 6, 18, 12, P.MED_BLUE);
        this.px(g, 8, 19, P.YELLOW); this.px(g, 15, 19, P.YELLOW); // epaulette dots
        g.generateTexture('portrait_captain', 24, 24);

        // --- portrait_magneta ---
        g.clear();
        this.rect(g, 0, 0, 24, 24, P.DEEP_NAVY);
        // Pink hair pulled back
        this.rect(g, 5, 0, 14, 5, P.PINK);
        this.rect(g, 4, 1, 16, 4, P.PINK);
        this.rect(g, 3, 2, 2, 5, P.PINK); // left side
        this.rect(g, 19, 2, 2, 5, P.PINK); // right side
        // Hair bun
        this.rect(g, 16, 0, 5, 3, P.PINK);
        this.rect(g, 18, 0, 3, 2, P.INDIGO); // bun accent
        // Face
        this.rect(g, 6, 5, 12, 11, 0xffe0c0);
        this.rect(g, 5, 6, 14, 9, 0xffe0c0);
        this.px(g, 4, 8, 0xffe0c0); this.px(g, 19, 8, 0xffe0c0); // ears
        // Glasses (bright blue frames)
        this.rect(g, 6, 8, 5, 4, P.BRIGHT_BLUE);
        this.rect(g, 13, 8, 5, 4, P.BRIGHT_BLUE);
        this.hline(g, 11, 9, 2, P.BRIGHT_BLUE); // bridge
        // Lens fill (cyan tint)
        this.rect(g, 7, 9, 3, 2, P.CYAN, 0.3);
        this.rect(g, 14, 9, 3, 2, P.CYAN, 0.3);
        // Eyes behind glasses
        this.px(g, 8, 10, P.DEEP_NAVY); this.px(g, 15, 10, P.DEEP_NAVY);
        // Nose
        this.px(g, 11, 12, P.BROWN, 0.3);
        // Smile
        this.px(g, 9, 14, P.BROWN, 0.4);
        this.hline(g, 10, 14, 4, P.PINK, 0.5);
        this.px(g, 14, 14, P.BROWN, 0.4);
        // Neck
        this.rect(g, 9, 16, 6, 2, 0xffe0c0);
        // Lab coat (white)
        this.rect(g, 3, 18, 18, 6, P.WHITE);
        this.vline(g, 11, 18, 6, P.LIGHT_GREY);
        this.vline(g, 12, 18, 6, P.LIGHT_GREY);
        this.hline(g, 3, 18, 18, P.LIGHT_GREY);
        g.generateTexture('portrait_magneta', 24, 24);

        // --- portrait_navi ---
        g.clear();
        this.rect(g, 0, 0, 24, 24, P.DEEP_NAVY);
        // Short dark hair
        this.rect(g, 5, 1, 14, 5, P.DARK_GREY);
        this.rect(g, 4, 2, 16, 4, P.DARK_GREY);
        this.rect(g, 3, 3, 2, 4, P.DARK_GREY);
        this.rect(g, 19, 3, 2, 4, P.DARK_GREY);
        // Face
        this.rect(g, 6, 5, 12, 11, P.SKIN);
        this.rect(g, 5, 6, 14, 9, P.SKIN);
        this.px(g, 4, 8, P.SKIN); this.px(g, 19, 8, P.SKIN); // ears
        // Eyes
        this.px(g, 8, 9, P.DEEP_NAVY); this.px(g, 9, 9, P.DEEP_NAVY);
        this.px(g, 14, 9, P.DEEP_NAVY); this.px(g, 15, 9, P.DEEP_NAVY);
        // Skeptical eyebrow: left normal, right raised
        this.hline(g, 7, 8, 4, P.DARK_GREY);
        this.hline(g, 13, 7, 4, P.DARK_GREY); // raised!
        this.px(g, 13, 8, P.DARK_GREY);
        // Nose
        this.px(g, 11, 11, P.BROWN, 0.4); this.px(g, 12, 11, P.BROWN, 0.4);
        // Slight smirk
        this.hline(g, 9, 13, 5, P.BROWN, 0.5);
        this.px(g, 14, 12, P.BROWN, 0.3);
        // Headset (bright blue)
        this.hline(g, 2, 4, 20, P.BRIGHT_BLUE);       // headband
        this.rect(g, 1, 8, 3, 4, P.BRIGHT_BLUE);      // left earpiece
        this.rect(g, 20, 8, 3, 4, P.BRIGHT_BLUE);     // right earpiece
        // Mic arm
        this.vline(g, 1, 12, 3, P.BRIGHT_BLUE);
        this.hline(g, 2, 15, 4, P.BRIGHT_BLUE);
        this.px(g, 6, 15, P.GREEN);                    // mic indicator
        // Neck + uniform
        this.rect(g, 9, 16, 6, 2, P.SKIN);
        this.rect(g, 4, 18, 16, 6, P.MED_BLUE);
        this.hline(g, 4, 18, 16, P.BRIGHT_BLUE);
        g.generateTexture('portrait_navi', 24, 24);

        // --- portrait_geo ---
        g.clear();
        this.rect(g, 0, 0, 24, 24, P.DEEP_NAVY);
        // Wild curly orange hair
        this.rect(g, 3, 0, 18, 2, P.ORANGE);
        this.rect(g, 2, 0, 20, 4, P.ORANGE);
        this.rect(g, 1, 1, 22, 5, P.ORANGE);
        this.rect(g, 2, 4, 20, 3, P.ORANGE);
        // curly tufts
        this.px(g, 1, 0, P.ORANGE); this.px(g, 22, 0, P.ORANGE);
        this.px(g, 0, 2, P.ORANGE); this.px(g, 23, 2, P.ORANGE);
        this.px(g, 0, 4, P.ORANGE); this.px(g, 23, 4, P.ORANGE);
        this.rect(g, 1, 5, 3, 4, P.ORANGE);
        this.rect(g, 20, 5, 3, 4, P.ORANGE);
        this.px(g, 0, 6, P.ORANGE); this.px(g, 23, 6, P.ORANGE);
        // Goggles on forehead (green)
        this.rect(g, 5, 4, 5, 3, P.GREEN);
        this.rect(g, 14, 4, 5, 3, P.GREEN);
        this.rect(g, 6, 5, 3, 1, P.CYAN, 0.4);   // left lens
        this.rect(g, 15, 5, 3, 1, P.CYAN, 0.4);   // right lens
        this.hline(g, 10, 5, 4, P.GREEN);           // bridge
        this.px(g, 3, 5, P.DARK_GREEN); this.px(g, 20, 5, P.DARK_GREEN); // strap
        // Face
        this.rect(g, 6, 7, 12, 9, P.SKIN);
        this.rect(g, 5, 8, 14, 7, P.SKIN);
        this.px(g, 4, 9, P.SKIN); this.px(g, 19, 9, P.SKIN); // ears
        // Big happy eyes
        this.px(g, 8, 10, P.DEEP_NAVY); this.px(g, 9, 10, P.BROWN);
        this.px(g, 14, 10, P.BROWN); this.px(g, 15, 10, P.DEEP_NAVY);
        // Raised happy eyebrows
        this.hline(g, 7, 8, 4, P.ORANGE, 0.8);
        this.hline(g, 13, 8, 4, P.ORANGE, 0.8);
        // Nose
        this.px(g, 11, 12, P.BROWN, 0.4);
        // Big grin
        this.px(g, 8, 14, P.BROWN, 0.5);
        this.hline(g, 9, 14, 6, P.WHITE, 0.7);  // teeth
        this.hline(g, 9, 15, 6, P.BROWN, 0.5);
        this.px(g, 15, 14, P.BROWN, 0.5);
        // Neck + field vest (brown)
        this.rect(g, 9, 16, 6, 2, P.SKIN);
        this.rect(g, 4, 18, 16, 6, P.BROWN);
        this.hline(g, 4, 18, 16, P.ORANGE, 0.5);
        // Pockets
        this.rect(g, 5, 20, 4, 2, P.DARK_GREY);
        this.rect(g, 15, 20, 4, 2, P.DARK_GREY);
        g.generateTexture('portrait_geo', 24, 24);

        // ========================================
        // 3. SHIP INTERIOR ELEMENTS
        // ========================================

        // --- door (20x28) ---
        g.clear();
        this.rect(g, 0, 0, 20, 28, P.DARK_GREY);
        // frame border
        this.hline(g, 0, 0, 20, P.LIGHT_GREY);
        this.hline(g, 0, 27, 20, P.DARK_BLUE);
        this.vline(g, 0, 0, 28, P.LIGHT_GREY);
        this.vline(g, 19, 0, 28, P.DARK_BLUE);
        // upper panel
        this.rect(g, 2, 2, 16, 11, P.MED_BLUE);
        // lower panel
        this.rect(g, 2, 15, 16, 11, P.MED_BLUE);
        // center divider
        this.hline(g, 2, 14, 16, P.DARK_GREY);
        // porthole window
        this.rect(g, 7, 4, 6, 6, P.BRIGHT_BLUE, 0.6);
        this.rect(g, 8, 5, 4, 4, P.CYAN, 0.4);
        // handle
        this.rect(g, 15, 17, 2, 4, P.LIGHT_GREY);
        // green status light
        this.px(g, 10, 1, P.GREEN);
        g.generateTexture('door', 20, 28);

        // --- door_locked (20x28) ---
        g.clear();
        this.rect(g, 0, 0, 20, 28, P.DARK_GREY);
        this.hline(g, 0, 0, 20, P.LIGHT_GREY);
        this.hline(g, 0, 27, 20, P.DARK_BLUE);
        this.vline(g, 0, 0, 28, P.LIGHT_GREY);
        this.vline(g, 19, 0, 28, P.DARK_BLUE);
        this.rect(g, 2, 2, 16, 11, P.MED_BLUE);
        this.rect(g, 2, 15, 16, 11, P.MED_BLUE);
        this.hline(g, 2, 14, 16, P.DARK_GREY);
        this.rect(g, 7, 4, 6, 6, P.BRIGHT_BLUE, 0.6);
        this.rect(g, 8, 5, 4, 4, P.CYAN, 0.4);
        this.rect(g, 15, 17, 2, 4, P.LIGHT_GREY);
        // RED status light
        this.px(g, 10, 1, P.RED);
        g.generateTexture('door_locked', 20, 28);

        // --- porthole (16x16) ---
        g.clear();
        // metal ring (approximate circle with rects)
        this.rect(g, 4, 0, 8, 16, P.DARK_GREY);
        this.rect(g, 0, 4, 16, 8, P.DARK_GREY);
        this.rect(g, 2, 2, 12, 12, P.DARK_GREY);
        this.rect(g, 1, 3, 14, 10, P.DARK_GREY);
        this.rect(g, 3, 1, 10, 14, P.DARK_GREY);
        // sky portion (upper)
        this.rect(g, 4, 3, 8, 4, P.BRIGHT_BLUE, 0.6);
        this.rect(g, 3, 4, 10, 3, P.BRIGHT_BLUE, 0.6);
        // ocean portion (lower)
        this.rect(g, 4, 9, 8, 4, P.MED_BLUE);
        this.rect(g, 3, 9, 10, 3, P.MED_BLUE);
        // horizon
        this.hline(g, 3, 7, 10, P.CYAN, 0.5);
        this.hline(g, 4, 8, 8, P.BRIGHT_BLUE, 0.4);
        // bolts
        this.px(g, 3, 2, P.LIGHT_GREY); this.px(g, 12, 2, P.LIGHT_GREY);
        this.px(g, 3, 13, P.LIGHT_GREY); this.px(g, 12, 13, P.LIGHT_GREY);
        g.generateTexture('porthole', 16, 16);

        // --- shelf (32x12) ---
        g.clear();
        // shelf surface
        this.rect(g, 0, 0, 32, 3, P.DARK_GREY);
        this.hline(g, 0, 0, 32, P.LIGHT_GREY);
        // brackets
        this.vline(g, 1, 0, 12, P.DARK_GREY);
        this.vline(g, 2, 0, 10, P.DARK_GREY);
        this.vline(g, 30, 0, 12, P.DARK_GREY);
        this.vline(g, 29, 0, 10, P.DARK_GREY);
        // bottle on shelf
        this.rect(g, 6, 0, 3, 3, P.BRIGHT_BLUE, 0.7);
        // beaker
        this.rect(g, 12, 0, 4, 3, P.GREEN, 0.5);
        this.hline(g, 11, 0, 6, P.LIGHT_GREY);
        // book
        this.rect(g, 20, 0, 2, 3, P.RED, 0.7);
        this.rect(g, 22, 0, 2, 3, P.ORANGE, 0.7);
        // small box
        this.rect(g, 26, 0, 3, 3, P.BROWN);
        g.generateTexture('shelf', 32, 12);

        // --- pipe_h (16x4) ---
        g.clear();
        this.rect(g, 0, 0, 16, 4, P.DARK_GREY);
        this.hline(g, 0, 0, 16, P.LIGHT_GREY, 0.5);
        this.hline(g, 0, 3, 16, P.DARK_BLUE, 0.5);
        this.px(g, 4, 1, P.LIGHT_GREY); this.px(g, 12, 1, P.LIGHT_GREY);
        g.generateTexture('pipe_h', 16, 4);

        // --- pipe_v (4x16) ---
        g.clear();
        this.rect(g, 0, 0, 4, 16, P.DARK_GREY);
        this.vline(g, 0, 0, 16, P.LIGHT_GREY, 0.5);
        this.vline(g, 3, 0, 16, P.DARK_BLUE, 0.5);
        this.px(g, 1, 4, P.LIGHT_GREY); this.px(g, 1, 12, P.LIGHT_GREY);
        g.generateTexture('pipe_v', 4, 16);

        // ========================================
        // 4. LAB EQUIPMENT
        // ========================================

        // --- galv_base (32x32) ---
        g.clear();
        // outer circle ring
        this.drawFilledCircle(g, 16, 16, 15, P.DARK_GREY);
        // inner face
        this.drawFilledCircle(g, 16, 16, 13, P.MED_BLUE);
        // degree marks - cardinal
        this.px(g, 16, 2, P.WHITE); this.px(g, 16, 30, P.WHITE);
        this.px(g, 2, 16, P.WHITE); this.px(g, 30, 16, P.WHITE);
        // intercardinal
        this.px(g, 7, 7, P.LIGHT_GREY); this.px(g, 25, 7, P.LIGHT_GREY);
        this.px(g, 7, 25, P.LIGHT_GREY); this.px(g, 25, 25, P.LIGHT_GREY);
        // minor marks
        this.px(g, 12, 2, P.LIGHT_GREY); this.px(g, 20, 2, P.LIGHT_GREY);
        this.px(g, 12, 30, P.LIGHT_GREY); this.px(g, 20, 30, P.LIGHT_GREY);
        this.px(g, 2, 12, P.LIGHT_GREY); this.px(g, 2, 20, P.LIGHT_GREY);
        this.px(g, 30, 12, P.LIGHT_GREY); this.px(g, 30, 20, P.LIGHT_GREY);
        // center pivot
        this.rect(g, 15, 15, 3, 3, P.LIGHT_GREY);
        this.px(g, 16, 16, P.WHITE);
        // outer ring highlight
        this.drawPixelCircle(g, 16, 16, 15, P.LIGHT_GREY, 0.5);
        g.generateTexture('galv_base', 32, 32);

        // --- galv_needle (3x20) ---
        g.clear();
        // red north half (top)
        this.vline(g, 1, 0, 10, P.RED);
        this.px(g, 0, 8, P.RED); this.px(g, 2, 8, P.RED);
        this.px(g, 0, 9, P.RED); this.px(g, 2, 9, P.RED);
        this.px(g, 1, 0, P.WHITE); // tip
        // blue south half (bottom)
        this.vline(g, 1, 10, 10, P.BRIGHT_BLUE);
        this.px(g, 0, 10, P.BRIGHT_BLUE); this.px(g, 2, 10, P.BRIGHT_BLUE);
        this.px(g, 0, 11, P.BRIGHT_BLUE); this.px(g, 2, 11, P.BRIGHT_BLUE);
        this.px(g, 1, 19, P.WHITE); // tip
        g.generateTexture('galv_needle', 3, 20);

        // --- coil_part (12x12) ---
        g.clear();
        // copper donut shape
        this.drawFilledCircle(g, 6, 6, 5, P.ORANGE);
        // center hole
        this.drawFilledCircle(g, 6, 6, 2, P.BROWN);
        // highlight
        this.px(g, 3, 2, P.YELLOW, 0.6);
        this.px(g, 4, 1, P.YELLOW, 0.6);
        // wire wrapping detail
        this.px(g, 1, 6, P.BROWN); this.px(g, 11, 6, P.BROWN);
        this.px(g, 6, 1, P.BROWN); this.px(g, 6, 11, P.BROWN);
        g.generateTexture('coil_part', 12, 12);

        // --- wire_part (12x8) ---
        g.clear();
        this.rect(g, 1, 2, 10, 4, P.DARK_GREY);
        // individual wires
        this.hline(g, 0, 2, 12, P.RED);
        this.hline(g, 0, 3, 12, P.BRIGHT_BLUE);
        this.hline(g, 0, 4, 12, P.GREEN);
        this.hline(g, 0, 5, 12, P.YELLOW);
        // tie wraps
        this.vline(g, 3, 1, 6, P.DARK_GREY);
        this.vline(g, 8, 1, 6, P.DARK_GREY);
        g.generateTexture('wire_part', 12, 8);

        // --- battery_part (10x8) ---
        g.clear();
        this.rect(g, 1, 1, 8, 6, P.DARK_GREY);
        // terminals
        this.rect(g, 0, 2, 1, 4, P.LIGHT_GREY);
        this.rect(g, 9, 2, 1, 4, P.LIGHT_GREY);
        // label
        this.rect(g, 3, 2, 4, 4, P.RED);
        // + symbol
        this.px(g, 1, 3, P.WHITE); this.px(g, 1, 4, P.WHITE);
        // lightning bolt on label
        this.px(g, 4, 2, P.YELLOW); this.px(g, 5, 3, P.YELLOW);
        this.px(g, 4, 4, P.YELLOW); this.px(g, 5, 5, P.YELLOW);
        g.generateTexture('battery_part', 10, 8);

        // --- item_glow (16x16) ---
        g.clear();
        // soft circular glow layers
        this.drawFilledCircle(g, 8, 8, 7, P.YELLOW, 0.1);
        this.drawFilledCircle(g, 8, 8, 5, P.YELLOW, 0.15);
        this.drawFilledCircle(g, 8, 8, 3, P.YELLOW, 0.25);
        this.drawFilledCircle(g, 8, 8, 1, P.YELLOW, 0.4);
        g.generateTexture('item_glow', 16, 16);

        // ========================================
        // 5. EFFECTS
        // ========================================

        // --- pixel_particle (2x2) ---
        g.clear();
        this.rect(g, 0, 0, 2, 2, P.WHITE);
        g.generateTexture('pixel_particle', 2, 2);

        // --- spark (4x4) ---
        g.clear();
        this.rect(g, 0, 0, 4, 4, P.YELLOW, 0.3);
        this.rect(g, 1, 1, 2, 2, P.YELLOW, 0.7);
        this.px(g, 1, 1, P.WHITE); this.px(g, 2, 2, P.WHITE);
        g.generateTexture('spark', 4, 4);

        // --- raindrop (1x4) ---
        g.clear();
        this.px(g, 0, 0, P.BRIGHT_BLUE, 0.3);
        this.px(g, 0, 1, P.BRIGHT_BLUE, 0.6);
        this.px(g, 0, 2, P.CYAN, 0.8);
        this.px(g, 0, 3, P.WHITE, 0.9);
        g.generateTexture('raindrop', 1, 4);

        // --- lightning (2x16) ---
        g.clear();
        this.px(g, 0, 0, P.WHITE);
        this.px(g, 1, 1, P.WHITE);
        this.px(g, 0, 2, P.WHITE);
        this.px(g, 0, 3, P.YELLOW);
        this.px(g, 1, 4, P.WHITE);
        this.px(g, 0, 5, P.WHITE);
        this.px(g, 1, 6, P.YELLOW);
        this.px(g, 0, 7, P.WHITE);
        this.px(g, 1, 8, P.WHITE);
        this.px(g, 0, 9, P.YELLOW);
        this.px(g, 0, 10, P.WHITE);
        this.px(g, 1, 11, P.WHITE);
        this.px(g, 0, 12, P.WHITE);
        this.px(g, 1, 13, P.YELLOW);
        this.px(g, 0, 14, P.WHITE);
        this.px(g, 0, 15, P.WHITE);
        g.generateTexture('lightning', 2, 16);

        // --- wave (32x8) ---
        g.clear();
        // first crest
        this.hline(g, 4, 0, 8, P.CYAN, 0.6);
        this.hline(g, 2, 1, 12, P.BRIGHT_BLUE, 0.7);
        this.hline(g, 1, 2, 14, P.BRIGHT_BLUE, 0.8);
        this.hline(g, 0, 3, 16, P.MED_BLUE, 0.9);
        // second crest
        this.hline(g, 20, 1, 8, P.CYAN, 0.5);
        this.hline(g, 18, 2, 12, P.BRIGHT_BLUE, 0.6);
        this.hline(g, 17, 3, 14, P.BRIGHT_BLUE, 0.7);
        this.hline(g, 16, 4, 16, P.MED_BLUE, 0.8);
        // wave body
        this.rect(g, 0, 4, 32, 4, P.MED_BLUE, 0.6);
        // foam highlights
        this.px(g, 6, 0, P.WHITE, 0.5);
        this.px(g, 22, 1, P.WHITE, 0.5);
        g.generateTexture('wave', 32, 8);

        // ========================================
        // 6. ICONS
        // ========================================

        // --- icon_evidence (10x10) - magnifying glass ---
        g.clear();
        // glass circle outline
        this.hline(g, 2, 0, 4, P.LIGHT_GREY);
        this.hline(g, 1, 1, 6, P.LIGHT_GREY);
        this.px(g, 0, 2, P.LIGHT_GREY); this.px(g, 7, 2, P.LIGHT_GREY);
        this.px(g, 0, 3, P.LIGHT_GREY); this.px(g, 7, 3, P.LIGHT_GREY);
        this.px(g, 0, 4, P.LIGHT_GREY); this.px(g, 7, 4, P.LIGHT_GREY);
        this.hline(g, 1, 5, 6, P.LIGHT_GREY);
        this.hline(g, 2, 6, 4, P.LIGHT_GREY);
        // lens fill
        this.rect(g, 2, 1, 4, 5, P.CYAN, 0.25);
        this.rect(g, 1, 2, 6, 3, P.CYAN, 0.25);
        // glint
        this.px(g, 2, 2, P.WHITE, 0.7);
        // handle
        this.px(g, 7, 6, P.BROWN); this.px(g, 8, 7, P.BROWN);
        this.px(g, 9, 8, P.BROWN); this.px(g, 9, 9, P.BROWN);
        g.generateTexture('icon_evidence', 10, 10);

        // --- icon_clock (10x10) ---
        g.clear();
        // circle
        this.hline(g, 3, 0, 4, P.LIGHT_GREY);
        this.hline(g, 1, 1, 8, P.LIGHT_GREY);
        this.rect(g, 0, 2, 10, 6, P.LIGHT_GREY);
        this.hline(g, 1, 8, 8, P.LIGHT_GREY);
        this.hline(g, 3, 9, 4, P.LIGHT_GREY);
        // face
        this.rect(g, 2, 1, 6, 8, P.DEEP_NAVY);
        this.rect(g, 1, 2, 8, 6, P.DEEP_NAVY);
        // marks
        this.px(g, 5, 1, P.WHITE); // 12
        this.px(g, 8, 5, P.WHITE); // 3
        this.px(g, 5, 8, P.WHITE); // 6
        this.px(g, 1, 5, P.WHITE); // 9
        // hour hand (pointing ~10)
        this.px(g, 5, 5, P.WHITE);
        this.px(g, 4, 4, P.WHITE);
        this.px(g, 3, 3, P.WHITE);
        // minute hand (pointing 12)
        this.px(g, 5, 4, P.BRIGHT_BLUE);
        this.px(g, 5, 3, P.BRIGHT_BLUE);
        g.generateTexture('icon_clock', 10, 10);

        // --- icon_compass (10x10) ---
        g.clear();
        // circle
        this.hline(g, 3, 0, 4, P.LIGHT_GREY);
        this.hline(g, 1, 1, 8, P.LIGHT_GREY);
        this.rect(g, 0, 2, 10, 6, P.LIGHT_GREY);
        this.hline(g, 1, 8, 8, P.LIGHT_GREY);
        this.hline(g, 3, 9, 4, P.LIGHT_GREY);
        // face
        this.rect(g, 2, 1, 6, 8, P.DEEP_NAVY);
        this.rect(g, 1, 2, 8, 6, P.DEEP_NAVY);
        // N (red)
        this.px(g, 4, 1, P.RED); this.px(g, 5, 1, P.RED);
        // S/E/W
        this.px(g, 5, 8, P.WHITE);
        this.px(g, 8, 5, P.WHITE);
        this.px(g, 1, 5, P.WHITE);
        // needle: north=red, south=blue
        this.px(g, 5, 3, P.RED); this.px(g, 5, 4, P.RED);
        this.px(g, 5, 5, P.WHITE); // center
        this.px(g, 5, 6, P.BRIGHT_BLUE); this.px(g, 5, 7, P.BRIGHT_BLUE);
        g.generateTexture('icon_compass', 10, 10);

        // --- icon_quest (8x8) - exclamation in diamond ---
        g.clear();
        // diamond outline
        this.px(g, 3, 0, P.YELLOW); this.px(g, 4, 0, P.YELLOW);
        this.rect(g, 2, 1, 4, 1, P.YELLOW);
        this.rect(g, 1, 2, 6, 1, P.YELLOW);
        this.rect(g, 0, 3, 8, 2, P.YELLOW);
        this.rect(g, 1, 5, 6, 1, P.YELLOW);
        this.rect(g, 2, 6, 4, 1, P.YELLOW);
        this.px(g, 3, 7, P.YELLOW); this.px(g, 4, 7, P.YELLOW);
        // exclamation mark
        this.rect(g, 3, 1, 2, 4, P.DEEP_NAVY);
        this.rect(g, 3, 6, 2, 1, P.DEEP_NAVY);
        g.generateTexture('icon_quest', 8, 8);

        // --- icon_hint (8x8) - question mark ---
        g.clear();
        this.rect(g, 0, 0, 8, 8, P.MED_BLUE);
        // ? shape
        this.px(g, 2, 1, P.WHITE); this.px(g, 3, 1, P.WHITE); this.px(g, 4, 1, P.WHITE);
        this.px(g, 5, 2, P.WHITE);
        this.px(g, 4, 3, P.WHITE);
        this.px(g, 3, 4, P.WHITE);
        this.px(g, 3, 6, P.WHITE);
        g.generateTexture('icon_hint', 8, 8);

        // --- icon_check (8x8) - green checkmark ---
        g.clear();
        this.px(g, 1, 4, P.GREEN); this.px(g, 2, 5, P.GREEN); this.px(g, 3, 6, P.GREEN);
        this.px(g, 4, 5, P.GREEN); this.px(g, 5, 4, P.GREEN);
        this.px(g, 6, 3, P.GREEN); this.px(g, 7, 2, P.GREEN);
        // thicken
        this.px(g, 2, 4, P.GREEN); this.px(g, 3, 5, P.GREEN);
        this.px(g, 4, 4, P.GREEN); this.px(g, 5, 3, P.GREEN); this.px(g, 6, 2, P.GREEN);
        g.generateTexture('icon_check', 8, 8);

        // --- icon_lock (8x8) - padlock ---
        g.clear();
        // shackle
        this.hline(g, 2, 0, 4, P.LIGHT_GREY);
        this.px(g, 1, 1, P.LIGHT_GREY); this.px(g, 6, 1, P.LIGHT_GREY);
        this.px(g, 1, 2, P.LIGHT_GREY); this.px(g, 6, 2, P.LIGHT_GREY);
        // body
        this.rect(g, 0, 3, 8, 5, P.YELLOW);
        // keyhole
        this.px(g, 3, 4, P.DEEP_NAVY); this.px(g, 4, 4, P.DEEP_NAVY);
        this.px(g, 3, 5, P.DEEP_NAVY); this.px(g, 4, 5, P.DEEP_NAVY);
        this.px(g, 3, 6, P.DEEP_NAVY);
        g.generateTexture('icon_lock', 8, 8);

        // ========================================
        // 7. COMPASS ROSE
        // ========================================

        // --- compass_rose (48x48) ---
        g.clear();
        var cx = 24, cy = 24;
        // outer circle
        this.drawFilledCircle(g, cx, cy, 23, P.DARK_GREY);
        this.drawPixelCircle(g, cx, cy, 23, P.LIGHT_GREY);
        // inner face
        this.drawFilledCircle(g, cx, cy, 21, P.DEEP_NAVY);
        this.drawPixelCircle(g, cx, cy, 21, P.DARK_GREY);
        // degree tick marks
        for (var a = 0; a < 360; a += 15) {
            var rad = a * Math.PI / 180;
            var r1 = a % 90 === 0 ? 16 : (a % 45 === 0 ? 18 : 20);
            var r2 = 21;
            var x1 = Math.round(cx + Math.cos(rad) * r1);
            var y1 = Math.round(cy - Math.sin(rad) * r1);
            var x2 = Math.round(cx + Math.cos(rad) * r2);
            var y2 = Math.round(cy - Math.sin(rad) * r2);
            this.drawLine(g, x1, y1, x2, y2, a % 90 === 0 ? P.WHITE : P.LIGHT_GREY);
        }
        // N pointer (up triangle)
        this.px(g, cx, 4, P.RED);
        this.px(g, cx - 1, 5, P.RED); this.px(g, cx, 5, P.RED); this.px(g, cx + 1, 5, P.RED);
        this.px(g, cx - 2, 6, P.RED); this.hline(g, cx - 1, 6, 3, P.RED); this.px(g, cx + 2, 6, P.RED);
        this.vline(g, cx, 7, 8, P.RED);
        // S pointer (down)
        this.px(g, cx, 43, P.BRIGHT_BLUE);
        this.px(g, cx - 1, 42, P.BRIGHT_BLUE); this.px(g, cx, 42, P.BRIGHT_BLUE); this.px(g, cx + 1, 42, P.BRIGHT_BLUE);
        this.vline(g, cx, 34, 8, P.BRIGHT_BLUE);
        // E pointer (right)
        this.px(g, 43, cy, P.LIGHT_GREY);
        this.px(g, 42, cy - 1, P.LIGHT_GREY); this.px(g, 42, cy, P.LIGHT_GREY); this.px(g, 42, cy + 1, P.LIGHT_GREY);
        this.hline(g, 34, cy, 8, P.LIGHT_GREY);
        // W pointer (left)
        this.px(g, 4, cy, P.LIGHT_GREY);
        this.px(g, 5, cy - 1, P.LIGHT_GREY); this.px(g, 5, cy, P.LIGHT_GREY); this.px(g, 5, cy + 1, P.LIGHT_GREY);
        this.hline(g, 6, cy, 8, P.LIGHT_GREY);
        // N/S/E/W letter indicators (single pixel dots near edge)
        this.px(g, cx - 1, 2, P.RED); this.px(g, cx + 1, 2, P.RED); // N
        this.px(g, cx, 45, P.BRIGHT_BLUE); // S
        this.px(g, 45, cy, P.LIGHT_GREY); // E
        this.px(g, 2, cy, P.LIGHT_GREY); // W
        // center
        this.rect(g, cx - 1, cy - 1, 3, 3, P.YELLOW);
        this.px(g, cx, cy, P.WHITE);
        g.generateTexture('compass_rose', 48, 48);

        // --- compass_needle_big (3x32) ---
        g.clear();
        // red north half (top)
        this.px(g, 1, 0, P.WHITE); // tip
        this.vline(g, 1, 1, 14, P.RED);
        this.px(g, 0, 12, P.RED); this.px(g, 2, 12, P.RED);
        this.px(g, 0, 13, P.RED); this.px(g, 2, 13, P.RED);
        this.px(g, 0, 14, P.RED); this.px(g, 2, 14, P.RED);
        // pivot
        this.rect(g, 0, 15, 3, 2, P.LIGHT_GREY);
        // blue south half (bottom)
        this.vline(g, 1, 17, 14, P.BRIGHT_BLUE);
        this.px(g, 0, 17, P.BRIGHT_BLUE); this.px(g, 2, 17, P.BRIGHT_BLUE);
        this.px(g, 0, 18, P.BRIGHT_BLUE); this.px(g, 2, 18, P.BRIGHT_BLUE);
        this.px(g, 0, 19, P.BRIGHT_BLUE); this.px(g, 2, 19, P.BRIGHT_BLUE);
        this.px(g, 1, 31, P.WHITE); // tip
        g.generateTexture('compass_needle_big', 3, 32);

        // ========================================
        // 8. EARTH & MARS
        // ========================================

        // --- earth_pixel (48x48) - cross section ---
        g.clear();
        var ecx = 24, ecy = 24;
        // crust (ocean blue)
        this.drawFilledCircle(g, ecx, ecy, 22, P.MED_BLUE);
        // mantle (brown/red)
        this.drawFilledCircle(g, ecx, ecy, 19, P.BROWN);
        this.drawFilledCircle(g, ecx, ecy, 16, P.RED, 0.7);
        // outer core (orange)
        this.drawFilledCircle(g, ecx, ecy, 11, P.ORANGE);
        // inner core (bright yellow)
        this.drawFilledCircle(g, ecx, ecy, 5, P.YELLOW);
        // green land patches on crust surface
        this.rect(g, 8, 4, 6, 3, P.DARK_GREEN);
        this.rect(g, 7, 6, 4, 2, P.GREEN);
        this.rect(g, 30, 11, 6, 4, P.DARK_GREEN);
        this.rect(g, 32, 9, 3, 3, P.GREEN);
        this.rect(g, 14, 35, 7, 4, P.DARK_GREEN);
        this.rect(g, 16, 37, 4, 3, P.GREEN);
        // outline
        this.drawPixelCircle(g, ecx, ecy, 22, P.CYAN, 0.5);
        g.generateTexture('earth_pixel', 48, 48);

        // --- mars_pixel (32x32) ---
        g.clear();
        var mcx = 16, mcy = 16;
        this.drawFilledCircle(g, mcx, mcy, 14, P.RED);
        // dark patches
        this.rect(g, 8, 8, 5, 4, P.BROWN);
        this.rect(g, 18, 12, 4, 5, P.BROWN);
        this.rect(g, 12, 20, 5, 3, P.BROWN);
        // lighter spots
        this.rect(g, 14, 6, 3, 3, P.ORANGE);
        this.rect(g, 6, 14, 4, 3, P.ORANGE);
        // polar cap
        this.rect(g, 13, 3, 5, 2, P.WHITE, 0.5);
        // outline
        this.drawPixelCircle(g, mcx, mcy, 14, P.BROWN, 0.7);
        g.generateTexture('mars_pixel', 32, 32);

        // ========================================
        // LEGACY COMPATIBILITY TEXTURES
        // (so existing scenes don't break)
        // ========================================

        // particle_glow
        g.clear();
        this.drawFilledCircle(g, 4, 4, 4, P.WHITE, 0.15);
        this.drawFilledCircle(g, 4, 4, 2, P.WHITE, 0.3);
        this.px(g, 4, 4, P.WHITE, 0.5);
        g.generateTexture('particle_glow', 8, 8);

        // particle_dot
        g.clear();
        this.rect(g, 0, 0, 2, 2, P.WHITE);
        g.generateTexture('particle_dot', 2, 2);

        // particle_spark
        g.clear();
        this.rect(g, 1, 0, 2, 4, P.WHITE, 0.5);
        this.rect(g, 0, 1, 4, 2, P.WHITE, 0.5);
        this.px(g, 1, 1, P.WHITE); this.px(g, 2, 2, P.WHITE);
        g.generateTexture('particle_spark', 4, 4);

        // btn_primary, btn_secondary, btn_small, btn_lang
        this._makePixelBtn(g, 'btn_primary', 48, 14, P.BRIGHT_BLUE, P.MED_BLUE, P.DARK_BLUE);
        this._makePixelBtn(g, 'btn_secondary', 48, 14, P.MED_BLUE, P.DARK_BLUE, P.DEEP_NAVY);
        this._makePixelBtn(g, 'btn_small', 32, 12, P.MED_BLUE, P.DARK_BLUE, P.DEEP_NAVY);
        this._makePixelBtn(g, 'btn_lang', 48, 14, P.INDIGO, P.DARK_BLUE, P.DEEP_NAVY);

        // panel_dark, panel_wide, panel_quest, panel_dialog
        this._makePixelPanel(g, 'panel_dark', 64, 48);
        this._makePixelPanel(g, 'panel_wide', 64, 48);
        this._makePixelPanel(g, 'panel_quest', 64, 48);
        this._makePixelPanel(g, 'panel_dialog', 200, 50);

        // galvanometer (legacy alias)
        g.clear();
        this.drawFilledCircle(g, 16, 16, 15, P.DARK_GREY);
        this.drawFilledCircle(g, 16, 16, 13, P.MED_BLUE);
        this.drawPixelCircle(g, 16, 16, 15, P.LIGHT_GREY);
        this.px(g, 16, 2, P.WHITE); this.px(g, 16, 30, P.WHITE);
        this.px(g, 2, 16, P.WHITE); this.px(g, 30, 16, P.WHITE);
        this.rect(g, 15, 15, 3, 3, P.WHITE);
        g.generateTexture('galvanometer', 32, 32);

        // needle (legacy alias)
        g.clear();
        this.rect(g, 0, 0, 3, 10, P.RED);
        this.rect(g, 0, 10, 3, 10, P.BRIGHT_BLUE);
        this.px(g, 1, 0, P.WHITE); this.px(g, 1, 19, P.WHITE);
        g.generateTexture('needle', 3, 20);

        // avatar_ circle portraits (legacy)
        this._makePixelAvatar(g, 'avatar_captain', P.DARK_BLUE);
        this._makePixelAvatar(g, 'avatar_magneta', P.PINK);
        this._makePixelAvatar(g, 'avatar_navi', P.CYAN);
        this._makePixelAvatar(g, 'avatar_geo', P.GREEN);

        // earth_cross (legacy alias)
        g.clear();
        this.drawFilledCircle(g, 24, 24, 23, P.MED_BLUE);
        this.drawFilledCircle(g, 24, 24, 20, P.BROWN);
        this.drawFilledCircle(g, 24, 24, 14, P.ORANGE);
        this.drawFilledCircle(g, 24, 24, 7, P.YELLOW);
        g.generateTexture('earth_cross', 48, 48);

        // icon_badge, icon_journal, icon_back, icon_sound (legacy)
        this._makePixelIcon(g, 'icon_badge', P.ORANGE, 'badge');
        this._makePixelIcon(g, 'icon_journal', P.BRIGHT_BLUE, 'journal');
        this._makePixelIcon(g, 'icon_back', P.LIGHT_GREY, 'arrow');
        this._makePixelIcon(g, 'icon_sound', P.BRIGHT_BLUE, 'sound');

        // slider_track
        g.clear();
        this.rect(g, 0, 0, 32, 4, P.DARK_GREY);
        this.hline(g, 0, 0, 32, P.MED_BLUE);
        g.generateTexture('slider_track', 32, 4);

        // slider_thumb
        g.clear();
        this.rect(g, 0, 0, 6, 6, P.BRIGHT_BLUE);
        this.rect(g, 1, 1, 4, 4, P.CYAN);
        this.rect(g, 2, 2, 2, 2, P.WHITE);
        g.generateTexture('slider_thumb', 6, 6);

        // star
        g.clear();
        this.px(g, 0, 0, P.WHITE);
        g.generateTexture('star', 1, 1);

        g.destroy();
    }

    // ---- Legacy helper generators ----

    _makePixelBtn(g, key, w, h, topColor, mainColor, botColor) {
        g.clear();
        this.rect(g, 0, 0, w, h, mainColor);
        this.hline(g, 1, 0, w - 2, topColor);
        this.hline(g, 1, h - 1, w - 2, botColor);
        this.vline(g, 0, 1, h - 2, topColor, 0.5);
        this.vline(g, w - 1, 1, h - 2, botColor, 0.5);
        this.px(g, 0, 0, this.C.DEEP_NAVY);
        this.px(g, w - 1, 0, this.C.DEEP_NAVY);
        this.px(g, 0, h - 1, this.C.DEEP_NAVY);
        this.px(g, w - 1, h - 1, this.C.DEEP_NAVY);
        g.generateTexture(key, w, h);
    }

    _makePixelPanel(g, key, w, h) {
        g.clear();
        this.rect(g, 0, 0, w, h, this.C.DEEP_NAVY);
        this.hline(g, 0, 0, w, this.C.MED_BLUE);
        this.hline(g, 0, h - 1, w, this.C.DARK_BLUE);
        this.vline(g, 0, 0, h, this.C.MED_BLUE);
        this.vline(g, w - 1, 0, h, this.C.DARK_BLUE);
        this.hline(g, 1, 1, w - 2, this.C.DARK_BLUE, 0.3);
        this.vline(g, 1, 1, h - 2, this.C.DARK_BLUE, 0.3);
        g.generateTexture(key, w, h);
    }

    _makePixelAvatar(g, key, color) {
        g.clear();
        this.drawFilledCircle(g, 12, 12, 11, this.C.DEEP_NAVY);
        this.drawPixelCircle(g, 12, 12, 11, color);
        // silhouette head
        this.drawFilledCircle(g, 12, 9, 4, color, 0.6);
        // silhouette body
        this.rect(g, 6, 14, 12, 6, color, 0.4);
        this.rect(g, 7, 13, 10, 2, color, 0.4);
        g.generateTexture(key, 24, 24);
    }

    _makePixelIcon(g, key, color, type) {
        g.clear();
        var s = 10;
        var P = this.C;
        if (type === 'badge') {
            this.drawPixelCircle(g, 5, 5, 4, color);
            this.px(g, 5, 2, color); this.px(g, 5, 8, color);
            this.px(g, 2, 5, color); this.px(g, 8, 5, color);
        } else if (type === 'journal') {
            this.rect(g, 1, 0, 8, 10, color);
            this.rect(g, 2, 1, 6, 8, P.DEEP_NAVY);
            this.hline(g, 3, 3, 4, color, 0.5);
            this.hline(g, 3, 5, 4, color, 0.5);
            this.hline(g, 3, 7, 3, color, 0.5);
        } else if (type === 'arrow') {
            this.px(g, 0, 5, color);
            this.px(g, 1, 4, color); this.px(g, 1, 6, color);
            this.px(g, 2, 3, color); this.px(g, 2, 7, color);
            this.hline(g, 3, 5, 6, color);
            this.hline(g, 3, 4, 2, color);
            this.hline(g, 3, 6, 2, color);
        } else if (type === 'sound') {
            this.rect(g, 1, 3, 2, 4, color);
            this.px(g, 3, 2, color); this.px(g, 3, 7, color);
            this.px(g, 4, 1, color); this.px(g, 4, 8, color);
            this.px(g, 6, 3, color); this.px(g, 6, 6, color);
            this.px(g, 8, 2, color); this.px(g, 8, 7, color);
        }
        g.generateTexture(key, s, s);
    }
}

window.BootScene = BootScene;
