/**
 * TONE CLOCK THEORY - Implementation based on Peter Schat's theory
 * 
 * The Tone Clock organizes the 12 pitch classes into trichords (3-note sets)
 * called "hours". Each hour represents one of the 12 possible trichordal
 * set-classes in music theory, mapped to clock positions.
 * 
 * The theory uses "steering" - transposing and inverting a trichord to
 * tessellate (tile) all 12 chromatic notes exactly once.
 * 
 * Based on: Peter Schat's "De Toonklok" and Jenny McLeod's "Chromatic Maps"
 */

// The 12 pitch class names
export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type PitchClass = typeof PITCH_CLASSES[number];

// Intervallic Prime Form (IPF) - intervals in semitones between successive notes
export interface ToneClockHour {
    hour: number;           // 1-12 (clock position)
    name: string;           // Descriptive name
    forteNumber: string;    // Allen Forte's set-class number (3-1 to 3-12)
    ipf: [number, number];  // Intervallic Prime Form [interval1, interval2]
    pitchClassSet: number[]; // Prime form as pitch classes (0, x, y)
    isSymmetrical: boolean; // Whether the trichord is symmetrical (inversionally equivalent)
    description: string;    // Musical description
    color: string;          // Associated color for visualization
    // Tessellation data - how to partition all 12 notes using this hour
    tessellation: {
        transpositions: number[][]; // Array of 4 trichords that tile the chromatic scale
        steeringPattern: number[];  // The transposition intervals used
    } | null;
}

