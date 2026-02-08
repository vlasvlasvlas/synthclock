// Mixer Component - Channel volume and mute controls

import { useStore } from '../../hooks/useStore';
import { audioEngine } from '../../core/audio/AudioEngine';
import { useEffect, useRef } from 'react';

export const Mixer = () => {
    const { mixer, setChannelVolume, toggleChannelMute, theme } = useStore();

    // Track previous values to avoid unnecessary updates
    const prevMixerRef = useRef<typeof mixer | null>(null);

    // Sync mixer state with audio engine (only when values actually change)
    useEffect(() => {
        const channels: Array<'hour' | 'minute' | 'second'> = ['hour', 'minute', 'second'];

        // Skip if this is the first render (volumes already set by audioEngine initial state)
        if (prevMixerRef.current === null) {
            prevMixerRef.current = mixer;
            return;
        }

        // Only update channels that actually changed
        channels.forEach(ch => {
            const prev = prevMixerRef.current?.[ch];
            const curr = mixer[ch];

            if (!prev || prev.volume !== curr.volume || prev.muted !== curr.muted) {
                const effectiveVolume = curr.muted ? -Infinity : curr.volume;
                audioEngine.updateParameter(ch, 'volume', effectiveVolume);
            }
        });

        prevMixerRef.current = mixer;
    }, [mixer]);

    const channels: Array<{ id: 'hour' | 'minute' | 'second' | 'arp'; label: string; short: string }> = [
        { id: 'hour', label: 'Hour (Drone)', short: 'HH' },
        { id: 'minute', label: 'Minute', short: 'MM' },
        { id: 'second', label: 'Second', short: 'SS' },
        { id: 'arp', label: 'Arpeggiator', short: 'ARP' },
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
            {channels.map(ch => {
                const channelState = mixer[ch.id] || { volume: -10, muted: false };

                return (
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
                            opacity: channelState.muted ? 0.4 : 1,
                        }}>
                            {ch.short}
                        </span>

                        {/* Volume Slider (horizontal) */}
                        <input
                            type="range"
                            min="-60"
                            max="6"
                            step="1"
                            value={channelState.volume}
                            onChange={(e) => setChannelVolume(ch.id, parseFloat(e.target.value))}
                            style={{
                                width: 60,
                                height: 12,
                                opacity: channelState.muted ? 0.4 : 1,
                            }}
                        />

                        {/* Volume Value */}
                        <span style={{
                            fontSize: 9,
                            opacity: channelState.muted ? 0.4 : 1,
                        }}>
                            {channelState.volume}dB
                        </span>

                        {/* Mute Button */}
                        <button
                            onClick={() => toggleChannelMute(ch.id)}
                            style={{
                                width: 24,
                                height: 20,
                                fontSize: 10,
                                padding: 0,
                                background: channelState.muted ? theme.colors.primary : 'transparent',
                                color: channelState.muted ? theme.colors.background : theme.colors.foreground,
                                border: `1px solid ${theme.colors.border}`,
                            }}
                        >
                            {channelState.muted ? 'M' : 'S'}
                        </button>
                    </div>
                )
            })}
        </div>
    );
};

export default Mixer;
