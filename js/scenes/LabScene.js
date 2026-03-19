/**
 * LabScene - LucasArts-style point-and-click adventure lab
 * Rich pixel-art lab with 3 phases: Assembly, Experiment, Discovery
 * PICO-8 palette, atmospheric lighting, detailed environment
 */
class LabScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Lab' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.W = w;
        this.H = h;

        const I18N = window.I18N;
        this.t = (key) => I18N ? I18N.t(key) : key;
        this.isRTL = I18N && I18N.isRTL();
        this.pixelFont = "'Press Start 2P'";
        this.rtlFont = I18N ? I18N.getFontFamily() : "'Press Start 2P'";
        this.GS = window.GameState;

        // PICO-8 Palette
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
            BROWN:       0xab5236,
            BLACK:       0x000000,
        };

        if (window.AudioManager) {
            window.AudioManager.playMusic('lab');
            window.AudioManager.startAmbient('lab_hum');
        }

        // Physics constants
        this.MU0 = 4 * Math.PI * 1e-7;
        this.COIL_N = 5;
        this.COIL_R = 0.10;
        this.BH_ACTUAL = 26.5; // uT
        this.currentAmps = 0.5;
        this.measurements = this.GS ? (this.GS.measurements || []) : [];
        this.needleAngle = 0;
        this.phase = 'assembly';

        // Depth layers
        this.DEPTH = {
            BG: 0,
            FURNITURE: 10,
            EQUIPMENT: 20,
            ITEMS: 30,
            UI: 40,
            OVERLAY: 50,
            POPUP: 60
        };

        // Draw the rich lab background
        this.drawLabBackground();

        // Create HUD
        this.createHUD();

        // Determine which phase to show
        const assembled = this.GS && this.GS.galvanometerAssembled;
        const hasMeasurements = this.measurements.length >= 5;

        console.log('[Lab] phase check:', { assembled, hasMeasurements, partsFound: this.GS ? this.GS.labPartsFound : 'no GS' });

        if (!assembled) {
            this.phase = 'assembly';
            try {
                this.createAssemblyPhase();
            } catch (e) {
                console.error('[Lab] Assembly phase error:', e);
            }
        } else if (!hasMeasurements || !(this.GS && this.GS.calculatedBH)) {
            this.phase = 'experiment';
            try {
                this.createExperimentPhase();
            } catch (e) {
                console.error('[Lab] Experiment phase error:', e);
            }
        } else {
            this.phase = 'discovery';
            try {
                this.createDiscoveryPhase();
            } catch (e) {
                console.error('[Lab] Discovery phase error:', e);
            }
        }

        // Intro dialog (first visit only)
        if (this.GS && !this.GS.hasSeenDialog('lab_intro')) {
            this.GS.markDialogSeen('lab_intro');
            this.time.delayedCall(500, () => {
                this.scene.launch('Dialog', {
                    dialogs: [
                        { npc: 'magneta', text: this.t('magneta_intro') },
                        { npc: 'magneta', text: this.t('magneta_explain_galv') }
                    ],
                    onComplete: () => {}
                });
            });
        }
    }

    // =============================================
    // RICH LAB BACKGROUND - LucasArts adventure style
    // =============================================
    drawLabBackground() {
        const w = this.W, h = this.H;
        const P = this.P;
        // Layout properties needed by assembly/experiment phases (must be set regardless of bg)
        const benchYVal = Math.round(h * 0.52);
        const benchWVal = Math.round(w * 0.55);
        const benchXVal = Math.round((w - benchWVal) / 2);
        const benchHVal = 14;
        this.benchY = benchYVal;
        this.drawerX = benchXVal + benchWVal - 65;
        this.drawerY = benchYVal + benchHVal;
        this.sideTableX = w - 90;
        this.sideTableY = Math.round(h * 0.58);

        // Use Aseprite background if available
        if (this.textures.exists('bg_lab')) {
            this.add.image(w / 2, h / 2, 'bg_lab').setDisplaySize(w, h).setDepth(this.DEPTH.BG);
            return; // skip procedural drawing
        }
        const g = this.add.graphics().setDepth(this.DEPTH.BG);

        // === FLOOR: Metal plating with seam lines ===
        const floorY = Math.round(h * 0.72);
        const floorH = h - floorY;
        g.fillStyle(0x3a3a4a, 1);
        g.fillRect(0, floorY, w, floorH);
        // Horizontal seam lines
        for (let y = floorY + 16; y < h; y += 24) {
            g.fillStyle(0x2a2a3a, 0.6);
            g.fillRect(0, y, w, 1);
            g.fillStyle(0x4a4a5a, 0.3);
            g.fillRect(0, y + 1, w, 1);
        }
        // Vertical seam lines (grid)
        for (let x = 0; x < w; x += 32) {
            g.fillStyle(0x2a2a3a, 0.5);
            g.fillRect(x, floorY, 1, floorH);
            g.fillStyle(0x4a4a5a, 0.2);
            g.fillRect(x + 1, floorY, 1, floorH);
        }
        // Rivet dots at grid intersections
        for (let x = 0; x < w; x += 32) {
            for (let y = floorY + 16; y < h; y += 24) {
                g.fillStyle(0x5a5a6a, 0.5);
                g.fillRect(x - 1, y - 1, 3, 3);
                g.fillStyle(0x6a6a7a, 0.4);
                g.fillRect(x, y, 1, 1);
            }
        }

        // === WALL: Dark gradient with horizontal paneling lines ===
        // Base wall color
        g.fillStyle(P.DARK_BLUE, 1);
        g.fillRect(0, 0, w, floorY);
        // Gradient: slightly lighter at top
        for (let y = 0; y < floorY; y += 2) {
            const t = y / floorY;
            const alpha = 0.08 * (1 - t);
            g.fillStyle(P.MED_BLUE, alpha);
            g.fillRect(0, y, w, 2);
        }
        // Horizontal paneling lines every 4px
        for (let y = 0; y < floorY; y += 4) {
            g.fillStyle(0x152030, 0.35);
            g.fillRect(0, y, w, 1);
        }
        // Subtle vertical panel dividers
        for (let x = 0; x < w; x += Math.round(w / 5)) {
            g.fillStyle(0x152030, 0.15);
            g.fillRect(x, 0, 2, floorY);
        }

        // === BASEBOARD ===
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(0, floorY - 6, w, 8);
        g.fillStyle(P.LIGHT_GREY, 0.25);
        g.fillRect(0, floorY - 6, w, 1);
        g.fillStyle(P.BLACK, 0.3);
        g.fillRect(0, floorY + 1, w, 1);

        // === METAL CEILING with industrial pipes ===
        const ceilH = 18;
        g.fillStyle(0x2a2a3a, 1);
        g.fillRect(0, 0, w, ceilH);
        // Pipe 1 (big horizontal)
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(0, 4, w, 6);
        g.fillStyle(P.LIGHT_GREY, 0.3);
        g.fillRect(0, 4, w, 1);
        g.fillStyle(P.BLACK, 0.3);
        g.fillRect(0, 9, w, 1);
        // Rivets on pipe
        for (let x = 20; x < w; x += 40) {
            g.fillStyle(P.LIGHT_GREY, 0.5);
            g.fillRect(x, 5, 3, 3);
            g.fillStyle(P.WHITE, 0.3);
            g.fillRect(x, 5, 1, 1);
        }
        // Pipe 2 (smaller, lower)
        g.fillStyle(0x4a4a5a, 0.8);
        g.fillRect(0, 12, w, 3);
        g.fillStyle(P.LIGHT_GREY, 0.15);
        g.fillRect(0, 12, w, 1);

        // === CEILING LIGHTS (3 lights with glow cones) ===
        const lightPositions = [w * 0.2, w * 0.5, w * 0.8];
        const coneG = this.add.graphics().setDepth(this.DEPTH.BG + 1);

        lightPositions.forEach((lx, li) => {
            // Cord
            g.fillStyle(P.DARK_GREY, 1);
            g.fillRect(Math.round(lx) - 1, ceilH, 2, 14);

            // Lamp shade (trapezoidal - wider at bottom)
            const shadeTop = ceilH + 14;
            g.fillStyle(0x4a4a5a, 1);
            g.fillRect(Math.round(lx) - 12, shadeTop, 24, 3);
            g.fillRect(Math.round(lx) - 16, shadeTop + 3, 32, 4);
            g.fillStyle(P.LIGHT_GREY, 0.3);
            g.fillRect(Math.round(lx) - 12, shadeTop, 24, 1);

            // Bulb
            g.fillStyle(P.YELLOW, 0.9);
            g.fillRect(Math.round(lx) - 3, shadeTop + 7, 6, 3);
            g.fillStyle(P.WHITE, 0.6);
            g.fillRect(Math.round(lx) - 1, shadeTop + 7, 2, 2);

            // Light cone (triangular bright area below lamp)
            const coneTop = shadeTop + 10;
            const coneSteps = 18;
            for (let i = 0; i < coneSteps; i++) {
                const frac = i / coneSteps;
                const spread = Math.round(frac * 100);
                const yy = coneTop + i * 14;
                const alpha = 0.06 * (1 - frac * frac);
                if (alpha > 0.002 && yy < floorY) {
                    coneG.fillStyle(P.YELLOW, alpha);
                    coneG.fillRect(
                        Math.round(lx) - 16 - Math.round(spread / 2),
                        yy,
                        32 + spread,
                        14
                    );
                }
            }
        });

        // === WORKBENCH (center, main gameplay area) ===
        const benchY = Math.round(h * 0.52);
        const benchW = Math.round(w * 0.55);
        const benchX = Math.round((w - benchW) / 2);
        const benchH = 14;

        // Legs
        g.fillStyle(0x6a4020, 1);
        g.fillRect(benchX + 10, benchY + benchH, 10, floorY - benchY - benchH);
        g.fillRect(benchX + benchW - 20, benchY + benchH, 10, floorY - benchY - benchH);
        // Leg highlights
        g.fillStyle(0x7a5030, 0.5);
        g.fillRect(benchX + 10, benchY + benchH, 2, floorY - benchY - benchH);
        g.fillRect(benchX + benchW - 20, benchY + benchH, 2, floorY - benchY - benchH);
        // Cross brace
        g.fillStyle(0x5a3018, 0.8);
        const braceY = Math.round(benchY + benchH + (floorY - benchY - benchH) * 0.6);
        g.fillRect(benchX + 18, braceY, benchW - 36, 4);

        // Table surface - wood with grain
        g.fillStyle(P.BROWN, 1);
        g.fillRect(benchX, benchY, benchW, benchH);
        // Wood grain: alternating light/dark horizontal lines
        for (let y = benchY + 1; y < benchY + benchH - 1; y += 2) {
            g.fillStyle(0x9a6040, 0.5);
            g.fillRect(benchX + 2, y, benchW - 4, 1);
        }
        for (let y = benchY + 2; y < benchY + benchH - 1; y += 2) {
            g.fillStyle(0x7a4020, 0.3);
            g.fillRect(benchX + 2, y, benchW - 4, 1);
        }
        // Wood knots
        g.fillStyle(0x8a5030, 0.5);
        g.fillRect(benchX + Math.round(benchW * 0.25), benchY + 4, 4, 4);
        g.fillRect(benchX + Math.round(benchW * 0.65), benchY + 6, 3, 3);
        // Top edge highlight
        g.fillStyle(P.ORANGE, 0.2);
        g.fillRect(benchX, benchY, benchW, 1);
        // Front edge shadow
        g.fillStyle(P.BLACK, 0.35);
        g.fillRect(benchX, benchY + benchH - 1, benchW, 2);
        // Side edges
        g.fillStyle(0x7a4020, 0.6);
        g.fillRect(benchX, benchY, 2, benchH);
        g.fillRect(benchX + benchW - 2, benchY, 2, benchH);

        // Drawer on bench right side
        this.drawerX = benchX + benchW - 65;
        this.drawerY = benchY + benchH;
        g.fillStyle(0x5a3a20, 1);
        g.fillRect(this.drawerX, this.drawerY, 55, 18);
        g.fillStyle(0x6a4a30, 0.6);
        g.fillRect(this.drawerX + 1, this.drawerY + 1, 53, 1);
        // Drawer handle
        g.fillStyle(P.LIGHT_GREY, 0.7);
        g.fillRect(this.drawerX + 22, this.drawerY + 7, 12, 4);
        g.fillStyle(P.WHITE, 0.3);
        g.fillRect(this.drawerX + 22, this.drawerY + 7, 12, 1);
        // Drawer edge
        g.fillStyle(P.BLACK, 0.2);
        g.fillRect(this.drawerX, this.drawerY + 17, 55, 1);

        // === LEFT WALL: Shelving with bottles and beakers ===
        const shelfX = 12;
        const shelfW = 90;
        for (let si = 0; si < 3; si++) {
            const sy = 50 + si * 60;
            // Shelf board
            g.fillStyle(0x4a3a2a, 1);
            g.fillRect(shelfX, sy, shelfW, 5);
            g.fillStyle(0x5a4a3a, 0.4);
            g.fillRect(shelfX, sy, shelfW, 1);
            g.fillStyle(P.BLACK, 0.2);
            g.fillRect(shelfX, sy + 4, shelfW, 1);
            // Brackets (L-shaped)
            g.fillStyle(P.DARK_GREY, 0.9);
            g.fillRect(shelfX + 5, sy + 5, 4, 14);
            g.fillRect(shelfX + shelfW - 9, sy + 5, 4, 14);
            g.fillStyle(P.LIGHT_GREY, 0.2);
            g.fillRect(shelfX + 5, sy + 5, 1, 14);
            g.fillRect(shelfX + shelfW - 9, sy + 5, 1, 14);
        }
        this.shelfItemY = 50;

        // Colorful bottles on shelf 1
        this._drawBottle(g, shelfX + 10, 50 - 18, 0x00e436, 0.8, 8);   // green
        this._drawBottle(g, shelfX + 24, 50 - 16, 0x29adff, 0.7, 6);   // blue
        this._drawBottle(g, shelfX + 36, 50 - 20, 0xff004d, 0.6, 10);  // red tall
        this._drawBottle(g, shelfX + 52, 50 - 14, 0xffa300, 0.7, 5);   // orange short
        this._drawBottle(g, shelfX + 64, 50 - 17, 0x83769c, 0.6, 7);   // indigo

        // Beakers on shelf 2
        this._drawBeaker(g, shelfX + 8, 110 - 18, 0x53d8fb, 0.5);
        this._drawBeaker(g, shelfX + 28, 110 - 20, 0x00e436, 0.45);
        this._drawBottle(g, shelfX + 48, 110 - 15, 0xff77a8, 0.6, 5);
        this._drawBeaker(g, shelfX + 62, 110 - 16, 0xffa300, 0.5);

        // Books on shelf 3
        g.fillStyle(P.RED, 0.8);
        g.fillRect(shelfX + 8, 170 - 14, 5, 13);
        g.fillStyle(P.BRIGHT_BLUE, 0.7);
        g.fillRect(shelfX + 14, 170 - 12, 4, 11);
        g.fillStyle(P.GREEN, 0.7);
        g.fillRect(shelfX + 19, 170 - 15, 5, 14);
        g.fillStyle(P.ORANGE, 0.8);
        g.fillRect(shelfX + 25, 170 - 10, 6, 9);
        // Small box
        g.fillStyle(P.BROWN, 1);
        g.fillRect(shelfX + 45, 170 - 10, 14, 9);
        g.fillStyle(0x8a5030, 0.4);
        g.fillRect(shelfX + 45, 170 - 10, 14, 1);
        // Microscope silhouette
        g.fillStyle(P.DARK_GREY, 0.9);
        g.fillRect(shelfX + 68, 170 - 18, 6, 17);
        g.fillRect(shelfX + 65, 170 - 6, 12, 5);
        g.fillRect(shelfX + 71, 170 - 14, 8, 3);

        // === RIGHT WALL: Whiteboard + periodic table ===
        // Periodic table poster (upper right)
        const posterX = w - 115;
        const posterY = 28;
        const posterW = 95;
        const posterH = 65;
        g.fillStyle(P.WHITE, 0.92);
        g.fillRect(posterX, posterY, posterW, posterH);
        // Title bar
        g.fillStyle(P.MED_BLUE, 0.5);
        g.fillRect(posterX + 2, posterY + 2, posterW - 4, 8);
        // Mini colored grid representing elements
        const elColors = [P.RED, P.ORANGE, P.YELLOW, P.GREEN, P.BRIGHT_BLUE, P.INDIGO, P.PINK, P.CYAN];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 11; col++) {
                // Skip some cells for periodic table shape
                if ((row < 2 && col > 1 && col < 9) || (row === 0 && col > 0 && col < 10)) {
                    if (row === 0 && col > 1 && col < 9) continue;
                    if (row === 1 && col > 1 && col < 9) continue;
                }
                g.fillStyle(elColors[(row + col * 3) % elColors.length], 0.55);
                g.fillRect(posterX + 4 + col * 8, posterY + 13 + row * 8, 6, 6);
            }
        }
        // Border with thumbtacks
        g.lineStyle(1, P.DARK_GREY, 0.8);
        g.strokeRect(posterX, posterY, posterW, posterH);
        // Thumbtacks
        g.fillStyle(P.RED, 0.9);
        g.fillRect(posterX + 3, posterY + 1, 4, 4);
        g.fillRect(posterX + posterW - 7, posterY + 1, 4, 4);

        // Whiteboard (right, lower)
        const wbX = w - 125;
        const wbY = 105;
        const wbW = 105;
        const wbH = 70;
        g.fillStyle(P.WHITE, 0.95);
        g.fillRect(wbX, wbY, wbW, wbH);
        // Frame (thick)
        g.fillStyle(0x6a6a7a, 1);
        g.fillRect(wbX - 3, wbY - 3, wbW + 6, 3);
        g.fillRect(wbX - 3, wbY + wbH, wbW + 6, 3);
        g.fillRect(wbX - 3, wbY, 3, wbH);
        g.fillRect(wbX + wbW, wbY, 3, wbH);
        // "Writing" - colored scribble lines
        g.fillStyle(P.MED_BLUE, 0.35);
        g.fillRect(wbX + 8, wbY + 8, 45, 2);
        g.fillRect(wbX + 8, wbY + 14, 60, 2);
        g.fillRect(wbX + 8, wbY + 20, 35, 2);
        g.fillStyle(P.RED, 0.3);
        g.fillRect(wbX + 55, wbY + 28, 38, 2);
        g.fillRect(wbX + 55, wbY + 34, 30, 2);
        g.fillStyle(P.GREEN, 0.25);
        g.fillRect(wbX + 10, wbY + 42, 50, 2);
        g.fillRect(wbX + 10, wbY + 48, 40, 2);
        // Equation scribble (B = mu0*NI/2R)
        g.fillStyle(P.DARK_BLUE, 0.3);
        g.fillRect(wbX + 15, wbY + 56, 70, 3);
        // Whiteboard tray
        g.fillStyle(0x5a5a6a, 1);
        g.fillRect(wbX + 5, wbY + wbH, wbW - 10, 5);
        g.fillStyle(P.LIGHT_GREY, 0.2);
        g.fillRect(wbX + 5, wbY + wbH, wbW - 10, 1);
        // Markers on tray
        g.fillStyle(P.RED, 0.8);
        g.fillRect(wbX + 10, wbY + wbH - 1, 12, 3);
        g.fillStyle(P.BRIGHT_BLUE, 0.8);
        g.fillRect(wbX + 25, wbY + wbH - 1, 12, 3);
        g.fillStyle(P.GREEN, 0.7);
        g.fillRect(wbX + 40, wbY + wbH - 1, 10, 3);

        // === CLIPBOARD on wall (left of whiteboard) ===
        const cbX = w - 145;
        const cbY = 130;
        g.fillStyle(0x8a6040, 1);
        g.fillRect(cbX, cbY, 16, 22);
        g.fillStyle(P.LIGHT_GREY, 0.6);
        g.fillRect(cbX + 3, cbY - 2, 10, 4);
        // Papers
        g.fillStyle(P.WHITE, 0.85);
        g.fillRect(cbX + 2, cbY + 3, 12, 17);
        g.fillStyle(P.MED_BLUE, 0.2);
        g.fillRect(cbX + 4, cbY + 6, 8, 1);
        g.fillRect(cbX + 4, cbY + 9, 7, 1);
        g.fillRect(cbX + 4, cbY + 12, 8, 1);
        g.fillRect(cbX + 4, cbY + 15, 5, 1);

        // === CABLES/WIRES on floor ===
        const cableG = this.add.graphics().setDepth(this.DEPTH.BG + 2);
        // Cable 1: from bench area toward right wall
        cableG.lineStyle(2, P.DARK_GREY, 0.5);
        cableG.beginPath();
        cableG.moveTo(benchX + 20, floorY + 4);
        cableG.lineTo(benchX + 50, floorY + 12);
        cableG.lineTo(benchX + 90, floorY + 10);
        cableG.lineTo(benchX + 120, floorY + 18);
        cableG.strokePath();
        // Cable 2: red power cable
        cableG.lineStyle(2, P.RED, 0.3);
        cableG.beginPath();
        cableG.moveTo(benchX + benchW - 20, floorY + 6);
        cableG.lineTo(benchX + benchW + 10, floorY + 14);
        cableG.lineTo(benchX + benchW + 40, floorY + 10);
        cableG.lineTo(w - 30, floorY + 8);
        cableG.strokePath();
        // Cable 3: thin yellow cable
        cableG.lineStyle(1, P.YELLOW, 0.2);
        cableG.beginPath();
        cableG.moveTo(20, floorY + 8);
        cableG.lineTo(50, floorY + 16);
        cableG.lineTo(benchX - 10, floorY + 12);
        cableG.strokePath();

        // Wall outlet (left)
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(14, floorY - 22, 12, 14);
        g.fillStyle(P.BLACK, 0.8);
        g.fillRect(17, floorY - 19, 3, 4);
        g.fillRect(17, floorY - 13, 3, 4);

        // Wall outlet (right)
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(w - 26, floorY - 22, 12, 14);
        g.fillStyle(P.BLACK, 0.8);
        g.fillRect(w - 23, floorY - 19, 3, 4);
        g.fillRect(w - 23, floorY - 13, 3, 4);

        // === EMERGENCY LIGHT (top-right corner) ===
        const elX = w - 35;
        const elY = ceilH + 3;
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(elX, elY, 18, 10);
        g.fillStyle(P.LIGHT_GREY, 0.2);
        g.fillRect(elX, elY, 18, 1);
        // Red light (blinks)
        this.emergencyLight = this.add.graphics().setDepth(this.DEPTH.BG + 3);
        this.emergencyLight.fillStyle(P.RED, 0.9);
        this.emergencyLight.fillRect(elX + 5, elY + 3, 8, 4);
        // Red glow around emergency light
        this.emergencyGlow = this.add.graphics().setDepth(this.DEPTH.BG + 2);
        this.emergencyGlow.fillStyle(P.RED, 0.06);
        this.emergencyGlow.fillRect(elX - 8, elY - 4, 34, 22);
        this.tweens.add({
            targets: [this.emergencyLight, this.emergencyGlow],
            alpha: { from: 1, to: 0.1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // === RADIO on shelf (top shelf, right side) ===
        const radioX = shelfX + 72;
        const radioY = 50 - 14;
        // Radio body
        g.fillStyle(0x3a3a3a, 1);
        g.fillRect(radioX, radioY, 14, 10);
        g.fillStyle(0x4a4a4a, 0.5);
        g.fillRect(radioX, radioY, 14, 1);
        // Speaker grille
        for (let ry = radioY + 2; ry < radioY + 8; ry += 2) {
            g.fillStyle(0x2a2a2a, 0.6);
            g.fillRect(radioX + 2, ry, 6, 1);
        }
        // Dial
        g.fillStyle(P.ORANGE, 0.6);
        g.fillRect(radioX + 10, radioY + 3, 2, 2);
        // Antenna (thin line going up)
        g.fillStyle(P.LIGHT_GREY, 0.7);
        g.fillRect(radioX + 12, radioY - 12, 1, 12);
        g.fillStyle(P.WHITE, 0.5);
        g.fillRect(radioX + 12, radioY - 12, 1, 1);
        // Blinking LED on radio
        this.radioLED = this.add.graphics().setDepth(this.DEPTH.BG + 3);
        this.radioLED.fillStyle(P.GREEN, 1);
        this.radioLED.fillRect(radioX + 10, radioY + 6, 2, 2);
        this.tweens.add({
            targets: this.radioLED,
            alpha: { from: 1, to: 0 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            delay: 400
        });

        // === SIDE TABLE (right of bench) ===
        this.sideTableX = w - 90;
        this.sideTableY = Math.round(h * 0.58);
        // Table top
        g.fillStyle(P.DARK_GREY, 1);
        g.fillRect(this.sideTableX, this.sideTableY, 55, 6);
        g.fillStyle(P.LIGHT_GREY, 0.2);
        g.fillRect(this.sideTableX, this.sideTableY, 55, 1);
        g.fillStyle(P.BLACK, 0.2);
        g.fillRect(this.sideTableX, this.sideTableY + 5, 55, 1);
        // Legs
        g.fillStyle(P.DARK_GREY, 0.8);
        g.fillRect(this.sideTableX + 5, this.sideTableY + 6, 4, floorY - this.sideTableY - 6);
        g.fillRect(this.sideTableX + 46, this.sideTableY + 6, 4, floorY - this.sideTableY - 6);
        // Leg highlights
        g.fillStyle(P.LIGHT_GREY, 0.15);
        g.fillRect(this.sideTableX + 5, this.sideTableY + 6, 1, floorY - this.sideTableY - 6);
        g.fillRect(this.sideTableX + 46, this.sideTableY + 6, 1, floorY - this.sideTableY - 6);

        // Store bench position
        this.benchX = benchX;
        this.benchY = benchY;
        this.benchW = benchW;
        this.benchH = benchH;
        this.floorY = floorY;
    }

    _drawBottle(g, x, y, color, alpha, height) {
        const bh = height || 8;
        const P = this.P;
        // Neck
        g.fillStyle(color, alpha * 0.7);
        g.fillRect(x + 2, y, 4, 3);
        // Cap
        g.fillStyle(P.LIGHT_GREY, 0.5);
        g.fillRect(x + 2, y - 1, 4, 2);
        // Body
        g.fillStyle(color, alpha);
        g.fillRect(x, y + 3, 8, bh);
        // Highlight
        g.fillStyle(P.WHITE, 0.25);
        g.fillRect(x + 1, y + 4, 1, bh - 2);
        // Shadow
        g.fillStyle(P.BLACK, 0.15);
        g.fillRect(x + 6, y + 4, 1, bh - 2);
    }

    _drawBeaker(g, x, y, color, alpha) {
        const P = this.P;
        // Glass body
        g.fillStyle(P.LIGHT_GREY, 0.35);
        g.fillRect(x, y, 14, 16);
        // Liquid inside
        g.fillStyle(color, alpha);
        g.fillRect(x + 1, y + 5, 12, 10);
        // Rim
        g.fillStyle(P.LIGHT_GREY, 0.5);
        g.fillRect(x - 1, y, 16, 2);
        // Highlight
        g.fillStyle(P.WHITE, 0.2);
        g.fillRect(x + 1, y + 1, 1, 13);
        // Meniscus curve hint
        g.fillStyle(color, alpha * 0.5);
        g.fillRect(x + 1, y + 4, 1, 1);
        g.fillRect(x + 12, y + 4, 1, 1);
    }

    // =============================================
    // HUD
    // =============================================
    createHUD() {
        const w = this.W;
        const backX = this.isRTL ? w - 40 : 40;
        const backImg = this.add.image(backX, 28, 'btn')
            .setScale(1.5, 1.5)
            .setDepth(this.DEPTH.UI);

        const backIcon = this.add.image(backX, 28, 'icon_back')
            .setScale(2)
            .setDepth(this.DEPTH.UI + 1)
            .setFlipX(this.isRTL);

        const backBtn = this.add.zone(backX, 28, 72, 44)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.DEPTH.UI + 2);

        backBtn.on('pointerover', () => backImg.setTexture('btn_hover'));
        backBtn.on('pointerout', () => backImg.setTexture('btn'));
        backBtn.on('pointerdown', () => {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            this.scene.start('ShipHub');
        });
    }

    // =============================================
    // PHASE 1: ASSEMBLY
    // =============================================
    createAssemblyPhase() {
        const w = this.W, h = this.H;
        const P = this.P;
        const centerX = Math.round(w / 2);
        const centerY = this.benchY - 40;

        // Track found parts
        this.partsFound = {
            coil: this.GS ? this.GS.labPartsFound.coil : false,
            wires: this.GS ? this.GS.labPartsFound.wires : false,
            battery: this.GS ? this.GS.labPartsFound.battery : false,
        };

        // LARGE galvanometer base drawn with Phaser graphics (no ugly scaled texture)
        this.drawAssemblyGalvanometer(centerX, centerY);

        // 3 GLOWING slot indicators around galvanometer
        this.slots = [];
        const slotPositions = [
            { x: centerX - 95, y: centerY - 50, part: 'coil' },
            { x: centerX + 95, y: centerY - 50, part: 'wires' },
            { x: centerX, y: centerY + 70, part: 'battery' },
        ];

        slotPositions.forEach((pos, i) => {
            const slotG = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT + 1);

            // Pulsing yellow rectangle outline
            slotG.lineStyle(2, P.YELLOW, 0.7);
            slotG.strokeRect(pos.x - 22, pos.y - 18, 44, 36);
            slotG.fillStyle(P.YELLOW, 0.06);
            slotG.fillRect(pos.x - 22, pos.y - 18, 44, 36);

            // Corner accents
            slotG.fillStyle(P.YELLOW, 0.5);
            slotG.fillRect(pos.x - 22, pos.y - 18, 6, 2);
            slotG.fillRect(pos.x - 22, pos.y - 18, 2, 6);
            slotG.fillRect(pos.x + 16, pos.y - 18, 6, 2);
            slotG.fillRect(pos.x + 20, pos.y - 18, 2, 6);
            slotG.fillRect(pos.x - 22, pos.y + 14, 6, 2);
            slotG.fillRect(pos.x - 22, pos.y + 12, 2, 6);
            slotG.fillRect(pos.x + 16, pos.y + 14, 6, 2);
            slotG.fillRect(pos.x + 20, pos.y + 12, 2, 6);

            // "?" icon in center
            const qIcon = this.add.image(pos.x, pos.y, 'icon_hint')
                .setScale(3)
                .setDepth(this.DEPTH.EQUIPMENT + 2)
                .setAlpha(0.5);

            // Pulsing glow
            this.tweens.add({
                targets: qIcon,
                alpha: { from: 0.25, to: 0.85 },
                duration: 900,
                yoyo: true,
                repeat: -1,
                delay: i * 250
            });

            // Pulsing slot border
            const slotGlow = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT);
            this.tweens.add({
                targets: slotGlow,
                alpha: { from: 0.3, to: 0.8 },
                duration: 900,
                yoyo: true,
                repeat: -1,
                delay: i * 250,
                onUpdate: (tween) => {
                    slotGlow.clear();
                    slotGlow.fillStyle(P.YELLOW, tween.getValue() * 0.08);
                    slotGlow.fillRect(pos.x - 24, pos.y - 20, 48, 40);
                }
            });

            this.slots.push({ ...pos, graphics: slotG, glowGraphics: slotGlow, qIcon, filled: this.partsFound[pos.part] });

            if (this.partsFound[pos.part]) {
                this.showPartInSlot(i);
            }
        });

        // === HIDDEN PARTS WITH VISUAL HINTS ===

        // Part 1: Coil on upper-left shelf area - bright orange glow pulse
        if (!this.partsFound.coil) {
            const coilX = Math.round(w * 0.12);
            const coilY = Math.round(h * 0.22);

            // Orange glow halo (large and visible)
            const coilGlow = this.add.image(coilX, coilY, 'item_glow')
                .setScale(5)
                .setDepth(this.DEPTH.ITEMS - 1)
                .setTint(P.ORANGE);
            this.tweens.add({
                targets: coilGlow,
                alpha: { from: 0.3, to: 1 },
                scaleX: { from: 4, to: 6 },
                scaleY: { from: 4, to: 6 },
                duration: 700,
                yoyo: true,
                repeat: -1
            });

            // Label above the coil
            const coilLabel = this.add.text(coilX, coilY - 32, this.t('part_coil') || 'Coil', {
                fontFamily: this.rtlFont + ', monospace',
                fontSize: '11px',
                color: '#ffa300',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(this.DEPTH.ITEMS + 1);
            this.tweens.add({
                targets: coilLabel,
                y: coilY - 38,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const coilSprite = this.add.image(coilX, coilY, 'coil_part')
                .setScale(3.5)
                .setDepth(this.DEPTH.ITEMS)
                .setInteractive({ useHandCursor: true });

            coilSprite.on('pointerover', () => {
                this.tweens.add({ targets: coilSprite, scaleX: 4.5, scaleY: 4.5, duration: 150 });
            });
            coilSprite.on('pointerout', () => {
                this.tweens.add({ targets: coilSprite, scaleX: 3.5, scaleY: 3.5, duration: 150 });
            });
            coilSprite.on('pointerdown', () => {
                coilLabel.destroy();
                this.collectPart('coil', coilSprite, coilGlow, 0);
            });
        }

        // Part 2: Wires on right side of bench - directly visible and clickable
        if (!this.partsFound.wires) {
            const wireX = Math.round(w * 0.75);
            const wireY = Math.round(h * 0.38);

            // Yellow glow halo
            const wireGlow = this.add.image(wireX, wireY, 'item_glow')
                .setScale(5)
                .setDepth(this.DEPTH.ITEMS - 1)
                .setTint(P.YELLOW);
            this.tweens.add({
                targets: wireGlow,
                alpha: { from: 0.3, to: 1 },
                scaleX: { from: 4, to: 6 },
                scaleY: { from: 4, to: 6 },
                duration: 600,
                yoyo: true,
                repeat: -1
            });

            // Label
            const wireLabel = this.add.text(wireX, wireY - 32, this.t('part_wires') || 'Wires', {
                fontFamily: this.rtlFont + ', monospace',
                fontSize: '11px',
                color: '#ffec27',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(this.DEPTH.ITEMS + 1);
            this.tweens.add({
                targets: wireLabel,
                y: wireY - 38,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const wireSprite = this.add.image(wireX, wireY, 'wire_part')
                .setScale(3.5)
                .setDepth(this.DEPTH.ITEMS)
                .setInteractive({ useHandCursor: true });

            wireSprite.on('pointerover', () => {
                this.tweens.add({ targets: wireSprite, scaleX: 4.5, scaleY: 4.5, duration: 150 });
            });
            wireSprite.on('pointerout', () => {
                this.tweens.add({ targets: wireSprite, scaleX: 3.5, scaleY: 3.5, duration: 150 });
            });
            wireSprite.on('pointerdown', () => {
                wireLabel.destroy();
                this.collectPart('wires', wireSprite, wireGlow, 1);
            });
        }

        // Part 3: Battery on lower-right area with green blinking glow
        if (!this.partsFound.battery) {
            const batX = Math.round(w * 0.88);
            const batY = Math.round(h * 0.50);

            // Green glow halo (large)
            const batGlow = this.add.image(batX, batY, 'item_glow')
                .setScale(5)
                .setDepth(this.DEPTH.ITEMS - 1)
                .setTint(P.GREEN);
            this.tweens.add({
                targets: batGlow,
                alpha: { from: 0.3, to: 1 },
                scaleX: { from: 4, to: 6 },
                scaleY: { from: 4, to: 6 },
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            // Label
            const batLabel = this.add.text(batX, batY - 32, this.t('part_battery') || 'Battery', {
                fontFamily: this.rtlFont + ', monospace',
                fontSize: '11px',
                color: '#00e436',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(this.DEPTH.ITEMS + 1);
            this.tweens.add({
                targets: batLabel,
                y: batY - 38,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const batterySprite = this.add.image(batX, batY, 'battery_part')
                .setScale(4)
                .setDepth(this.DEPTH.ITEMS)
                .setInteractive({ useHandCursor: true });

            batterySprite.on('pointerover', () => {
                this.tweens.add({ targets: batterySprite, scaleX: 5, scaleY: 5, duration: 150 });
            });
            batterySprite.on('pointerout', () => {
                this.tweens.add({ targets: batterySprite, scaleX: 4, scaleY: 4, duration: 150 });
            });
            batterySprite.on('pointerdown', () => {
                batLabel.destroy();
                this.collectPart('battery', batterySprite, batGlow, 2);
            });
        }

        // === INSTRUCTION TEXT (pulsing hint at bottom of screen) ===
        const hintStr = this.t('lab_assembly_hint');
        const hintY = Math.round(h * 0.90);
        const isRTL = this.isRTL;
        const rtlProp = isRTL ? { rtl: true } : {};
        // Background bar
        const hintBg = this.add.graphics().setDepth(this.DEPTH.UI - 1);
        hintBg.fillStyle(P.DEEP_NAVY, 0.85);
        hintBg.fillRect(0, hintY - 16, w, 32);
        hintBg.lineStyle(1, P.YELLOW, 0.4);
        hintBg.lineBetween(0, hintY - 16, w, hintY - 16);
        // Hint text
        const hintText = this.add.text(w / 2, hintY, hintStr, Object.assign({
            fontFamily: this.rtlFont + ', monospace',
            fontSize: '14px',
            color: '#ffec27',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }, rtlProp)).setOrigin(0.5).setDepth(this.DEPTH.UI);
        // Pulse the hint
        this.tweens.add({
            targets: hintText,
            alpha: { from: 1, to: 0.4 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // === PROGRESS: 3 slot frames at top, fill with checkmarks ===
        this.createAssemblyProgressBar();
        this.checkAssemblyComplete(false);
    }

    showPartTooltip(x, y, textureKey) {
        this.hidePartTooltip();
        this.tooltipBg = this.add.graphics().setDepth(this.DEPTH.POPUP - 1);
        this.tooltipBg.fillStyle(this.P.DEEP_NAVY, 0.9);
        this.tooltipBg.fillRect(x - 38, y - 32, 76, 64);
        this.tooltipBg.lineStyle(2, this.P.YELLOW, 0.7);
        this.tooltipBg.strokeRect(x - 38, y - 32, 76, 64);
        this.tooltipImg = this.add.image(x, y, textureKey)
            .setScale(5)
            .setDepth(this.DEPTH.POPUP)
            .setAlpha(0.95);
    }

    hidePartTooltip() {
        if (this.tooltipImg) { this.tooltipImg.destroy(); this.tooltipImg = null; }
        if (this.tooltipBg) { this.tooltipBg.destroy(); this.tooltipBg = null; }
    }

    collectPart(partName, sprite, glow, slotIndex) {
        if (this.partsFound[partName]) return;
        this.partsFound[partName] = true;
        if (this.GS) this.GS.labPartsFound[partName] = true;
        this.hidePartTooltip();

        if (window.AudioManager) window.AudioManager.playSFX('pickup');

        const slot = this.slots[slotIndex];
        const targetX = slot.x;
        const targetY = slot.y;

        if (glow) glow.destroy();

        // Part grows slightly, flashes white, then flies to galvanometer
        sprite.disableInteractive();

        // Flash white
        sprite.setTint(this.P.WHITE);
        this.time.delayedCall(120, () => {
            sprite.clearTint();

            // Scale up briefly
            this.tweens.add({
                targets: sprite,
                scaleX: sprite.scaleX * 1.5,
                scaleY: sprite.scaleY * 1.5,
                duration: 150,
                yoyo: true,
                onComplete: () => {
                    // Fly to slot
                    this.tweens.add({
                        targets: sprite,
                        x: targetX,
                        y: targetY,
                        scaleX: 2.5,
                        scaleY: 2.5,
                        duration: 500,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            this.emitCollectParticles(targetX, targetY);
                            sprite.setDepth(this.DEPTH.EQUIPMENT + 3);

                            if (slot.qIcon) slot.qIcon.destroy();
                            if (slot.glowGraphics) slot.glowGraphics.destroy();

                            // Green filled slot
                            slot.graphics.clear();
                            slot.graphics.lineStyle(2, this.P.GREEN, 0.9);
                            slot.graphics.strokeRect(slot.x - 22, slot.y - 18, 44, 36);
                            slot.graphics.fillStyle(this.P.GREEN, 0.08);
                            slot.graphics.fillRect(slot.x - 22, slot.y - 18, 44, 36);
                            slot.filled = true;

                            // Checkmark
                            this.add.image(slot.x + 16, slot.y - 12, 'icon_check')
                                .setScale(2.5)
                                .setDepth(this.DEPTH.EQUIPMENT + 4);

                            this.updateAssemblyProgress();
                            this.checkAssemblyComplete(true);
                        }
                    });
                }
            });
        });
    }

    showPartInSlot(slotIndex) {
        const slot = this.slots[slotIndex];
        const textures = ['coil_part', 'wire_part', 'battery_part'];
        this.add.image(slot.x, slot.y, textures[slotIndex])
            .setScale(2.5)
            .setDepth(this.DEPTH.EQUIPMENT + 3);
        if (slot.qIcon) slot.qIcon.destroy();
        if (slot.glowGraphics) slot.glowGraphics.destroy();
        slot.graphics.clear();
        slot.graphics.lineStyle(2, this.P.GREEN, 0.9);
        slot.graphics.strokeRect(slot.x - 22, slot.y - 18, 44, 36);
        slot.graphics.fillStyle(this.P.GREEN, 0.08);
        slot.graphics.fillRect(slot.x - 22, slot.y - 18, 44, 36);
        slot.filled = true;
        this.add.image(slot.x + 16, slot.y - 12, 'icon_check')
            .setScale(2.5)
            .setDepth(this.DEPTH.EQUIPMENT + 4);
    }

    emitCollectParticles(x, y) {
        for (let i = 0; i < 16; i++) {
            const p = this.add.image(x, y, 'spark')
                .setScale(Phaser.Math.FloatBetween(1, 3))
                .setDepth(this.DEPTH.OVERLAY)
                .setTint(Phaser.Math.RND.pick([this.P.YELLOW, this.P.ORANGE, this.P.WHITE, this.P.CYAN]));
            this.tweens.add({
                targets: p,
                x: x + Phaser.Math.Between(-50, 50),
                y: y + Phaser.Math.Between(-50, 50),
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: Phaser.Math.Between(300, 800),
                onComplete: () => p.destroy()
            });
        }
    }

    createAssemblyProgressBar() {
        const P = this.P;
        const barX = Math.round(this.W / 2);
        const barY = 28;

        this.progressContainer = this.add.container(barX, barY).setDepth(this.DEPTH.UI);

        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(P.DEEP_NAVY, 0.88);
        bg.fillRect(-70, -14, 140, 28);
        bg.lineStyle(2, P.MED_BLUE, 0.7);
        bg.strokeRect(-70, -14, 140, 28);
        // Inner highlight
        bg.fillStyle(P.MED_BLUE, 0.1);
        bg.fillRect(-69, -13, 138, 1);
        this.progressContainer.add(bg);

        // 3 slot frames
        this.progressIcons = [];
        const partTextures = ['coil_part', 'wire_part', 'battery_part'];
        const partNames = ['coil', 'wires', 'battery'];

        for (let i = 0; i < 3; i++) {
            const ix = -35 + i * 35;

            // Frame
            const frameG = this.add.graphics();
            frameG.lineStyle(2, P.LIGHT_GREY, 0.4);
            frameG.strokeRect(ix - 12, -10, 24, 20);
            this.progressContainer.add(frameG);

            // Part icon (dim if not found)
            const icon = this.add.image(ix, 0, partTextures[i])
                .setScale(1.5)
                .setAlpha(this.partsFound[partNames[i]] ? 1 : 0.15);
            this.progressContainer.add(icon);

            // Checkmark overlay (hidden until found)
            const check = this.add.image(ix + 8, -6, 'icon_check')
                .setScale(1.5)
                .setAlpha(this.partsFound[partNames[i]] ? 1 : 0)
                .setDepth(this.DEPTH.UI + 1);
            this.progressContainer.add(check);

            this.progressIcons.push({ icon, check, part: partNames[i] });
        }
    }

    updateAssemblyProgress() {
        this.progressIcons.forEach(pi => {
            if (this.partsFound[pi.part]) {
                this.tweens.add({ targets: pi.icon, alpha: 1, duration: 300 });
                this.tweens.add({ targets: pi.check, alpha: 1, duration: 300, delay: 150 });
            }
        });
    }

    checkAssemblyComplete(animate) {
        const allFound = this.partsFound.coil && this.partsFound.wires && this.partsFound.battery;
        if (!allFound) return;

        if (this.GS) this.GS.galvanometerAssembled = true;
        if (!animate) return;

        // Assembly celebration
        this.time.delayedCall(500, () => {
            // White flash
            const flash = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 10);
            flash.fillStyle(this.P.WHITE, 0.7);
            flash.fillRect(0, 0, this.W, this.H);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 700,
                onComplete: () => flash.destroy()
            });

            // Sparks everywhere
            for (let i = 0; i < 30; i++) {
                const sx = Phaser.Math.Between(Math.round(this.W * 0.15), Math.round(this.W * 0.85));
                const sy = Phaser.Math.Between(Math.round(this.H * 0.1), Math.round(this.H * 0.6));
                this.time.delayedCall(i * 40, () => this.emitCollectParticles(sx, sy));
            }

            if (window.AudioManager) window.AudioManager.playSFX('success');

            // Transition to experiment
            this.time.delayedCall(1500, () => {
                this.scene.launch('Dialog', {
                    dialogs: [
                        { npc: 'magneta', text: this.t('magneta_quest_measure') }
                    ],
                    onComplete: () => {
                        this.scene.restart();
                    }
                });
            });
        });
    }

    // =============================================
    // PHASE 2: EXPERIMENT
    // =============================================
    createExperimentPhase() {
        const w = this.W, h = this.H;
        const P = this.P;
        const centerX = Math.round(w / 2);

        // === GALVANOMETER (drawn entirely in Phaser) ===
        const galvCX = centerX;
        const galvCY = Math.round(h * 0.28);
        const galvRadius = 110;

        this.drawGalvanometerFace(galvCX, galvCY, galvRadius);

        // === NEEDLE ===
        this.needleGraphics = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT + 4);
        this.galvCX = galvCX;
        this.galvCY = galvCY;
        this.galvNeedleLen = Math.round(galvRadius * 0.65);
        this.drawNeedle(0);

        // === ANGLE READOUT (green digital display below galvanometer) ===
        const readoutY = galvCY + galvRadius + 22;
        const readoutG = this.add.graphics().setDepth(this.DEPTH.UI);
        readoutG.fillStyle(0x000000, 0.95);
        readoutG.fillRect(galvCX - 95, readoutY - 16, 190, 36);
        readoutG.lineStyle(2, P.GREEN, 0.6);
        readoutG.strokeRect(galvCX - 95, readoutY - 16, 190, 36);

        // Draw angle value with graphics-based seven-segment display
        this.angleReadoutG = this.add.graphics().setDepth(this.DEPTH.UI + 1);
        this.angleReadoutX = galvCX - 80;
        this.angleReadoutY = readoutY - 8;
        this._drawSegmentText(this.angleReadoutG, this.angleReadoutX, this.angleReadoutY, 'A=0.0', P.GREEN);

        // Keep text object as backup (hidden debug)
        this.angleReadout = { setText: (str) => {
            this.angleReadoutG.clear();
            // Parse angle from string like "θ = 12.5°"
            const match = str.match(/([\d.]+)/);
            const val = match ? match[1] : '0.0';
            this._drawSegmentText(this.angleReadoutG, this.angleReadoutX, this.angleReadoutY, 'A=' + val, P.GREEN);
        }};

        // === CURRENT CONTROL PANEL ===
        const controlY = Math.round(h * 0.68);

        // Control panel background
        const ctrlPanel = this.add.graphics().setDepth(this.DEPTH.UI);
        ctrlPanel.fillStyle(P.DEEP_NAVY, 0.95);
        ctrlPanel.fillRect(centerX - 180, controlY - 34, 360, 70);
        ctrlPanel.lineStyle(2, P.ORANGE, 0.5);
        ctrlPanel.strokeRect(centerX - 180, controlY - 34, 360, 70);

        // "CURRENT / זרם" label
        this.add.text(centerX, controlY - 28, this.t('current_label'), {
            fontFamily: this.rtlFont,
            fontSize: '12px',
            color: '#ffa300',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(this.DEPTH.UI + 2);

        // DOWN arrow (left)
        this.createArrowButton(centerX - 120, controlY + 6, 'left', () => {
            this.currentAmps = Math.max(0.5, +(this.currentAmps - 0.5).toFixed(1));
            this.updateCurrentDisplay();
        });

        // Current value display background
        const dispBg = this.add.graphics().setDepth(this.DEPTH.UI + 1);
        dispBg.fillStyle(0x000000, 1);
        dispBg.fillRect(centerX - 60, controlY - 14, 120, 44);
        dispBg.lineStyle(2, P.GREEN, 0.6);
        dispBg.strokeRect(centerX - 60, controlY - 14, 120, 44);

        // Draw current value with graphics-based seven-segment display
        this.currentDispG = this.add.graphics().setDepth(this.DEPTH.UI + 2);
        this.currentDispX = centerX - 48;
        this.currentDispY = controlY - 6;
        this._drawSegmentText(this.currentDispG, this.currentDispX, this.currentDispY, '0.5A', P.GREEN);

        // Keep reference for updates
        this.currentText = { setText: (str) => {
            this.currentDispG.clear();
            this._drawSegmentText(this.currentDispG, this.currentDispX, this.currentDispY, str.replace(' ', ''), P.GREEN);
        }};

        // UP arrow (right)
        this.createArrowButton(centerX + 120, controlY + 6, 'right', () => {
            this.currentAmps = Math.min(3.0, +(this.currentAmps + 0.5).toFixed(1));
            this.updateCurrentDisplay();
        });

        // === MEASURE BUTTON ===
        const measureY = controlY + 56;
        const measureBtnG = this.add.graphics().setDepth(this.DEPTH.UI + 1);
        this._drawMeasureButton(measureBtnG, centerX, measureY, false);

        const measureZone = this.add.zone(centerX, measureY, 130, 44)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.DEPTH.UI + 3);

        var measureLabel = this.t('measure_btn');
        if (this.isRTL && window.I18N) measureLabel = window.I18N.fixRTL(measureLabel);
        this.add.text(centerX, measureY, measureLabel, {
            fontFamily: this.rtlFont,
            fontSize: '12px',
            color: '#fff1e8',
            stroke: '#000000',
            strokeThickness: 2,
            padding: { x: 4, y: 2 },
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(this.DEPTH.UI + 3);

        // Subtle pulsing outline on measure button (no messy glow)
        const measureGlow = this.add.graphics().setDepth(this.DEPTH.UI);
        this.tweens.add({
            targets: measureGlow,
            alpha: { from: 0.4, to: 1.0 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                measureGlow.clear();
                const a = tween.getValue();
                measureGlow.lineStyle(2, P.CYAN, a * 0.6);
                measureGlow.strokeRect(centerX - 62, measureY - 22, 124, 44);
            }
        });

        measureZone.on('pointerover', () => {
            measureBtnG.clear();
            this._drawMeasureButton(measureBtnG, centerX, measureY, true);
        });
        measureZone.on('pointerout', () => {
            measureBtnG.clear();
            this._drawMeasureButton(measureBtnG, centerX, measureY, false);
        });
        measureZone.on('pointerdown', () => {
            this.takeMeasurement();
        });

        // === DATA TABLE ===
        this.createDataTable();

        // === GRAPH AREA ===
        this.graphGroup = this.add.container(0, 0).setDepth(this.DEPTH.UI);
        this.graphGroup.setVisible(false);

        // Restore previous measurements
        if (this.measurements.length > 0) {
            this.measurements.forEach((m, i) => {
                this.addMeasurementToTable(m, i);
            });
            if (this.measurements.length >= 3) {
                this.showGraph();
            }
        }
    }

    _drawMeasureButton(g, cx, cy, hover) {
        const P = this.P;
        const bw = 120, bh = 40;
        const color = hover ? P.CYAN : P.BRIGHT_BLUE;
        const shadow = hover ? P.BRIGHT_BLUE : P.MED_BLUE;
        // Shadow
        g.fillStyle(shadow, 1);
        g.fillRect(cx - bw / 2, cy - bh / 2 + 3, bw, bh);
        // Body
        g.fillStyle(color, 1);
        g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        // Top highlight
        g.fillStyle(P.WHITE, 0.2);
        g.fillRect(cx - bw / 2 + 2, cy - bh / 2, bw - 4, 2);
        // Bottom shadow
        g.fillStyle(P.BLACK, 0.2);
        g.fillRect(cx - bw / 2 + 2, cy + bh / 2 - 2, bw - 4, 2);
        // Side highlights
        g.fillStyle(P.WHITE, 0.1);
        g.fillRect(cx - bw / 2, cy - bh / 2 + 2, 2, bh - 4);
        g.fillStyle(P.BLACK, 0.1);
        g.fillRect(cx + bw / 2 - 2, cy - bh / 2 + 2, 2, bh - 4);
    }

    createArrowButton(x, y, dir, callback) {
        const P = this.P;
        const size = 22; // ~50px diameter

        const g = this.add.graphics().setDepth(this.DEPTH.UI + 2);
        const drawBtn = (hover) => {
            g.clear();
            const bgColor = hover ? P.BRIGHT_BLUE : P.MED_BLUE;
            const arrowColor = hover ? P.WHITE : P.WHITE;
            const arrowAlpha = hover ? 1 : 0.9;

            // Background circle
            g.fillStyle(bgColor, 1);
            g.beginPath();
            g.arc(x, y, size, 0, Math.PI * 2);
            g.fillPath();

            // Highlight on top
            g.fillStyle(P.WHITE, 0.15);
            g.beginPath();
            g.arc(x, y - 4, size - 6, Math.PI * 1.1, Math.PI * 1.9);
            g.fillPath();

            // Border
            g.lineStyle(2, P.LIGHT_GREY, 0.3);
            g.beginPath();
            g.arc(x, y, size, 0, Math.PI * 2);
            g.strokePath();

            // Big triangle arrow (50px area)
            g.fillStyle(arrowColor, arrowAlpha);
            if (dir === 'left') {
                g.fillTriangle(x - 12, y, x + 8, y - 14, x + 8, y + 14);
            } else {
                g.fillTriangle(x + 12, y, x - 8, y - 14, x - 8, y + 14);
            }
        };
        drawBtn(false);

        const zone = this.add.zone(x, y, size * 2, size * 2)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.DEPTH.UI + 3);

        zone.on('pointerover', () => drawBtn(true));
        zone.on('pointerout', () => drawBtn(false));
        zone.on('pointerdown', () => {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            callback();
        });
    }

    // Seven-segment display renderer - draws text using pixel rectangles
    // Guaranteed to work regardless of font loading issues
    _drawSegmentText(g, startX, startY, text, color) {
        const S = 3; // segment width
        const W = 12; // char width
        const H = 20; // char height
        const GAP = 14; // space between characters

        // Seven-segment patterns: [top, topRight, bottomRight, bottom, bottomLeft, topLeft, middle]
        const DIGITS = {
            '0': [1,1,1,1,1,1,0],
            '1': [0,1,1,0,0,0,0],
            '2': [1,1,0,1,1,0,1],
            '3': [1,1,1,1,0,0,1],
            '4': [0,1,1,0,0,1,1],
            '5': [1,0,1,1,0,1,1],
            '6': [1,0,1,1,1,1,1],
            '7': [1,1,1,0,0,0,0],
            '8': [1,1,1,1,1,1,1],
            '9': [1,1,1,1,0,1,1],
            '.': 'dot',
            'A': [1,1,1,0,1,1,1],
            '=': 'eq',
        };

        let cx = startX;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const seg = DIGITS[ch];

            if (seg === 'dot') {
                g.fillStyle(color, 1);
                g.fillRect(cx + 2, startY + H - S, S + 1, S + 1);
                cx += 8;
                continue;
            }
            if (seg === 'eq') {
                g.fillStyle(color, 1);
                g.fillRect(cx + 1, startY + 5, W - 2, S);
                g.fillRect(cx + 1, startY + 12, W - 2, S);
                cx += GAP;
                continue;
            }
            if (!seg) { cx += GAP; continue; }

            g.fillStyle(color, 1);
            // Top
            if (seg[0]) g.fillRect(cx + S, startY, W - S * 2, S);
            // Top-right
            if (seg[1]) g.fillRect(cx + W - S, startY + S, S, H / 2 - S);
            // Bottom-right
            if (seg[2]) g.fillRect(cx + W - S, startY + H / 2, S, H / 2 - S);
            // Bottom
            if (seg[3]) g.fillRect(cx + S, startY + H - S, W - S * 2, S);
            // Bottom-left
            if (seg[4]) g.fillRect(cx, startY + H / 2, S, H / 2 - S);
            // Top-left
            if (seg[5]) g.fillRect(cx, startY + S, S, H / 2 - S);
            // Middle
            if (seg[6]) g.fillRect(cx + S, startY + H / 2 - Math.floor(S / 2), W - S * 2, S);

            cx += GAP;
        }
    }

    // Draw a small number centered at (cx, cy) for galvanometer face
    _drawSmallNumber(g, cx, cy, text, color) {
        // Micro seven-segment: 2px segments, 6px wide, 10px tall
        const S = 2, W = 6, H = 10, GAP = 8;
        const SEGS = {
            '0': [1,1,1,1,1,1,0], '1': [0,1,1,0,0,0,0], '2': [1,1,0,1,1,0,1],
            '3': [1,1,1,1,0,0,1], '4': [0,1,1,0,0,1,1], '5': [1,0,1,1,0,1,1],
            '6': [1,0,1,1,1,1,1], '7': [1,1,1,0,0,0,0], '8': [1,1,1,1,1,1,1],
            '9': [1,1,1,1,0,1,1],
        };
        const totalW = text.length * GAP - (GAP - W);
        let x = cx - Math.floor(totalW / 2);
        const y = cy - Math.floor(H / 2);
        for (let i = 0; i < text.length; i++) {
            const seg = SEGS[text[i]];
            if (!seg) { x += GAP; continue; }
            g.fillStyle(color, 1);
            if (seg[0]) g.fillRect(x + S, y, W - S * 2, S);
            if (seg[1]) g.fillRect(x + W - S, y + S, S, H / 2 - S);
            if (seg[2]) g.fillRect(x + W - S, y + H / 2, S, H / 2 - S);
            if (seg[3]) g.fillRect(x + S, y + H - S, W - S * 2, S);
            if (seg[4]) g.fillRect(x, y + H / 2, S, H / 2 - S);
            if (seg[5]) g.fillRect(x, y + S, S, H / 2 - S);
            if (seg[6]) g.fillRect(x + S, y + H / 2 - 1, W - S * 2, S);
            x += GAP;
        }
    }

    // Draw letter N at (cx, cy) using pixel graphics
    _drawLetterN(g, cx, cy, color) {
        g.fillStyle(color, 1);
        const s = 3, h = 14;
        const x = cx - 6, y = cy - 7;
        g.fillRect(x, y, s, h);       // left vertical
        g.fillRect(x + 9, y, s, h);   // right vertical
        g.fillRect(x + s, y, s, s);   // top-left diagonal
        g.fillRect(x + s * 2, y + s, s, s); // mid diagonal
        g.fillRect(x + s * 2, y + s * 2, s, s); // bottom diagonal
    }

    // Draw letter S at (cx, cy) using pixel graphics
    _drawLetterS(g, cx, cy, color) {
        g.fillStyle(color, 1);
        const x = cx - 6, y = cy - 7;
        g.fillRect(x + 2, y, 8, 3);       // top bar
        g.fillRect(x, y + 2, 3, 4);       // top-left
        g.fillRect(x + 2, y + 5, 8, 3);   // middle bar
        g.fillRect(x + 9, y + 7, 3, 4);   // bottom-right
        g.fillRect(x + 2, y + 10, 8, 3);  // bottom bar
    }

    updateCurrentDisplay() {
        this.currentText.setText(this.currentAmps.toFixed(1) + ' A');
    }

    drawAssemblyGalvanometer(cx, cy) {
        const P = this.P;
        const R = 80;
        const g = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT);

        // Drop shadow
        g.fillStyle(0x000000, 0.35);
        g.fillCircle(cx + 3, cy + 3, R + 4);

        // Outer copper coil ring
        g.fillStyle(P.BROWN, 1);
        g.fillCircle(cx, cy, R + 2);
        g.lineStyle(6, P.ORANGE, 1);
        g.strokeCircle(cx, cy, R - 2);
        // Wire texture on coil
        for (let a = 0; a < 360; a += 10) {
            const rad = a * Math.PI / 180;
            g.lineStyle(1, P.BROWN, 0.5);
            g.beginPath();
            g.moveTo(cx + Math.cos(rad) * (R - 5), cy + Math.sin(rad) * (R - 5));
            g.lineTo(cx + Math.cos(rad) * (R + 1), cy + Math.sin(rad) * (R + 1));
            g.strokePath();
        }

        // Metal bezel
        g.lineStyle(4, P.DARK_GREY, 1);
        g.strokeCircle(cx, cy, R - 7);
        g.lineStyle(1, P.LIGHT_GREY, 0.4);
        g.strokeCircle(cx, cy, R - 9);

        // Dark face
        const faceR = R - 10;
        g.fillStyle(0x081420, 1);
        g.fillCircle(cx, cy, faceR);

        // Scale band
        g.lineStyle(14, 0x0f2235, 1);
        g.strokeCircle(cx, cy, faceR - 8);

        // Tick marks (simplified)
        for (let deg = 0; deg < 360; deg += 10) {
            const rad = (deg - 90) * Math.PI / 180;
            const isCardinal = (deg % 90 === 0);
            const is45 = (deg % 45 === 0);
            let inner, thick, col, alpha;
            if (isCardinal) { inner = faceR - 18; thick = 3; col = P.WHITE; alpha = 1; }
            else if (is45) { inner = faceR - 14; thick = 2; col = P.WHITE; alpha = 0.8; }
            else { inner = faceR - 10; thick = 1; col = P.LIGHT_GREY; alpha = 0.4; }
            g.lineStyle(thick, col, alpha);
            g.beginPath();
            g.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
            g.lineTo(cx + Math.cos(rad) * (faceR - 2), cy + Math.sin(rad) * (faceR - 2));
            g.strokePath();
        }

        // Center pivot
        g.fillStyle(P.DARK_GREY, 1); g.fillCircle(cx, cy, 5);
        g.fillStyle(P.LIGHT_GREY, 1); g.fillCircle(cx, cy, 3);
        g.fillStyle(P.WHITE, 1); g.fillCircle(cx, cy, 1.5);

        // N/S labels
        this.add.text(cx, cy - faceR * 0.7, 'N', {
            fontFamily: this.pixelFont, fontSize: '16px', color: '#ff004d',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(this.DEPTH.EQUIPMENT + 1);
        this.add.text(cx, cy + faceR * 0.7, 'S', {
            fontFamily: this.pixelFont, fontSize: '16px', color: '#29adff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(this.DEPTH.EQUIPMENT + 1);

        // Glass-like reflection highlight
        g.fillStyle(P.WHITE, 0.06);
        g.beginPath();
        g.arc(cx - 10, cy - 15, faceR * 0.6, Math.PI * 1.2, Math.PI * 1.9);
        g.fillPath();

        // Subtle floating animation
        this.tweens.add({
            targets: g, y: -3,
            duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }

    drawGalvanometerFace(cx, cy, R) {
        const P = this.P;
        const g = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT);
        const numDepth = this.DEPTH.EQUIPMENT + 1;
        const faceR = R - 12;

        // ── Drop shadow ──
        g.fillStyle(0x000000, 0.4);
        g.fillCircle(cx + 3, cy + 3, R + 4);

        // ── Outer copper coil (thick orange stroke) ──
        g.fillStyle(P.BROWN, 1);
        g.fillCircle(cx, cy, R + 2);
        g.lineStyle(8, P.ORANGE, 1);
        g.strokeCircle(cx, cy, R - 3);
        // Wire texture
        for (let a = 0; a < 360; a += 8) {
            const rad = a * Math.PI / 180;
            g.lineStyle(1, P.BROWN, 0.5);
            g.beginPath();
            g.moveTo(cx + Math.cos(rad) * (R - 7), cy + Math.sin(rad) * (R - 7));
            g.lineTo(cx + Math.cos(rad) * (R + 1), cy + Math.sin(rad) * (R + 1));
            g.strokePath();
        }

        // ── Metal bezel ring ──
        g.lineStyle(5, P.DARK_GREY, 1);
        g.strokeCircle(cx, cy, R - 9);
        g.lineStyle(1, P.LIGHT_GREY, 0.4);
        g.strokeCircle(cx, cy, R - 11);

        // ── Dark face ──
        g.fillStyle(0x081420, 1);
        g.fillCircle(cx, cy, faceR);
        g.lineStyle(1, P.MED_BLUE, 0.3);
        g.strokeCircle(cx, cy, faceR);

        // ── White scale band (ring where ticks sit) ──
        g.lineStyle(20, 0x0f2235, 1);
        g.strokeCircle(cx, cy, faceR - 12);

        // ── Tick marks ──
        for (let deg = 0; deg < 360; deg += 5) {
            const rad = (deg - 90) * Math.PI / 180;
            const isCardinal = (deg % 90 === 0);
            const is45 = (deg % 45 === 0);
            const is10 = (deg % 10 === 0);
            let inner, thick, col, a;
            if (isCardinal) {       inner = faceR - 24; thick = 3; col = P.WHITE; a = 1; }
            else if (is45) {        inner = faceR - 20; thick = 2; col = P.WHITE; a = 0.9; }
            else if (is10) {        inner = faceR - 14; thick = 1; col = P.LIGHT_GREY; a = 0.6; }
            else {                  inner = faceR - 10; thick = 1; col = P.LIGHT_GREY; a = 0.3; }
            g.lineStyle(thick, col, a);
            g.beginPath();
            g.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
            g.lineTo(cx + Math.cos(rad) * (faceR - 3), cy + Math.sin(rad) * (faceR - 3));
            g.strokePath();
        }

        // ── Cross hairs ──
        g.lineStyle(1, P.MED_BLUE, 0.12);
        g.beginPath(); g.moveTo(cx, cy - faceR * 0.5); g.lineTo(cx, cy - 8); g.strokePath();
        g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx, cy + faceR * 0.5); g.strokePath();
        g.beginPath(); g.moveTo(cx - faceR * 0.5, cy); g.lineTo(cx - 8, cy); g.strokePath();
        g.beginPath(); g.moveTo(cx + 8, cy); g.lineTo(cx + faceR * 0.5, cy); g.strokePath();

        // ── Center pivot ──
        g.fillStyle(P.DARK_GREY, 1);  g.fillCircle(cx, cy, 6);
        g.fillStyle(P.LIGHT_GREY, 1); g.fillCircle(cx, cy, 4);
        g.fillStyle(P.WHITE, 1);      g.fillCircle(cx, cy, 2);

        // ── DEGREE NUMBERS (drawn as pixel graphics - guaranteed rendering) ──
        const numG = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT + 3);
        const nums = [
            { deg: 0,   label: '0' },
            { deg: 30,  label: '30' },
            { deg: 60,  label: '60' },
            { deg: 90,  label: '90' },
            { deg: 180, label: '0' },
            { deg: 270, label: '90' },
            { deg: 300, label: '60' },
            { deg: 330, label: '30' },
        ];
        nums.forEach(n => {
            const rad = (90 - n.deg) * Math.PI / 180;
            const nr = faceR * 0.58;
            const tx = Math.round(cx + nr * Math.cos(rad));
            const ty = Math.round(cy - nr * Math.sin(rad));
            // Char size for galvanometer numbers: smaller
            this._drawSmallNumber(numG, tx, ty, n.label, P.WHITE);
        });

        // N / S labels (drawn as colored blocks)
        const nsG = this.add.graphics().setDepth(this.DEPTH.EQUIPMENT + 3);
        this._drawLetterN(nsG, cx, Math.round(cy - faceR * 0.82), P.RED);
        this._drawLetterS(nsG, cx, Math.round(cy + faceR * 0.82), P.BRIGHT_BLUE);
    }

    drawNeedle(angleDeg) {
        const g = this.needleGraphics;
        g.clear();
        const cx = this.galvCX;
        const cy = this.galvCY;
        const len = this.galvNeedleLen;
        const rad = (angleDeg - 90) * Math.PI / 180;

        // Red half (north)
        const nx = cx + Math.cos(rad) * len;
        const ny = cy + Math.sin(rad) * len;
        g.lineStyle(4, this.P.RED, 1);
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(nx, ny);
        g.strokePath();

        // Blue half (south)
        const sx = cx - Math.cos(rad) * len * 0.7;
        const sy = cy - Math.sin(rad) * len * 0.7;
        g.lineStyle(4, this.P.BRIGHT_BLUE, 1);
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(sx, sy);
        g.strokePath();

        // Tip markers
        g.fillStyle(this.P.WHITE, 1);
        g.fillRect(Math.round(nx) - 2, Math.round(ny) - 2, 4, 4);
        g.fillStyle(this.P.WHITE, 0.5);
        g.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3);

        // Center dot
        g.fillStyle(this.P.WHITE, 1);
        g.beginPath();
        g.arc(cx, cy, 4, 0, Math.PI * 2);
        g.fillPath();
        g.fillStyle(this.P.LIGHT_GREY, 1);
        g.beginPath();
        g.arc(cx, cy, 2, 0, Math.PI * 2);
        g.fillPath();
    }

    animateNeedle(targetAngle) {
        this.tweens.add({
            targets: this,
            needleAngle: targetAngle,
            duration: 1200,
            ease: 'Back.easeOut',
            onUpdate: () => {
                this.drawNeedle(this.needleAngle);
            }
        });
    }

    takeMeasurement() {
        if (window.AudioManager) window.AudioManager.playSFX('click');

        const I = this.currentAmps;

        // Block duplicate current values
        if (this.measurements.some(m => Math.abs(m.current - I) < 0.01)) {
            // Show warning
            if (this._dupeWarning) this._dupeWarning.destroy();
            this._dupeWarning = this.add.text(this.W / 2, this.H * 0.55,
                this.t('lab_duplicate_current') || 'This current was already measured!', {
                fontFamily: this.rtlFont || this.fontFamily,
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#ff004d',
                stroke: '#000000',
                strokeThickness: 3,
                rtl: this.isRTL
            }).setOrigin(0.5).setDepth(60);
            this.tweens.add({
                targets: this._dupeWarning,
                alpha: 0, y: this.H * 0.52,
                duration: 1500, delay: 500,
                onComplete: () => { if (this._dupeWarning) { this._dupeWarning.destroy(); this._dupeWarning = null; } }
            });
            if (window.AudioManager) window.AudioManager.playSFX('error');
            return;
        }
        const B_coil = this.MU0 * this.COIL_N * I / (2 * this.COIL_R);
        const BH = this.BH_ACTUAL * 1e-6;
        const tanTheta = B_coil / BH;
        const theta = Math.atan(tanTheta) * 180 / Math.PI;

        // Small noise
        const noise = (Math.random() - 0.5) * 2;
        const measuredTheta = theta + noise;
        const measuredTan = Math.tan(measuredTheta * Math.PI / 180);

        const measurement = {
            index: this.measurements.length + 1,
            current: I,
            angle: +measuredTheta.toFixed(1),
            tanTheta: +measuredTan.toFixed(3),
            B_coil: +(B_coil * 1e6).toFixed(2),
            mu0NI_2R: +(B_coil * 1e6).toFixed(2)
        };

        this.measurements.push(measurement);
        if (this.GS) this.GS.addMeasurement(measurement);

        this.animateNeedle(measuredTheta);
        if (this.angleReadout) {
            this.angleReadout.setText(`\u03B8 = ${measuredTheta.toFixed(1)}\u00B0`);
        }
        this.addMeasurementToTable(measurement, this.measurements.length - 1);

        if (this.measurements.length >= 3) {
            this.time.delayedCall(800, () => {
                if (!this.graphVisible) {
                    this.showGraph();
                } else {
                    this.updateGraphPoints();
                }
            });
        }

        if (this.measurements.length >= 5) {
            this.time.delayedCall(1500, () => {
                this.promptDiscovery();
            });
        }
    }

    createDataTable() {
        const P = this.P;
        const isRTL = this.isRTL;
        const tableX = isRTL ? 12 : this.W - 160;
        const tableY = Math.round(this.H * 0.04);
        const tableW = 148;

        this.dataTableContainer = this.add.container(0, 0).setDepth(this.DEPTH.UI);

        // Panel background
        const tbg = this.add.graphics();
        tbg.fillStyle(P.DEEP_NAVY, 0.93);
        tbg.fillRect(tableX, tableY, tableW, 32);
        tbg.lineStyle(2, P.MED_BLUE, 0.7);
        tbg.strokeRect(tableX, tableY, tableW, 32);
        // Header
        tbg.fillStyle(P.MED_BLUE, 0.45);
        tbg.fillRect(tableX + 1, tableY + 1, tableW - 2, 15);
        this.dataTableContainer.add(tbg);
        this.tableBg = tbg;

        // Column headers
        const cols = ['#', 'I(A)', '\u03B8\u00B0', 'tan(\u03B8)'];
        const colX = [tableX + 14, tableX + 42, tableX + 78, tableX + 120];
        cols.forEach((col, i) => {
            const txt = this.add.text(colX[i], tableY + 8, col, {
                fontFamily: this.pixelFont,
                fontSize: '8px',
                color: '#fff1e8',
                align: 'center'
            }).setOrigin(0.5).setDepth(this.DEPTH.UI + 1);
            this.dataTableContainer.add(txt);
        });

        this.tableX = tableX;
        this.tableY = tableY;
        this.tableW = tableW;
        this.tableColX = colX;
        this.tableRowCount = 0;
    }

    addMeasurementToTable(m, index) {
        const P = this.P;
        const rowY = this.tableY + 19 + index * 15;
        const colX = this.tableColX;

        // Alternating row colors
        const rowBg = this.add.graphics().setDepth(this.DEPTH.UI - 1);
        rowBg.fillStyle(index % 2 === 0 ? P.DARK_BLUE : P.DEEP_NAVY, 0.85);
        rowBg.fillRect(this.tableX + 1, rowY, this.tableW - 2, 14);
        // Subtle row separator
        rowBg.fillStyle(P.MED_BLUE, 0.15);
        rowBg.fillRect(this.tableX + 1, rowY + 13, this.tableW - 2, 1);
        this.dataTableContainer.add(rowBg);

        const rowData = [
            `${m.index}`,
            `${Number(m.current).toFixed(1)}`,
            `${Number(m.angle).toFixed(1)}`,
            `${Number(m.tanTheta).toFixed(2)}`
        ];

        rowData.forEach((val, i) => {
            const txt = this.add.text(colX[i], rowY + 7, val, {
                fontFamily: this.pixelFont,
                fontSize: '8px',
                color: '#00e436',
                align: 'center'
            }).setOrigin(0.5).setDepth(this.DEPTH.UI + 1);
            this.dataTableContainer.add(txt);
        });

        // Animate row appearing
        rowBg.setAlpha(0);
        this.tweens.add({ targets: rowBg, alpha: 1, duration: 300 });
        this.tableRowCount++;

        // Expand table panel background to fit all rows
        this.updateTablePanelSize();
    }

    updateTablePanelSize() {
        const P = this.P;
        const panelH = 19 + this.tableRowCount * 15 + 4;
        this.tableBg.clear();
        this.tableBg.fillStyle(P.DEEP_NAVY, 0.93);
        this.tableBg.fillRect(this.tableX, this.tableY, this.tableW, panelH);
        this.tableBg.lineStyle(2, P.MED_BLUE, 0.7);
        this.tableBg.strokeRect(this.tableX, this.tableY, this.tableW, panelH);
        // Header
        this.tableBg.fillStyle(P.MED_BLUE, 0.45);
        this.tableBg.fillRect(this.tableX + 1, this.tableY + 1, this.tableW - 2, 15);
    }

    showGraph() {
        if (this.graphVisible) return;
        this.graphVisible = true;

        const P = this.P;
        const isRTL = this.isRTL;
        const gw = 420;
        const gh = 310;
        const gx = Math.round((this.W - gw) / 2);
        const gy = Math.round((this.H - gh) / 2);

        this.graphGroup.setVisible(true);

        // Dimmed overlay behind graph
        const dimOverlay = this.add.graphics().setDepth(this.DEPTH.OVERLAY - 1);
        dimOverlay.fillStyle(0x000000, 0.5);
        dimOverlay.fillRect(0, 0, this.W, this.H);
        this.graphGroup.add(dimOverlay);

        // Graph panel background
        const gbg = this.add.graphics().setDepth(this.DEPTH.OVERLAY);
        gbg.fillStyle(P.DEEP_NAVY, 0.97);
        gbg.fillRoundedRect(gx, gy, gw, gh, 8);
        gbg.lineStyle(2, P.MED_BLUE, 0.7);
        gbg.strokeRoundedRect(gx, gy, gw, gh, 8);
        this.graphGroup.add(gbg);

        // Title
        var graphTitleStr = this.t('graph_title');
        if (this.isRTL && window.I18N) graphTitleStr = window.I18N.fixRTL(graphTitleStr);
        const graphTitle = this.add.text(gx + gw / 2, gy + 16, graphTitleStr, {
            fontFamily: this.rtlFont,
            fontSize: '12px',
            color: '#fff1e8',
            align: 'center',
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(this.DEPTH.OVERLAY + 1);
        this.graphGroup.add(graphTitle);

        // Close button (X) top-right
        const closeBtn = this.add.text(gx + gw - 14, gy + 10, 'X', {
            fontFamily: this.pixelFont, fontSize: '10px', color: '#ff004d'
        }).setOrigin(0.5).setDepth(this.DEPTH.OVERLAY + 2);
        const closeBtnZone = this.add.zone(gx + gw - 14, gy + 10, 44, 44)
            .setInteractive({ useHandCursor: true })
            .setDepth(this.DEPTH.OVERLAY + 3);
        closeBtnZone.on('pointerdown', () => {
            this.graphGroup.setVisible(false);
        });
        closeBtnZone.on('pointerover', () => { closeBtn.setColor('#fff1e8'); });
        closeBtnZone.on('pointerout', () => { closeBtn.setColor('#ff004d'); });
        this.graphGroup.add(closeBtn);
        this.graphGroup.add(closeBtnZone);

        // Axes
        const axisG = this.add.graphics().setDepth(this.DEPTH.OVERLAY);
        const ox = gx + 54;
        const oy = gy + gh - 40;
        const axW = gw - 80;
        const axH = gh - 72;

        // Pixel-art grid
        axisG.lineStyle(1, P.MED_BLUE, 0.2);
        for (let i = 1; i <= 4; i++) {
            const yy = oy - Math.round((axH / 4) * i);
            axisG.beginPath();
            axisG.moveTo(ox, yy);
            axisG.lineTo(ox + axW, yy);
            axisG.strokePath();
        }
        for (let i = 1; i <= 4; i++) {
            const xx = ox + Math.round((axW / 4) * i);
            axisG.beginPath();
            axisG.moveTo(xx, oy);
            axisG.lineTo(xx, oy - axH);
            axisG.strokePath();
        }

        // Main axes (thick)
        axisG.lineStyle(2, P.LIGHT_GREY, 0.8);
        axisG.beginPath();
        axisG.moveTo(ox, oy);
        axisG.lineTo(ox + axW, oy);
        axisG.strokePath();
        axisG.beginPath();
        axisG.moveTo(ox, oy);
        axisG.lineTo(ox, oy - axH);
        axisG.strokePath();

        // Axis arrow tips
        axisG.fillStyle(P.LIGHT_GREY, 0.8);
        axisG.fillTriangle(ox + axW, oy, ox + axW - 6, oy - 4, ox + axW - 6, oy + 4);
        axisG.fillTriangle(ox, oy - axH, ox - 4, oy - axH + 6, ox + 4, oy - axH + 6);

        this.graphGroup.add(axisG);

        // Axis labels
        const axisLabelG = this.add.text(ox + axW / 2, oy + 24, '\u03BC\u2080NI/2R (\u03BCT)', {
            fontFamily: this.pixelFont, fontSize: '10px', color: '#c2c3c7'
        }).setOrigin(0.5).setDepth(this.DEPTH.OVERLAY + 1);
        this.graphGroup.add(axisLabelG);

        const axisLabelY = this.add.text(ox - 26, oy - axH / 2, 'tan(\u03B8)', {
            fontFamily: this.pixelFont, fontSize: '10px', color: '#c2c3c7'
        }).setOrigin(0.5).setAngle(-90).setDepth(this.DEPTH.OVERLAY + 1);
        this.graphGroup.add(axisLabelY);

        // Plot data points
        const maxBcoil = Math.max(...this.measurements.map(m => m.mu0NI_2R), 1);
        const maxTan = Math.max(...this.measurements.map(m => Math.abs(m.tanTheta)), 0.1);
        const scaleX = axW / (maxBcoil * 1.2);
        const scaleY = axH / (maxTan * 1.2);

        this.graphOx = ox;
        this.graphOy = oy;
        this.graphScaleX = scaleX;
        this.graphScaleY = scaleY;
        this.graphAxW = axW;
        this.graphAxH = axH;

        // Axis tick labels (X axis)
        const xTickMax = maxBcoil * 1.2;
        const xTickStep = this._niceStep(xTickMax, 4);
        for (let v = xTickStep; v <= xTickMax; v += xTickStep) {
            const tx = ox + v * scaleX;
            if (tx > ox + axW - 12) break;
            const label = this.add.text(Math.round(tx), oy + 8, v.toFixed(0), {
                fontFamily: this.pixelFont, fontSize: '10px', color: '#83769c'
            }).setOrigin(0.5, 0).setDepth(this.DEPTH.OVERLAY + 1);
            this.graphGroup.add(label);
            // Tick mark
            axisG.lineStyle(1, P.LIGHT_GREY, 0.5);
            axisG.beginPath();
            axisG.moveTo(Math.round(tx), oy);
            axisG.lineTo(Math.round(tx), oy + 4);
            axisG.strokePath();
        }
        // Y axis tick labels
        const yTickMax = maxTan * 1.2;
        const yTickStep = this._niceStep(yTickMax, 4);
        for (let v = yTickStep; v <= yTickMax; v += yTickStep) {
            const ty = oy - v * scaleY;
            if (ty < oy - axH + 12) break;
            const label = this.add.text(ox - 6, Math.round(ty), v.toFixed(1), {
                fontFamily: this.pixelFont, fontSize: '10px', color: '#83769c'
            }).setOrigin(1, 0.5).setDepth(this.DEPTH.OVERLAY + 1);
            this.graphGroup.add(label);
            // Tick mark
            axisG.lineStyle(1, P.LIGHT_GREY, 0.5);
            axisG.beginPath();
            axisG.moveTo(ox, Math.round(ty));
            axisG.lineTo(ox - 4, Math.round(ty));
            axisG.strokePath();
        }

        const pointColors = [P.YELLOW, P.CYAN, P.GREEN, P.PINK, P.ORANGE, P.RED];
        this.measurements.forEach((m, i) => {
            const px = ox + m.mu0NI_2R * scaleX;
            const py = oy - m.tanTheta * scaleY;
            const pt = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 2);
            // 10px square data points
            pt.fillStyle(pointColors[i % pointColors.length], 1);
            pt.fillRect(Math.round(px) - 5, Math.round(py) - 5, 10, 10);
            pt.lineStyle(1, P.WHITE, 0.5);
            pt.strokeRect(Math.round(px) - 5, Math.round(py) - 5, 10, 10);
            this.graphGroup.add(pt);

            // Coordinate label — alternate above/below to avoid overlap
            var labelAbove = (i % 2 === 0);
            var labelOffY = labelAbove ? -12 : 14;
            var labelOriY = labelAbove ? 1 : 0;
            const coordLabel = this.add.text(Math.round(px), Math.round(py) + labelOffY,
                `(${Number(m.mu0NI_2R).toFixed(1)}, ${Number(m.tanTheta).toFixed(2)})`, {
                fontFamily: this.pixelFont, fontSize: '10px', color: '#fff1e8'
            }).setOrigin(0.5, labelOriY).setDepth(this.DEPTH.OVERLAY + 3);
            this.graphGroup.add(coordLabel);

            pt.setAlpha(0);
            coordLabel.setAlpha(0);
            this.tweens.add({
                targets: [pt, coordLabel],
                alpha: 1,
                duration: 300,
                delay: i * 200
            });
        });

        this.graphGx = gx;
        this.graphGy = gy;
        this.graphGw = gw;
        this.graphGh = gh;
    }

    updateGraphPoints() {
        if (!this.graphVisible) return;

        const m = this.measurements[this.measurements.length - 1];
        const P = this.P;
        const ox = this.graphOx;
        const oy = this.graphOy;

        const maxBcoil = Math.max(...this.measurements.map(m => m.mu0NI_2R), 1);
        const maxTan = Math.max(...this.measurements.map(m => Math.abs(m.tanTheta)), 0.1);
        const scaleX = this.graphAxW / (maxBcoil * 1.2);
        const scaleY = this.graphAxH / (maxTan * 1.2);

        const pointColors = [P.YELLOW, P.CYAN, P.GREEN, P.PINK, P.ORANGE, P.RED];
        const i = this.measurements.length - 1;
        const px = ox + m.mu0NI_2R * scaleX;
        const py = oy - m.tanTheta * scaleY;
        const pt = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 2);
        pt.fillStyle(pointColors[i % pointColors.length], 1);
        pt.fillRect(Math.round(px) - 5, Math.round(py) - 5, 10, 10);
        pt.lineStyle(1, P.WHITE, 0.5);
        pt.strokeRect(Math.round(px) - 5, Math.round(py) - 5, 10, 10);
        this.graphGroup.add(pt);

        // Coordinate label
        const coordLabel = this.add.text(Math.round(px) + 8, Math.round(py) - 8,
            `(${Number(m.mu0NI_2R).toFixed(1)}, ${Number(m.tanTheta).toFixed(2)})`, {
            fontFamily: this.pixelFont, fontSize: '10px', color: '#fff1e8'
        }).setOrigin(0, 1).setDepth(this.DEPTH.OVERLAY + 3);
        this.graphGroup.add(coordLabel);
    }

    promptDiscovery() {
        if (this.discoveryPrompted) return;
        this.discoveryPrompted = true;

        this.scene.launch('Dialog', {
            dialogs: [
                { npc: 'magneta', text: this.t('magneta_quest_graph') }
            ],
            onComplete: () => {
                this.showDiscoveryQuestion();
            }
        });
    }

    showDiscoveryQuestion() {
        const P = this.P;
        const w = this.W, h = this.H;
        const centerX = Math.round(w / 2);
        const qY = Math.round(h * 0.78);

        // Overlay panel (wide enough for 3 choice buttons with wrapped text)
        const overlay = this.add.graphics().setDepth(this.DEPTH.OVERLAY);
        overlay.fillStyle(P.DEEP_NAVY, 0.93);
        overlay.fillRoundedRect(centerX - 300, qY - 45, 600, 100, 8);
        overlay.lineStyle(2, P.YELLOW, 0.6);
        overlay.strokeRoundedRect(centerX - 300, qY - 45, 600, 100, 8);

        // Three answer buttons with icons ABOVE text
        const choices = [
            { key: 'random', text: this.t('pattern_random'), correct: false },
            { key: 'line', text: this.t('pattern_line'), correct: true },
            { key: 'curve', text: this.t('pattern_curve'), correct: false },
        ];

        choices.forEach((choice, i) => {
            const bx = centerX - 150 + i * 150;
            const by = qY;

            // Button bg
            const btnG = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 1);
            this._drawChoiceButton(btnG, bx, by, false);

            // Icon centered in top half of button
            const iconG = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 2);
            const iconCX = bx;
            const iconCY = by - 8;
            if (choice.key === 'random') {
                // Scatter dots icon (contained within button)
                const dots = [[-12, -6], [-4, 4], [6, -2], [14, 6], [0, -8]];
                dots.forEach(([dx, dy]) => {
                    iconG.fillStyle(P.YELLOW, 0.9);
                    iconG.fillRect(iconCX + dx - 2, iconCY + dy - 2, 4, 4);
                });
            } else if (choice.key === 'line') {
                // Straight line icon
                iconG.lineStyle(3, P.GREEN, 1);
                iconG.beginPath();
                iconG.moveTo(iconCX - 18, iconCY + 6);
                iconG.lineTo(iconCX + 18, iconCY - 6);
                iconG.strokePath();
                // Data point dots on the line
                [[-14, 4], [-4, 1], [6, -2], [14, -5]].forEach(([dx, dy]) => {
                    iconG.fillStyle(P.WHITE, 1);
                    iconG.fillRect(iconCX + dx - 1, iconCY + dy - 1, 3, 3);
                });
            } else {
                // Curved line icon
                iconG.lineStyle(3, P.CYAN, 1);
                iconG.beginPath();
                iconG.moveTo(iconCX - 18, iconCY + 6);
                iconG.lineTo(iconCX - 8, iconCY + 2);
                iconG.lineTo(iconCX, iconCY - 2);
                iconG.lineTo(iconCX + 8, iconCY - 5);
                iconG.lineTo(iconCX + 18, iconCY - 6);
                iconG.strokePath();
            }

            // Label text centered below icon
            var btnText = choice.text;
            if (this.isRTL && window.I18N) btnText = window.I18N.fixRTL(btnText);
            this.add.text(bx, by + 14, btnText, {
                fontFamily: this.rtlFont,
                fontSize: '12px',
                color: '#fff1e8',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: 120, useAdvancedWrap: true },
                padding: { x: 2, y: 1 },
                rtl: this.isRTL
            }).setOrigin(0.5, 0.5).setDepth(this.DEPTH.OVERLAY + 3);

            // Interactive zone
            const zone = this.add.zone(bx, by, 130, 55)
                .setInteractive({ useHandCursor: true })
                .setDepth(this.DEPTH.OVERLAY + 4);

            zone.on('pointerover', () => {
                btnG.clear();
                this._drawChoiceButton(btnG, bx, by, true);
            });
            zone.on('pointerout', () => {
                btnG.clear();
                this._drawChoiceButton(btnG, bx, by, false);
            });
            zone.on('pointerdown', () => {
                if (window.AudioManager) window.AudioManager.playSFX('click');

                if (choice.correct) {
                    this.handleCorrectAnswer(overlay);
                } else {
                    // Wrong: flash red
                    btnG.clear();
                    this._drawChoiceButton(btnG, bx, by, false, true);
                    this.time.delayedCall(300, () => {
                        btnG.clear();
                        this._drawChoiceButton(btnG, bx, by, false);
                    });

                    const hint = this.add.text(centerX, qY - 42, this.t('hint_try_again'), {
                        fontFamily: this.rtlFont,
                        fontSize: '14px',
                        color: '#ff004d',
                        align: 'center',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5).setDepth(this.DEPTH.OVERLAY + 5);
                    this.tweens.add({
                        targets: hint,
                        alpha: 0,
                        y: qY - 60,
                        duration: 1500,
                        onComplete: () => hint.destroy()
                    });
                }
            });
        });
    }

    _niceStep(maxVal, targetTicks) {
        const rough = maxVal / targetTicks;
        const pow = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / pow;
        let step;
        if (norm <= 1.5) step = 1;
        else if (norm <= 3.5) step = 2;
        else if (norm <= 7.5) step = 5;
        else step = 10;
        return step * pow;
    }

    _drawChoiceButton(g, cx, cy, hover, error) {
        const P = this.P;
        const bw = 130, bh = 50;
        const color = error ? P.RED : (hover ? P.BRIGHT_BLUE : P.MED_BLUE);
        const shadow = error ? 0x800020 : (hover ? P.MED_BLUE : P.DARK_BLUE);
        // Shadow
        g.fillStyle(shadow, 1);
        g.fillRect(cx - bw / 2, cy - bh / 2 + 3, bw, bh);
        // Body
        g.fillStyle(color, 0.95);
        g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        // Border
        g.lineStyle(2, error ? P.RED : (hover ? P.CYAN : P.BRIGHT_BLUE), 0.9);
        g.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
        // Top highlight
        g.fillStyle(P.WHITE, 0.2);
        g.fillRect(cx - bw / 2 + 2, cy - bh / 2, bw - 4, 2);
        // Bottom shadow
        g.fillStyle(P.BLACK, 0.15);
        g.fillRect(cx - bw / 2 + 2, cy + bh / 2 - 2, bw - 4, 2);
    }

    handleCorrectAnswer(overlay) {
        const P = this.P;
        const w = this.W, h = this.H;
        const centerX = Math.round(w / 2);

        // Calculate BH
        let sumXY = 0, sumXX = 0;
        this.measurements.forEach(m => {
            sumXY += m.mu0NI_2R * m.tanTheta;
            sumXX += m.mu0NI_2R * m.mu0NI_2R;
        });
        const slope = sumXY / sumXX;
        const calculatedBH = (1 / slope).toFixed(1);

        if (this.GS) {
            this.GS.calculatedBH = +calculatedBH;
            // Advance to Act 2 - unlock Navigation room
            this.GS.startAct(2);
        }

        // Add evidence
        if (this.GS) {
            this.GS.addEvidence({
                id: 'bh_measurement',
                act: 1,
                title: this.t('quest_calculate_title'),
                value: `BH = ${calculatedBH} \u03BCT`
            });
        }

        // BIG flash (yellow/white)
        const flash = this.add.graphics().setDepth(this.DEPTH.OVERLAY + 10);
        flash.fillStyle(P.YELLOW, 0.6);
        flash.fillRect(0, 0, w, h);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 900,
            onComplete: () => flash.destroy()
        });

        // Orange best-fit line on graph
        if (this.graphVisible) {
            const lineG = this.add.graphics().setDepth(this.DEPTH.UI + 3);
            lineG.lineStyle(3, P.ORANGE, 0.9);
            const ox = this.graphOx;
            const oy = this.graphOy;
            lineG.beginPath();
            lineG.moveTo(ox, oy);
            const endX = ox + this.graphAxW;
            const endTan = slope * (this.graphAxW / this.graphScaleX + 0.1);
            const endY = oy - endTan * this.graphScaleY;
            lineG.lineTo(endX, Math.max(oy - this.graphAxH, endY));
            lineG.strokePath();

            // Slope label on graph
            this.add.text(ox + this.graphAxW / 2, oy - this.graphAxH - 8, this.t('slope_label'), {
                fontFamily: this.rtlFont,
                fontSize: '6px',
                color: '#ffa300'
            }).setOrigin(0.5).setDepth(this.DEPTH.UI + 4);
        }

        // BH result text on the graph (no separate panel)
        const bhDisplay = `BH = ${calculatedBH} \u03BCT`;
        this.add.text(centerX, Math.round(h * 0.48), bhDisplay, {
            fontFamily: this.pixelFont,
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffec27',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(this.DEPTH.OVERLAY + 9);

        if (window.AudioManager) window.AudioManager.playSFX('success');

        // Sparks everywhere
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 70, () => {
                this.emitCollectParticles(
                    Phaser.Math.Between(Math.round(w * 0.15), Math.round(w * 0.85)),
                    Phaser.Math.Between(Math.round(h * 0.25), Math.round(h * 0.6))
                );
            });
        }

        // Then Magneta revelation — two-part dialog
        this.time.delayedCall(3000, () => {
            const expectedBH = 45;
            const gap = Math.abs(expectedBH - parseFloat(calculatedBH)).toFixed(1);
            const successText = this.t('magneta_success').replace('{value}', calculatedBH);
            const revelationText = (this.t('magneta_revelation') || 'The expected value in this area is {expected} μT. There\'s a gap of {gap} μT. Something is affecting Aurora\'s magnetic field!')
                .replace('{expected}', expectedBH)
                .replace('{gap}', gap)
                .replace('{value}', calculatedBH);
            this.scene.launch('Dialog', {
                dialogs: [
                    { npc: 'magneta', text: successText },
                    { npc: 'magneta', text: revelationText }
                ],
                onComplete: () => {
                    this.scene.start('ShipHub');
                }
            });
        });
    }

    // =============================================
    // PHASE 3: DISCOVERY (review/revisit)
    // =============================================
    createDiscoveryPhase() {
        const w = this.W, h = this.H;
        const P = this.P;
        const centerX = Math.round(w / 2);
        const centerY = Math.round(h * 0.33);

        // Assembled galvanometer (drawn with Phaser graphics)
        this.drawAssemblyGalvanometer(centerX, centerY);

        // Quest complete badge
        this.add.text(centerX, Math.round(h * 0.12), this.t('quest_complete'), {
            fontFamily: this.rtlFont,
            fontSize: '14px',
            color: '#ffec27',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(this.DEPTH.UI + 1);

        // BH result prominently
        const bhVal = this.GS ? this.GS.calculatedBH : '?';
        const bhText = this.t('bh_result').replace('{value}', bhVal);

        const resultG = this.add.graphics().setDepth(this.DEPTH.UI);
        resultG.fillStyle(P.DEEP_NAVY, 0.93);
        resultG.fillRect(centerX - 140, Math.round(h * 0.53), 280, 55);
        resultG.lineStyle(3, P.GREEN, 0.8);
        resultG.strokeRect(centerX - 140, Math.round(h * 0.53), 280, 55);

        // Check icon
        this.add.image(centerX - 110, Math.round(h * 0.53) + 28, 'icon_check')
            .setScale(3.5)
            .setDepth(this.DEPTH.UI + 1);

        this.add.text(centerX + 10, Math.round(h * 0.53) + 28, bhText, {
            fontFamily: this.rtlFont,
            fontSize: '13px',
            color: '#00e436',
            align: 'center'
        }).setOrigin(0.5).setDepth(this.DEPTH.UI + 1);

        // Mini graph
        this.showMiniGraph(centerX, Math.round(h * 0.76));
    }

    showMiniGraph(cx, cy) {
        const P = this.P;
        const gw = 130, gh = 90;
        const gx = cx - Math.round(gw / 2);
        const gy = cy - Math.round(gh / 2);

        const mg = this.add.graphics().setDepth(this.DEPTH.UI);
        mg.fillStyle(P.DEEP_NAVY, 0.92);
        mg.fillRect(gx, gy, gw, gh);
        mg.lineStyle(1, P.MED_BLUE, 0.6);
        mg.strokeRect(gx, gy, gw, gh);

        // Axes
        const ox = gx + 18;
        const oy = gy + gh - 14;
        const axW = gw - 28;
        const axH = gh - 24;
        mg.lineStyle(1, P.LIGHT_GREY, 0.5);
        mg.beginPath();
        mg.moveTo(ox, oy);
        mg.lineTo(ox + axW, oy);
        mg.strokePath();
        mg.beginPath();
        mg.moveTo(ox, oy);
        mg.lineTo(ox, oy - axH);
        mg.strokePath();

        // Plot points
        if (this.measurements.length > 0) {
            const maxBcoil = Math.max(...this.measurements.map(m => m.mu0NI_2R), 1);
            const maxTan = Math.max(...this.measurements.map(m => Math.abs(m.tanTheta)), 0.1);
            const sx = axW / (maxBcoil * 1.2);
            const sy = axH / (maxTan * 1.2);

            this.measurements.forEach((m) => {
                const px = ox + m.mu0NI_2R * sx;
                const py = oy - m.tanTheta * sy;
                mg.fillStyle(P.CYAN, 1);
                mg.fillRect(Math.round(px) - 3, Math.round(py) - 3, 6, 6);
            });

            // Best-fit line (orange)
            let sumXY = 0, sumXX = 0;
            this.measurements.forEach(m => {
                sumXY += m.mu0NI_2R * m.tanTheta;
                sumXX += m.mu0NI_2R * m.mu0NI_2R;
            });
            const slope = sumXY / sumXX;
            mg.lineStyle(2, P.ORANGE, 0.9);
            mg.beginPath();
            mg.moveTo(ox, oy);
            const endBcoil = maxBcoil * 1.1;
            const endTan = slope * endBcoil;
            mg.lineTo(ox + endBcoil * sx, oy - endTan * sy);
            mg.strokePath();
        }
    }

    update() {
        // All animation is tween-based; no per-frame logic needed
    }
}

window.LabScene = LabScene;
