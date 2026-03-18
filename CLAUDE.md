# The Magnetic Mission - Project Guide

## Overview

Educational point-and-click adventure game about Earth's magnetic field. Players solve a navigation crisis aboard research vessel Aurora through 4 acts of physics experiments, error analysis, geological exploration, and navigation recalibration.

## Tech Stack

- **Engine:** Phaser 3.80.1 (CDN, `pixelArt: true`, `roundPixels: true`)
- **Resolution:** 960x540, FIT scaling
- **Rendering:** Canvas 2D only (no WebGL requirement)
- **Audio:** Procedural Web Audio API synthesis + MP3 fallback
- **Languages:** English, Hebrew (RTL), Arabic (RTL)
- **Persistence:** localStorage for quest progress
- **No build system** - vanilla JS loaded via script tags in index.html

## File Structure

```
index.html                    Entry point, script tags with ?v=N cache busting
css/style.css                 Minimal - pixelated rendering, full-screen canvas
js/
  main.js                     Phaser config & game instantiation
  gameState.js                Global singleton: timer, acts, evidence, measurements
  i18n.js                     700+ strings in 3 languages, RTL support
  audio.js                    1400 lines - procedural synth, MP3 loading, SFX
  quest.js                    17 quests across 4 acts with dependency chains
  scenes/
    BootScene.js              Generates 60+ textures procedurally at startup
    TitleScene.js             Menu: ocean, ship, compass, language selector
    IntroScene.js             9-beat cinematic establishing the crisis
    ShipHubScene.js           Corridor hub with 4 doors (acts 1-4)
    LabScene.js               Act 1: tangent galvanometer experiment (2400+ lines)
    NavigationScene.js        Act 2: error type diagnosis
    ResearchScene.js          Act 3: Earth layers, dynamo, reversals, Mars
    BridgeScene.js            Act 4: recalibrate navigation, victory
    DialogScene.js            Reusable NPC conversation overlay
    QuestLogScene.js          Quest/badge progress UI
assets/
  backgrounds/                3 PNGs (title, corridor, lab) - Aseprite pixel art
  sprites/                    Portraits, icons, equipment PNGs
  music/                      MP3 tracks (menu, lab, tension, ship)
tools/
  generate_corridor.lua       Aseprite Lua script for corridor background
```

## PICO-8 Palette (use everywhere)

```
DEEP_NAVY   #0d1b2a    DARK_BLUE   #1b2838    MED_BLUE    #2d4a6a
BRIGHT_BLUE #29adff    CYAN        #53d8fb    WHITE       #fff1e8
LIGHT_GREY  #c2c3c7    DARK_GREY   #5f574f    RED         #ff004d
ORANGE      #ffa300    YELLOW      #ffec27    GREEN       #00e436
PINK        #ff77a8    INDIGO      #83769c    BROWN       #ab5236
```

## Depth Layer Convention

All scenes follow this depth ordering:

| Range | Purpose |
|-------|---------|
| 0     | Background image or gradient |
| 1-5   | Environmental details (lights, particles) |
| 10    | FURNITURE - shelves, desks, decorations |
| 20    | EQUIPMENT - galvanometer, instruments |
| 30    | ITEMS - collectible parts, glows |
| 40    | UI - panels, buttons, controls |
| 50    | OVERLAY - dimming layers, popups |
| 60    | POPUP - modal dialogs, results |
| 80+   | Revelation/dramatic overlays |

## Game Flow

```
Title -> Intro (9 beats) -> ShipHub
  -> Lab (Act 1: assemble galvanometer, measure B_H)
  -> Navigation (Act 2: diagnose error types, revelation)
  -> Research (Act 3: Earth layers, dynamo, reversals, Mars)
  -> Bridge (Act 4: recalibrate, set heading, victory)
```

## Key Systems

### GameState (`window.GameState`)
- `currentAct` (0-4), `timeRemaining` (seconds), `evidence[]`, `measurements[]`
- `actTimeStamps: {1: 360, 2: 240, 3: 150, 4: 45}` - timer jumps per act
- `hasSeenDialog(id)` / `markDialogSeen(id)` - track NPC conversations

### Quest System (`window.QuestSystem`)
- 17 quests in 4 acts with prerequisite chains
- Each quest has objectives with progress tracking
- `acceptQuest(id)`, `completeObjective(questId, objId)`, `completeQuest(id)`
- Badges awarded at act milestones

### I18N (`window.I18N`)
- `t(key)` - translate with English fallback
- `isRTL()` - Hebrew/Arabic detection
- `getFontFamily()` - Press Start 2P (en) or Noto Sans Hebrew/Arabic
- `fixRTL(text)` - add Unicode directional markers for Phaser

