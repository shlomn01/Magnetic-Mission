/**
 * TitleScene - Game title screen
 * LucasArts-style point-and-click adventure aesthetic
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Title' });
    }

    create() {
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        var t = function (key) { return window.I18N ? window.I18N.t(key) : key; };
        var isRTL = window.I18N && window.I18N.isRTL();
        var fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';
        var self = this;

        // Mobile fullscreen prompt — show overlay before title content
        var isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        if (isMobile && !this._mobilePromptShown) {
            this._mobilePromptShown = true;
            this._showMobilePrompt(w, h, fontFamily);
            return; // don't build title screen yet
        }

        // Try to play menu music
        try {
            if (window.AudioManager && window.AudioManager.initialized) {
                window.AudioManager.playMusic('menu');
            }
        } catch (e) { /* silent */ }

        // ── Background (use Aseprite art if available) ──
        if (this.textures.exists('bg_title')) {
            this.add.image(w / 2, h / 2, 'bg_title').setDisplaySize(w, h).setDepth(0);
        } else {
            var bg = this.add.graphics();
            for (var y = 0; y < h; y += 2) {
                var ratio = y / h;
                var r = Math.floor(Phaser.Math.Linear(0x02, 0x0d, Math.min(ratio * 1.5, 1)));
                var g2 = Math.floor(Phaser.Math.Linear(0x02, 0x1b, Math.min(ratio * 1.5, 1)));
                var b2 = Math.floor(Phaser.Math.Linear(0x10, 0x2a, Math.min(ratio * 1.5, 1)));
                bg.fillStyle(Phaser.Display.Color.GetColor(r, g2, b2), 1);
                bg.fillRect(0, y, w, 2);
            }
        }

        // ── Animated stars (on top of background) ──
        for (var i = 0; i < 40; i++) {
            var sx = Phaser.Math.Between(0, w);
            var sy = Phaser.Math.Between(0, Math.floor(h * 0.55));
            var star = this.add.rectangle(sx, sy, 2, 2, 0xfff1e8)
                .setAlpha(Phaser.Math.FloatBetween(0.2, 0.8)).setDepth(1);
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.05, 0.3),
                duration: Phaser.Math.Between(1000, 3500),
                yoyo: true, repeat: -1,
                delay: Phaser.Math.Between(0, 2000),
                ease: 'Sine.easeInOut'
            });
        }

        // ── Moon (skip if bg_title has one) ──
        if (!this.textures.exists('bg_title')) {
        var moonGfx = this.add.graphics().setDepth(1);
        var moonX = Math.floor(w * 0.82), moonY = Math.floor(h * 0.1);
        // Glow
        for (var gr = 35; gr > 0; gr -= 2) {
            moonGfx.fillStyle(0xfff1e8, 0.015);
            for (var gy = -gr; gy <= gr; gy++) {
                var gxw = Math.floor(Math.sqrt(gr * gr - gy * gy));
                moonGfx.fillRect(moonX - gxw, moonY + gy, gxw * 2, 1);
            }
        }
        // Body
        for (var my = -18; my <= 18; my++) {
            var mxw = Math.floor(Math.sqrt(18 * 18 - my * my));
            moonGfx.fillStyle(0xfff1e8, 0.85);
            moonGfx.fillRect(moonX - mxw, moonY + my, mxw * 2, 1);
        }
        // Craters
        moonGfx.fillStyle(0xc2c3c7, 0.4);
        moonGfx.fillRect(moonX - 6, moonY - 5, 5, 3);
        moonGfx.fillRect(moonX + 3, moonY + 2, 4, 3);
        moonGfx.fillRect(moonX - 2, moonY + 7, 3, 2);
        } // end if no bg_title

        // ── Ocean (animated) ──
        this.oceanGfx = this.add.graphics().setDepth(5);
        this.waveTime = 0;
        this.oceanBaseY = Math.floor(h * 0.6);

        // ── Ship (use Aseprite sprite or fallback to procedural) ──
        var shipY = this.oceanBaseY - 4;
        if (this.textures.exists('spr_ship')) {
            var shipImg = this.add.image(w / 2, shipY, 'spr_ship')
                .setOrigin(0.5, 0.85).setDepth(6);
            this.tweens.add({
                targets: shipImg, y: shipY + 3,
                duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        } else {
            // Fallback: simple procedural ship
            var shipG = this.add.graphics().setDepth(6);
            var hullX = Math.floor(w * 0.35), hullW = 280;
            shipG.fillStyle(0x1b2838, 1);
            shipG.fillRect(hullX, shipY - 18, hullW, 18);
            shipG.fillStyle(0xab5236, 1);
            shipG.fillRect(hullX, shipY - 4, hullW, 4);
            shipG.fillStyle(0x2d4a6a, 1);
            shipG.fillRect(hullX + 10, shipY - 50, 70, 32);
            shipG.fillRect(hullX + 110, shipY - 46, 56, 28);
            shipG.fillStyle(0xffec27, 0.8);
            for (var cwi = 0; cwi < 6; cwi++) {
                shipG.fillRect(hullX + 16 + cwi * 10, shipY - 34, 5, 5);
            }
            this.tweens.add({
                targets: shipG, y: 3,
                duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // ── Compass rose (prefer Aseprite, fallback to procedural) ──
        var compassY = Math.floor(h * 0.18);
        var compassKey = this.textures.exists('spr_compass_rose') ? 'spr_compass_rose' : 'compass_rose';
        if (this.textures.exists(compassKey)) {
            var crScale = compassKey === 'spr_compass_rose' ? 1.5 : 3;
            var cr = this.add.image(w / 2, compassY, compassKey)
                .setScale(crScale).setDepth(8).setAlpha(0.7);
            this.tweens.add({
                targets: cr, angle: 360,
                duration: 30000, repeat: -1, ease: 'Linear'
            });
        }
        var needleKey = this.textures.exists('spr_needle') ? 'spr_needle' : 'compass_needle_big';
        if (this.textures.exists(needleKey)) {
            var nScale = needleKey === 'spr_needle' ? 1.5 : 3;
            this.compassNeedle = this.add.image(w / 2, compassY, needleKey)
                .setScale(nScale).setDepth(9).setAlpha(0.85);
            this.needleAngle = 0;
        }

        // ── Game Title ──
        var titleY = Math.floor(h * 0.38);
        var titleSize = (fontFamily === 'Press Start 2P') ? '28px' : '40px';
        var titleText = t('game_title');
        if (isRTL && window.I18N) titleText = window.I18N.fixRTL(titleText);
        var titleStyle = {
            fontFamily: fontFamily + ', monospace',
            fontSize: titleSize,
            color: '#000000',
            align: 'center',
            wordWrap: { width: w - 60 },
            rtl: isRTL
        };

        // Shadow
        this.add.text(w / 2 + 3, titleY + 3, titleText, titleStyle).setOrigin(0.5).setDepth(10);

        // Outline (draw 4 times offset)
        var outlineColor = '#1b2838';
        [[-2,0],[2,0],[0,-2],[0,2]].forEach(function(off) {
            var outStyle = {};
            for (var k in titleStyle) outStyle[k] = titleStyle[k];
            outStyle.color = outlineColor;
            self.add.text(w / 2 + off[0], titleY + off[1], titleText, outStyle).setOrigin(0.5).setDepth(10);
        });

        // Main title
        var mainTitleStyle = {};
        for (var k in titleStyle) mainTitleStyle[k] = titleStyle[k];
        mainTitleStyle.color = '#fff1e8';
        var mainTitle = this.add.text(w / 2, titleY, titleText, mainTitleStyle).setOrigin(0.5).setDepth(11);

        // Title glow tween
        this.tweens.add({
            targets: mainTitle,
            alpha: { from: 0.85, to: 1 },
            duration: 2000,
            yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ── Subtitle ──
        var subY = titleY + (fontFamily === 'Press Start 2P' ? 50 : 60);
        var subText = (window.I18N && window.I18N.currentLang !== 'en')
            ? 'The Magnetic Mission'
            : t('intro_text1');
        var subSize = (fontFamily === 'Press Start 2P') ? '12px' : '16px';
        this.add.text(w / 2 + 1, subY + 1, subText, {
            fontFamily: fontFamily + ', monospace',
            fontSize: subSize, color: '#0d1b2a', align: 'center'
        }).setOrigin(0.5).setDepth(10);
        this.add.text(w / 2, subY, subText, {
            fontFamily: fontFamily + ', monospace',
            fontSize: subSize, color: '#29adff', align: 'center'
        }).setOrigin(0.5).setDepth(11).setAlpha(0.85);

        // ── PRESS TO START ──
        var pressY = Math.floor(h * 0.82);
        var pressSize = (fontFamily === 'Press Start 2P') ? '12px' : '18px';
        var pressStr = t('press_to_start');
        if (isRTL && window.I18N) pressStr = window.I18N.fixRTL(pressStr);
        // Shadow
        this.add.text(w / 2 + 2, pressY + 2, pressStr, {
            fontFamily: fontFamily + ', monospace',
            fontSize: pressSize, color: '#000000', align: 'center',
            rtl: isRTL
        }).setOrigin(0.5).setDepth(10);
        var pressText = this.add.text(w / 2, pressY, pressStr, {
            fontFamily: fontFamily + ', monospace',
            fontSize: pressSize, color: '#fff1e8', align: 'center',
            rtl: isRTL
        }).setOrigin(0.5).setDepth(11);
        // Blink
        this.tweens.add({
            targets: pressText,
            alpha: { from: 1, to: 0.15 },
            duration: 600,
            yoyo: true, repeat: -1,
            delay: 1500,
            ease: 'Stepped'
        });

        // ── Click to start ──
        this.startTriggered = false;
        this.input.on('pointerdown', function () {
            if (self.startTriggered) return;
            self.startTriggered = true;
            // Initialize audio on first user gesture
            if (window.AudioManager) {
                window.AudioManager.init();
                window.AudioManager.playSFX('click');
                window.AudioManager.playMusic('menu');
            }
            self.cameras.main.flash(300, 255, 255, 255);
            self.time.delayedCall(400, function () {
                self.cameras.main.fadeOut(600, 0, 0, 0);
                self.time.delayedCall(600, function () {
                    self.scene.start('Intro');
                });
            });
        });

        // ── Language buttons ──
        var langs = [
            { code: 'en', label: 'EN' },
            { code: 'he', label: '\u05E2\u05D1' },
            { code: 'ar', label: '\u0639\u0631' }
        ];
        // On small screens, center buttons for easier tapping
        var isMobile = window.innerWidth < 600;
        var langSpacing = isMobile ? 70 : 50;
        var lx0 = isMobile ? w / 2 - langSpacing : w - 160;
        var ly = isMobile ? 18 : 22;
        var langFontSize = isMobile ? '14px' : '10px';
        var langPadding = isMobile ? { x: 18, y: 16 } : { x: 14, y: 14 };
        for (var li = 0; li < langs.length; li++) {
            (function (lang, idx) {
                var lx = lx0 + idx * langSpacing;
                var active = window.I18N && window.I18N.currentLang === lang.code;
                var btn = self.add.text(lx, ly, lang.label, {
                    fontFamily: 'Press Start 2P, monospace',
                    fontSize: langFontSize,
                    color: active ? '#29adff' : '#5f574f',
                    backgroundColor: '#0d1b2a',
                    padding: langPadding
                }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
                if (active) {
                    self.add.rectangle(lx, ly + (isMobile ? 18 : 14), isMobile ? 44 : 36, 2, 0x29adff).setDepth(20);
                }
                btn.on('pointerover', function () { btn.setColor('#fff1e8'); });
                btn.on('pointerout', function () {
                    btn.setColor(active ? '#29adff' : '#5f574f');
                });
                btn.on('pointerdown', function (p, lx2, ly2, ev) {
                    ev.stopPropagation();
                    if (window.I18N) window.I18N.setLang(lang.code);
                    if (window.AudioManager) window.AudioManager.playSFX('click');
                    self.scene.restart();
                });
            })(langs[li], li);
        }

        // ── Particles ──
        if (this.textures.exists('spark')) {
            this.add.particles(0, 0, 'spark', {
                x: { min: Math.floor(w * 0.2), max: Math.floor(w * 0.8) },
                y: this.oceanBaseY + 5,
                speedY: { min: -30, max: -10 },
                speedX: { min: -8, max: 8 },
                scale: { start: 1, end: 0.3 },
                alpha: { start: 0.3, end: 0 },
                tint: [0x29adff, 0x53d8fb, 0xfff1e8],
                lifespan: { min: 2000, max: 4000 },
                frequency: 400, quantity: 1
            }).setDepth(7);
        }

        // Fade in
        this.cameras.main.fadeIn(800, 0, 0, 0);
    }

    _showMobilePrompt(w, h, fontFamily) {
        var self = this;

        // Full-screen dark overlay
        var bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0d1b2a).setDepth(100);

        // Prompt text
        var promptStr = (window.I18N ? window.I18N.t('press_to_start') : 'Tap to Start');
        if (window.I18N && window.I18N.isRTL()) promptStr = window.I18N.fixRTL(promptStr);
        var promptText = this.add.text(w / 2, h / 2 - 30, promptStr, {
            fontFamily: fontFamily + ', monospace',
            fontSize: '18px',
            color: '#fff1e8',
            align: 'center',
            rtl: window.I18N && window.I18N.isRTL()
        }).setOrigin(0.5).setDepth(101);

        // Simple hand/tap icon drawn with graphics
        var handGfx = this.add.graphics().setDepth(101);
        var hx = w / 2, hy = h / 2 + 40;
        // Palm
        handGfx.fillStyle(0xfff1e8, 0.8);
        handGfx.fillRoundedRect(hx - 10, hy, 20, 24, 4);
        // Finger
        handGfx.fillRoundedRect(hx - 4, hy - 16, 8, 20, 3);
        // Tap rings
        handGfx.lineStyle(2, 0x53d8fb, 0.4);
        handGfx.strokeCircle(hx, hy + 8, 24);
        handGfx.lineStyle(1, 0x53d8fb, 0.2);
        handGfx.strokeCircle(hx, hy + 8, 36);

        // Pulse animation on tap rings
        this.tweens.add({
            targets: handGfx,
            alpha: { from: 1, to: 0.4 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Touch zone covers full screen
        var touchZone = this.add.zone(w / 2, h / 2, w, h)
            .setInteractive({ useHandCursor: true }).setDepth(102);

        touchZone.on('pointerdown', function() {
            // Request fullscreen
            if (self.scale.isFullscreen === false) {
                self.scale.startFullscreen();
            }
            // Lock landscape
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(function() {});
            }
            // Initialize audio on user gesture
            if (window.AudioManager) window.AudioManager.init();

            // Fade out overlay then rebuild scene
            self.tweens.add({
                targets: [bg, promptText, handGfx],
                alpha: 0,
                duration: 400,
                onComplete: function() {
                    bg.destroy();
                    promptText.destroy();
                    handGfx.destroy();
                    touchZone.destroy();
                    // Now run the full create() again (prompt flag prevents loop)
                    self.create();
                }
            });
        });
    }

    update(time, delta) {
        this.waveTime += delta * 0.001;
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        var og = this.oceanGfx;
        og.clear();

        var colors = [0x0d1b2a, 0x1b2838, 0x2d4a6a];
        for (var layer = 0; layer < 3; layer++) {
            var baseY = this.oceanBaseY + layer * 10;
            var speed = 0.8 + layer * 0.3;
            var amp = 3 + layer;
            og.fillStyle(colors[layer], 1);
            og.beginPath();
            og.moveTo(0, h);
            for (var x = 0; x <= w; x += 4) {
                var wy = baseY +
                    Math.floor(Math.sin(x * 0.018 + this.waveTime * speed) * amp) +
                    Math.floor(Math.sin(x * 0.035 + this.waveTime * 0.5) * 2);
                og.lineTo(x, Math.floor(wy));
            }
            og.lineTo(w, h);
            og.closePath();
            og.fillPath();

            // Highlights
            if (layer === 0) {
                og.fillStyle(0x29adff, 0.2);
                for (var cx = 0; cx < w; cx += 4) {
                    var cy = baseY + Math.floor(Math.sin(cx * 0.018 + this.waveTime * speed) * amp);
                    var ny = baseY + Math.floor(Math.sin((cx + 4) * 0.018 + this.waveTime * speed) * amp);
                    if (cy <= ny) og.fillRect(cx, Math.floor(cy), 4, 1);
                }
            }
        }

        // Compass needle
        if (this.compassNeedle) {
            this.needleAngle += delta * 0.15;
            var wobble = Math.sin(time * 0.003) * 40 +
                Math.sin(time * 0.0017) * 60 +
                Math.sin(time * 0.0071) * 25;
            this.compassNeedle.setAngle(wobble + this.needleAngle * 2);
        }
    }
}

window.TitleScene = TitleScene;
