# SynthClock Architecture

This document explains the software architecture and main components of SynthClock.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                        │
├─────────────────────────────────────────────────────────────────┤
│  UI Components                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ClockDisp-│ │SoundEdit-│ │ThemeSele-│ │Mixer             │   │
│  │lay       │ │or        │ │ctor      │ │                  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                │              │
├───────┴────────────┴────────────┴────────────────┴──────────────┤
│                     Zustand Store (useStore)                     │
│  - Theme, Background, Presets, Mixer, PlayState                 │
├──────────────────────────────────────────────────────────────────┤
│  Core Modules                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ AudioEngine  │ │ TimeDilator  │ │  ToneClock   │             │
│  │ (Tone.js)    │ │ (Virtual     │ │  (Music      │             │
│  │              │ │  Clock)      │ │   Theory)    │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. AudioEngine (`core/audio/AudioEngine.ts`)

**Purpose**: Manages all audio synthesis using Tone.js.

**Key Classes & Methods**:

| Method | Description |
|--------|-------------|
| `start()` | Initializes audio context (requires user interaction) |
| `createChannel(id, preset)` | Creates synth with effects chain |
| `playNote(id, note, duration)` | Plays single note |
| `playChord(id, notes, duration)` | Plays multiple notes |
| `triggerAttack/Release(id)` | For sustained drones |
| `updateParameter(id, param, value)` | Real-time parameter changes |
| `setMasterVolume(db)` | Controls master output |

**Effects Chain**:
```
Synth → Filter → Tremolo → Delay → Reverb → Gate → Volume → Master
```

**Singleton**: `audioEngine` is exported as a single instance.

---

### 2. TimeDilator (`core/time/TimeDilator.ts`)

**Purpose**: Virtual clock with speed control. Emits events for UI and audio sync.

**Key Features**:
- Speed multiplier (0.1x to 10x)
- Emits `'second'`, `'minute'`, `'hour'` events
- Uses `setInterval` (not requestAnimationFrame) so audio continues in background

**Key Methods**:

| Method | Description |
|--------|-------------|
| `start()` | Begins clock from real time |
| `stop()` | Pauses clock |
| `setSpeed(n)` | Speed multiplier (1.0 = real-time) |
| `getTime()` | Returns current virtual time |
| `getAngles()` | Returns hand angles in radians |
| `subscribe(id, callback)` | Listen to time events |

**Singleton**: `timeDilator` instance.

---

### 3. ToneClock (`core/theory/ToneClock.ts`)

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

### 4. Themes (`core/visuals/themes.ts`)

**Purpose**: Visual theme definitions.

**Theme Structure**:
```typescript
interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;      // 11 color properties
  characters: ThemeCharacters; // ASCII art for UI
  fontFamily: string;
  fontSize: number;
}
```

See [ADDING_THEMES.md](./ADDING_THEMES.md) for customization guide.

---

### 5. Arpeggiator (`core/audio/Arpeggiator.ts`)

**Purpose**: Generates rhythmic patterns based on the current Tone Clock trichord.

**Key Features**:
- **Patterns**: Up, Down, UpDown, DownUp, Random
- **Rates**: 1n, 2n, 4n, 8n, 16n
- **Glissando**: Portamento effect between notes (0-500ms)
- **Sync**: Updates notes automatically when clock changes (minute/hour)

**Integration**:
- Uses `Tone.Pattern` for sequencing
- Triggers `AudioEngine.playArpNote()` which uses a dedicated MonoSynth
- Settings managed via global store (`arpeggiator`)

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
  hourPreset: SynthPreset,
  minutePreset: SynthPreset,
  secondPreset: SynthPreset,
  mixer: { hour: {...}, minute: {...}, second: {...}, arp: {...} },
  arpeggiator: { enabled, pattern, rate, glissando },
  activeHour: ToneClockHour,
  showEditor: boolean,
  editorTab: 'sounds' | 'theme' | 'theory' | 'help',
}
```

**Persisted Keys**: theme, presets, background, mixer, speed.

---

## Component Hierarchy

```
App.tsx
├── Toolbar
│   ├── BPM Slider (speed control)
│   ├── Volume Slider (master)
│   ├── Play Button
│   └── Editor Toggle
├── ClockDisplay
│   ├── Clock Face (hands, numbers)
│   └── ToneClockInfo (current hour, trichord)
├── EditorPanel (conditional)
│   ├── Tabs: Sounds | Theme | Theory | Help
│   ├── Mixer (per-channel volume/mute)
│   ├── SoundEditor (waveform, envelope, effects)
│   ├── ThemeSelector (colors, patterns)
│   ├── TheoryPanel (Tone Clock explanation)
│   └── HelpPanel (reset, guide)
└── StatusBar
```

---

## Data Flow

```
1. TimeDilator.start()
   ↓ emits 'second' event
2. App.tsx useEffect receives event
   ↓ calls ToneClock.getCurrentNote()
3. Gets note based on current time
   ↓
4. audioEngine.playNote('second', note)
   ↓
5. Tone.js synthesizes sound
```

**On Preset Change**:
```
User changes slider in SoundEditor
  ↓ updatePresetParameter()
Store updates preset
  ↓ useEffect in App.tsx
audioEngine.updateSynthParams() — updates without restart
```

---

## Audio Lifecycle

1. **User clicks Play** → `Tone.start()` (required for Web Audio)
2. **TimeDilator starts** → Begins emitting time events
3. **Channels created** → `audioEngine.createChannel()` for hour/minute/second
4. **Events trigger notes**:
   - `'second'` → plays melodic note
   - `'minute'` → plays chord, updates transposition
   - `'hour'` → updates drone chord
   - **Arpeggiator**: Sequences notes from current trichord on dedicated channel
5. **User stops** → Channels release, TimeDilator stops

---

## File Structure

```
app/src/
├── core/
│   ├── audio/
│   │   ├── AudioEngine.ts    # Synthesis engine
│   │   └── presets.ts        # Sound presets
│   ├── theory/
│   │   └── ToneClock.ts      # Music theory
│   ├── time/
│   │   └── TimeDilator.ts    # Virtual clock
│   └── visuals/
│       └── themes.ts         # Visual themes
├── components/
│   ├── clock/
│   │   └── ClockDisplay.tsx
│   ├── editors/
│   │   ├── SoundEditor.tsx
│   │   └── ThemeSelector.tsx
│   └── mixer/
│       └── Mixer.tsx
├── hooks/
│   └── useStore.ts           # Zustand state
├── App.tsx                   # Main component
├── main.tsx                  # Entry point
└── index.css                 # Styles
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `tone` | Web Audio synthesis |
| `react` | UI framework |
| `zustand` | State management |
| `vite` | Build tool |
| `typescript` | Type safety |

---

## Mobile Considerations

- **Media Session API**: Allows background playback
- **Silent oscillator**: Keeps audio context alive when screen off
- **min-height: 100vh**: Prevents layout collapse on mobile Safari
- **Responsive CSS**: Stacks layout vertically on small screens
