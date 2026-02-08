// Audio Types and Synthesizer Definitions

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type SynthesisType = 'subtractive' | 'fm' | 'am' | 'additive';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface ADSREnvelope {
    attack: number;   // 0-5 seconds
    decay: number;    // 0-5 seconds
    sustain: number;  // 0-1 (percentage)
    release: number;  // 0-10 seconds
}

export interface FilterSettings {
    type: FilterType;
    frequency: number;  // 20-20000 Hz
    resonance: number;  // 0-20 Q factor
}

export interface EffectsSettings {
    reverb: number;         // 0-1 wet/dry
    delay: number;          // 0-1 wet/dry
    delayTime: number;      // 0-2 seconds
    delayFeedback?: number; // 0-0.9 (repetitions - higher = more echoes, default 0.6)
    chorus: number;         // 0-1 depth
    distortion: number;     // 0-1 amount
    tremolo?: number;       // 0-1 amount (depth)
    noiseGate?: number;     // -100 to 0 (threshold in dB)
}

export interface SynthPreset {
    id: string;
    name: string;
    description: string;
    layer: 'hour' | 'minute' | 'second';
    waveform: WaveformType;
    synthesisType: SynthesisType;
    envelope: ADSREnvelope;
    filter: FilterSettings;
    effects: EffectsSettings;
    detune: number;      // -100 to 100 cents
    volume: number;      // -60 to 0 dB
    // FM-specific
    modulationIndex?: number;
    harmonicity?: number;
}

// Default ADSR envelopes for different layers
export const defaultEnvelopes: Record<string, ADSREnvelope> = {
    hour: { attack: 2.0, decay: 1.0, sustain: 0.7, release: 3.0 },
    minute: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.8 },
    second: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 },
};

