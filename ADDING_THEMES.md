# Adding Custom Themes

This guide explains how to create and add new visual themes to SynthClock.

## Theme Structure

Each theme is defined as a `Theme` object in `app/src/core/visuals/themes.ts` with the following structure:

```typescript
interface Theme {
    id: string;           // Unique identifier (lowercase, kebab-case)
    name: string;         // Display name shown in UI
    description: string;  // Brief description
    fontFamily: string;   // CSS font-family string
    fontSize: number;     // Base font size in pixels
    colors: ThemeColors;  // Color palette
    characters: ThemeCharacters; // ASCII characters for UI elements
}
```

## Color Palette

The `colors` object defines all colors used in the theme:

| Property | Description | Example |
|----------|-------------|---------|
| `background` | Main background color | `#FFFFFF` |
| `foreground` | Main text color | `#000000` |
| `primary` | Primary accent color | `#000080` |
| `secondary` | Secondary/muted color | `#808080` |
| `accent` | Highlight color | `#FF0055` |
| `border` | Border color | `#000000` |
| `highlight` | Bright highlight | `#FFFFFF` |
| `shadow` | Shadow/dark accent | `#333333` |
| `hourHand` | Clock hour hand color | `#FF0000` |
| `minuteHand` | Clock minute hand color | `#00FF00` |
| `secondHand` | Clock second hand color | `#0000FF` |

## ASCII Characters

The `characters` object defines the ASCII art used for UI elements:

```typescript
characters: {
    hourHand: '█',      // Character for hour hand
    minuteHand: '▓',    // Character for minute hand  
    secondHand: '·',    // Character for second hand
    clockFace: '○',     // Clock face decoration
    border: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
    },
    button: { start: '(', end: ')', fill: ' ' },
    slider: { filled: '█', empty: '░', handle: '▓' },
    checkbox: { checked: '☑', unchecked: '☐' },
    radio: { selected: '●', unselected: '○' },
}
```

## Step-by-Step: Creating a New Theme

### 1. Open themes.ts

```bash
app/src/core/visuals/themes.ts
```

### 2. Create your theme object

Add a new theme constant before the `themes` record:

```typescript
// My Custom Theme
export const myCustomTheme: Theme = {
    id: 'my-custom',
    name: 'My Custom Theme',
    description: 'A description of your theme',
    fontFamily: '"VT323", monospace',
    fontSize: 14,
    colors: {
        background: '#1a1a2e',
        foreground: '#eaeaea',
        primary: '#e94560',
        secondary: '#0f3460',
        accent: '#16213e',
        border: '#e94560',
        highlight: '#ffffff',
        shadow: '#0a0a0a',
        hourHand: '#e94560',
        minuteHand: '#eaeaea',
        secondHand: '#0f3460',
    },
    characters: {
        hourHand: '▀',
        minuteHand: '▄',
        secondHand: '.',
        clockFace: '·',
        border: {
            topLeft: '┌',
            topRight: '┐',
            bottomLeft: '└',
            bottomRight: '┘',
            horizontal: '─',
            vertical: '│',
        },
        button: { start: '[', end: ']', fill: ' ' },
        slider: { filled: '▓', empty: '░', handle: '█' },
        checkbox: { checked: '[X]', unchecked: '[ ]' },
        radio: { selected: '(●)', unselected: '( )' },
    },
};
```

### 3. Register the theme

Add your theme to the `themes` record:

```typescript
export const themes: Record<string, Theme> = {
    'classic-mac': classicMacTheme,
    'ansi-bbs': ansiBbsTheme,
    'windows-31': windows31Theme,
    'terminal-green': terminalGreenTheme,
    'my-custom': myCustomTheme,  // Add your theme here
};
```

### 4. Add CSS variables (optional)

For dark themes, you may need to add CSS rules in `app/src/index.css`:

```css
body.theme-my-custom {
    --mac-white: #1a1a2e;
    --mac-black: #eaeaea;
    --mac-gray: #0f3460;
    --mac-light-gray: #16213e;
    background: var(--mac-white);
    color: var(--mac-black);
}
```

## Example Themes

### Cyberpunk Theme

```typescript
export const cyberpunkTheme: Theme = {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-lit cyberpunk aesthetic',
    fontFamily: '"VT323", monospace',
    fontSize: 15,
    colors: {
        background: '#0d0221',
        foreground: '#ff00ff',
        primary: '#00ffff',
        secondary: '#ff00aa',
        accent: '#ffff00',
        border: '#ff00ff',
        highlight: '#ffffff',
        shadow: '#1a0033',
        hourHand: '#ff00ff',
        minuteHand: '#00ffff',
        secondHand: '#ffff00',
    },
    // ... characters
};
```

### Solarized Dark Theme

```typescript
export const solarizedDarkTheme: Theme = {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Ethan Schoonover\'s Solarized Dark palette',
    fontFamily: '"Source Code Pro", monospace',
    fontSize: 14,
    colors: {
        background: '#002b36',
        foreground: '#839496',
        primary: '#268bd2',
        secondary: '#586e75',
        accent: '#2aa198',
        border: '#073642',
        highlight: '#fdf6e3',
        shadow: '#073642',
        hourHand: '#dc322f',
        minuteHand: '#268bd2',
        secondHand: '#859900',
    },
    // ... characters
};
```

## Tips

- **Test contrast**: Ensure text is readable against backgrounds
- **Use web-safe fonts**: Include fallback fonts in `fontFamily`
- **ASCII consistency**: Keep character widths consistent (avoid mixing narrow and wide characters)
- **Color harmony**: Use tools like [coolors.co](https://coolors.co) for palettes

## Unicode Characters Reference

| Symbol | Name | Use Case |
|--------|------|----------|
| █ | Full Block | Filled areas |
| ▓ | Dark Shade | Semi-filled |
| ▒ | Medium Shade | Light fill |
| ░ | Light Shade | Empty/background |
| ● | Black Circle | Selected radio |
| ○ | White Circle | Unselected radio |
| ■ | Black Square | Checked box |
| □ | White Square | Unchecked box |
| ─ | Box Drawing | Horizontal lines |
| │ | Box Drawing | Vertical lines |
| ╔╗╚╝ | Double Box | Double borders |
| ┌┐└┘ | Light Box | Light borders |
| ╭╮╰╯ | Rounded Box | Rounded corners |
