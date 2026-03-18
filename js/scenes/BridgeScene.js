/**
 * BridgeScene - Act 4: Recalibrate & Save the Ship
 * 3-step checklist: enter BH, adjust deviation angle, confirm heading.
 * Large compass rose center screen with spinning needle.
 */
class BridgeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Bridge' });
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
        this._C = {
            DEEP_NAVY: 0x0d1b2a, DARK_BLUE: 0x1b2838, MED_BLUE: 0x2d4a6a,
            CYAN: 0x53d8fb, WHITE: 0xfff1e8, RED: 0xff004d,
            GREEN: 0x00e436, ORANGE: 0xffa300, YELLOW: 0xffec27
        };

        if (window.AudioManager) {
            window.AudioManager.playMusic('tension');
            window.AudioManager.startAmbient('ship_engine');
        }

        // === STATE ===
        this.step = 0; // 0=BH, 1=angle, 2=heading
        this.stepsComplete = [false, false, false];
        this.compassSpinning = true;
        this.compassAngle = 0;
        this.bhValue = 0;
        this.deviationAngle = 0;

        // Get measured BH from GameState
        this.measuredBH = (window.GameState && window.GameState.calculatedBH) || 26;
        this.expectedBH = 45;
        this.correctDeviation = 42; // degrees

        // === BACKGROUND ===
        if (this.textures.exists('bg_bridge')) {
            this.add.image(0, 0, 'bg_bridge').setOrigin(0, 0).setDisplaySize(w, h).setDepth(0);
        } else {
            var bg = this.add.graphics().setDepth(0);
            bg.fillStyle(this._C.DEEP_NAVY, 1); bg.fillRect(0, 0, w, h);
        }

        // === BACK BUTTON ===
        this.createBackButton();

        // === COMPASS ROSE (center of console) ===
        this.createCompassRose(480, 400, 90);

        // === CHECKLIST PANEL (left console) ===
        this.createChecklist(160, 320);

        // === INTERACTION PANEL (right console) ===
        this.interactionGroup = [];
        this.showStep(0);

        // === OPENING DIALOG ===
        this.cameras.main.fadeIn(500, 0, 5, 20);
        this.time.delayedCall(600, function() {
            self.showTypewriterDialog('captain',
                t('bridge_intro') || 'We need to recalibrate navigation NOW! Follow the 3 steps on the left panel.',
                function() {});
        });

        // Quest
        if (window.QuestSystem) {
            var rq = window.QuestSystem.getQuest('recalibrate');
            if (rq && rq.status === 'available') window.QuestSystem.acceptQuest('recalibrate');
        }
    }

    // ==========================================
    // COMPASS ROSE — large, center screen
    // ==========================================
    createCompassRose(cx, cy, r) {
        this.compassCx = cx;
        this.compassCy = cy;
        this.compassR = r;

        // Compass face
        var faceGfx = this.add.graphics().setDepth(10);
        faceGfx.fillStyle(this._C.DEEP_NAVY, 0.95);
        faceGfx.fillCircle(cx, cy, r + 6);
        faceGfx.lineStyle(3, this._C.CYAN, 0.5);
        faceGfx.strokeCircle(cx, cy, r + 6);

        // Degree ticks
        for (var i = 0; i < 72; i++) {
            var a = (i / 72) * Math.PI * 2 - Math.PI / 2;
            var major = (i % 18 === 0);
            var mid = (i % 9 === 0);
            var inner = major ? r - 14 : (mid ? r - 8 : r - 4);
            faceGfx.lineStyle(major ? 2 : 1, major ? 0xfff1e8 : (mid ? 0xc2c3c7 : 0x5f574f), major ? 0.9 : 0.5);
            faceGfx.lineBetween(
                cx + Math.cos(a) * inner, cy + Math.sin(a) * inner,
                cx + Math.cos(a) * r, cy + Math.sin(a) * r
            );
        }

        // Cardinal labels — OUTSIDE the circle, 12px, white
        var cardinals = [
            { label: 'N', angle: -Math.PI / 2, color: '#fff1e8' },
            { label: 'E', angle: 0, color: '#fff1e8' },
            { label: 'S', angle: Math.PI / 2, color: '#fff1e8' },
            { label: 'W', angle: Math.PI, color: '#fff1e8' }
        ];
        for (var ci = 0; ci < cardinals.length; ci++) {
            var card = cardinals[ci];
            var lx = cx + Math.cos(card.angle) * (r + 16);
            var ly = cy + Math.sin(card.angle) * (r + 16);
            this.add.text(lx, ly, card.label, {
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px', fontStyle: 'bold',
                color: card.label === 'N' ? '#ff004d' : card.color,
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(11);
        }

        // Target angle marker — green tick on compass rim at 42°
        var targetRad = Phaser.Math.DegToRad(this.correctDeviation - 90);
        faceGfx.lineStyle(3, 0x00e436, 0.9);
        faceGfx.lineBetween(
            cx + Math.cos(targetRad) * (r - 2), cy + Math.sin(targetRad) * (r - 2),
            cx + Math.cos(targetRad) * (r + 6), cy + Math.sin(targetRad) * (r + 6)
        );
        // Small green dot at target
        faceGfx.fillStyle(0x00e436, 0.7);
        faceGfx.fillCircle(cx + Math.cos(targetRad) * (r + 3), cy + Math.sin(targetRad) * (r + 3), 3);

        // Needle (will be redrawn in update)
        this.compassNeedleGfx = this.add.graphics().setDepth(12);
        this.drawCompassNeedle(0);

        // Center pivot
        faceGfx.fillStyle(0x5f574f, 1);
        faceGfx.fillCircle(cx, cy, 5);
        faceGfx.fillStyle(0xc2c3c7, 0.7);
        faceGfx.fillCircle(cx, cy, 2);

        // Current angle readout (CYAN, 14px) — below compass
        this.mainAngleText = this.add.text(cx, cy + r + 34,
            (this.t('bridge_current_angle') || 'Current') + ': 0°', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '14px', fontStyle: 'bold',
            color: '#53d8fb',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(11);

        // Target angle readout (YELLOW, 14px)
        this.mainTargetText = this.add.text(cx, cy + r + 52,
            (this.t('bridge_target_angle') || 'Target') + ': ~' + this.correctDeviation + '°', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '14px', fontStyle: 'bold',
            color: '#ffec27',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(11);

        // Heading readout below compass
        this.headingDisplay = this.add.text(cx, cy + r + 18, '---°', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '16px', fontStyle: 'bold',
            color: '#ffa300',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(11);
    }

    drawCompassNeedle(angleDeg) {
        var g = this.compassNeedleGfx;
        var cx = this.compassCx, cy = this.compassCy;
        var len = this.compassR - 10;
        var a = Phaser.Math.DegToRad(angleDeg - 90);
        g.clear();

        // North (red)
        g.fillStyle(0xff004d, 0.95);
        g.fillTriangle(
            cx + Math.cos(a) * len, cy + Math.sin(a) * len,
            cx + Math.cos(a + 2.7) * 5, cy + Math.sin(a + 2.7) * 5,
            cx + Math.cos(a - 2.7) * 5, cy + Math.sin(a - 2.7) * 5
        );
        // South (blue)
        g.fillStyle(0x29adff, 0.8);
        g.fillTriangle(
            cx + Math.cos(a + Math.PI) * len, cy + Math.sin(a + Math.PI) * len,
            cx + Math.cos(a + Math.PI + 2.7) * 5, cy + Math.sin(a + Math.PI + 2.7) * 5,
            cx + Math.cos(a + Math.PI - 2.7) * 5, cy + Math.sin(a + Math.PI - 2.7) * 5
        );
    }

    // ==========================================
    // CHECKLIST — 3 steps on left panel
    // ==========================================
    createChecklist(cx, topY) {
        var t = this.t;
        var C = this._C;
        var panelW = 260, panelH = 190;
        var left = cx - panelW / 2;

        var bg = this.add.graphics().setDepth(10);
        bg.fillStyle(C.DEEP_NAVY, 0.95);
        bg.fillRoundedRect(left, topY, panelW, panelH, 6);
        bg.lineStyle(1, C.CYAN, 0.4);
        bg.strokeRoundedRect(left, topY, panelW, panelH, 6);

        this.add.text(cx, topY + 16, t('bridge_checklist_title') || '[ Calibration Steps ]', {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '10px', fontStyle: 'bold', color: '#53d8fb',
            stroke: '#000000', strokeThickness: 2, rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);

        var steps = [
            t('bridge_step1') || 'Enter measured BH value',
            t('bridge_step2') || 'Adjust deviation angle',
            t('bridge_step3') || 'Confirm navigation heading'
        ];

        this.checklistItems = [];
        for (var i = 0; i < 3; i++) {
            var sy = topY + 40 + i * 48;

            // Checkbox
            var checkGfx = this.add.graphics().setDepth(11);
            checkGfx.lineStyle(2, C.CYAN, 0.5);
            checkGfx.strokeRect(left + 10, sy, 16, 16);
            this.checklistItems.push({ gfx: checkGfx, x: left + 10, y: sy });

            // Step text
            this.add.text(left + 34, sy + 8, (i + 1) + '. ' + steps[i], {
                fontFamily: this.fontFamily + ', monospace',
                fontSize: '11px', color: i === 0 ? '#fff1e8' : '#5f574f',
                stroke: '#000000', strokeThickness: 2,
                wordWrap: { width: panelW - 50, useAdvancedWrap: true },
                rtl: this.isRTL
            }).setOrigin(0, 0.5).setDepth(11);
        }
    }

    completeStep(index) {
        if (this.stepsComplete[index]) return;
        this.stepsComplete[index] = true;
        var C = this._C;

        // Draw green check
        var item = this.checklistItems[index];
        item.gfx.clear();
        item.gfx.fillStyle(C.GREEN, 0.3);
        item.gfx.fillRect(item.x, item.y, 16, 16);
        item.gfx.lineStyle(2, C.GREEN, 0.9);
        item.gfx.strokeRect(item.x, item.y, 16, 16);
        // Checkmark
        this.add.text(item.x + 8, item.y + 8, '✓', {
            fontFamily: 'monospace', fontSize: '14px', color: '#00e436'
        }).setOrigin(0.5).setDepth(12);

        if (window.AudioManager) window.AudioManager.playSFX('discovery');
        this.cameras.main.flash(150, 0, 50, 25);
    }

    // ==========================================
    // INTERACTION PANEL — right console, changes per step
    // ==========================================
    showStep(index) {
        this.step = index;
        // Clean previous
        this.interactionGroup.forEach(function(el) { if (el && el.destroy) el.destroy(); });
        this.interactionGroup = [];

        var cx = 800, topY = (index === 1) ? 280 : 320;
        var panelW = 260, panelH = (index === 1) ? 250 : 190;
        var left = cx - panelW / 2;
        var C = this._C;
        var t = this.t;
        var self = this;

        var bg = this.add.graphics().setDepth(10);
        bg.fillStyle(C.DEEP_NAVY, 0.95);
        bg.fillRoundedRect(left, topY, panelW, panelH, 6);
        bg.lineStyle(1, C.CYAN, 0.4);
        bg.strokeRoundedRect(left, topY, panelW, panelH, 6);
        this.interactionGroup.push(bg);

        if (index === 0) {
            this.buildStep1_BH(cx, topY, panelW);
        } else if (index === 1) {
            this.buildStep2_Angle(cx, topY, panelW);
        } else if (index === 2) {
            this.buildStep3_Heading(cx, topY, panelW);
        }
    }

    // Step 1: Enter BH value
    buildStep1_BH(cx, topY, panelW) {
        var t = this.t;
        var self = this;
        var C = this._C;

        this.addInterText(cx, topY + 16, t('bridge_enter_bh') || 'Enter BH Value (μT)', '#53d8fb', '11px');

        // Display measured value from lab
        this.addInterText(cx, topY + 40, t('bridge_your_measurement') || 'Your measurement:', '#c2c3c7', '10px');

        var bhVal = this.measuredBH;
        this.addInterText(cx, topY + 60, bhVal + ' μT', '#ffec27', '18px');

        // Slider to confirm
        var sliderY = topY + 95;
        var sliderW = 180;
        var sliderLeft = cx - sliderW / 2;

        var trackGfx = this.add.graphics().setDepth(11);
        trackGfx.fillStyle(0x1a2a3a, 1);
        trackGfx.fillRoundedRect(sliderLeft, sliderY - 3, sliderW, 6, 3);
        this.interactionGroup.push(trackGfx);

        var fillGfx = this.add.graphics().setDepth(11);
        this.interactionGroup.push(fillGfx);

        // Tick marks: 10, 20, 30, 40, 50
        for (var v = 10; v <= 50; v += 10) {
            var tx = sliderLeft + ((v - 10) / 40) * sliderW;
            this.addInterText(tx, sliderY + 10, '' + v, '#5f574f', '8px');
        }

        var thumb = this.add.circle(sliderLeft + ((bhVal - 10) / 40) * sliderW, sliderY, 8, C.CYAN)
            .setInteractive({ useHandCursor: true, draggable: true }).setDepth(12);
        this.interactionGroup.push(thumb);
        this.input.setDraggable(thumb);

        var valueText = this.add.text(cx, topY + 120, bhVal.toFixed(1) + ' μT', {
            fontFamily: 'Orbitron, monospace', fontSize: '14px', fontStyle: 'bold',
            color: '#53d8fb', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
        this.interactionGroup.push(valueText);

        thumb.on('drag', function(pointer, dragX) {
            var clampedX = Phaser.Math.Clamp(dragX, sliderLeft, sliderLeft + sliderW);
            thumb.x = clampedX;
            var ratio = (clampedX - sliderLeft) / sliderW;
            self.bhValue = 10 + ratio * 40;
            self.bhValue = Math.round(self.bhValue * 2) / 2;
            valueText.setText(self.bhValue.toFixed(1) + ' μT');
            fillGfx.clear();
            fillGfx.fillStyle(C.CYAN, 0.5);
            fillGfx.fillRoundedRect(sliderLeft, sliderY - 3, clampedX - sliderLeft, 6, 3);

            // Check correctness (within ±5)
            var correct = Math.abs(self.bhValue - self.measuredBH) <= 5;
            valueText.setColor(correct ? '#00e436' : '#53d8fb');
        });

        // Confirm button
        var btn = this.createInterButton(cx, topY + 155, t('bridge_confirm') || 'Confirm', function() {
            var correct = Math.abs(self.bhValue - self.measuredBH) <= 5;
            if (correct) {
                self.completeStep(0);
                if (window.QuestSystem) window.QuestSystem.completeObjective('recalibrate', 'enter_bh');
                self.time.delayedCall(600, function() { self.showStep(1); });
            } else {
                self.cameras.main.shake(200, 0.005);
                if (window.AudioManager) window.AudioManager.playSFX('error');
            }
        });
    }

    // Step 2: Adjust deviation angle — with visible compass in panel
    buildStep2_Angle(cx, topY, panelW) {
        var t = this.t;
        var self = this;
        var C = this._C;

        // Instruction
        this.addInterText(cx, topY + 14, t('bridge_rotate_instruction') || 'Rotate the needle to match the target', '#53d8fb', '9px');

        // Mini compass rose in the interaction panel
        var compassCx = cx;
        var compassCy = topY + 80;
        var compassR = 50;

        var compassFace = this.add.graphics().setDepth(11);
        compassFace.fillStyle(C.DEEP_NAVY, 0.95);
        compassFace.fillCircle(compassCx, compassCy, compassR + 3);
        compassFace.lineStyle(2, C.CYAN, 0.5);
        compassFace.strokeCircle(compassCx, compassCy, compassR + 3);
        this.interactionGroup.push(compassFace);

        // Tick marks every 30°
        for (var ti = 0; ti < 12; ti++) {
            var ta = (ti / 12) * Math.PI * 2 - Math.PI / 2;
            var major = (ti % 3 === 0);
            var inner = major ? compassR - 10 : compassR - 5;
            compassFace.lineStyle(major ? 2 : 1, major ? 0xfff1e8 : 0x5f574f, major ? 0.8 : 0.4);
            compassFace.lineBetween(
                compassCx + Math.cos(ta) * inner, compassCy + Math.sin(ta) * inner,
                compassCx + Math.cos(ta) * compassR, compassCy + Math.sin(ta) * compassR
            );
        }

        // N/S/E/W labels
        var cardStyle = { fontFamily: 'monospace', fontSize: '8px', stroke: '#000000', strokeThickness: 1 };
        var cardN = this.add.text(compassCx, compassCy - compassR + 10, 'N', Phaser.Utils.Objects.Merge(cardStyle, { color: '#ff004d' })).setOrigin(0.5).setDepth(12);
        var cardS = this.add.text(compassCx, compassCy + compassR - 10, 'S', Phaser.Utils.Objects.Merge(cardStyle, { color: '#c2c3c7' })).setOrigin(0.5).setDepth(12);
        var cardE = this.add.text(compassCx + compassR - 10, compassCy, 'E', Phaser.Utils.Objects.Merge(cardStyle, { color: '#c2c3c7' })).setOrigin(0.5).setDepth(12);
        var cardW = this.add.text(compassCx - compassR + 10, compassCy, 'W', Phaser.Utils.Objects.Merge(cardStyle, { color: '#c2c3c7' })).setOrigin(0.5).setDepth(12);
        this.interactionGroup.push(cardN, cardS, cardE, cardW);

        // Target zone arc (green, at target angle)
        var targetRad = Phaser.Math.DegToRad(this.correctDeviation - 90);
        compassFace.lineStyle(3, C.GREEN, 0.25);
        compassFace.beginPath();
        for (var ai = -8; ai <= 8; ai++) {
            var ar = targetRad + Phaser.Math.DegToRad(ai);
            var apx = compassCx + Math.cos(ar) * (compassR - 2);
            var apy = compassCy + Math.sin(ar) * (compassR - 2);
            if (ai === -8) compassFace.moveTo(apx, apy); else compassFace.lineTo(apx, apy);
        }
        compassFace.strokePath();

        // Needle graphics (redrawn on angle change)
        var needleGfx = this.add.graphics().setDepth(13);
        this.interactionGroup.push(needleGfx);

        // Center pivot
        compassFace.fillStyle(0x5f574f, 1);
        compassFace.fillCircle(compassCx, compassCy, 4);
        compassFace.fillStyle(0xc2c3c7, 0.5);
        compassFace.fillCircle(compassCx, compassCy, 2);

        var drawNeedle = function(deg, color) {
            needleGfx.clear();
            var a = Phaser.Math.DegToRad(deg - 90);
            var nLen = compassR - 8;
            needleGfx.fillStyle(color, 0.95);
            needleGfx.fillTriangle(
                compassCx + Math.cos(a) * nLen, compassCy + Math.sin(a) * nLen,
                compassCx + Math.cos(a + 2.7) * 4, compassCy + Math.sin(a + 2.7) * 4,
                compassCx + Math.cos(a - 2.7) * 4, compassCy + Math.sin(a - 2.7) * 4
            );
            // Tail
            needleGfx.fillStyle(0x29adff, 0.6);
            needleGfx.fillTriangle(
                compassCx + Math.cos(a + Math.PI) * (nLen * 0.4), compassCy + Math.sin(a + Math.PI) * (nLen * 0.4),
                compassCx + Math.cos(a + Math.PI + 2.7) * 3, compassCy + Math.sin(a + Math.PI + 2.7) * 3,
                compassCx + Math.cos(a + Math.PI - 2.7) * 3, compassCy + Math.sin(a + Math.PI - 2.7) * 3
            );
        };
        drawNeedle(self.deviationAngle, 0xff004d);

        // Current angle display
        var angleDisplay = this.add.text(cx, topY + 140, t('bridge_current_angle') || 'Current: ' + self.deviationAngle + '°', {
            fontFamily: 'Orbitron, monospace', fontSize: '12px', fontStyle: 'bold',
            color: '#53d8fb', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
        this.interactionGroup.push(angleDisplay);

        // Target display
        this.addInterText(cx, topY + 155, (t('bridge_target_angle') || 'Target') + ': ~' + self.correctDeviation + '°', '#5f574f', '9px');

        // Update function shared by both buttons
        var updateAngle = function() {
            var correct = Math.abs(self.deviationAngle - self.correctDeviation) <= 8;
            var needleColor = correct ? 0x00e436 : 0xff004d;

            // Animate needle to new angle
            var tweenObj = { deg: self.deviationAngle - (self._lastAngleDir > 0 ? 5 : -5) };
            self.tweens.add({
                targets: tweenObj,
                deg: self.deviationAngle,
                duration: 300,
                onUpdate: function(tw) { drawNeedle(tw.getValue(), needleColor); }
            });

            angleDisplay.setText((t('bridge_current_angle') || 'Current') + ': ' + self.deviationAngle + '°');
            angleDisplay.setColor(correct ? '#00e436' : '#53d8fb');
        };

        // -5 / +5 buttons
        this.createInterButton(cx - 60, topY + 190, '◀ -5°', function() {
            self._lastAngleDir = -1;
            self.deviationAngle = (self.deviationAngle - 5 + 360) % 360;
            updateAngle();
        });
        this.createInterButton(cx + 60, topY + 190, '+5° ▶', function() {
            self._lastAngleDir = 1;
            self.deviationAngle = (self.deviationAngle + 5) % 360;
            updateAngle();
        });

        // Confirm
        this.createInterButton(cx, topY + 225, t('bridge_confirm') || 'Confirm', function() {
            var correct = Math.abs(self.deviationAngle - self.correctDeviation) <= 8;
            if (correct) {
                self.completeStep(1);
                if (window.QuestSystem) window.QuestSystem.completeObjective('recalibrate', 'account_for_reversal');
                self.time.delayedCall(600, function() { self.showStep(2); });
            } else {
                self.cameras.main.shake(200, 0.005);
                if (window.AudioManager) window.AudioManager.playSFX('error');
            }
        });
    }

    // Step 3: Confirm heading — compass stops spinning
    buildStep3_Heading(cx, topY, panelW) {
        var t = this.t;
        var self = this;

        this.addInterText(cx, topY + 16, t('bridge_confirm_heading') || 'Confirm Navigation', '#53d8fb', '11px');
        this.addInterText(cx, topY + 50, t('bridge_heading_instruction') || 'The compass is recalibrated.\nConfirm the new heading.', '#c2c3c7', '11px');

        // Big green CONFIRM button
        this.createInterButton(cx, topY + 120, t('bridge_set_course') || 'SET COURSE', function() {
            self.completeStep(2);
            self.compassSpinning = false;
            self.compassAngle = 0; // points north

            // Quest
            if (window.QuestSystem) {
                var nq = window.QuestSystem.getQuest('navigate');
                if (nq && nq.status === 'available') window.QuestSystem.acceptQuest('navigate');
                window.QuestSystem.completeObjective('navigate', 'set_course');
                window.QuestSystem.completeQuest('navigate');
                var hq = window.QuestSystem.getQuest('home');
                if (hq && hq.status === 'available') window.QuestSystem.acceptQuest('home');
                window.QuestSystem.completeObjective('home', 'review_findings');
                window.QuestSystem.completeQuest('home');
            }

            self.onVictory();
        });
    }

    // ==========================================
    // VICTORY
    // ==========================================
    onVictory() {
        var self = this;
        var t = this.t;

        // Dramatic green flash
        this.cameras.main.flash(600, 0, 180, 50);
        if (window.AudioManager) window.AudioManager.playSFX('quest_complete');

        // Compass settles to north
        this.drawCompassNeedle(0);
        this.headingDisplay.setText('000°');
        this.headingDisplay.setColor('#00e436');

        // Captain dialog
        this.time.delayedCall(1200, function() {
            self.showTypewriterDialog('captain',
                t('bridge_victory') || 'You saved the ship! Navigation is restored. The Aurora sails again!',
                function() {
                    // Victory overlay
                    self.showVictoryScreen();
                });
        });
    }

    showVictoryScreen() {
        var w = this.W, h = this.H;
        var t = this.t;
        var self = this;
        var D = 90; // base depth for cinematic layers
        var horizonY = 320;

        if (window.AudioManager) window.AudioManager.stopAllAmbient();

        // === Fade bridge scene to night ===
        var fadeOut = this.add.graphics().setDepth(D);
        fadeOut.fillStyle(0x0d1b2a, 1);
        fadeOut.fillRect(0, 0, w, h);
        fadeOut.setAlpha(0);
        this.tweens.add({ targets: fadeOut, alpha: 1, duration: 1000 });

        this.time.delayedCall(1200, function() {

            // ===== PHASE 1: NIGHT SAILING (0-3s) =====

            // Sky (will be tinted later)
            var skyRect = self.add.rectangle(w / 2, horizonY / 2, w, horizonY, 0x0d1b2a).setDepth(D + 1);

            // Ocean (will be tinted later)
            var oceanRect = self.add.rectangle(w / 2, horizonY + (h - horizonY) / 2, w, h - horizonY, 0x1b2838).setDepth(D + 1);

            // Horizon glow strip (will change color)
            var horizonGlow = self.add.rectangle(w / 2, horizonY, w, 6, 0x2d4a6a).setDepth(D + 2).setAlpha(0.4);

            // Stars (30 white dots)
            var stars = [];
            for (var si = 0; si < 30; si++) {
                var star = self.add.rectangle(
                    Phaser.Math.Between(20, w - 20),
                    Phaser.Math.Between(15, horizonY - 20),
                    1, 1, 0xfff1e8
                ).setDepth(D + 2).setAlpha(Phaser.Math.FloatBetween(0.4, 1));
                stars.push(star);
            }

            // Moon (small white circle, top-right)
            var moon = self.add.circle(w - 120, 60, 12, 0xfff1e8).setDepth(D + 2);

            // 3 wave lines (animated sine)
            var waveGfxArr = [];
            for (var wi = 0; wi < 3; wi++) {
                var waveGfx = self.add.graphics().setDepth(D + 3);
                waveGfxArr.push({ gfx: waveGfx, baseY: horizonY + 30 + wi * 35, phase: wi * 1.2, color: wi === 1 ? 0x2d4a6a : 0x1b2838 });
            }

            // Ship silhouette (drawn at origin, positioned)
            var shipGfx = self.add.graphics().setDepth(D + 4);
            shipGfx.fillStyle(0x1b2838, 1);
            shipGfx.fillRect(-30, -8, 60, 12);
            shipGfx.fillTriangle(-30, -8, -40, 4, -30, 4);
            shipGfx.fillTriangle(30, -8, 40, 0, 30, 4);
            shipGfx.fillStyle(0x2d4a6a, 1);
            shipGfx.fillRect(-10, -18, 20, 12);
            shipGfx.fillStyle(0x5f574f, 1);
            shipGfx.fillRect(-3, -26, 6, 10);
            shipGfx.fillStyle(0xffec27, 0.6);
            shipGfx.fillRect(-6, -14, 4, 3);
            shipGfx.fillRect(2, -14, 4, 3);
            shipGfx.fillStyle(0x5f574f, 1);
            shipGfx.fillRect(10, -35, 2, 20);
            shipGfx.setPosition(350, horizonY - 6);
            shipGfx.setScale(1);

            // Ship sails slowly right (8000ms, peaceful)
            self.tweens.add({ targets: shipGfx, x: 550, duration: 8000, ease: 'Sine.easeInOut' });

            // Wave animation timer
            var waveTimer = self.time.addEvent({
                delay: 80, loop: true,
                callback: function() {
                    waveGfxArr.forEach(function(wv) {
                        wv.phase += 0.04;
                        wv.gfx.clear();
                        wv.gfx.lineStyle(1, wv.color, 0.2);
                        wv.gfx.beginPath();
                        for (var x = 0; x < w; x += 4) {
                            var y = wv.baseY + Math.sin(x * 0.008 + wv.phase) * 4;
                            if (x === 0) wv.gfx.moveTo(x, y); else wv.gfx.lineTo(x, y);
                        }
                        wv.gfx.strokePath();
                    });
                }
            });

            // ===== PHASE 2: SUNRISE (3-7s) =====
            self.time.delayedCall(3000, function() {
                // Moon fades out
                self.tweens.add({ targets: moon, alpha: 0, duration: 2000 });

                // Stars fade out
                stars.forEach(function(s) { self.tweens.add({ targets: s, alpha: 0, duration: 2500 }); });

                // Horizon glow: dark → indigo → orange → yellow
                self.tweens.addCounter({ from: 0, to: 100, duration: 4000, onUpdate: function(tw) {
                    var v = tw.getValue() / 100;
                    var r, g, b;
                    if (v < 0.33) { // navy → indigo
                        var t2 = v / 0.33;
                        r = Math.floor(13 + t2 * (131 - 13));
                        g = Math.floor(27 + t2 * (118 - 27));
                        b = Math.floor(42 + t2 * (156 - 42));
                    } else if (v < 0.66) { // indigo → orange
                        var t2 = (v - 0.33) / 0.33;
                        r = Math.floor(131 + t2 * (255 - 131));
                        g = Math.floor(118 + t2 * (163 - 118));
                        b = Math.floor(156 + t2 * (0 - 156));
                    } else { // orange → yellow
                        var t2 = (v - 0.66) / 0.34;
                        r = 255;
                        g = Math.floor(163 + t2 * (236 - 163));
                        b = Math.floor(0 + t2 * 39);
                    }
                    horizonGlow.setFillStyle(Phaser.Display.Color.GetColor(r, g, b));
                    horizonGlow.setAlpha(0.5 + v * 0.4);
                }});

                // Sky lightens: deep navy → med blue → bright blue
                self.tweens.addCounter({ from: 0, to: 100, duration: 4000, onUpdate: function(tw) {
                    var v = tw.getValue() / 100;
                    var r = Math.floor(13 + v * (41 - 13));
                    var g = Math.floor(27 + v * (173 - 27));
                    var b = Math.floor(42 + v * (255 - 42));
                    skyRect.setFillStyle(Phaser.Display.Color.GetColor(r, g, b));
                }});

                // Ocean lightens
                self.tweens.addCounter({ from: 0, to: 100, duration: 4000, onUpdate: function(tw) {
                    var v = tw.getValue() / 100;
                    var r = Math.floor(27 + v * (41 - 27));
                    var g = Math.floor(40 + v * (140 - 40));
                    var b = Math.floor(56 + v * (200 - 56));
                    oceanRect.setFillStyle(Phaser.Display.Color.GetColor(r, g, b));
                }});

                // Sun rises from horizon
                var sun = self.add.circle(w / 2 + 80, horizonY + 20, 4, 0xffec27).setDepth(D + 5).setAlpha(0);
                self.tweens.add({ targets: sun, alpha: 1, duration: 500 });
                self.tweens.add({ targets: sun, y: 120, duration: 3500, ease: 'Sine.easeOut' });
                self.tweens.add({
                    targets: sun,
                    radius: 20,
                    duration: 3500,
                    onUpdate: function(tw) {
                        var sz = 4 + (tw.getValue() - 4);
                        sun.setRadius(Math.max(4, sz));
                    }
                });
                // Sun glow halo
                var sunGlow = self.add.circle(w / 2 + 80, horizonY + 20, 30, 0xffec27).setDepth(D + 4).setAlpha(0);
                self.tweens.add({ targets: sunGlow, alpha: 0.15, y: 120, duration: 3500, ease: 'Sine.easeOut' });
            });

            // ===== PHASE 3: BLUE DAY (7-9s) — just let it ride =====

            // ===== PHASE 4: CREDITS (9-14s) =====
            self.time.delayedCall(9000, function() {
                waveTimer.remove();

                // Fade to deep navy
                var creditBg = self.add.graphics().setDepth(D + 10);
                creditBg.fillStyle(0x0d1b2a, 1);
                creditBg.fillRect(0, 0, w, h);
                creditBg.setAlpha(0);
                self.tweens.add({ targets: creditBg, alpha: 1, duration: 1500 });

                self.time.delayedCall(2000, function() {
                    var fontFamily = self.fontFamily;
                    var isRTL = self.isRTL;

                    // Title
                    var titleText = self.add.text(w / 2, 90, t('victory_title') || 'Mission Complete!', {
                        fontFamily: 'Orbitron, ' + fontFamily + ', monospace',
                        fontSize: '22px', fontStyle: 'bold',
                        color: '#00e436', stroke: '#000000', strokeThickness: 4, rtl: isRTL
                    }).setOrigin(0.5).setDepth(D + 11).setAlpha(0);
                    self.tweens.add({ targets: titleText, alpha: 1, y: 80, duration: 600 });

                    // Credits
                    var credits = [
                        { y: 160, text: t('credits_educational') || 'Educational Content', color: '#c2c3c7', size: '10px', delay: 800 },
                        { y: 195, text: '\u05D3\u05F4\u05E8 \u05D0\u05D5\u05E8\u05E0\u05D9\u05EA \u05DE\u05D9\u05D9\u05DE\u05D5\u05DF', color: '#53d8fb', size: '18px', delay: 1400 },
                        { y: 275, text: t('credits_game_design') || 'Game Design', color: '#c2c3c7', size: '10px', delay: 2600 },
                        { y: 310, text: '\u05E9\u05DC\u05D5\u05DE\u05D9 \u05E0\u05D5\u05D9\u05E4\u05DC\u05D3', color: '#53d8fb', size: '18px', delay: 3200 }
                    ];

                    credits.forEach(function(cr) {
                        var txt = cr.text;
                        if (isRTL && window.I18N) txt = window.I18N.fixRTL(txt);
                        var ct = self.add.text(w / 2, cr.y + 15, txt, {
                            fontFamily: fontFamily + ', monospace',
                            fontSize: cr.size, fontStyle: cr.size === '18px' ? 'bold' : 'normal',
                            color: cr.color, stroke: '#000000', strokeThickness: 3, rtl: isRTL
                        }).setOrigin(0.5).setDepth(D + 11).setAlpha(0);
                        self.tweens.add({ targets: ct, alpha: 1, y: cr.y, duration: 600, delay: cr.delay });
                    });

                    // Restart prompt
                    self.time.delayedCall(4500, function() {
                        var restartTxt = t('credits_restart') || 'Press to continue';
                        if (isRTL && window.I18N) restartTxt = window.I18N.fixRTL(restartTxt);
                        var restartBtn = self.add.text(w / 2, 420, restartTxt, {
                            fontFamily: fontFamily + ', monospace',
                            fontSize: '10px', color: '#fff1e8',
                            stroke: '#000000', strokeThickness: 3, rtl: isRTL
                        }).setOrigin(0.5).setDepth(D + 12).setAlpha(0);

                        self.tweens.add({
                            targets: restartBtn,
                            alpha: { from: 0.3, to: 1 },
                            duration: 800, yoyo: true, repeat: -1
                        });

                        // Click anywhere to go to title
                        var clickZone = self.add.zone(w / 2, h / 2, w, h)
                            .setInteractive({ useHandCursor: true }).setDepth(D + 13);
                        clickZone.on('pointerdown', function() {
                            self.cameras.main.fadeOut(1000, 0, 0, 0);
                            self.time.delayedCall(1000, function() {
                                self.scene.start('Title');
                            });
                        });
                    });
                });
            });
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================
    addInterText(cx, y, text, color, size) {
        var obj = this.add.text(cx, y, text, {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: size, fontStyle: 'bold',
            color: color,
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 230, useAdvancedWrap: true },
            align: 'center',
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);
        this.interactionGroup.push(obj);
        return obj;
    }

    createInterButton(cx, cy, label, callback) {
        var C = this._C;
        var bw = 120, bh = 26;
        var gfx = this.add.graphics().setDepth(11);
        gfx.fillStyle(C.MED_BLUE, 0.85);
        gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        gfx.lineStyle(1, C.CYAN, 0.6);
        gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        this.interactionGroup.push(gfx);

        var lbl = this.add.text(cx, cy, label, {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '11px', fontStyle: 'bold', color: '#fff1e8',
            stroke: '#000000', strokeThickness: 2, rtl: this.isRTL
        }).setOrigin(0.5).setDepth(12);
        this.interactionGroup.push(lbl);

        var zone = this.add.zone(cx, cy, bw, bh)
            .setInteractive({ useHandCursor: true }).setDepth(13);
        this.interactionGroup.push(zone);

        zone.on('pointerover', function() {
            gfx.clear();
            gfx.fillStyle(C.MED_BLUE, 1);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
            gfx.lineStyle(2, C.CYAN, 1);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        });
        zone.on('pointerout', function() {
            gfx.clear();
            gfx.fillStyle(C.MED_BLUE, 0.85);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
            gfx.lineStyle(1, C.CYAN, 0.6);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        });
        zone.on('pointerdown', function() {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            if (callback) callback();
        });

        return { gfx: gfx, label: lbl, zone: zone };
    }

    createBackButton() {
        var self = this;
        var t = this.t;
        var btn = this.add.image(50, this.H - 25, 'btn_small')
            .setInteractive({ useHandCursor: true }).setScale(0.7).setDepth(40);
        this.add.text(50, this.H - 25, '\u2190 ' + (t('back_btn') || 'Back'), {
            fontFamily: this.fontFamily + ', monospace', fontSize: '13px', color: '#aaaacc', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(40);
        btn.on('pointerdown', function() {
            if (window.AudioManager) window.AudioManager.playSFX('door_open');
            self.cameras.main.fadeOut(400, 0, 0, 10);
            self.time.delayedCall(400, function() { self.scene.start('ShipHub'); });
        });
    }

    showTypewriterDialog(npc, fullText, onComplete) {
        var w = this.W, h = this.H;
        var isRTL = this.isRTL;
        var fontFamily = this.fontFamily;
        var self = this;

        var dialogH = 80;
        var dialogW = Math.floor(w * 0.94);
        var dialogX = Math.floor((w - dialogW) / 2);
        var dialogY = 6;

        var panel = this.add.graphics().setDepth(50);
        panel.fillStyle(0x0a1628, 0.95);
        panel.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 8);
        panel.lineStyle(1, 0xffa300, 0.5);
        panel.strokeRoundedRect(dialogX, dialogY, dialogW, dialogH, 8);

        var avatarKey = 'avatar_' + npc;
        var avatarX = isRTL ? dialogX + dialogW - 30 : dialogX + 30;
        var avatar = this.add.image(avatarX, dialogY + dialogH / 2, avatarKey).setScale(0.6).setDepth(51);

        var names = { magneta: 'magneta_name', captain: 'captain_name', navi: 'navi_name', geo: 'geo_name' };
        var nameText = window.I18N ? window.I18N.t(names[npc]) : npc;
        if (isRTL && window.I18N) nameText = window.I18N.fixRTL(nameText);

        var nameDisplay = this.add.text(
            isRTL ? avatarX - 40 : avatarX + 40,
            dialogY + 8, nameText, {
                fontFamily: fontFamily + ', monospace',
                fontSize: '16px', fontStyle: 'bold', color: '#ffa300',
                stroke: '#000000', strokeThickness: 3, rtl: isRTL
            }
        ).setOrigin(isRTL ? 1 : 0, 0).setDepth(51);

        var textX = isRTL ? dialogX + dialogW - 70 : dialogX + 70;
        var dialogTextObj = this.add.text(textX, dialogY + 30, '', {
            fontFamily: fontFamily + ', monospace',
            fontSize: '14px', color: '#ccddee',
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 900, useAdvancedWrap: true },
            lineSpacing: 3, align: isRTL ? 'right' : 'left', rtl: isRTL
        }).setOrigin(isRTL ? 1 : 0, 0).setDepth(51);

        var charIndex = 0;
        var typeTimer = this.time.addEvent({
            delay: 30,
            repeat: fullText.length - 1,
            callback: function() {
                charIndex++;
                dialogTextObj.setText(fullText.substring(0, charIndex));
                if (charIndex % 3 === 0 && window.AudioManager) window.AudioManager.playSFX('typekey');
            }
        });

        var allElements = [panel, avatar, nameDisplay, dialogTextObj];
        var totalTypeTime = fullText.length * 30;

        this.time.delayedCall(totalTypeTime + 3000, function() {
            self.tweens.add({
                targets: allElements, alpha: 0, duration: 400,
                onComplete: function() {
                    allElements.forEach(function(el) { if (el.active) el.destroy(); });
                    if (onComplete) onComplete();
                }
            });
        });

        panel.setInteractive(new Phaser.Geom.Rectangle(dialogX, dialogY, dialogW, dialogH), Phaser.Geom.Rectangle.Contains);
        panel.on('pointerdown', function() {
            if (charIndex < fullText.length) {
                typeTimer.remove();
                charIndex = fullText.length;
                dialogTextObj.setText(fullText);
            } else {
                allElements.forEach(function(el) { if (el.active) el.destroy(); });
                if (onComplete) { onComplete(); onComplete = null; }
            }
        });

        if (window.AudioManager) window.AudioManager.playSFX('page_turn');
    }

    // ==========================================
    // UPDATE — compass spin
    // ==========================================
    update(time, delta) {
        if (this.compassSpinning) {
            // Wild spinning with jitter
            this.compassAngle += delta * 0.3 + Math.sin(time * 0.003) * 4;
            this.compassAngle = this.compassAngle % 360;
            this.drawCompassNeedle(this.compassAngle);
            var deg = Math.floor(this.compassAngle % 360);
            this.headingDisplay.setText(deg + '°');
            // Update main angle text
            if (this.mainAngleText) {
                this.mainAngleText.setText((this.t('bridge_current_angle') || 'Current') + ': ' + deg + '°');
            }
        } else {
            // Compass stopped — show green
            if (this.mainAngleText && this.mainAngleText.style.color !== '#00e436') {
                this.mainAngleText.setColor('#00e436');
                this.mainAngleText.setText((this.t('bridge_current_angle') || 'Current') + ': 0°');
            }
            if (this.mainTargetText && this.mainTargetText.style.color !== '#00e436') {
                this.mainTargetText.setColor('#00e436');
            }
        }
    }
}

window.BridgeScene = BridgeScene;
