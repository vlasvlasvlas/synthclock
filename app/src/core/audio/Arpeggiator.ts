// Arpeggiator Module - Pattern-based note sequencing with glissando support

import * as Tone from 'tone';

export type ArpPattern = 'up' | 'down' | 'upDown' | 'downUp' | 'random';
export type ArpRate = '1n' | '2n' | '4n' | '8n' | '16n';

export interface ArpeggiatorSettings {
    enabled: boolean;
    pattern: ArpPattern;
    rate: ArpRate;
    glissando: number; // Portamento time in ms (0-2000)
}

export const defaultArpSettings: ArpeggiatorSettings = {
    enabled: false,
    pattern: 'up',
    rate: '8n',
    glissando: 0,
};

type NoteCallback = (note: string, time: number) => void;

class Arpeggiator {
    private pattern: Tone.Pattern<string> | null = null;
    private notes: string[] = [];
    private settings: ArpeggiatorSettings = { ...defaultArpSettings };
    private callback: NoteCallback | null = null;
    private isRunning = false;

    constructor() {
        console.log('[Arpeggiator] Initialized');
    }

    // Set the notes to arpeggiate
    setNotes(notes: string[]): void {
        this.notes = [...notes];
        if (this.pattern && this.isRunning) {
            // Update pattern with new notes
            this.restart();
        }
        console.log('[Arpeggiator] Notes set:', notes);
    }

    // Set callback for when a note should play
    setCallback(callback: NoteCallback): void {
        this.callback = callback;
    }

    // Update settings
    updateSettings(settings: Partial<ArpeggiatorSettings>): void {
        const wasEnabled = this.settings.enabled;
        this.settings = { ...this.settings, ...settings };

        console.log('[Arpeggiator] Settings updated:', this.settings);

        // Handle enable/disable
        if (settings.enabled !== undefined) {
            if (settings.enabled && !wasEnabled) {
                this.start();
            } else if (!settings.enabled && wasEnabled) {
                this.stop();
            }
        }

        // If pattern or rate changed while running, restart
        if (this.isRunning && (settings.pattern || settings.rate)) {
            this.restart();
        }
    }

    // Get current settings
    getSettings(): ArpeggiatorSettings {
        return { ...this.settings };
    }

    // Get glissando time for synth portamento
    getGlissandoTime(): number {
        return this.settings.glissando / 1000; // Convert ms to seconds
    }

    // Generate sequence based on pattern
    private generateSequence(): string[] {
        if (this.notes.length === 0) return [];

        const sorted = [...this.notes].sort(); // Sort by pitch

        switch (this.settings.pattern) {
            case 'up':
                return sorted;

            case 'down':
                return [...sorted].reverse();

            case 'upDown':
                if (sorted.length <= 2) return sorted;
                // Remove last note to avoid double-playing at peaks
                const upDown = [...sorted, ...sorted.slice(1, -1).reverse()];
                return upDown;

            case 'downUp':
                if (sorted.length <= 2) return sorted.reverse();
                const reversed = [...sorted].reverse();
                const downUp = [...reversed, ...reversed.slice(1, -1).reverse()];
                return downUp;

            case 'random':
                // Shuffle the array
                const shuffled = [...sorted];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled;

            default:
                return sorted;
        }
    }

    // Start the arpeggiator
    start(): void {
        if (this.notes.length === 0 || !this.settings.enabled) {
            console.log('[Arpeggiator] Cannot start: no notes or disabled');
            return;
        }

        this.stop(); // Clean up any existing pattern

        const sequence = this.generateSequence();
        console.log('[Arpeggiator] Starting with sequence:', sequence);

        this.pattern = new Tone.Pattern(
            (time, note) => {
                if (this.callback && note) {
                    this.callback(note, time);
                }
            },
            sequence,
            this.settings.pattern === 'random' ? 'random' : 'up' // Tone.js pattern type
        );

        this.pattern.interval = this.settings.rate;
        this.pattern.start(0);

        // Ensure transport is running
        if (Tone.getTransport().state !== 'started') {
            Tone.getTransport().start();
        }

        this.isRunning = true;
        console.log('[Arpeggiator] Started');
    }

    // Stop the arpeggiator
    stop(): void {
        if (this.pattern) {
            this.pattern.stop();
            this.pattern.dispose();
            this.pattern = null;
        }
        this.isRunning = false;
        console.log('[Arpeggiator] Stopped');
    }

    // Restart with current settings
    private restart(): void {
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    // Clean up
    dispose(): void {
        this.stop();
        this.callback = null;
    }
}

// Singleton instance
export const arpeggiator = new Arpeggiator();
export default Arpeggiator;
