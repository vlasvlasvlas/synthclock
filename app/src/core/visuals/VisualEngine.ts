// Visual Engine - Core rendering system for reactive visuals
// Pluggable architecture supporting multiple renderer types
// Enhanced with comprehensive logging for debugging

import type { VisualLayerSettings } from '../../hooks/useStore';

// Debug logging configuration
const DEBUG = true;
const log = (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`[VisualEngine] ${msg}`, ...args);
};
const warn = (msg: string, ...args: unknown[]) => {
    console.warn(`[VisualEngine] ⚠️ ${msg}`, ...args);
};
const error = (msg: string, ...args: unknown[]) => {
    console.error(`[VisualEngine] ❌ ${msg}`, ...args);
};

export interface CanvasRenderer {
    id: string;
    name: string;

    // Lifecycle
    init(canvas: HTMLCanvasElement): void;
    dispose(): void;

    // Per-frame render
    render(time: number): void;

    // Clear all effects (for disabling layers)
    clearAll?(): void;

    // Audio event triggers with settings
    onSecond?(value: number, pitch: string, color: string, settings: VisualLayerSettings): void;
    onMinute?(value: number, pitch: string, color: string, settings: VisualLayerSettings): void;
    onHour?(hour: number, color: string, settings: VisualLayerSettings): void;
    onArpNote?(pitch: string, color: string, settings: VisualLayerSettings): void;
}

class VisualEngine {
    private canvas: HTMLCanvasElement | null = null;
    private renderer: CanvasRenderer | null = null;
    private rafId: number | null = null;
    private isRunning = false;
    private _lastTime = 0;
    private frameCount = 0;

    constructor() {
        log('Initialized');
    }

    // Set the canvas element
    setCanvas(canvas: HTMLCanvasElement): void {
        if (!canvas) {
            error('setCanvas called with null canvas');
            return;
        }
        this.canvas = canvas;
        log(`Canvas set: ${canvas.width}x${canvas.height}`);

        if (this.renderer) {
            try {
                this.renderer.init(canvas);
                log(`Renderer re-initialized on new canvas`);
            } catch (e) {
                error('Failed to init renderer on canvas:', e);
            }
        }
    }

    // Set the active renderer
    setRenderer(renderer: CanvasRenderer): void {
        // Dispose previous renderer
        if (this.renderer) {
            try {
                this.renderer.dispose();
                log(`Previous renderer disposed: ${this.renderer.id}`);
            } catch (e) {
                warn('Error disposing previous renderer:', e);
            }
        }

        this.renderer = renderer;

        // Initialize if canvas is ready
        if (this.canvas) {
            try {
                this.renderer.init(this.canvas);
                log(`Renderer set and initialized: ${renderer.name} (${renderer.id})`);
            } catch (e) {
                error('Failed to initialize renderer:', e);
            }
        } else {
            log(`Renderer set (canvas not ready yet): ${renderer.name}`);
        }
    }

    // Start the render loop
    start(): void {
        if (this.isRunning) {
            log('Already running, ignoring start()');
            return;
        }

        if (!this.renderer) {
            warn('Cannot start: no renderer set');
            return;
        }

        if (!this.canvas) {
            warn('Cannot start: no canvas set');
            return;
        }

        this.isRunning = true;
        this.frameCount = 0;
        this._lastTime = performance.now();
        this.animate();
        log('✅ Started render loop');
    }

    // Stop the render loop
    stop(): void {
        if (!this.isRunning) {
            log('Already stopped, ignoring stop()');
            return;
        }

        this.isRunning = false;

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        log(`⏹️ Stopped (rendered ${this.frameCount} frames)`);
    }

    // Animation loop
    private animate = (): void => {
        if (!this.isRunning) return;

        const now = performance.now();

        if (this.renderer) {
            try {
                this.renderer.render(now);
                this.frameCount++;
            } catch (e) {
                error('Render error:', e);
            }
        }

        this._lastTime = now;
        this.rafId = requestAnimationFrame(this.animate);
    };

    // Trigger visual events from audio layer - now with settings and logging
    triggerSecond(value: number, pitch: string, color: string, settings: VisualLayerSettings): void {
        if (!settings.enabled) {
            // Silently skip - disabled layer
            return;
        }
        if (!this.renderer?.onSecond) {
            warn('triggerSecond: no renderer or onSecond method');
            return;
        }
        try {
            this.renderer.onSecond(value, pitch, color, settings);
        } catch (e) {
            error('triggerSecond failed:', e);
        }
    }

    triggerMinute(value: number, pitch: string, color: string, settings: VisualLayerSettings): void {
        if (!settings.enabled) return;
        if (!this.renderer?.onMinute) {
            warn('triggerMinute: no renderer or onMinute method');
            return;
        }
        try {
            this.renderer.onMinute(value, pitch, color, settings);
        } catch (e) {
            error('triggerMinute failed:', e);
        }
    }

    triggerHour(hour: number, color: string, settings: VisualLayerSettings): void {
        if (!settings.enabled) return;
        if (!this.renderer?.onHour) {
            warn('triggerHour: no renderer or onHour method');
            return;
        }
        try {
            this.renderer.onHour(hour, color, settings);
        } catch (e) {
            error('triggerHour failed:', e);
        }
    }

    triggerArpNote(pitch: string, color: string, settings: VisualLayerSettings): void {
        if (!settings.enabled) return;
        if (!this.renderer?.onArpNote) {
            warn('triggerArpNote: no renderer or onArpNote method');
            return;
        }
        try {
            this.renderer.onArpNote(pitch, color, settings);
        } catch (e) {
            error('triggerArpNote failed:', e);
        }
    }

    // Clear all visual effects (e.g. when disabling layers)
    clearAll(): void {
        if (this.renderer?.clearAll) {
            try {
                this.renderer.clearAll();
                log('Cleared all visual effects');
            } catch (e) {
                error('clearAll failed:', e);
            }
        }
    }

    // Dispose everything
    dispose(): void {
        log('Disposing...');
        this.stop();

        if (this.renderer) {
            try {
                this.renderer.dispose();
            } catch (e) {
                warn('Error during renderer dispose:', e);
            }
            this.renderer = null;
        }

        this.canvas = null;
        log('Disposed');
    }

    // Check if running
    getIsRunning(): boolean {
        return this.isRunning;
    }

    // Debug info
    getDebugInfo(): { running: boolean; renderer: string | null; frameCount: number } {
        return {
            running: this.isRunning,
            renderer: this.renderer?.id || null,
            frameCount: this.frameCount,
        };
    }
}

// Singleton instance
export const visualEngine = new VisualEngine();
export default VisualEngine;
