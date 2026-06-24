// Clock Display Component - Classic Mac Style

import { useEffect, useState } from 'react';
import { timeDilator } from '../../core/time/TimeDilator';
import { mapTimeToToneClock, PITCH_CLASSES } from '../../core/theory/ToneClock';
import type { ToneClockHour } from '../../core/theory/ToneClock';
import { useStore } from '../../hooks/useStore';

interface ClockDisplayProps {
    size?: number;
}

export const ClockDisplay = ({ size = 300 }: ClockDisplayProps) => {
    const [time, setTime] = useState(timeDilator.getTime());
    const [angles, setAngles] = useState(timeDilator.getAngles());
    const { theme, setActiveHour } = useStore();

    useEffect(() => {
        timeDilator.start();

        const updateTime = () => {
            setTime(timeDilator.getTime());
            setAngles(timeDilator.getAngles());

            // Update active hour based on clock hour
            const hourNumber = timeDilator.getTime().hours;
            setActiveHour(hourNumber === 0 ? 12 : hourNumber);
        };

        // Subscribe to second ticks
        timeDilator.subscribe('clock-display', (event) => {
            if (event.type === 'second') {
                updateTime();
            }
        });

        // Also update on animation frame for smooth hand movement
        let frameId: number;
        const animate = () => {
            updateTime();
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);

        return () => {
            timeDilator.unsubscribe('clock-display');
            cancelAnimationFrame(frameId);
        };
    }, [setActiveHour]);

    // Get Tone Clock state for current time
    const toneClockState = mapTimeToToneClock(time.hours, time.minutes, time.seconds);
    const noteIndex = time.seconds % 3;

    // Convert radians to degrees for CSS rotation
    const radToDeg = (rad: number) => (rad * 180 / Math.PI) + 90;

    // Clock numbers with calculated positions using trigonometry
    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const numberRadius = size * 0.38; // Distance from center to numbers

    const getNumberPosition = (num: number) => {
        // Convert hour to angle (12 o'clock = -90 degrees, going clockwise)
        const angle = ((num % 12) / 12) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * numberRadius + size / 2;
        const y = Math.sin(angle) * numberRadius + size / 2;
        return { x, y };
    };

    return (
        <div className="clock-container">
            {/* Clock Face */}
            <div
                className="clock-face"
                style={{
                    width: size,
                    height: size,
                    borderColor: theme.colors.border,
                    background: theme.colors.background,
                }}
            >
                {/* Numbers - positioned using trigonometry */}
                {numbers.map((num) => {
                    const pos = getNumberPosition(num);
                    return (
                        <span
                            key={num}
                            style={{
                                position: 'absolute',
                                left: pos.x,
                                top: pos.y,
                                transform: 'translate(-50%, -50%)',
                                fontSize: 18,
                                fontWeight: toneClockState.activeHour.hour === num ? 'bold' : 'normal',
                                color: toneClockState.activeHour.hour === num
                                    ? theme.colors.accent
                                    : theme.colors.foreground,
                            }}
                        >
                            {num}
                        </span>
                    );
                })}

                {/* Hour Hand */}
                <div
                    className="clock-hand hour"
                    style={{
                        transform: `rotate(${radToDeg(angles.hour)}deg)`,
                        background: theme.colors.hourHand,
                        height: size * 0.23,
                    }}
                />

                {/* Minute Hand */}
                <div
                    className="clock-hand minute"
                    style={{
                        transform: `rotate(${radToDeg(angles.minute)}deg)`,
                        background: theme.colors.minuteHand,
                        height: size * 0.33,
                    }}
                />

                {/* Second Hand */}
                <div
                    className="clock-hand second"
                    style={{
                        transform: `rotate(${radToDeg(angles.second)}deg)`,
                        background: theme.colors.secondHand,
                        height: size * 0.37,
                    }}
                />

                {/* Center Dot */}
                <div
                    className="clock-center"
                    style={{ background: theme.colors.foreground }}
                />
            </div>

            {/* Time Display */}
            <div style={{
                marginTop: 16,
                fontFamily: theme.fontFamily,
                fontSize: 24,
                fontWeight: 'bold'
            }}>
                {String(time.hours).padStart(2, '0')}:
                {String(time.minutes).padStart(2, '0')}:
                {String(time.seconds).padStart(2, '0')}
            </div>

            {/* Date Display */}
            <div style={{
                textAlign: 'center',
                margin: '8px 0',
                fontFamily: theme.fontFamily,
                color: theme.colors.foreground,
                fontSize: 18,
                fontWeight: 'bold',
                letterSpacing: 2,
            }}>
                {time.day} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][time.month]} {time.year}
            </div>

            {/* Tone Clock Info */}
            <ToneClockInfo hour={toneClockState.activeHour} trichord={toneClockState.currentTrichord} noteIndex={noteIndex} />
        </div>
    );
};

// Tone Clock Information Panel
interface ToneClockInfoProps {
    hour: ToneClockHour;
    trichord: number[];
    noteIndex: number;
}

const ToneClockInfo = ({ hour, trichord, noteIndex }: ToneClockInfoProps) => {
    const { theme } = useStore();

    return (
        <div className="tone-clock-info" style={{ marginTop: 16, maxWidth: 300 }}>
            <div className="tone-clock-hour">
                Hour {hour.hour} — {hour.name}
            </div>
            <div className="tone-clock-description" style={{ marginTop: 2 }}>
                {hour.description}
            </div>

            <div style={{
                borderTop: `1px solid ${theme.colors.border}`,
                marginTop: 8,
                paddingTop: 8,
                fontSize: 11,
                color: theme.colors.foreground,
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: 1,
            }}>
                Cycling note
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                justifyContent: 'center'
            }}>
                {trichord.map((pc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                border: `2px solid ${theme.colors.border}`,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: 16,
                                background: i === noteIndex ? theme.colors.foreground : 'transparent',
                                color: i === noteIndex ? theme.colors.background : theme.colors.foreground,
                                transition: 'background 0.15s, color 0.15s',
                                boxShadow: i === noteIndex ? `0 0 0 2px ${theme.colors.foreground}` : 'none',
                            }}
                        >
                            {PITCH_CLASSES[pc]}
                        </div>
                        {i < trichord.length - 1 && (
                            <span style={{ opacity: 0.4, fontSize: 12 }}>→</span>
                        )}
                    </div>
                ))}
            </div>

            <div style={{
                fontSize: 11,
                opacity: 0.5,
                textAlign: 'center',
                marginTop: 6,
                fontStyle: 'italic',
            }}>
                group changes every 15 min · note cycles each second
            </div>
        </div>
    );
};

export default ClockDisplay;
