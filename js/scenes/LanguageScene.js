/**
 * LanguageScene - Language selection screen
 * Beautiful animated background with magnetic field lines
 */
class LanguageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Language' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Animated background - magnetic field lines
        this.fieldLines = [];
        for (let i = 0; i < 60; i++) {
            this.fieldLines.push({
                x: Phaser.Math.Between(0, w),
                y: Phaser.Math.Between(0, h),
                vx: Phaser.Math.FloatBetween(-0.3, 0.3),
                vy: Phaser.Math.FloatBetween(-0.5, -0.1),
                alpha: Phaser.Math.FloatBetween(0.05, 0.2),
                length: Phaser.Math.Between(40, 120),
                color: Phaser.Math.RND.pick([0x00b4ff, 0x0088cc, 0x33ccff, 0x0066aa])
            });
        }
        this.fieldGfx = this.add.graphics();

        // Subtle star particles
        this.particles = this.add.particles(0, 0, 'particle_dot', {
            x: { min: 0, max: w },
            y: { min: 0, max: h },
            scale: { min: 0.1, max: 0.4 },
            alpha: { min: 0.1, max: 0.5 },
            lifespan: 4000,
            frequency: 200,
            tint: [0x00b4ff, 0x4488cc, 0xffffff],
            blendMode: 'ADD'
        });

        // Globe/compass icon in center (drawn procedurally)
        this.drawCompassRose(w / 2, h / 2 - 60);

        // Title
        this.add.text(w / 2, h / 2 + 40, 'Choose Your Language', {
            fontFamily: 'Orbitron',
            fontSize: '22px',
            color: '#88ccff',
            letterSpacing: 4
        }).setOrigin(0.5).setAlpha(0.8);

        // Language buttons
        const langs = [
            { code: 'he', label: 'עברית', font: 'Noto Sans Hebrew' },
            { code: 'en', label: 'English', font: 'Orbitron' },
            { code: 'ar', label: 'العربية', font: 'Noto Sans Arabic' }
        ];

        const btnY = h / 2 + 110;
        const spacing = 220;
        const startX = w / 2 - spacing;

        langs.forEach((lang, i) => {
            const x = startX + i * spacing;
            this.createLangButton(x, btnY, lang);
        });

        // Fade in
        this.cameras.main.fadeIn(800, 0, 5, 20);

        // Initialize audio on first interaction
        this.input.once('pointerdown', () => {
            if (window.AudioManager) {
                window.AudioManager.init();
                window.AudioManager.playMusic('menu');
                window.AudioManager.startAmbient('ocean');
            }
        });
    }

    drawCompassRose(cx, cy) {
        const g = this.add.graphics();
        const r = 50;

        // Outer circle glow
        for (let i = 0; i < 5; i++) {
            g.lineStyle(1, 0x00b4ff, 0.1 - i * 0.015);
            g.strokeCircle(cx, cy, r + i * 8);
        }

        // Main circle
        g.lineStyle(2, 0x00b4ff, 0.5);
        g.strokeCircle(cx, cy, r);

        // Compass directions
        g.lineStyle(1.5, 0x00b4ff, 0.6);
        const dirs = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        dirs.forEach(angle => {
            g.lineBetween(
                cx + Math.cos(angle) * (r - 15),
                cy + Math.sin(angle) * (r - 15),
                cx + Math.cos(angle) * (r + 5),
                cy + Math.sin(angle) * (r + 5)
            );
        });

        // North indicator (bright)
        g.fillStyle(0x00b4ff, 0.8);
        g.fillTriangle(cx, cy - r + 5, cx - 8, cy - 15, cx + 8, cy - 15);

        // Center dot
        g.fillStyle(0x00b4ff, 0.6);
        g.fillCircle(cx, cy, 5);

        // Spinning needle animation
        this.compassNeedle = this.add.graphics();
        this.compassAngle = 0;
        this.compassCx = cx;
        this.compassCy = cy;
    }

    createLangButton(x, y, lang) {
        const btn = this.add.image(x, y, 'btn_lang').setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, lang.label, {
            fontFamily: lang.font + ', sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Hover effects
        btn.on('pointerover', () => {
            this.tweens.add({
                targets: [btn],
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });
            text.setColor('#00e5ff');
            if (window.AudioManager) window.AudioManager.playSFX('hover');
        });

        btn.on('pointerout', () => {
            this.tweens.add({
                targets: [btn],
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Quad.easeOut'
            });
            text.setColor('#ffffff');
        });

        btn.on('pointerdown', () => {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            if (window.I18N) window.I18N.setLang(lang.code);

            // Flash effect
            this.cameras.main.flash(200, 0, 100, 200);

            this.time.delayedCall(300, () => {
                this.cameras.main.fadeOut(500, 0, 5, 20);
                this.time.delayedCall(500, () => {
                    this.scene.start('Title');
                });
            });
        });

        // Store for reference
        if (!this._langBtns) this._langBtns = [];
        this._langBtns.push({ btn, text, lang });
        const index = this._langBtns.length - 1;

        // Entrance animation
        btn.setAlpha(0).setScale(0.8);
        text.setAlpha(0);
        this.tweens.add({
            targets: [btn],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            delay: 300 + index * 150,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: [text],
            alpha: 1,
            duration: 600,
            delay: 400 + index * 150
        });
    }

    update(time) {
        // Animate field lines
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const g = this.fieldGfx;
        g.clear();

        this.fieldLines.forEach(line => {
            line.x += line.vx + Math.sin(time * 0.001 + line.y * 0.01) * 0.3;
            line.y += line.vy;

            if (line.y < -line.length) {
                line.y = h + line.length;
                line.x = Phaser.Math.Between(0, w);
            }
            if (line.x < -50) line.x = w + 50;
            if (line.x > w + 50) line.x = -50;

            g.lineStyle(1, line.color, line.alpha);
            const curve = Math.sin(time * 0.0005 + line.x * 0.005) * 20;
            g.lineBetween(
                line.x, line.y,
                line.x + curve, line.y + line.length
            );
        });

        // Rotate compass needle
        if (this.compassNeedle) {
            this.compassAngle += 0.01;
            const wobble = Math.sin(time * 0.002) * 0.3 + Math.sin(time * 0.0007) * 0.5;
            this.compassNeedle.clear();
            const angle = this.compassAngle + wobble;
            const len = 35;
            const cx = this.compassCx;
            const cy = this.compassCy;

            // Red side (north)
            this.compassNeedle.fillStyle(0xff4444, 0.7);
            this.compassNeedle.fillTriangle(
                cx + Math.cos(angle) * len, cy + Math.sin(angle) * len,
                cx + Math.cos(angle + 2.8) * 6, cy + Math.sin(angle + 2.8) * 6,
                cx + Math.cos(angle - 2.8) * 6, cy + Math.sin(angle - 2.8) * 6
            );
            // Blue side (south)
            this.compassNeedle.fillStyle(0x4444ff, 0.7);
            this.compassNeedle.fillTriangle(
                cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
                cx + Math.cos(angle + 2.8) * 6, cy + Math.sin(angle + 2.8) * 6,
                cx + Math.cos(angle - 2.8) * 6, cy + Math.sin(angle - 2.8) * 6
            );
        }
    }
}

window.LanguageScene = LanguageScene;
