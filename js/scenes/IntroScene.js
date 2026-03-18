/**
 * IntroScene - Cinematic story introduction with timed beats.
 * Sets up the narrative urgency before gameplay begins.
 */
class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Intro' });
    }

    create() {
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        var self = this;
        this.W = w;
        this.H = h;
        this.t = function (key) { return window.I18N ? window.I18N.t(key) : key; };
        this.isRTL = window.I18N && window.I18N.isRTL();
        this.fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';
        this.transitioning = false;
        this.currentBeat = 0;
        this.beatElements = [];
        this.skippable = false;

        // Full black screen to start
        this.blackOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000).setDepth(100).setAlpha(1);

        // Background layers (hidden initially)
        this.bgGfx = this.add.graphics().setDepth(0);
        this.oceanGfx = this.add.graphics().setDepth(1);
        this.waveTime = 0;
        this.waveSpeed = 0.8;
        this.stormActive = false;

        // Lightning layer
        this.lightningGfx = this.add.graphics().setDepth(50);

        // Rain emitter (created but inactive)
        this.rainEmitter = null;

        // Ship container
        this.shipContainer = null;

        // Portrait + dialog layer
        this.dialogLayer = this.add.container(0, 0).setDepth(60);

        // Compass layer
        this.compassLayer = this.add.container(0, 0).setDepth(55);

        // Text layer (on top of most things)
        this.textLayer = this.add.container(0, 0).setDepth(70);

        // Draw static sky background
        this.drawSkyBg();

        // Start beat sequence
        this.startBeat1();

        // After beat 2, allow skip on click
        this.time.delayedCall(4500, function () {
            self.skippable = true;
        });

        this.input.on('pointerdown', function () {
            if (self.transitioning) return;
            if (self.skippable && self.currentBeat < 8) {
                self.skipToCountdown();
            } else if (self.currentBeat >= 9) {
                self.goToShipHub();
            }
        });

        // Keyboard
        this.input.keyboard.on('keydown-SPACE', function () {
            if (self.transitioning) return;
            if (self.skippable && self.currentBeat < 8) {
                self.skipToCountdown();
            } else if (self.currentBeat >= 9) {
                self.goToShipHub();
            }
        });
    }

    // -- Helper: get font size based on language --
    // Pixel font gets enSize, Noto Sans gets bumped up and has enforced minimums
    getFontSize(enSize) {
        var numericSize = parseInt(enSize);
        if (this.fontFamily === 'Press Start 2P') {
            // Enforce minimum 12px for pixel font
            return Math.max(numericSize, 12) + 'px';
        }
        // Noto Sans: bump +8 and enforce minimum 18px
        return Math.max(numericSize + 8, 18) + 'px';
    }

    // -- Helper: create text with shadow (draw dark text behind, offset by 2px) --
    addShadowedText(x, y, str, style, depth) {
        var shadowColor = '#0d1b2a';
        var shadowStyle = {};
        for (var k in style) {
            shadowStyle[k] = style[k];
        }
        shadowStyle.color = shadowColor;
        var shadow = this.add.text(x + 2, y + 2, str, shadowStyle)
            .setOrigin(style._originX !== undefined ? style._originX : 0.5, style._originY !== undefined ? style._originY : 0.5)
            .setAlpha(0)
            .setDepth(depth || 0);
        var main = this.add.text(x, y, str, style)
            .setOrigin(style._originX !== undefined ? style._originX : 0.5, style._originY !== undefined ? style._originY : 0.5)
            .setAlpha(0)
            .setDepth((depth || 0) + 1);
        return { shadow: shadow, main: main, setAlpha: function (a) { shadow.setAlpha(a * 0.6); main.setAlpha(a); return this; } };
    }

    // -- Helper: format RTL text with numbers --
    formatRTLText(text) {
        if (!this.isRTL) return text;
        if (window.I18N && window.I18N.formatMixed) {
            text = window.I18N.formatMixed(text);
        }
        if (window.I18N && window.I18N.fixRTL) {
            text = window.I18N.fixRTL(text);
        }
        return text;
    }

    // -- Helper: get RTL style properties --
    getRTLStyle() {
        if (!this.isRTL) return {};
        return { rtl: true };
    }

    // -- Draw the sky background --
    drawSkyBg() {
        var w = this.W, h = this.H;
        var bg = this.bgGfx;
        var bandH = 4;
        for (var y = 0; y < h; y += bandH) {
            var ratio = y / h;
            var r = Math.floor(Phaser.Math.Linear(0x03, 0x08, ratio));
            var g = Math.floor(Phaser.Math.Linear(0x08, 0x12, ratio));
            var b = Math.floor(Phaser.Math.Linear(0x18, 0x28, ratio));
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            bg.fillRect(0, y, w, bandH);
        }
    }

    // -- Create stars --
    createStars() {
        var w = this.W, h = this.H;
        this._stars = [];
        for (var i = 0; i < 60; i++) {
            var size = Phaser.Math.Between(1, 3);
            var star = this.add.rectangle(
                Phaser.Math.Between(0, w),
                Phaser.Math.Between(0, Math.floor(h * 0.5)),
                size, size, 0xfff1e8
            ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.7)).setDepth(1);
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.05, 0.3),
                duration: Phaser.Math.Between(1500, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this._stars.push(star);
        }
    }

    // -- Create ship (drawn directly with graphics, matching TitleScene style) --
    createShip() {
        var w = this.W, h = this.H;
        var oceanBaseY = Math.floor(h * 0.60);
        var shipY = oceanBaseY - 2; // Sit right on ocean surface
        this.shipBaseY = shipY;

        var shipG = this.add.graphics().setDepth(3);

        // Hull - centered on screen, smaller than title but same style
        var hullW = 180;
        var hullH = 14;
        var hullX = Math.floor(w / 2 - hullW / 2);

        // Main hull
        shipG.fillStyle(0x1b2838, 1);
        shipG.fillRect(hullX, shipY - hullH, hullW, hullH);
        // Hull bottom curve (bow and stern taper)
        shipG.fillRect(hullX + 8, shipY, hullW - 16, 4);
        shipG.fillRect(hullX + 16, shipY + 4, hullW - 32, 3);
        // Bow (pointed front)
        shipG.fillRect(hullX + hullW, shipY - 10, 12, 10);
        shipG.fillRect(hullX + hullW + 12, shipY - 6, 8, 5);
        shipG.fillRect(hullX + hullW + 20, shipY - 3, 4, 2);
        // Stern
        shipG.fillRect(hullX - 6, shipY - 12, 8, 12);

        // Rust stripe
        shipG.fillStyle(0xab5236, 1);
        shipG.fillRect(hullX - 3, shipY - 3, hullW + 22, 3);

        // Waterline highlight
        shipG.fillStyle(0x2d4a6a, 0.6);
        shipG.fillRect(hullX, shipY, hullW, 2);

        // Portholes
        shipG.fillStyle(0xffec27, 0.5);
        for (var pi = 0; pi < 8; pi++) {
            shipG.fillRect(hullX + 20 + pi * 18, shipY - 7, 3, 3);
        }

        // === Superstructure ===
        var deckY = shipY - hullH;

        // Deck line
        shipG.fillStyle(0x5f574f, 1);
        shipG.fillRect(hullX, deckY, hullW, 2);

        // Railing posts
        shipG.fillStyle(0xc2c3c7, 0.4);
        for (var ri = 0; ri < 18; ri++) {
            shipG.fillRect(hullX + 8 + ri * 10, deckY - 5, 1, 5);
        }
        shipG.fillRect(hullX + 8, deckY - 5, 172, 1);

        // Aft cabin block (rear)
        shipG.fillStyle(0x2d4a6a, 1);
        shipG.fillRect(hullX + 8, deckY - 26, 50, 20);
        // Upper deck
        shipG.fillStyle(0x3a5a7a, 1);
        shipG.fillRect(hullX + 12, deckY - 36, 42, 10);
        // Bridge (top)
        shipG.fillStyle(0x4a7a9a, 1);
        shipG.fillRect(hullX + 16, deckY - 42, 34, 6);
        // Bridge windows
        shipG.fillStyle(0x29adff, 0.9);
        for (var bwi = 0; bwi < 3; bwi++) {
            shipG.fillRect(hullX + 19 + bwi * 10, deckY - 40, 6, 3);
        }
        // Cabin windows (lit)
        shipG.fillStyle(0xffec27, 0.8);
        for (var cwx = 0; cwx < 4; cwx++) {
            shipG.fillRect(hullX + 12 + cwx * 10, deckY - 22, 4, 4);
            shipG.fillRect(hullX + 12 + cwx * 10, deckY - 14, 4, 4);
        }

        // Smokestack
        shipG.fillStyle(0x5f574f, 1);
        shipG.fillRect(hullX + 64, deckY - 38, 10, 32);
        shipG.fillStyle(0xff004d, 1);
        shipG.fillRect(hullX + 64, deckY - 38, 10, 4);
        shipG.fillStyle(0xfff1e8, 0.7);
        shipG.fillRect(hullX + 64, deckY - 34, 10, 2);
        // Smoke
        shipG.fillStyle(0xc2c3c7, 0.25);
        shipG.fillRect(hullX + 66, deckY - 44, 5, 5);
        shipG.fillRect(hullX + 63, deckY - 49, 4, 4);

        // Mid-ship lab
        shipG.fillStyle(0x2d4a6a, 1);
        shipG.fillRect(hullX + 80, deckY - 22, 40, 16);
        // Lab windows (green glow)
        shipG.fillStyle(0x00e436, 0.6);
        for (var lwi = 0; lwi < 3; lwi++) {
            shipG.fillRect(hullX + 84 + lwi * 12, deckY - 18, 4, 4);
        }

        // Crane
        shipG.fillStyle(0x5f574f, 1);
        shipG.fillRect(hullX + 126, deckY - 32, 2, 26);
        shipG.fillRect(hullX + 126, deckY - 32, 16, 2);
        shipG.fillRect(hullX + 140, deckY - 32, 2, 10);
        shipG.fillStyle(0xffec27, 0.6);
        shipG.fillRect(hullX + 139, deckY - 22, 4, 3);

        // Lifeboats
        shipG.fillStyle(0xffa300, 0.9);
        shipG.fillRect(hullX + 148, deckY - 12, 10, 4);
        shipG.fillRect(hullX + 162, deckY - 12, 10, 4);

        // Radar mast
        shipG.fillStyle(0xc2c3c7, 0.8);
        shipG.fillRect(hullX + 30, deckY - 56, 2, 18);
        // Radar dish
        shipG.fillStyle(0xfff1e8, 0.6);
        shipG.fillRect(hullX + 24, deckY - 58, 14, 2);
        // Antenna light
        shipG.fillStyle(0xff004d, 1);
        shipG.fillRect(hullX + 29, deckY - 60, 4, 2);

        // Anchor
        shipG.fillStyle(0x5f574f, 1);
        shipG.fillRect(hullX + hullW - 8, shipY - 8, 4, 4);

        this.shipGraphics = shipG;

        // Water reflection below ship
        var reflGfx = this.add.graphics().setDepth(2).setAlpha(0.15);
        reflGfx.fillStyle(0xffec27, 0.08);
        reflGfx.fillRect(hullX + 16, shipY + 8, hullW - 16, 22);
        reflGfx.fillStyle(0x00e436, 0.03);
        reflGfx.fillRect(hullX + 80, shipY + 8, 40, 14);
        this._shipReflection = reflGfx;

        // Ship bob animation
        this.tweens.add({
            targets: shipG,
            y: 3,
            duration: 2800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // -- Ocean drawing (called in update) --
    drawOcean() {
        var w = this.W, h = this.H;
        var og = this.oceanGfx;
        og.clear();
        var baseY = Math.floor(h * 0.60);
        var colors = this.stormActive ? [0x0d1b2a, 0x1b2838, 0x0d1b2a, 0x1b2838] : [0x0d1b2a, 0x1b2838, 0x2d4a6a, 0x1b2838];
        var amp = this.stormActive ? 8 : 3;
        var layerCount = 4;

        for (var layer = 0; layer < layerCount; layer++) {
            var ly = baseY + layer * 7;
            var speed = (this.stormActive ? 2.5 : 1.0) + layer * 0.4;
            og.fillStyle(colors[layer], layer === 0 ? 1 : 0.85);
            og.beginPath();
            og.moveTo(0, h);
            for (var x = 0; x <= w; x += 3) {
                var wy = ly + Math.floor(Math.sin(x * 0.02 + this.waveTime * speed + layer * 0.5) * (amp + layer * 1.5));
                og.lineTo(x, wy);
            }
            og.lineTo(w, h);
            og.closePath();
            og.fillPath();
        }

        // Foam highlights on first wave
        if (this.stormActive) {
            og.fillStyle(0xc2c3c7, 0.15);
            for (var fx = 0; fx < w; fx += 6) {
                var fwy = baseY + Math.floor(Math.sin(fx * 0.02 + this.waveTime * 2.5) * amp) - 2;
                og.fillRect(fx, fwy, 4, 1);
            }
        }
    }

    // -- BEAT 1: Black screen with location text (dramatic, bigger, with bg panels) --
    startBeat1() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 1;

        var titleFontSize = this.getFontSize('22px');
        var smallFontSize = this.getFontSize('16px');
        var locFontSize = this.getFontSize('13px');

        var rtlStyle = this.getRTLStyle();

        // Semi-transparent dark background panel behind all beat 1 text
        var bgPanel = this.add.graphics().setDepth(100).setAlpha(0);
        bgPanel.fillStyle(0x000000, 0.55);
        bgPanel.fillRect(w / 2 - 200, h / 2 - 56, 400, 140);
        // Subtle border
        bgPanel.fillStyle(0x53d8fb, 0.2);
        bgPanel.fillRect(w / 2 - 200, h / 2 - 56, 400, 2);
        bgPanel.fillRect(w / 2 - 200, h / 2 + 82, 400, 2);

        // Shadow for ship name (3px offset for clarity)
        var shipNameStr = this.formatRTLText(this.t('intro_ship_name'));
        var shipNameShadow = this.add.text(w / 2 + 3, h / 2 - 27, shipNameStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: titleFontSize,
            color: '#000000',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(101);

        var shipNameText = this.add.text(w / 2, h / 2 - 30, shipNameStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: titleFontSize,
            color: '#fff1e8',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(102);

        // Shadow for day (3px offset)
        var dayStr = this.formatRTLText(this.t('intro_day'));
        var dayShadow = this.add.text(w / 2 + 3, h / 2 + 17, dayStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: smallFontSize,
            color: '#000000',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(101);

        var dayText = this.add.text(w / 2, h / 2 + 14, dayStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: smallFontSize,
            color: '#53d8fb',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(102);

        // Shadow for location (3px offset)
        var locStr = this.formatRTLText(this.t('intro_location'));
        var locShadow = this.add.text(w / 2 + 3, h / 2 + 53, locStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: locFontSize,
            color: '#000000',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(101);

        var locText = this.add.text(w / 2, h / 2 + 50, locStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: locFontSize,
            color: '#c2c3c7',
            align: 'center'
        }, rtlStyle)).setOrigin(0.5).setAlpha(0).setDepth(102);

        // Fade in bg panel first
        this.tweens.add({ targets: bgPanel, alpha: 1, duration: 600, delay: 200 });

        // Dramatic fade-in with slight upward motion
        this.tweens.add({ targets: [shipNameText, shipNameShadow], alpha: 1, y: '-=4', duration: 1000, delay: 300, ease: 'Power2' });
        this.tweens.add({ targets: shipNameShadow, alpha: 0.6, y: '-=4', duration: 1000, delay: 300, ease: 'Power2' });
        this.tweens.add({ targets: [dayText, dayShadow], alpha: 1, y: '-=3', duration: 800, delay: 900, ease: 'Power2' });
        this.tweens.add({ targets: dayShadow, alpha: 0.5, y: '-=3', duration: 800, delay: 900, ease: 'Power2' });
        this.tweens.add({ targets: [locText, locShadow], alpha: 0.9, y: '-=3', duration: 800, delay: 1400, ease: 'Power2' });
        this.tweens.add({ targets: locShadow, alpha: 0.4, y: '-=3', duration: 800, delay: 1400, ease: 'Power2' });

        // Decorative line under ship name
        var lineGfx = this.add.graphics().setDepth(101).setAlpha(0);
        lineGfx.fillStyle(0x53d8fb, 0.6);
        lineGfx.fillRect(w / 2 - 70, h / 2 - 4, 140, 2);
        this.tweens.add({ targets: lineGfx, alpha: 1, duration: 600, delay: 1200 });

        this.beat1Elements = [shipNameText, shipNameShadow, dayText, dayShadow, locText, locShadow, lineGfx, bgPanel];

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 1) self.startBeat2();
        });
    }

    // -- BEAT 2: Fade to ocean scene, peaceful --
    startBeat2() {
        var self = this;
        this.currentBeat = 2;

        // Fade out beat 1 text
        if (this.beat1Elements) {
            this.beat1Elements.forEach(function (el) {
                self.tweens.add({ targets: el, alpha: 0, duration: 600 });
            });
        }

        // Fade out black overlay
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: 1500
        });

        // Create scene elements
        this.createStars();
        this.createShip();
        this.showOcean = true;

        // Music + Ambient
        try {
            if (window.AudioManager) {
                // Keep menu music playing until lab
                window.AudioManager.startAmbient('ocean');
            }
        } catch (e) { /* silent */ }

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 2) self.startBeat3();
        });
    }

    // -- BEAT 3: Storm hits (more dramatic) --
    startBeat3() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 3;
        this.stormActive = true;

        // Screen shake (stronger)
        this.cameras.main.shake(800, 0.015);

        // Lightning flash + thunder sound
        this.cameras.main.flash(300, 255, 255, 255);
        try { if (window.AudioManager) window.AudioManager.playSFX('lightning_crack'); } catch (e) {}

        // Start rain particles (heavier rain)
        if (this.textures.exists('raindrop')) {
            this.rainEmitter = this.add.particles(0, 0, 'raindrop', {
                x: { min: 0, max: w },
                y: -10,
                speedY: { min: 300, max: 550 },
                speedX: { min: -60, max: -20 },
                scale: { min: 1, end: 1.5 },
                alpha: { start: 0.6, end: 0.15 },
                lifespan: 1200,
                frequency: 8,
                quantity: 5
            }).setDepth(10);
        }

        // More lightning bolts, more frequent
        this.lightningTimer = this.time.addEvent({
            delay: 800,
            repeat: 5,
            callback: function () {
                self.flashLightning();
                self.cameras.main.shake(400, 0.012);
            }
        });

        // Storm SFX + ambient
        try {
            if (window.AudioManager) {
                window.AudioManager.playSFX('storm');
                window.AudioManager.startAmbient('storm');
            }
        } catch (e) { /* silent */ }

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 3) self.startBeat4();
        });
    }

    // -- BEAT 4: Inside ship, compass going wild --
    startBeat4() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 4;

        // Dark overlay with red pulsing
        this.interiorOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x0d1b2a).setDepth(40).setAlpha(0);
        this.tweens.add({
            targets: this.interiorOverlay,
            alpha: 0.92,
            duration: 800
        });

        // Red emergency pulsing (brighter)
        this.redPulse = this.add.rectangle(w / 2, h / 2, w, h, 0xff004d).setDepth(41).setAlpha(0);
        this.tweens.add({
            targets: this.redPulse,
            alpha: 0.12,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Big compass in center
        var compassScale = 4;
        this.bigCompass = this.add.image(w / 2, h / 2 - 20, 'compass_rose')
            .setScale(compassScale)
            .setDepth(42)
            .setAlpha(0);
        this.bigNeedle = this.add.image(w / 2, h / 2 - 20, 'compass_needle_big')
            .setScale(compassScale)
            .setDepth(43)
            .setAlpha(0);

        this.tweens.add({ targets: this.bigCompass, alpha: 0.8, duration: 600 });
        this.tweens.add({ targets: this.bigNeedle, alpha: 0.9, duration: 600 });

        // Needle spins wildly (in update)
        this.compassSpinning = true;
        this.compassSpinAngle = 0;

        // Text: compass haywire (bigger, brighter, with bg panel)
        var fontSize = this.getFontSize('14px');
        var haywireStr = this.formatRTLText(this.t('intro_compass_haywire'));
        var haywireRTL = this.getRTLStyle();

        // Background panel behind text
        this.beat4BgPanel = this.add.graphics().setDepth(43).setAlpha(0);
        this.beat4BgPanel.fillStyle(0x000000, 0.5);
        this.beat4BgPanel.fillRect(w / 2 - 160, h / 2 + 64, 320, 36);

        var shadowText = this.add.text(w / 2 + 3, h / 2 + 83, haywireStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: fontSize,
            color: '#000000',
            align: 'center'
        }, haywireRTL)).setOrigin(0.5).setAlpha(0).setDepth(44);

        this.beat4Text = this.add.text(w / 2, h / 2 + 80, haywireStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: fontSize,
            color: '#ff004d',
            align: 'center'
        }, haywireRTL)).setOrigin(0.5).setAlpha(0).setDepth(45);

        this.beat4Shadow = shadowText;
        this.tweens.add({ targets: this.beat4BgPanel, alpha: 1, duration: 400, delay: 400 });
        this.tweens.add({ targets: [this.beat4Text, shadowText], alpha: 1, duration: 500, delay: 500 });
        this.tweens.add({ targets: shadowText, alpha: 0.6, duration: 500, delay: 500 });

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 4) self.startBeat5();
        });
    }

    // -- BEAT 5: Captain dialog --
    startBeat5() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 5;

        // Fade compass down
        if (this.bigCompass) this.tweens.add({ targets: this.bigCompass, alpha: 0.2, duration: 300 });
        if (this.bigNeedle) this.tweens.add({ targets: this.bigNeedle, alpha: 0.2, duration: 300 });
        if (this.beat4Text) this.tweens.add({ targets: this.beat4Text, alpha: 0, duration: 200 });
        if (this.beat4Shadow) this.tweens.add({ targets: this.beat4Shadow, alpha: 0, duration: 200 });
        if (this.beat4BgPanel) this.tweens.add({ targets: this.beat4BgPanel, alpha: 0, duration: 200 });

        this.showPortraitDialog('portrait_captain', 'captain_name', 'intro_captain_call', 0xffa300, function () {
            self.time.delayedCall(500, function () {
                if (self.currentBeat === 5) self.startBeat6();
            });
        });

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 5) self.startBeat6();
        });
    }

    // -- BEAT 6: Magneta dialog --
    startBeat6() {
        var self = this;
        this.currentBeat = 6;
        this.clearDialogLayer();

        this.showPortraitDialog('portrait_magneta', 'magneta_name', 'intro_magneta_hurt', 0xff77a8, function () {});

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 6) self.startBeat7();
        });
    }

    // -- BEAT 7: Captain again --
    startBeat7() {
        var self = this;
        this.currentBeat = 7;
        this.clearDialogLayer();

        this.showPortraitDialog('portrait_captain', 'captain_name', 'intro_captain_hope', 0xffa300, function () {});

        this.time.delayedCall(4000, function () {
            if (self.currentBeat === 7) self.startBeat8();
        });
    }

    // -- BEAT 8: Countdown reveal (DRAMATIC, HUGE) --
    startBeat8() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 8;
        this.skippable = false;

        // Clear everything
        this.clearDialogLayer();
        if (this.bigCompass) this.bigCompass.setAlpha(0);
        if (this.bigNeedle) this.bigNeedle.setAlpha(0);
        this.compassSpinning = false;
        if (this.redPulse) this.redPulse.setAlpha(0);

        // Full black
        if (this.interiorOverlay) {
            this.interiorOverlay.setAlpha(1);
            this.interiorOverlay.setFillStyle(0x000000, 1);
        } else {
            this.interiorOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000).setDepth(40).setAlpha(1);
        }

        // Layout: spread 4 elements evenly across vertical space
        // Countdown header (top), timer display (center), sub text (below), button (bottom)
        var countHeaderY = Math.floor(h * 0.24);  // ~130
        var timerY = Math.floor(h * 0.44);         // ~238
        var subTextY = Math.floor(h * 0.62);       // ~335

        // Countdown header text (bigger, brighter, with bg panel)
        var countFontSize = this.getFontSize('16px');
        var countdownStr = this.formatRTLText(this.t('intro_countdown'));
        var countRTL = this.getRTLStyle();

        // Background panel behind countdown text
        var countBgPanel = this.add.graphics().setDepth(79).setAlpha(0);
        countBgPanel.fillStyle(0x1b2838, 0.6);
        countBgPanel.fillRect(w / 2 - Math.floor(w * 0.44), countHeaderY - 18, Math.floor(w * 0.88), 36);
        this.tweens.add({ targets: countBgPanel, alpha: 1, duration: 800 });

        var countShadow = this.add.text(w / 2 + 3, countHeaderY + 3, countdownStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: countFontSize,
            color: '#000000',
            align: 'center',
            wordWrap: { width: w * 0.85 }
        }, countRTL)).setOrigin(0.5).setAlpha(0).setDepth(80);

        var countdownText = this.add.text(w / 2, countHeaderY, countdownStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: countFontSize,
            color: '#ff004d',
            align: 'center',
            wordWrap: { width: w * 0.85 }
        }, countRTL)).setOrigin(0.5).setAlpha(0).setDepth(81);

        this.tweens.add({ targets: [countdownText, countShadow], alpha: 1, y: '-=6', duration: 1200, ease: 'Power2' });
        this.tweens.add({ targets: countShadow, alpha: 0.6, y: '-=6', duration: 1200, ease: 'Power2' });

        // HUGE timer display (32px+ pixel font, bright yellow)
        var timerFontSize = '36px';
        var timerShadow = this.add.text(w / 2 + 3, timerY + 3, '6:00', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: timerFontSize,
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0).setDepth(80);

        this.countdownDisplay = this.add.text(w / 2, timerY, '6:00', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: timerFontSize,
            color: '#ffec27',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0).setDepth(81);

        this.countdownShadow = timerShadow;

        this.tweens.add({ targets: [this.countdownDisplay, timerShadow], alpha: 1, duration: 800, delay: 900 });
        this.tweens.add({ targets: timerShadow, alpha: 0.4, duration: 800, delay: 900 });

        // Pulsing glow behind timer
        var timerGlow = this.add.rectangle(w / 2, timerY, 200, 50, 0xffec27).setDepth(79).setAlpha(0);
        this.tweens.add({
            targets: timerGlow,
            alpha: 0.06,
            duration: 800,
            delay: 900,
            onComplete: function () {
                self.tweens.add({
                    targets: timerGlow,
                    alpha: 0.02,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Animate countdown from 6:00 to 5:59
        this.time.delayedCall(2200, function () {
            if (self.countdownDisplay) {
                self.countdownDisplay.setText('5:59');
                if (self.countdownShadow) self.countdownShadow.setText('5:59');
                self.cameras.main.shake(150, 0.005);
            }
        });

        // Sub text (bigger, clearer, with bg panel)
        var subFontSize = this.getFontSize('12px');
        var subStr = this.formatRTLText(this.t('intro_countdown_sub'));

        // Background panel behind sub text
        var subBgPanel = this.add.graphics().setDepth(79).setAlpha(0);
        subBgPanel.fillStyle(0x1b2838, 0.5);
        subBgPanel.fillRect(w / 2 - Math.floor(w * 0.39), subTextY - 18, Math.floor(w * 0.78), 36);
        this.tweens.add({ targets: subBgPanel, alpha: 1, duration: 600, delay: 1400 });

        var subShadow = this.add.text(w / 2 + 3, subTextY + 3, subStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: subFontSize,
            color: '#000000',
            align: 'center',
            wordWrap: { width: w * 0.75 }
        }, countRTL)).setOrigin(0.5).setAlpha(0).setDepth(80);

        var subText = this.add.text(w / 2, subTextY, subStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: subFontSize,
            color: '#c2c3c7',
            align: 'center',
            wordWrap: { width: w * 0.75 }
        }, countRTL)).setOrigin(0.5).setAlpha(0).setDepth(81);

        this.tweens.add({ targets: [subText, subShadow], alpha: 0.9, duration: 800, delay: 1600, ease: 'Power2' });
        this.tweens.add({ targets: subShadow, alpha: 0.5, duration: 800, delay: 1600, ease: 'Power2' });

        this.time.delayedCall(3500, function () {
            if (self.currentBeat === 8) self.startBeat9();
        });
    }

    // -- BEAT 9: Press to begin --
    startBeat9() {
        var self = this;
        var w = this.W, h = this.H;
        this.currentBeat = 9;

        var pressFontSize = this.getFontSize('14px');
        var pressStr = this.formatRTLText(this.t('press_to_begin'));
        var pressRTL = this.getRTLStyle();

        // Background panel behind press text
        var pressY = Math.floor(h * 0.80);
        var pressBgPanel = this.add.graphics().setDepth(79).setAlpha(0);
        pressBgPanel.fillStyle(0x1b2838, 0.5);
        pressBgPanel.fillRect(w / 2 - 140, pressY - 16, 280, 32);
        this.tweens.add({ targets: pressBgPanel, alpha: 1, duration: 300 });

        var pressShadow = this.add.text(w / 2 + 3, pressY + 3, pressStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: pressFontSize,
            color: '#000000',
            align: 'center'
        }, pressRTL)).setOrigin(0.5).setAlpha(0).setDepth(80);

        var pressBegin = this.add.text(w / 2, pressY, pressStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: pressFontSize,
            color: '#fff1e8',
            align: 'center'
        }, pressRTL)).setOrigin(0.5).setAlpha(0).setDepth(81);

        this.tweens.add({ targets: [pressBegin, pressShadow], alpha: 1, duration: 400 });
        this.tweens.add({ targets: pressShadow, alpha: 0.4, duration: 400 });

        // Blink
        this.time.addEvent({
            delay: 800,
            loop: true,
            callback: function () {
                if (pressBegin && pressBegin.active) {
                    var newAlpha = pressBegin.alpha > 0.5 ? 0 : 1;
                    pressBegin.setAlpha(newAlpha);
                    pressShadow.setAlpha(newAlpha * 0.4);
                }
            }
        });
    }

    // -- Show portrait + dialog box for a beat (bigger text, shadows) --
    showPortraitDialog(portraitKey, nameKey, textKey, nameColor, onDone) {
        var w = this.W, h = this.H;
        var isRTL = this.isRTL;

        this.clearDialogLayer();

        // Dialog box background (bigger)
        var boxY = h - 130;
        var boxH = 110;
        var boxGfx = this.add.graphics().setDepth(45);
        // Dark bg with pixel border
        boxGfx.fillStyle(0x1b2838, 0.95);
        boxGfx.fillRect(8, boxY, w - 16, boxH);
        // Outer border (bright)
        boxGfx.fillStyle(0x53d8fb, 0.6);
        boxGfx.fillRect(8, boxY, w - 16, 2);
        boxGfx.fillRect(8, boxY, 2, boxH);
        boxGfx.fillRect(8, boxY + boxH - 2, w - 16, 2);
        boxGfx.fillRect(w - 10, boxY, 2, boxH);
        // Inner border
        boxGfx.fillStyle(0x2d4a6a, 0.8);
        boxGfx.fillRect(12, boxY + 4, w - 24, 2);
        boxGfx.fillRect(12, boxY + 4, 2, boxH - 8);
        boxGfx.fillRect(12, boxY + boxH - 6, w - 24, 2);
        boxGfx.fillRect(w - 14, boxY + 4, 2, boxH - 8);

        // Portrait (bigger)
        var portraitX = isRTL ? w - 60 : 50;
        var portrait = this.add.image(portraitX, boxY + boxH / 2, portraitKey)
            .setScale(3.5)
            .setDepth(46);

        // Breathing
        this.tweens.add({
            targets: portrait,
            y: portrait.y - 1,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Name (bigger, brighter)
        var nameX = isRTL ? w - 105 : 95;
        var nameAlign = isRTL ? 1 : 0;
        var nameFontSize = this.getFontSize('12px');
        var nameStr = this.t(nameKey);
        var colorStr = '#' + nameColor.toString(16).padStart(6, '0');

        // Name shadow
        var rtlDialogStyle = this.getRTLStyle();
        var nameRTLStr = this.isRTL && window.I18N ? window.I18N.fixRTL(nameStr) : nameStr;
        this.add.text(nameX + 1, boxY + 13, nameRTLStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: nameFontSize,
            color: '#0d1b2a'
        }, rtlDialogStyle)).setOrigin(nameAlign, 0).setDepth(47);

        var nameText = this.add.text(nameX, boxY + 12, nameRTLStr, Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: nameFontSize,
            color: colorStr
        }, rtlDialogStyle)).setOrigin(nameAlign, 0).setDepth(48);

        // Dialog text with typewriter (bigger)
        var textX = isRTL ? w - 105 : 95;
        var textMaxW = w - 180;
        var dialogFontSize = this.getFontSize('12px');
        var fullText = this.t(textKey);
        if (this.isRTL && window.I18N) fullText = window.I18N.fixRTL(fullText);
        var dialogText = this.add.text(textX, boxY + 42, '', Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: dialogFontSize,
            color: '#fff1e8',
            wordWrap: { width: textMaxW },
            lineSpacing: 8,
            align: isRTL ? 'right' : 'left'
        }, rtlDialogStyle)).setOrigin(isRTL ? 1 : 0, 0).setDepth(48);

        // Typewriter
        var charIndex = 0;
        this.time.addEvent({
            delay: 25,
            repeat: fullText.length - 1,
            callback: function () {
                charIndex++;
                dialogText.setText(fullText.substring(0, charIndex));
            }
        });

        this._dialogElements = [boxGfx, portrait, nameText, dialogText];
        // collect shadow too
        var nameShadowEl = nameText; // already tracked via nameText ref
        this._dialogElements.push(this._dialogElements[this._dialogElements.length - 1]); // already included
    }

    clearDialogLayer() {
        if (this._dialogElements) {
            this._dialogElements.forEach(function (el) {
                if (el && el.destroy) el.destroy();
            });
            this._dialogElements = null;
        }
    }

    // -- Lightning flash (bigger, more dramatic) --
    flashLightning() {
        var self = this;
        var w = this.W, h = this.H;

        // Screen flash + lightning crack sound
        this.cameras.main.flash(120, 255, 255, 255, true);
        try { if (window.AudioManager) window.AudioManager.playSFX('lightning_crack'); } catch (e) {}

        // Draw bolt (thicker, more segments)
        var lg = this.lightningGfx;
        lg.clear();

        // Draw 2 bolts for more drama
        for (var bolt = 0; bolt < 2; bolt++) {
            lg.fillStyle(bolt === 0 ? 0xfff1e8 : 0xffec27, bolt === 0 ? 0.9 : 0.6);
            var lx = Phaser.Math.Between(Math.floor(w * 0.15), Math.floor(w * 0.85));
            var ly = 0;
            while (ly < h * 0.55) {
                var newLx = lx + Phaser.Math.Between(-16, 16);
                var newLy = ly + Phaser.Math.Between(6, 20);
                // Thicker bolts
                lg.fillRect(Math.min(lx, newLx), ly, Math.abs(newLx - lx) + 3, 3);
                lg.fillRect(newLx, ly, 3, newLy - ly);
                // Branch occasionally
                if (Math.random() > 0.7) {
                    var branchX = newLx + Phaser.Math.Between(-20, 20);
                    var branchY = newLy + Phaser.Math.Between(10, 30);
                    lg.fillRect(Math.min(newLx, branchX), newLy, Math.abs(branchX - newLx) + 2, 2);
                    lg.fillRect(branchX, newLy, 2, branchY - newLy);
                }
                lx = newLx;
                ly = newLy;
            }
        }

        this.tweens.add({
            targets: lg,
            alpha: 0,
            duration: 200,
            onComplete: function () {
                lg.clear();
                lg.setAlpha(1);
            }
        });
    }

    // -- Skip to countdown --
    skipToCountdown() {
        if (this.transitioning) return;
        this.currentBeat = 7; // will go to 8

        // Clean up everything
        this.clearDialogLayer();
        if (this.rainEmitter) { this.rainEmitter.destroy(); this.rainEmitter = null; }
        if (this.lightningTimer) this.lightningTimer.remove();
        this.compassSpinning = false;

        this.startBeat8();
    }

    // -- Go to ShipHub --
    goToShipHub() {
        if (this.transitioning) return;
        this.transitioning = true;

        if (window.GameState) {
            window.GameState.startAct(1);
        }
        if (window.QuestSystem) {
            window.QuestSystem.init();
        }

        if (window.AudioManager) window.AudioManager.playSFX('click');

        this.cameras.main.fadeOut(800, 0, 0, 0);
        var self = this;
        this.time.delayedCall(800, function () {
            self.scene.start('ShipHub');
        });
    }

    update(time, delta) {
        this.waveTime += delta * 0.001;

        // Draw ocean if visible
        if (this.showOcean) {
            this.drawOcean();
        }

        // Compass spinning
        if (this.compassSpinning && this.bigNeedle) {
            this.compassSpinAngle += delta * 0.3;
            var wobble = Math.sin(time * 0.005) * 50 + Math.sin(time * 0.003) * 80;
            this.bigNeedle.setAngle(wobble + this.compassSpinAngle);
        }
    }
}

window.IntroScene = IntroScene;
