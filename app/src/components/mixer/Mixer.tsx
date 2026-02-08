// Mixer Component - Channel volume and mute controls

import { useStore } from '../../hooks/useStore';
import { audioEngine } from '../../core/audio/AudioEngine';
import { useEffect } from 'react';

export const Mixer = () => {
    const { mixer, setChannelVolume, toggleChannelMute, theme } = useStore();

    // Sync mixer state with audio engine
    useEffect(() => {
        const channels: Array<'hour' | 'minute' | 'second'> = ['hour', 'minute', 'second'];
        channels.forEach(ch => {
            const effectiveVolume = mixer[ch].muted ? -Infinity : mixer[ch].volume;
            audioEngine.updateParameter(ch, 'volume', effectiveVolume);
        });
    }, [mixer]);

    const channels: Array<{ id: 'hour' | 'minute' | 'second'; label: string; short: string }> = [
        { id: 'hour', label: 'Hour (Drone)', short: 'HH' },
        { id: 'minute', label: 'Minute', short: 'MM' },
        { id: 'second', label: 'Second', short: 'SS' },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: 16,
            padding: '8px 16px',
            // background: theme.colors.background, // Removed to fix dark theme issue
            border: `1px solid ${theme.colors.border}`,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {channels.map(ch => (
                <div key={ch.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 60,
                }}>
                    {/* Channel Label */}
                    <span style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        opacity: mixer[ch.id].muted ? 0.4 : 1,
                    }}>
                        {ch.short}
                    </span>

                    {/* Volume Slider (horizontal) */}
                    <input
                        type="range"
                        min="-24"
                        max="6"
                        step="1"
                        value={mixer[ch.id].volume}
                        onChange={(e) => setChannelVolume(ch.id, parseFloat(e.target.value))}
                        style={{
                            width: 60,
                            height: 12,
                            opacity: mixer[ch.id].muted ? 0.4 : 1,
                        }}
                    />

                    {/* Volume Value */}
                    <span style={{
                        fontSize: 9,
                        opacity: mixer[ch.id].muted ? 0.4 : 1,
                    }}>
                        {mixer[ch.id].volume}dB
                    </span>

                    {/* Mute Button */}
                    <button
                        onClick={() => toggleChannelMute(ch.id)}
                        style={{
                            width: 24,
                            height: 20,
                            fontSize: 10,
                            padding: 0,
                            border: `1px solid ${theme.colors.border}`,
                            background: mixer[ch.id].muted ? theme.colors.foreground : theme.colors.background,
                            color: mixer[ch.id].muted ? theme.colors.background : theme.colors.foreground,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                        title={mixer[ch.id].muted ? 'Unmute' : 'Mute'}
                    >
                        M
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Mixer;
