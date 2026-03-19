/**
 * ShipHubScene - Ship corridor hub, LucasArts point-and-click adventure style
 * Rich pixel-art side-view with detailed metal walls, pipes, lights, doors, NPCs.
 * PICO-8 palette. Phaser 3 only (fillRect, fillTriangle, fillCircle, etc.)
 */
class ShipHubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipHub' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.W = w;
        this.H = h;

        const I18N = window.I18N;
        const t = (key) => I18N ? I18N.t(key) : key;
        const isRTL = I18N && I18N.isRTL();
        const GS = window.GameState;

        // Font helpers
        this.pixelFont = "'Press Start 2P'";
        this.rtlFont = I18N ? I18N.getFontFamily() : "'Press Start 2P'";
        this.isRTL = isRTL;

        this._getPixelFontSize = (size) => Math.max(size, 12) + 'px';
        this._getNotoFontSize = (size) => Math.max(size + 8, 18) + 'px';
        this._getFontSize = (enSize) => {
            if (!isRTL && (!I18N || I18N.currentLang === 'en')) return this._getPixelFontSize(enSize);
            return this._getNotoFontSize(enSize);
        };
        this._getFont = () => {
            if (!isRTL && (!I18N || I18N.currentLang === 'en')) return this.pixelFont;
            return this.rtlFont;
        };

        // Palette
        this.P = {
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
            PINK:        0xff77a8,
            INDIGO:      0x83769c,
            BROWN:       0xab5236
        };

        // Music / ambience
        if (window.AudioManager) {
            window.AudioManager.playMusic('ship');
            window.AudioManager.startAmbient('ocean');
        }

        // Layout constants
        this.CEILING_H = Math.floor(h * 0.08);
        this.WALL_TOP = this.CEILING_H;
        this.FLOOR_Y = Math.floor(h * 0.62);
        this.FLOOR_H = h - this.FLOOR_Y;

        // ---- BUILD THE SCENE (bottom to top) ----
        if (this.textures.exists('bg_corridor')) {
            this.add.image(w / 2, h / 2, 'bg_corridor').setDisplaySize(w, h).setDepth(0);
            // Set porthole coordinates for lightning effect (porthole is in the PNG)
            this.portholeX = Math.floor(w * 0.5);
            this.portholeY = Math.floor(this.WALL_TOP + (this.FLOOR_Y - this.WALL_TOP) * 0.28);
            this.portholeRadius = 30;
        } else {
            this.drawMetalWalls(w, h);
            this.drawCeiling(w, h);
            this.drawFloor(w, h);
            this.createPorthole(w, h);
            this.createNoticeBoard(w, h);
        }
        this.drawCeilingLights(w, h);
        this.drawAtmosphericDetails(w, h);

        // ---- FOUR DOORS ----
        const act = GS ? GS.currentAct : 1;
        const rooms = [
            { key: 'lab', scene: 'Lab', labelKey: 'room_lab', unlockAct: 1 },
            { key: 'navigation', scene: 'Navigation', labelKey: 'room_navigation', unlockAct: 2 },
            { key: 'research', scene: 'Research', labelKey: 'room_research', unlockAct: 3 },
            { key: 'bridge', scene: 'Bridge', labelKey: 'room_bridge', unlockAct: 4 }
        ];

        this.doors = [];
        this.isFirstVisit = GS && !GS.hasSeenDialog('hub_captain_intro');

        // Evenly space doors
        const doorSpacing = w / (rooms.length + 1);
        rooms.forEach((room, i) => {
            room.available = act >= room.unlockAct;
            room.x = doorSpacing * (i + 1);
            // Nudge last door left so it doesn't clip the right edge
            if (i === rooms.length - 1) room.x -= 70;
            this.createDoor(room, i);
        });

        // ---- HUD ----
        this.createHUD(w, h);

        // ---- NPCs ----
        this.createNPCs(act, w, h);

        // ---- FIRST VISIT: Captain dialog ----
        if (GS && !GS.hasSeenDialog('hub_captain_intro')) {
            GS.markDialogSeen('hub_captain_intro');
            this.time.delayedCall(600, () => {
                this.scene.launch('Dialog', {
                    npc: 'captain',
                    messages: [t('captain_intro'), t('captain_quest1')],
                    onComplete: () => {}
                });
                this.scene.pause();
            });
        }

        // ---- Lightning timer ----
        this.nextLightning = Phaser.Math.Between(3000, 7000);
        this.lightningGfx = this.add.graphics().setDepth(15);

        // Fade in
        this.cameras.main.fadeIn(800, 13, 27, 42);
    }

    // =========================================================================
    // METAL WALLS - gradient with panel lines and rivets
    // =========================================================================
    drawMetalWalls(w, h) {
        const g = this.add.graphics().setDepth(0);
        const P = this.P;
        const wallTop = this.WALL_TOP;
        const floorY = this.FLOOR_Y;

        // Wall gradient (dark navy at top to slightly lighter blue-grey at bottom)
        for (let y = wallTop; y < floorY; y++) {
            const ratio = (y - wallTop) / (floorY - wallTop);
            const r = Math.floor(Phaser.Math.Linear(0x0d, 0x35, ratio));
            const gg = Math.floor(Phaser.Math.Linear(0x1b, 0x55, ratio));
            const b = Math.floor(Phaser.Math.Linear(0x2a, 0x75, ratio));
            g.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
            g.fillRect(0, y, w, 1);
        }

        // Horizontal panel seam lines every ~50px
        g.lineStyle(1, P.DARK_BLUE, 0.7);
        for (let py = wallTop + 25; py < floorY; py += 50) {
            g.lineBetween(0, py, w, py);
            // Slightly lighter line 1px below for embossed effect
            g.lineStyle(1, P.MED_BLUE, 0.15);
            g.lineBetween(0, py + 1, w, py + 1);
            g.lineStyle(1, P.DARK_BLUE, 0.7);
        }

        // Vertical panel seam lines every ~150px
        g.lineStyle(1, P.DARK_BLUE, 0.35);
        for (let px = 75; px < w; px += 150) {
            g.lineBetween(px, wallTop, px, floorY);
        }

        // Rivets (2x2 bright dots) along panel seam intersections
        for (let rx = 75; rx < w; rx += 150) {
            for (let ry = wallTop + 25; ry < floorY; ry += 50) {
                // Four rivets around each intersection
                g.fillStyle(P.LIGHT_GREY, 0.25);
                g.fillRect(rx - 8, ry - 1, 2, 2);
                g.fillRect(rx + 6, ry - 1, 2, 2);
                // Bright highlight on top-left pixel of each rivet
                g.fillStyle(P.WHITE, 0.12);
                g.fillRect(rx - 8, ry - 1, 1, 1);
                g.fillRect(rx + 6, ry - 1, 1, 1);
            }
        }

        // Wall bottom border line (where wall meets floor)
        g.lineStyle(2, P.MED_BLUE, 0.5);
        g.lineBetween(0, floorY, w, floorY);
        g.lineStyle(1, P.DARK_BLUE, 0.7);
        g.lineBetween(0, floorY + 1, w, floorY + 1);
    }

    // =========================================================================
    // CEILING - dark band with industrial pipes
    // =========================================================================
    drawCeiling(w, h) {
        const g = this.add.graphics().setDepth(0);
        const P = this.P;
        const ch = this.CEILING_H;

        // Dark ceiling fill
        g.fillStyle(P.DEEP_NAVY, 1);
        g.fillRect(0, 0, w, ch);

        // Slightly lighter bottom edge
        g.fillStyle(P.DARK_BLUE, 0.6);
        g.fillRect(0, ch - 2, w, 2);

        // Main horizontal pipe (thick, ~8px)
        const pipeY1 = Math.floor(ch * 0.25);
        g.fillStyle(P.DARK_GREY, 0.85);
        g.fillRect(0, pipeY1, w, 8);
        // Pipe highlight (top edge)
        g.fillStyle(P.LIGHT_GREY, 0.25);
        g.fillRect(0, pipeY1, w, 2);
        // Pipe shadow (bottom edge)
        g.fillStyle(P.DEEP_NAVY, 0.4);
        g.fillRect(0, pipeY1 + 7, w, 1);

        // Second thinner pipe
        const pipeY2 = Math.floor(ch * 0.65);
        g.fillStyle(P.DARK_GREY, 0.7);
        g.fillRect(0, pipeY2, w, 5);
        g.fillStyle(P.LIGHT_GREY, 0.18);
        g.fillRect(0, pipeY2, w, 1);

        // Pipe joints/valves (small rectangles at intervals)
        for (let jx = 80; jx < w; jx += 160) {
            // Joint on pipe 1
            g.fillStyle(P.DARK_GREY, 1);
            g.fillRect(jx - 5, pipeY1 - 2, 10, 12);
            g.fillStyle(P.LIGHT_GREY, 0.3);
            g.fillRect(jx - 5, pipeY1 - 2, 10, 2);
            // Valve handle (small T-shape)
            g.fillStyle(P.BROWN, 0.7);
            g.fillRect(jx - 1, pipeY1 - 5, 2, 4);
            g.fillRect(jx - 4, pipeY1 - 6, 8, 2);

            // Joint on pipe 2
            g.fillStyle(P.DARK_GREY, 0.9);
            g.fillRect(jx + 40 - 3, pipeY2 - 1, 6, 7);
            g.fillStyle(P.LIGHT_GREY, 0.2);
            g.fillRect(jx + 40 - 3, pipeY2 - 1, 6, 1);
        }

        // Vertical connector pipes between pipe1 and pipe2
        for (let cx = 200; cx < w; cx += 300) {
            g.fillStyle(P.DARK_GREY, 0.6);
            g.fillRect(cx, pipeY1 + 8, 4, pipeY2 - pipeY1 - 8);
            g.fillStyle(P.LIGHT_GREY, 0.12);
            g.fillRect(cx, pipeY1 + 8, 1, pipeY2 - pipeY1 - 8);
        }
    }

    // =========================================================================
    // CEILING LIGHTS - overhead lamps with triangular glow cones
    // =========================================================================
    drawCeilingLights(w, h) {
        // Skip if bg_corridor PNG handles brackets/bulbs
        if (this.textures.exists('bg_corridor')) return;
        const g = this.add.graphics().setDepth(1);
        const P = this.P;
        const ch = this.CEILING_H;
        const floorY = this.FLOOR_Y;
        const numLights = 4;
        const spacing = w / (numLights + 1);

        for (let i = 0; i < numLights; i++) {
            const lx = Math.floor(spacing * (i + 1));

            // Light fixture (bracket)
            g.fillStyle(P.DARK_GREY, 0.95);
            g.fillRect(lx - 14, ch - 4, 28, 6);
            g.fillStyle(P.LIGHT_GREY, 0.3);
            g.fillRect(lx - 14, ch - 4, 28, 2);

            // Bulb (bright rectangle)
            g.fillStyle(P.YELLOW, 0.15);
            g.fillRect(lx - 8, ch + 2, 16, 4);
            g.fillStyle(P.WHITE, 0.3);
            g.fillRect(lx - 6, ch + 2, 12, 3);

            // Triangular glow cone (using graduated rectangles getting wider)
            const coneTop = ch + 6;
            const coneBottom = floorY - 10;
            const coneHeight = coneBottom - coneTop;
            const steps = 8;
            for (let s = 0; s < steps; s++) {
                const ratio = s / steps;
                const cy = coneTop + ratio * coneHeight;
                const halfW = 8 + ratio * 65;
                const alpha = 0.025 * (1 - ratio * 0.7);
                g.fillStyle(P.WHITE, alpha);
                g.fillRect(lx - halfW, cy, halfW * 2, coneHeight / steps + 1);
            }

            // Warm inner glow (narrower, slightly brighter)
            for (let s = 0; s < 5; s++) {
                const ratio = s / 5;
                const cy = coneTop + ratio * coneHeight * 0.6;
                const halfW = 4 + ratio * 30;
                g.fillStyle(P.YELLOW, 0.015 * (1 - ratio));
                g.fillRect(lx - halfW, cy, halfW * 2, coneHeight * 0.15);
            }
        }
    }

    // =========================================================================
    // FLOOR - metal plating with grid, bolts, drainage grate
    // =========================================================================
    drawFloor(w, h) {
        const g = this.add.graphics().setDepth(0);
        const P = this.P;
        const floorY = this.FLOOR_Y;
        const floorH = this.FLOOR_H;

        // Floor base gradient (darker towards bottom)
        for (let y = floorY; y < h; y++) {
            const ratio = (y - floorY) / floorH;
            const v = Math.floor(Phaser.Math.Linear(0x40, 0x25, ratio));
            g.fillStyle(Phaser.Display.Color.GetColor(v - 3, v + 2, v + 8), 1);
            g.fillRect(0, y, w, 1);
        }

        // Alternating floor tile colors for visible tile pattern
        let tileRow = 0;
        for (let fy = floorY + 2; fy < h; fy += 16) {
            let tileCol = 0;
            for (let fx = 0; fx < w; fx += 40) {
                const isEven = (tileRow + tileCol) % 2 === 0;
                g.fillStyle(isEven ? P.MED_BLUE : P.DARK_BLUE, isEven ? 0.08 : 0.06);
                g.fillRect(fx, fy, 40, 16);
                tileCol++;
            }
            tileRow++;
        }

        // Checkerboard tiles
        const tileSize = 40;
        for (let fx = 0; fx < w; fx += tileSize) {
            for (let fy = floorY; fy < h; fy += tileSize / 2) {
                const checker = ((Math.floor(fx / tileSize) + Math.floor((fy - floorY) / (tileSize / 2))) % 2 === 0);
                if (checker) {
                    g.fillStyle(0xfff1e8, 0.04);
                    g.fillRect(fx, fy, tileSize, tileSize / 2);
                }
            }
        }

        // Grid lines (more visible)
        g.lineStyle(1, P.MED_BLUE, 0.35);
        // Horizontal grid
        for (let fy = floorY + 16; fy < h; fy += 16) {
            g.lineBetween(0, fy, w, fy);
        }
        // Vertical grid
        for (let fx = 0; fx < w; fx += 40) {
            g.lineBetween(fx, floorY + 2, fx, h);
        }

        // Perspective depth lines converging to vanishing point
        const vpX = w / 2;
        const vpY = floorY - 20;
        g.lineStyle(1, P.MED_BLUE, 0.08);
        for (let fx = 0; fx < w; fx += 80) {
            g.beginPath();
            g.moveTo(fx, h);
            g.lineTo(vpX + (fx - vpX) * 0.3, floorY + 2);
            g.strokePath();
        }

        // Floor bolts at grid intersections
        g.fillStyle(P.LIGHT_GREY, 0.12);
        for (let fx = 20; fx < w; fx += 80) {
            for (let fy = floorY + 8; fy < h; fy += 32) {
                g.fillRect(fx, fy, 2, 2);
                g.fillStyle(P.WHITE, 0.06);
                g.fillRect(fx, fy, 1, 1);
                g.fillStyle(P.LIGHT_GREY, 0.12);
            }
        }

        // Drainage grate (near center-right of corridor)
        const grateX = Math.floor(w * 0.72);
        const grateY = floorY + 20;
        const grateW = 48;
        const grateH = 24;
        g.fillStyle(P.DEEP_NAVY, 0.8);
        g.fillRect(grateX, grateY, grateW, grateH);
        g.lineStyle(1, P.DARK_GREY, 0.6);
        g.strokeRect(grateX, grateY, grateW, grateH);
        // Grate slots
        for (let sx = grateX + 4; sx < grateX + grateW - 2; sx += 6) {
            g.fillStyle(0x050e18, 0.9);
            g.fillRect(sx, grateY + 3, 3, grateH - 6);
        }

        // Floor reflections under ceiling lights
        const numLights = 4;
        const spacing = w / (numLights + 1);
        for (let i = 0; i < numLights; i++) {
            const lx = Math.floor(spacing * (i + 1));
            g.fillStyle(P.BRIGHT_BLUE, 0.015);
            g.fillRect(lx - 35, floorY + 2, 70, floorH);
        }

        // Subtle wear marks / scuff marks
        g.fillStyle(P.DARK_GREY, 0.06);
        g.fillRect(w * 0.15, floorY + 6, 30, 3);
        g.fillRect(w * 0.45, floorY + 10, 20, 2);
        g.fillRect(w * 0.82, floorY + 4, 25, 3);

        // Baseboard / wall-floor trim
        g.fillStyle(P.DARK_GREY, 0.8);
        g.fillRect(0, floorY, w, 4);
        g.fillStyle(P.LIGHT_GREY, 0.15);
        g.fillRect(0, floorY, w, 1);
        g.fillStyle(P.DEEP_NAVY, 0.4);
        g.fillRect(0, floorY + 3, w, 1);

        // Bright wall-floor edge
        g.fillStyle(0x29adff, 0.15);
        g.fillRect(0, floorY - 1, w, 2);
    }

    // =========================================================================
    // PORTHOLE - round window showing stormy ocean
    // =========================================================================
    createPorthole(w, h) {
        const g = this.add.graphics().setDepth(2);
        const P = this.P;

        // Position between door 2 and 3 area
        const px = Math.floor(w * 0.5);
        const py = Math.floor(this.WALL_TOP + (this.FLOOR_Y - this.WALL_TOP) * 0.28);
        const radius = 30;

        // Outer metal frame ring
        g.fillStyle(P.DARK_GREY, 1);
        g.fillCircle(px, py, radius + 8);
        // Inner bevel
        g.fillStyle(P.BROWN, 0.5);
        g.fillCircle(px, py, radius + 5);
        // Frame highlight (top)
        g.fillStyle(P.LIGHT_GREY, 0.15);
        g.fillRect(px - radius - 2, py - radius - 6, (radius + 2) * 2, 3);

        // Dark stormy sky through porthole
        g.fillStyle(P.DEEP_NAVY, 1);
        g.fillCircle(px, py, radius);

        // Storm clouds (dark bluish blobs)
        g.fillStyle(P.DARK_BLUE, 0.8);
        g.fillCircle(px - 10, py - 12, 12);
        g.fillCircle(px + 8, py - 8, 10);
        g.fillCircle(px - 5, py - 6, 8);

        // Ocean (bottom half clipped by porthole)
        g.fillStyle(P.DARK_BLUE, 0.9);
        g.fillRect(px - radius, py + 2, radius * 2, radius);
        // Wave highlights
        g.fillStyle(P.MED_BLUE, 0.3);
        g.fillRect(px - 18, py + 2, 36, 3);
        g.fillStyle(P.CYAN, 0.1);
        g.fillRect(px - 12, py + 2, 24, 1);

        // Rain streaks
        g.lineStyle(1, P.CYAN, 0.15);
        for (let i = 0; i < 6; i++) {
            const rx = px - radius + 8 + Phaser.Math.Between(0, radius * 2 - 16);
            const ry = py - radius + 6;
            g.lineBetween(rx, ry, rx - 2, ry + 10 + Phaser.Math.Between(0, 8));
        }

        // Frame bolts (8 around edge)
        g.fillStyle(P.LIGHT_GREY, 0.35);
        for (let a = 0; a < 8; a++) {
            const angle = (a / 8) * Math.PI * 2;
            const bx = px + Math.cos(angle) * (radius + 5);
            const by = py + Math.sin(angle) * (radius + 5);
            g.fillRect(Math.floor(bx) - 1, Math.floor(by) - 1, 3, 3);
        }

        // Glass reflection
        g.fillStyle(P.WHITE, 0.06);
        g.fillCircle(px - 8, py - 8, 8);

        this.portholeX = px;
        this.portholeY = py;
        this.portholeRadius = radius;
    }

    // =========================================================================
    // NOTICE BOARD - cork board with "AURORA" and pinned notes
    // =========================================================================
    createNoticeBoard(w, h) {
        const g = this.add.graphics().setDepth(2);
        const P = this.P;

        // Position between porthole and a door
        const nx = Math.floor(w * 0.5);
        const ny = Math.floor(this.WALL_TOP + (this.FLOOR_Y - this.WALL_TOP) * 0.62);
        const bw = 70, bh = 44;

        // Cork board background
        g.fillStyle(P.BROWN, 0.65);
        g.fillRect(nx - bw / 2, ny - bh / 2, bw, bh);
        // Wood frame
        g.lineStyle(2, P.DARK_GREY, 0.9);
        g.strokeRect(nx - bw / 2, ny - bh / 2, bw, bh);
        // Inner frame highlight
        g.lineStyle(1, P.BROWN, 0.3);
        g.strokeRect(nx - bw / 2 + 2, ny - bh / 2 + 2, bw - 4, bh - 4);

        // AURORA header text
        this.add.text(nx, ny - 10, 'AURORA', {
            fontFamily: this.pixelFont,
            fontSize: '10px',
            color: '#fff1e8'
        }).setOrigin(0.5).setDepth(3);

        // Pinned notes (colored rectangles)
        // Note 1 (yellow, tilted)
        g.fillStyle(P.YELLOW, 0.6);
        g.fillRect(nx - 22, ny + 2, 16, 12);
        g.fillStyle(P.RED, 0.8);
        g.fillCircle(nx - 14, ny + 2, 2); // pin

        // Note 2 (white)
        g.fillStyle(P.WHITE, 0.4);
        g.fillRect(nx + 6, ny, 18, 14);
        g.fillStyle(P.RED, 0.8);
        g.fillCircle(nx + 15, ny, 2); // pin

        // Note 3 (blue, small)
        g.fillStyle(P.BRIGHT_BLUE, 0.35);
        g.fillRect(nx - 6, ny + 4, 10, 8);
        g.fillStyle(P.ORANGE, 0.8);
        g.fillCircle(nx - 1, ny + 4, 2); // pin
    }

    // =========================================================================
    // ATMOSPHERIC DETAILS - dust particles, steam, emergency pulse
    // =========================================================================
    drawAtmosphericDetails(w, h) {
        const P = this.P;

        // Steam puffs from pipe joints
        const steamPositions = [80, 240, 400, w - 120];
        steamPositions.forEach(sx => {
            if (sx < w) {
                this.add.particles(sx, this.CEILING_H + 2, 'particle_dot', {
                    speedY: { min: -12, max: -4 },
                    speedX: { min: -4, max: 4 },
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 0.18, end: 0 },
                    lifespan: 1800,
                    frequency: 3000,
                    tint: P.LIGHT_GREY,
                    quantity: 2
                });
            }
        });

        // Floating dust particles in light cones
        this.add.particles(0, 0, 'particle_dot', {
            x: { min: 0, max: w },
            y: { min: this.WALL_TOP, max: this.FLOOR_Y },
            speedX: { min: -2, max: 2 },
            speedY: { min: -1, max: 1 },
            scale: { min: 0.04, max: 0.12 },
            alpha: { start: 0.12, end: 0 },
            lifespan: 7000,
            frequency: 600,
            tint: P.WHITE,
            blendMode: 'ADD'
        });

        // Emergency red pulse on edges
        this.emergencyGfx = this.add.graphics().setDepth(1).setAlpha(0);
        this.emergencyGfx.fillStyle(P.RED, 0.06);
        this.emergencyGfx.fillRect(0, 0, 40, h);
        this.emergencyGfx.fillRect(w - 40, 0, 40, h);
        // Gradient fade for the pulse
        for (let i = 0; i < 20; i++) {
            const alpha = 0.04 * (1 - i / 20);
            this.emergencyGfx.fillStyle(P.RED, alpha);
            this.emergencyGfx.fillRect(40 + i * 3, 0, 3, h);
            this.emergencyGfx.fillRect(w - 40 - (i + 1) * 3, 0, 3, h);
        }
        this.tweens.add({
            targets: this.emergencyGfx,
            alpha: 1,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // =========================================================================
    // DOOR - large, detailed metal doors with all the trimmings
    // =========================================================================
    createDoor(room, index) {
        const I18N = window.I18N;
        const t = (key) => I18N ? I18N.t(key) : key;
        const GS = window.GameState;
        const w = this.W;
        const h = this.H;
        const isRTL = this.isRTL;
        const P = this.P;

        const doorX = room.x;
        const doorW = 120;
        const doorH = 180;
        const floorY = this.FLOOR_Y;
        const dTop = floorY - doorH;

        const doorContainer = this.add.container(0, 0).setDepth(3);

        const doorGfx = this.add.graphics();

        // ---- DOOR FRAME (outer) ----
        doorGfx.fillStyle(P.DARK_GREY, 1);
        doorGfx.fillRect(doorX - doorW / 2 - 8, dTop - 8, doorW + 16, doorH + 8);
        // Frame highlights
        doorGfx.fillStyle(P.LIGHT_GREY, 0.2);
        doorGfx.fillRect(doorX - doorW / 2 - 8, dTop - 8, doorW + 16, 2);   // top
        doorGfx.fillRect(doorX - doorW / 2 - 8, dTop - 8, 2, doorH + 8);     // left
        // Frame shadow
        doorGfx.fillStyle(P.DEEP_NAVY, 0.3);
        doorGfx.fillRect(doorX + doorW / 2 + 6, dTop - 6, 2, doorH + 6);     // right
        doorGfx.fillRect(doorX - doorW / 2 - 6, floorY - 2, doorW + 12, 2);  // bottom

        // ---- DOOR SURFACE ----
        if (room.available) {
            // Gradient for unlocked door (mid-blue)
            for (let y = 0; y < doorH; y++) {
                const ratio = y / doorH;
                const r = Math.floor(Phaser.Math.Linear(0x30, 0x22, ratio));
                const gg = Math.floor(Phaser.Math.Linear(0x50, 0x3a, ratio));
                const b = Math.floor(Phaser.Math.Linear(0x78, 0x58, ratio));
                doorGfx.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
                doorGfx.fillRect(doorX - doorW / 2, dTop + y, doorW, 1);
            }
        } else {
            // Darker for locked door
            doorGfx.fillStyle(P.DARK_BLUE, 0.95);
            doorGfx.fillRect(doorX - doorW / 2, dTop, doorW, doorH);
        }

        // ---- UPPER PANEL INSET ----
        const upperPanelY = dTop + 8;
        const upperPanelH = doorH * 0.4;
        doorGfx.lineStyle(1, P.DARK_GREY, 0.5);
        doorGfx.strokeRect(doorX - doorW / 2 + 8, upperPanelY, doorW - 16, upperPanelH);
        // Inset shadow
        doorGfx.fillStyle(P.DEEP_NAVY, 0.15);
        doorGfx.fillRect(doorX - doorW / 2 + 9, upperPanelY + 1, doorW - 18, 1);
        doorGfx.fillRect(doorX - doorW / 2 + 9, upperPanelY + 1, 1, upperPanelH - 2);

        // ---- PORTHOLE WINDOW in upper panel ----
        const windowY = upperPanelY + upperPanelH * 0.45;
        const windowR = 20;
        if (room.available) {
            // Window frame
            doorGfx.fillStyle(P.DARK_GREY, 0.8);
            doorGfx.fillCircle(doorX, windowY, windowR + 3);
            // Glass (bright cyan/blue)
            doorGfx.fillStyle(P.BRIGHT_BLUE, 0.35);
            doorGfx.fillCircle(doorX, windowY, windowR);
            doorGfx.fillStyle(P.CYAN, 0.2);
            doorGfx.fillCircle(doorX, windowY, windowR - 3);
            // Glass reflection
            doorGfx.fillStyle(P.WHITE, 0.12);
            doorGfx.fillCircle(doorX - 3, windowY - 3, 4);
        } else {
            // Dim window for locked
            doorGfx.fillStyle(P.DARK_GREY, 0.6);
            doorGfx.fillCircle(doorX, windowY, windowR + 3);
            doorGfx.fillStyle(P.DEEP_NAVY, 0.8);
            doorGfx.fillCircle(doorX, windowY, windowR);
        }

        // ---- LOWER PANEL INSET ----
        const lowerPanelY = dTop + doorH * 0.52;
        const lowerPanelH = doorH * 0.38;
        doorGfx.lineStyle(1, P.DARK_GREY, 0.5);
        doorGfx.strokeRect(doorX - doorW / 2 + 8, lowerPanelY, doorW - 16, lowerPanelH);
        doorGfx.fillStyle(P.DEEP_NAVY, 0.12);
        doorGfx.fillRect(doorX - doorW / 2 + 9, lowerPanelY + 1, doorW - 18, 1);

        // ---- CENTER DIVIDER LINE ----
        doorGfx.lineStyle(1, P.DARK_GREY, 0.3);
        doorGfx.lineBetween(doorX, dTop + 6, doorX, dTop + doorH - 6);

        // ---- DOOR HANDLE ----
        const handleSide = isRTL ? -1 : 1;
        const handleX = doorX + handleSide * (doorW / 2 - 14);
        const handleY = dTop + doorH * 0.52;
        // Handle plate
        doorGfx.fillStyle(P.LIGHT_GREY, 0.7);
        doorGfx.fillRect(handleX - 3, handleY - 2, 6, 16);
        // Handle knob
        doorGfx.fillStyle(P.WHITE, 0.3);
        doorGfx.fillRect(handleX - 4, handleY + 3, 8, 6);
        // Highlight
        doorGfx.fillStyle(P.WHITE, 0.15);
        doorGfx.fillRect(handleX - 4, handleY + 3, 8, 2);

        doorContainer.add(doorGfx);

        // ---- STATUS LIGHT above door ----
        const lightY = dTop - 16;
        const lightColor = room.available ? P.GREEN : P.RED;

        const lightGfx = this.add.graphics().setDepth(4);
        // Glow halo
        lightGfx.fillStyle(lightColor, 0.1);
        lightGfx.fillCircle(doorX, lightY, 16);
        lightGfx.fillStyle(lightColor, 0.2);
        lightGfx.fillCircle(doorX, lightY, 10);
        // Light body
        lightGfx.fillStyle(lightColor, 0.7);
        lightGfx.fillCircle(doorX, lightY, 6);
        // Bright center
        lightGfx.fillStyle(lightColor, 1);
        lightGfx.fillCircle(doorX, lightY, 3);

        // Pulsing glow for the status light
        if (room.available) {
            this.tweens.add({
                targets: lightGfx,
                alpha: { from: 0.7, to: 1 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ---- PADLOCK ICON for locked doors ----
        if (!room.available) {
            const lockG = this.add.graphics().setDepth(5);
            const lx = doorX;
            const ly = dTop + doorH * 0.5 - 10;
            // Lock body
            lockG.fillStyle(P.ORANGE, 0.85);
            lockG.fillRect(lx - 9, ly, 18, 14);
            // Lock shackle (U-shape drawn with rects)
            lockG.lineStyle(2, P.ORANGE, 0.85);
            lockG.beginPath();
            lockG.moveTo(lx - 5, ly);
            lockG.lineTo(lx - 5, ly - 7);
            lockG.lineTo(lx + 5, ly - 7);
            lockG.lineTo(lx + 5, ly);
            lockG.strokePath();
            // Keyhole
            lockG.fillStyle(P.DEEP_NAVY, 1);
            lockG.fillCircle(lx, ly + 5, 3);
            lockG.fillRect(lx - 1, ly + 7, 2, 4);
            room._lockGfx = lockG;
        }

        // ---- ROOM NAME LABEL (metal nameplate below door) ----
        const labelFontSize = this._getFontSize(14);
        const labelFont = this._getFont();
        const labelRTL = isRTL ? { rtl: true } : {};
        let labelStr = t(room.labelKey);
        if (isRTL && I18N && I18N.fixRTL) labelStr = I18N.fixRTL(labelStr);

        // Metal nameplate background
        const npGfx = this.add.graphics().setDepth(4);
        const npW = Math.max(70, labelStr.length * 7 + 16);
        const npH = 32;
        const npX = doorX - npW / 2;
        const npY = floorY + 6;
        npGfx.fillStyle(P.DARK_BLUE, 0.9);
        npGfx.fillRect(npX, npY, npW, npH);
        npGfx.lineStyle(1, P.DARK_GREY, 0.7);
        npGfx.strokeRect(npX, npY, npW, npH);
        // Nameplate highlight
        npGfx.fillStyle(P.MED_BLUE, 0.2);
        npGfx.fillRect(npX + 1, npY + 1, npW - 2, 1);
        // Screws on nameplate
        npGfx.fillStyle(P.LIGHT_GREY, 0.3);
        npGfx.fillRect(npX + 3, npY + npH / 2 - 1, 2, 2);
        npGfx.fillRect(npX + npW - 5, npY + npH / 2 - 1, 2, 2);

        // Label shadow
        const labelShadow = this.add.text(doorX + 1, npY + npH / 2 + 1, labelStr, Object.assign({
            fontFamily: labelFont,
            fontSize: labelFontSize,
            color: '#0d1b2a',
            align: 'center'
        }, labelRTL)).setOrigin(0.5).setDepth(5);

        // Label text
        const label = this.add.text(doorX, npY + npH / 2, labelStr, Object.assign({
            fontFamily: labelFont,
            fontSize: labelFontSize,
            color: room.available ? '#fff1e8' : '#5f574f',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }, labelRTL)).setOrigin(0.5).setDepth(6);

        // ---- QUEST INDICATOR ("!" or "?" floating above door) ----
        let questMark = null;
        if (room.available && window.QuestSystem) {
            const roomQuests = window.QuestSystem.getQuestsByRoom ? window.QuestSystem.getQuestsByRoom(room.key) : [];
            const hasAvailable = roomQuests.some(q => q.status === 'available');
            const hasActive = roomQuests.some(q => q.status === 'active');

            if (hasAvailable) {
                // "!" shadow
                this.add.text(doorX + 1, dTop - 31, '!', {
                    fontFamily: this.pixelFont,
                    fontSize: '24px',
                    color: '#0d1b2a'
                }).setOrigin(0.5).setDepth(7);

                questMark = this.add.text(doorX, dTop - 32, '!', {
                    fontFamily: this.pixelFont,
                    fontSize: '24px',
                    color: '#ffec27'
                }).setOrigin(0.5).setDepth(8);

                this.tweens.add({
                    targets: questMark,
                    y: questMark.y - 8,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else if (hasActive) {
                const qm = this.add.text(doorX, dTop - 32, '?', {
                    fontFamily: this.pixelFont,
                    fontSize: '24px',
                    color: '#29adff'
                }).setOrigin(0.5).setDepth(8);

                this.tweens.add({
                    targets: qm,
                    y: qm.y - 6,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // ---- FIRST VISIT: Glowing green arrow at Lab door ----
        if (this.isFirstVisit && room.key === 'lab') {
            // Pulsing green glow around door
            const glowPulse = this.add.graphics().setDepth(2).setAlpha(0);
            glowPulse.fillStyle(P.GREEN, 0.08);
            glowPulse.fillRect(doorX - doorW / 2 - 14, dTop - 14, doorW + 28, doorH + 28);
            glowPulse.fillStyle(P.GREEN, 0.04);
            glowPulse.fillRect(doorX - doorW / 2 - 20, dTop - 20, doorW + 40, doorH + 40);

            this.tweens.add({
                targets: glowPulse,
                alpha: 1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Bouncing down-arrow
            const arrowY = dTop - 44;
            const arrowText = this.add.text(doorX, arrowY, '\u25BC', {
                fontFamily: this.pixelFont,
                fontSize: '16px',
                color: '#00e436'
            }).setOrigin(0.5).setDepth(9);

            this.tweens.add({
                targets: arrowText,
                y: arrowY + 10,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ---- INTERACTIVITY ----
        const hitZone = this.add.zone(doorX, dTop + doorH / 2, doorW + 24, doorH + 30)
            .setInteractive({ useHandCursor: room.available })
            .setDepth(10);

        // Hover highlight overlay
        const hoverGfx = this.add.graphics().setDepth(4).setAlpha(0);
        if (room.available) {
            hoverGfx.lineStyle(2, P.CYAN, 0.6);
            hoverGfx.strokeRect(doorX - doorW / 2 - 2, dTop - 2, doorW + 4, doorH + 4);
            hoverGfx.fillStyle(P.CYAN, 0.06);
            hoverGfx.fillRect(doorX - doorW / 2, dTop, doorW, doorH);
        } else {
            hoverGfx.lineStyle(2, P.RED, 0.4);
            hoverGfx.strokeRect(doorX - doorW / 2 - 2, dTop - 2, doorW + 4, doorH + 4);
            hoverGfx.fillStyle(P.RED, 0.04);
            hoverGfx.fillRect(doorX - doorW / 2, dTop, doorW, doorH);
        }

        hitZone.on('pointerover', () => {
            this.tweens.add({ targets: hoverGfx, alpha: 1, duration: 150 });
            if (room.available) {
                label.setColor('#ffec27');
            }
            if (window.AudioManager) window.AudioManager.playSFX('hover');
        });

        hitZone.on('pointerout', () => {
            this.tweens.add({ targets: hoverGfx, alpha: 0, duration: 150 });
            label.setColor(room.available ? '#fff1e8' : '#5f574f');
        });

        hitZone.on('pointerdown', () => {
            if (room.available) {
                if (window.AudioManager) window.AudioManager.playSFX('click');
                this.showDoorBriefing(room, doorX, dTop, doorW, doorH);
            } else {
                // Shake animation + red flash
                if (window.AudioManager) window.AudioManager.playSFX('buzz');

                // Brief red flash on door
                const redFlash = this.add.graphics().setDepth(12);
                redFlash.fillStyle(P.RED, 0.3);
                redFlash.fillRect(doorX - doorW / 2, dTop, doorW, doorH);
                this.tweens.add({
                    targets: redFlash,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => redFlash.destroy()
                });

                // Shake the door graphics
                this.tweens.add({
                    targets: doorGfx,
                    x: { from: -4, to: 4 },
                    duration: 50,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => { doorGfx.x = 0; }
                });
                if (room._lockGfx) {
                    this.tweens.add({
                        targets: room._lockGfx,
                        x: { from: -4, to: 4 },
                        duration: 50,
                        yoyo: true,
                        repeat: 4,
                        onComplete: () => { room._lockGfx.x = 0; }
                    });
                }
            }
        });

        // Entrance stagger animation
        doorGfx.setAlpha(0);
        label.setAlpha(0);
        labelShadow.setAlpha(0);
        npGfx.setAlpha(0);
        lightGfx.setAlpha(0);

        this.tweens.add({
            targets: [doorGfx, label, npGfx, lightGfx],
            alpha: 1,
            duration: 400,
            delay: 200 + index * 140,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: labelShadow,
            alpha: 0.5,
            duration: 400,
            delay: 200 + index * 140,
            ease: 'Power2'
        });

        this.doors.push({ room, doorGfx, label, hitZone, hoverGfx });
    }

    // =========================================================================
    // DOOR BRIEFING POPUP
    // =========================================================================
    showDoorBriefing(room, doorX, dTop, doorW, doorH) {
        // Dismiss any existing briefing
        if (this._briefingGroup) {
            this._briefingGroup.forEach(el => { if (el && el.destroy) el.destroy(); });
            this._briefingGroup = null;
        }

        const P = this.P;
        const w = this.W;
        const h = this.H;
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const isRTL = window.I18N ? window.I18N.isRTL() : false;
        const fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';

        const descs = {
            lab: t('hub_brief_lab') || 'Measure Earth\'s magnetic field with the galvanometer',
            navigation: t('hub_brief_nav') || 'Diagnose the error that caused navigation failure',
            research: t('hub_brief_research') || 'Discover the source of Earth\'s magnetic field',
            bridge: t('hub_brief_bridge') || 'Recalibrate navigation and save the ship'
        };

        const icons = { lab: '\u2697', navigation: '\u2699', research: '\u2668', bridge: '\u2693' };

        // Dim overlay
        const dimOverlay = this.add.graphics().setDepth(50);
        dimOverlay.fillStyle(0x000000, 0.5);
        dimOverlay.fillRect(0, 0, w, h);
        dimOverlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

        // Panel
        const panelW = 360;
        const panelH = 130;
        const panelX = Math.round(w / 2 - panelW / 2);
        const panelY = Math.round(h / 2 - panelH / 2 - 20);

        const panel = this.add.graphics().setDepth(51);
        panel.fillStyle(P.DEEP_NAVY, 0.97);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        panel.lineStyle(2, P.CYAN, 0.6);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
        // Top accent line
        panel.fillStyle(P.CYAN, 0.3);
        panel.fillRect(panelX + 10, panelY, panelW - 20, 3);

        // Icon + Room name
        const roomName = t(room.labelKey);
        const icon = icons[room.key] || '';
        this.add.text(w / 2, panelY + 24, icon + '  ' + roomName, {
            fontFamily: fontFamily + ', monospace',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#53d8fb',
            stroke: '#000000',
            strokeThickness: 4,
            rtl: isRTL
        }).setOrigin(0.5).setDepth(52);

        // Description
        this.add.text(w / 2, panelY + 58, descs[room.key], {
            fontFamily: fontFamily + ', monospace',
            fontSize: '13px',
            color: '#c2c3c7',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: panelW - 40, useAdvancedWrap: true },
            align: 'center',
            rtl: isRTL
        }).setOrigin(0.5).setDepth(52);

        // Enter button
        const btnW = 140;
        const btnH = 30;
        const btnX = w / 2;
        const btnY = panelY + panelH - 22;

        const btnGfx = this.add.graphics().setDepth(52);
        btnGfx.fillStyle(P.MED_BLUE, 0.9);
        btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        btnGfx.lineStyle(1, P.CYAN, 0.7);
        btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);

        const btnLabel = this.add.text(btnX, btnY, t('hub_enter_btn') || 'Enter', {
            fontFamily: fontFamily + ', monospace',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fff1e8',
            stroke: '#000000',
            strokeThickness: 2,
            rtl: isRTL
        }).setOrigin(0.5).setDepth(53);

        const btnZone = this.add.zone(btnX, btnY, btnW, Math.max(btnH, 44))
            .setInteractive({ useHandCursor: true }).setDepth(54);

        btnZone.on('pointerover', () => {
            btnGfx.clear();
            btnGfx.fillStyle(P.BRIGHT_BLUE, 0.4);
            btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
            btnGfx.lineStyle(2, P.CYAN, 1);
            btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        btnZone.on('pointerout', () => {
            btnGfx.clear();
            btnGfx.fillStyle(P.MED_BLUE, 0.9);
            btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
            btnGfx.lineStyle(1, P.CYAN, 0.7);
            btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });

        // Collect all elements for cleanup
        const allElements = [dimOverlay, panel, btnGfx, btnLabel, btnZone];
        // Add text objects (they were created inline via this.add.text)
        this.children.list.filter(c => c.depth >= 52 && c.type === 'Text').forEach(c => allElements.push(c));
        this._briefingGroup = allElements;

        // Enter button — go to room
        btnZone.on('pointerdown', () => {
            if (window.AudioManager) window.AudioManager.playSFX('door_open');
            allElements.forEach(el => { if (el && el.destroy) el.destroy(); });
            this._briefingGroup = null;

            // Flash and transition
            const flash = this.add.graphics().setDepth(12);
            flash.fillStyle(P.WHITE, 0.5);
            flash.fillRect(doorX - doorW / 2, dTop, doorW, doorH);
            this.tweens.add({
                targets: flash, alpha: 0, duration: 300,
                onComplete: () => flash.destroy()
            });
            this.cameras.main.fadeOut(500, 13, 27, 42);
            this.time.delayedCall(500, () => {
                if (window.AudioManager) window.AudioManager.stopAllAmbient();
                this.scene.start(room.scene);
            });
        });

        // Click overlay to dismiss (cancel)
        dimOverlay.on('pointerdown', () => {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            allElements.forEach(el => { if (el && el.destroy) el.destroy(); });
            this._briefingGroup = null;
        });
    }

    // =========================================================================
    // HUD - top bar with timer, objective, evidence count
    // =========================================================================
    createHUD(w, h) {
        const I18N = window.I18N;
        const t = (key) => I18N ? I18N.t(key) : key;
        const GS = window.GameState;
        const isRTL = this.isRTL;
        const P = this.P;

        const hudHeight = 42;
        const hud = this.add.graphics().setDepth(20);

        // Semi-transparent dark bar
        hud.fillStyle(P.DEEP_NAVY, 0.92);
        hud.fillRect(0, 0, w, hudHeight);
        // Bottom border accent
        hud.fillStyle(P.MED_BLUE, 0.5);
        hud.fillRect(0, hudHeight - 2, w, 2);
        // Subtle inner line
        hud.fillStyle(P.DARK_BLUE, 0.4);
        hud.fillRect(0, hudHeight - 4, w, 1);

        // ---- LEFT: Clock icon + timer ----
        const timerSide = isRTL ? w - 14 : 14;

        // Clock icon
        this.add.image(timerSide, hudHeight / 2, 'icon_clock')
            .setScale(1.2).setDepth(21).setTint(P.RED);

        const timeStr = GS ? GS.formatTime() : '6:00';
        const timerTextX = timerSide + (isRTL ? -22 : 22);

        // Timer shadow
        this.add.text(timerTextX + 1, hudHeight / 2 + 1, timeStr, {
            fontFamily: this.pixelFont,
            fontSize: '14px',
            color: '#0d1b2a'
        }).setOrigin(isRTL ? 1 : 0, 0.5).setDepth(21);

        // Timer text (RED, large)
        const timerText = this.add.text(timerTextX, hudHeight / 2, timeStr, {
            fontFamily: this.pixelFont,
            fontSize: '14px',
            color: '#ff004d'
        }).setOrigin(isRTL ? 1 : 0, 0.5).setDepth(22);

        // Subtle pulse on timer
        this.tweens.add({
            targets: timerText,
            alpha: { from: 1, to: 0.6 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ---- RIGHT: Magnifying glass icon + evidence count ----
        const evidenceSide = isRTL ? 14 : w - 14;
        const evidenceCount = GS ? GS.evidence.length : 0;
        const evidenceStr = evidenceCount + '/12';

        // Evidence icon
        this.add.image(evidenceSide + (isRTL ? 50 : -50), hudHeight / 2, 'icon_evidence')
            .setScale(1.2).setDepth(21).setTint(P.CYAN);

        // Evidence shadow
        this.add.text(evidenceSide + 1, hudHeight / 2 + 1, evidenceStr, {
            fontFamily: this.pixelFont,
            fontSize: '12px',
            color: '#0d1b2a'
        }).setOrigin(isRTL ? 0 : 1, 0.5).setDepth(21);

        // Evidence text (CYAN)
        this.add.text(evidenceSide, hudHeight / 2, evidenceStr, {
            fontFamily: this.pixelFont,
            fontSize: '12px',
            color: '#53d8fb'
        }).setOrigin(isRTL ? 0 : 1, 0.5).setDepth(22);

        // ---- CENTER: Objective text in bordered panel ----
        let objectiveText = t('hub_instruction');
        if (window.QuestSystem && window.QuestSystem.getCurrentQuest) {
            const quest = window.QuestSystem.getCurrentQuest();
            if (quest && quest.titleKey) {
                objectiveText = t(quest.titleKey);
            }
        }

        if (isRTL && I18N && I18N.fixRTL) objectiveText = I18N.fixRTL(objectiveText);

        const objFontSize = this._getFontSize(10);
        const objFont = this._getFont();
        const objRTL = isRTL ? { rtl: true } : {};

        // Objective panel background
        const objBoxW = Math.min(w * 0.45, 300);
        const objBoxH = 26;
        const objBoxX = w / 2 - objBoxW / 2;
        const objBoxY = (hudHeight - objBoxH) / 2;

        const objBox = this.add.graphics().setDepth(21);
        objBox.fillStyle(P.DARK_BLUE, 0.75);
        objBox.fillRect(objBoxX, objBoxY, objBoxW, objBoxH);
        // Panel border
        objBox.lineStyle(1, P.MED_BLUE, 0.5);
        objBox.strokeRect(objBoxX, objBoxY, objBoxW, objBoxH);
        // Inner highlight top
        objBox.fillStyle(P.MED_BLUE, 0.15);
        objBox.fillRect(objBoxX + 1, objBoxY + 1, objBoxW - 2, 1);

        // Objective text shadow
        this.add.text(w / 2 + 1, hudHeight / 2 + 1, objectiveText, Object.assign({
            fontFamily: objFont,
            fontSize: objFontSize,
            color: '#0d1b2a',
            align: 'center'
        }, objRTL)).setOrigin(0.5).setDepth(22);

        // Objective text
        this.add.text(w / 2, hudHeight / 2, objectiveText, Object.assign({
            fontFamily: objFont,
            fontSize: objFontSize,
            color: '#fff1e8',
            align: 'center'
        }, objRTL)).setOrigin(0.5).setDepth(23);
    }

    // =========================================================================
    // NPCs - appear near relevant doors based on act
    // =========================================================================
    createNPCs(act, w, h) {
        const I18N = window.I18N;
        const t = (key) => I18N ? I18N.t(key) : key;
        const P = this.P;
        const floorY = this.FLOOR_Y;
        const doorSpacing = w / 5;

        // Navi near Navigation door (act 2+)
        if (act >= 2) {
            const naviX = doorSpacing * 2 + 30;
            const naviY = floorY - 28;

            const navi = this.add.image(naviX, naviY, 'portrait_navi')
                .setScale(3).setDepth(5);

            // Idle bobbing
            this.tweens.add({
                targets: navi,
                y: naviY - 3,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Speech bubble "..."
            const bubbleG = this.add.graphics().setDepth(6);
            const bx = naviX + 20;
            const by = naviY - 44;
            bubbleG.fillStyle(P.WHITE, 0.9);
            bubbleG.fillRect(bx - 14, by - 8, 28, 16);
            bubbleG.fillStyle(P.WHITE, 0.9);
            bubbleG.fillTriangle(bx - 4, by + 8, bx + 4, by + 8, bx, by + 14);
            // Border
            bubbleG.lineStyle(1, P.DARK_GREY, 0.5);
            bubbleG.strokeRect(bx - 14, by - 8, 28, 16);

            const bubbleText = this.add.text(bx, by, '...', {
                fontFamily: this.pixelFont,
                fontSize: '10px',
                color: '#1b2838'
            }).setOrigin(0.5).setDepth(7);

            // Bounce bubble
            this.tweens.add({
                targets: [bubbleG, bubbleText],
                y: '-=3',
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Click NPC for dialog
            const naviZone = this.add.zone(naviX, naviY, 50, 60)
                .setInteractive({ useHandCursor: true }).setDepth(11);
            naviZone.on('pointerdown', () => {
                if (window.AudioManager) window.AudioManager.playSFX('click');
                this.scene.launch('Dialog', {
                    npc: 'navi',
                    messages: [t('navi_intro')],
                    onComplete: () => {}
                });
                this.scene.pause();
            });
        }

        // Geo near Research door (act 3+)
        if (act >= 3) {
            const geoX = doorSpacing * 3 + 30;
            const geoY = floorY - 28;

            const geo = this.add.image(geoX, geoY, 'portrait_geo')
                .setScale(3).setDepth(5);

            this.tweens.add({
                targets: geo,
                y: geoY - 3,
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Speech bubble
            const bubbleG2 = this.add.graphics().setDepth(6);
            const bx2 = geoX + 20;
            const by2 = geoY - 44;
            bubbleG2.fillStyle(P.WHITE, 0.9);
            bubbleG2.fillRect(bx2 - 14, by2 - 8, 28, 16);
            bubbleG2.fillStyle(P.WHITE, 0.9);
            bubbleG2.fillTriangle(bx2 - 4, by2 + 8, bx2 + 4, by2 + 8, bx2, by2 + 14);
            bubbleG2.lineStyle(1, P.DARK_GREY, 0.5);
            bubbleG2.strokeRect(bx2 - 14, by2 - 8, 28, 16);

            const bubbleText2 = this.add.text(bx2, by2, '...', {
                fontFamily: this.pixelFont,
                fontSize: '10px',
                color: '#1b2838'
            }).setOrigin(0.5).setDepth(7);

            this.tweens.add({
                targets: [bubbleG2, bubbleText2],
                y: '-=3',
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const geoZone = this.add.zone(geoX, geoY, 50, 60)
                .setInteractive({ useHandCursor: true }).setDepth(11);
            geoZone.on('pointerdown', () => {
                if (window.AudioManager) window.AudioManager.playSFX('click');
                this.scene.launch('Dialog', {
                    npc: 'geo',
                    messages: [t('geo_intro')],
                    onComplete: () => {}
                });
                this.scene.pause();
            });
        }
    }

    // =========================================================================
    // UPDATE - lightning flashes in porthole
    // =========================================================================
    update(time, delta) {
        this.nextLightning -= delta;
        if (this.nextLightning <= 0) {
            this.nextLightning = Phaser.Math.Between(5000, 14000);
            this.flashLightning();
        }
    }

    flashLightning() {
        const g = this.lightningGfx;
        const P = this.P;
        g.clear();
        const px = this.portholeX;
        const py = this.portholeY;
        const r = this.portholeRadius;

        // Bright flash inside porthole
        g.fillStyle(P.WHITE, 0.6);
        g.fillCircle(px, py, r - 2);

        // Subtle full-screen flash
        g.fillStyle(P.WHITE, 0.03);
        g.fillRect(0, 0, this.W, this.H);

        // Lightning bolt (jagged line drawn with lineTo)
        g.lineStyle(2, P.CYAN, 0.9);
        g.beginPath();
        let lx = px - 8 + Phaser.Math.Between(0, 16);
        let ly = py - r + 4;
        g.moveTo(lx, ly);
        for (let i = 0; i < 5; i++) {
            lx += Phaser.Math.Between(-8, 8);
            ly += Phaser.Math.Between(4, 12);
            g.lineTo(lx, ly);
        }
        g.strokePath();

        // Second thinner bolt
        g.lineStyle(1, P.WHITE, 0.5);
        g.beginPath();
        lx = px + Phaser.Math.Between(-6, 6);
        ly = py - r + 8;
        g.moveTo(lx, ly);
        for (let i = 0; i < 3; i++) {
            lx += Phaser.Math.Between(-6, 6);
            ly += Phaser.Math.Between(4, 10);
            g.lineTo(lx, ly);
        }
        g.strokePath();

        if (window.AudioManager) window.AudioManager.playSFX('thunder');

        this.tweens.add({
            targets: g,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                g.clear();
                g.setAlpha(1);
            }
        });
    }
}

window.ShipHubScene = ShipHubScene;