### Audio (`window.AudioManager`)
- `playMusic(track)`, `playSFX(name)`, `startAmbient(name)`
- All SFX procedurally synthesized (oscillators + filters)
- Music: MP3 files loaded in BootScene
- Must call `init()` on first user gesture (browser policy)

## NPC Color Scheme

| NPC | Color | Hex | Role |
|-----|-------|-----|------|
| Captain Stern | Orange | #ffa300 | Authority, mission briefing |
| Dr. Magneta | Pink | #ff77a8 | Lab scientist, measurement guide |
| Navigator Navi | Cyan | #29adff | Error analysis, navigation |
| Dr. Geo | Green | #00e436 | Geology, dynamo, Mars comparison |

## Physics (LabScene)

Tangent galvanometer: `tan(theta) = mu0 * N * I / (2 * R * B_H)`
- N = coil turns (10-500), R = radius (2-10cm), I = current (0.5-2.5A)
- mu0 = 1.257e-6, B_H ~ 45 uT at 45N latitude
- Player plots tan(theta) vs mu0*N*I/(2R), slope = 1/B_H

## Scene Transitions

```javascript
this.cameras.main.fadeOut(600, 0, 0, 0);
this.time.delayedCall(600, () => this.scene.start('NextScene'));
```

## Background Images

ShipHubScene checks `this.textures.exists('bg_corridor')` - if the PNG exists, it uses it instead of procedural drawing. Same pattern for LabScene (`bg_lab`) and TitleScene (`bg_title`). Generated via Aseprite Lua scripts in `tools/`.

## RTL Text Pattern

```javascript
const fontFamily = window.I18N ? window.I18N.getFontFamily() : 'Press Start 2P';
const isRTL = window.I18N && window.I18N.isRTL();
let text = t('some_key');
if (isRTL && window.I18N) text = window.I18N.fixRTL(text);
this.add.text(x, y, text, { fontFamily, rtl: isRTL, ... });
```

## Cache Busting

All script tags in index.html use `?v=N`. Bump the version number after any JS change to force browser reload.

## Important Constraints

- Game must feel like a REAL GAME, not a web app - pixel art style, tutorial guidance, challenge
- All text must be translated (3 languages) - never hardcode visible strings
- PICO-8 palette only - no arbitrary colors
- Font sizes: English uses pixel font (smaller), Hebrew/Arabic use Noto (larger, +8px)
- Phaser text objects sometimes fail to render in certain contexts - LabScene uses seven-segment display graphics as workaround

---

## Working Rules for Claude

### Autonomy
- Work autonomously. You are responsible for the final result.
- Do not ask clarifying questions mid-task — make decisions using this file.
- If you encounter a problem while working, solve it yourself. Do not stop and ask.
- Only pause if a decision could affect game logic or progression in a way this file doesn't cover (e.g. "should failing this objective block the next act?"). In that case, present the options and a recommendation — don't just stop.

### Before making any change
- Read the relevant scene file top to bottom before touching anything
- If the change affects more than one file, list all affected files and confirm your plan before starting
- Never rewrite a function that works — only fix what is broken

### After every change
- Read back the changed lines from the actual file to confirm the edit was saved
- Never say "I've updated X" without showing the diff
- State clearly: what you changed, and what you deliberately did NOT touch

### Finishing a task
- A task is done when it works correctly AND matches the visual and code quality of the existing scenes
- The quality bar is LabScene and ShipHubScene — match them
- Do not report a task as complete if it has placeholder graphics, hardcoded strings, or untested edge cases

### Visual Quality
- Every new visual element must use pixel art style, sharp edges, PICO-8 palette only
- Before finishing any visual task, verify: colors used, depth layer, pixel dimensions — all against this file
- If something looks inconsistent with existing scenes, fix it before reporting done
- Never use placeholder graphics in a final implementation

### When something is broken
- Read the browser console error exactly — do not guess
- Check texture existence with `this.textures.exists()` before using any texture
- For text issues: check RTL/font first (see RTL Text Pattern above)
- For audio issues: verify `AudioManager.init()` was called on user gesture
- Fix the root cause, not the symptom

### DO NOT
- Do NOT change depth values without checking the full depth table above
- Do NOT hardcode any visible string — always use `t('key')` and add the key to i18n.js in all 3 languages
- Do NOT add colors outside the PICO-8 palette
- Do NOT add `import`/`export` statements — this project uses script tags, no modules
- Do NOT add a build step or any package.json dependencies
- Do NOT remove or forget to bump cache busting (`?v=N`) in index.html after any JS change
- Do NOT use WebGL-specific Phaser features — Canvas 2D only
- Do NOT make a second change while a first change is unverified
- Do NOT silently fix bugs you discover while working on something else — report them separately
- Do NOT render dialog/NPC text without wordWrap - always set 
  wordWrap: { width: [container_width - 40], useAdvancedWrap: true }