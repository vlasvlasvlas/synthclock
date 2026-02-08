// Theme Types and Classic Mac Theme Definition

export interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    highlight: string;
    shadow: string;
    hourHand: string;
    minuteHand: string;
    secondHand: string;
}

export interface ThemeCharacters {
    hourHand: string;
    minuteHand: string;
    secondHand: string;
    clockFace: string;
    border: {
        topLeft: string;
        topRight: string;
        bottomLeft: string;
        bottomRight: string;
        horizontal: string;
        vertical: string;
    };
    button: {
        start: string;
        end: string;
        fill: string;
    };
    slider: {
        filled: string;
        empty: string;
        handle: string;
    };
    checkbox: {
        checked: string;
        unchecked: string;
    };
    radio: {
        selected: string;
        unselected: string;
    };
}

export interface Theme {
    id: string;
    name: string;
    description: string;
    fontFamily: string;
    fontSize: number;
    colors: ThemeColors;
    characters: ThemeCharacters;
}

// Classic Macintosh Theme (1984-1991)
export const classicMacTheme: Theme = {
    id: 'classic-mac',
    name: 'Classic Macintosh',
    description: 'Inspired by the original Macintosh System 1-6 (1984-1991)',
    fontFamily: '"Chicago", "Geneva", "Courier New", monospace',
    fontSize: 14,
    colors: {
        background: '#FFFFFF',
        foreground: '#000000',
        primary: '#000000',
        secondary: '#808080',
        accent: '#000000',
        border: '#000000',
        highlight: '#000000',
        shadow: '#808080',
        hourHand: '#000000',
        minuteHand: '#000000',
        secondHand: '#808080',
    },
    characters: {
        hourHand: '█',
        minuteHand: '▓',
        secondHand: '·',
        clockFace: '○',
        border: {
            topLeft: '╭',
            topRight: '╮',
            bottomLeft: '╰',
            bottomRight: '╯',
            horizontal: '─',
            vertical: '│',
        },
        button: {
            start: '(',
            end: ')',
            fill: ' ',
        },
        slider: {
            filled: '█',
            empty: '░',
            handle: '▓',
        },
        checkbox: {
            checked: '☑',
            unchecked: '☐',
        },
        radio: {
            selected: '●',
            unselected: '○',
        },
    },
};

// ANSI BBS Theme (1985-1995)
export const ansiBbsTheme: Theme = {
    id: 'ansi-bbs',
    name: 'ANSI BBS',
    description: 'Demoscene and BBS aesthetic with vibrant colors',
    fontFamily: '"VT323", "Courier New", monospace',
    fontSize: 16,
    colors: {
        background: '#0A0A0F',
        foreground: '#33FF33',
        primary: '#FF0055',
        secondary: '#00FFFF',
        accent: '#FFFF00',
        border: '#FF0055',
        highlight: '#FFFFFF',
        shadow: '#333333',
        hourHand: '#FF0055',
        minuteHand: '#00FFFF',
        secondHand: '#FFFF00',
    },
    characters: {
        hourHand: '█',
        minuteHand: '▓',
        secondHand: '+',
        clockFace: '░',
        border: {
            topLeft: '╔',
            topRight: '╗',
            bottomLeft: '╚',
            bottomRight: '╝',
            horizontal: '═',
            vertical: '║',
        },
        button: {
            start: '[',
            end: ']',
            fill: '▓',
        },
        slider: {
            filled: '▓',
            empty: '░',
            handle: '█',
        },
        checkbox: {
            checked: '■',
            unchecked: '□',
        },
        radio: {
            selected: '●',
            unselected: '○',
        },
    },
};

// Windows 3.1 Theme (1992)
export const windows31Theme: Theme = {
    id: 'windows-31',
    name: 'Windows 3.1',
    description: 'Classic Windows 3.1 aesthetic with beveled borders',
    fontFamily: '"MS Sans Serif", "Courier New", monospace',
    fontSize: 13,
    colors: {
        background: '#C0C0C0',
        foreground: '#000000',
        primary: '#000080',
        secondary: '#808080',
        accent: '#FFFFFF',
        border: '#000000',
        highlight: '#FFFFFF',
        shadow: '#808080',
        hourHand: '#000080',
        minuteHand: '#000000',
        secondHand: '#FF0000',
    },
    characters: {
        hourHand: '█',
        minuteHand: '▓',
        secondHand: '│',
        clockFace: '·',
        border: {
            topLeft: '┌',
            topRight: '┐',
            bottomLeft: '└',
            bottomRight: '┘',
            horizontal: '─',
            vertical: '│',
        },
        button: {
            start: '[',
            end: ']',
            fill: ' ',
        },
        slider: {
            filled: '▓',
            empty: '░',
            handle: '█',
        },
        checkbox: {
            checked: '[X]',
            unchecked: '[ ]',
        },
        radio: {
            selected: '(●)',
            unselected: '( )',
        },
    },
};

// Terminal Green Theme
export const terminalGreenTheme: Theme = {
    id: 'terminal-green',
    name: 'Terminal Green',
    description: 'Classic phosphor CRT terminal aesthetic',
    fontFamily: '"VT323", "Courier New", monospace',
    fontSize: 15,
    colors: {
        background: '#0A1A0A',
        foreground: '#33FF33',
        primary: '#00FF00',
        secondary: '#00AA00',
        accent: '#55FF55',
        border: '#33FF33',
        highlight: '#88FF88',
        shadow: '#005500',
        hourHand: '#00FF00',
        minuteHand: '#33FF33',
        secondHand: '#00AA00',
    },
    characters: {
        hourHand: '█',
        minuteHand: '▓',
        secondHand: '·',
        clockFace: '░',
        border: {
            topLeft: '█',
            topRight: '█',
            bottomLeft: '█',
            bottomRight: '█',
            horizontal: '█',
            vertical: '█',
        },
        button: {
            start: '>',
            end: '<',
            fill: ' ',
        },
        slider: {
            filled: '|',
            empty: '.',
            handle: '█',
        },
        checkbox: {
            checked: '[x]',
            unchecked: '[ ]',
        },
        radio: {
            selected: '(o)',
            unselected: '( )',
        },
    },
};

// All available themes
export const themes: Record<string, Theme> = {
    'classic-mac': classicMacTheme,
    'ansi-bbs': ansiBbsTheme,
    'windows-31': windows31Theme,
    'terminal-green': terminalGreenTheme,
};

export const defaultThemeId = 'classic-mac';
