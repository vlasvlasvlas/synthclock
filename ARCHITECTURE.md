# SynthClock Architecture

This document explains the software architecture and main components of SynthClock.

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             React Application                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  UI Components                                                               │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌────────┐ ┌─────────────┐ │
│  │ClockDisplay│ │SoundEditor │ │VisualEditor  │ │ Mixer  │ │ThemeSelector│ │
│  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ └───┬────┘ └──────┬──────┘ │
│        │              │               │              │             │         │
├────────┴──────────────┴───────────────┴──────────────┴─────────────┴─────────┤
│                         Zustand Store (useStore)                             │
│  Theme · Background · Presets · Mixer · Arp · VisualSettings · PlayState    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Core Modules                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ AudioEngine  │ │ TimeDilator  │ │  ToneClock   │ │  VisualEngine    │   │
│  │ (Tone.js)    │ │ (Virtual     │ │ (Music       │ │  (Canvas 2D)     │   │
│  │              │ │  Clock)      │ │  Theory)     │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────┐                                                           │
│  │ Arpeggiator  │                                                           │
│  │ (Tone.Pattern)│                                                          │
│  └──────────────┘                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. AudioEngine (`core/audio/AudioEngine.ts`)

**Purpose**: Manages all audio synthesis using Tone.js.

**Key Methods**:

| Method | Description |
|--------|-------------|
| `start()` | Initializes audio context (requires user interaction) |
| `createChannel(id, preset)` | Creates synth with full effects chain |
| `playNote(id, note, duration)` | Plays single note on a channel |
| `playChord(id, notes, duration)` | Plays multiple notes simultaneously |
| `playArpNote(note, duration)` | Plays note on dedicated arp MonoSynth |
| `triggerAttack/Release(id)` | For sustained drones (hour layer) |
| `updateSynthParams(id, preset)` | Real-time parameter changes |
| `updateArpParams(preset)` | Updates arp synth + FX from preset |
| `setMasterVolume(db)` | Controls master output |
| `setChannelVolume(id, db)` | Per-channel volume control |
| `setArpPortamento(seconds)` | Glissando effect for arp |

**Standard Effects Chain** (per channel):
```
PolySynth → Filter → Tremolo → Delay → Reverb → Gate → Volume → Master
```

**Arpeggiator Effects Chain** (dedicated):
```
MonoSynth → Filter → FeedbackDelay → Reverb → Volume → Master
```

**Singleton**: `audioEngine` is exported as a single instance.

---

### 2. Arpeggiator (`core/audio/Arpeggiator.ts`)

**Purpose**: Generates rhythmic patterns based on the current Tone Clock trichord.

**Key Features**:
- **Patterns**: Up, Down, UpDown, DownUp, Random
- **Rates**: 1n (whole), 2n (half), 4n, 8n, 16n
- **Glissando**: Portamento effect between notes (0–500ms)
- **Sync**: Updates notes automatically when clock changes (minute/hour)

**Integration**:
- Uses `Tone.Pattern` for sequencing
- Triggers `AudioEngine.playArpNote()` via callback
- Settings managed via global store (`arpeggiator`)

---

### 3. TimeDilator (`core/time/TimeDilator.ts`)

**Purpose**: Virtual clock with speed control. Emits events for UI and audio sync.

**Key Features**:
- Speed multiplier (0.1x to 10x)
- Reverse mode (time moves backward)
- Emits `'second'`, `'minute'`, `'hour'` events
- Uses `setInterval` (not requestAnimationFrame) so audio continues in background tabs

**Key Methods**:

| Method | Description |
|--------|-------------|
| `start()` | Begins clock from real time |
| `stop()` | Pauses clock |
| `setSpeed(n)` | Speed multiplier (1.0 = real-time) |
| `setReverse(bool)` | Toggle reverse time direction |
| `getTime()` | Returns current virtual time |
| `getAngles()` | Returns hand angles in radians |
| `subscribe(id, callback)` | Listen to time events |

**Singleton**: `timeDilator` instance.

---

### 4. ToneClock (`core/theory/ToneClock.ts`)

**Purpose**: Implements Peter Schat's Tone Clock music theory.

**Concepts**:
- **12 Hours**: Each represents a unique trichord (3-note set)
- **IPF (Intervallic Prime Form)**: Intervals between notes (e.g., `[2,5]` = whole tone + perfect fourth)
- **Tessellation**: 4 trichords that together cover all 12 pitch classes

**Key Functions**:

