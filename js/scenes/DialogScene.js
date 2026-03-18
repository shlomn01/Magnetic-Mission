/**
 * DialogScene - Reusable RPG-style dialog overlay.
 * Runs on top of other scenes for NPC conversations.
 *
 * Launch API:
 *   this.scene.launch('Dialog', {
 *       dialogs: [
 *           { npc: 'captain', text: 'translated text here' },
 *           { npc: 'magneta', text: 'another line' },
 *           { npc: null, text: 'narration text (no portrait)' }
 *       ],
 *       onComplete: () => {},
 *       parentScene: 'Lab'
 *   });
 *
 * Legacy single-NPC API (backwards compatible):
 *   this.scene.launch('Dialog', {
 *       npc: 'captain',
 *       messages: ['text1', 'text2'],
 *       onComplete: () => {}
 *   });
 */
class DialogScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Dialog' });
    }

    init(data) {
        // Support both new and legacy API
        if (data.dialogs && data.dialogs.length > 0) {
            this.dialogs = data.dialogs;
        } else if (data.messages && data.messages.length > 0) {
            var npc = data.npc || 'captain';
            this.dialogs = data.messages.map(function (msg) {
                return { npc: npc, text: msg };
            });
        } else {
            this.dialogs = [{ npc: null, text: '...' }];
        }

        this.onCompleteCallback = data.onComplete || null;
        this.explicitParent = data.parentScene || null;
        this.currentIndex = 0;
        this.typewriterActive = false;
        this.textComplete = false;
        this.closing = false;
    }

    create() {
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        this.W = w;
        this.H = h;
        this.isRTL = window.I18N && window.I18N.isRTL();
        this.fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';

        // Pause parent scene
        this.parentSceneKey = this.explicitParent || this.findParentScene();
        if (this.parentSceneKey) {
            this.scene.pause(this.parentSceneKey);
        }

        // NPC config - prefer Aseprite sprites, fallback to procedural
        var _p = function(name) {
            var sprKey = 'spr_portrait_' + name;
            return this.textures.exists(sprKey) ? sprKey : 'portrait_' + name;
        }.bind(this);
        this.npcConfig = {
            captain:  { color: 0xffa300, colorStr: '#ffa300', portrait: _p('captain'), nameKey: 'captain_name' },
            magneta:  { color: 0xff77a8, colorStr: '#ff77a8', portrait: _p('magneta'), nameKey: 'magneta_name' },
            navi:     { color: 0x29adff, colorStr: '#29adff', portrait: _p('navi'),    nameKey: 'navi_name' },
            geo:      { color: 0x00e436, colorStr: '#00e436', portrait: _p('geo'),     nameKey: 'geo_name' }
        };

        // ── Semi-transparent overlay (upper half) ──
        this.overlay = this.add.rectangle(w / 2, h / 4, w, h / 2, 0x000000, 0)
            .setOrigin(0.5, 0.5)
            .setDepth(0);
        this.tweens.add({
            targets: this.overlay,
            fillAlpha: 0.25,
            duration: 200
        });

        // ── Dialog box at bottom ──
        var boxH = 100;
        var boxY = h - boxH;
        this.boxY = boxY;
        this.boxH = boxH;
        this.boxW = w;

        // Draw dialog box (pixel art double border)
        this.boxGfx = this.add.graphics().setDepth(1);
        this.drawDialogBox();

        // ── Portrait image (will be set per dialog) ──
        this.portraitImg = this.add.image(0, 0, 'portrait_captain')
            .setScale(3)
            .setDepth(3)
            .setVisible(false);

        // Portrait breathing tween
        this.breathTween = null;

        // ── NPC name text ──
        var nameSize = (this.fontFamily === 'Press Start 2P') ? '12px' : '16px';
        var rtlProp = this.isRTL ? { rtl: true } : {};
        this.nameText = this.add.text(0, 0, '', Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: nameSize,
            color: '#ffa300'
        }, rtlProp)).setDepth(4).setVisible(false);

        // ── Dialog text ──
        var textFontSize = (this.fontFamily === 'Press Start 2P') ? '12px' : '16px';
        this.dialogText = this.add.text(0, 0, '', Object.assign({
            fontFamily: this.fontFamily + ', monospace',
            fontSize: textFontSize,
            color: '#fff1e8',
            wordWrap: { width: 700, useAdvancedWrap: true },
            lineSpacing: 8,
            align: this.isRTL ? 'right' : 'left'
        }, rtlProp)).setDepth(4);

        // ── Continue triangle indicator ──
        this.continueTriangle = this.add.text(0, 0, '\u25BC', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '8px',
            color: '#fff1e8'
        }).setDepth(5).setAlpha(0);

        // Blink the triangle
        this.tweens.add({
            targets: this.continueTriangle,
            alpha: 0,
            duration: 400,
            yoyo: true,
            repeat: -1,
            delay: 200
        });

        // ── Click / keyboard input ──
        this.clickZone = this.add.zone(w / 2, h / 2, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        var self = this;
        this.clickZone.on('pointerdown', function () { self.handleInput(); });
        this.input.keyboard.on('keydown-SPACE', function () { self.handleInput(); });
        this.input.keyboard.on('keydown-ENTER', function () { self.handleInput(); });

        // ── Show first dialog ──
        this.showDialog(0);
    }

    // ── Draw the pixel-art dialog box ──
    drawDialogBox() {
        var g = this.boxGfx;
        var w = this.W;
        var boxY = this.boxY;
        var boxH = this.boxH;

        g.clear();

        // Main fill
        g.fillStyle(0x0d1b2a, 0.95);
        g.fillRect(0, boxY, w, boxH);

        // Outer border (bright)
        g.fillStyle(0xc2c3c7, 1);
        g.fillRect(0, boxY, w, 2);          // top
        g.fillRect(0, boxY, 2, boxH);       // left
        g.fillRect(0, boxY + boxH - 2, w, 2); // bottom
        g.fillRect(w - 2, boxY, 2, boxH);   // right

        // Inner border (darker)
        g.fillStyle(0x5f574f, 1);
        g.fillRect(4, boxY + 4, w - 8, 2);
        g.fillRect(4, boxY + 4, 2, boxH - 8);
        g.fillRect(4, boxY + boxH - 6, w - 8, 2);
        g.fillRect(w - 6, boxY + 4, 2, boxH - 8);

        // Fill inside inner border
        g.fillStyle(0x1b2838, 1);
        g.fillRect(6, boxY + 6, w - 12, boxH - 12);
    }

    // ── Position elements for current NPC ──
    layoutForNPC(npcId) {
        var w = this.W;
        var boxY = this.boxY;
        var boxH = this.boxH;
        var isRTL = this.isRTL;
        var config = npcId ? this.npcConfig[npcId] : null;

        if (config) {
            // Portrait visible
            var portraitSize = 72; // 24 * 3
            var portraitPad = 20;
            var portraitX, textX, textOriginX, nameX, nameOriginX;

            if (isRTL) {
                portraitX = w - portraitPad - portraitSize / 2;
                textX = w - portraitPad - portraitSize - 16;
                nameX = textX;
                textOriginX = 1;
                nameOriginX = 1;
            } else {
                portraitX = portraitPad + portraitSize / 2;
                textX = portraitPad + portraitSize + 16;
                nameX = textX;
                textOriginX = 0;
                nameOriginX = 0;
            }

            var portraitY = boxY + boxH / 2;

            this.portraitImg.setTexture(config.portrait);
            this.portraitImg.setPosition(portraitX, portraitY);
            this.portraitImg.setVisible(true);

            // Start breathing animation
            if (this.breathTween) this.breathTween.stop();
            this.portraitImg.y = portraitY;
            this.breathTween = this.tweens.add({
                targets: this.portraitImg,
                y: portraitY - 1,
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Name
            var nameStr = window.I18N ? window.I18N.t(config.nameKey) : config.nameKey;
            if (isRTL && window.I18N && window.I18N.fixRTL) nameStr = window.I18N.fixRTL(nameStr);
            this.nameText.setText(nameStr);
            this.nameText.setColor(config.colorStr);
            this.nameText.setPosition(nameX, boxY + 12);
            this.nameText.setOrigin(nameOriginX, 0);
            this.nameText.setVisible(true);

            // Dialog text position (offset by 40px from top to avoid overlapping name)
            var textMaxW = w - portraitSize - portraitPad * 2 - 40;
            this.dialogText.setWordWrapWidth(textMaxW);
            this.dialogText.setPosition(textX, boxY + 40);
            this.dialogText.setOrigin(textOriginX, 0);
            this.dialogText.setColor('#fff1e8');
            this.dialogText.setAlign(isRTL ? 'right' : 'left');

            // Continue triangle
            this.continueTriangle.setPosition(w - 20, boxY + boxH - 16);

        } else {
            // Narration mode: no portrait, centered text
            this.portraitImg.setVisible(false);
            this.nameText.setVisible(false);

            if (this.breathTween) this.breathTween.stop();

            this.dialogText.setWordWrapWidth(w - 80);
            this.dialogText.setPosition(w / 2, boxY + boxH / 2 - 8);
            this.dialogText.setOrigin(0.5, 0.5);
            this.dialogText.setColor('#c2c3c7');
            this.dialogText.setAlign('center');

            this.continueTriangle.setPosition(w - 20, boxY + boxH - 16);
        }
    }

    // ── Show a specific dialog entry ──
    showDialog(index) {
        if (index >= this.dialogs.length) {
            this.closeDialog();
            return;
        }

        this.currentIndex = index;
        this.textComplete = false;
        this.typewriterActive = true;

        var entry = this.dialogs[index];
        var npcId = entry.npc;
        var fullText = entry.text;
        if (this.isRTL && window.I18N && window.I18N.fixRTL) {
            fullText = window.I18N.fixRTL(fullText);
        }

        // Layout for this NPC
        this.layoutForNPC(npcId);

        // Hide continue indicator
        this.continueTriangle.setAlpha(0);

        // Play page turn SFX
        try {
            if (window.AudioManager) window.AudioManager.playSFX('page_turn');
        } catch (e) { /* silent */ }

        // Typewriter effect
        this.dialogText.setText('');
        this.currentFullText = fullText;

        if (this.typewriterTimer) this.typewriterTimer.remove();

        var charIndex = 0;
        var self = this;
        this.typewriterTimer = this.time.addEvent({
            delay: 30,
            repeat: fullText.length - 1,
            callback: function () {
                charIndex++;
                self.dialogText.setText(fullText.substring(0, charIndex));
                // Play typing click every 2 characters (skip spaces)
                if (charIndex % 2 === 0 && fullText[charIndex - 1] !== ' ') {
                    try {
                        if (window.AudioManager) window.AudioManager.playSFX('typekey');
                    } catch (e) { /* silent */ }
                }
                if (charIndex >= fullText.length) {
                    self.onTypewriterDone();
                }
            }
        });
    }

    onTypewriterDone() {
        this.typewriterActive = false;
        this.textComplete = true;

        // Show continue triangle
        this.continueTriangle.setAlpha(1);
    }

    // ── Handle click/space/enter ──
    handleInput() {
        if (this.closing) return;

        if (this.typewriterActive) {
            // Skip to full text
            if (this.typewriterTimer) this.typewriterTimer.remove();
            this.dialogText.setText(this.currentFullText);
            this.onTypewriterDone();
        } else if (this.textComplete) {
            // Advance or close
            var nextIndex = this.currentIndex + 1;
            if (nextIndex >= this.dialogs.length) {
                this.closeDialog();
            } else {
                this.showDialog(nextIndex);
            }
        }
    }

    // ── Close the dialog overlay ──
    closeDialog() {
        if (this.closing) return;
        this.closing = true;

        var self = this;
        var w = this.W;
        var h = this.H;

        // Slide box down
        this.tweens.add({
            targets: [this.boxGfx, this.portraitImg, this.nameText, this.dialogText, this.continueTriangle],
            y: '+=30',
            alpha: 0,
            duration: 250,
            ease: 'Power2'
        });

        // Fade overlay
        this.tweens.add({
            targets: this.overlay,
            fillAlpha: 0,
            duration: 250,
            onComplete: function () {
                // Callback
                if (self.onCompleteCallback) {
                    self.onCompleteCallback();
                }

                // Resume parent
                if (self.parentSceneKey) {
                    self.scene.resume(self.parentSceneKey);
                }

                self.scene.stop();
            }
        });
    }

    // ── Find parent scene ──
    findParentScene() {
        var scenes = this.scene.manager.getScenes(true);
        for (var i = 0; i < scenes.length; i++) {
            var key = scenes[i].scene.key;
            if (key !== 'Dialog' && key !== 'QuestLog') {
                return key;
            }
        }
        return null;
    }
}

window.DialogScene = DialogScene;
