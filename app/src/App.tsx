// Main App Component

import { useEffect, useState } from 'react';
import './index.css';
import { ClockDisplay } from './components/clock/ClockDisplay';
import { SoundEditor } from './components/editors/SoundEditor';
import { ThemeSelector } from './components/editors/ThemeSelector';
import { Mixer } from './components/mixer/Mixer';
import { useStore } from './hooks/useStore';
import { audioEngine } from './core/audio/AudioEngine';
import { timeDilator } from './core/time/TimeDilator';
import { mapTimeToToneClock, pitchClassToNote, TONE_CLOCK_HOURS } from './core/theory/ToneClock';

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
  } = useStore();

  const { background } = useStore();

  // Calculate BPM from speed (base 60 BPM at 1x speed)
  const bpm = Math.round(60 * speed);

  const [audioStarted, setAudioStarted] = useState(false);

  // Update audio channels when presets change (without recreating = no sound cut)
  useEffect(() => {
    if (audioStarted) {
      // Use updateSynthParams to change parameters without recreating channels
      // This keeps the drone and other sounds playing smoothly
      audioEngine.updateSynthParams('hour', hourPreset);
      audioEngine.updateSynthParams('minute', minutePreset);
      audioEngine.updateSynthParams('second', secondPreset);
    }
  }, [hourPreset, minutePreset, secondPreset, audioStarted]);

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
      }

      if (event.type === 'minute') {
        // Play minute layer sound - melodic note
        const note = pitchClassToNote(toneState.currentTrichord[1], 4);
        audioEngine.playNote('minute', note, '2n');
      }

      if (event.type === 'hour') {
        // Hour changed - update the drone with new trichord
        stopHourDrone();
        setTimeout(() => startHourDrone(), 100);
      }
    };

    timeDilator.subscribe('app-audio', handleTimeEvent);

    return () => {
      timeDilator.unsubscribe('app-audio');
    };
  }, [isPlaying, audioStarted]);

  // Update speed
  useEffect(() => {
    timeDilator.setSpeed(speed);
  }, [speed]);

  // Update master volume
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

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
      className="app-container"
      style={{
        background: background.color || theme.colors.background,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* Toolbar */}
      <div className="toolbar">
        <button className={`mac-button ${isPlaying ? 'primary' : ''}`} onClick={handlePlay}>
          {isPlaying ? '■ Stop' : '▶ Play'}
        </button>

        <div className="mac-slider" style={{ flex: 1, maxWidth: 200 }}>
          <span className="mac-slider-label">Speed</span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="mac-slider-value">{speed.toFixed(1)}x ({bpm} BPM)</span>
        </div>

        <div className="mac-slider" style={{ flex: 1, maxWidth: 200 }}>
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

        <button className="mac-button" onClick={toggleEditor}>
          {showEditor ? 'Hide Editor' : 'Show Editor'}
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
            justifyContent: 'center',
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
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {editorTab === 'sounds' && (
                <>
                  {/* Channel Mixer - arriba */}
                  <div style={{ marginBottom: 16, borderBottom: '1px solid', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Mixer</div>
                    <Mixer />
                  </div>
                  {/* Sound Editor - abajo */}
                  <SoundEditor />
                </>
              )}
              {editorTab === 'theme' && <ThemeSelector />}
              {editorTab === 'theory' && <TheoryPanel />}
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

export default App;
