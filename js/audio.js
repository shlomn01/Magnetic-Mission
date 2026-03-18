/**
 * Gentle Procedural Audio System
 * Designed for long, pleasant listening sessions.
 * All sounds synthesized via Web Audio API — no external files.
 *
 * Music uses sine waves with low-pass filtering for warm, muffled tones.
 * SFX include speech mumbles (LucasArts style), storm effects, and UI sounds.
 */
window.AudioManager = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    ambientGain: null,
    initialized: false,
    muted: false,

    // Internal state
    _currentMusicNodes: null,
    _currentMusicTrack: null,
    _activeAmbients: {},
    _musicFading: false,
    _musicBuffers: {},       // decoded AudioBuffers from MP3 files
    _musicSources: {},       // currently playing BufferSourceNodes

    // ── Helpers ──────────────────────────────────────────────────────

    /** Convert a MIDI-style note name to frequency. */
    _freq(note) {
        const notes = {
            'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31,
            'G2': 98.00, 'A2': 110.0, 'Bb2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81,
            'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.0, 'Bb3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.0, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
        };
        return notes[note] || 440;
    },

    /** Create a gain node with a given value, connected to a destination. */
    _makeGain(value, dest) {
        const g = this.ctx.createGain();
        g.gain.value = value;
        g.connect(dest);
        return g;
    },

    /** Create a triangle oscillator at a given frequency. */
    _makeTriangle(freq, dest) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(dest);
        return osc;
    },

    /** Create a sine oscillator at a given frequency. */
    _makeSine(freq, dest) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(dest);
        return osc;
    },

    /** Create a low-pass filter. */
    _makeLowPass(freq, dest) {
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = freq;
        f.Q.value = 0.7;
        f.connect(dest);
        return f;
    },

    /** Create a bandpass filter. */
    _makeBandPass(freq, Q, dest) {
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        f.Q.value = Q || 1;
        f.connect(dest);
        return f;
    },

    /** Create filtered noise: returns { node, source } where node is the gain wrapper. */
    _makeNoise(filterType, filterFreq, filterQ, volume, dest) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ || 1;

        const gain = this._makeGain(volume, dest);
        source.connect(filter);
        filter.connect(gain);

        return { source, gain, filter };
    },

    /** Safely clean up an array of audio nodes. */
    _cleanup(nodes) {
        if (!nodes) return;
        const list = Array.isArray(nodes) ? nodes : [nodes];
        list.forEach(n => {
            try {
                if (n && typeof n.stop === 'function') n.stop();
            } catch (_) { /* already stopped */ }
            try {
                if (n && typeof n.disconnect === 'function') n.disconnect();
            } catch (_) { /* already disconnected */ }
        });
    },

    // ── Core API ────────────────────────────────────────────────────

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('AudioManager: Web Audio API not supported', e);
            return;
        }

        // Master gain chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.45;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.4;
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.30;
        this.ambientGain.connect(this.masterGain);

        this.initialized = true;

        // Resume suspended context IMMEDIATELY (we're inside a user gesture)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        // Also add fallback listeners for edge cases
        var self = this;
        var resume = function () {
            if (self.ctx && self.ctx.state === 'suspended') {
                self.ctx.resume();
            }
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });

        // Auto-load MP3 music files (non-blocking, falls back to procedural if missing)
        this.loadMusicFiles({
            menu: 'assets/music/menu.mp3',
            lab: 'assets/music/lab.mp3',
            tension: 'assets/music/tension.mp3',
            ship: 'assets/music/ship.mp3'
        });
    },

    setVolume(v) {
        if (!this.initialized) return;
        this.masterGain.gain.setTargetAtTime(
            Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.02
        );
    },

    mute() {
        if (!this.initialized) return;
        this.muted = true;
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    },

    unmute() {
        if (!this.initialized) return;
        this.muted = false;
        this.masterGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.02);
    },

    // ── Music File Loading ──────────────────────────────────────────

    /**
     * Load MP3 music files. Call after init().
     * urls: { menu: 'assets/music/menu.mp3', lab: 'assets/music/lab.mp3', ... }
     */
    loadMusicFiles(urls) {
        if (!this.initialized) return;
        const self = this;
        Object.keys(urls).forEach(function (track) {
            fetch(urls[track])
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.arrayBuffer();
                })
                .then(function (buf) { return self.ctx.decodeAudioData(buf); })
                .then(function (decoded) {
                    self._musicBuffers[track] = decoded;
                    console.log('[Audio] Loaded music:', track);
                    // If this track is already playing (procedural fallback), switch to MP3
                    if (self._currentMusicTrack === track && !self._musicSources[track]) {
                        console.log('[Audio] Upgrading to MP3:', track);
                        self._fadeOutMusic(300, function () {
                            self._currentMusicTrack = track;
                            self._playMusicBuffer(track);
                        });
                    }
                })
                .catch(function () {
                    // MP3 not available — will fall back to procedural
                });
        });
    },

    // ── Music ───────────────────────────────────────────────────────

    playMusic(track) {
        if (!this.initialized) return;
        if (this._currentMusicTrack === track) return;

        const self = this;
        const startNewTrack = function () {
            self._currentMusicTrack = track;

            // Prefer loaded MP3 buffer if available
            if (self._musicBuffers[track]) {
                self._playMusicBuffer(track);
                return;
            }

            // Fall back to procedural
            const builder = self._musicTracks[track];
            if (builder) {
                self._currentMusicNodes = builder.call(self);
            } else {
                self._currentMusicNodes = null;
            }
        };

        if (this._currentMusicNodes || this._musicSources[this._currentMusicTrack]) {
            this._fadeOutMusic(500, startNewTrack);
        } else {
            startNewTrack();
        }
    },

    _playMusicBuffer(track) {
        const source = this.ctx.createBufferSource();
        source.buffer = this._musicBuffers[track];
        source.loop = true;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.5);
        gain.connect(this.musicGain);
        source.connect(gain);
        source.start(0);

        // Store so we can stop it later
        this._musicSources[track] = { source: source, gain: gain };
        // Also set _currentMusicNodes for fadeOut compatibility
        this._currentMusicNodes = {
            envelope: gain,
            all: [source, gain],
            _isBuffer: true
        };
    },

    stopMusic(fadeMs) {
        if (!this.initialized) return;
        const ms = fadeMs != null ? fadeMs : 500;
        this._fadeOutMusic(ms, () => {
            this._currentMusicTrack = null;
        });
    },

    _fadeOutMusic(ms, cb) {
        // Also stop any buffer-based music source
        var prevTrack = this._currentMusicTrack;
        if (this._musicSources[prevTrack]) {
            var src = this._musicSources[prevTrack];
            var now = this.ctx.currentTime;
            src.gain.gain.setTargetAtTime(0, now, ms / 4000);
            var self = this;
            setTimeout(function () {
                try { src.source.stop(); } catch (_) {}
                try { src.source.disconnect(); src.gain.disconnect(); } catch (_) {}
                delete self._musicSources[prevTrack];
            }, ms);
        }

        if (!this._currentMusicNodes) {
            // If we had a buffer source, still wait for fade
            if (this._musicSources[prevTrack]) {
                setTimeout(function () { if (cb) cb(); }, ms);
            } else {
                if (cb) cb();
            }
            return;
        }
        var nodes = this._currentMusicNodes;
        this._currentMusicNodes = null;

        // Clear any timers (chord progressions, pings, etc.)
        if (nodes._chordTimer) clearInterval(nodes._chordTimer);
        if (nodes._pingTimer) clearTimeout(nodes._pingTimer);

        // If this was a buffer node, it's already handled above
        if (nodes._isBuffer) {
            setTimeout(function () { if (cb) cb(); }, ms);
            return;
        }

        // Fade the envelope gain if present, otherwise just stop
        var envelope = nodes.envelope;
        if (envelope) {
            var now2 = this.ctx.currentTime;
            envelope.gain.setTargetAtTime(0, now2, ms / 4000);
            var cleanup = this._cleanup.bind(this);
            setTimeout(function () {
                cleanup(nodes.all);
                if (cb) cb();
            }, ms);
        } else {
            this._cleanup(nodes.all);
            if (cb) cb();
        }
    },

    // ── Music Track Builders ────────────────────────────────────────
    // Each returns { envelope: GainNode, all: [nodes to clean up] }

    _musicTracks: {

        /**
         * Menu: Simple C-Am-F-G chord progression.
         * One chord every 4 seconds, just root + fifth, sine waves only.
         * Low-pass at 600Hz for warm muffled sound.
         */
        menu() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.musicGain);
            env.gain.setTargetAtTime(1, t, 0.15); // quick fade in so music is heard immediately

            const lp = this._makeLowPass(600, env);

            // Chord progression: C-Am-F-G (root + fifth only)
            const chords = [
                [this._freq('C3'), this._freq('G3')],   // C
                [this._freq('A2'), this._freq('E3')],   // Am
                [this._freq('F2'), this._freq('C3')],   // F
                [this._freq('G2'), this._freq('D3')],   // G
            ];

            // Two persistent oscillators that we retune
            const osc1 = this._makeSine(chords[0][0], lp);
            const osc2 = this._makeSine(chords[0][1], lp);

            // Very slow amplitude modulation for gentle breathing
            const lfoOsc = this.ctx.createOscillator();
            lfoOsc.type = 'sine';
            lfoOsc.frequency.value = 0.04; // very slow
            const lfoAmount = this._makeGain(0.1, lp);
            lfoOsc.connect(lfoAmount);

            osc1.start(t);
            osc2.start(t);
            lfoOsc.start(t);

            let chordIndex = 0;
            const chordTimer = setInterval(() => {
                if (!this.ctx || this.ctx.state === 'closed') {
                    clearInterval(chordTimer);
                    return;
                }
                chordIndex = (chordIndex + 1) % chords.length;
                const now = this.ctx.currentTime;
                // Smooth glide to next chord
                osc1.frequency.setTargetAtTime(chords[chordIndex][0], now, 0.3);
                osc2.frequency.setTargetAtTime(chords[chordIndex][1], now, 0.3);
            }, 4000);

            return {
                envelope: env,
                all: [osc1, osc2, lfoOsc, lfoAmount, lp, env],
                _chordTimer: chordTimer
            };
        },

        /** Ship: low drone + distant ocean noise + occasional pings. */
        ship() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.musicGain);
            env.gain.setTargetAtTime(1, t, 0.5);

            // Low drone on C2
            const droneLp = this._makeLowPass(200, env);
            const droneGain = this._makeGain(0.5, droneLp);
            const drone = this._makeSine(this._freq('C2'), droneGain);
            drone.start(t);

            // Soft filtered noise layer
            const noise = this._makeNoise('bandpass', 300, 1, 0.08, env);
            noise.source.start(t);

            // Occasional pings
            const pingNotes = ['C4', 'E4', 'G4'];
            let pingTimer = null;
            const self = this;

            const schedulePing = () => {
                const delay = 8000 + Math.random() * 4000;
                pingTimer = setTimeout(() => {
                    if (!self.ctx || self.ctx.state === 'closed') return;
                    const now = self.ctx.currentTime;
                    const note = pingNotes[Math.floor(Math.random() * pingNotes.length)];
                    const pingGain = self._makeGain(0, env);
                    pingGain.gain.setTargetAtTime(0.12, now, 0.01);
                    pingGain.gain.setTargetAtTime(0, now + 0.3, 0.4);
                    const ping = self._makeSine(self._freq(note), pingGain);
                    ping.start(now);
                    ping.stop(now + 2);
                    ping.onended = () => {
                        try { ping.disconnect(); pingGain.disconnect(); } catch (_) {}
                    };
                    schedulePing();
                }, delay);
            };
            schedulePing();

            return {
                envelope: env,
                all: [drone, noise.source, noise.gain, noise.filter, droneGain, droneLp, env],
                _pingTimer: pingTimer,
            };
        },

        /**
         * Lab: soft C-minor drone, barely audible.
         * Just root + fifth of Cm, sine waves, very low-pass filtered.
         */
        lab() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.musicGain);
            env.gain.setTargetAtTime(0.6, t, 0.6); // keep it low

            const lp = this._makeLowPass(400, env);

            // C-minor drone: C + G, very deep
            const osc1 = this._makeSine(this._freq('C2'), lp);
            const osc2 = this._makeSine(this._freq('G2'), lp);

            // Very subtle Eb barely present
            const ebGain = this._makeGain(0.2, lp);
            const osc3 = this._makeSine(this._freq('Eb3'), ebGain);

            // Extremely slow breathing LFO
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.03;
            const lfoDepth = this._makeGain(0.08, env.gain);
            lfo.connect(lfoDepth);

            osc1.start(t);
            osc2.start(t);
            osc3.start(t);
            lfo.start(t);

            return {
                envelope: env,
                all: [osc1, osc2, osc3, lfo, lfoDepth, ebGain, lp, env]
            };
        },

        /**
         * Tension: low 60Hz rumble only, very quiet.
         */
        tension() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.musicGain);
            env.gain.setTargetAtTime(0.5, t, 1.0); // slow build

            const lp = this._makeLowPass(120, env);

            const osc1 = this._makeSine(60, lp);

            // Very slow tremolo for unease
            const tremGain = this.ctx.createGain();
            tremGain.gain.value = 1;
            tremGain.connect(lp);
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.2;
            const lfoDepth = this._makeGain(0.15, tremGain.gain);
            lfo.connect(lfoDepth);

            // Second harmonic very quiet
            const osc2Gain = this._makeGain(0.3, tremGain);
            const osc2 = this._makeSine(120, osc2Gain);

            lfo.start(t);
            osc1.start(t);
            osc2.start(t);

            return {
                envelope: env,
                all: [osc1, osc2, lfo, lfoDepth, tremGain, osc2Gain, lp, env]
            };
        },

        /** Discovery: quick ascending arpeggio, auto-stops. */
        discovery() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(1, this.musicGain);
            const notes = ['C4', 'E4', 'G4', 'C5'];
            const allNodes = [env];

            notes.forEach((note, i) => {
                const start = t + i * 0.18;
                const g = this._makeGain(0, env);
                g.gain.setTargetAtTime(0.5, start, 0.005);
                g.gain.setTargetAtTime(0, start + 0.25, 0.15);
                const osc = this._makeSine(this._freq(note), g);
                osc.start(start);
                osc.stop(start + 1.5);
                osc.onended = () => {
                    try { osc.disconnect(); g.disconnect(); } catch (_) {}
                };
                allNodes.push(osc, g);
            });

            // Auto-stop after 2 seconds
            setTimeout(() => {
                this._cleanup(allNodes);
                if (this._currentMusicTrack === 'discovery') {
                    this._currentMusicNodes = null;
                    this._currentMusicTrack = null;
                }
            }, 2000);

            return { envelope: env, all: allNodes };
        },

        /** Finale: warm C-major chord, gently swelling. */
        finale() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.musicGain);
            env.gain.setTargetAtTime(0.7, t, 0.8);

            // Slight swell LFO
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.08;
            const lfoDepth = this._makeGain(0.2, env.gain);
            lfo.connect(lfoDepth);

            const lp = this._makeLowPass(800, env);

            const osc1 = this._makeSine(this._freq('C3'), lp);
            const osc2 = this._makeSine(this._freq('E3'), lp);
            const osc3 = this._makeSine(this._freq('G3'), lp);
            const osc4 = this._makeSine(this._freq('C4'), lp);

            lfo.start(t);
            osc1.start(t);
            osc2.start(t);
            osc3.start(t);
            osc4.start(t);

            return {
                envelope: env,
                all: [osc1, osc2, osc3, osc4, lfo, lfoDepth, lp, env]
            };
        }
    },

    // ── Sound Effects ───────────────────────────────────────────────

    playSFX(name) {
        if (!this.initialized) return;
        // Aliases for convenience
        var aliases = { pickup: 'item_collect', success: 'success_fanfare' };
        var resolved = aliases[name] || name;
        var builder = this._sfx[resolved];
        if (!builder) {
            console.warn('AudioManager: unknown SFX', name, '(resolved:', resolved, ')');
            return;
        }
        builder.call(this);
    },

    _sfx: {

        /** Short sine pop. */
        click() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.25, t, 0.003);
            g.gain.setTargetAtTime(0, t + 0.02, 0.008);
            const osc = this._makeSine(600, g);
            osc.start(t);
            osc.stop(t + 0.1);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Tiny blip. */
        hover() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.07, t, 0.002);
            g.gain.setTargetAtTime(0, t + 0.008, 0.005);
            const osc = this._makeSine(900, g);
            osc.start(t);
            osc.stop(t + 0.06);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Three ascending notes. */
        quest_accept() {
            const t = this.ctx.currentTime;
            const notes = ['E4', 'G4', 'B4'];
            notes.forEach((note, i) => {
                const start = t + i * 0.08;
                const g = this._makeGain(0, this.sfxGain);
                g.gain.setTargetAtTime(0.17, start, 0.005);
                g.gain.setTargetAtTime(0, start + 0.06, 0.015);
                const osc = this._makeSine(this._freq(note), g);
                osc.start(start);
                osc.stop(start + 0.2);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
            });
        },

        /** Four ascending notes, slightly louder. */
        quest_complete() {
            const t = this.ctx.currentTime;
            const notes = ['C4', 'E4', 'G4', 'C5'];
            notes.forEach((note, i) => {
                const start = t + i * 0.1;
                const g = this._makeGain(0, this.sfxGain);
                g.gain.setTargetAtTime(0.22, start, 0.005);
                g.gain.setTargetAtTime(0, start + 0.08, 0.02);
                const osc = this._makeSine(this._freq(note), g);
                osc.start(start);
                osc.stop(start + 0.3);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
            });
        },

        /** Soft bloop: frequency sweep. */
        measurement() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.17, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.1, 0.03);
            const osc = this._makeSine(440, g);
            osc.frequency.linearRampToValueAtTime(660, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.3);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Low bonk with pitch drop. */
        error() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.17, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.06, 0.02);
            const osc = this._makeSine(200, g);
            osc.frequency.setTargetAtTime(140, t, 0.06);
            osc.start(t);
            osc.stop(t + 0.2);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Filtered noise burst. */
        page_turn() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.06, t, 0.003);
            g.gain.setTargetAtTime(0, t + 0.04, 0.02);

            const bufLen = Math.floor(this.ctx.sampleRate * 0.15);
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;

            const bp = this._makeBandPass(2000, 2, g);
            src.connect(bp);
            src.start(t);
            src.onended = () => { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Low filtered noise sweep. */
        door_open() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.12, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.12, 0.04);

            const bufLen = Math.floor(this.ctx.sampleRate * 0.4);
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;

            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 200;
            bp.frequency.linearRampToValueAtTime(400, t + 0.2);
            bp.Q.value = 2;
            bp.connect(g);
            src.connect(bp);
            src.start(t);
            src.onended = () => { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Bright ascending sweep + sparkle. */
        item_collect() {
            const t = this.ctx.currentTime;

            // Main sweep
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.17, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.1, 0.03);
            const osc = this._makeSine(800, g);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.3);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };

            // Sparkle: short high filtered noise
            const sg = this._makeGain(0, this.sfxGain);
            sg.gain.setTargetAtTime(0.04, t + 0.08, 0.003);
            sg.gain.setTargetAtTime(0, t + 0.12, 0.015);
            const bufLen = Math.floor(this.ctx.sampleRate * 0.1);
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 4000;
            hp.connect(sg);
            src.connect(hp);
            src.start(t + 0.08);
            src.onended = () => { try { src.disconnect(); hp.disconnect(); sg.disconnect(); } catch (_) {} };
        },

        /** Soft sweep. */
        needle_move() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.06, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.12, 0.04);
            const osc = this._makeSine(300, g);
            osc.frequency.linearRampToValueAtTime(500, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.4);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Short buzz for locked doors. */
        buzz() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.07, t, 0.005);
            g.gain.setTargetAtTime(0, t + 0.1, 0.025);
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 100;
            osc.connect(g);
            osc.start(t);
            osc.stop(t + 0.25);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Low rumble (legacy, kept for compatibility). */
        storm() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.12, t, 0.01);
            g.gain.setTargetAtTime(0, t + 0.25, 0.12);

            const noise = this._makeNoise('bandpass', 200, 0.5, 1, g);
            noise.filter.frequency.value = 100;
            noise.filter.Q.value = 0.8;
            noise.source.start(t);
            noise.source.stop(t + 0.8);
            noise.source.onended = () => {
                try { noise.source.disconnect(); noise.filter.disconnect(); noise.gain.disconnect(); g.disconnect(); } catch (_) {}
            };
        },

        /** Powerful realistic thunder: layered rumble with sub-bass boom and rolling tail. */
        thunder() {
            const t = this.ctx.currentTime;
            const ctx = this.ctx;

            // Master gain - LOUD
            const master = this._makeGain(0, this.sfxGain);
            master.gain.setTargetAtTime(0.7, t, 0.005);
            master.gain.setTargetAtTime(0.5, t + 0.3, 0.2);
            master.gain.setTargetAtTime(0, t + 0.8, 1.0); // long 3+ second tail

            // Layer 1: Sub-bass boom (30-60Hz) - the chest-shaking part
            const subGain = this._makeGain(0.8, master);
            const subLP = this._makeLowPass(80, subGain);
            const sub1 = this._makeSine(35, subLP);
            const sub2 = this._makeSine(55, subLP);
            sub1.start(t); sub1.stop(t + 3.5);
            sub2.start(t); sub2.stop(t + 3.5);

            // Layer 2: Mid rumble (80-200Hz) - the body of the thunder
            const midGain = this._makeGain(0.5, master);
            const midLP = this._makeLowPass(250, midGain);
            const mid1 = this._makeSine(90, midLP);
            const mid2 = this._makeSine(140, midLP);
            // Frequency sweep down for realism
            mid1.frequency.setValueAtTime(120, t);
            mid1.frequency.exponentialRampToValueAtTime(60, t + 2);
            mid2.frequency.setValueAtTime(180, t);
            mid2.frequency.exponentialRampToValueAtTime(80, t + 2);
            mid1.start(t); mid1.stop(t + 3.5);
            mid2.start(t); mid2.stop(t + 3.5);

            // Layer 3: Noise crackle - the crackling texture
            const noiseLen = Math.floor(ctx.sampleRate * 4);
            const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
            const noiseData = noiseBuf.getChannelData(0);
            for (let i = 0; i < noiseLen; i++) {
                // Shaped noise: louder at start, irregular bursts
                const env = Math.exp(-i / (ctx.sampleRate * 1.2));
                const burst = Math.sin(i * 0.0003) > 0.3 ? 1.5 : 0.7;
                noiseData[i] = (Math.random() * 2 - 1) * env * burst;
            }
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuf;
            const noiseBP = ctx.createBiquadFilter();
            noiseBP.type = 'bandpass';
            noiseBP.frequency.value = 150;
            noiseBP.Q.value = 0.3;
            const noiseGain = this._makeGain(0.4, master);
            noiseSrc.connect(noiseBP);
            noiseBP.connect(noiseGain);
            noiseSrc.start(t);
            noiseSrc.stop(t + 4);

            // Layer 4: Rolling echo (delayed repeat at lower volume)
            const echoDelay = ctx.createDelay(1.0);
            echoDelay.delayTime.value = 0.6;
            const echoGain = this._makeGain(0.2, master);
            master.connect(echoDelay);
            echoDelay.connect(echoGain);

            sub1.onended = () => {
                try { sub1.disconnect(); sub2.disconnect(); subLP.disconnect(); subGain.disconnect();
                    mid1.disconnect(); mid2.disconnect(); midLP.disconnect(); midGain.disconnect();
                    noiseSrc.disconnect(); noiseBP.disconnect(); noiseGain.disconnect();
                    echoDelay.disconnect(); echoGain.disconnect(); master.disconnect(); } catch (_) {}
            };
        },

        /** Powerful lightning crack: sharp initial snap + bright crackle + rumble tail. */
        lightning_crack() {
            const t = this.ctx.currentTime;
            const ctx = this.ctx;

            // Master gain
            const master = this._makeGain(0, this.sfxGain);
            master.gain.setTargetAtTime(0.8, t, 0.001);     // instant attack
            master.gain.setTargetAtTime(0.3, t + 0.05, 0.02); // quick drop
            master.gain.setTargetAtTime(0, t + 0.15, 0.15);   // fade tail

            // Layer 1: Sharp crack (white noise burst, bright)
            const crackLen = Math.floor(ctx.sampleRate * 0.08);
            const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
            const crackData = crackBuf.getChannelData(0);
            for (let i = 0; i < crackLen; i++) {
                crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
            }
            const crackSrc = ctx.createBufferSource();
            crackSrc.buffer = crackBuf;
            const crackHP = ctx.createBiquadFilter();
            crackHP.type = 'highpass'; crackHP.frequency.value = 1500; crackHP.Q.value = 0.3;
            const crackGain = this._makeGain(1.0, master);
            crackSrc.connect(crackHP); crackHP.connect(crackGain);
            crackSrc.start(t); crackSrc.stop(t + 0.08);

            // Layer 2: Sub-bass thud following the crack
            const thudGain = this._makeGain(0.6, master);
            const thudLP = this._makeLowPass(100, thudGain);
            const thud = this._makeSine(45, thudLP);
            thud.start(t + 0.01); thud.stop(t + 0.5);

            // Layer 3: Crackle tail (filtered noise, longer)
            const tailLen = Math.floor(ctx.sampleRate * 0.4);
            const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
            const tailData = tailBuf.getChannelData(0);
            for (let i = 0; i < tailLen; i++) {
                tailData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
            }
            const tailSrc = ctx.createBufferSource();
            tailSrc.buffer = tailBuf;
            const tailBP = ctx.createBiquadFilter();
            tailBP.type = 'bandpass'; tailBP.frequency.value = 3000; tailBP.Q.value = 0.5;
            const tailGain = this._makeGain(0.3, master);
            tailSrc.connect(tailBP); tailBP.connect(tailGain);
            tailSrc.start(t + 0.02); tailSrc.stop(t + 0.5);

            crackSrc.onended = () => {
                try { crackSrc.disconnect(); crackHP.disconnect(); crackGain.disconnect();
                    thud.disconnect(); thudLP.disconnect(); thudGain.disconnect();
                    tailSrc.disconnect(); tailBP.disconnect(); tailGain.disconnect();
                    master.disconnect(); } catch (_) {}
            };
        },

        /** Filtered white noise loop for heavy rain, very soft. */
        rain_heavy() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.08, t, 0.1);
            g.gain.setTargetAtTime(0, t + 2.5, 0.5);

            const noise = this._makeNoise('bandpass', 800, 0.8, 1, g);

            // Gentle amplitude variation
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.3;
            const lfoDepth = this._makeGain(0.15, noise.gain.gain);
            lfo.connect(lfoDepth);

            noise.source.start(t);
            noise.source.stop(t + 4);
            lfo.start(t);
            lfo.stop(t + 4);

            noise.source.onended = () => {
                try { noise.source.disconnect(); noise.filter.disconnect(); noise.gain.disconnect(); lfo.disconnect(); lfoDepth.disconnect(); g.disconnect(); } catch (_) {}
            };
        },

        /**
         * Hebrew-like mumble: 3-5 short sine wave "syllables" at 200-400Hz,
         * each 80-150ms with gaps. Random pitch variation each call.
         */
        speech_he() {
            const t = this.ctx.currentTime;
            const numSyllables = 3 + Math.floor(Math.random() * 3); // 3-5
            let offset = 0;

            for (let i = 0; i < numSyllables; i++) {
                const dur = 0.08 + Math.random() * 0.07; // 80-150ms
                const gap = 0.03 + Math.random() * 0.04; // 30-70ms gap
                const freq = 200 + Math.random() * 200;  // 200-400Hz
                const start = t + offset;

                const lp = this._makeLowPass(500, this.sfxGain);
                const g = this._makeGain(0, lp);
                g.gain.setTargetAtTime(0.15, start, 0.005);
                g.gain.setTargetAtTime(0, start + dur * 0.7, dur * 0.3);

                const osc = this._makeSine(freq, g);
                // Slight pitch wobble for naturalness
                osc.frequency.setTargetAtTime(freq * (0.95 + Math.random() * 0.1), start + dur * 0.3, 0.02);
                osc.start(start);
                osc.stop(start + dur + 0.05);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); lp.disconnect(); } catch (_) {} };

                offset += dur + gap;
            }
        },

        /**
         * English-like mumble: similar to Hebrew but slightly different
         * pitch range (180-350Hz) and rhythm.
         */
        speech_en() {
            const t = this.ctx.currentTime;
            const numSyllables = 3 + Math.floor(Math.random() * 3);
            let offset = 0;

            for (let i = 0; i < numSyllables; i++) {
                const dur = 0.07 + Math.random() * 0.08; // 70-150ms
                const gap = 0.02 + Math.random() * 0.05; // 20-70ms gap
                const freq = 180 + Math.random() * 170;  // 180-350Hz
                const start = t + offset;

                const lp = this._makeLowPass(450, this.sfxGain);
                const g = this._makeGain(0, lp);
                g.gain.setTargetAtTime(0.14, start, 0.004);
                g.gain.setTargetAtTime(0, start + dur * 0.6, dur * 0.4);

                const osc = this._makeSine(freq, g);
                // Downward inflection pattern (English tends to drop)
                osc.frequency.setTargetAtTime(freq * (0.9 + Math.random() * 0.1), start + dur * 0.5, 0.03);
                osc.start(start);
                osc.stop(start + dur + 0.05);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); lp.disconnect(); } catch (_) {} };

                offset += dur + gap;
            }
        },

        /**
         * Arabic-like mumble: slightly different character with
         * 220-450Hz range and wider pitch variation.
         */
        speech_ar() {
            const t = this.ctx.currentTime;
            const numSyllables = 3 + Math.floor(Math.random() * 3);
            let offset = 0;

            for (let i = 0; i < numSyllables; i++) {
                const dur = 0.09 + Math.random() * 0.06; // 90-150ms
                const gap = 0.03 + Math.random() * 0.05; // 30-80ms gap
                const freq = 220 + Math.random() * 230;  // 220-450Hz
                const start = t + offset;

                const lp = this._makeLowPass(550, this.sfxGain);
                const g = this._makeGain(0, lp);
                g.gain.setTargetAtTime(0.15, start, 0.004);
                g.gain.setTargetAtTime(0, start + dur * 0.65, dur * 0.35);

                const osc = this._makeSine(freq, g);
                // Wider pitch sweep for guttural feel
                osc.frequency.setTargetAtTime(freq * (0.85 + Math.random() * 0.3), start + dur * 0.3, 0.015);
                osc.start(start);
                osc.stop(start + dur + 0.05);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); lp.disconnect(); } catch (_) {} };

                offset += dur + gap;
            }
        },

        /** Rapid soft clicks: 5-8 per call, each 20ms, white noise at 2000Hz bandpass. */
        /** Single typewriter key click — called per character in dialog. */
        typekey() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            // Randomize pitch slightly for natural feel
            const freq = 1800 + Math.random() * 1200;
            g.gain.setTargetAtTime(0.04, t, 0.001);
            g.gain.setTargetAtTime(0, t + 0.015, 0.005);
            const bufLen = Math.floor(this.ctx.sampleRate * 0.02);
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const bp = this._makeBandPass(freq, 4, g);
            src.connect(bp);
            src.start(t);
            src.stop(t + 0.02);
            src.onended = () => { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Burst of typing clicks (5-8 keys). */
        typing() {
            const t = this.ctx.currentTime;
            const numClicks = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numClicks; i++) {
                const start = t + i * 0.06 + Math.random() * 0.02;
                const g = this._makeGain(0, this.sfxGain);
                g.gain.setTargetAtTime(0.06, start, 0.001);
                g.gain.setTargetAtTime(0, start + 0.01, 0.005);
                const bufLen = Math.floor(this.ctx.sampleRate * 0.03);
                const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                const bp = this._makeBandPass(2000, 3, g);
                src.connect(bp);
                src.start(start);
                src.stop(start + 0.03);
                src.onended = () => { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
            }
        },

        /** Smooth sine sweep from 300Hz to 150Hz over 500ms. */
        needle_swing() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.12, t, 0.01);
            g.gain.setTargetAtTime(0, t + 0.35, 0.1);

            const lp = this._makeLowPass(400, g);
            const osc = this._makeSine(300, lp);
            osc.frequency.linearRampToValueAtTime(150, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.6);
            osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Satisfying click + short rising tone (200->400Hz, 150ms). */
        assembly_click() {
            const t = this.ctx.currentTime;

            // Click part: very short sine pop
            const cg = this._makeGain(0, this.sfxGain);
            cg.gain.setTargetAtTime(0.2, t, 0.001);
            cg.gain.setTargetAtTime(0, t + 0.01, 0.005);
            const click = this._makeSine(800, cg);
            click.start(t);
            click.stop(t + 0.05);
            click.onended = () => { try { click.disconnect(); cg.disconnect(); } catch (_) {} };

            // Rising tone part
            const tg = this._makeGain(0, this.sfxGain);
            tg.gain.setTargetAtTime(0.12, t + 0.01, 0.005);
            tg.gain.setTargetAtTime(0, t + 0.12, 0.03);
            const tone = this._makeSine(200, tg);
            tone.frequency.linearRampToValueAtTime(400, t + 0.15);
            tone.start(t + 0.01);
            tone.stop(t + 0.25);
            tone.onended = () => { try { tone.disconnect(); tg.disconnect(); } catch (_) {} };
        },

        /** Simple ascending 3-note arpeggio: C-E-G, sine wave, 100ms each. */
        success_fanfare() {
            const t = this.ctx.currentTime;
            const notes = ['C4', 'E4', 'G4'];

            notes.forEach((note, i) => {
                const start = t + i * 0.12;
                const g = this._makeGain(0, this.sfxGain);
                g.gain.setTargetAtTime(0.18, start, 0.005);
                g.gain.setTargetAtTime(0, start + 0.1, 0.04);
                const osc = this._makeSine(this._freq(note), g);
                osc.start(start);
                osc.stop(start + 0.3);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
            });
        },

        /** Dramatic low build -> major chord resolve. */
        revelation() {
            const t = this.ctx.currentTime;

            // Low sine build
            const bg = this._makeGain(0, this.sfxGain);
            bg.gain.setTargetAtTime(0.15, t, 0.1);
            bg.gain.setTargetAtTime(0, t + 0.5, 0.08);
            const low = this._makeSine(100, bg);
            low.start(t);
            low.stop(t + 0.8);
            low.onended = () => { try { low.disconnect(); bg.disconnect(); } catch (_) {} };

            // Major chord resolve at t+0.5
            const chordNotes = ['C4', 'E4', 'G4'];
            chordNotes.forEach(note => {
                const cg = this._makeGain(0, this.sfxGain);
                cg.gain.setTargetAtTime(0.12, t + 0.45, 0.01);
                cg.gain.setTargetAtTime(0, t + 1.2, 0.2);
                const osc = this._makeSine(this._freq(note), cg);
                osc.start(t + 0.45);
                osc.stop(t + 2);
                osc.onended = () => { try { osc.disconnect(); cg.disconnect(); } catch (_) {} };
            });
        },

        /** Ascending power-up sweep. */
        power_up() {
            const t = this.ctx.currentTime;
            const g = this._makeGain(0, this.sfxGain);
            g.gain.setTargetAtTime(0.15, t, 0.02);
            g.gain.setTargetAtTime(0, t + 0.6, 0.1);
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.5);
            osc.connect(g);
            osc.start(t);
            osc.stop(t + 0.8);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        },

        /** Short bright discovery chime. */
        discovery() {
            const t = this.ctx.currentTime;
            const notes = [880, 1100, 1320]; // A5, ~C#6, ~E6
            notes.forEach((freq, i) => {
                const g = this._makeGain(0, this.sfxGain);
                const start = t + i * 0.06;
                g.gain.setTargetAtTime(0.1, start, 0.005);
                g.gain.setTargetAtTime(0, start + 0.15, 0.05);
                const osc = this._makeSine(freq, g);
                osc.start(start);
                osc.stop(start + 0.25);
                osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
            });
        }
    },

    // ── Ambient ─────────────────────────────────────────────────────

    startAmbient(name) {
        if (!this.initialized) return;
        if (this._activeAmbients[name]) return; // already playing

        // Aliases
        var aliases = { lab_hum: 'ship_hum' };
        var resolved = aliases[name] || name;
        var builder = this._ambientTracks[resolved];
        if (!builder) {
            console.warn('AudioManager: unknown ambient', name);
            return;
        }
        this._activeAmbients[name] = builder.call(this);
    },

    stopAmbient(name) {
        if (!this.initialized) return;
        const amb = this._activeAmbients[name];
        if (!amb) return;

        // Clear any timers
        if (amb._thunderTimer) clearTimeout(amb._thunderTimer);
        if (amb._pingTimer) clearTimeout(amb._pingTimer);

        // Fade out
        if (amb.envelope) {
            const now = this.ctx.currentTime;
            amb.envelope.gain.setTargetAtTime(0, now, 0.1);
            setTimeout(() => {
                this._cleanup(amb.all);
            }, 500);
        } else {
            this._cleanup(amb.all);
        }
        delete this._activeAmbients[name];
    },

    stopAllAmbient() {
        if (!this.initialized) return;
        Object.keys(this._activeAmbients).forEach(name => this.stopAmbient(name));
    },

    _ambientTracks: {

        /** Rain on a ship roof. */
        rain() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(1, t, 0.3);

            const noise = this._makeNoise('bandpass', 1000, 1, 1, env);

            // Slow amplitude modulation
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.15;
            const lfoDepth = this._makeGain(0.25, noise.gain.gain);
            lfo.connect(lfoDepth);

            noise.source.start(t);
            lfo.start(t);

            return {
                envelope: env,
                all: [noise.source, noise.filter, noise.gain, lfo, lfoDepth, env]
            };
        },

        /** Distant ocean waves — audible on laptop speakers. */
        ocean() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(1, t, 0.3);

            const noise = this._makeNoise('lowpass', 800, 0.6, 1, env);

            // Gentle wobble
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.07;
            const lfoDepth = this._makeGain(0.2, noise.gain.gain);
            lfo.connect(lfoDepth);

            noise.source.start(t);
            lfo.start(t);

            return {
                envelope: env,
                all: [noise.source, noise.filter, noise.gain, lfo, lfoDepth, env]
            };
        },

        /** Low ship hum — 55Hz drone, very quiet. */
        ship_hum() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(0.5, t, 0.4);

            const lp = this._makeLowPass(100, env);
            const osc1 = this._makeSine(55, lp);
            const g2 = this._makeGain(0.3, lp);
            const osc2 = this._makeSine(110, g2);

            osc1.start(t);
            osc2.start(t);

            return {
                envelope: env,
                all: [osc1, osc2, g2, lp, env]
            };
        },

        /**
         * Storm ambient: rain noise + occasional distant thunder rumble, looping.
         */
        storm() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(1, t, 0.5);

            // Rain base: filtered noise
            const rain = this._makeNoise('bandpass', 900, 1, 0.7, env);

            // Rain amplitude variation
            const rainLfo = this.ctx.createOscillator();
            rainLfo.type = 'sine';
            rainLfo.frequency.value = 0.12;
            const rainLfoDepth = this._makeGain(0.2, rain.gain.gain);
            rainLfo.connect(rainLfoDepth);

            rain.source.start(t);
            rainLfo.start(t);

            // Occasional powerful thunder rumbles
            const self = this;
            let thunderTimer = null;

            const scheduleThunder = () => {
                const delay = 6000 + Math.random() * 12000; // 6-18 seconds
                thunderTimer = setTimeout(() => {
                    if (!self.ctx || self.ctx.state === 'closed') return;
                    const now = self.ctx.currentTime;
                    const intensity = 0.4 + Math.random() * 0.4; // varies each time

                    // Thunder master gain
                    const tg = self._makeGain(0, env);
                    tg.gain.setTargetAtTime(intensity, now, 0.01);
                    tg.gain.setTargetAtTime(intensity * 0.5, now + 0.3, 0.2);
                    tg.gain.setTargetAtTime(0, now + 0.8, 0.8);

                    // Sub-bass boom
                    const subLP = self._makeLowPass(80, tg);
                    const sub = self._makeSine(35 + Math.random() * 20, subLP);
                    sub.start(now); sub.stop(now + 3);

                    // Mid rumble with sweep
                    const midLP = self._makeLowPass(200, tg);
                    const mid = self._makeSine(100 + Math.random() * 60, midLP);
                    mid.frequency.exponentialRampToValueAtTime(50, now + 2);
                    mid.start(now); mid.stop(now + 3);

                    // Noise texture
                    const nLen = Math.floor(self.ctx.sampleRate * 3);
                    const nBuf = self.ctx.createBuffer(1, nLen, self.ctx.sampleRate);
                    const nData = nBuf.getChannelData(0);
                    for (let i = 0; i < nLen; i++) {
                        nData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (self.ctx.sampleRate * 0.8));
                    }
                    const nSrc = self.ctx.createBufferSource();
                    nSrc.buffer = nBuf;
                    const nBP = self.ctx.createBiquadFilter();
                    nBP.type = 'bandpass'; nBP.frequency.value = 120; nBP.Q.value = 0.3;
                    const nGain = self._makeGain(0.25, tg);
                    nSrc.connect(nBP); nBP.connect(nGain);
                    nSrc.start(now); nSrc.stop(now + 3);

                    sub.onended = () => {
                        try { sub.disconnect(); subLP.disconnect(); mid.disconnect(); midLP.disconnect();
                            nSrc.disconnect(); nBP.disconnect(); nGain.disconnect(); tg.disconnect(); } catch (_) {}
                    };

                    scheduleThunder();
                }, delay);
            };
            scheduleThunder();

            return {
                envelope: env,
                all: [rain.source, rain.filter, rain.gain, rainLfo, rainLfoDepth, env],
                _thunderTimer: thunderTimer
            };
        },

        /** Low engine drone with slight vibration. */
        ship_engine() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(0.12, t, 0.5);

            // Low drone
            const g1 = this._makeGain(0.08, env);
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 45;
            osc1.connect(g1);
            osc1.start(t);

            // Sub-harmonic
            const g2 = this._makeGain(0.05, env);
            const osc2 = this._makeSine(90, g2);
            osc2.start(t);

            // Vibration LFO
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 3.5;
            const lfoDepth = this._makeGain(0.02, env.gain);
            lfo.connect(lfoDepth);
            lfo.start(t);

            return {
                envelope: env,
                all: [osc1, g1, osc2, g2, lfo, lfoDepth, env]
            };
        },

        /** Periodic sonar ping with ocean background. */
        sonar_ping() {
            const t = this.ctx.currentTime;
            const env = this._makeGain(0, this.ambientGain);
            env.gain.setTargetAtTime(0.08, t, 0.3);

            // Ocean base
            const noise = this._makeNoise('lowpass', 600, 1, 0.05, env);
            noise.source.start(t);

            // Periodic pings
            const self = this;
            var pingTimer;
            const schedulePing = () => {
                pingTimer = setTimeout(() => {
                    if (!self.ctx || self.ctx.state === 'closed') return;
                    const now = self.ctx.currentTime;
                    const pg = self._makeGain(0, env);
                    pg.gain.setTargetAtTime(0.15, now, 0.005);
                    pg.gain.setTargetAtTime(0, now + 0.1, 0.08);
                    const osc = self._makeSine(1200, pg);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    osc.onended = () => { try { osc.disconnect(); pg.disconnect(); } catch (_) {} };
                    schedulePing();
                }, 3000 + Math.random() * 2000);
            };
            schedulePing();

            return {
                envelope: env,
                all: [noise.source, noise.filter, noise.gain, env],
                _pingTimer: pingTimer
            };
        }
    },

    // ── Teardown ────────────────────────────────────────────────────

    destroy() {
        if (!this.initialized) return;

        // Stop music (including any timers from tracks)
        if (this._currentMusicNodes) {
            if (this._currentMusicNodes._pingTimer) {
                clearTimeout(this._currentMusicNodes._pingTimer);
            }
            if (this._currentMusicNodes._chordTimer) {
                clearInterval(this._currentMusicNodes._chordTimer);
            }
            this._cleanup(this._currentMusicNodes.all);
            this._currentMusicNodes = null;
            this._currentMusicTrack = null;
        }

        // Stop all ambients
        Object.keys(this._activeAmbients).forEach(name => {
            const amb = this._activeAmbients[name];
            if (amb._thunderTimer) clearTimeout(amb._thunderTimer);
            this._cleanup(amb.all);
        });
        this._activeAmbients = {};

        // Close context
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.close().catch(() => {});
        }

        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.initialized = false;
    }
};
