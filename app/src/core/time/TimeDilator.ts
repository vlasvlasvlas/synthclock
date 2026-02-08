// Time Dilator - Virtual clock with speed control

export interface TimeState {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    // Speed multiplier (1.0 = real time, 0.5 = half speed, 2.0 = double)
    speed: number;
    // Whether the clock is running
    isRunning: boolean;
}

export interface TimeEvent {
    type: 'second' | 'minute' | 'hour';
    value: number;
    timestamp: number;
}

type TimeEventCallback = (event: TimeEvent) => void;

class TimeDilator {
    private state: TimeState;
    private lastRealTime: number = 0;
    private accumulatedTime: number = 0;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private callbacks: Map<string, TimeEventCallback> = new Map();
    private lastSecond: number = -1;
    private lastMinute: number = -1;
    private lastHour: number = -1;

    constructor() {
        const now = new Date();
        this.state = {
            hours: now.getHours() % 12 || 12,
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            milliseconds: now.getMilliseconds(),
            speed: 1.0,
            isRunning: false,
        };
    }

    // Get current virtual time
    getTime(): TimeState {
        return { ...this.state };
    }

    // Get angle for each hand (in radians, 0 = 12 o'clock, clockwise)
    getAngles(): { hour: number; minute: number; second: number } {
        const { hours, minutes, seconds, milliseconds } = this.state;

        // Second hand: 60 seconds = 2π, smooth movement with milliseconds
        const secondAngle = ((seconds + milliseconds / 1000) / 60) * Math.PI * 2 - Math.PI / 2;

        // Minute hand: 60 minutes = 2π, influenced by seconds
        const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;

        // Hour hand: 12 hours = 2π, influenced by minutes
        const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;

        return { hour: hourAngle, minute: minuteAngle, second: secondAngle };
    }

    // Set speed multiplier
    setSpeed(speed: number): void {
        this.state.speed = Math.max(0.1, Math.min(10, speed));
    }

    // Get speed
    getSpeed(): number {
        return this.state.speed;
    }

    // Subscribe to time events
    subscribe(id: string, callback: TimeEventCallback): void {
        this.callbacks.set(id, callback);
    }

    // Unsubscribe from time events
    unsubscribe(id: string): void {
        this.callbacks.delete(id);
    }

    // Emit time event
    private emit(event: TimeEvent): void {
        this.callbacks.forEach(callback => callback(event));
    }

    // Update loop - using setInterval instead of requestAnimationFrame
    // so it continues running when tab is not visible (important for audio)
    private update = (): void => {
        if (!this.state.isRunning) return;

        const now = performance.now();
        const deltaReal = now - this.lastRealTime;
        this.lastRealTime = now;

        // Apply speed multiplier to elapsed time
        const deltaVirtual = deltaReal * this.state.speed;
        this.accumulatedTime += deltaVirtual;

        // Update virtual time
        const totalMs = this.accumulatedTime;
        const totalSeconds = Math.floor(totalMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);

        this.state.milliseconds = totalMs % 1000;
        this.state.seconds = totalSeconds % 60;
        this.state.minutes = totalMinutes % 60;
        this.state.hours = (totalHours % 12) || 12;

        // Emit events on transitions
        if (this.state.seconds !== this.lastSecond) {
            this.emit({ type: 'second', value: this.state.seconds, timestamp: now });
            this.lastSecond = this.state.seconds;
        }

        if (this.state.minutes !== this.lastMinute) {
            this.emit({ type: 'minute', value: this.state.minutes, timestamp: now });
            this.lastMinute = this.state.minutes;
        }

        if (this.state.hours !== this.lastHour) {
            this.emit({ type: 'hour', value: this.state.hours, timestamp: now });
            this.lastHour = this.state.hours;
        }
    };

    // Start the clock
    start(): void {
        if (this.state.isRunning) return;

        // Initialize from current real time
        const now = new Date();
        this.state.hours = now.getHours() % 12 || 12;
        this.state.minutes = now.getMinutes();
        this.state.seconds = now.getSeconds();
        this.state.milliseconds = now.getMilliseconds();

        // Calculate total accumulated time
        this.accumulatedTime =
            this.state.hours * 3600000 +
            this.state.minutes * 60000 +
            this.state.seconds * 1000 +
            this.state.milliseconds;

        this.lastRealTime = performance.now();
        this.state.isRunning = true;
        this.lastSecond = this.state.seconds;
        this.lastMinute = this.state.minutes;
        this.lastHour = this.state.hours;

        // Use setInterval instead of requestAnimationFrame
        // so it continues running when tab is not visible
        this.intervalId = setInterval(this.update, 16); // ~60fps
        console.log('TimeDilator started');
    }

    // Stop the clock
    stop(): void {
        this.state.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('TimeDilator stopped');
    }

    // Reset to current real time
    reset(): void {
        const wasRunning = this.state.isRunning;
        this.stop();
        if (wasRunning) {
            this.start();
        }
    }

    // Set a specific time manually
    setTime(hours: number, minutes: number, seconds: number): void {
        this.state.hours = hours % 12 || 12;
        this.state.minutes = minutes % 60;
        this.state.seconds = seconds % 60;
        this.state.milliseconds = 0;

        this.accumulatedTime =
            this.state.hours * 3600000 +
            this.state.minutes * 60000 +
            this.state.seconds * 1000;
    }
}

// Singleton instance
export const timeDilator = new TimeDilator();
export default TimeDilator;
