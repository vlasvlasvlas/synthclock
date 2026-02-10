// Droplet Renderer - Falling droplets with gravity
// Creates rain-like effects on audio events

import type { CanvasRenderer } from '../VisualEngine';
import type { VisualLayerSettings, PositionMode } from '../../../hooks/useStore';

interface Droplet {
    x: number;
    y: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    opacity: number;
    trail: { x: number; y: number }[];
}

export class DropletRenderer implements CanvasRenderer {
    id = 'droplets';
    name = 'Droplet Effect';

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private droplets: Droplet[] = [];
    private width = 0;
    private height = 0;

    // Base configuration
    private baseConfig = {
        second: { count: 2, size: 4, speed: 3, trailLength: 5 },
        minute: { count: 5, size: 8, speed: 2.5, trailLength: 8 },
        hour: { count: 15, size: 12, speed: 2, trailLength: 12 },
        arp: { count: 1, size: 3, speed: 4, trailLength: 3 },
        gravity: 0.15,
    };

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize);
        console.log('[DropletRenderer] Initialized');
    }

    dispose(): void {
        window.removeEventListener('resize', this.resize);
        this.droplets = [];
        this.canvas = null;
        this.ctx = null;
        console.log('[DropletRenderer] Disposed');
    }

    private resize = (): void => {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    };

    private getSpawnPosition(mode: PositionMode): { x: number; y: number } {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        switch (mode) {
            case 'center':
                return {
                    x: centerX + (Math.random() - 0.5) * 100,
                    y: centerY - 50,
                };
            case 'clockEdge':
                return {
                    x: centerX + (Math.random() - 0.5) * 200,
                    y: centerY - 100,
                };
            case 'random':
            default:
                return {
                    x: Math.random() * this.width,
                    y: -20,
                };
        }
    }

    private spawn(type: 'second' | 'minute' | 'hour' | 'arp', color: string, settings: VisualLayerSettings): void {
        const baseCfg = this.baseConfig[type];
        const count = Math.max(1, Math.round(baseCfg.count * settings.intensity));
        const life = settings.decayTime * 1000;

        for (let i = 0; i < count; i++) {
            const pos = this.getSpawnPosition(settings.positionMode);
            this.droplets.push({
                x: pos.x,
                y: pos.y,
                vy: baseCfg.speed * (0.8 + Math.random() * 0.4),
                size: baseCfg.size * settings.sizeMultiplier,
                color,
                life,
                maxLife: life,
                opacity: settings.opacity,
                trail: [],
            });
        }
    }

    render(_time: number): void {
        if (!this.ctx || !this.canvas) return;

        // NOTE: Don't clear canvas - MultiRenderer handles that

        for (let i = this.droplets.length - 1; i >= 0; i--) {
            const d = this.droplets[i];

            // Update trail
            d.trail.unshift({ x: d.x, y: d.y });
            if (d.trail.length > 10) d.trail.pop();

            // Update physics
            d.vy += this.baseConfig.gravity;
            d.y += d.vy;

            // Update lifetime
            d.life -= 16;

            // Remove if dead or off screen
            if (d.life <= 0 || d.y > this.height + 50) {
                this.droplets.splice(i, 1);
                continue;
            }

            const lifeRatio = d.life / d.maxLife;
            const alpha = lifeRatio * d.opacity;

            // Draw trail
            for (let t = 0; t < d.trail.length; t++) {
                const trailAlpha = alpha * (1 - t / d.trail.length) * 0.5;
                const trailSize = d.size * (1 - t / d.trail.length * 0.5);
                this.ctx.beginPath();
                this.ctx.arc(d.trail[t].x, d.trail[t].y, trailSize, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colorWithAlpha(d.color, trailAlpha);
                this.ctx.fill();
            }

            // Draw droplet
            this.ctx.beginPath();
            this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colorWithAlpha(d.color, alpha);
            this.ctx.fill();
        }
    }

    private colorWithAlpha(color: string, alpha: number): string {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }
        return `rgba(255, 255, 255, ${alpha})`;
    }

    // Clear all droplets (when layer is disabled)
    clearAll(): void {
        this.droplets = [];
    }

    onSecond(_value: number, _pitch: string, color: string, settings: VisualLayerSettings): void {
        this.spawn('second', color, settings);
    }

    onMinute(_value: number, _pitch: string, color: string, settings: VisualLayerSettings): void {
        this.spawn('minute', color, settings);
    }

    onHour(_hour: number, color: string, settings: VisualLayerSettings): void {
        this.spawn('hour', color, settings);
    }

    onArpNote(_pitch: string, color: string, settings: VisualLayerSettings): void {
        this.spawn('arp', color, settings);
    }
}

export default DropletRenderer;
