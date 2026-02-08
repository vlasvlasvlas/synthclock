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

            {/* Tone Clock Info */}
            <ToneClockInfo hour={toneClockState.activeHour} trichord={toneClockState.currentTrichord} />
        </div>
    );
};

// Tone Clock Information Panel
interface ToneClockInfoProps {
    hour: ToneClockHour;
    trichord: number[];
}

const ToneClockInfo = ({ hour, trichord }: ToneClockInfoProps) => {
    const { theme } = useStore();

    return (
        <div className="tone-clock-info" style={{ marginTop: 16, maxWidth: 300 }}>
            <div className="tone-clock-hour">
                Hour {hour.hour}: {hour.name}
            </div>
            <div className="tone-clock-trichord">
                Forte: {hour.forteNumber} | IPF: [{hour.ipf.join(', ')}]
            </div>
            <div className="tone-clock-trichord">
                Current Trichord: {trichord.map(pc => PITCH_CLASSES[pc]).join(' - ')}
            </div>
            <div className="tone-clock-description">
                {hour.description}
            </div>
            <div style={{
                display: 'flex',
                gap: 4,
                marginTop: 8,
                justifyContent: 'center'
            }}>
                {trichord.map((pc, i) => (
                    <div
                        key={i}
                        style={{
                            width: 40,
                            height: 40,
                            border: `2px solid ${theme.colors.border}`,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            background: i === 0 ? theme.colors.foreground : 'transparent',
                            color: i === 0 ? theme.colors.background : theme.colors.foreground,
                        }}
                    >
                        {PITCH_CLASSES[pc]}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClockDisplay;
