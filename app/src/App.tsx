// Main App Component

import { useEffect, useState, useRef } from 'react';
import './index.css';
import { ClockDisplay } from './components/clock/ClockDisplay';
import { SoundEditor } from './components/editors/SoundEditor';
import { ThemeSelector } from './components/editors/ThemeSelector';
import { Mixer } from './components/mixer/Mixer';
import { useStore } from './hooks/useStore';
import { audioEngine } from './core/audio/AudioEngine';
import { timeDilator } from './core/time/TimeDilator';
import { mapTimeToToneClock, pitchClassToNote, TONE_CLOCK_HOURS } from './core/theory/ToneClock';
import { arpeggiator } from './core/audio/Arpeggiator';
import { VisualCanvas } from './components/visuals/VisualCanvas';
import { visualEngine } from './core/visuals/VisualEngine';
import * as Tone from 'tone';

function App() {
  const {
    theme,
    currentThemeId,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    masterVolume,
    setMasterVolume,
    showEditor,
    toggleEditor,
    editorTab,
    setEditorTab,
    hourPreset,
    minutePreset,
    secondPreset,
    arpPreset,
    mixer,
    background,
    arpeggiator: arpSettings,
    isReverse,
    setIsReverse,
    visualSettings,
  } = useStore();

  // Calculate BPM from speed (base 60 BPM at 1x speed)
  const bpm = Math.round(60 * speed);

  const [audioStarted, setAudioStarted] = useState(false);
  // Track which layer is currently active (for visual feedback)
  const [activeLayer, setActiveLayer] = useState<'hour' | 'minute' | 'second' | null>(null);

  // Helper to get visual color based on layer settings
  const getVisualColor = (
    layer: 'hour' | 'minute' | 'second' | 'arp',
    themeColor: string
  ): string => {
    const settings = visualSettings[layer];
    switch (settings.colorSource) {
      case 'custom':
        return settings.customColor || themeColor;
      case 'random':
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
      case 'pitchClass':
        // For pitch class, we'd need the note. If not available here, fallback to theme
        return themeColor;
      case 'theme':
      default:
        return themeColor;
    }
  };



  // Start the hour drone (continuous pad sound)
  const startHourDrone = () => {
    const time = timeDilator.getTime();
    const toneState = mapTimeToToneClock(time.hours, time.minutes, time.seconds);

    // Play all notes of the trichord as a sustained chord
    const droneNotes = toneState.currentTrichord.map((pc) => pitchClassToNote(pc, 3));
    audioEngine.triggerAttackChord('hour', droneNotes);
  };

  // Stop the hour drone
  const stopHourDrone = () => {
    audioEngine.triggerRelease('hour');
  };

  // Handle time events for triggering sounds
  useEffect(() => {
    const handleTimeEvent = (event: { type: string; value: number }) => {
      if (!isPlaying || !audioStarted) return;

      const time = timeDilator.getTime();
      const toneState = mapTimeToToneClock(time.hours, time.minutes, time.seconds);

      if (event.type === 'second') {
        // Play second layer sound - individual note from trichord (fast clicks)
        const note = pitchClassToNote(toneState.currentTrichord[event.value % 3], 5);
        audioEngine.playNote('second', note, '32n');
        // Visual feedback: flash second layer
        setActiveLayer('second');
        setTimeout(() => setActiveLayer(null), 100);
        // Trigger visual particles
        const secondColor = getVisualColor('second', theme.colors.secondHand);
        visualEngine.triggerSecond(event.value, note, secondColor, visualSettings.second);
      }

      if (event.type === 'minute') {
        // Play minute layer sound - melodic note
        const note = pitchClassToNote(toneState.currentTrichord[1], 4);
        audioEngine.playNote('minute', note, '2n');
        // Visual feedback: flash minute layer (longer since 2n note)
        setActiveLayer('minute');
        setTimeout(() => setActiveLayer(null), 300);
        // Trigger visual particles
        const minuteColor = getVisualColor('minute', theme.colors.minuteHand);
        visualEngine.triggerMinute(event.value, note, minuteColor, visualSettings.minute);
      }

      if (event.type === 'hour') {
        // Hour changed - update the drone with new trichord
        // Visual feedback: flash hour layer (sustained feedback)
        setActiveLayer('hour');
        // Trigger visual particles
        const hourColor = getVisualColor('hour', theme.colors.hourHand);
        visualEngine.triggerHour(time.hours, hourColor, visualSettings.hour);
        stopHourDrone();
        setTimeout(() => {
          startHourDrone();
          setTimeout(() => setActiveLayer(null), 500);
        }, 100);
      }
    };

    timeDilator.subscribe('app-audio', handleTimeEvent);

    return () => {
      timeDilator.unsubscribe('app-audio');
    };
  }, [isPlaying, audioStarted]);

  // Update speed and sync Transport BPM
  useEffect(() => {
    timeDilator.setSpeed(speed);
    // Sync Tone.js Transport BPM with our speed (P2: BPM sync)
    Tone.getTransport().bpm.value = 60 * speed;
  }, [speed]);

  // Sync reverse mode
  useEffect(() => {
    timeDilator.setReverse(isReverse);
  }, [isReverse]);

  // Update master volume
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // Refs for callback access to prevent re-running effects
  const visualSettingsRef = useRef(visualSettings);
  const themeRef = useRef(theme);

  useEffect(() => {
    visualSettingsRef.current = visualSettings;
  }, [visualSettings]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Setup arpeggiator callback to play notes through audio engine
  // This should only run ONCE to set the callback. No cleanup needed for the callback itself.
  useEffect(() => {
    arpeggiator.setCallback((note) => {
      if (audioStarted && isPlaying) {
        // Use dedicated arpeggiator synth with portamento
        audioEngine.playArpNote(note, '16n');
        // Trigger visual effect for arp
        const currentTheme = themeRef.current;
        const currentVisualSettings = visualSettingsRef.current;

        const arpColor = getVisualColor('arp', currentTheme.colors.accent);
        visualEngine.triggerArpNote(note, arpColor, currentVisualSettings.arp);
      }
    });
    // NO cleanup here -- don't stop the arp just because this effect re-runs.
    // The arp is stopped explicitly when isPlaying becomes false (in handlePlay).
  }, [audioStarted, isPlaying]);

  // Update arpeggiator notes when time changes AND start/stop based on playback
  useEffect(() => {
    if (!isPlaying || !audioStarted) {
      // If we're not playing, stop the arp
      arpeggiator.stop();
      return;
    }

    const updateArpNotes = () => {
      const time = timeDilator.getTime();
      const toneState = mapTimeToToneClock(time.hours, time.minutes, time.seconds);
      const notes = toneState.currentTrichord.map((pc) => pitchClassToNote(pc, 4));
      arpeggiator.setNotes(notes);
    };

    // Set notes first, THEN start
    updateArpNotes();
    arpeggiator.start();

    // Update on minute changes (when trichord might change)
    const handleTimeEvent = (event: { type: string }) => {
      if (event.type === 'minute' || event.type === 'hour') {
        updateArpNotes();
      }
    };

    timeDilator.subscribe('arpeggiator-notes', handleTimeEvent);

    return () => {
      timeDilator.unsubscribe('arpeggiator-notes');
      arpeggiator.stop();
    };
  }, [isPlaying, audioStarted]);

  // Sync arpeggiator settings from store (pattern, rate, glissando changes)
  useEffect(() => {
    // Force enable to true since we removed the toggle
    arpeggiator.updateSettings({ ...arpSettings, enabled: true });
    // Update portamento on audio engine (convert ms to seconds)
    audioEngine.setArpPortamento(arpSettings.glissando / 1000);
  }, [arpSettings]);

  // Watch visual layer enable/disable and clear visuals when ALL are off or ANY changes
  const prevVisualSettings = useRef(visualSettings);
  useEffect(() => {
    const prev = prevVisualSettings.current;
    const layers: Array<'hour' | 'minute' | 'second' | 'arp'> = ['hour', 'minute', 'second', 'arp'];

    // Check if any layer was just disabled
    for (const layer of layers) {
      if (prev[layer].enabled && !visualSettings[layer].enabled) {
        // Layer was just disabled - clear all visual effects for immediate response
        visualEngine.clearAll();
        break;
      }
    }
    prevVisualSettings.current = visualSettings;
  }, [visualSettings]);

  // NOTE: Arp volume is handled by the Mixer component via audioEngine.setArpVolume()

  // Sync Mixer Volume/Mute for other channels
  useEffect(() => {
    if (!mixer.hour) return;
    const vol = mixer.hour.muted ? -Infinity : mixer.hour.volume;
    audioEngine.setChannelVolume('hour', vol);
  }, [mixer.hour]);

  useEffect(() => {
    if (!mixer.minute) return;
    const vol = mixer.minute.muted ? -Infinity : mixer.minute.volume;
    audioEngine.setChannelVolume('minute', vol);
  }, [mixer.minute]);

  useEffect(() => {
    if (!mixer.second) return;
    const vol = mixer.second.muted ? -Infinity : mixer.second.volume;
    audioEngine.setChannelVolume('second', vol);
  }, [mixer.second]);

  // Sync Audio Presets (Smart Update: Params vs Full Recreate)
  // We use refs to track previous IDs to distinguish between "tweak" and "swap"
  const prevPresets = useRef({
    hour: hourPreset.id,
    minute: minutePreset.id,
    second: secondPreset.id
  });

  // Sync Hour Preset
  useEffect(() => {
    if (!audioStarted) return;

    // Check if ID changed (Swap) or just params (Tweak)
    // Note: The store adds "CUSTOM_" prefix but base ID remains if just tweaking
    // We compare exact ID strings. If user selects new preset, ID changes.
    // If user tweaks, ID stays "CUSTOM_..."

    // Actually, createChannel is safer for swaps, updateSynthParams for tweaks
    // If only params changed, update withoutglitch

    if (hourPreset.id !== prevPresets.current.hour) {
      // ID changed - likely a new preset selected
      audioEngine.createChannel('hour', hourPreset);
      prevPresets.current.hour = hourPreset.id;
    } else {
      // ID same - likely a parameter tweak
      audioEngine.updateSynthParams('hour', hourPreset);
    }

    // CRITICAL: Restart drone if playing, as synth update might kill voices
    if (isPlaying) {
      // Debounce slightly to avoid rapid re-triggering during sliding
      // But for instant feedback, we might want to just re-trigger
      // Actually, if we just re-trigger, it might sound glitchy on sliders. 
      // Better to check if voices are active? 
      // Easiest fix: just call startsHourDrone() which handles the chord release/attack
      // We'll use a small timeout to let the synth settle
      // stopHourDrone(); // Optional: force stop first
      // startHourDrone();

      // BETTER APPROACH: Only restart if it's the HOUR channel.
      // We are inside the hourPreset effect, so yes.
      // Let's debounce this restart to avoid chaos while dragging sliders
      const restartDrone = () => {
        stopHourDrone();
        setTimeout(() => startHourDrone(), 50);
      };
      restartDrone();
    }
  }, [hourPreset, audioStarted]);

  // Sync Minute Preset
  useEffect(() => {
    if (!audioStarted) return;
    if (minutePreset.id !== prevPresets.current.minute) {
      audioEngine.createChannel('minute', minutePreset);
      prevPresets.current.minute = minutePreset.id;
    } else {
      audioEngine.updateSynthParams('minute', minutePreset);
    }
  }, [minutePreset, audioStarted]);

  // Sync Second Preset
  useEffect(() => {
    if (!audioStarted) return;
    if (secondPreset.id !== prevPresets.current.second) {
      audioEngine.createChannel('second', secondPreset);
      prevPresets.current.second = secondPreset.id;
    } else {
      audioEngine.updateSynthParams('second', secondPreset);
    }
  }, [secondPreset, audioStarted]);

  // Sync Arp Preset
  useEffect(() => {
    if (!audioStarted) return;
    // Arp uses a dedicated synth, so we always just update params
    // It doesn't support full "presets" in the same channel sense yet,
    // but this ensures the sound editor changes apply to the Arp Synth
    audioEngine.updateArpParams(arpPreset);
  }, [arpPreset, audioStarted]);

  // Handle play button
  const handlePlay = async () => {
    if (!audioStarted) {
      await audioEngine.start();
      await audioEngine.createChannel('hour', hourPreset);
      await audioEngine.createChannel('minute', minutePreset);
      await audioEngine.createChannel('second', secondPreset);
      setAudioStarted(true);
    }

    if (!isPlaying) {
      // Starting playback - start the hour drone
      setIsPlaying(true);
      setTimeout(() => startHourDrone(), 100);
    } else {
      // Stopping playback - stop the drone
      stopHourDrone();
      setIsPlaying(false);
    }
  };

  // Apply theme class to body
  useEffect(() => {
    document.body.className = '';
    if (currentThemeId !== 'classic-mac') {
      document.body.classList.add(`theme-${currentThemeId}`);
    }
  }, [currentThemeId]);

  return (
    <div
      className={`app-container ${background.animated ? 'animated-bg' : ''}`}
      style={{
        background: background.color || theme.colors.background,
        fontFamily: theme.fontFamily,
        animation: background.animated ? 'bgPulse 3s ease-in-out infinite' : 'none',
      }}
    >
      {/* Visual Canvas Layer */}
      <VisualCanvas />

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className={`mac-button ${isPlaying ? 'primary' : ''}`}
          onClick={handlePlay}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '■ Stop' : '▶ Play'}
        </button>

        <div className="mac-checkbox-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 8px' }}>
          <label className="mac-slider-label" style={{ marginBottom: 2, fontSize: 10 }}>REV</label>
          <input
            type="checkbox"
            checked={isReverse}
            onChange={(e) => setIsReverse(e.target.checked)}
            style={{ margin: 0 }}
            title="Reverse Time"
          />
        </div>

        <div className="mac-slider" style={{ flex: '1 1 200px', minWidth: '150px' }}>
          <span className="mac-slider-label">Speed</span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="mac-slider-value">{speed.toFixed(1)}x ({bpm} BPM)</span>
        </div>

        <div className="mac-slider" style={{ flex: '1 1 200px', minWidth: '150px' }}>
          <span className="mac-slider-label">Volume</span>
          <input
            type="range"
            min="-60"
            max="0"
            step="1"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          />
          <span className="mac-slider-value">{masterVolume}dB</span>
        </div>

        <button
          className="mac-button editor-toggle"
          onClick={toggleEditor}
          title={showEditor ? 'Hide Editor' : 'Show Editor'}
        >
          {showEditor ? 'Hide' : 'Editor'}
        </button>

        <a
          href="https://github.com/vlasvlasvlas/synthclock"
          target="_blank"
          rel="noopener noreferrer"
          className="mac-button"
          style={{
            textDecoration: 'none',
            marginLeft: 'auto', // Push to the right if possible, or just margin
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mac-black)' // Ensure visible text
          }}
        >
          GitHub
        </a>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Clock Panel */}
        <div className="clock-panel mac-window">
          <div className="mac-window-title">
            <span className="mac-window-title-text">SYNTHCLOCK - Tone Clock Instrument</span>
          </div>
          <div className="mac-window-content" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            <ClockDisplay size={280} />
          </div>
        </div>

        {/* Editor Panel */}
        {showEditor && (
          <div className="editor-panel">
            {/* Editor Tabs */}
            <div className="mac-tabs">
              <div
                className={`mac-tab ${editorTab === 'sounds' ? 'active' : ''}`}
                onClick={() => setEditorTab('sounds')}
              >
                Sounds
              </div>
              <div
                className={`mac-tab ${editorTab === 'theme' ? 'active' : ''}`}
                onClick={() => setEditorTab('theme')}
              >
                Theme
              </div>
              <div
                className={`mac-tab ${editorTab === 'theory' ? 'active' : ''}`}
                onClick={() => setEditorTab('theory')}
              >
                Theory
              </div>
              <div
                className={`mac-tab ${editorTab === 'help' ? 'active' : ''}`}
                onClick={() => setEditorTab('help')}
              >
                Help
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {editorTab === 'sounds' && (
                <>
                  {/* Channel Mixer - arriba */}
                  <div style={{ marginBottom: 16, borderBottom: '1px solid', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Mixer</div>
                    <Mixer activeLayer={activeLayer} />
                  </div>
                  {/* Sound Editor - abajo */}
                  <SoundEditor />
                </>
              )}
              {editorTab === 'theme' && <ThemeSelector />}
              {editorTab === 'theory' && <TheoryPanel />}
              {editorTab === 'help' && <HelpPanel />}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar - Compact */}
      <div className="status-bar">
        <span>{theme.name}</span>
        <span>{bpm} BPM</span>
        <span>{isPlaying ? '● Playing' : '○ Stopped'}</span>
      </div>
    </div>
  );
}

// Theory Panel Component
const TheoryPanel = () => {
  const { theme } = useStore();

  return (
    <div className="mac-window" style={{ height: '100%' }}>
      <div className="mac-window-title">
        <span className="mac-window-title-text">Tone Clock Theory</span>
      </div>
      <div className="mac-window-content" style={{ overflow: 'auto' }}>
        <div className="mac-panel">
          <div className="mac-panel-title">The 12 Hours</div>
          <p style={{ marginBottom: 16, fontSize: 12 }}>
            Peter Schat's Tone Clock maps the 12 possible trichords (3-note sets)
            to clock positions. Each hour has a unique intervallic structure.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TONE_CLOCK_HOURS.map(hour => (
              <div
                key={hour.hour}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 4,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  fontSize: 11,
                }}
              >
                <span style={{
                  width: 24,
                  height: 24,
                  background: hour.color,
                  border: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                }}>
                  {hour.hour}
                </span>
                <span style={{ width: 80, fontWeight: 'bold' }}>{hour.name}</span>
                <span style={{ width: 40 }}>{hour.forteNumber}</span>
                <span style={{ width: 50 }}>IPF: [{hour.ipf.join(',')}]</span>
                <span style={{ flex: 1, color: theme.colors.secondary, fontSize: 10 }}>
                  {hour.description.substring(0, 40)}...
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mac-panel">
          <div className="mac-panel-title">How It Works</div>
          <ul style={{ fontSize: 12, paddingLeft: 20 }}>
            <li><strong>Hour Hand (1-12):</strong> Selects the active Tone Clock Hour (trichord type)</li>
            <li><strong>Minute Hand (0-59):</strong> Determines transposition within tessellation</li>
            <li><strong>Second Hand (0-59):</strong> Triggers individual notes from the trichord</li>
          </ul>
        </div>

        <div className="mac-panel">
          <div className="mac-panel-title">Credits</div>
          <p style={{ fontSize: 11 }}>
            Based on <strong>Peter Schat</strong>'s "De Toonklok" (1984) and
            <strong> Jenny McLeod</strong>'s "Chromatic Maps" expansion of the theory.
          </p>
        </div>

        <div className="mac-panel">
          <div className="mac-panel-title">Links</div>
          <ul style={{ fontSize: 11, paddingLeft: 20, listStyle: 'none' }}>
            <li style={{ marginBottom: 4 }}>
              📖 <a
                href="https://en.wikipedia.org/wiki/Tone_clock"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.colors.accent }}
              >
                Wikipedia: Tone Clock
              </a>
            </li>
            <li>
              💻 <a
                href="https://github.com/vlasvlasvlas/synthclock"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.colors.accent }}
              >
                GitHub Repository
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Help Panel Component
const HelpPanel = () => {
  const { theme } = useStore();

  const handleReset = () => {
    if (window.confirm('¿Estás seguro? Esto borrará todos tus ajustes y recargará la página.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="mac-window" style={{ height: '100%' }}>
      <div className="mac-window-title">
        <span className="mac-window-title-text">Help & Settings</span>
      </div>
      <div className="mac-window-content" style={{ overflow: 'auto' }}>
        <div className="mac-panel">
          <div className="mac-panel-title">Quick Guide</div>
          <ul style={{ fontSize: 12, paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>▶ Play:</strong> Start the generative music</li>
            <li><strong>Speed:</strong> Controls how fast time passes (affects tempo)</li>
            <li><strong>Volume:</strong> Master volume control</li>
            <li><strong>Mixer:</strong> Individual volume for each layer (Hour/Min/Sec)</li>
          </ul>
          <p style={{ fontSize: 11, color: theme.colors.secondary }}>
            The clock's hands select musical notes based on the Tone Clock theory.
            Each hour corresponds to a unique trichord (3-note set).
          </p>
        </div>

        <div className="mac-panel">
          <div className="mac-panel-title">Layers</div>
          <ul style={{ fontSize: 12, paddingLeft: 20 }}>
            <li><strong>Hour:</strong> Ambient drone/pad (changes every hour)</li>
            <li><strong>Minute:</strong> Melodic notes (triggers every minute)</li>
            <li><strong>Second:</strong> Rhythmic clicks (triggers every second)</li>
          </ul>
        </div>

        <div className="mac-panel">
          <div className="mac-panel-title">Reset Settings</div>
          <p style={{ fontSize: 11, marginBottom: 12 }}>
            Clear all saved preferences and return to default settings.
          </p>
          <button
            className="mac-button"
            onClick={handleReset}
            style={{
              background: '#ff4444',
              color: 'white',
              border: '2px solid #cc0000',
              width: '100%'
            }}
          >
            🗑️ Reset All to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