// The 12 Hours of the Tone Clock
// Based on Peter Schat's original mapping and set theory
export const TONE_CLOCK_HOURS: ToneClockHour[] = [
    {
        hour: 1,
        name: 'Chromatic',
        forteNumber: '3-1',
        ipf: [1, 1],
        pitchClassSet: [0, 1, 2],
        isSymmetrical: true,
        description: 'Three consecutive semitones. Maximum density, minimal motion.',
        color: '#FF0000',
        tessellation: {
            transpositions: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]],
            steeringPattern: [0, 3, 6, 9]
        }
    },
    {
        hour: 2,
        name: 'Phrygian',
        forteNumber: '3-2',
        ipf: [1, 2],
        pitchClassSet: [0, 1, 3],
        isSymmetrical: false,
        description: 'Semitone + whole tone. Opens the octatonic scale.',
        color: '#FF6600',
        tessellation: {
            transpositions: [[0, 1, 3], [4, 5, 7], [8, 9, 11], [2, 6, 10]],
            steeringPattern: [0, 4, 8, 2]
        }
    },
    {
        hour: 3,
        name: 'Minor Third Cluster',
        forteNumber: '3-3',
        ipf: [1, 3],
        pitchClassSet: [0, 1, 4],
        isSymmetrical: false,
        description: 'Semitone + minor third. Ambiguous, transitional quality.',
        color: '#FFCC00',
        tessellation: {
            transpositions: [[0, 1, 4], [3, 7, 8], [5, 6, 9], [2, 10, 11]],
            steeringPattern: [0, 3, 5, 2]
        }
    },
    {
        hour: 4,
        name: 'Major Third Cluster',
        forteNumber: '3-4',
        ipf: [1, 4],
        pitchClassSet: [0, 1, 5],
        isSymmetrical: false,
        description: 'Semitone + major third. Lydian brightness meets chromatic edge.',
        color: '#99FF00',
        tessellation: {
            transpositions: [[0, 1, 5], [2, 6, 7], [4, 8, 9], [3, 10, 11]],
            steeringPattern: [0, 2, 4, 3]
        }
    },
    {
        hour: 5,
        name: 'Tritone Cluster',
        forteNumber: '3-5',
        ipf: [1, 5],
        pitchClassSet: [0, 1, 6],
        isSymmetrical: false,
        description: 'Semitone + tritone. Maximum tension and instability.',
        color: '#00FF00',
        tessellation: {
            transpositions: [[0, 1, 6], [2, 7, 8], [3, 4, 9], [5, 10, 11]],
            steeringPattern: [0, 2, 3, 5]
        }
    },
    {
        hour: 6,
        name: 'Whole Tone',
        forteNumber: '3-6',
        ipf: [2, 2],
        pitchClassSet: [0, 2, 4],
        isSymmetrical: true,
        description: 'Two whole tones. Fragment of the whole-tone scale. Impressionistic.',
        color: '#00FFCC',
        tessellation: {
            transpositions: [[0, 2, 4], [1, 3, 5], [6, 8, 10], [7, 9, 11]],
            steeringPattern: [0, 1, 6, 7]
        }
    },
    {
        hour: 7,
        name: 'Minor Pentatonic',
        forteNumber: '3-7',
        ipf: [2, 3],
        pitchClassSet: [0, 2, 5],
        isSymmetrical: false,
        description: 'Whole tone + minor third. Core of the pentatonic scale. Folk music.',
        color: '#00CCFF',
        tessellation: {
            transpositions: [[0, 2, 5], [3, 6, 8], [1, 9, 11], [4, 7, 10]],
            steeringPattern: [0, 3, 1, 4]
        }
    },
    {
        hour: 8,
        name: 'Italian Sixth',
        forteNumber: '3-8',
        ipf: [2, 4],
        pitchClassSet: [0, 2, 6],
        isSymmetrical: true,
        description: 'Whole tone + major third. The incomplete dominant seventh.',
        color: '#0066FF',
        tessellation: {
            transpositions: [[0, 2, 6], [1, 3, 7], [4, 8, 10], [5, 9, 11]],
            steeringPattern: [0, 1, 4, 5]
        }
    },
    {
        hour: 9,
        name: 'Quartal',
        forteNumber: '3-9',
        ipf: [2, 5],
        pitchClassSet: [0, 2, 7],
        isSymmetrical: true,
        description: 'Stacked perfect fourths/fifths. Open, suspended, jazz voicings.',
        color: '#6600FF',
        tessellation: {
            transpositions: [[0, 2, 7], [1, 3, 8], [4, 6, 11], [5, 9, 10]],
            steeringPattern: [0, 1, 4, 5]
        }
    },
    {
        hour: 10,
        name: 'Diminished',
        forteNumber: '3-10',
        ipf: [3, 3],
        pitchClassSet: [0, 3, 6],
        isSymmetrical: true,
        description: 'Two minor thirds = diminished triad. Cannot tile 12 notes alone.',
        color: '#CC00FF',
        // Hour X is special - uses tetrachord (diminished 7th) instead
        tessellation: null // Uses 0369 tetrachord for tessellation
    },
    {
        hour: 11,
        name: 'Major/Minor Triad',
        forteNumber: '3-11',
        ipf: [3, 4], // or [4, 3] for major
        pitchClassSet: [0, 3, 7],
        isSymmetrical: false, // minor [3,4] vs major [4,3]
        description: 'The foundation of tonal harmony. Minor and major triads.',
        color: '#FF00CC',
        tessellation: {
            transpositions: [[0, 3, 7], [1, 4, 8], [2, 5, 9], [6, 10, 11]],
            steeringPattern: [0, 1, 2, 6]
        }
    },
    {
        hour: 12,
        name: 'Augmented',
        forteNumber: '3-12',
        ipf: [4, 4],
        pitchClassSet: [0, 4, 8],
        isSymmetrical: true,
        description: 'Two major thirds = augmented triad. Divides the octave in 3.',
        color: '#FF0066',
        tessellation: {
            transpositions: [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]],
            steeringPattern: [0, 1, 2, 3]
        }
    }
];

// Get hour by clock position (1-12)
export const getHour = (hourNumber: number): ToneClockHour | undefined => {
    return TONE_CLOCK_HOURS.find(h => h.hour === hourNumber);
};

// Get hour by Forte number
export const getHourByForte = (forteNumber: string): ToneClockHour | undefined => {
    return TONE_CLOCK_HOURS.find(h => h.forteNumber === forteNumber);
};

