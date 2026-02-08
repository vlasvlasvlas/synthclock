// Global State Store using Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themes, defaultThemeId } from '../core/visuals/themes';
import type { Theme } from '../core/visuals/themes';
import { getPresetsByLayer } from '../core/audio/presets';
import type { SynthPreset } from '../core/audio/presets';
import { TONE_CLOCK_HOURS, getHour } from '../core/theory/ToneClock';
import type { ToneClockHour } from '../core/theory/ToneClock';

// Background pattern types
export type BackgroundPattern = 'solid' | 'scanlines' | 'noise' | 'grid' | 'stars' | 'gradient';

export interface BackgroundSettings {
    color: string;
    pattern: BackgroundPattern;
    opacity: number;
    animated: boolean;
}

// Channel mixer settings
export interface ChannelMixer {
    hour: { volume: number; muted: boolean };
    minute: { volume: number; muted: boolean };
    second: { volume: number; muted: boolean };
}

export interface AppState {
    // Theme
    currentThemeId: string;
    theme: Theme;

    // Background
    background: BackgroundSettings;

    // Audio
    isPlaying: boolean;
    masterVolume: number; // -60 to 0 dB
    hourPreset: SynthPreset;
    minutePreset: SynthPreset;
    secondPreset: SynthPreset;

    // Channel Mixer
    mixer: ChannelMixer;

    // Time
    speed: number; // 0.1 to 10

    // Tone Clock
    activeHour: ToneClockHour;

    // UI
    showEditor: boolean;
    editorTab: 'sounds' | 'theme' | 'background' | 'theory';

    // Actions
    setTheme: (themeId: string) => void;
    setBackground: (settings: Partial<BackgroundSettings>) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setMasterVolume: (volume: number) => void;
    setPreset: (layer: 'hour' | 'minute' | 'second', preset: SynthPreset) => void;
    setSpeed: (speed: number) => void;
    setActiveHour: (hourNumber: number) => void;
    toggleEditor: () => void;
    setEditorTab: (tab: 'sounds' | 'theme' | 'background' | 'theory') => void;
    updatePresetParameter: (
        layer: 'hour' | 'minute' | 'second',
        param: keyof SynthPreset,
        value: unknown
    ) => void;
    setChannelVolume: (channel: 'hour' | 'minute' | 'second', volume: number) => void;
    toggleChannelMute: (channel: 'hour' | 'minute' | 'second') => void;
}

// Get default presets for each layer
const defaultHourPreset = getPresetsByLayer('hour')[0];
const defaultMinutePreset = getPresetsByLayer('minute')[0];
const defaultSecondPreset = getPresetsByLayer('second')[0];

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Theme defaults
            currentThemeId: defaultThemeId,
            theme: themes[defaultThemeId],

            // Background defaults (Classic Mac style - white)
            background: {
                color: '#FFFFFF',
                pattern: 'solid',
                opacity: 1,
                animated: false,
            },

            // Audio defaults
            isPlaying: false,
            masterVolume: -12,
            hourPreset: defaultHourPreset,
            minutePreset: defaultMinutePreset,
            secondPreset: defaultSecondPreset,

            // Mixer defaults (Sync with presets)
            mixer: {
                hour: { volume: defaultHourPreset.volume, muted: false },
                minute: { volume: defaultMinutePreset.volume, muted: false },
                second: { volume: defaultSecondPreset.volume, muted: false },
            },

            // Time
            speed: 1.0,

            // Tone Clock - start at Hour 12 (matches 12:00)
            activeHour: TONE_CLOCK_HOURS[11], // Hour 12 (Augmented)

            // UI
            showEditor: false,
            editorTab: 'sounds',

            // Actions
            setTheme: (themeId: string) => {
                const newTheme = themes[themeId];
                if (newTheme) {
                    set({
                        currentThemeId: themeId,
                        theme: newTheme,
                        // Update background to match theme
                        background: {
                            ...get().background,
                            color: newTheme.colors.background
                        }
                    });
                }
            },

            setBackground: (settings: Partial<BackgroundSettings>) => {
                set({ background: { ...get().background, ...settings } });
            },

            setIsPlaying: (isPlaying: boolean) => {
                set({ isPlaying });
            },

            setMasterVolume: (volume: number) => {
                set({ masterVolume: Math.max(-60, Math.min(0, volume)) });
            },

            setPreset: (layer: 'hour' | 'minute' | 'second', preset: SynthPreset) => {
                set((state) => ({
                    ...state,
                    [layer === 'hour' ? 'hourPreset' : layer === 'minute' ? 'minutePreset' : 'secondPreset']: preset,
                    // Also update mixer volume to match preset
                    mixer: {
                        ...state.mixer,
                        [layer]: {
                            ...state.mixer[layer],
                            volume: preset.volume,
                        },
                    },
                }));
            },

            setSpeed: (speed: number) => {
                set({ speed: Math.max(0.1, Math.min(10, speed)) });
            },

            setActiveHour: (hourNumber: number) => {
                const hour = getHour(hourNumber);
                if (hour) {
                    set({ activeHour: hour });
                }
            },

            toggleEditor: () => {
                set({ showEditor: !get().showEditor });
            },

            setEditorTab: (tab: 'sounds' | 'theme' | 'background' | 'theory') => {
                set({ editorTab: tab });
            },

            updatePresetParameter: (
                layer: 'hour' | 'minute' | 'second',
                param: keyof SynthPreset,
                value: unknown
            ) => {
                const currentPreset = layer === 'hour'
                    ? get().hourPreset
                    : layer === 'minute'
                        ? get().minutePreset
                        : get().secondPreset;

                // Get base name without "(Modified)" suffix to avoid repetition
                const baseName = currentPreset.name.replace(/ \(Modified\)$/, '');
                const baseId = currentPreset.id.replace(/^CUSTOM_/, '');

                const updatedPreset = {
                    ...currentPreset,
                    [param]: value,
                    id: `CUSTOM_${baseId}`,
                    name: `${baseName} (Modified)`
                };

                switch (layer) {
                    case 'hour':
                        set({ hourPreset: updatedPreset });
                        break;
                    case 'minute':
                        set({ minutePreset: updatedPreset });
                        break;
                    case 'second':
                        set({ secondPreset: updatedPreset });
                        break;
                }
            },

            setChannelVolume: (channel: 'hour' | 'minute' | 'second', volume: number) => {
                const mixer = get().mixer;
                set({
                    mixer: {
                        ...mixer,
                        [channel]: { ...mixer[channel], volume: Math.max(-60, Math.min(12, volume)) }
                    }
                });
            },

            toggleChannelMute: (channel: 'hour' | 'minute' | 'second') => {
                const mixer = get().mixer;
                set({
                    mixer: {
                        ...mixer,
                        [channel]: { ...mixer[channel], muted: !mixer[channel].muted }
                    }
                });
            },
        }),
        {
            name: 'synthclock-storage',
            partialize: (state) => ({
                currentThemeId: state.currentThemeId,
                background: state.background,
                masterVolume: state.masterVolume,
                hourPreset: state.hourPreset,
                minutePreset: state.minutePreset,
                secondPreset: state.secondPreset,
                mixer: state.mixer,
                speed: state.speed,
            }),
        }
    )
);

export default useStore;
