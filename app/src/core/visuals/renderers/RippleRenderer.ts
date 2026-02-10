// Ripple Renderer - Expanding circles that fade out
// Creates ripple effects on audio events

import type { CanvasRenderer } from '../VisualEngine';
import type { VisualLayerSettings, PositionMode } from '../../../hooks/useStore';

interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    life: number;
    maxLife: number;
    opacity: number;
    strokeWidth: number;
}

export class RippleRenderer implements CanvasRenderer {
    id = 'ripples';
    name = 'Ripple Effect';

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private ripples: Ripple[] = [];
    private width = 0;
    private height = 0;

    // Base configuration
    private baseConfig = {
        second: { maxRadius: 50, life: 800, strokeWidth: 2 },
        minute: { maxRadius: 150, life: 1500, strokeWidth: 4 },
        hour: { maxRadius: 300, life: 3000, strokeWidth: 6 },
        arp: { maxRadius: 30, life: 400, strokeWidth: 1 },
    };

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize);
        console.log('[RippleRenderer] Initialized');
    }

    dispose(): void {
        window.removeEventListener('resize', this.resize);
        this.ripples = [];
        this.canvas = null;
        this.ctx = null;
        console.log('[RippleRenderer] Disposed');
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
        const radius = Math.min(this.width, this.height) * 0.2;

        switch (mode) {
            case 'center':
                return { x: centerX, y: centerY };
            case 'clockEdge':
                const angle = Math.random() * Math.PI * 2;
                return {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                };
            case 'random':
            default:
                return {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                };
        }
    }

    private spawn(type: 'second' | 'minute' | 'hour' | 'arp', color: string, settings: VisualLayerSettings): void {
        const baseCfg = this.baseConfig[type];
        const count = Math.max(1, Math.round(settings.intensity * 3));
        const life = settings.decayTime * 1000;

        for (let i = 0; i < count; i++) {
            const pos = this.getSpawnPosition(settings.positionMode);
            this.ripples.push({
                x: pos.x,
                y: pos.y,
                radius: 0,
                maxRadius: baseCfg.maxRadius * settings.sizeMultiplier,
                color,
                life,
                maxLife: life,
                opacity: settings.opacity,
                strokeWidth: baseCfg.strokeWidth * settings.sizeMultiplier,
            });
        }
    }

    render(_time: number): void {
        if (!this.ctx || !this.canvas) return;

        // NOTE: Don't clear canvas - MultiRenderer handles that

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];

            r.life -= 16;
            if (r.life <= 0) {
                this.ripples.splice(i, 1);
                continue;
            }

            const progress = 1 - (r.life / r.maxLife);
            r.radius = r.maxRadius * progress;
            const alpha = (1 - progress) * r.opacity;

            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = this.colorWithAlpha(r.color, alpha);
            this.ctx.lineWidth = r.strokeWidth * (1 - progress * 0.5);
            this.ctx.stroke();
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

    // Clear all ripples (when layer is disabled)
    clearAll(): void {
        this.ripples = [];
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

export default RippleRenderer;