| Function | Description |
|----------|-------------|
| `getHour(n)` | Get Hour object by number (1-12) |
| `mapTimeToToneClock(h, m, s)` | Maps clock time to musical state |
| `generateTrichord(hour, transposition)` | Generate pitch classes |
| `getCurrentNote(h, m, s)` | Get note to play for current second |
| `getCurrentChord(h, m)` | Get 3-note chord for current minute |

**Time-to-Music Mapping**:
```
Hour hand   → Selects the Hour (trichord type)
Minute hand → Selects transposition (0-3, tessellation index)
Second hand → Cycles through 3 notes of trichord
```

---

### 5. VisualEngine (`core/visuals/VisualEngine.ts`)

**Purpose**: Manages the canvas rendering pipeline for audio-reactive visual effects.

**Key Features**:
- Singleton architecture with pluggable renderers
- `requestAnimationFrame` render loop
- Receives audio event triggers from `App.tsx`
- Per-layer settings for effect type, color, position, intensity

**Architecture**:
```
App.tsx audio events
    ↓
VisualEngine.triggerSecond/Minute/Hour/ArpNote()
    ↓ checks settings.enabled
MultiRenderer.onSecond/onMinute/onHour/onArpNote()
    ↓ dispatches by settings.effect
ParticleRenderer / RippleRenderer / DropletRenderer / WaveRenderer
    ↓ spawns visual elements
MultiRenderer.render() — called every frame
    ↓ clears canvas
    ↓ renders all sub-renderers
Canvas 2D output
```

**Available Renderers**:

| Renderer | File | Description |
|----------|------|-------------|
| Particles | `ParticleRenderer.ts` | Physics-based particles with trails and glow |
| Ripples | `RippleRenderer.ts` | Expanding concentric circles with fade |
| Droplets | `DropletRenderer.ts` | Gravity-affected falling droplets |
| Waves | `WaveRenderer.ts` | Horizontal waves with oscillation |

---

### 6. Themes (`core/visuals/themes.ts`)

**Purpose**: Visual theme definitions.

**Included Themes**:
- Classic Mac, ANSI BBS, Windows 3.1, Terminal Green

See [ADDING_THEMES.md](./ADDING_THEMES.md) for customization guide.

---

## State Management

### useStore (`hooks/useStore.ts`)

Uses **Zustand** with `persist` middleware for localStorage.

**State Shape**:
```typescript
{
  theme: Theme,
  background: { color, pattern, opacity, animated },
  isPlaying: boolean,
  masterVolume: number,
  speed: number,
  isReverse: boolean,
  hourPreset: SynthPreset,
  minutePreset: SynthPreset,
  secondPreset: SynthPreset,
  arpPreset: SynthPreset,
  mixer: { hour, minute, second, arp },  // { volume, muted }
  arpeggiator: { enabled, pattern, rate, glissando },
  visualsEnabled: boolean,
  visualSettings: {
    hour: VisualLayerSettings,
    minute: VisualLayerSettings,
    second: VisualLayerSettings,
    arp: VisualLayerSettings,
  },
  activeHour: ToneClockHour,
  showEditor: boolean,
  editorTab: 'sounds' | 'theme' | 'theory' | 'help',
}
```

**VisualLayerSettings**:
```typescript
{
  enabled: boolean,
  effect: 'particles' | 'ripples' | 'droplets' | 'waves' | 'none',
  colorSource: 'theme' | 'pitchClass' | 'random' | 'custom',
  customColor: string,
  intensity: number,        // 0-1
  decayTime: number,        // seconds
  positionMode: 'random' | 'center' | 'clockEdge',
  sizeMultiplier: number,   // 0.5-3
  opacity: number,          // 0-1
}
```

**Persisted**: theme, presets, mixer, speed, arp settings, visual settings.
**Versioned**: Storage migrations handle upgrades between versions.

---

## Component Hierarchy

```
App.tsx
├── Toolbar
│   ├── Play/Stop Button
│   ├── REV Checkbox (reverse mode)
│   ├── Speed Slider + BPM display
│   ├── Volume Slider
│   ├── Editor Toggle (Show/Hide)
│   └── GitHub Link
├── VisualCanvas (fixed, full-screen, z-index: 0)
├── ClockDisplay
│   ├── Clock Face (analog with hands)
│   ├── Digital Time (HH:MM:SS)
│   ├── Date Display (D Month YYYY)
│   └── ToneClockInfo (current hour, trichord, IPF)
├── EditorPanel (conditional)
│   ├── Tabs: Sounds | Theme | Theory | Help
│   ├── SoundEditor (per-layer: waveform, envelope, filter, effects)
│   │   └── Arpeggiator Controls (pattern, rate, glissando)
│   ├── ThemeSelector
│   │   ├── Visuals Sub-tab (per-layer: effect, color, intensity, etc.)
│   │   ├── Theme Sub-tab (theme picker)
│   │   └── Background Sub-tab (color, pattern, opacity)
│   ├── Mixer (per-channel: volume slider + mute)
│   ├── TheoryPanel (Tone Clock explanation)
│   └── HelpPanel (reset, guide)
└── StatusBar
```

