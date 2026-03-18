/**
 * Quest Management System for Magnetic Mission
 * A Phaser 3 educational game about Earth's magnetic field.
 *
 * Plain JavaScript — no Phaser dependency.
 * Global export: window.QuestSystem
 */

(function () {
    'use strict';

    // ---------------------------------------------------------------
    // Quest definitions
    // ---------------------------------------------------------------

    function createQuestDefinitions() {
        return [
            // ---- ACT 1 - Measurement ----
            {
                id: 'calibrate',
                act: 1,
                titleKey: 'quest_calibrate_title',
                descKey: 'quest_calibrate_desc',
                npc: 'magneta',
                room: 'lab',
                status: 'locked',
                prerequisites: [],
                objectives: [
                    { id: 'set_turns', type: 'action', target: 1, current: 0, labelKey: 'obj_set_turns' },
                    { id: 'set_radius', type: 'action', target: 1, current: 0, labelKey: 'obj_set_radius' }
                ],
                rewards: { badge: null, unlocks: ['measure'] },
                onComplete: null
            },
            {
                id: 'measure',
                act: 1,
                titleKey: 'quest_measure_title',
                descKey: 'quest_measure_desc',
                npc: 'magneta',
                room: 'lab',
                status: 'locked',
                prerequisites: ['calibrate'],
                objectives: [
                    { id: 'measurement_1', type: 'action', target: 1, current: 0, labelKey: 'obj_measurement_1' },
                    { id: 'measurement_2', type: 'action', target: 1, current: 0, labelKey: 'obj_measurement_2' },
                    { id: 'measurement_3', type: 'action', target: 1, current: 0, labelKey: 'obj_measurement_3' },
                    { id: 'measurement_4', type: 'action', target: 1, current: 0, labelKey: 'obj_measurement_4' },
                    { id: 'measurement_5', type: 'action', target: 1, current: 0, labelKey: 'obj_measurement_5' }
                ],
                rewards: { badge: null, unlocks: ['graph'] },
                onComplete: null
            },
            {
                id: 'graph',
                act: 1,
                titleKey: 'quest_graph_title',
                descKey: 'quest_graph_desc',
                npc: 'magneta',
                room: 'lab',
                status: 'locked',
                prerequisites: ['measure'],
                objectives: [
                    { id: 'plot_points', type: 'action', target: 1, current: 0, labelKey: 'obj_plot_points' },
                    { id: 'identify_line', type: 'action', target: 1, current: 0, labelKey: 'obj_identify_line' }
                ],
                rewards: { badge: null, unlocks: ['calculate'] },
                onComplete: null
            },
            {
                id: 'calculate',
                act: 1,
                titleKey: 'quest_calculate_title',
                descKey: 'quest_calculate_desc',
                npc: 'magneta',
                room: 'lab',
                status: 'locked',
                prerequisites: ['graph'],
                objectives: [
                    { id: 'find_slope', type: 'action', target: 1, current: 0, labelKey: 'obj_find_slope' },
                    { id: 'calculate_bh', type: 'action', target: 1, current: 0, labelKey: 'obj_calculate_bh' }
                ],
                rewards: { badge: 'physicist', unlocks: ['errors'] },
                onComplete: null
            },

            // ---- ACT 2 - Errors ----
            {
                id: 'errors',
                act: 2,
                titleKey: 'quest_errors_title',
                descKey: 'quest_errors_desc',
                npc: 'navi',
                room: 'navigation',
                status: 'locked',
                prerequisites: ['calculate'],
                objectives: [
                    { id: 'compare_values', type: 'action', target: 1, current: 0, labelKey: 'obj_compare_values' }
                ],
                rewards: { badge: null, unlocks: ['noise'] },
                onComplete: null
            },
            {
                id: 'noise',
                act: 2,
                titleKey: 'quest_noise_title',
                descKey: 'quest_noise_desc',
                npc: 'navi',
                room: 'navigation',
                status: 'locked',
                prerequisites: ['errors'],
                objectives: [
                    { id: 'test_calibration', type: 'action', target: 1, current: 0, labelKey: 'obj_test_calibration' },
                    { id: 'test_noise', type: 'action', target: 1, current: 0, labelKey: 'obj_test_noise' },
                    { id: 'test_displacement', type: 'action', target: 1, current: 0, labelKey: 'obj_test_displacement' },
                    { id: 'test_storm', type: 'action', target: 1, current: 0, labelKey: 'obj_test_storm' }
                ],
                rewards: { badge: null, unlocks: ['clean'] },
                onComplete: null
            },
            {
                id: 'clean',
                act: 2,
                titleKey: 'quest_clean_title',
                descKey: 'quest_clean_desc',
                npc: 'navi',
                room: 'navigation',
                status: 'locked',
                prerequisites: ['noise'],
                objectives: [
                    { id: 'apply_filter', type: 'action', target: 1, current: 0, labelKey: 'obj_apply_filter' },
                    { id: 'verify_results', type: 'action', target: 1, current: 0, labelKey: 'obj_verify_results' }
                ],
                rewards: { badge: null, unlocks: ['revelation'] },
                onComplete: null
            },
            {
                id: 'revelation',
                act: 2,
                titleKey: 'quest_revelation_title',
                descKey: 'quest_revelation_desc',
                npc: 'navi',
                room: 'navigation',
                status: 'locked',
                prerequisites: ['clean'],
                objectives: [
                    { id: 'realize_truth', type: 'action', target: 1, current: 0, labelKey: 'obj_realize_truth' }
                ],
                rewards: { badge: 'error_hunter', unlocks: ['layers'] },
                onComplete: null
            },

            // ---- ACT 3 - The Dynamo ----
            {
                id: 'layers',
                act: 3,
                titleKey: 'quest_layers_title',
                descKey: 'quest_layers_desc',
                npc: 'geo',
                room: 'research',
                status: 'locked',
                prerequisites: ['revelation'],
                objectives: [
                    { id: 'explore_crust', type: 'action', target: 1, current: 0, labelKey: 'obj_explore_crust' },
                    { id: 'explore_mantle', type: 'action', target: 1, current: 0, labelKey: 'obj_explore_mantle' },
                    { id: 'explore_outer_core', type: 'action', target: 1, current: 0, labelKey: 'obj_explore_outer_core' },
                    { id: 'explore_inner_core', type: 'action', target: 1, current: 0, labelKey: 'obj_explore_inner_core' }
                ],
                rewards: { badge: null, unlocks: ['dynamo'] },
                onComplete: null
            },
            {
                id: 'dynamo',
                act: 3,
                titleKey: 'quest_dynamo_title',
                descKey: 'quest_dynamo_desc',
                npc: 'geo',
                room: 'research',
                status: 'locked',
                prerequisites: ['layers'],
                objectives: [
                    { id: 'activate_dynamo', type: 'action', target: 1, current: 0, labelKey: 'obj_activate_dynamo' }
                ],
                rewards: { badge: null, unlocks: ['reversals'] },
                onComplete: null
            },
            {
                id: 'reversals',
                act: 3,
                titleKey: 'quest_reversals_title',
                descKey: 'quest_reversals_desc',
                npc: 'geo',
                room: 'research',
                status: 'locked',
                prerequisites: ['dynamo'],
                objectives: [
                    { id: 'explore_timeline', type: 'action', target: 1, current: 0, labelKey: 'obj_explore_timeline' },
                    { id: 'find_reversals', type: 'action', target: 3, current: 0, labelKey: 'obj_find_reversals' }
                ],
                rewards: { badge: null, unlocks: ['mars'] },
                onComplete: null
            },
            {
                id: 'mars',
                act: 3,
                titleKey: 'quest_mars_title',
                descKey: 'quest_mars_desc',
                npc: 'geo',
                room: 'research',
                status: 'locked',
                prerequisites: ['reversals'],
                objectives: [
                    { id: 'compare_fields', type: 'action', target: 1, current: 0, labelKey: 'obj_compare_fields' },
                    { id: 'understand_why', type: 'action', target: 1, current: 0, labelKey: 'obj_understand_why' }
                ],
                rewards: { badge: 'core_explorer', unlocks: ['recalibrate'] },
                onComplete: null
            },

            // ---- ACT 4 - Solution ----
            {
                id: 'recalibrate',
                act: 4,
                titleKey: 'quest_recalibrate_title',
                descKey: 'quest_recalibrate_desc',
                npc: 'captain',
                room: 'bridge',
                status: 'locked',
                prerequisites: ['mars'],
                objectives: [
                    { id: 'enter_bh', type: 'action', target: 1, current: 0, labelKey: 'obj_enter_bh' },
                    { id: 'account_for_reversal', type: 'action', target: 1, current: 0, labelKey: 'obj_account_for_reversal' }
                ],
                rewards: { badge: null, unlocks: ['navigate'] },
                onComplete: null
            },
            {
                id: 'navigate',
                act: 4,
                titleKey: 'quest_navigate_title',
                descKey: 'quest_navigate_desc',
                npc: 'captain',
                room: 'bridge',
                status: 'locked',
                prerequisites: ['recalibrate'],
                objectives: [
                    { id: 'set_course', type: 'action', target: 1, current: 0, labelKey: 'obj_set_course' }
                ],
                rewards: { badge: null, unlocks: ['home'] },
                onComplete: null
            },
            {
                id: 'home',
                act: 4,
                titleKey: 'quest_home_title',
                descKey: 'quest_home_desc',
                npc: 'captain',
                room: 'bridge',
                status: 'locked',
                prerequisites: ['navigate'],
                objectives: [
                    { id: 'review_findings', type: 'action', target: 1, current: 0, labelKey: 'obj_review_findings' }
                ],
                rewards: { badge: 'navigator', unlocks: [] },
                onComplete: null
            }
        ];
    }

    // ---------------------------------------------------------------
    // Storage key
    // ---------------------------------------------------------------

    var SAVE_KEY = 'magnetic_mission_save';

    // ---------------------------------------------------------------
    // QuestSystem
    // ---------------------------------------------------------------

    var QuestSystem = {

        /** @type {Array} All quest definitions */
        quests: [],

        /** @type {string[]} IDs of currently active quests */
        activeQuests: [],

        /** @type {string[]} IDs of completed quests */
        completedQuests: [],

        /** @type {string[]} Earned badge IDs */
        badges: [],

        /** @type {number} Current act (1-4) */
        currentAct: 1,

        /** @type {Array<{event: string, callback: function}>} Event listeners */
        listeners: [],

        // -----------------------------------------------------------
        // Initialization
        // -----------------------------------------------------------

        /**
         * Initialize the quest system. Resets all runtime state and sets
         * the first quest ('calibrate') to 'available'.
         */
        init: function () {
            this.quests = createQuestDefinitions();
            this.activeQuests = [];
            this.completedQuests = [];
            this.badges = [];
            this.currentAct = 1;
            this.listeners = [];

            // The very first quest is immediately available
            var calibrate = this.getQuest('calibrate');
            if (calibrate) {
                calibrate.status = 'available';
            }
        },

        // -----------------------------------------------------------
        // Query helpers
        // -----------------------------------------------------------

        /**
         * Get a quest by its unique ID.
         * @param {string} id
         * @returns {object|null}
         */
        getQuest: function (id) {
            for (var i = 0; i < this.quests.length; i++) {
                if (this.quests[i].id === id) {
                    return this.quests[i];
                }
            }
            return null;
        },

        /**
         * Get all quests belonging to a specific act.
         * @param {number} act
         * @returns {object[]}
         */
        getQuestsByAct: function (act) {
            return this.quests.filter(function (q) { return q.act === act; });
        },

        /**
         * Get all quests for a specific room.
         * @param {string} room
         * @returns {object[]}
         */
        getQuestsByRoom: function (room) {
            return this.quests.filter(function (q) { return q.room === room; });
        },

        /**
         * Get the current active quest. If none are active, returns the
         * first available quest. Returns null if nothing is actionable.
         * @returns {object|null}
         */
        getCurrentQuest: function () {
            // Prefer the first active quest
            if (this.activeQuests.length > 0) {
                return this.getQuest(this.activeQuests[0]);
            }
            // Fall back to first available quest
            for (var i = 0; i < this.quests.length; i++) {
                if (this.quests[i].status === 'available') {
                    return this.quests[i];
                }
            }
            return null;
        },

        /**
         * Get quests relevant to a specific NPC (available or active).
         * @param {string} npcId
         * @returns {object[]}
         */
        getQuestsForNPC: function (npcId) {
            return this.quests.filter(function (q) {
                return q.npc === npcId && (q.status === 'available' || q.status === 'active');
            });
        },

        // -----------------------------------------------------------
        // Quest lifecycle
        // -----------------------------------------------------------

        /**
         * Check whether the prerequisites for a quest are satisfied.
         * @param {string} id
         * @returns {boolean}
         */
        canStartQuest: function (id) {
            var quest = this.getQuest(id);
            if (!quest) return false;
            if (quest.status === 'completed' || quest.status === 'active') return false;

            var self = this;
            return quest.prerequisites.every(function (preId) {
                return self.completedQuests.indexOf(preId) !== -1;
            });
        },

        /**
         * Accept (start) a quest. Moves it from 'available' to 'active'.
         * @param {string} id
         * @returns {boolean} true if accepted successfully
         */
        acceptQuest: function (id) {
            var quest = this.getQuest(id);
            if (!quest) return false;
            if (quest.status !== 'available') return false;

            quest.status = 'active';
            if (this.activeQuests.indexOf(id) === -1) {
                this.activeQuests.push(id);
            }

            this.emit('quest_accepted', { quest: quest });
            return true;
        },

        // -----------------------------------------------------------
        // Objective tracking
        // -----------------------------------------------------------

        /**
         * Find an objective inside a quest.
         * @param {object} quest
         * @param {string} objectiveId
         * @returns {object|null}
         */
        _findObjective: function (quest, objectiveId) {
            for (var i = 0; i < quest.objectives.length; i++) {
                if (quest.objectives[i].id === objectiveId) {
                    return quest.objectives[i];
                }
            }
            return null;
        },

        /**
         * Increment an objective's current value by `value` (default 1).
         * Automatically completes the objective if target is reached,
         * and completes the quest if all objectives are done.
         * @param {string} questId
         * @param {string} objectiveId
         * @param {number} [value=1]
         * @returns {boolean}
         */
        updateObjective: function (questId, objectiveId, value) {
            if (value === undefined || value === null) value = 1;

            var quest = this.getQuest(questId);
            if (!quest || quest.status !== 'active') return false;

            var obj = this._findObjective(quest, objectiveId);
            if (!obj) return false;

            // Already at or past target — nothing to do
            if (obj.current >= obj.target) return false;

            obj.current = Math.min(obj.current + value, obj.target);
            this.emit('objective_updated', { quest: quest, objective: obj });

            if (obj.current >= obj.target) {
                this.emit('objective_completed', { quest: quest, objective: obj });
            }

            // Auto-complete quest when all objectives are met
            if (this.checkQuestComplete(questId)) {
                this.completeQuest(questId);
            }

            return true;
        },

        /**
         * Mark an objective as fully complete (sets current = target).
         * @param {string} questId
         * @param {string} objectiveId
         * @returns {boolean}
         */
        completeObjective: function (questId, objectiveId) {
            var quest = this.getQuest(questId);
            if (!quest || quest.status !== 'active') return false;

            var obj = this._findObjective(quest, objectiveId);
            if (!obj) return false;

            if (obj.current >= obj.target) return false;

            obj.current = obj.target;
            this.emit('objective_updated', { quest: quest, objective: obj });
            this.emit('objective_completed', { quest: quest, objective: obj });

            if (this.checkQuestComplete(questId)) {
                this.completeQuest(questId);
            }

            return true;
        },

        /**
         * Check if every objective in a quest has reached its target.
         * @param {string} id
         * @returns {boolean}
         */
        checkQuestComplete: function (id) {
            var quest = this.getQuest(id);
            if (!quest) return false;
            return quest.objectives.every(function (obj) {
                return obj.current >= obj.target;
            });
        },

        // -----------------------------------------------------------
        // Quest completion
        // -----------------------------------------------------------

        /**
         * Complete a quest: grant rewards, unlock dependent quests,
         * and update the current act.
         * @param {string} id
         * @returns {boolean}
         */
        completeQuest: function (id) {
            var quest = this.getQuest(id);
            if (!quest) return false;
            if (quest.status === 'completed') return false;

            quest.status = 'completed';

            // Move from active list to completed list
            var idx = this.activeQuests.indexOf(id);
            if (idx !== -1) {
                this.activeQuests.splice(idx, 1);
            }
            if (this.completedQuests.indexOf(id) === -1) {
                this.completedQuests.push(id);
            }

            // Grant badge rewards
            if (quest.rewards && quest.rewards.badge) {
                if (this.badges.indexOf(quest.rewards.badge) === -1) {
                    this.badges.push(quest.rewards.badge);
                    this.emit('badge_earned', { badgeId: quest.rewards.badge });
                }
            }

            // Special handling for the final quest — award the 'complete' badge
            if (id === 'home') {
                if (this.badges.indexOf('complete') === -1) {
                    this.badges.push('complete');
                    this.emit('badge_earned', { badgeId: 'complete' });
                }
            }

            this.emit('quest_completed', { quest: quest });

            // Invoke the named callback if one exists on window
            if (quest.onComplete && typeof window[quest.onComplete] === 'function') {
                window[quest.onComplete](quest);
            }

            // Unlock dependent quests
            this._unlockDependents(quest);

            // Update current act
            this.updateCurrentAct();

            // Check for game completion
            if (id === 'home') {
                this.emit('game_complete', {});
            }

            return true;
        },

        /**
         * After completing a quest, check its `rewards.unlocks` list
         * and mark those quests as 'available' if prerequisites are met.
         * @param {object} quest
         * @private
         */
        _unlockDependents: function (quest) {
            if (!quest.rewards || !quest.rewards.unlocks) return;

            var self = this;
            quest.rewards.unlocks.forEach(function (unlockId) {
                var target = self.getQuest(unlockId);
                if (!target) return;
                if (target.status !== 'locked') return;

                if (self.canStartQuest(unlockId)) {
                    target.status = 'available';
                    self.emit('quest_available', { quest: target });
                }
            });
        },

        // -----------------------------------------------------------
        // Act tracking
        // -----------------------------------------------------------

        /**
         * Recalculate the current act based on quest progress.
         * The act is the highest act number that has at least one
         * available or active quest (or a completed quest if it is
         * the last act).
         */
        updateCurrentAct: function () {
            var highestAct = 1;
            for (var i = 0; i < this.quests.length; i++) {
                var q = this.quests[i];
                if (q.status === 'available' || q.status === 'active' || q.status === 'completed') {
                    if (q.act > highestAct) {
                        highestAct = q.act;
                    }
                }
            }

            if (highestAct !== this.currentAct) {
                this.currentAct = highestAct;
                this.emit('act_changed', { act: highestAct });
            }
        },

        // -----------------------------------------------------------
        // Badges
        // -----------------------------------------------------------

        /**
         * Check if the player has earned a specific badge.
         * @param {string} id
         * @returns {boolean}
         */
        hasBadge: function (id) {
            return this.badges.indexOf(id) !== -1;
        },

        // -----------------------------------------------------------
        // Progress helpers
        // -----------------------------------------------------------

        /**
         * Get overall completion percentage (0-100).
         * @returns {number}
         */
        getProgress: function () {
            if (this.quests.length === 0) return 0;
            return Math.round((this.completedQuests.length / this.quests.length) * 100);
        },

        /**
         * Get completion stats for a specific act.
         * @param {number} act
         * @returns {{ completed: number, total: number }}
         */
        getActProgress: function (act) {
            var actQuests = this.getQuestsByAct(act);
            var completed = 0;
            for (var i = 0; i < actQuests.length; i++) {
                if (actQuests[i].status === 'completed') {
                    completed++;
                }
            }
            return { completed: completed, total: actQuests.length };
        },

        // -----------------------------------------------------------
        // Event system
        // -----------------------------------------------------------

        /**
         * Register an event listener.
         * @param {string} event
         * @param {function} callback
         */
        on: function (event, callback) {
            if (typeof callback !== 'function') return;
            this.listeners.push({ event: event, callback: callback });
        },

        /**
         * Remove a specific listener. If no callback is provided,
         * removes all listeners for that event.
         * @param {string} event
         * @param {function} [callback]
         */
        off: function (event, callback) {
            this.listeners = this.listeners.filter(function (l) {
                if (l.event !== event) return true;
                if (callback && l.callback !== callback) return true;
                return false;
            });
        },

        /**
         * Emit an event to all registered listeners.
         * @param {string} event
         * @param {*} data
         */
        emit: function (event, data) {
            for (var i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i].event === event) {
                    try {
                        this.listeners[i].callback(data);
                    } catch (err) {
                        console.error('[QuestSystem] Error in listener for "' + event + '":', err);
                    }
                }
            }
        },

        // -----------------------------------------------------------
        // Persistence (localStorage)
        // -----------------------------------------------------------

        /**
         * Save current progress to localStorage.
         */
        save: function () {
            var state = {
                activeQuests: this.activeQuests.slice(),
                completedQuests: this.completedQuests.slice(),
                badges: this.badges.slice(),
                currentAct: this.currentAct,
                questStates: {}
            };

            // Persist per-quest status and objective progress
            for (var i = 0; i < this.quests.length; i++) {
                var q = this.quests[i];
                state.questStates[q.id] = {
                    status: q.status,
                    objectives: q.objectives.map(function (obj) {
                        return { id: obj.id, current: obj.current };
                    })
                };
            }

            try {
                localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            } catch (err) {
                console.error('[QuestSystem] Failed to save:', err);
            }
        },

        /**
         * Load progress from localStorage. Returns true if a save
         * was found and restored, false otherwise.
         * @returns {boolean}
         */
        load: function () {
            var raw;
            try {
                raw = localStorage.getItem(SAVE_KEY);
            } catch (err) {
                console.error('[QuestSystem] Failed to read localStorage:', err);
                return false;
            }

            if (!raw) return false;

            var state;
            try {
                state = JSON.parse(raw);
            } catch (err) {
                console.error('[QuestSystem] Corrupt save data:', err);
                return false;
            }

            // Reset quests to pristine definitions before applying state
            this.quests = createQuestDefinitions();
            this.activeQuests = state.activeQuests || [];
            this.completedQuests = state.completedQuests || [];
            this.badges = state.badges || [];
            this.currentAct = state.currentAct || 1;

            // Restore per-quest state
            if (state.questStates) {
                for (var i = 0; i < this.quests.length; i++) {
                    var q = this.quests[i];
                    var saved = state.questStates[q.id];
                    if (!saved) continue;

                    q.status = saved.status || q.status;

                    if (saved.objectives) {
                        for (var j = 0; j < saved.objectives.length; j++) {
                            var so = saved.objectives[j];
                            var obj = this._findObjective(q, so.id);
                            if (obj) {
                                obj.current = so.current;
                            }
                        }
                    }
                }
            }

            return true;
        },

        // -----------------------------------------------------------
        // Reset
        // -----------------------------------------------------------

        /**
         * Reset all progress and remove the save file.
         */
        reset: function () {
            this.quests = createQuestDefinitions();
            this.activeQuests = [];
            this.completedQuests = [];
            this.badges = [];
            this.currentAct = 1;

            // Set first quest to available
            var calibrate = this.getQuest('calibrate');
            if (calibrate) {
                calibrate.status = 'available';
            }

            try {
                localStorage.removeItem(SAVE_KEY);
            } catch (err) {
                // Silently ignore — not critical
            }
        },

        // -----------------------------------------------------------
        // Debug
        // -----------------------------------------------------------

        /**
         * Print the full quest tree with current statuses to the console.
         */
        debugPrint: function () {
            var acts = [1, 2, 3, 4];
            var self = this;

            console.log('=== Quest System Debug ===');
            console.log('Current Act: ' + this.currentAct);
            console.log('Badges: ' + (this.badges.length > 0 ? this.badges.join(', ') : '(none)'));
            console.log('Progress: ' + this.getProgress() + '%');
            console.log('');

            acts.forEach(function (act) {
                var actProgress = self.getActProgress(act);
                console.log('--- ACT ' + act + ' (' + actProgress.completed + '/' + actProgress.total + ') ---');

                var quests = self.getQuestsByAct(act);
                quests.forEach(function (q) {
                    var statusIcon = {
                        locked: '[ ]',
                        available: '[?]',
                        active: '[>]',
                        completed: '[x]'
                    }[q.status] || '[?]';

                    console.log('  ' + statusIcon + ' ' + q.id + ' (' + q.status + ')');

                    q.objectives.forEach(function (obj) {
                        var done = obj.current >= obj.target;
                        var mark = done ? 'v' : ' ';
                        console.log('      [' + mark + '] ' + obj.id + ' (' + obj.current + '/' + obj.target + ')');
                    });
                });

                console.log('');
            });
        }
    };

    // -----------------------------------------------------------
    // Global export
    // -----------------------------------------------------------

    window.QuestSystem = QuestSystem;

})();
