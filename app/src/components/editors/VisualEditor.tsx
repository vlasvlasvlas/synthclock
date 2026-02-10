// Visual Editor Component - Per-layer visual settings
// Similar to SoundEditor with tabs for hour/minute/second/arp

import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import type { VisualEffect, ColorSource, PositionMode } from '../../hooks/useStore';

type Layer = 'hour' | 'minute' | 'second' | 'arp';

export const VisualEditor = () => {
    const [activeLayer, setActiveLayer] = useState<Layer>('second');
    const {
        visualSettings,
        setVisualLayer,
        visualsEnabled,
        setVisualsEnabled,
        isFullscreen,
        toggleFullscreen,
    } = useStore();

    const currentSettings = visualSettings[activeLayer];

    const effects: VisualEffect[] = ['particles', 'ripples', 'droplets', 'waves', 'none'];
    const colorSources: { value: ColorSource; label: string }[] = [
        { value: 'theme', label: 'Theme' },
        { value: 'pitchClass', label: 'Pitch' },
        { value: 'random', label: 'Random' },
        { value: 'custom', label: 'Custom' },
    ];
    const positionModes: PositionMode[] = ['random', 'center', 'clockEdge'];

    return (
        <div className="mac-window" style={{ height: '100%' }}>
            <div className="mac-window-title">
                <span className="mac-window-title-text">Visual Effects</span>
            </div>

            <div className="mac-window-content">
                {/* Global Enable */}
                <div style={{ marginBottom: 12 }}>
                    <div
                        className={`mac-checkbox ${visualsEnabled ? 'checked' : ''}`}
                        onClick={() => setVisualsEnabled(!visualsEnabled)}
                    >
                        <span className="mac-checkbox-box" />
                        <span style={{ fontWeight: 'bold' }}>Enable Visual Effects</span>
                    </div>
                </div>

                {/* Fullscreen Toggle */}
                <div style={{ marginBottom: 16 }}>
                    <div
                        className={`mac-checkbox ${isFullscreen ? 'checked' : ''}`}
                        onClick={toggleFullscreen}
                    >
                        <span className="mac-checkbox-box" />
                        <span>Fullscreen Mode</span>
                    </div>
                </div>

                {!visualsEnabled ? (
                    <div style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>
                        Visual effects are disabled
                    </div>
                ) : (
                    <>
                        {/* Layer Tabs */}
                        <div className="mac-tabs">
                            {(['second', 'minute', 'hour', 'arp'] as Layer[]).map(layer => (
                                <div
                                    key={layer}
                                    className={`mac-tab ${activeLayer === layer ? 'active' : ''}`}
                                    onClick={() => setActiveLayer(layer)}
                                >
                                    {layer === 'arp' ? 'Arp' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                                </div>
                            ))}
                        </div>

                        <div className="mac-panel">
                            {/* Layer Enable */}
                            <div
                                className={`mac-checkbox ${currentSettings.enabled ? 'checked' : ''}`}
                                onClick={() => setVisualLayer(activeLayer, { enabled: !currentSettings.enabled })}
                                style={{ marginBottom: 16 }}
                            >
                                <span className="mac-checkbox-box" />
                                <span>Enable {activeLayer} layer</span>
                            </div>

                            {/* Effect Type */}
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ display: 'block', marginBottom: 8 }}>Effect:</span>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {effects.map(effect => (
                                        <div
                                            key={effect}
                                            className={`mac-radio ${currentSettings.effect === effect ? 'selected' : ''}`}
                                            onClick={() => setVisualLayer(activeLayer, { effect })}
                                            style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                        >
                                            <span className="mac-radio-circle" />
                                            <span>{effect}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Color Source */}
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ display: 'block', marginBottom: 8 }}>Color:</span>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {colorSources.map(source => (
                                        <div
                                            key={source.value}
                                            className={`mac-radio ${currentSettings.colorSource === source.value ? 'selected' : ''}`}
                                            onClick={() => setVisualLayer(activeLayer, { colorSource: source.value })}
                                            style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                        >
                                            <span className="mac-radio-circle" />
                                            <span>{source.label}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Color Picker - always visible when Custom is selected */}
                                {currentSettings.colorSource === 'custom' && (
                                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12 }}>Pick color:</span>
                                        <input
                                            type="color"
                                            value={currentSettings.customColor || '#ffffff'}
                                            onChange={(e) => setVisualLayer(activeLayer, { customColor: e.target.value })}
                                            disabled={!currentSettings.enabled}
                                            style={{
                                                width: 40,
                                                height: 28,
                                                border: '2px solid #333',
                                                borderRadius: 3,
                                                cursor: 'pointer',
                                                opacity: currentSettings.enabled ? 1 : 0.5,
                                                padding: 0,
                                            }}
                                        />
                                        <span style={{
                                            display: 'inline-block',
                                            width: 60,
                                            height: 20,
                                            backgroundColor: currentSettings.customColor || '#ffffff',
                                            border: '1px solid #999',
                                            borderRadius: 3,
                                        }} />
                                        <span style={{ fontSize: 11, color: '#666' }}>{currentSettings.customColor}</span>
                                    </div>
                                )}
                            </div>

                            {/* Position Mode */}
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ display: 'block', marginBottom: 8 }}>Position:</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {positionModes.map(mode => (
                                        <div
                                            key={mode}
                                            className={`mac-radio ${currentSettings.positionMode === mode ? 'selected' : ''}`}
                                            onClick={() => setVisualLayer(activeLayer, { positionMode: mode })}
                                            style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                        >
                                            <span className="mac-radio-circle" />
                                            <span>{mode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mac-divider" />

                            {/* Intensity */}
                            <div className="mac-slider" style={{ marginBottom: 12 }}>
                                <span className="mac-slider-label">Intensity</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={currentSettings.intensity}
                                    onChange={(e) => setVisualLayer(activeLayer, { intensity: parseFloat(e.target.value) })}
                                    disabled={!currentSettings.enabled}
                                    style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                />
                                <span className="mac-slider-value">{(currentSettings.intensity * 100).toFixed(0)}%</span>
                            </div>

                            {/* Size Multiplier */}
                            <div className="mac-slider" style={{ marginBottom: 12 }}>
                                <span className="mac-slider-label">Size</span>
                                <input
                                    type="range"
                                    min="0.3"
                                    max="3"
                                    step="0.1"
                                    value={currentSettings.sizeMultiplier}
                                    onChange={(e) => setVisualLayer(activeLayer, { sizeMultiplier: parseFloat(e.target.value) })}
                                    disabled={!currentSettings.enabled}
                                    style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                />
                                <span className="mac-slider-value">{currentSettings.sizeMultiplier.toFixed(1)}x</span>
                            </div>

                            {/* Decay Time */}
                            <div className="mac-slider" style={{ marginBottom: 12 }}>
                                <span className="mac-slider-label">Decay</span>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={currentSettings.decayTime}
                                    onChange={(e) => setVisualLayer(activeLayer, { decayTime: parseFloat(e.target.value) })}
                                    disabled={!currentSettings.enabled}
                                    style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                />
                                <span className="mac-slider-value">{currentSettings.decayTime.toFixed(1)}s</span>
                            </div>

                            {/* Opacity */}
                            <div className="mac-slider">
                                <span className="mac-slider-label">Opacity</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={currentSettings.opacity}
                                    onChange={(e) => setVisualLayer(activeLayer, { opacity: parseFloat(e.target.value) })}
                                    disabled={!currentSettings.enabled}
                                    style={{ opacity: currentSettings.enabled ? 1 : 0.5 }}
                                />
                                <span className="mac-slider-value">{(currentSettings.opacity * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VisualEditor;
