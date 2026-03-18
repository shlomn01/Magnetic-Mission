/**
 * QuestLogScene - Quest Log / Research Journal overlay
 * Shows quest progress, objectives, and earned badges
 */
class QuestLogScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuestLog' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.W = w;
        this.H = h;
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Rajdhani';
        this.fontFamily = fontFamily;
        this.isRTL = window.I18N && window.I18N.isRTL();

        // Pause parent scene
        this.parentSceneKey = this.findParentScene();
        if (this.parentSceneKey) {
            this.scene.pause(this.parentSceneKey);
        }

        this.selectedAct = 1;
        this.scrollY = 0;
        this.maxScrollY = 0;

        // Dark overlay
        this.overlay = this.add.graphics().setDepth(0);
        this.overlay.fillStyle(0x000000, 0);
        this.overlay.fillRect(0, 0, w, h);

        // Fade in overlay
        this.tweens.add({
            targets: { alpha: 0 },
            alpha: 0.6,
            duration: 300,
            onUpdate: (tween) => {
                this.overlay.clear();
                this.overlay.fillStyle(0x000000, tween.getValue());
                this.overlay.fillRect(0, 0, w, h);
            }
        });

        // Click outside to close
        const outsideZone = this.add.zone(w / 2, h / 2, w, h)
            .setInteractive()
            .setDepth(0);
        outsideZone.on('pointerdown', () => {
            this.closeJournal();
        });

        // Main journal panel
        const panelW = Math.min(480, w * 0.92);
        const panelH = Math.min(520, h * 0.88);
        const panelX = w / 2 - panelW / 2;
        const panelY = h / 2 - panelH / 2;
        this.panelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

        // Panel background with journal texture
        const panelGfx = this.add.graphics().setDepth(1);

        // Outer shadow
        panelGfx.fillStyle(0x000000, 0.3);
        panelGfx.fillRoundedRect(panelX + 4, panelY + 4, panelW, panelH, 12);

        // Main panel background (dark navy with subtle texture)
        panelGfx.fillStyle(0x0a1628, 0.97);
        panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 12);

        // Subtle grid pattern overlay
        panelGfx.lineStyle(1, 0x112233, 0.15);
        for (let gx = panelX + 20; gx < panelX + panelW - 20; gx += 30) {
            panelGfx.lineBetween(gx, panelY + 10, gx, panelY + panelH - 10);
        }
        for (let gy = panelY + 20; gy < panelY + panelH - 20; gy += 30) {
            panelGfx.lineBetween(panelX + 10, gy, panelX + panelW - 10, gy);
        }

        // Border
        panelGfx.lineStyle(2, 0x00b4ff, 0.25);
        panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

        // Inner border accent
        panelGfx.lineStyle(1, 0x1a3a5c, 0.15);
        panelGfx.strokeRoundedRect(panelX + 5, panelY + 5, panelW - 10, panelH - 10, 10);

        // Spine detail (book-like)
        panelGfx.fillStyle(0x0d1f38, 0.5);
        panelGfx.fillRect(panelX + 2, panelY + 20, 5, panelH - 40);

        // Block clicks on panel from reaching the outside zone
        const panelBlockZone = this.add.zone(w / 2, h / 2, panelW, panelH)
            .setInteractive()
            .setDepth(1);
        panelBlockZone.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });

        // Journal title
        this.add.text(w / 2, panelY + 22, t('quest_log_title'), {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '16px',
            color: '#00b4ff',
            letterSpacing: 3
        }).setOrigin(0.5).setDepth(3);

        // Close button (X)
        const closeX = panelX + panelW - 24;
        const closeY = panelY + 18;

        const closeBg = this.add.graphics().setDepth(3);
        closeBg.fillStyle(0x1a2a3a, 0.6);
        closeBg.fillCircle(closeX, closeY, 14);
        closeBg.lineStyle(1, 0xff4444, 0.3);
        closeBg.strokeCircle(closeX, closeY, 14);

        const closeText = this.add.text(closeX, closeY, '\u2715', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '14px',
            color: '#ff6666'
        }).setOrigin(0.5).setDepth(4);

        const closeZone = this.add.zone(closeX, closeY, 30, 30)
            .setInteractive({ useHandCursor: true })
            .setDepth(5);

        closeZone.on('pointerover', () => {
            closeBg.clear();
            closeBg.fillStyle(0x2a1a1a, 0.8);
            closeBg.fillCircle(closeX, closeY, 14);
            closeBg.lineStyle(1, 0xff4444, 0.6);
            closeBg.strokeCircle(closeX, closeY, 14);
            closeText.setColor('#ff8888');
        });
        closeZone.on('pointerout', () => {
            closeBg.clear();
            closeBg.fillStyle(0x1a2a3a, 0.6);
            closeBg.fillCircle(closeX, closeY, 14);
            closeBg.lineStyle(1, 0xff4444, 0.3);
            closeBg.strokeCircle(closeX, closeY, 14);
            closeText.setColor('#ff6666');
        });
        closeZone.on('pointerdown', () => {
            this.closeJournal();
        });

        // Divider under title
        panelGfx.lineStyle(1, 0x1a3a5c, 0.4);
        panelGfx.lineBetween(panelX + 20, panelY + 40, panelX + panelW - 20, panelY + 40);

        // Overall progress bar
        this.createProgressBar(panelX, panelY, panelW);

        // Tab system
        this.createTabs(panelX, panelY, panelW);

        // Content area
        this.contentTop = panelY + 95;
        this.contentHeight = panelH - 200;
        this.contentLeft = panelX + 16;
        this.contentWidth = panelW - 32;

        // Mask for scrollable content
        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(this.contentLeft, this.contentTop, this.contentWidth, this.contentHeight);
        this.contentMask = maskShape.createGeometryMask();

        // Content container
        this.contentContainer = this.add.container(0, 0).setDepth(3);
        this.contentContainer.setMask(this.contentMask);

        // Badges section at bottom
        this.badgesSectionY = panelY + panelH - 90;
        panelGfx.lineStyle(1, 0x1a3a5c, 0.3);
        panelGfx.lineBetween(panelX + 20, this.badgesSectionY - 8, panelX + panelW - 20, this.badgesSectionY - 8);

        this.createBadgesPanel(panelX, panelW);

        // Load content for current tab
        this.loadQuestList(this.selectedAct);

        // Scroll with mouse wheel
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, Math.max(0, this.maxScrollY));
            this.contentContainer.y = -this.scrollY;
        });

        // Keyboard close
        this.input.keyboard.on('keydown-ESC', () => {
            this.closeJournal();
        });

        // Entrance animation
        panelGfx.setAlpha(0);
        this.tweens.add({
            targets: panelGfx,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    findParentScene() {
        const scenes = this.scene.manager.getScenes(true);
        for (const scene of scenes) {
            if (scene.scene.key !== 'QuestLog' && scene.scene.key !== 'Dialog') {
                return scene.scene.key;
            }
        }
        return null;
    }

    createProgressBar(panelX, panelY, panelW) {
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const progress = window.QuestSystem ? window.QuestSystem.getProgress() : 0;
        const barW = panelW - 100;
        const barX = panelX + 50;
        const barY = panelY + 50;

        const barGfx = this.add.graphics().setDepth(3);

        // Track
        barGfx.fillStyle(0x1a2a3a, 1);
        barGfx.fillRoundedRect(barX, barY, barW, 10, 5);

        // Fill with gradient effect
        if (progress > 0) {
            barGfx.fillStyle(0x00b4ff, 0.7);
            barGfx.fillRoundedRect(barX, barY, barW * progress, 10, 5);

            // Bright edge
            barGfx.fillStyle(0x00ddff, 0.4);
            barGfx.fillRect(barX + barW * progress - 3, barY + 1, 3, 8);
        }

        // Border
        barGfx.lineStyle(1, 0x2a4a6a, 0.4);
        barGfx.strokeRoundedRect(barX, barY, barW, 10, 5);

        // Percentage text
        this.add.text(barX + barW + 10, barY + 5, Math.round(progress * 100) + '%', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '11px',
            color: '#00b4ff'
        }).setOrigin(0, 0.5).setDepth(3);
    }

    createTabs(panelX, panelY, panelW) {
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const tabY = panelY + 70;
        const tabW = (panelW - 40) / 4;
        const tabH = 22;

        this.tabElements = [];

        for (let act = 1; act <= 4; act++) {
            const tabX = panelX + 20 + (act - 1) * tabW;
            const isActive = act === this.selectedAct;

            const tabGfx = this.add.graphics().setDepth(3);
            const drawTab = (active) => {
                tabGfx.clear();
                tabGfx.fillStyle(active ? 0x00b4ff : 0x0d1a2e, active ? 0.2 : 0.8);
                tabGfx.fillRoundedRect(tabX, tabY, tabW - 2, tabH, { tl: 6, tr: 6, bl: 0, br: 0 });
                if (active) {
                    tabGfx.lineStyle(1, 0x00b4ff, 0.5);
                    tabGfx.strokeRoundedRect(tabX, tabY, tabW - 2, tabH, { tl: 6, tr: 6, bl: 0, br: 0 });
                    // Bottom highlight
                    tabGfx.fillStyle(0x00b4ff, 0.6);
                    tabGfx.fillRect(tabX + 2, tabY + tabH - 2, tabW - 6, 2);
                } else {
                    tabGfx.lineStyle(1, 0x1a3a5c, 0.2);
                    tabGfx.strokeRoundedRect(tabX, tabY, tabW - 2, tabH, { tl: 6, tr: 6, bl: 0, br: 0 });
                }
            };
            drawTab(isActive);

            const tabLabel = this.add.text(tabX + tabW / 2 - 1, tabY + tabH / 2, t('act' + act + '_title'), {
                fontFamily: this.fontFamily + ', Rajdhani, sans-serif',
                fontSize: '11px',
                fontStyle: isActive ? 'bold' : 'normal',
                color: isActive ? '#00ddff' : '#556677'
            }).setOrigin(0.5).setDepth(4);

            const tabZone = this.add.zone(tabX + tabW / 2, tabY + tabH / 2, tabW, tabH)
                .setInteractive({ useHandCursor: true })
                .setDepth(5);

            tabZone.on('pointerdown', () => {
                if (this.selectedAct === act) return;
                this.selectedAct = act;
                this.scrollY = 0;
                this.contentContainer.y = 0;

                if (window.AudioManager) window.AudioManager.playSFX('page_turn');

                // Update all tabs
                this.tabElements.forEach(te => {
                    const active = te.act === act;
                    te.draw(active);
                    te.label.setColor(active ? '#00ddff' : '#556677');
                    te.label.setFontStyle(active ? 'bold' : 'normal');
                });

                // Reload quest list
                this.loadQuestList(act);
            });

            this.tabElements.push({
                act, gfx: tabGfx, label: tabLabel,
                draw: drawTab
            });
        }
    }

    loadQuestList(actNumber) {
        // Clear existing content
        this.contentContainer.removeAll(true);

        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const ff = this.fontFamily;
        let quests = [];

        if (window.QuestSystem) {
            quests = window.QuestSystem.getQuestsByAct(actNumber) || [];
        }

        if (quests.length === 0) {
            // No quests placeholder
            const emptyText = this.add.text(this.contentLeft + this.contentWidth / 2, this.contentTop + 50,
                t('no_quests_available'), {
                    fontFamily: ff + ', Rajdhani, sans-serif',
                    fontSize: '14px',
                    color: '#445566',
                    align: 'center'
                }).setOrigin(0.5).setDepth(4);
            this.contentContainer.add(emptyText);
            this.maxScrollY = 0;
            return;
        }

        let yOffset = this.contentTop + 8;

        quests.forEach((quest, qi) => {
            const cardH = this.createQuestCard(quest, yOffset, qi);
            yOffset += cardH + 10;
        });

        this.maxScrollY = Math.max(0, yOffset - this.contentTop - this.contentHeight);
    }

    createQuestCard(quest, y, index) {
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const ff = this.fontFamily;
        const cardX = this.contentLeft;
        const cardW = this.contentWidth;

        // Determine status colors
        const statusColors = {
            locked: { bg: 0x111820, border: 0x333333, icon: '#444444', title: '#556677' },
            available: { bg: 0x1a1a0a, border: 0xccaa00, icon: '#ffcc00', title: '#ddcc44' },
            active: { bg: 0x0a1a2a, border: 0x00b4ff, icon: '#00b4ff', title: '#00ddff' },
            completed: { bg: 0x0a1a0a, border: 0x00cc44, icon: '#00ff88', title: '#00cc66' }
        };

        const status = quest.status || 'locked';
        const colors = statusColors[status] || statusColors.locked;

        // Count objectives for height calculation
        const objectives = quest.objectives || [];
        const descLines = 1;
        const objLines = objectives.length;
        const cardH = 50 + objLines * 20 + (objLines > 0 ? 10 : 0);

        // Card background
        const cardGfx = this.add.graphics().setDepth(3);
        cardGfx.fillStyle(colors.bg, 0.8);
        cardGfx.fillRoundedRect(cardX, y, cardW, cardH, 8);
        cardGfx.lineStyle(1, colors.border, 0.4);
        cardGfx.strokeRoundedRect(cardX, y, cardW, cardH, 8);
        this.contentContainer.add(cardGfx);

        // Status indicator dot
        const dotX = cardX + 16;
        const dotY = y + 18;
        const dotGfx = this.add.graphics().setDepth(4);
        dotGfx.fillStyle(Phaser.Display.Color.HexStringToColor(colors.icon).color, 0.9);
        dotGfx.fillCircle(dotX, dotY, 6);

        if (status === 'active') {
            // Pulsing glow for active
            dotGfx.fillStyle(Phaser.Display.Color.HexStringToColor(colors.icon).color, 0.2);
            dotGfx.fillCircle(dotX, dotY, 10);
        }
        this.contentContainer.add(dotGfx);

        // Quest icon character
        const iconChars = {
            locked: '\u2716',
            available: '!',
            active: '\u25b6',
            completed: '\u2714'
        };
        const iconText = this.add.text(dotX, dotY, iconChars[status] || '?', {
            fontFamily: ff + ', monospace',
            fontSize: '8px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(5);
        this.contentContainer.add(iconText);

        // Quest title
        const titleX = this.isRTL ? cardX + cardW - 32 : cardX + 32;
        const titleKey = quest.titleKey || quest.id || 'unknown';
        const titleText = this.add.text(titleX, y + 10, t(titleKey), {
            fontFamily: ff + ', Rajdhani, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: colors.title
        }).setOrigin(this.isRTL ? 1 : 0, 0).setDepth(4);
        this.contentContainer.add(titleText);

        // Quest description
        const descKey = quest.descKey || quest.id + '_desc';
        const descText = this.add.text(titleX, y + 28, t(descKey), {
            fontFamily: ff + ', Rajdhani, sans-serif',
            fontSize: '11px',
            color: '#667788',
            wordWrap: { width: cardW - 60 }
        }).setOrigin(this.isRTL ? 1 : 0, 0).setDepth(4);
        this.contentContainer.add(descText);

        // NPC name (small, right-aligned)
        if (quest.npc) {
            const npcNameKey = quest.npc + '_name';
            const npcColors = {
                captain: '#cc8833', magneta: '#cc33cc', navi: '#33cccc', geo: '#33cc33'
            };
            const npcX = this.isRTL ? cardX + 10 : cardX + cardW - 10;
            const npcText = this.add.text(npcX, y + 10, t(npcNameKey), {
                fontFamily: ff + ', Rajdhani, sans-serif',
                fontSize: '10px',
                color: npcColors[quest.npc] || '#668899'
            }).setOrigin(this.isRTL ? 0 : 1, 0).setDepth(4);
            this.contentContainer.add(npcText);
        }

        // Objectives checklist
        if (objectives.length > 0) {
            const objStartY = y + 48;
            objectives.forEach((obj, oi) => {
                const objY = objStartY + oi * 20;
                const completed = (obj.current >= obj.target);

                // Checkbox
                const checkX = this.isRTL ? cardX + cardW - 40 : cardX + 40;
                const checkGfx = this.add.graphics().setDepth(4);

                if (completed) {
                    checkGfx.fillStyle(0x00cc44, 0.3);
                    checkGfx.fillRoundedRect(checkX - 7, objY - 7, 14, 14, 3);
                    checkGfx.lineStyle(1, 0x00cc44, 0.6);
                    checkGfx.strokeRoundedRect(checkX - 7, objY - 7, 14, 14, 3);
                } else {
                    checkGfx.fillStyle(0x1a2a3a, 0.6);
                    checkGfx.fillRoundedRect(checkX - 7, objY - 7, 14, 14, 3);
                    checkGfx.lineStyle(1, 0x334455, 0.5);
                    checkGfx.strokeRoundedRect(checkX - 7, objY - 7, 14, 14, 3);
                }
                this.contentContainer.add(checkGfx);

                // Checkmark
                const checkMark = this.add.text(checkX, objY, completed ? '\u2714' : '', {
                    fontSize: '10px',
                    color: completed ? '#00ff88' : '#334455'
                }).setOrigin(0.5).setDepth(5);
                this.contentContainer.add(checkMark);

                // Objective text
                const objLabelX = this.isRTL ? checkX - 16 : checkX + 16;
                const objLabel = obj.labelKey || obj.id || '';
                const objText = this.add.text(objLabelX, objY, t(objLabel), {
                    fontFamily: ff + ', Rajdhani, sans-serif',
                    fontSize: '11px',
                    color: completed ? '#448866' : '#778899',
                    fontStyle: completed ? 'normal' : 'normal'
                }).setOrigin(this.isRTL ? 1 : 0, 0.5).setDepth(4);

                if (completed) {
                    // Strikethrough effect for completed objectives
                    const lineGfx = this.add.graphics().setDepth(4);
                    lineGfx.lineStyle(1, 0x448866, 0.3);
                    const textW = objText.width;
                    lineGfx.lineBetween(objLabelX, objY, objLabelX + textW, objY);
                    this.contentContainer.add(lineGfx);
                }

                this.contentContainer.add(objText);
            });
        }

        return cardH;
    }

    createBadgesPanel(panelX, panelW) {
        const t = (key) => window.I18N ? window.I18N.t(key) : key;
        const ff = this.fontFamily;
        const y = this.badgesSectionY;

        // Badges title
        this.add.text(panelX + panelW / 2, y + 4, t('badges_title'), {
            fontFamily: ff + ', monospace',
            fontSize: '11px',
            color: '#ffcc00',
            letterSpacing: 2
        }).setOrigin(0.5).setDepth(3);

        const badgeNames = ['physicist', 'error_hunter', 'core_explorer', 'navigator', 'complete'];
        const earnedBadges = (window.QuestSystem && window.QuestSystem.badges) ? window.QuestSystem.badges : [];
        const spacing = (panelW - 40) / badgeNames.length;
        const badgeY = y + 40;

        badgeNames.forEach((badge, i) => {
            const bx = panelX + 20 + spacing * i + spacing / 2;
            const earned = earnedBadges.includes(badge);

            // Badge circle
            const badgeGfx = this.add.graphics().setDepth(3);

            if (earned) {
                // Glowing earned badge
                badgeGfx.fillStyle(0xffcc00, 0.12);
                badgeGfx.fillCircle(bx, badgeY, 20);
                badgeGfx.fillStyle(0xffcc00, 0.06);
                badgeGfx.fillCircle(bx, badgeY, 26);
                badgeGfx.lineStyle(2, 0xffcc00, 0.6);
                badgeGfx.strokeCircle(bx, badgeY, 18);

                // Glow animation
                this.tweens.add({
                    targets: badgeGfx,
                    alpha: { from: 0.7, to: 1 },
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    delay: i * 200
                });
            } else {
                // Grayed out
                badgeGfx.fillStyle(0x1a2a3a, 0.4);
                badgeGfx.fillCircle(bx, badgeY, 18);
                badgeGfx.lineStyle(1, 0x334455, 0.3);
                badgeGfx.strokeCircle(bx, badgeY, 18);
            }

            // Badge icon
            this.add.text(bx, badgeY, earned ? '\u2605' : '\u2606', {
                fontSize: earned ? '18px' : '16px',
                color: earned ? '#ffcc00' : '#334455'
            }).setOrigin(0.5).setDepth(4);

            // Badge name
            this.add.text(bx, badgeY + 26, t('badge_' + badge), {
                fontFamily: ff + ', Rajdhani, sans-serif',
                fontSize: '8px',
                color: earned ? '#ccaa44' : '#445566',
                align: 'center',
                wordWrap: { width: spacing - 8 }
            }).setOrigin(0.5, 0).setDepth(3);
        });
    }

    closeJournal() {
        if (this.closing) return;
        this.closing = true;

        // Fade out overlay
        this.tweens.add({
            targets: { alpha: 0.6 },
            alpha: 0,
            duration: 250,
            onUpdate: (tween) => {
                this.overlay.clear();
                this.overlay.fillStyle(0x000000, tween.getValue());
                this.overlay.fillRect(0, 0, this.W, this.H);
            },
            onComplete: () => {
                if (this.parentSceneKey) {
                    this.scene.resume(this.parentSceneKey);
                }
                this.scene.stop();
            }
        });
    }
}

window.QuestLogScene = QuestLogScene;
