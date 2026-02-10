// Global State Store using Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themes, defaultThemeId } from '../core/visuals/themes';
import type { Theme } from '../core/visuals/themes';
import { getPresetsByLayer } from '../core/audio/presets';
import type { SynthPreset } from '../core/audio/presets';
import { TONE_CLOCK_HOURS, getHour } from '../core/theory/ToneClock';
import type { ToneClockHour } from '../core/theory/ToneClock';
import type { ArpeggiatorSettings } from '../core/audio/Arpeggiator';
import { defaultArpSettings } from '../core/audio/Arpeggiator';

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
    arp: { volume: number; muted: boolean };
}

// Visual effect types
export type VisualEffect = 'particles' | 'ripples' | 'droplets' | 'waves' | 'none';
export type ColorSource = 'theme' | 'pitchClass' | 'random' | 'custom';
export type PositionMode = 'random' | 'center' | 'clockEdge';

export interface VisualLayerSettings {
    enabled: boolean;
    effect: VisualEffect;
    colorSource: ColorSource;
    customColor: string;        // Hex color for 'custom' colorSource
    intensity: number;          // 0-1
    decayTime: number;          // seconds
    positionMode: PositionMode;
    sizeMultiplier: number;     // 0.5-3
    opacity: number;            // 0-1
}

export interface VisualSettings {
    hour: VisualLayerSettings;
    minute: VisualLayerSettings;
    second: VisualLayerSettings;
    arp: VisualLayerSettings;
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
    arpPreset: SynthPreset;

    // Channel Mixer
    mixer: ChannelMixer;

    // Arpeggiator
    arpeggiator: ArpeggiatorSettings;

    // Time
    speed: number; // 0.1 to 10
    isReverse: boolean;

    // Tone Clock
    activeHour: ToneClockHour;

    // UI
    showEditor: boolean;
    editorTab: 'sounds' | 'theme' | 'theory' | 'help';
    visualsEnabled: boolean;
    isFullscreen: boolean;

    // Visual Settings
    visualSettings: VisualSettings;

    // Actions
    setTheme: (themeId: string) => void;
    setBackground: (settings: Partial<BackgroundSettings>) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setMasterVolume: (volume: number) => void;
    setPreset: (layer: 'hour' | 'minute' | 'second' | 'arp', preset: SynthPreset) => void;
    setSpeed: (speed: number) => void;
    setIsReverse: (isReverse: boolean) => void;
    setActiveHour: (hourNumber: number) => void;
    toggleEditor: () => void;
    setEditorTab: (tab: 'sounds' | 'theme' | 'theory' | 'help') => void;
    updatePresetParameter: (
        layer: 'hour' | 'minute' | 'second' | 'arp',
        param: keyof SynthPreset,
        value: unknown
    ) => void;
    setChannelVolume: (channel: 'hour' | 'minute' | 'second' | 'arp', volume: number) => void;
    toggleChannelMute: (channel: 'hour' | 'minute' | 'second' | 'arp') => void;
    setArpeggiator: (settings: Partial<ArpeggiatorSettings>) => void;
    setVisualsEnabled: (enabled: boolean) => void;
    toggleFullscreen: () => void;
    setVisualLayer: (layer: 'hour' | 'minute' | 'second' | 'arp', settings: Partial<VisualLayerSettings>) => void;
}