// 15 Base Presets (5 per layer)
export const presets: SynthPreset[] = [
    // === HOUR LAYER (Pads/Drones) ===
    {
        id: 'H01',
        name: 'Ethereal Sine',
        description: 'Pure sine wave with massive reverb',
        layer: 'hour',
        waveform: 'sine',
        synthesisType: 'subtractive',
        envelope: { attack: 3.0, decay: 1.0, sustain: 0.8, release: 4.0 },
        filter: { type: 'lowpass', frequency: 2000, resonance: 1 },
        effects: { reverb: 0.8, delay: 0.3, delayTime: 0.5, chorus: 0.2, distortion: 0 },
        detune: 0,
        volume: -12,
    },
    {
        id: 'H02',
        name: 'Blade Runner',
        description: 'Vangelis-style sawtooth with slow filter sweep',
        layer: 'hour',
        waveform: 'sawtooth',
        synthesisType: 'subtractive',
        envelope: { attack: 2.5, decay: 2.0, sustain: 0.6, release: 5.0 },
        filter: { type: 'lowpass', frequency: 800, resonance: 8 },
        effects: { reverb: 0.6, delay: 0.4, delayTime: 0.375, chorus: 0.3, distortion: 0.1 },
        detune: 5,
        volume: -15,
    },
    {
        id: 'H03',
        name: 'Glass Pad',
        description: 'Crystalline FM synthesis, cold and metallic',
        layer: 'hour',
        waveform: 'sine',
        synthesisType: 'fm',
        envelope: { attack: 1.5, decay: 1.5, sustain: 0.5, release: 3.0 },
        filter: { type: 'highpass', frequency: 200, resonance: 2 },
        effects: { reverb: 0.7, delay: 0.2, delayTime: 0.25, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -14,
        modulationIndex: 10,
        harmonicity: 3,
    },
    {
        id: 'H04',
        name: 'Vocal Choir',
        description: 'Synthetic choir "Ooh" with formant filtering',
        layer: 'hour',
        waveform: 'sawtooth',
        synthesisType: 'subtractive',
        envelope: { attack: 2.0, decay: 1.0, sustain: 0.7, release: 2.5 },
        filter: { type: 'bandpass', frequency: 1200, resonance: 5 },
        effects: { reverb: 0.5, delay: 0.15, delayTime: 0.3, chorus: 0.4, distortion: 0 },
        detune: -3,
        volume: -13,
    },
    {
        id: 'H05',
        name: 'Broken Tape',
        description: 'Lo-fi tape degradation with pitch wobble',
        layer: 'hour',
        waveform: 'triangle',
        synthesisType: 'subtractive',
        envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 2.0 },
        filter: { type: 'lowpass', frequency: 3000, resonance: 2 },
        effects: { reverb: 0.3, delay: 0.6, delayTime: 0.15, chorus: 0.5, distortion: 0.3 },
        detune: 8,
        volume: -16,
    },

    // === MINUTE LAYER (Leads/Arps) ===
    {
        id: 'M01',
        name: 'Pluck Analog',
        description: 'Sweet triangle wave pluck, music box style',
        layer: 'minute',
        waveform: 'triangle',
        synthesisType: 'subtractive',
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.0, release: 0.8 },
        filter: { type: 'lowpass', frequency: 4000, resonance: 3 },
        effects: { reverb: 0.4, delay: 0.3, delayTime: 0.2, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -10,
    },
    {
        id: 'M02',
        name: 'FM Bell',
        description: 'Classic DX7 electric piano bell',
        layer: 'minute',
        waveform: 'sine',
        synthesisType: 'fm',
        envelope: { attack: 0.005, decay: 1.2, sustain: 0.0, release: 1.5 },
        filter: { type: 'highpass', frequency: 100, resonance: 1 },
        effects: { reverb: 0.5, delay: 0.2, delayTime: 0.333, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -8,
        modulationIndex: 15,
        harmonicity: 2,
    },
    {
        id: 'M03',
        name: 'Acid Line',
        description: 'Aggressive TB-303 style with high resonance',
        layer: 'minute',
        waveform: 'square',
        synthesisType: 'subtractive',
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.2 },
        filter: { type: 'lowpass', frequency: 1500, resonance: 15 },
        effects: { reverb: 0.2, delay: 0.4, delayTime: 0.125, chorus: 0, distortion: 0.4 },
        detune: 0,
        volume: -12,
    },
    {
        id: 'M04',
        name: 'Soft Keys',
        description: 'Warm electric piano, Rhodes-like',
        layer: 'minute',
        waveform: 'sine',
        synthesisType: 'fm',
        envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.0 },
        filter: { type: 'lowpass', frequency: 3500, resonance: 1 },
        effects: { reverb: 0.3, delay: 0.1, delayTime: 0.25, chorus: 0.3, distortion: 0 },
        detune: 2,
        volume: -9,
        modulationIndex: 5,
        harmonicity: 1,
    },
    {
        id: 'M05',
        name: 'BitCrush',
        description: '8-bit Nintendo chiptune style',
        layer: 'minute',
        waveform: 'square',
        synthesisType: 'subtractive',
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 },
        filter: { type: 'highpass', frequency: 500, resonance: 2 },
        effects: { reverb: 0.1, delay: 0.5, delayTime: 0.1, chorus: 0, distortion: 0.6 },
        detune: 0,
        volume: -14,
    },

    // === SECOND LAYER (Percussion/Glitches) ===
    {
        id: 'S01',
        name: 'Micro Click',
        description: 'Ultra-short white noise burst (Alva Noto style)',
        layer: 'second',
        waveform: 'square', // Will use noise in actual implementation
        synthesisType: 'subtractive',
        envelope: { attack: 0.001, decay: 0.02, sustain: 0.0, release: 0.01 },
        filter: { type: 'highpass', frequency: 5000, resonance: 1 },
        effects: { reverb: 0.1, delay: 0, delayTime: 0, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -18,
    },
    {
        id: 'S02',
        name: 'Static Dust',
        description: 'Random vinyl crackles and pops',
        layer: 'second',
        waveform: 'square', // Noise-based
        synthesisType: 'subtractive',
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.0, release: 0.03 },
        filter: { type: 'bandpass', frequency: 3000, resonance: 3 },
        effects: { reverb: 0.05, delay: 0, delayTime: 0, chorus: 0, distortion: 0.2 },
        detune: 0,
        volume: -22,
    },
    {
        id: 'S03',
        name: 'Sonar Ping',
        description: 'Submarine radar ping with long delay tail',
        layer: 'second',
        waveform: 'sine',
        synthesisType: 'subtractive',
        envelope: { attack: 0.005, decay: 0.8, sustain: 0.0, release: 1.5 },
        filter: { type: 'bandpass', frequency: 2000, resonance: 10 },
        effects: { reverb: 0.6, delay: 0.7, delayTime: 0.5, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -15,
    },
    {
        id: 'S04',
        name: 'Glitch Hop',
        description: 'Granular fragments with random pitch',
        layer: 'second',
        waveform: 'sawtooth',
        synthesisType: 'subtractive',
        envelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05 },
        filter: { type: 'lowpass', frequency: 8000, resonance: 5 },
        effects: { reverb: 0.2, delay: 0.3, delayTime: 0.0625, chorus: 0, distortion: 0.3 },
        detune: 0,
        volume: -16,
    },
    {
        id: 'S05',
        name: 'Woodblock',
        description: 'Physical modeling dry wood percussion',
        layer: 'second',
        waveform: 'triangle',
        synthesisType: 'fm',
        envelope: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1 },
        filter: { type: 'bandpass', frequency: 1800, resonance: 8 },
        effects: { reverb: 0.15, delay: 0, delayTime: 0, chorus: 0, distortion: 0 },
        detune: 0,
        volume: -12,
        modulationIndex: 20,
        harmonicity: 4.5,
    },
    {
        id: 'S06',
        name: 'Tremolo Pulse',
        description: 'Demonstration of new Tremolo and Gate effects',
        layer: 'second',
        waveform: 'square',
        synthesisType: 'subtractive',
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.4 },
        filter: { type: 'lowpass', frequency: 800, resonance: 4 },
        effects: {
            reverb: 0.3,
            delay: 0.4,
            delayTime: 0.25,
            delayFeedback: 0.5,
            chorus: 0,
            distortion: 0.1,
            tremolo: 0.8, // Heavy tremolo
            noiseGate: -100
        },
        detune: 0,
        volume: -10,
    },
];

// Get presets by layer
export const getPresetsByLayer = (layer: 'hour' | 'minute' | 'second'): SynthPreset[] => {
    return presets.filter(p => p.layer === layer);
};

// Get preset by ID
export const getPresetById = (id: string): SynthPreset | undefined => {
    return presets.find(p => p.id === id);
};

// Create a custom preset from base values
export const createCustomPreset = (
    base: Partial<SynthPreset>,
    layer: 'hour' | 'minute' | 'second'
): SynthPreset => {
    const defaultPreset = presets.find(p => p.layer === layer) || presets[0];
    return {
        ...defaultPreset,
        ...base,
        id: `CUSTOM_${Date.now()}`,
        name: base.name || 'Custom Sound',
        layer,
    };
};
