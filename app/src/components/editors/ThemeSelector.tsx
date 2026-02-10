// Theme Selector Component - Classic Mac Style

import { useState } from 'react';
import { themes } from '../../core/visuals/themes';
import type { Theme } from '../../core/visuals/themes';
import { useStore } from '../../hooks/useStore';
import type { BackgroundPattern } from '../../hooks/useStore';
import { VisualEditor } from './VisualEditor';

type SubTab = 'theme' | 'background' | 'visuals';

export const ThemeSelector = () => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('visuals');
    const {
        currentThemeId,
        setTheme,
        background,
        setBackground,
        theme
    } = useStore();

    const themeList = Object.values(themes);
    const patterns: BackgroundPattern[] = ['solid', 'scanlines', 'noise', 'grid', 'stars', 'gradient'];

    // Apply theme class to body
    const applyThemeClass = (themeId: string) => {
        document.body.className = '';
        if (themeId !== 'classic-mac') {
            document.body.classList.add(`theme-${themeId}`);
        }
    };

    const handleThemeChange = (themeId: string) => {
        setTheme(themeId);
        applyThemeClass(themeId);
    };

    return (
        <div className="mac-window" style={{ height: '100%' }}>
            <div className="mac-window-title">
                <span className="mac-window-title-text">Theme & Visuals</span>
            </div>

            <div className="mac-window-content">
                {/* Sub-Tabs */}
                <div className="mac-tabs">
                    {(['visuals', 'theme', 'background'] as SubTab[]).map(tab => (
                        <div
                            key={tab}
                            className={`mac-tab ${activeSubTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveSubTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </div>
                    ))}
                </div>

                {/* Visuals Tab - VisualEditor */}
                {activeSubTab === 'visuals' && <VisualEditor />}

                {/* Theme Tab */}
                {activeSubTab === 'theme' && (
                    <div className="mac-panel">
                        <div className="mac-panel-title">Visual Theme</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {themeList.map(t => (
                                <ThemePreview5
                                    key={t.id}
                                    theme={t}
                                    isSelected={currentThemeId === t.id}
                                    onClick={() => handleThemeChange(t.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Background Tab */}
                {activeSubTab === 'background' && (
                    <div className="mac-panel">
                        <div className="mac-panel-title">Background</div>

                        {/* Color Picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <span style={{ minWidth: 80 }}>Color:</span>
                            <input
                                type="color"
                                value={background.color}
                                onChange={(e) => setBackground({ color: e.target.value })}
                                style={{
                                    width: 40,
                                    height: 30,
                                    border: `1px solid ${theme.colors.border}`,
                                    cursor: 'pointer'
                                }}
                            />
                            <input
                                type="text"
                                value={background.color}
                                onChange={(e) => setBackground({ color: e.target.value })}
                                style={{
                                    border: `1px solid ${theme.colors.border}`,
                                    padding: '4px 8px',
                                    fontFamily: theme.fontFamily,
                                    width: 100,
                                }}
                            />
                        </div>

                        {/* Pattern Selection */}
                        <div style={{ marginBottom: 16 }}>
                            <span style={{ display: 'block', marginBottom: 8 }}>Pattern:</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {patterns.map(p => (
                                    <div
                                        key={p}
                                        className={`mac-radio ${background.pattern === p ? 'selected' : ''}`}
                                        onClick={() => setBackground({ pattern: p })}
                                    >
                                        <span className="mac-radio-circle" />
                                        <span>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opacity */}
                        <div className="mac-slider">
                            <span className="mac-slider-label">Opacity</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={background.opacity}
                                onChange={(e) => setBackground({ opacity: parseFloat(e.target.value) })}
                            />
                            <span className="mac-slider-value">{(background.opacity * 100).toFixed(0)}%</span>
                        </div>

                        {/* Animated */}
                        <div
                            className={`mac-checkbox ${background.animated ? 'checked' : ''}`}
                            onClick={() => setBackground({ animated: !background.animated })}
                            style={{ marginTop: 16 }}
                        >
                            <span className="mac-checkbox-box" />
                            <span>Animated</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Theme Preview Card
interface ThemePreviewProps {
    theme: Theme;
    isSelected: boolean;
    onClick: () => void;
}

const ThemePreview5 = ({ theme, isSelected, onClick }: ThemePreviewProps) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 8,
                border: `2px solid ${isSelected ? '#000' : '#ccc'}`,
                background: isSelected ? '#f0f0f0' : 'white',
                cursor: 'pointer',
            }}
        >
            {/* Color Preview */}
            <div style={{ display: 'flex', gap: 2 }}>
                <div style={{
                    width: 20,
                    height: 20,
                    background: theme.colors.background,
                    border: '1px solid #000'
                }} />
                <div style={{
                    width: 20,
                    height: 20,
                    background: theme.colors.foreground,
                    border: '1px solid #000'
                }} />
                <div style={{
                    width: 20,
                    height: 20,
                    background: theme.colors.hourHand,
                    border: '1px solid #000'
                }} />
            </div>

            {/* Theme Info */}
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{theme.name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{theme.description}</div>
            </div>

            {/* Selection Indicator */}
            <div className={`mac-radio ${isSelected ? 'selected' : ''}`}>
                <span className="mac-radio-circle" />
            </div>
        </div>
    );
};

export default ThemeSelector;
