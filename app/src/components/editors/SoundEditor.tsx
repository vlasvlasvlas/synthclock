// Sound Editor Component - Classic Mac Style

import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { getPresetsByLayer } from '../../core/audio/presets';
import type { WaveformType, SynthesisType, FilterType } from '../../core/audio/presets';

type Layer = 'hour' | 'minute' | 'second' | 'arp';

export const SoundEditor = () => {
    const [activeLayer, setActiveLayer] = useState<Layer>('hour');
    const {
        hourPreset,
        minutePreset,
        secondPreset,
        arpPreset,
        setPreset,
        updatePresetParameter,
        arpeggiator,
        setArpeggiator,
    } = useStore();

    const currentPreset = activeLayer === 'hour'
        ? hourPreset
        : activeLayer === 'minute'
            ? minutePreset
            : activeLayer === 'second'
                ? secondPreset
                : arpPreset;

    // Use 'second' presets for arp layer
    const layerForPresets = activeLayer === 'arp' ? 'second' : activeLayer;
    const layerPresets = getPresetsByLayer(layerForPresets);

    const handlePresetChange = (direction: 'prev' | 'next') => {
        const currentIndex = layerPresets.findIndex(p => p.id === currentPreset.id);
        let newIndex = direction === 'next'
            ? (currentIndex + 1) % layerPresets.length
            : (currentIndex - 1 + layerPresets.length) % layerPresets.length;
        setPreset(activeLayer, layerPresets[newIndex]);
    };

    const waveforms: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
    const synthTypes: SynthesisType[] = ['subtractive', 'fm', 'am', 'additive'];
    const filterTypes: FilterType[] = ['lowpass', 'highpass', 'bandpass', 'notch'];

    return (
        <div className="mac-window" style={{ height: '100%' }}>
            <div className="mac-window-title">
                <span className="mac-window-title-text">Sound Editor</span>
            </div>

            <div className="mac-window-content">
                {/* Layer Tabs */}
                <div className="mac-tabs">
                    {(['hour', 'minute', 'second', 'arp'] as Layer[]).map(layer => (
                        <div
                            key={layer}
                            className={`mac-tab ${activeLayer === layer ? 'active' : ''}`}
                            onClick={() => setActiveLayer(layer)}
                        >
                            {layer === 'arp' ? 'Arp' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                        </div>
                    ))}
                </div>

                <div className="mac-tab-content">
                    {/* Arpeggiator Controls - Only show on Arp tab */}
                    {activeLayer === 'arp' && (
                        <div className="mac-panel">
                            <div className="mac-panel-title">Arpeggiator</div>

                            {/* Enable Toggle Removed - Use Mixer Mute instead */}

                            {/* Pattern */}
                            <div style={{ marginBottom: 8 }}>
                                <span style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Pattern:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {(['up', 'down', 'upDown', 'downUp', 'random'] as const).map(p => (
                                        <div
                                            key={p}
                                            className={`mac-radio ${arpeggiator.pattern === p ? 'selected' : ''}`}
                                            onClick={() => setArpeggiator({ pattern: p })}
                                            style={{ fontSize: 10, opacity: arpeggiator.enabled ? 1 : 0.5 }}
                                        >
                                            <span className="mac-radio-circle" />
                                            <span>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rate */}
                            <div className="mac-slider">
                                <span className="mac-slider-label">Rate</span>
                                <select
                                    value={arpeggiator.rate}
                                    onChange={(e) => setArpeggiator({ rate: e.target.value as '1n' | '2n' | '4n' | '8n' | '16n' })}
                                    disabled={!arpeggiator.enabled}
                                    style={{
                                        fontFamily: 'inherit',
                                        fontSize: 11,
                                        padding: '2px 4px',
                                        opacity: arpeggiator.enabled ? 1 : 0.5
                                    }}
                                >
                                    <option value="1n">1/1 (whole)</option>
                                    <option value="2n">1/2 (half)</option>
                                    <option value="4n">1/4</option>
                                    <option value="8n">1/8</option>
                                    <option value="16n">1/16</option>
                                </select>
                            </div>

                            {/* Glissando */}
                            <div className="mac-slider">
                                <span className="mac-slider-label">Glissando</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="2000"
                                    step="10"
                                    value={arpeggiator.glissando}
                                    onChange={(e) => setArpeggiator({ glissando: parseFloat(e.target.value) })}
                                    disabled={!arpeggiator.enabled}
                                    style={{ opacity: arpeggiator.enabled ? 1 : 0.5 }}
                                />
                                <span className="mac-slider-value">{arpeggiator.glissando}ms</span>
                            </div>
                        </div>
                    )}

                    <div className="mac-divider" />

                    {/* Preset Selector */}
                    <div className="preset-selector">
                        <div className="preset-selector-arrows">
                            <button className="preset-arrow" onClick={() => handlePresetChange('prev')}>
                                ◀
                            </button>
                            <button className="preset-arrow" onClick={() => handlePresetChange('next')}>
                                ▶
                            </button>
                        </div>
                        <span className="preset-name">{currentPreset.name}</span>
                    </div>

                    <div className="mac-divider" />

                    {/* Waveform Selection */}
                    <div className="mac-panel">
                        <div className="mac-panel-title">Waveform</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {waveforms.map(wf => (
                                <div
                                    key={wf}
                                    className={`mac-radio ${currentPreset.waveform === wf ? 'selected' : ''}`}
                                    onClick={() => updatePresetParameter(activeLayer, 'waveform', wf)}
                                >
                                    <span className="mac-radio-circle" />
                                    <span>{wf}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Synthesis Type */}
                    <div className="mac-panel">
                        <div className="mac-panel-title">Synthesis Type</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {synthTypes.map(st => (
                                <div
                                    key={st}
                                    className={`mac-radio ${currentPreset.synthesisType === st ? 'selected' : ''}`}
                                    onClick={() => updatePresetParameter(activeLayer, 'synthesisType', st)}
                                >
                                    <span className="mac-radio-circle" />
                                    <span>{st}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ADSR Envelope */}
                    <div className="mac-panel">
                        <div className="mac-panel-title">Envelope (ADSR)</div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Attack</span>
                            <input
                                type="range"
                                min="0.001"
                                max="5"
                                step="0.01"
                                value={currentPreset.envelope.attack}
                                onChange={(e) => updatePresetParameter(activeLayer, 'envelope', {
                                    ...currentPreset.envelope,
                                    attack: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{currentPreset.envelope.attack.toFixed(2)}s</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Decay</span>
                            <input
                                type="range"
                                min="0.001"
                                max="5"
                                step="0.01"
                                value={currentPreset.envelope.decay}
                                onChange={(e) => updatePresetParameter(activeLayer, 'envelope', {
                                    ...currentPreset.envelope,
                                    decay: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{currentPreset.envelope.decay.toFixed(2)}s</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Sustain</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.envelope.sustain}
                                onChange={(e) => updatePresetParameter(activeLayer, 'envelope', {
                                    ...currentPreset.envelope,
                                    sustain: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{(currentPreset.envelope.sustain * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Release</span>
                            <input
                                type="range"
                                min="0.01"
                                max="10"
                                step="0.01"
                                value={currentPreset.envelope.release}
                                onChange={(e) => updatePresetParameter(activeLayer, 'envelope', {
                                    ...currentPreset.envelope,
                                    release: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{currentPreset.envelope.release.toFixed(2)}s</span>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="mac-panel">
                        <div className="mac-panel-title">Filter</div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            {filterTypes.map(ft => (
                                <div
                                    key={ft}
                                    className={`mac-radio ${currentPreset.filter.type === ft ? 'selected' : ''}`}
                                    onClick={() => updatePresetParameter(activeLayer, 'filter', {
                                        ...currentPreset.filter,
                                        type: ft
                                    })}
                                    style={{ fontSize: 11 }}
                                >
                                    <span className="mac-radio-circle" />
                                    <span>{ft}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Cutoff</span>
                            <input
                                type="range"
                                min="20"
                                max="20000"
                                step="1"
                                value={currentPreset.filter?.frequency ?? 1000}
                                onChange={(e) => updatePresetParameter(activeLayer, 'filter', {
                                    ...currentPreset.filter,
                                    frequency: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{Math.round(currentPreset.filter?.frequency ?? 1000)}Hz</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Resonance</span>
                            <input
                                type="range"
                                min="0.1"
                                max="20"
                                step="0.1"
                                value={currentPreset.filter?.resonance ?? 1}
                                onChange={(e) => updatePresetParameter(activeLayer, 'filter', {
                                    ...currentPreset.filter,
                                    resonance: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{(currentPreset.filter?.resonance ?? 1).toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Effects */}
                    <div className="mac-panel">
                        <div className="mac-panel-title">Effects</div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Reverb</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.effects.reverb}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    reverb: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{(currentPreset.effects.reverb * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Delay</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.effects.delay}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    delay: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{(currentPreset.effects.delay * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Chorus</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.effects.chorus || 0}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    chorus: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{((currentPreset.effects.chorus || 0) * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Distortion</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.effects.distortion || 0}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    distortion: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{((currentPreset.effects.distortion || 0) * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Tremolo</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={currentPreset.effects.tremolo || 0}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    tremolo: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{((currentPreset.effects.tremolo || 0) * 100).toFixed(0)}%</span>
                        </div>

                        <div className="mac-slider">
                            <span className="mac-slider-label">Gate Thresh</span>
                            <input
                                type="range"
                                min="-100"
                                max="0"
                                step="1"
                                value={currentPreset.effects.noiseGate || -100}
                                onChange={(e) => updatePresetParameter(activeLayer, 'effects', {
                                    ...currentPreset.effects,
                                    noiseGate: parseFloat(e.target.value)
                                })}
                            />
                            <span className="mac-slider-value">{currentPreset.effects.noiseGate || -100}dB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoundEditor;