// Get default presets for each layer
const defaultHourPreset = getPresetsByLayer('hour')[0];
const defaultMinutePreset = getPresetsByLayer('minute')[0];
const defaultSecondPreset = getPresetsByLayer('second')[0];
const defaultArpPreset = getPresetsByLayer('second')[0]; // Use second presets for arp

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
            arpPreset: defaultArpPreset,

            // Mixer defaults (Sync with presets)
            mixer: {
                hour: { volume: defaultHourPreset.volume, muted: false },
                minute: { volume: defaultMinutePreset.volume, muted: false },
                second: { volume: defaultSecondPreset.volume, muted: false },
                arp: { volume: -10, muted: false },
            },

            // Arpeggiator
            arpeggiator: { ...defaultArpSettings },

            // Time
            speed: 1.0,
            isReverse: false,

            // Tone Clock - start at Hour 12 (matches 12:00)
            activeHour: TONE_CLOCK_HOURS[11], // Hour 12 (Augmented)

            // UI
            showEditor: false,
            editorTab: 'sounds',
            visualsEnabled: true,
            isFullscreen: false,

            // Visual Settings - per-layer configuration
            visualSettings: {
                hour: {
                    enabled: true,
                    effect: 'ripples',
                    colorSource: 'theme',
                    customColor: '#FFD700',
                    intensity: 1.0,
                    decayTime: 4.0,
                    positionMode: 'center',
                    sizeMultiplier: 2.0,
                    opacity: 1.0,
                },
                minute: {
                    enabled: true,
                    effect: 'ripples',
                    colorSource: 'theme',
                    customColor: '#00BFFF',
                    intensity: 1.0,
                    decayTime: 2.5,
                    positionMode: 'center',
                    sizeMultiplier: 1.5,
                    opacity: 0.9,
                },
                second: {
                    enabled: true,
                    effect: 'particles',
                    colorSource: 'theme',
                    customColor: '#FF6B6B',
                    intensity: 1.0,
                    decayTime: 1.5,
                    positionMode: 'random',
                    sizeMultiplier: 1.0,
                    opacity: 0.8,
                },
                arp: {
                    enabled: true,
                    effect: 'particles',
                    colorSource: 'theme',
                    customColor: '#A855F7',
                    intensity: 0.8,
                    decayTime: 0.8,
                    positionMode: 'random',
                    sizeMultiplier: 0.8,
                    opacity: 0.7,
                },
            },

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

            setPreset: (layer: 'hour' | 'minute' | 'second' | 'arp', preset: SynthPreset) => {
                const presetKey = layer === 'hour' ? 'hourPreset'
                    : layer === 'minute' ? 'minutePreset'
                        : layer === 'second' ? 'secondPreset'
                            : 'arpPreset';
                set((state) => ({
                    ...state,
                    [presetKey]: preset,
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

            setIsReverse: (isReverse: boolean) => {
                set({ isReverse });
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

            setEditorTab: (tab: 'sounds' | 'theme' | 'theory' | 'help') => {
                set({ editorTab: tab });
            },

            updatePresetParameter: (
                layer: 'hour' | 'minute' | 'second' | 'arp',
                param: keyof SynthPreset,
                value: unknown
            ) => {
                const currentPreset = layer === 'hour'
                    ? get().hourPreset
                    : layer === 'minute'
                        ? get().minutePreset
                        : layer === 'second'
                            ? get().secondPreset
                            : get().arpPreset;

                // Get base name without "(Modified)" suffix (handle multiple occurrences just in case)
                const baseName = currentPreset.name.replace(/( \(Modified\))+$/, '');
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
                    case 'arp':
                        set({ arpPreset: updatedPreset });
                        break;
                }
            },

            setChannelVolume: (channel: 'hour' | 'minute' | 'second' | 'arp', volume: number) => {
                const mixer = get().mixer;
                set({
                    mixer: {
                        ...mixer,
                        [channel]: { ...mixer[channel], volume: Math.max(-60, Math.min(12, volume)) }
                    }
                });
            },

            toggleChannelMute: (channel: 'hour' | 'minute' | 'second' | 'arp') => {
                const mixer = get().mixer;
                const newMuted = !mixer[channel].muted;
                console.log(`[Store] Toggled mute for channel: ${channel} -> ${newMuted ? 'MUTED' : 'UNMUTED'}`);
                set({
                    mixer: {
                        ...mixer,
                        [channel]: { ...mixer[channel], muted: newMuted }
                    }
                });
            },

            setArpeggiator: (settings: Partial<ArpeggiatorSettings>) => {
                if (settings.enabled !== undefined) {
                    console.log(`[Store] Arpeggiator ${settings.enabled ? 'ENABLED' : 'DISABLED'}`);
                }
                set({
                    arpeggiator: { ...get().arpeggiator, ...settings }
                });
            },

            setVisualsEnabled: (enabled: boolean) => {
                console.log(`[Store] Visuals globally ${enabled ? 'ENABLED' : 'DISABLED'}`);
                set({ visualsEnabled: enabled });
            },

            toggleFullscreen: () => {
                const isFullscreen = get().isFullscreen;
                if (!isFullscreen) {
                    document.documentElement.requestFullscreen?.();
                } else {
                    document.exitFullscreen?.();
                }
                set({ isFullscreen: !isFullscreen });
            },

            setVisualLayer: (layer: 'hour' | 'minute' | 'second' | 'arp', settings: Partial<VisualLayerSettings>) => {
                console.log(`[Store] Visual layer '${layer}' updated:`, settings);
                const visualSettings = get().visualSettings;
                set({
                    visualSettings: {
                        ...visualSettings,
                        [layer]: { ...visualSettings[layer], ...settings }
                    }
                });
            },
        }),
        {
            name: 'synthclock-storage',
            version: 3,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration from version 0 to 1
                    if (persistedState.mixer && !persistedState.mixer.arp) {
                        persistedState.mixer.arp = { volume: -10, muted: false };
                    }
                    if (!persistedState.arpeggiator) {
                        persistedState.arpeggiator = { ...defaultArpSettings };
                    }
                }
                if (version < 2) {
                    // Migration to version 2: Force enable Arpeggiator (removed toggle)
                    if (persistedState.arpeggiator) {
                        persistedState.arpeggiator.enabled = true;
                    }
                }
                if (version < 3) {
                    // Migration to version 3: Reset visual settings with better defaults
                    // Previous defaults were too subtle (low intensity/size/opacity)
                    persistedState.visualSettings = {
                        hour: {
                            enabled: true, effect: 'ripples', colorSource: 'theme',
                            customColor: '#FFD700', intensity: 1.0, decayTime: 4.0,
                            positionMode: 'center', sizeMultiplier: 2.0, opacity: 1.0,
                        },
                        minute: {
                            enabled: true, effect: 'ripples', colorSource: 'theme',
                            customColor: '#00BFFF', intensity: 1.0, decayTime: 2.5,
                            positionMode: 'center', sizeMultiplier: 1.5, opacity: 0.9,
                        },
                        second: {
                            enabled: true, effect: 'particles', colorSource: 'theme',
                            customColor: '#FF6B6B', intensity: 1.0, decayTime: 1.5,
                            positionMode: 'random', sizeMultiplier: 1.0, opacity: 0.8,
                        },
                        arp: {
                            enabled: true, effect: 'particles', colorSource: 'theme',
                            customColor: '#A855F7', intensity: 0.8, decayTime: 0.8,
                            positionMode: 'random', sizeMultiplier: 0.8, opacity: 0.7,
                        },
                    };
                }
                return persistedState as AppState;
            },
            partialize: (state) => ({
                currentThemeId: state.currentThemeId,
                background: state.background,
                masterVolume: state.masterVolume,
                hourPreset: state.hourPreset,
                minutePreset: state.minutePreset,
                secondPreset: state.secondPreset,
                arpPreset: state.arpPreset,
                mixer: state.mixer,
                speed: state.speed,
                isReverse: state.isReverse,
                arpeggiator: state.arpeggiator,
                visualsEnabled: state.visualsEnabled,
                visualSettings: state.visualSettings,
            }),
        }
    )
);

export default useStore;