---

## Data Flow

### Audio Event Flow
```
1. TimeDilator.start()
   ↓ emits 'second' / 'minute' / 'hour' events
2. App.tsx useEffect receives event
   ↓ calls ToneClock.mapTimeToToneClock()
3. Gets note/chord based on current time
   ↓
4. audioEngine.playNote('second', note)
   ↓
5. Tone.js synthesizes sound through effects chain
   ↓
6. visualEngine.triggerSecond(value, note, color, settings)
   ↓
7. Canvas renders particles/ripples/waves
```

### Arpeggiator Flow
```
1. Arpeggiator.start() → Tone.Pattern sequences notes
   ↓ callback fires per pattern step
2. audioEngine.playArpNote(note, '16n')
   ↓ MonoSynth → Filter → Delay → Reverb → Volume → Master
3. visualEngine.triggerArpNote(note, color, settings)
   ↓ visual effect spawns
```

### Preset Change Flow
```
User changes slider in SoundEditor
  ↓ store.updatePresetParameter()
Store updates preset
  ↓ useEffect in App.tsx watches preset
audioEngine.updateSynthParams() — updates live
```

---

## Audio Lifecycle

1. **User clicks Play** → `Tone.start()` (required for Web Audio)
2. **TimeDilator starts** → Begins emitting time events
3. **Channels created** → `audioEngine.createChannel()` for hour/minute/second
4. **Arp starts** → `Arpeggiator.start()` begins pattern sequencing
5. **Events trigger notes**:
   - `'second'` → plays melodic note + visual trigger
   - `'minute'` → plays chord + updates transposition + visual
   - `'hour'` → updates drone chord + visual
   - **Arp**: sequences notes from current trichord on dedicated channel
6. **User stops** → Channels release, TimeDilator stops, Arpeggiator stops, Visuals clear

---

## File Structure

```
app/src/
├── core/
│   ├── audio/
│   │   ├── AudioEngine.ts      # Synthesis engine (Tone.js)
│   │   ├── Arpeggiator.ts      # Pattern sequencer
│   │   └── presets.ts           # Sound presets library
│   ├── theory/
│   │   └── ToneClock.ts         # Music theory (Peter Schat)
│   ├── time/
│   │   └── TimeDilator.ts       # Virtual clock with speed/reverse
│   └── visuals/
│       ├── VisualEngine.ts      # Rendering pipeline manager
│       ├── themes.ts            # Visual theme definitions
│       └── renderers/
│           ├── MultiRenderer.ts     # Effect dispatcher
│           ├── ParticleRenderer.ts  # Physics-based particles
│           ├── RippleRenderer.ts    # Expanding circles
│           ├── DropletRenderer.ts   # Falling droplets
│           └── WaveRenderer.ts      # Horizontal waves
├── components/
│   ├── clock/
│   │   └── ClockDisplay.tsx     # Analog + digital clock
│   ├── editors/
│   │   ├── SoundEditor.tsx      # Sound parameter editor
│   │   ├── VisualEditor.tsx     # Visual layer settings
│   │   └── ThemeSelector.tsx    # Theme + background picker
│   ├── mixer/
│   │   └── Mixer.tsx            # Per-channel volume/mute
│   └── visuals/
│       └── VisualCanvas.tsx     # Fullscreen canvas element
├── hooks/
│   └── useStore.ts              # Zustand state (persisted)
├── App.tsx                      # Main component — orchestrator
├── main.tsx                     # Entry point
└── index.css                    # Styles
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tone` | 15.x | Web Audio synthesis |
| `react` | 19.x | UI framework |
| `zustand` | 5.x | State management + persistence |
| `vite` | 7.x | Build tool + dev server |
| `typescript` | 5.9.x | Type safety |

---

## Mobile Considerations

- **Media Session API**: Allows background playback
- **Silent oscillator**: Keeps audio context alive when screen off
- **min-height: 100vh**: Prevents layout collapse on mobile Safari
- **Responsive CSS**: Stacks layout vertically on small screens
