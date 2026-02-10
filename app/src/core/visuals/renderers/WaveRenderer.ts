// Wave Renderer - Sine waves that ripple across screen
// Creates wave effects on audio events

import type { CanvasRenderer } from '../VisualEngine';
import type { VisualLayerSettings } from '../../../hooks/useStore';

interface Wave {
    startTime: number;
    color: string;
    amplitude: number;
    frequency: number;
    speed: number;
    life: number;
    maxLife: number;
    opacity: number;
    yOffset: number;
}

export class WaveRenderer implements CanvasRenderer {
    id = 'waves';
    name = 'Wave Effect';

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private waves: Wave[] = [];
    private width = 0;
    private height = 0;
    private time = 0;

    // Base configuration
    private baseConfig = {
        second: { amplitude: 20, frequency: 0.02, speed: 3 },
        minute: { amplitude: 50, frequency: 0.01, speed: 2 },
        hour: { amplitude: 100, frequency: 0.005, speed: 1 },
        arp: { amplitude: 15, frequency: 0.03, speed: 5 },
    };

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize);
        console.log('[WaveRenderer] Initialized');
    }

    dispose(): void {
        window.removeEventListener('resize', this.resize);
        this.waves = [];
        this.canvas = null;
        this.ctx = null;
        console.log('[WaveRenderer] Disposed');
    }

    private resize = (): void => {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    };

    private spawn(type: 'second' | 'minute' | 'hour' | 'arp', color: string, settings: VisualLayerSettings): void {
        const baseCfg = this.baseConfig[type];
        const life = settings.decayTime * 1000;

        // Spawn wave at random vertical position
        this.waves.push({
            startTime: this.time,
            color,
            amplitude: baseCfg.amplitude * settings.sizeMultiplier * settings.intensity,
            frequency: baseCfg.frequency,
            speed: baseCfg.speed,
            life,
            maxLife: life,
            opacity: settings.opacity,
            yOffset: this.height * (0.2 + Math.random() * 0.6),
        });
    }

    render(time: number): void {
        if (!this.ctx || !this.canvas) return;

        this.time = time;
        // NOTE: Don't clear canvas - MultiRenderer handles that

        for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];

            w.life -= 16;
            if (w.life <= 0) {
                this.waves.splice(i, 1);
                continue;
            }

            const lifeRatio = w.life / w.maxLife;
            const alpha = lifeRatio * w.opacity;
            const elapsed = (time - w.startTime) / 1000;

            // Draw wave
            this.ctx.beginPath();
            this.ctx.moveTo(0, w.yOffset);

            for (let x = 0; x <= this.width; x += 5) {
                const y = w.yOffset + Math.sin((x * w.frequency) + (elapsed * w.speed)) * w.amplitude * lifeRatio;
                this.ctx.lineTo(x, y);
            }

            this.ctx.strokeStyle = this.colorWithAlpha(w.color, alpha);
            this.ctx.lineWidth = 3 * lifeRatio;
            this.ctx.stroke();

            // Draw secondary wave with offset
            this.ctx.beginPath();
            this.ctx.moveTo(0, w.yOffset);

            for (let x = 0; x <= this.width; x += 5) {
                const y = w.yOffset + Math.sin((x * w.frequency * 1.5) + (elapsed * w.speed * 1.2) + 1) * w.amplitude * 0.5 * lifeRatio;
                this.ctx.lineTo(x, y);
            }

            this.ctx.strokeStyle = this.colorWithAlpha(w.color, alpha * 0.5);
            this.ctx.lineWidth = 2 * lifeRatio;
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

    // Clear all waves (when layer is disabled)
    clearAll(): void {
        this.waves = [];
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

export default WaveRenderer;
