// Multi Renderer - Dispatches to correct renderer based on effect settings
// Allows different layers to use different visual effects simultaneously

import type { CanvasRenderer } from '../VisualEngine';
import type { VisualLayerSettings, VisualEffect } from '../../../hooks/useStore';
import { ParticleRenderer } from './ParticleRenderer';
import { RippleRenderer } from './RippleRenderer';
import { DropletRenderer } from './DropletRenderer';
import { WaveRenderer } from './WaveRenderer';

export class MultiRenderer implements CanvasRenderer {
    id = 'multi';
    name = 'Multi Effect Renderer';

    private canvas: HTMLCanvasElement | null = null;
    private renderers: Map<VisualEffect, CanvasRenderer> = new Map();
    private initialized = false;

    constructor() {
        // Instantiate renderers once
        this.renderers.set('particles', new ParticleRenderer());
        this.renderers.set('ripples', new RippleRenderer());
        this.renderers.set('droplets', new DropletRenderer());
        this.renderers.set('waves', new WaveRenderer());
        // 'none' effect maps to nothing
    }

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize all renderers with the shared canvas
        for (const [key, renderer] of this.renderers.entries()) {
            try {
                renderer.init(canvas);
            } catch (e) {
                console.error(`[MultiRenderer] Failed to init ${key}:`, e);
            }
        }
        this.initialized = true;
        console.log('[MultiRenderer] Initialized all sub-renderers');
    }

    dispose(): void {
        for (const renderer of this.renderers.values()) {
            try {
                renderer.dispose();
            } catch (e) {
                console.error('[MultiRenderer] Error disposing sub-renderer:', e);
            }
        }
        // Do not clear map, just dispose content. We keep instances for re-init if needed.
        this.canvas = null;
        this.initialized = false;
        console.log('[MultiRenderer] Disposed');
    }

    render(time: number): void {
        if (!this.canvas || !this.initialized) return;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        // CRITICAL: We must clear the canvas HERE, once per frame.
        // Sub-renderers must NOT clear the canvas, or they will wipe each other out.
        // However, existing renderers likely have `clearRect`.
        // We will rely on the fact that we are compositing.
        // If sub-renderers clear properly, they might just clear their own "layer" if they were offscreen,
        // but they are sharing the main canvas.

        // Strategy: Clear main canvas.
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Then render each active effect type.
        // We don't know which ones are "active" without passing settings, 
        // but `render` allows them to update physics/draw.
        // Optimization: render all, or only those we know are in use?
        // For now, render all. If they have no active particles, they draw nothing.

        for (const renderer of this.renderers.values()) {
            renderer.render(time);
        }
    }

    // Dispatch to correct renderer based on settings
    onSecond(value: number, pitch: string, color: string, settings: VisualLayerSettings): void {
        if (settings.effect === 'none') return;
        const renderer = this.renderers.get(settings.effect);
        if (renderer?.onSecond) {
            renderer.onSecond(value, pitch, color, settings);
        }
    }

    onMinute(value: number, pitch: string, color: string, settings: VisualLayerSettings): void {
        if (settings.effect === 'none') return;
        const renderer = this.renderers.get(settings.effect);
        if (renderer?.onMinute) {
            renderer.onMinute(value, pitch, color, settings);
        }
    }

    onHour(hour: number, color: string, settings: VisualLayerSettings): void {
        if (settings.effect === 'none') return;
        const renderer = this.renderers.get(settings.effect);
        if (renderer?.onHour) {
            renderer.onHour(hour, color, settings);
        }
    }

    onArpNote(pitch: string, color: string, settings: VisualLayerSettings): void {
        if (settings.effect === 'none') return;
        const renderer = this.renderers.get(settings.effect);
        if (renderer?.onArpNote) {
            renderer.onArpNote(pitch, color, settings);
        }
    }

    // Clear all effects across all renderers
    clearAll(): void {
        for (const renderer of this.renderers.values()) {
            if ((renderer as any).clearAll) {
                (renderer as any).clearAll();
            }
        }
    }
}

export default MultiRenderer;
