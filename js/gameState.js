/**
 * GameState - Central game state: timer, evidence, progress
 */
window.GameState = {
    // Timer: 6 hours = 360 minutes of game time
    // Maps to ~90 min real time, so 1 real second = 4 game minutes...
    // Actually let's make it narrative - timer jumps at act transitions
    timeRemaining: 360, // minutes in-game
    timerRunning: false,

    // Current act
    currentAct: 0, // 0=title/intro, 1-4=acts

    // Evidence journal
    evidence: [],

    // Measurements taken in lab
    measurements: [],
    calculatedBH: null,

    // Lab assembly state
    labPartsFound: { coil: false, wires: false, battery: false },
    galvanometerAssembled: false,

    // Act 2 state
    errorsTested: { calibration: false, noise: false, displacement: false, storm: false },
    revelationReached: false,

    // Act 3 state
    layersExplored: { crust: false, mantle: false, outerCore: false, innerCore: false },
    dynamoActivated: false,
    reversalsFound: 0,
    marsCompared: false,

    // Act 4 state
    recalibrated: false,
    courseSet: false,

    // NPC relationship
    naviRespect: 0, // starts skeptical, grows

    // Dialog flags (to avoid repeating)
    dialogsSeen: {},

    // Story time jumps
    actTimeStamps: {
        1: 360, // 6:00 remaining
        2: 240, // 4:00 remaining
        3: 150, // 2:30 remaining
        4: 45   // 0:45 remaining
    },

    startAct(act) {
        this.currentAct = act;
        this.timeRemaining = this.actTimeStamps[act] || this.timeRemaining;
    },

    addEvidence(evidence) {
        if (!this.evidence.find(e => e.id === evidence.id)) {
            this.evidence.push(evidence);
            return true; // new evidence
        }
        return false;
    },

    addMeasurement(m) {
        this.measurements.push(m);
    },

    hasSeenDialog(id) {
        return !!this.dialogsSeen[id];
    },

    markDialogSeen(id) {
        this.dialogsSeen[id] = true;
    },

    formatTime() {
        const hours = Math.floor(this.timeRemaining / 60);
        const mins = this.timeRemaining % 60;
        return `${hours}:${String(mins).padStart(2, '0')}`;
    },

    reset() {
        this.timeRemaining = 360;
        this.currentAct = 0;
        this.evidence = [];
        this.measurements = [];
        this.calculatedBH = null;
        this.labPartsFound = { coil: false, wires: false, battery: false };
        this.galvanometerAssembled = false;
        this.errorsTested = { calibration: false, noise: false, displacement: false, storm: false };
        this.revelationReached = false;
        this.layersExplored = { crust: false, mantle: false, outerCore: false, innerCore: false };
        this.dynamoActivated = false;
        this.reversalsFound = 0;
        this.marsCompared = false;
        this.recalibrated = false;
        this.courseSet = false;
        this.naviRespect = 0;
        this.dialogsSeen = {};
    }
};
