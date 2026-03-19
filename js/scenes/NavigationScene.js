/**
 * NavigationScene - Act 2: Diagnose & Fix Navigation Errors
 * 3 large console instruments — calibration dial, signal monitor, compass stabilizer
 * Wall screen shows live scrolling sensor feed. Typewriter NPC dialog.
 */
class NavigationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Navigation' });
    }

    create() {
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        this.W = w;
        this.H = h;
        var isRTL = window.I18N ? window.I18N.isRTL() : false;
        var fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';
        var self = this;
        var t = function(key) {
            var str = window.I18N ? window.I18N.t(key) : key;
            if (isRTL && window.I18N) str = window.I18N.fixRTL(str);
            return str;
        };
        this.fontFamily = fontFamily;
        this.isRTL = isRTL;
        this.t = t;

        if (window.AudioManager) {
            window.AudioManager.playMusic('navigation');
            window.AudioManager.startAmbient('sonar_ping');
        }

        // === CONSTANTS ===
        var DEEP_NAVY = 0x0d1b2a, DARK_BLUE = 0x1b2838, MED_BLUE = 0x2d4a6a;
        var CYAN = 0x53d8fb, WHITE = 0xfff1e8, RED = 0xff004d;
        var GREEN = 0x00e436, ORANGE = 0xffa300, YELLOW = 0xffec27;
        this._C = { DEEP_NAVY: DEEP_NAVY, DARK_BLUE: DARK_BLUE, MED_BLUE: MED_BLUE,
            CYAN: CYAN, WHITE: WHITE, RED: RED, GREEN: GREEN, ORANGE: ORANGE, YELLOW: YELLOW };

        // === STATE ===
        this.instrumentsFixed = { dial: false, signal: false, compass: false };
        this.allFixed = false;
        this.dialAngle = Math.PI; // start pointing left (wrong)
        this.signalFiltered = false;
        this.compassHoldTime = 0;
        this.compassHoldNeeded = 2000;
        this._stabilizeHeld = false;
        this._dialDragging = false;
        this.waveOffset = 0;

        // === PANEL LAYOUT ===
        var panelW = 280, panelH = 160;
        var panelY = h - panelH - 10; // sits at bottom
        var panels = [
            { cx: 160, cy: panelY + panelH / 2, name: 'dial' },
            { cx: 480, cy: panelY + panelH / 2, name: 'signal' },
            { cx: 800, cy: panelY + panelH / 2, name: 'compass' }
        ];
        this.panelLayout = { w: panelW, h: panelH, y: panelY, panels: panels };

        // === BACKGROUND ===
        if (this.textures.exists('bg_navigation')) {
            this.add.image(0, 0, 'bg_navigation').setOrigin(0, 0).setDisplaySize(w, h).setDepth(0);
        } else {
            var bg = this.add.graphics().setDepth(0);
            bg.fillStyle(DEEP_NAVY, 1); bg.fillRect(0, 0, w, h);
            bg.fillStyle(DARK_BLUE, 1); bg.fillRect(0, h * 0.65, w, h * 0.35);
        }

        // === WALL SCREEN (visual centerpiece) ===
        this.createWallScreen(w / 2, 195, 500, 200);

        // === 3 INSTRUMENT PANELS ===
        this.arrows = {};
        for (var pi = 0; pi < panels.length; pi++) {
            this.drawPanelFrame(panels[pi].cx, panelY, panelW, panelH, panels[pi].name);
        }

        // Create instruments inside panels
        this.createCalibrationDial(panels[0].cx, panels[0].cy);
        this.createSignalMonitor(panels[1].cx, panels[1].cy);
        this.createCompassStabilizer(panels[2].cx, panels[2].cy);

        // === BACK BUTTON ===
        this.createBackButton(fontFamily);

        // === BRIEFING DIALOG (typewriter) ===
        this.cameras.main.fadeIn(500, 0, 5, 20);

        this.time.delayedCall(600, function() {
            self.showTypewriterDialog('navi',
                t('navi_quest_errors') || 'The instruments are glitching! Fix all three console panels to restore navigation.',
                fontFamily, function() {
                    // After first dialog finishes, show instruction
                    self.time.delayedCall(400, function() {
                        self.showTypewriterDialog('navi',
                            t('nav_fix_instruction') || 'Fix all three instruments to restore the compass.',
                            fontFamily);
                    });
                });
        });

        // Quest system
        if (window.QuestSystem) {
            var act2Quests = ['errors', 'noise', 'clean', 'revelation'];
            for (var qi = 0; qi < act2Quests.length; qi++) {
                var q = window.QuestSystem.getQuest(act2Quests[qi]);
                if (q && q.status === 'available') {
                    window.QuestSystem.acceptQuest(act2Quests[qi]);
                    break;
                }
            }
        }
    }

    // ==========================================
    // PANEL FRAME — consistent dark frame with cyan border
    // ==========================================
    drawPanelFrame(cx, top, pw, ph, name) {
        var left = cx - pw / 2;
        var C = this._C;
        var g = this.add.graphics().setDepth(10);

        // Dark background
        g.fillStyle(C.DEEP_NAVY, 0.95);
        g.fillRoundedRect(left, top, pw, ph, 6);
        // Cyan border
        g.lineStyle(2, C.CYAN, 0.5);
        g.strokeRoundedRect(left, top, pw, ph, 6);
        // Inner bevel
        g.lineStyle(1, C.CYAN, 0.1);
        g.strokeRoundedRect(left + 3, top + 3, pw - 6, ph - 6, 4);

        // Title above panel
        var titles = {
            dial: this.t('nav_title_calibration') || '[ Calibration Offset ]',
            signal: this.t('nav_title_signal') || '[ Signal Noise ]',
            compass: this.t('nav_title_compass') || '[ Compass ]'
        };
        this.add.text(cx, top + 14, titles[name], {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#53d8fb',
            stroke: '#000000',
            strokeThickness: 2,
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);

        // Label below panel (compass: above instrument to avoid button overlap)
        var labels = {
            dial: this.t('nav_panel_calibration') || 'CALIBRATION',
            signal: this.t('nav_panel_signal') || 'SIGNAL',
            compass: this.t('nav_panel_compass') || 'COMPASS'
        };
        // Dark backing for label
        var labelY = (name === 'compass') ? top + 28 : top + ph - 14;
        g.fillStyle(C.DEEP_NAVY, 0.9);
        g.fillRoundedRect(cx - 50, labelY - 8, 100, 16, 3);
        this.add.text(cx, labelY, labels[name], {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fff1e8',
            stroke: '#000000',
            strokeThickness: 3,
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);

        // Status LED (red = unfixed)
        var ledGfx = this.add.graphics().setDepth(11);
        ledGfx.fillStyle(C.RED, 0.9);
        ledGfx.fillCircle(cx, top - 8, 4);
        ledGfx.fillStyle(C.RED, 0.15);
        ledGfx.fillCircle(cx, top - 8, 10);
        if (!this.statusLeds) this.statusLeds = {};
        this.statusLeds[name] = { gfx: ledGfx, x: cx, y: top - 8 };

        // Flashing arrow above panel
        var arrow = this.add.text(cx, top - 20, '\u25BC', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffec27'
        }).setOrigin(0.5).setDepth(11);
        this.tweens.add({
            targets: arrow,
            y: top - 14,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        this.arrows[name] = arrow;
    }

    // ==========================================
    // BUTTON HELPER — consistent rounded button
    // ==========================================
    createButton(cx, cy, label, width, height, callback) {
        var C = this._C;
        var btnGfx = this.add.graphics().setDepth(20);
        var self = this;

        var drawNormal = function() {
            btnGfx.clear();
            btnGfx.fillStyle(C.MED_BLUE, 0.85);
            btnGfx.fillRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
            btnGfx.lineStyle(1, C.CYAN, 0.6);
            btnGfx.strokeRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
        };
        var drawHover = function() {
            btnGfx.clear();
            btnGfx.fillStyle(C.MED_BLUE, 1);
            btnGfx.fillRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
            btnGfx.lineStyle(2, C.CYAN, 1);
            btnGfx.strokeRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
        };
        var drawActive = function() {
            btnGfx.clear();
            btnGfx.fillStyle(0x0a2a2a, 0.95);
            btnGfx.fillRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
            btnGfx.lineStyle(2, C.CYAN, 1);
            btnGfx.strokeRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
        };
        var drawDone = function() {
            btnGfx.clear();
            btnGfx.fillStyle(0x0a2a0a, 0.9);
            btnGfx.fillRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
            btnGfx.lineStyle(1, C.GREEN, 0.8);
            btnGfx.strokeRoundedRect(cx - width / 2, cy - height / 2, width, height, 5);
        };

        drawNormal();

        var btnLabel = this.add.text(cx, cy, label, {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff1e8',
            stroke: '#000000',
            strokeThickness: 2,
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(21);

        // Pulse glow
        var pulser = this.tweens.add({
            targets: btnGfx,
            alpha: { from: 0.7, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        var zone = this.add.zone(cx, cy, Math.max(width, 44), Math.max(height, 44))
            .setInteractive({ useHandCursor: true }).setDepth(22);

        zone.on('pointerover', function() { drawHover(); });
        zone.on('pointerout', function() { drawNormal(); });

        return {
            gfx: btnGfx, label: btnLabel, zone: zone, pulser: pulser,
            drawNormal: drawNormal, drawHover: drawHover,
            drawActive: drawActive, drawDone: drawDone
        };
    }

    // ==========================================
    // WALL SCREEN — scrolling sensor feed
    // ==========================================
    createWallScreen(cx, cy, sw, sh) {
        var left = cx - sw / 2, top = cy - sh / 2;
        this.wallScreen = { cx: cx, cy: cy, w: sw, h: sh, left: left, top: top };

        // Frame
        var frame = this.add.graphics().setDepth(4);
        frame.lineStyle(2, this._C.CYAN, 0.3);
        frame.strokeRoundedRect(left - 2, top - 2, sw + 4, sh + 4, 4);

        // Title
        this.add.text(cx, top + 12, this.t('nav_sensor_data') || '[ Sensor Data ]', {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#53d8fb',
            stroke: '#000000',
            strokeThickness: 2,
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(6);

        // Screen graphics (updated every frame)
        this.wallScreenGfx = this.add.graphics().setDepth(5);

        // Status label
        this.wallScreenLabel = this.add.text(cx, top + sh - 12, 'SIGNAL UNSTABLE', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#ffa300',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);
    }

    drawWallScreen(time) {
        var s = this.wallScreen;
        if (!s) return;
        var g = this.wallScreenGfx;
        g.clear();

        var left = s.left, top = s.top, sw = s.w, sh = s.h;

        // Dark screen bg
        g.fillStyle(0x0a1018, 0.9);
        g.fillRoundedRect(left, top, sw, sh, 4);

        // Grid lines
        g.lineStyle(1, 0x53d8fb, 0.06);
        for (var gx = left + 20; gx < left + sw; gx += 20) {
            g.lineBetween(gx, top + 24, gx, top + sh - 20);
        }
        for (var gy = top + 34; gy < top + sh - 20; gy += 20) {
            g.lineBetween(left + 10, gy, left + sw - 10, gy);
        }

        // Center zero-line
        var midY = top + 24 + (sh - 44) / 2;
        g.lineStyle(1, 0x2d4a6a, 0.35);
        g.lineBetween(left + 10, midY, left + sw - 10, midY);

        var amp = (sh - 44) * 0.35;
        var graphLeft = left + 10, graphRight = left + sw - 10;
        var graphW = graphRight - graphLeft;
        var offset = this.waveOffset;

        // Expected signal (faint cyan)
        g.lineStyle(1, 0x53d8fb, 0.25);
        g.beginPath();
        for (var i = 0; i <= 80; i++) {
            var px = graphLeft + (i / 80) * graphW;
            var py = midY + Math.sin((i * 0.1) - offset * 0.03) * amp * 0.5;
            py = Math.max(top + 26, Math.min(top + sh - 22, py));
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();

        // Measured signal (noisy or clean, scrolling)
        var noiseAmt = this.allFixed ? 0.03 : 0.9;
        var sigColor = this.allFixed ? 0x00e436 : 0xffa300;
        g.lineStyle(2, sigColor, 0.9);
        g.beginPath();
        var ns = 77 + Math.floor(offset * 0.5);
        for (var i = 0; i <= 80; i++) {
            var px = graphLeft + (i / 80) * graphW;
            ns = (ns * 1103515245 + 12345) & 0x7fffffff;
            var noise = ((ns / 0x7fffffff) * 2 - 1) * noiseAmt;
            var py = midY + Math.sin((i * 0.1) - offset * 0.03) * amp * 0.5 + noise * amp;
            py = Math.max(top + 26, Math.min(top + sh - 22, py));
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();

        // Update status label
        if (this.wallScreenLabel) {
            if (this.allFixed) {
                this.wallScreenLabel.setText(this.t('nav_compass_restored') || 'COMPASS RESTORED');
                this.wallScreenLabel.setColor('#00e436');
            } else {
                this.wallScreenLabel.setText(this.t('nav_signal_unstable') || 'SIGNAL UNSTABLE');
                this.wallScreenLabel.setColor('#ffa300');
            }
        }
    }

    // ==========================================
    // INSTRUMENT 1: CALIBRATION DIAL
    // ==========================================
    createCalibrationDial(cx, cy) {
        var self = this;
        var r = 45;
        var targetAngle = 0.72;
        var tolerance = 0.18;
        var layout = this.panelLayout;

        this.dialGfx = this.add.graphics().setDepth(20);
        this.dialParams = { cx: cx, cy: cy, r: r, targetAngle: targetAngle, tolerance: tolerance };
        this.drawDial();

        // Interactive drag zone
        var dragZone = this.add.zone(cx, cy, r * 2 + 20, r * 2 + 20)
            .setInteractive({ useHandCursor: true }).setDepth(21);

        dragZone.on('pointerdown', function() { self._dialDragging = true; });
        this.input.on('pointermove', function(pointer) {
            if (!self._dialDragging || self.instrumentsFixed.dial) return;
            self.dialAngle = Math.atan2(pointer.worldY - cy, pointer.worldX - cx);
            self.drawDial();
            if (Math.abs(self.dialAngle - targetAngle) < tolerance) {
                self.dialAngle = targetAngle;
                self.drawDial();
                self.fixInstrument('dial');
            }
        });
        this.input.on('pointerup', function() { self._dialDragging = false; });
    }

    drawDial() {
        var p = this.dialParams;
        if (!p) return;
        var g = this.dialGfx;
        var cx = p.cx, cy = p.cy, r = p.r;
        g.clear();

        // Face
        g.fillStyle(0x0a1018, 0.95);
        g.fillCircle(cx, cy, r + 3);
        g.lineStyle(2, 0x5f574f, 0.8);
        g.strokeCircle(cx, cy, r + 3);

        // Tick marks
        for (var i = 0; i < 36; i++) {
            var a = (i / 36) * Math.PI * 2;
            var major = (i % 9 === 0);
            var inner = major ? r - 10 : r - 5;
            g.lineStyle(major ? 2 : 1, major ? 0xc2c3c7 : 0x5f574f, major ? 0.8 : 0.4);
            g.lineBetween(
                cx + Math.cos(a) * inner, cy + Math.sin(a) * inner,
                cx + Math.cos(a) * r, cy + Math.sin(a) * r
            );
        }

        // Green target zone
        g.lineStyle(4, 0x00e436, 0.25);
        g.beginPath();
        for (var a = p.targetAngle - p.tolerance; a <= p.targetAngle + p.tolerance; a += 0.03) {
            var px = cx + Math.cos(a) * (r - 2);
            var py = cy + Math.sin(a) * (r - 2);
            if (a <= p.targetAngle - p.tolerance + 0.03) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();

        // Red danger zone (opposite side)
        g.lineStyle(4, 0xff004d, 0.2);
        g.beginPath();
        var dStart = p.targetAngle + Math.PI - 0.6;
        var dEnd = p.targetAngle + Math.PI + 0.6;
        for (var a = dStart; a <= dEnd; a += 0.03) {
            var px = cx + Math.cos(a) * (r - 2);
            var py = cy + Math.sin(a) * (r - 2);
            if (a <= dStart + 0.03) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();

        // Needle — thick red line
        var fixed = this.instrumentsFixed.dial;
        var nColor = fixed ? 0x00e436 : 0xff004d;
        g.lineStyle(3, nColor, 0.95);
        g.lineBetween(cx, cy, cx + Math.cos(this.dialAngle) * (r - 6), cy + Math.sin(this.dialAngle) * (r - 6));
        // Needle tail
        g.lineStyle(2, nColor, 0.4);
        g.lineBetween(cx, cy, cx - Math.cos(this.dialAngle) * 10, cy - Math.sin(this.dialAngle) * 10);

        // Center pivot
        g.fillStyle(0x5f574f, 1);
        g.fillCircle(cx, cy, 4);
        g.fillStyle(0xc2c3c7, 0.6);
        g.fillCircle(cx, cy, 2);
    }

    // ==========================================
    // INSTRUMENT 2: SIGNAL MONITOR
    // ==========================================
    createSignalMonitor(cx, cy) {
        var self = this;
        var scrW = 240, scrH = 80;
        var scrLeft = cx - scrW / 2, scrTop = cy - scrH / 2 - 8;

        this.signalGfx = this.add.graphics().setDepth(20);
        this.signalParams = { left: scrLeft, top: scrTop, w: scrW, h: scrH };

        // FILTER button
        var btnY = cy + scrH / 2 + 8;
        this.filterBtn = this.createButton(cx, btnY, this.t('nav_filter_btn') || 'FILTER', 100, 22, null);

        this.filterBtn.zone.on('pointerdown', function() {
            if (self.instrumentsFixed.signal) return;
            if (window.AudioManager) window.AudioManager.playSFX('click');
            self.signalFiltered = true;
            self.fixInstrument('signal');
            self.filterBtn.label.setText(self.t('nav_filtered') || 'FILTERED');
            self.filterBtn.label.setColor('#00e436');
            self.filterBtn.drawDone();
            if (self.filterBtn.pulser) self.filterBtn.pulser.stop();
        });
    }

    drawSignalMonitor(time) {
        var p = this.signalParams;
        if (!p) return;
        var g = this.signalGfx;
        g.clear();

        var left = p.left, top = p.top, sw = p.w, sh = p.h;

        // Screen
        g.fillStyle(0x0a1018, 0.92);
        g.fillRect(left, top, sw, sh);
        g.lineStyle(1, 0x2d4a6a, 0.4);
        g.strokeRect(left, top, sw, sh);

        // Grid
        g.lineStyle(1, 0x1b2838, 0.25);
        for (var gx = left + 20; gx < left + sw; gx += 20) g.lineBetween(gx, top + 2, gx, top + sh - 2);
        for (var gy = top + 16; gy < top + sh; gy += 16) g.lineBetween(left + 2, gy, left + sw - 2, gy);

        // Center line
        var midY = top + sh / 2;
        g.lineStyle(1, 0x2d4a6a, 0.3);
        g.lineBetween(left + 2, midY, left + sw - 2, midY);

        // Waveform
        var amp = sh * 0.35;
        var noiseAmt = this.signalFiltered ? 0.05 : 1.0;
        var color = this.signalFiltered ? 0x00e436 : 0xffcc00;
        var offset = this.waveOffset;

        g.lineStyle(2, color, 0.9);
        g.beginPath();
        var ns = 99 + Math.floor(offset * 0.3);
        for (var i = 0; i <= 50; i++) {
            var px = left + 5 + (i / 50) * (sw - 10);
            ns = (ns * 1103515245 + 12345) & 0x7fffffff;
            var noise = ((ns / 0x7fffffff) * 2 - 1) * noiseAmt;
            var py = midY + Math.sin((i * 0.14) - offset * 0.025) * amp * 0.5 + noise * amp * 0.4;
            py = Math.max(top + 2, Math.min(top + sh - 2, py));
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.strokePath();
    }

    // ==========================================
    // INSTRUMENT 3: COMPASS STABILIZER
    // ==========================================
    createCompassStabilizer(cx, cy) {
        var self = this;
        var r = 45;

        this.compassGfx = this.add.graphics().setDepth(20);
        this.compassNeedleAngle = 0;
        this.compassParams = { cx: cx, cy: cy, r: r };
        this.drawCompass(0);

        // STABILIZE button (moved up to avoid clipping panel bottom)
        var btnY = cy + r;
        this.stabilizeBtn = this.createButton(cx, btnY, this.t('nav_stabilize_btn') || 'HOLD TO STABILIZE', 140, 22, null);

        // Progress bar behind button
        this.stabilizeProgress = this.add.graphics().setDepth(19);

        this.stabilizeBtn.zone.on('pointerdown', function() {
            if (self.instrumentsFixed.compass) return;
            self._stabilizeHeld = true;
            if (window.AudioManager) window.AudioManager.playSFX('click');
            self.stabilizeBtn.drawActive();
        });
        this.stabilizeBtn.zone.on('pointerup', function() {
            self._stabilizeHeld = false;
            if (!self.instrumentsFixed.compass) {
                self.compassHoldTime = Math.max(0, self.compassHoldTime - 300);
                self.stabilizeBtn.drawNormal();
            }
        });
        this.stabilizeBtn.zone.on('pointerout', function() {
            self._stabilizeHeld = false;
            if (!self.instrumentsFixed.compass) {
                self.stabilizeBtn.drawNormal();
            }
        });
    }

    drawCompass(needleAngle) {
        var cp = this.compassParams;
        if (!cp) return;
        var g = this.compassGfx;
        var cx = cp.cx, cy = cp.cy, r = cp.r;
        g.clear();

        // Face
        g.fillStyle(0x0a1018, 0.95);
        g.fillCircle(cx, cy, r + 3);
        g.lineStyle(2, 0x5f574f, 0.8);
        g.strokeCircle(cx, cy, r + 3);

        // Degree ticks
        for (var i = 0; i < 36; i++) {
            var a = (i / 36) * Math.PI * 2 - Math.PI / 2;
            var major = (i % 9 === 0);
            var inner = major ? r - 10 : r - 4;
            g.lineStyle(major ? 2 : 1, major ? 0xc2c3c7 : 0x5f574f, major ? 0.7 : 0.3);
            g.lineBetween(
                cx + Math.cos(a) * inner, cy + Math.sin(a) * inner,
                cx + Math.cos(a) * r, cy + Math.sin(a) * r
            );
        }

        // Cardinal labels
        if (this._compassLabels) this._compassLabels.forEach(function(l) { l.destroy(); });
        var cs = { fontFamily: 'monospace', fontSize: '8px', color: '#c2c3c7', stroke: '#000000', strokeThickness: 1 };
        this._compassLabels = [
            this.add.text(cx, cy - r + 12, 'N', { fontFamily: 'monospace', fontSize: '8px', color: '#ff004d', stroke: '#000000', strokeThickness: 1 }).setOrigin(0.5).setDepth(21),
            this.add.text(cx, cy + r - 12, 'S', cs).setOrigin(0.5).setDepth(21),
            this.add.text(cx + r - 12, cy, 'E', cs).setOrigin(0.5).setDepth(21),
            this.add.text(cx - r + 12, cy, 'W', cs).setOrigin(0.5).setDepth(21)
        ];

        // Needle
        var fixed = this.instrumentsFixed && this.instrumentsFixed.compass;
        var nAngle = needleAngle - Math.PI / 2;
        var nLen = r - 8;

        // Red N half
        g.fillStyle(fixed ? 0x00e436 : 0xff004d, 0.95);
        g.fillTriangle(
            cx + Math.cos(nAngle) * nLen, cy + Math.sin(nAngle) * nLen,
            cx + Math.cos(nAngle + 2.6) * 4, cy + Math.sin(nAngle + 2.6) * 4,
            cx + Math.cos(nAngle - 2.6) * 4, cy + Math.sin(nAngle - 2.6) * 4
        );
        // Blue S half
        g.fillStyle(0x29adff, 0.7);
        g.fillTriangle(
            cx + Math.cos(nAngle + Math.PI) * nLen, cy + Math.sin(nAngle + Math.PI) * nLen,
            cx + Math.cos(nAngle + Math.PI + 2.6) * 4, cy + Math.sin(nAngle + Math.PI + 2.6) * 4,
            cx + Math.cos(nAngle + Math.PI - 2.6) * 4, cy + Math.sin(nAngle + Math.PI - 2.6) * 4
        );

        // Pivot
        g.fillStyle(0x5f574f, 1);
        g.fillCircle(cx, cy, 3);
        g.fillStyle(0xc2c3c7, 0.5);
        g.fillCircle(cx, cy, 1);
    }

    // ==========================================
    // FIX INSTRUMENT
    // ==========================================
    fixInstrument(name) {
        if (this.instrumentsFixed[name]) return;
        this.instrumentsFixed[name] = true;

        // Update LED to green
        var led = this.statusLeds[name];
        if (led) {
            led.gfx.clear();
            led.gfx.fillStyle(0x00e436, 1);
            led.gfx.fillCircle(led.x, led.y, 4);
            led.gfx.fillStyle(0x00e436, 0.2);
            led.gfx.fillCircle(led.x, led.y, 12);
        }

        // Remove flashing arrow
        if (this.arrows[name]) {
            this.tweens.killTweensOf(this.arrows[name]);
            this.arrows[name].destroy();
            delete this.arrows[name];
        }

        if (window.AudioManager) window.AudioManager.playSFX('discovery');
        this.cameras.main.flash(200, 0, 60, 30);

        // Check all fixed
        if (this.instrumentsFixed.dial && this.instrumentsFixed.signal && this.instrumentsFixed.compass) {
            this.onAllFixed();
        }
    }

    onAllFixed() {
        if (this.allFixed) return;
        this.allFixed = true;
        var self = this;
        var t = this.t;

        if (window.AudioManager) window.AudioManager.playSFX('quest_complete');

        // Green flash on wall screen
        this.cameras.main.flash(500, 0, 120, 50);

        // Success dialog
        this.time.delayedCall(800, function() {
            self.showTypewriterDialog('navi',
                t('nav_all_fixed') || 'All instruments restored! The compass is back online. But something still doesn\'t add up...',
                self.fontFamily);
        });

        // Advance to Act 3
        if (window.GameState) window.GameState.startAct(3);

        // Complete all Act 2 quests
        if (window.QuestSystem) {
            window.QuestSystem.completeQuest('errors');
            var q;
            q = window.QuestSystem.getQuest('noise');
            if (q && q.status === 'available') window.QuestSystem.acceptQuest('noise');
            window.QuestSystem.completeQuest('noise');
            q = window.QuestSystem.getQuest('clean');
            if (q && q.status === 'available') window.QuestSystem.acceptQuest('clean');
            window.QuestSystem.completeQuest('clean');
            q = window.QuestSystem.getQuest('revelation');
            if (q && q.status === 'available') window.QuestSystem.acceptQuest('revelation');
            window.QuestSystem.completeObjective('revelation', 'realize_truth');
            window.QuestSystem.completeQuest('revelation');
        }

        // Transition
        this.time.delayedCall(4000, function() {
            self.cameras.main.fadeOut(600, 0, 0, 0);
            self.time.delayedCall(600, function() {
                self.scene.start('ShipHub');
            });
        });
    }

    // ==========================================
    // TYPEWRITER DIALOG
    // ==========================================
    showTypewriterDialog(npc, fullText, fontFamily, onComplete) {
        var w = this.W, h = this.H;
        var isRTL = this.isRTL;
        var self = this;

        // Top dialog bar
        var dialogH = 80;
        var dialogW = Math.floor(w * 0.94);
        var dialogX = Math.floor((w - dialogW) / 2);
        var dialogY = 6;

        var panel = this.add.graphics().setDepth(50);
        panel.fillStyle(0x0a1628, 0.95);
        panel.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 8);
        panel.lineStyle(1, 0x53d8fb, 0.4);
        panel.strokeRoundedRect(dialogX, dialogY, dialogW, dialogH, 8);

        // Avatar
        var avatarKey = 'avatar_' + npc;
        var avatarX = isRTL ? dialogX + dialogW - 30 : dialogX + 30;
        var avatar = this.add.image(avatarX, dialogY + dialogH / 2, avatarKey)
            .setScale(0.6).setDepth(51);

        // NPC name
        var names = { magneta: 'magneta_name', captain: 'captain_name', navi: 'navi_name', geo: 'geo_name' };
        var nameText = window.I18N ? window.I18N.t(names[npc]) : npc;
        if (isRTL && window.I18N) nameText = window.I18N.fixRTL(nameText);

        var nameDisplay = this.add.text(
            isRTL ? avatarX - 40 : avatarX + 40,
            dialogY + 8, nameText, {
                fontFamily: fontFamily + ', monospace',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#53d8fb',
                stroke: '#000000',
                strokeThickness: 3,
                rtl: isRTL
            }
        ).setOrigin(isRTL ? 1 : 0, 0).setDepth(51);

        // Dialog text — starts empty, types out
        var textX = isRTL ? dialogX + dialogW - 70 : dialogX + 70;
        var dialogTextObj = this.add.text(textX, dialogY + 32, '', {
            fontFamily: fontFamily + ', monospace',
            fontSize: '14px',
            color: '#ccddee',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 900, useAdvancedWrap: true },
            lineSpacing: 3,
            align: isRTL ? 'right' : 'left',
            rtl: isRTL
        }).setOrigin(isRTL ? 1 : 0, 0).setDepth(51);

        // Typewriter effect
        var charIndex = 0;
        var typeTimer = this.time.addEvent({
            delay: 30,
            repeat: fullText.length - 1,
            callback: function() {
                charIndex++;
                dialogTextObj.setText(fullText.substring(0, charIndex));
                // Typing sound every 3rd character
                if (charIndex % 3 === 0 && window.AudioManager) {
                    window.AudioManager.playSFX('typekey');
                }
            }
        });

        var allElements = [panel, avatar, nameDisplay, dialogTextObj];

        // Auto-dismiss after typing finishes + reading time
        var totalTypeTime = fullText.length * 30;
        var dismissDelay = totalTypeTime + 3000;

        this.time.delayedCall(dismissDelay, function() {
            self.tweens.add({
                targets: allElements,
                alpha: 0,
                duration: 400,
                onComplete: function() {
                    allElements.forEach(function(el) { if (el.active) el.destroy(); });
                    if (onComplete) onComplete();
                }
            });
        });

        // Click to skip typewriter + dismiss
        panel.setInteractive(new Phaser.Geom.Rectangle(dialogX, dialogY, dialogW, dialogH), Phaser.Geom.Rectangle.Contains);
        panel.on('pointerdown', function() {
            if (charIndex < fullText.length) {
                // Skip to end of text
                typeTimer.remove();
                charIndex = fullText.length;
                dialogTextObj.setText(fullText);
            } else {
                // Dismiss
                allElements.forEach(function(el) { if (el.active) el.destroy(); });
                if (onComplete) { onComplete(); onComplete = null; }
            }
        });

        if (window.AudioManager) window.AudioManager.playSFX('page_turn');
    }

    // ==========================================
    // BACK BUTTON
    // ==========================================
    createBackButton(fontFamily) {
        var t = this.t;
        var self = this;
        var btn = this.add.zone(50, this.H - 30, 80, 44)
            .setInteractive({ useHandCursor: true })
            .setDepth(41);
        this.add.image(50, this.H - 30, 'btn_small')
            .setScale(0.7).setDepth(40);
        this.add.text(50, this.H - 30, '\u2190 ' + (t('back_btn') || 'Back'), {
            fontFamily: fontFamily + ', monospace',
            fontSize: '13px', color: '#aaaacc', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(40);
        btn.on('pointerdown', function() {
            if (window.AudioManager) window.AudioManager.playSFX('door_open');
            self.cameras.main.fadeOut(400, 0, 0, 10);
            self.time.delayedCall(400, function() { self.scene.start('ShipHub'); });
        });
    }

    // ==========================================
    // UPDATE LOOP
    // ==========================================
    update(time, delta) {
        // Scroll waveforms
        this.waveOffset = (this.waveOffset || 0) + delta * 0.06;

        // Wall screen (~10 FPS)
        if (!this._lastScreen || time - this._lastScreen > 100) {
            this._lastScreen = time;
            this.drawWallScreen(time);
        }

        // Signal monitor (~12 FPS)
        if (this.signalGfx && (!this._lastSignal || time - this._lastSignal > 80)) {
            this._lastSignal = time;
            this.drawSignalMonitor(time);
        }

        // Compass needle jitter
        if (this.compassParams && !this.instrumentsFixed.compass) {
            var cp = this.compassParams;
            var jitter = Math.sin(time * 0.005) * 0.9 + Math.sin(time * 0.013) * 0.5 + Math.cos(time * 0.007) * 0.3;

            if (this._stabilizeHeld) {
                this.compassHoldTime += delta;
                var damp = 1 - Math.min(1, this.compassHoldTime / this.compassHoldNeeded);
                jitter *= damp;

                // Progress bar
                var progress = Math.min(1, this.compassHoldTime / this.compassHoldNeeded);
                this.stabilizeProgress.clear();
                this.stabilizeProgress.fillStyle(0xffa300, 0.4);
                this.stabilizeProgress.fillRoundedRect(
                    cp.cx - 70, cp.cy + cp.r + 14 - 11,
                    140 * progress, 22, 5
                );

                if (this.compassHoldTime >= this.compassHoldNeeded) {
                    this.fixInstrument('compass');
                    this.stabilizeBtn.label.setText(this.t('nav_stable') || 'STABLE');
                    this.stabilizeBtn.label.setColor('#00e436');
                    this.stabilizeBtn.drawDone();
                    if (this.stabilizeBtn.pulser) this.stabilizeBtn.pulser.stop();
                    this.stabilizeProgress.clear();
                    jitter = 0;
                }
            } else {
                this.compassHoldTime = Math.max(0, this.compassHoldTime - delta * 0.5);
                var progress = Math.min(1, this.compassHoldTime / this.compassHoldNeeded);
                this.stabilizeProgress.clear();
                if (progress > 0.01) {
                    this.stabilizeProgress.fillStyle(0xffa300, 0.25);
                    this.stabilizeProgress.fillRoundedRect(
                        cp.cx - 70, cp.cy + cp.r + 14 - 11,
                        140 * progress, 22, 5
                    );
                }
            }

            this.compassNeedleAngle = jitter;
            this.drawCompass(this.compassNeedleAngle);
        }
    }
}

window.NavigationScene = NavigationScene;
