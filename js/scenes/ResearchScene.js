/**
 * ResearchScene - Act 3: Earth's Interior & Magnetic Field
 * 4 sequential stations: Layers → Dynamo → Timeline → Mars
 * Typewriter dialog, consistent panel styling.
 */
class ResearchScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Research' });
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
            window.AudioManager.playMusic('tension');
        }

        // === CONSTANTS ===
        this._C = {
            DEEP_NAVY: 0x0d1b2a, DARK_BLUE: 0x1b2838, MED_BLUE: 0x2d4a6a,
            CYAN: 0x53d8fb, WHITE: 0xfff1e8, RED: 0xff004d,
            GREEN: 0x00e436, ORANGE: 0xffa300, YELLOW: 0xffec27, BROWN: 0xab5236
        };

        // === STATE ===
        this.currentStation = 0; // 0=layers, 1=dynamo, 2=timeline, 3=mars
        this.stationComplete = [false, false, false, false];
        this.exploredLayers = { crust: false, mantle: false, outer_core: false, inner_core: false };
        this.dynamoToggled = false;
        this.timelineAnswer = null;
        this.marsToggled = false;
        this.stationGroup = []; // elements to destroy on station change

        // === BACKGROUND ===
        if (this.textures.exists('bg_research')) {
            this.add.image(0, 0, 'bg_research').setOrigin(0, 0).setDisplaySize(w, h).setDepth(0);
        } else {
            var bg = this.add.graphics().setDepth(0);
            bg.fillStyle(this._C.DEEP_NAVY, 1); bg.fillRect(0, 0, w, h);
        }

        // === BACK BUTTON ===
        this.createBackButton();

        // === STATION PROGRESS BAR (top) ===
        this.createProgressBar();

        // === START STATION 1 ===
        this.cameras.main.fadeIn(500, 0, 5, 20);

        // Quest system
        if (window.QuestSystem) {
            var lq = window.QuestSystem.getQuest('layers');
            if (lq && lq.status === 'available') window.QuestSystem.acceptQuest('layers');
        }

        // Opening dialog
        this.time.delayedCall(600, function() {
            self.showTypewriterDialog('geo',
                t('geo_intro') || 'Welcome to the Research Center. Let\'s explore what lies beneath our feet.',
                function() {
                    self.showStation(0);
                });
        });
    }

    // ==========================================
    // PROGRESS BAR — 4 station indicators
    // ==========================================
    createProgressBar() {
        var t = this.t;
        var stationNames = [
            t('res_station_layers') || 'Layers',
            t('res_station_dynamo') || 'Dynamo',
            t('res_station_timeline') || 'Timeline',
            t('res_station_mars') || 'Mars'
        ];
        this.progressGfx = this.add.graphics().setDepth(40);
        this.progressLabels = [];
        var barY = 8;
        var barW = 160;
        var startX = (this.W - barW * 4 - 30) / 2;

        for (var i = 0; i < 4; i++) {
            var x = startX + i * (barW + 10);
            var label = this.add.text(x + barW / 2, barY + 10, stationNames[i], {
                fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
                fontSize: '9px',
                color: i === 0 ? '#53d8fb' : '#5f574f',
                stroke: '#000000',
                strokeThickness: 2,
                rtl: this.isRTL
            }).setOrigin(0.5).setDepth(41);
            this.progressLabels.push(label);
        }
        this.updateProgressBar();
    }

    updateProgressBar() {
        var g = this.progressGfx;
        g.clear();
        var barY = 4;
        var barW = 160;
        var startX = (this.W - barW * 4 - 30) / 2;

        for (var i = 0; i < 4; i++) {
            var x = startX + i * (barW + 10);
            var active = i === this.currentStation;
            var done = this.stationComplete[i];
            var locked = i > this.currentStation && !done;

            g.fillStyle(this._C.DEEP_NAVY, 0.9);
            g.fillRoundedRect(x, barY, barW, 22, 4);

            if (done) {
                g.lineStyle(1, this._C.GREEN, 0.7);
            } else if (active) {
                g.lineStyle(1, this._C.CYAN, 0.7);
            } else {
                g.lineStyle(1, this._C.DARK_BLUE, 0.4);
            }
            g.strokeRoundedRect(x, barY, barW, 22, 4);

            // Status dot
            var dotX = x + 10;
            var dotColor = done ? this._C.GREEN : (active ? this._C.CYAN : 0x5f574f);
            g.fillStyle(dotColor, done || active ? 1 : 0.4);
            g.fillCircle(dotX, barY + 11, 3);

            if (this.progressLabels[i]) {
                this.progressLabels[i].setColor(done ? '#00e436' : (active ? '#53d8fb' : '#5f574f'));
            }

            // Connector line between stations
            if (i < 3) {
                var lineColor = this.stationComplete[i] ? this._C.GREEN : this._C.DARK_BLUE;
                g.fillStyle(lineColor, this.stationComplete[i] ? 0.5 : 0.2);
                g.fillRect(x + barW, barY + 10, 10, 2);
            }
        }
    }

    // ==========================================
    // SHOW STATION — clear previous, build new
    // ==========================================
    showStation(index) {
        // Kill all tweens on previous station elements, then destroy them
        var self = this;
        this.stationGroup.forEach(function(el) {
            if (el) {
                self.tweens.killTweensOf(el);
                if (el.destroy) el.destroy();
            }
        });
        this.stationGroup = [];
        // Also kill dynamo orbit dot tweens if they exist
        if (this.dynamoOrbitDots) {
            this.dynamoOrbitDots.forEach(function(d) { self.tweens.killTweensOf(d); });
            this.dynamoOrbitDots = null;
        }
        this.currentStation = index;
        this.updateProgressBar();

        switch (index) {
            case 0: this.buildStation1_Layers(); break;
            case 1: this.buildStation2_Dynamo(); break;
            case 2: this.buildStation3_Timeline(); break;
            case 3: this.buildStation4_Mars(); break;
        }
    }

    advanceStation() {
        this.stationComplete[this.currentStation] = true;
        this.updateProgressBar();

        if (window.AudioManager) window.AudioManager.playSFX('discovery');
        this.cameras.main.flash(200, 0, 60, 30);

        var next = this.currentStation + 1;
        var self = this;
        if (next < 4) {
            this.time.delayedCall(800, function() {
                self.showStation(next);
            });
        } else {
            this.onAllComplete();
        }
    }

    // ==========================================
    // STATION 1: EARTH LAYERS
    // ==========================================
    buildStation1_Layers() {
        var self = this;
        var t = this.t;
        var cx = this.W / 2, cy = 220;
        var R = 130; // large earth diagram

        // Panel frame
        var panel = this.addPanel(cx - 200, 60, 400, 320, t('res_station_layers') || 'Earth Layers');

        // Draw Earth cross-section
        var earthGfx = this.add.graphics().setDepth(11);
        this.stationGroup.push(earthGfx);

        var layers = [
            { key: 'inner_core', r: R * 0.2, color: 0xffec27, label: t('earth_inner_core') || 'Inner Core' },
            { key: 'outer_core', r: R * 0.42, color: 0xffa300, label: t('earth_outer_core') || 'Outer Core' },
            { key: 'mantle', r: R * 0.72, color: 0xab5236, label: t('earth_mantle') || 'Mantle' },
            { key: 'crust', r: R, color: 0x5f574f, label: t('earth_crust') || 'Crust' }
        ];

        // Draw from outside in with bright colored outlines (3px stroke)
        for (var i = layers.length - 1; i >= 0; i--) {
            earthGfx.fillStyle(layers[i].color, 0.7);
            earthGfx.fillCircle(cx, cy, layers[i].r);
            earthGfx.lineStyle(3, layers[i].color, 0.9);
            earthGfx.strokeCircle(cx, cy, layers[i].r);
        }

        // Instruction text
        var instrText = this.add.text(cx, 82, t('res_layers_instruction') || 'Click each layer to learn about it', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '12px', color: '#ffec27',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 700, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(instrText);

        // Progress counter [0/4]
        this.layerProgressText = this.add.text(cx, 356, '[0/4]', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '12px', fontStyle: 'bold', color: '#53d8fb',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(this.layerProgressText);

        // Completion message (hidden)
        this.layerCompleteMsg = this.add.text(cx, 356, '', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '12px', fontStyle: 'bold', color: '#00e436',
            wordWrap: { width: 700, useAdvancedWrap: true }, align: 'center',
            stroke: '#000000', strokeThickness: 3,
            rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11).setVisible(false);
        this.stationGroup.push(this.layerCompleteMsg);

        // Layer labels + click zones
        var labelPositions = [
            { x: cx, y: cy, key: 'inner_core' },           // center
            { x: cx + R * 0.32, y: cy - R * 0.1, key: 'outer_core' },
            { x: cx + R * 0.58, y: cy + R * 0.2, key: 'mantle' },
            { x: cx - R * 0.1, y: cy - R * 0.85, key: 'crust' }
        ];

        layers.forEach(function(layer, li) {
            var lp = labelPositions[li];

            // Clickable zone
            var zone = self.add.zone(lp.x, lp.y, layer.r * 0.6 + 30, layer.r * 0.6 + 30)
                .setInteractive({ useHandCursor: true }).setDepth(12);
            self.stationGroup.push(zone);

            // Label
            var lbl = self.add.text(lp.x, lp.y + (li === 3 ? 0 : 15), layer.label, {
                fontFamily: self.fontFamily + ', monospace',
                fontSize: '10px',
                color: '#fff1e8',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: 200, useAdvancedWrap: true },
                align: 'center', rtl: self.isRTL
            }).setOrigin(0.5).setDepth(12);
            self.stationGroup.push(lbl);

            // Check mark (hidden initially)
            var check = self.add.text(lp.x + 20, lp.y - 5, '✓', {
                fontFamily: 'monospace', fontSize: '14px', color: '#00e436'
            }).setOrigin(0.5).setDepth(12).setVisible(false);
            self.stationGroup.push(check);

            zone.on('pointerdown', function() {
                if (self.exploredLayers[layer.key]) return;
                self.exploredLayers[layer.key] = true;
                check.setVisible(true);
                if (window.AudioManager) window.AudioManager.playSFX('click');

                // Highlight ring
                earthGfx.lineStyle(2, 0x00e436, 0.8);
                earthGfx.strokeCircle(cx, cy, layer.r);

                // Quest
                if (window.QuestSystem) {
                    var lq = window.QuestSystem.getQuest('layers');
                    if (lq && lq.status === 'available') window.QuestSystem.acceptQuest('layers');
                    window.QuestSystem.completeObjective('layers', 'explore_' + layer.key);
                }

                // Dr. Geo speaks about this layer
                var layerDescs = {
                    inner_core: t('earth_inner_core_desc') || 'Solid iron ball. Its growth drives convection.',
                    outer_core: t('earth_outer_core_desc') || 'Liquid iron! Convection here generates the magnetic field.',
                    mantle: t('earth_mantle_desc') || 'Slowly flowing rock. Transfers heat from core to surface.',
                    crust: t('earth_crust_desc') || 'The thin rocky shell we live on. 0-70 km deep.'
                };
                self.showTypewriterDialog('geo', layerDescs[layer.key]);

                // Update progress counter
                var count = Object.values(self.exploredLayers).filter(function(v) { return v; }).length;
                if (self.layerProgressText) self.layerProgressText.setText('[' + count + '/4]');

                // Check if all explored
                var allDone = count === 4;
                if (allDone) {
                    // Show completion message
                    if (self.layerProgressText) self.layerProgressText.setVisible(false);
                    if (self.layerCompleteMsg) {
                        self.layerCompleteMsg.setText(t('res_layers_complete') || '✓ Stage 1 complete — click Dynamo to continue');
                        self.layerCompleteMsg.setVisible(true);
                    }
                    self.time.delayedCall(2500, function() {
                        self.advanceStation();
                    });
                }
            });
        });
    }

    // ==========================================
    // STATION 2: DYNAMO (sci-fi diagram style, cyan on dark blue)
    // ==========================================
    buildStation2_Dynamo() {
        var self = this;
        var t = this.t;
        var cx = this.W / 2, cy = 210;
        var coreR = 70;
        var C = this._C;

        // Panel bounds for clipping
        var panelX = cx - 220, panelY = 60, panelW = 440, panelH = 320;
        var panel = this.addPanel(panelX, panelY, panelW, panelH, t('res_station_dynamo') || 'The Geodynamo');

        // Graphics mask to clip dynamo visuals inside the panel
        var maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4, 6);
        var panelMask = maskShape.createGeometryMask();

        // Quest
        if (window.QuestSystem) {
            var dq = window.QuestSystem.getQuest('dynamo');
            if (dq && dq.status === 'available') window.QuestSystem.acceptQuest('dynamo');
        }

        // Description (WHITE text)
        var desc = this.add.text(cx, 95, t('dynamo_explain') || 'Liquid iron flows + Earth\'s rotation = Electric currents = Magnetic field', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '11px', color: '#fff1e8',
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 380, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(desc);

        // Outer core circle — draw at origin (0,0) and position at (cx,cy) so rotation works
        var coreGfx = this.add.graphics().setDepth(11).setMask(panelMask);
        coreGfx.setPosition(cx, cy);
        coreGfx.fillStyle(C.MED_BLUE, 0.3);
        coreGfx.fillCircle(0, 0, coreR);
        coreGfx.lineStyle(2, C.BRIGHT_BLUE, 0.7);
        coreGfx.strokeCircle(0, 0, coreR);
        // Inner core ring
        coreGfx.fillStyle(C.DARK_BLUE, 0.8);
        coreGfx.fillCircle(0, 0, 22);
        coreGfx.lineStyle(1, C.CYAN, 0.4);
        coreGfx.strokeCircle(0, 0, 22);
        // Center dot
        coreGfx.fillStyle(C.CYAN, 0.6);
        coreGfx.fillCircle(0, 0, 4);
        // Radial spokes (visual rotation indicator)
        for (var si = 0; si < 6; si++) {
            var sa = (si / 6) * Math.PI * 2;
            coreGfx.lineStyle(1, C.CYAN, 0.15);
            coreGfx.lineBetween(Math.cos(sa) * 26, Math.sin(sa) * 26, Math.cos(sa) * (coreR - 4), Math.sin(sa) * (coreR - 4));
        }
        this.stationGroup.push(coreGfx);

        // 6 orbiting CYAN dots (3px), masked to panel
        this.dynamoOrbitDots = [];
        for (var oi = 0; oi < 6; oi++) {
            var dot = this.add.graphics().setDepth(13).setMask(panelMask);
            dot.fillStyle(C.CYAN, 1);
            dot.fillCircle(0, 0, 3);
            dot.fillStyle(C.CYAN, 0.2);
            dot.fillCircle(0, 0, 6);
            dot.setPosition(cx + Math.cos(oi * Math.PI / 3) * coreR, cy + Math.sin(oi * Math.PI / 3) * coreR);
            this.stationGroup.push(dot);
            this.dynamoOrbitDots.push(dot);

            (function(dotObj, index) {
                var startAngle = index * (Math.PI / 3);
                self.tweens.add({
                    targets: { angle: startAngle },
                    angle: startAngle + Math.PI * 2,
                    duration: 3000,
                    repeat: -1,
                    onUpdate: function(tween) {
                        var a = tween.getValue();
                        dotObj.setPosition(cx + Math.cos(a) * coreR, cy + Math.sin(a) * coreR);
                    }
                });
            })(dot, oi);
        }

        // Slow rotation on core graphics (now rotates around its own position = cx,cy)
        this.tweens.add({
            targets: coreGfx, angle: 360, duration: 10000, repeat: -1, ease: 'Linear'
        });

        // Emitter particles (CYAN tints, masked)
        this.dynamoActive = true;
        var particles = this.add.particles(cx, cy, 'particle_dot', {
            speed: { min: 10, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 0.02 },
            alpha: { start: 0.4, end: 0 },
            tint: [0x53d8fb, 0x29adff, 0x2d4a6a],
            lifespan: 1000,
            frequency: 100,
            blendMode: 'ADD',
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, coreR * 0.5),
                quantity: 10
            }
        }).setDepth(12).setMask(panelMask);
        this.stationGroup.push(particles);
        this.dynamoParticles = particles;

        // Warning text (hidden)
        var warning = this.add.text(cx, cy + coreR + 20, t('dynamo_off_warning') || '⚠ No magnetic field! Planet unprotected!', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '12px', fontStyle: 'bold', color: '#ff004d',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 400, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11).setVisible(false);
        this.stationGroup.push(warning);

        // Toggle button
        var btnY = 340;
        var btn = this.createStationButton(cx, btnY, t('dynamo_off_btn') || 'Turn Dynamo OFF', function() {
            if (self.dynamoToggled) return;
            self.dynamoActive = !self.dynamoActive;

            if (!self.dynamoActive) {
                // Stop everything
                particles.stop();
                self.dynamoOrbitDots.forEach(function(d) {
                    self.tweens.killTweensOf(d);
                    d.setAlpha(0.15);
                });
                warning.setVisible(true);
                btn.label.setText(t('dynamo_on_btn') || 'Restart Dynamo');
                self.cameras.main.shake(300, 0.008);
                if (window.AudioManager) window.AudioManager.playSFX('error');
            } else {
                // Restart everything
                particles.start();
                self.dynamoOrbitDots.forEach(function(d, i) {
                    d.setAlpha(1);
                    var startAngle = i * (Math.PI / 3);
                    self.tweens.add({
                        targets: { angle: startAngle },
                        angle: startAngle + Math.PI * 2,
                        duration: 3000,
                        repeat: -1,
                        onUpdate: function(tween) {
                            var a = tween.getValue();
                            d.setPosition(cx + Math.cos(a) * coreR, cy + Math.sin(a) * coreR);
                        }
                    });
                });
                warning.setVisible(false);
                btn.label.setText(t('dynamo_complete') || 'Dynamo Active ✓');
                btn.label.setColor('#00e436');
                btn.drawDone();
                self.dynamoToggled = true;
                if (window.AudioManager) window.AudioManager.playSFX('power_up');

                if (window.QuestSystem) {
                    window.QuestSystem.completeObjective('dynamo', 'activate_dynamo');
                }

                self.showTypewriterDialog('geo',
                    t('geo_dynamo_done') || 'The dynamo drives Earth\'s magnetic shield. Without it, we\'d be like Mars...',
                    function() { self.advanceStation(); });
            }
        });
    }

    // ==========================================
    // STATION 3: TIMELINE
    // ==========================================
    buildStation3_Timeline() {
        var self = this;
        var t = this.t;
        var w = this.W;

        var panel = this.addPanel(40, 60, w - 80, 320, t('res_station_timeline') || 'Magnetic Reversals');

        // Quest
        if (window.QuestSystem) {
            var rq = window.QuestSystem.getQuest('reversals');
            if (rq && rq.status === 'available') window.QuestSystem.acceptQuest('reversals');
        }

        // Timeline track
        var trackLeft = 80, trackRight = w - 80;
        var trackW = trackRight - trackLeft;
        var trackY = 180, trackH = 40;

        var tlGfx = this.add.graphics().setDepth(11);
        this.stationGroup.push(tlGfx);

        // Generate polarity pattern (deterministic)
        var pattern = [];
        var segments = 100;
        var polarity = true; // true=normal
        var seed = 42;
        for (var i = 0; i < segments; i++) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            var frac = i / segments;
            var flipChance = frac < 0.12 ? 0.15 : (frac < 0.3 ? 0.08 : 0.04);
            if ((seed / 0x7fffffff) < flipChance) polarity = !polarity;
            if (frac >= 0.15 && frac <= 0.21) polarity = true;
            if (frac >= 0.45 && frac <= 0.55) polarity = false;
            pattern.push(polarity);
        }

        // Draw stripe
        var segW = trackW / segments;
        for (var i = 0; i < segments; i++) {
            tlGfx.fillStyle(pattern[i] ? 0x2244aa : 0xaa2222, 0.6);
            tlGfx.fillRect(trackLeft + i * segW, trackY, segW + 1, trackH);
        }
        tlGfx.lineStyle(1, 0x53d8fb, 0.3);
        tlGfx.strokeRect(trackLeft, trackY, trackW, trackH);

        // Age labels
        var ages = ['0', '100', '200', '300', '400', '500', '600', '700', '800'];
        for (var ai = 0; ai < ages.length; ai++) {
            var ax = trackLeft + (ai / 8) * trackW;
            var al = this.add.text(ax, trackY + trackH + 8, ages[ai], {
                fontFamily: 'monospace', fontSize: '8px', color: '#5f574f'
            }).setOrigin(0.5).setDepth(11);
            this.stationGroup.push(al);
        }
        var myLabel = this.add.text(w / 2, trackY + trackH + 22, t('million_years') || 'Million years ago', {
            fontFamily: this.fontFamily + ', monospace', fontSize: '10px', color: '#5f574f', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(myLabel);

        // Legend
        var legY = trackY - 20;
        tlGfx.fillStyle(0x2244aa, 0.8); tlGfx.fillRect(trackLeft, legY, 14, 8);
        tlGfx.fillStyle(0xaa2222, 0.8); tlGfx.fillRect(trackLeft + 100, legY, 14, 8);
        var legN = this.add.text(trackLeft + 18, legY + 4, t('polarity_normal') || 'Normal', {
            fontFamily: this.fontFamily + ', monospace', fontSize: '9px', color: '#4488cc', rtl: this.isRTL
        }).setOrigin(0, 0.5).setDepth(11);
        var legR = this.add.text(trackLeft + 118, legY + 4, t('polarity_reversed') || 'Reversed', {
            fontFamily: this.fontFamily + ', monospace', fontSize: '9px', color: '#cc4444', rtl: this.isRTL
        }).setOrigin(0, 0.5).setDepth(11);
        this.stationGroup.push(legN, legR);

        // Draggable handle
        var handle = this.add.circle(trackLeft, trackY - 6, 8, 0xffec27)
            .setInteractive({ useHandCursor: true, draggable: true }).setDepth(13);
        this.stationGroup.push(handle);
        this.input.setDraggable(handle);

        // Cursor line
        var cursor = this.add.graphics().setDepth(12);
        this.stationGroup.push(cursor);

        // Info
        var info = this.add.text(w / 2, trackY + trackH + 40, '', {
            fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffcc00',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(info);

        handle.on('drag', function(pointer, dragX) {
            var clampedX = Phaser.Math.Clamp(dragX, trackLeft, trackRight);
            handle.x = clampedX;
            var frac = (clampedX - trackLeft) / trackW;
            var age = Math.round(frac * 800);
            var segIdx = Math.min(segments - 1, Math.floor(frac * segments));
            var isNormal = pattern[segIdx];

            cursor.clear();
            cursor.lineStyle(2, 0xffcc00, 0.8);
            cursor.lineBetween(clampedX, trackY - 5, clampedX, trackY + trackH + 5);

            info.setText(age + ' Ma — ' + (isNormal ? (t('polarity_normal') || 'Normal') : (t('polarity_reversed') || 'Reversed')));
            info.setColor(isNormal ? '#4488cc' : '#cc4444');

            // Quest objective
            if (window.QuestSystem) {
                window.QuestSystem.completeObjective('reversals', 'explore_timeline');
            }
        });

        // Question below timeline
        var qY = 275;
        var qText = this.add.text(w / 2, qY, t('res_timeline_question') || 'How many reversals in the last 100 million years?', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '13px', fontStyle: 'bold', color: '#ffec27',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 600, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(qText);

        // 3 answer buttons
        var answers = [
            { text: '2', correct: false },
            { text: '4', correct: true },
            { text: '6', correct: false }
        ];
        var btnStartX = w / 2 - 120;
        answers.forEach(function(ans, ai) {
            var bx = btnStartX + ai * 120;
            var btn = self.createStationButton(bx, qY + 40, ans.text, function() {
                if (self.timelineAnswer !== null) return;
                self.timelineAnswer = ans.text;

                if (ans.correct) {
                    btn.label.setColor('#00e436');
                    btn.drawDone();
                    if (window.AudioManager) window.AudioManager.playSFX('quest_complete');
                    if (window.QuestSystem) {
                        window.QuestSystem.completeObjective('reversals', 'find_reversals');
                        window.QuestSystem.completeObjective('reversals', 'find_reversals');
                        window.QuestSystem.completeObjective('reversals', 'find_reversals');
                    }
                    self.showTypewriterDialog('geo',
                        t('res_timeline_correct') || 'Correct! Earth\'s field has reversed many times. The current normal period is called the Brunhes epoch.',
                        function() { self.advanceStation(); });
                } else {
                    btn.label.setColor('#ff004d');
                    if (window.AudioManager) window.AudioManager.playSFX('error');
                    self.cameras.main.shake(200, 0.005);
                    self.timelineAnswer = null; // allow retry
                    self.time.delayedCall(500, function() {
                        btn.label.setColor('#fff1e8');
                        btn.drawNormal();
                    });
                }
            });
        });
    }

    // ==========================================
    // STATION 4: MARS COMPARISON
    // ==========================================
    buildStation4_Mars() {
        var self = this;
        var t = this.t;
        var w = this.W;

        var panel = this.addPanel(40, 60, w - 80, 320, t('res_station_mars') || 'Earth vs Mars');

        // Quest
        if (window.QuestSystem) {
            var mq = window.QuestSystem.getQuest('mars');
            if (mq && mq.status === 'available') window.QuestSystem.acceptQuest('mars');
        }

        var earthX = w * 0.3, marsX = w * 0.7, planetY = 200;
        var planetR = 60; // 120px diameter

        var gfx = this.add.graphics().setDepth(11);
        this.stationGroup.push(gfx);

        // ---- EARTH (blue, with field) ----
        gfx.fillStyle(0x29adff, 0.5);
        gfx.fillCircle(earthX, planetY, planetR);
        // Continents
        gfx.fillStyle(0x00e436, 0.25);
        gfx.fillCircle(earthX - 15, planetY - 12, 18);
        gfx.fillCircle(earthX + 20, planetY + 8, 14);
        gfx.fillCircle(earthX - 5, planetY + 22, 10);
        gfx.lineStyle(2, 0x29adff, 0.7);
        gfx.strokeCircle(earthX, planetY, planetR);

        // 3 magnetic field arc lines (cyan, pulsing)
        this.earthFieldArcs = [];
        for (var ai = 0; ai < 3; ai++) {
            var arcGfx = this.add.graphics().setDepth(12);
            var arcR = planetR + 15 + ai * 14;
            arcGfx.lineStyle(2, 0x53d8fb, 0.8);
            arcGfx.beginPath();
            arcGfx.arc(earthX, planetY, arcR, -Math.PI * 0.7 + ai * 0.15, Math.PI * 0.7 - ai * 0.15, false);
            arcGfx.strokePath();
            // Mirror arc on other side
            arcGfx.beginPath();
            arcGfx.arc(earthX, planetY, arcR, Math.PI - Math.PI * 0.7 + ai * 0.15, Math.PI + Math.PI * 0.7 - ai * 0.15, false);
            arcGfx.strokePath();
            this.stationGroup.push(arcGfx);
            this.earthFieldArcs.push(arcGfx);

            // Pulsing scale animation
            this.tweens.add({
                targets: arcGfx,
                alpha: { from: 0.8, to: 0.3 },
                duration: 1200 + ai * 300,
                yoyo: true,
                repeat: -1
            });
        }

        // ---- MARS (red, NO field) ----
        gfx.fillStyle(0xff004d, 0.4);
        gfx.fillCircle(marsX, planetY, planetR - 5);
        gfx.fillStyle(0xab5236, 0.25);
        gfx.fillCircle(marsX - 12, planetY - 8, 14);
        gfx.fillCircle(marsX + 10, planetY + 12, 10);
        gfx.lineStyle(1, 0xff004d, 0.5);
        gfx.strokeCircle(marsX, planetY, planetR - 5);

        // Labels
        var earthLabel = this.add.text(earthX, planetY - planetR - 20, t('mars_earth_label') || 'EARTH', {
            fontFamily: 'Orbitron, monospace', fontSize: '14px', fontStyle: 'bold', color: '#29adff',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 200, useAdvancedWrap: true }, align: 'center'
        }).setOrigin(0.5).setDepth(11);
        var marsLabel = this.add.text(marsX, planetY - planetR - 20, t('mars_mars_label') || 'MARS', {
            fontFamily: 'Orbitron, monospace', fontSize: '14px', fontStyle: 'bold', color: '#ff004d',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 200, useAdvancedWrap: true }, align: 'center'
        }).setOrigin(0.5).setDepth(11);
        this.stationGroup.push(earthLabel, marsLabel);

        // Stats
        var earthStats = this.add.text(earthX, planetY + planetR + 12, '25-65 μT\n' + (t('res_mars_active') || 'Active dynamo'), {
            fontFamily: this.fontFamily + ', monospace', fontSize: '11px', color: '#88ccee',
            align: 'center', stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 200, useAdvancedWrap: true }, rtl: this.isRTL
        }).setOrigin(0.5, 0).setDepth(11);
        var marsStats = this.add.text(marsX, planetY + planetR + 12, '~0.5 μT\n' + (t('res_mars_dead') || 'Dead dynamo'), {
            fontFamily: this.fontFamily + ', monospace', fontSize: '11px', color: '#cc8866',
            align: 'center', stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 200, useAdvancedWrap: true }, rtl: this.isRTL
        }).setOrigin(0.5, 0).setDepth(11);
        this.stationGroup.push(earthStats, marsStats);

        // Radiation warning (hidden)
        var radiationWarning = this.add.text(w / 2, 340,
            t('res_mars_radiation') || 'Without a magnetic field — radiation destroys the atmosphere', {
            fontFamily: this.fontFamily + ', monospace',
            fontSize: '12px', fontStyle: 'bold', color: '#ff004d',
            stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: 500, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(11).setVisible(false);
        this.stationGroup.push(radiationWarning);

        // Button: "Turn off Earth's dynamo"
        var btnY = 356;
        var btn = this.createStationButton(w / 2, btnY, t('res_mars_kill_dynamo') || 'Turn off Earth\'s dynamo', function() {
            if (self.marsToggled) return;

            // Fade out Earth's field arcs
            self.earthFieldArcs.forEach(function(arc) {
                self.tweens.killTweensOf(arc);
                self.tweens.add({
                    targets: arc,
                    alpha: 0,
                    duration: 1000
                });
            });

            // Show radiation warning
            radiationWarning.setVisible(true);
            radiationWarning.setAlpha(0);
            self.tweens.add({ targets: radiationWarning, alpha: 1, duration: 500, delay: 800 });

            self.cameras.main.shake(400, 0.01);
            if (window.AudioManager) window.AudioManager.playSFX('error');

            // After seeing the effect, auto-complete
            self.time.delayedCall(2500, function() {
                btn.label.setText(t('res_mars_complete') || 'Comparison Complete ✓');
                btn.label.setColor('#00e436');
                btn.drawDone();
                self.marsToggled = true;

                if (window.QuestSystem) {
                    window.QuestSystem.completeObjective('mars', 'compare_fields');
                    window.QuestSystem.completeObjective('mars', 'understand_why');
                }

                self.showTypewriterDialog('geo',
                    t('geo_mars_conclusion') || 'Without a dynamo, Mars lost its atmosphere to solar wind. Earth\'s magnetic field is our shield.',
                    function() { self.advanceStation(); });
            });
        });
    }

    drawFieldLines(gfx, cx, cy, r, color, alpha) {
        for (var i = 0; i < 6; i++) {
            var startAngle = (Math.PI / 7) * (i + 1);
            gfx.lineStyle(1.5, color, alpha * (0.4 + i * 0.08));
            gfx.beginPath();
            for (var s = 0; s <= 25; s++) {
                var param = (s / 25) * Math.PI;
                var fr = (r + 20) * Math.sin(startAngle) * Math.sin(param);
                var x = cx + fr * Math.cos(param) * (i < 3 ? 1 : -1) * 0.5;
                var y = cy - (r + 20) * Math.sin(startAngle) * Math.cos(param);
                if (s === 0) gfx.moveTo(x, y); else gfx.lineTo(x, y);
            }
            gfx.strokePath();
        }
    }

    // ==========================================
    // ALL COMPLETE
    // ==========================================
    onAllComplete() {
        var self = this;
        var t = this.t;

        // Advance to Act 4
        if (window.GameState) window.GameState.startAct(4);

        if (window.AudioManager) window.AudioManager.playSFX('quest_complete');
        this.cameras.main.flash(400, 0, 100, 50);

        this.time.delayedCall(800, function() {
            self.showTypewriterDialog('geo',
                t('geo_final') || 'Incredible research! Now we understand why our compass went haywire. Report to the bridge!',
                function() {
                    self.cameras.main.fadeOut(600, 0, 0, 0);
                    self.time.delayedCall(600, function() {
                        self.scene.start('ShipHub');
                    });
                });
        });
    }

    // ==========================================
    // HELPERS — panel, button, dialog, back
    // ==========================================
    addPanel(x, y, w, h, title) {
        var C = this._C;
        var g = this.add.graphics().setDepth(10);
        g.fillStyle(C.DEEP_NAVY, 0.92);
        g.fillRoundedRect(x, y, w, h, 8);
        g.lineStyle(2, C.CYAN, 0.4);
        g.strokeRoundedRect(x, y, w, h, 8);
        this.stationGroup.push(g);

        if (title) {
            var tObj = this.add.text(x + w / 2, y + 16, '[ ' + title + ' ]', {
                fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
                fontSize: '13px', fontStyle: 'bold', color: '#53d8fb',
                stroke: '#000000', strokeThickness: 2,
                wordWrap: { width: w - 20, useAdvancedWrap: true },
                align: 'center', rtl: this.isRTL
            }).setOrigin(0.5).setDepth(11);
            this.stationGroup.push(tObj);
        }
        return g;
    }

    createStationButton(cx, cy, label, callback) {
        var C = this._C;
        var bw = 180, bh = 28;
        var gfx = this.add.graphics().setDepth(20);
        var self = this;

        var drawNormal = function() {
            gfx.clear();
            gfx.fillStyle(C.MED_BLUE, 0.85);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
            gfx.lineStyle(1, C.CYAN, 0.6);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        };
        var drawDone = function() {
            gfx.clear();
            gfx.fillStyle(0x0a2a0a, 0.9);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
            gfx.lineStyle(1, C.GREEN, 0.8);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        };
        drawNormal();

        var btnLabel = this.add.text(cx, cy, label, {
            fontFamily: 'Orbitron, ' + this.fontFamily + ', monospace',
            fontSize: '12px', fontStyle: 'bold', color: '#fff1e8',
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: 170, useAdvancedWrap: true },
            align: 'center', rtl: this.isRTL
        }).setOrigin(0.5).setDepth(21);

        var zone = this.add.zone(cx, cy, bw, bh)
            .setInteractive({ useHandCursor: true }).setDepth(22);

        zone.on('pointerover', function() {
            gfx.clear();
            gfx.fillStyle(C.MED_BLUE, 1);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
            gfx.lineStyle(2, C.CYAN, 1);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 5);
        });
        zone.on('pointerout', drawNormal);
        zone.on('pointerdown', function() {
            if (window.AudioManager) window.AudioManager.playSFX('click');
            if (callback) callback();
        });

        this.stationGroup.push(gfx, btnLabel, zone);

        // Pulse glow
        this.tweens.add({
            targets: gfx,
            alpha: { from: 0.7, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        return { gfx: gfx, label: btnLabel, zone: zone, drawNormal: drawNormal, drawDone: drawDone };
    }

    showTypewriterDialog(npc, fullText, onComplete) {
        var w = this.W, h = this.H;
        var isRTL = this.isRTL;
        var fontFamily = this.fontFamily;
        var self = this;

        var dialogH = 80;
        var dialogW = Math.floor(w * 0.94);
        var dialogX = Math.floor((w - dialogW) / 2);
        var dialogY = h - dialogH - 6;

        var panel = this.add.graphics().setDepth(50);
        panel.fillStyle(0x0a1628, 0.95);
        panel.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 8);
        panel.lineStyle(1, 0x53d8fb, 0.4);
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
                fontSize: '16px', fontStyle: 'bold', color: '#00e436',
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

        // Typewriter
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
                targets: allElements,
                alpha: 0, duration: 400,
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

    update(time, delta) {
        // No per-frame updates needed
    }
}

window.ResearchScene = ResearchScene;
