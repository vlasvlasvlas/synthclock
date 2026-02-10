// Audio Engine - Synthesizer Factory and Player using Tone.js

import * as Tone from 'tone';
import type { SynthPreset, WaveformType } from './presets';

// Valid oscillator types for Tone.js
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SynthChannel {
    synth: Tone.PolySynth;
    filter: Tone.Filter;
    tremolo: Tone.Tremolo; // New
    delay: Tone.FeedbackDelay;
    reverb: Tone.Reverb;
    gate: Tone.Gate;       // New
    volume: Tone.Volume;
    activeNotes: string[];
    preset: SynthPreset;
}

class AudioEngine {
    private channels: Map<string, SynthChannel> = new Map();
    private isStarted = false;
    private masterVolume: Tone.Volume;
    private debug = import.meta.env.DEV; // Enable debug logging only in dev mode

    // Dedicated MonoSynth for arpeggiator with portamento
    private arpSynth: Tone.MonoSynth | null = null;
    private arpFilter: Tone.Filter | null = null;
    private arpDelay: Tone.FeedbackDelay | null = null;
    private arpReverb: Tone.Reverb | null = null;
    private arpVolume: Tone.Volume | null = null;
    private arpVolumeValue: number = -10; // Cache volume to handle lazy initialization
    private arpPortamento = 0;
    private arpCachedPreset: SynthPreset | null = null; // Cache preset for lazy init

    constructor() {
        this.masterVolume = new Tone.Volume(-6).toDestination();
        this.log('AudioEngine initialized');
    }

