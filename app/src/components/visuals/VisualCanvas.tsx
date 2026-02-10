// Visual Canvas Component - Full-screen canvas for visual effects
// Renders behind the clock UI, reacts to audio events

import { useEffect, useRef } from 'react';
import { visualEngine } from '../../core/visuals/VisualEngine';
import { MultiRenderer } from '../../core/visuals/renderers/MultiRenderer';
import { useStore } from '../../hooks/useStore';

export const VisualCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { visualsEnabled, isPlaying } = useStore();

    useEffect(() => {
        if (!canvasRef.current) return;

        // Set up canvas - this might re-init existing renderer
        visualEngine.setCanvas(canvasRef.current);

        // Check if we already have a MultiRenderer to avoid resetting state
        const debug = visualEngine.getDebugInfo();
        if (debug.renderer !== 'multi') {
            const multiRenderer = new MultiRenderer();
            visualEngine.setRenderer(multiRenderer);
        }

        return () => {
            // Optional: Don't dispose on unmount if we want persistence across re-renders
            // But for now, safe disposal is better
            visualEngine.dispose();
        };
    }, []);

    // Start/stop based on visualsEnabled and isPlaying
    useEffect(() => {
        if (visualsEnabled && isPlaying) {
            visualEngine.start();
        } else {
            visualEngine.stop();
        }
    }, [visualsEnabled, isPlaying]);

    // Always render the canvas, just hide it when disabled
    // This prevents unmounting which would break the engine state
    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
                visibility: visualsEnabled ? 'visible' : 'hidden',
            }}
        />
    );
};

export default VisualCanvas;