// Generate a trichord from an hour at a given transposition
export const generateTrichord = (hour: ToneClockHour, transposition: number): number[] => {
    return hour.pitchClassSet.map(pc => (pc + transposition) % 12);
};

// Generate all 4 trichords that tessellate the chromatic scale for a given hour
export const tessellate = (hour: ToneClockHour): number[][] | null => {
    if (!hour.tessellation) return null;
    return hour.tessellation.transpositions;
};

// Convert pitch class number to note name with optional octave
export const pitchClassToNote = (pc: number, octave: number = 4): string => {
    return `${PITCH_CLASSES[pc % 12]}${octave}`;
};

// Get the inversion of a trichord (reverse the intervals)
export const invertTrichord = (hour: ToneClockHour): [number, number] => {
    return [hour.ipf[1], hour.ipf[0]];
};

// Check if two hours are related by inversion
export const areInversionallyRelated = (hour1: ToneClockHour, hour2: ToneClockHour): boolean => {
    return hour1.ipf[0] === hour2.ipf[1] && hour1.ipf[1] === hour2.ipf[0];
};

/**
 * Map the current time to Tone Clock harmony
 * 
 * - Hour hand (1-12) -> Selects the active Hour (trichord type)
 * - Minute hand (0-59) -> Selects transposition within the tessellation
 * - Second hand (0-59) -> Triggers individual notes from the current trichord
 */
export interface ToneClockState {
    activeHour: ToneClockHour;
    currentTrichord: number[];
    tessellation: number[][] | null;
    transpositionIndex: number;
    noteIndex: number;
}

export const mapTimeToToneClock = (
    hours: number,    // 1-12
    minutes: number,  // 0-59
    seconds: number   // 0-59
): ToneClockState => {
    // Map clock hour to Tone Clock hour (1-12)
    const hourIndex = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const activeHour = getHour(hourIndex) || TONE_CLOCK_HOURS[0];

    // Map minutes to transposition (0-3 for the 4 tessellation groups)
    // Each 15-minute segment uses a different transposition
    const transpositionIndex = Math.floor(minutes / 15) % 4;

    // Get the current trichord from tessellation
    const tessellation = tessellate(activeHour);
    const currentTrichord = tessellation
        ? tessellation[transpositionIndex]
        : generateTrichord(activeHour, transpositionIndex * 3);

    // Map seconds to note within the trichord (0, 1, 2)
    const noteIndex = seconds % 3;

    return {
        activeHour,
        currentTrichord,
        tessellation,
        transpositionIndex,
        noteIndex
    };
};

// Get the current note to play based on time
export const getCurrentNote = (
    hours: number,
    minutes: number,
    seconds: number,
    baseOctave: number = 3
): string => {
    const state = mapTimeToToneClock(hours, minutes, seconds);
    const pitchClass = state.currentTrichord[state.noteIndex];

    // Vary octave slightly based on transposition for interest
    const octaveVariation = state.transpositionIndex > 1 ? 1 : 0;

    return pitchClassToNote(pitchClass, baseOctave + octaveVariation);
};

// Get the chord (all 3 notes) for the current trichord
export const getCurrentChord = (
    hours: number,
    minutes: number,
    baseOctave: number = 3
): string[] => {
    const state = mapTimeToToneClock(hours, minutes, 0);
    return state.currentTrichord.map((pc, i) =>
        pitchClassToNote(pc, baseOctave + Math.floor(i / 2))
    );
};

// Special handling for Hour X (Diminished)
// Uses diminished 7th tetrachord (0, 3, 6, 9) instead of trichord
export const HOUR_X_TETRACHORD = [0, 3, 6, 9];
export const tessellateHourX = (): number[][] => {
    // Three transpositions of the diminished 7th tetrachord cover all 12 notes
    return [
        [0, 3, 6, 9],   // C dim7
        [1, 4, 7, 10],  // C# dim7
        [2, 5, 8, 11]   // D dim7
    ];
};