    // Debug logging
    private log(message: string, data?: unknown): void {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[AudioEngine] ${message}`, data);
            } else {
                console.log(`[AudioEngine] ${message}`);
            }
        }
    }

    private logError(message: string, error?: unknown): void {
        console.error(`[AudioEngine ERROR] ${message}`, error);
    }

    // Initialize audio context (must be called after user interaction)
    async start(): Promise<void> {
        if (this.isStarted) {
            this.log('Already started');
            return;
        }
        try {
            await Tone.start();
            this.isStarted = true;
            this.log('Audio context started successfully');

            // Setup Media Session API for background playback on mobile
            this.setupMediaSession();
        } catch (error) {
            this.logError('Failed to start audio context', error);
            throw error;
        }
    }

    // Setup Media Session for background audio (iOS/Android)
    private setupMediaSession(): void {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'SynthClock',
                    artist: 'Generative Tone Clock',
                    album: 'Time-based Music',
                });

                // Handle play/pause from lock screen
                navigator.mediaSession.setActionHandler('play', () => {
                    this.log('Media Session: play requested');
                    Tone.getTransport().start();
                });

                navigator.mediaSession.setActionHandler('pause', () => {
                    this.log('Media Session: pause requested');
                    // Don't actually pause - keep playing in background
                });

                this.log('Media Session API configured');
            } catch (error) {
                this.log('Media Session API not fully supported', error);
            }
        }

        // Create a silent audio element to keep audio context alive
        this.createSilentAudioKeepAlive();
    }

    // Create silent audio to prevent iOS from suspending audio context
    private createSilentAudioKeepAlive(): void {
        try {
            // Create oscillator that outputs silence but keeps context alive
            const silentGain = new Tone.Gain(0).toDestination();
            const silentOsc = new Tone.Oscillator(1, 'sine').connect(silentGain);
            silentOsc.start();
            this.log('Silent keep-alive oscillator created');
        } catch (error) {
            this.log('Failed to create keep-alive oscillator', error);
        }
    }

    // Create a PolySynth based on preset configuration
    private createSynth(preset: SynthPreset): Tone.PolySynth {
        const oscillatorType = this.mapWaveform(preset.waveform);

        try {
            const polySynth = new Tone.PolySynth(Tone.Synth, {
                envelope: {
                    attack: preset.envelope.attack,
                    decay: preset.envelope.decay,
                    sustain: preset.envelope.sustain,
                    release: preset.envelope.release,
                },
            });

            // Set oscillator type after creation
            polySynth.set({
                oscillator: { type: oscillatorType },
            });

            this.log(`Synth created with waveform: ${oscillatorType}`);
            return polySynth;
        } catch (error) {
            this.logError('Failed to create synth', error);
            // Return basic synth as fallback
            return new Tone.PolySynth(Tone.Synth);
        }
    }

    // Map our waveform types to Tone.js oscillator types
    private mapWaveform(waveform: WaveformType): OscillatorType {
        const map: Record<WaveformType, OscillatorType> = {
            sine: 'sine',
            square: 'square',
            sawtooth: 'sawtooth',
            triangle: 'triangle',
        };
        return map[waveform] || 'sine';
    }

    // Create a complete channel with effects chain
    async createChannel(channelId: string, preset: SynthPreset): Promise<void> {
        this.log(`Creating channel: ${channelId}`, { preset: preset.name });

        try {
            // Dispose existing channel if any
            this.disposeChannel(channelId);

            const synth = this.createSynth(preset);

            // Create effects chain with safe defaults
            const filter = new Tone.Filter({
                type: preset.filter?.type || 'lowpass',
                frequency: preset.filter?.frequency || 2000,
                Q: preset.filter?.resonance || 1,
            });

            // Reverb - use generate() for proper initialization
            const reverb = new Tone.Reverb({
                decay: Math.max(0.1, Math.min(10, preset.effects?.reverb ? 4 : 0.1)),
                wet: Math.max(0, Math.min(1, preset.effects?.reverb || 0)),
            });

            // Initialize reverb (it needs to generate impulse response)
            try {
                await reverb.generate();
                this.log(`Reverb initialized for channel ${channelId}`);
            } catch (error) {
                this.logError(`Failed to initialize reverb for ${channelId}`, error);
            }

            // Tremolo
            const tremolo = new Tone.Tremolo({
                frequency: 9, // Fast tremolo
                depth: Math.max(0, Math.min(1, preset.effects?.tremolo || 0)),
                spread: 180,
            }).start();
            // Start tremolo LFO 

            // Noise Gate (Threshold)
            const gate = new Tone.Gate({
                threshold: Math.max(-100, Math.min(0, preset.effects?.noiseGate || -100)),
                smoothing: 0.1,
            });

            const delay = new Tone.FeedbackDelay({
                delayTime: Math.max(0.01, Math.min(1, preset.effects?.delayTime || 0.25)),
                feedback: Math.max(0, Math.min(0.9, preset.effects?.delayFeedback ?? 0.6)),
                wet: Math.max(0, Math.min(1, preset.effects?.delay || 0)),
            });

            const volume = new Tone.Volume(preset.volume || -12);

            // Connect chain: synth -> filter -> gate -> tremolo -> delay -> reverb -> volume -> master
            synth.connect(filter);
            filter.connect(gate);
            gate.connect(tremolo);
            tremolo.connect(delay);
            delay.connect(reverb);
            reverb.connect(volume);
            volume.connect(this.masterVolume);

            // Store channel
            this.channels.set(channelId, {
                synth,
                filter,
                tremolo,
                delay,
                reverb,
                gate,
                volume,
                activeNotes: [],
                preset,
            });

            this.log(`Channel ${channelId} created successfully with preset: ${preset.name}`);
        } catch (error) {
            this.logError(`Failed to create channel ${channelId}`, error);
        }
    }

    // Play a note on a channel (attack + release after duration)
    playNote(channelId: string, note: string, duration: string = '4n'): void {
        const channel = this.channels.get(channelId);
        if (!channel) {
            this.log(`Channel ${channelId} not found`);
            return;
        }
        if (!this.isStarted) {
            this.log('Audio not started yet');
            return;
        }

        try {
            channel.synth.triggerAttackRelease(note, duration);
            this.log(`Playing note ${note} on ${channelId} for ${duration}`);
        } catch (error) {
            this.logError(`Failed to play note ${note} on ${channelId}`, error);
        }
    }

    // Play multiple notes as a chord
    playChord(channelId: string, notes: string[], duration: string = '4n'): void {
        const channel = this.channels.get(channelId);
        if (!channel || !this.isStarted) return;

        try {
            channel.synth.triggerAttackRelease(notes, duration);
            this.log(`Playing chord on ${channelId}:`, notes);
        } catch (error) {
            this.logError(`Failed to play chord on ${channelId}`, error);
        }
    }

    // Set arpeggiator portamento time (glissando)
    setArpPortamento(timeInSeconds: number): void {
        this.arpPortamento = timeInSeconds;
        if (this.arpSynth) {
            this.arpSynth.portamento = timeInSeconds;
            this.log(`Arp portamento set to ${timeInSeconds}s`);
        }
    }

    // Set arpeggiator volume
    setArpVolume(volumeDb: number): void {
        // Always update the cached value
        this.arpVolumeValue = volumeDb <= -60 ? -Infinity : Math.max(-60, Math.min(6, volumeDb));

        if (this.arpVolume) {
            this.arpVolume.volume.value = this.arpVolumeValue;
            this.log(`Arp volume set to ${this.arpVolumeValue}dB`);
        } else {
            this.log(`Arp volume cached to ${this.arpVolumeValue}dB (node not ready)`);
        }
    }

    // Play a note on the dedicated arpeggiator synth with glissando
    playArpNote(note: string, duration: string = '16n'): void {
        if (!this.isStarted) return;

        // Create arpSynth + effects chain on first use (lazy init)
        if (!this.arpSynth) {
            // Build chain: MonoSynth → Filter → Delay → Reverb → Volume → Master
            this.arpVolume = new Tone.Volume(this.arpVolumeValue).connect(this.masterVolume);
            this.arpReverb = new Tone.Reverb({ decay: 1.5, wet: 0 }).connect(this.arpVolume);
            this.arpDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 }).connect(this.arpReverb);
            this.arpFilter = new Tone.Filter({ frequency: 2000, type: 'lowpass', Q: 1 }).connect(this.arpDelay);

            this.arpSynth = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
                portamento: this.arpPortamento,
            }).connect(this.arpFilter);

            this.log(`Arp MonoSynth created with full FX chain, volume ${this.arpVolumeValue}dB`);

            // Apply cached preset if we have one
            if (this.arpCachedPreset) {
                this.updateArpParams(this.arpCachedPreset);
            }
        }

        try {
            // MonoSynth handles portamento automatically between notes
            this.arpSynth.triggerAttackRelease(note, duration);
        } catch (error) {
            this.logError(`Failed to play arp note ${note}`, error);
        }
    }

    // Trigger attack (note on) - for sustained notes/drones
    triggerAttack(channelId: string, note: string): void {
        const channel = this.channels.get(channelId);
        if (!channel || !this.isStarted) return;

        try {
            channel.synth.triggerAttack(note);
            channel.activeNotes.push(note);
            this.log(`Attack ${note} on ${channelId}`);
        } catch (error) {
            this.logError(`Failed to trigger attack on ${channelId}`, error);
        }
    }

    // Trigger attack for multiple notes (chord drone)
    triggerAttackChord(channelId: string, notes: string[]): void {
        const channel = this.channels.get(channelId);
        if (!channel || !this.isStarted) {
            this.log(`Cannot trigger chord - channel ${channelId} not ready`);
            return;
        }

        try {
            channel.synth.triggerAttack(notes);
            channel.activeNotes.push(...notes);
            this.log(`Attack chord on ${channelId}:`, notes);
        } catch (error) {
            this.logError(`Failed to trigger attack chord on ${channelId}`, error);
        }
    }

    // Trigger release (note off) - releases all active notes
    triggerRelease(channelId: string): void {
        const channel = this.channels.get(channelId);
        if (!channel || !this.isStarted) return;

        try {
            if (channel.activeNotes.length > 0) {
                channel.synth.triggerRelease(channel.activeNotes);
                this.log(`Released ${channel.activeNotes.length} notes on ${channelId}`);
                channel.activeNotes = [];
            }
        } catch (error) {
            this.logError(`Failed to trigger release on ${channelId}`, error);
        }
    }

    // Release specific notes
    triggerReleaseNotes(channelId: string, notes: string[]): void {
        const channel = this.channels.get(channelId);
        if (!channel || !this.isStarted) return;

        try {
            channel.synth.triggerRelease(notes);
            channel.activeNotes = channel.activeNotes.filter(n => !notes.includes(n));
        } catch (error) {
            this.logError(`Failed to release notes on ${channelId}`, error);
        }
    }

    // Update preset for a channel
    async updateChannel(channelId: string, preset: SynthPreset): Promise<void> {
        await this.createChannel(channelId, preset);
    }

    // Update individual parameter in real-time
    updateParameter(
        channelId: string,
        param: 'filterFreq' | 'filterRes' | 'reverb' | 'delay' | 'volume',
        value: number
    ): void {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        try {
            const safeValue = Math.max(0, value);

            switch (param) {
                case 'filterFreq':
                    channel.filter.frequency.value = Math.max(20, Math.min(20000, safeValue));
                    break;
                case 'filterRes':
                    channel.filter.Q.value = Math.max(0, Math.min(20, safeValue));
                    break;
                case 'reverb':
                    channel.reverb.wet.value = Math.max(0, Math.min(1, safeValue));
                    break;
                case 'delay':
                    channel.delay.wet.value = Math.max(0, Math.min(1, safeValue));
                    break;
                case 'volume':
                    // If value is at minimum (-60 or lower), mute completely with -Infinity
                    channel.volume.volume.value = value <= -60 ? -Infinity : Math.max(-60, Math.min(6, value));
                    break;
            }
            this.log(`Updated ${param} on ${channelId} to ${value}`);
        } catch (error) {
            this.logError(`Failed to update ${param} on ${channelId}`, error);
        }
    }

    // Update synth parameters in real-time WITHOUT recreating the channel
    // This keeps the sound playing while updating parameters
    updateSynthParams(channelId: string, preset: SynthPreset): void {
        const channel = this.channels.get(channelId);
        if (!channel) {
            this.log(`Channel ${channelId} not found for update`);
            return;
        }

        try {
            // Update oscillator type
            const oscillatorType = this.mapWaveform(preset.waveform);
            channel.synth.set({
                oscillator: { type: oscillatorType },
            });

            // Update envelope
            channel.synth.set({
                envelope: {
                    attack: preset.envelope.attack,
                    decay: preset.envelope.decay,
                    sustain: preset.envelope.sustain,
                    release: preset.envelope.release,
                },
            });

            // Update filter
            channel.filter.frequency.value = preset.filter?.frequency || 2000;
            channel.filter.Q.value = preset.filter?.resonance || 1;
            if (preset.filter?.type) {
                channel.filter.type = preset.filter.type;
            }

            // Update effects wet levels (without recreating)
            channel.reverb.wet.value = Math.max(0, Math.min(1, preset.effects?.reverb || 0));
            channel.delay.wet.value = Math.max(0, Math.min(1, preset.effects?.delay || 0));

            // Update tremolo
            channel.tremolo.depth.value = Math.max(0, Math.min(1, preset.effects?.tremolo || 0));
            // Ensure wetter is 1 for tremolo effect (controlled by depth) or handle wet mix
            channel.tremolo.wet.value = channel.tremolo.depth.value > 0 ? 1 : 0;

            // Update gate
            const gateThresh = Math.max(-100, Math.min(0, preset.effects?.noiseGate || -100));
            // @ts-ignore - Tone.js types might be slightly off here depending on version, treating as property to be safe or signal if ignored
            if (channel.gate.threshold instanceof Tone.Signal) {
                channel.gate.threshold.value = gateThresh;
            } else {
                // @ts-ignore
                channel.gate.threshold = gateThresh;
            }

            // Update delay time and feedback smoothly
            if (preset.effects?.delayTime) {
                channel.delay.delayTime.value = Math.max(0.01, Math.min(1, preset.effects.delayTime));
            }
            // Update feedback for more/less echoes
            channel.delay.feedback.value = Math.max(0, Math.min(0.9, preset.effects?.delayFeedback ?? 0.6));

            // Update stored preset reference
            channel.preset = preset;

            this.log(`Updated synth params for ${channelId} without recreation`);
        } catch (error) {
            this.logError(`Failed to update synth params for ${channelId}`, error);
        }
    }

    // Update volume for a specific channel (used for Mixer)
    setChannelVolume(channelId: string, volume: number): void {
        const channel = this.channels.get(channelId);
        // Special case for Arp which is handled separately, but let's support standard channels here
        if (!channel) return;

        try {
            // If volume is -Infinity, we can mute. Tone.Volume handles -Infinity as mute.
            // Ramp for smooth transition
            channel.volume.volume.rampTo(volume, 0.1);
            this.log(`Set ${channelId} volume to ${volume}`);
        } catch (error) {
            this.logError(`Failed to set volume for ${channelId}`, error);
        }
    }

    // Update Arp Synth parameters from preset
    updateArpParams(preset: SynthPreset): void {
        // Always cache the preset for lazy init
        this.arpCachedPreset = preset;

        if (!this.arpSynth) {
            this.log('Arp params cached (synth not created yet)');
            return;
        }

        try {
            // Update oscillator type
            const oscillatorType = this.mapWaveform(preset.waveform);
            this.arpSynth.set({
                oscillator: { type: oscillatorType },
            });

            // Update envelope
            this.arpSynth.set({
                envelope: {
                    attack: preset.envelope.attack,
                    decay: preset.envelope.decay,
                    sustain: preset.envelope.sustain,
                    release: preset.envelope.release,
                },
            });

            // Update external filter node (our arpFilter, not MonoSynth's internal)
            if (this.arpFilter) {
                this.arpFilter.frequency.value = preset.filter?.frequency || 2000;
                this.arpFilter.Q.value = preset.filter?.resonance || 1;
                if (preset.filter?.type) {
                    this.arpFilter.type = preset.filter.type;
                }
            }

            // Update effects
            if (this.arpReverb) {
                this.arpReverb.wet.value = Math.max(0, Math.min(1, preset.effects?.reverb || 0));
            }
            if (this.arpDelay) {
                this.arpDelay.wet.value = Math.max(0, Math.min(1, preset.effects?.delay || 0));
            }

            this.log('Updated Arp synth params + FX');
        } catch (error) {
            this.logError('Failed to update Arp params', error);
        }
    }

    // Dispose a channel
    disposeChannel(channelId: string): void {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        try {
            // Release any active notes first
            if (channel.activeNotes.length > 0) {
                try {
                    channel.synth.triggerRelease(channel.activeNotes);
                } catch (e) {
                    // Ignore release errors during disposal
                }
            }

            channel.synth.dispose();
            channel.filter.dispose();
            channel.tremolo.dispose();
            channel.gate.dispose();
            channel.reverb.dispose();
            channel.delay.dispose();
            channel.volume.dispose();

            this.channels.delete(channelId);
            this.log(`Channel ${channelId} disposed`);
        } catch (error) {
            this.logError(`Error disposing channel ${channelId}`, error);
        }
    }

    // Dispose all channels
    disposeAll(): void {
        this.channels.forEach((_, id) => this.disposeChannel(id));
    }

    // Set master volume
    setMasterVolume(db: number): void {
        try {
            this.masterVolume.volume.value = Math.max(-60, Math.min(6, db));
            this.log(`Master volume set to ${db}dB`);
        } catch (error) {
            this.logError('Failed to set master volume', error);
        }
    }

    // Get current time from Tone.js transport
    getTime(): number {
        return Tone.now();
    }

    // Check if audio is started
    getIsStarted(): boolean {
        return this.isStarted;
    }

    // Get channel info for debugging
    getChannelInfo(channelId: string): { activeNotes: string[], preset: string } | null {
        const channel = this.channels.get(channelId);
        if (!channel) return null;
        return {
            activeNotes: [...channel.activeNotes],
            preset: channel.preset.name,
        };
    }
}

// Singleton instance
export const audioEngine = new AudioEngine();
export default AudioEngine;
