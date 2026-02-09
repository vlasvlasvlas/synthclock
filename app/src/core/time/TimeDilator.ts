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
    // Reverse mode
    isReverse: boolean;
    // Date information
    day: number;
    month: number;
    year: number;
    weekday: number;
}

export interface TimeEvent {
    type: 'second' | 'minute' | 'hour';
    value: number;
    timestamp: number;
}

type TimeEventCallback = (event: TimeEvent) => void;

class TimeDilator {
    private state: TimeState = {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        speed: 1.0,
        isRunning: false,
        isReverse: false,
        day: 1,
        month: 0,
        year: 2024,
        weekday: 0
    };
    private lastRealTime: number = 0;
    private currentVirtualTime: number = Date.now();
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private callbacks: Map<string, TimeEventCallback> = new Map();
    private lastSecond: number = -1;
    private lastMinute: number = -1;
    private lastHour: number = -1;

    constructor() {
        this.updateStateFromTimestamp();
    }

    private updateStateFromTimestamp() {
        const date = new Date(this.currentVirtualTime);
        this.state = {
            hours: date.getHours() % 12 || 12, // 12-hour format for Tone Clock
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            milliseconds: date.getMilliseconds(),
            speed: this.state?.speed ?? 1.0,
            isRunning: this.state?.isRunning ?? false,
            isReverse: this.state?.isReverse ?? false,
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            weekday: date.getDay()
        };
    }

    // Get current virtual time
    getTime(): TimeState {
        return { ...this.state };
    }

    // Get current Date object
    getDate(): Date {
        return new Date(this.currentVirtualTime);
    }

    // Get angle for each hand (in radians, 0 = 12 o'clock, clockwise)
    getAngles(): { hour: number; minute: number; second: number } {
        const { hours, minutes, seconds, milliseconds } = this.state;

        // In reverse mode, hands move counter-clockwise naturally as time decreases

        // Second hand: 60 seconds = 2π
        const secondAngle = ((seconds + milliseconds / 1000) / 60) * Math.PI * 2 - Math.PI / 2;

        // Minute hand: 60 minutes = 2π
        const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;

        // Hour hand: 12 hours = 2π
        const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;

        return { hour: hourAngle, minute: minuteAngle, second: secondAngle };
    }

    // Set speed multiplier
    setSpeed(speed: number): void {
        this.state.speed = Math.max(0.1, Math.min(10, speed));
    }

    // Set reverse mode
    setReverse(isReverse: boolean): void {
        this.state.isReverse = isReverse;
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

    // Update loop
    private update = (): void => {
        if (!this.state.isRunning) return;

        const now = performance.now();
        const deltaReal = now - this.lastRealTime;
        this.lastRealTime = now;

        // Apply speed multiplier
        const deltaVirtual = deltaReal * this.state.speed;

        // Apply direction
        if (this.state.isReverse) {
            this.currentVirtualTime -= deltaVirtual;
        } else {
            this.currentVirtualTime += deltaVirtual;
        }

        this.updateStateFromTimestamp();

        // Emit events on transitions
        // Note: checking integers for changes works for both forward and reverse
        if (this.state.seconds !== this.lastSecond) {
            this.emit({ type: 'second', value: this.state.seconds, timestamp: this.currentVirtualTime });
            this.lastSecond = this.state.seconds;
        }

        if (this.state.minutes !== this.lastMinute) {
            this.emit({ type: 'minute', value: this.state.minutes, timestamp: this.currentVirtualTime });
            this.lastMinute = this.state.minutes;
        }

        if (this.state.hours !== this.lastHour) {
            this.emit({ type: 'hour', value: this.state.hours, timestamp: this.currentVirtualTime });
            this.lastHour = this.state.hours;
        }
    };

    // Start the clock
    start(): void {
        if (this.state.isRunning) return;

        // Safety: clean up any orphaned interval before creating a new one
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.lastRealTime = performance.now();
        this.state.isRunning = true;

        // Update tracking vars to avoid immediate trigger
        this.lastSecond = this.state.seconds;
        this.lastMinute = this.state.minutes;
        this.lastHour = this.state.hours;

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
        this.currentVirtualTime = Date.now();
        this.updateStateFromTimestamp();

        if (wasRunning) {
            this.start();
        }
    }

    // Set a specific time manually (preserving date)
    setTime(hours: number, minutes: number, seconds: number): void {
        const date = new Date(this.currentVirtualTime);
        date.setHours(hours); // Note: this uses 0-23, ToneClock uses 1-12. 
        // We might need a way to distinct AM/PM or just assume nearest?
        // For now, let's keep simple hour setting. 
        // If coming from UI 1-12, we might be changing AM/PM inadvertently.
        // Assuming hours is 0-23 for this method.

        date.setMinutes(minutes);
        date.setSeconds(seconds);
        this.currentVirtualTime = date.getTime();
        this.updateStateFromTimestamp();
    }
}

// Singleton instance
export const timeDilator = new TimeDilator();

