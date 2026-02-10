// Particle Renderer - Basic particle system for visual feedback
// Spawns particles on audio events with physics simulation
// Now uses VisualLayerSettings for per-layer configuration
// Includes trail/ghost effect option

import type { CanvasRenderer } from '../VisualEngine';
import type { VisualLayerSettings, PositionMode } from '../../../hooks/useStore';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    type: 'second' | 'minute' | 'hour' | 'arp';
    opacity: number;
    trail: { x: number; y: number; alpha: number }[];
}

export class ParticleRenderer implements CanvasRenderer {
    id = 'particles';
    name = 'Particle System';

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private particles: Particle[] = [];
    private width = 0;
    private height = 0;

    // Enable trail effect (ghost particles)
    private enableTrail = true;
    private maxTrailLength = 8;

    // Base configuration (now modified by settings)
    private baseConfig = {
        second: { count: 5, sizeMin: 4, sizeMax: 10, life: 1500, speed: 2 },
        minute: { count: 12, sizeMin: 8, sizeMax: 16, life: 2500, speed: 1.5 },
        hour: { count: 25, sizeMin: 14, sizeMax: 28, life: 4000, speed: 1 },
        arp: { count: 4, sizeMin: 4, sizeMax: 8, life: 800, speed: 3 },
        gravity: 0.02,
        friction: 0.99,
    };

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Handle resize
        window.addEventListener('resize', this.resize);

        console.log('[ParticleRenderer] Initialized');
    }

    dispose(): void {
        window.removeEventListener('resize', this.resize);
        this.particles = [];
        this.canvas = null;
        this.ctx = null;

        console.log('[ParticleRenderer] Disposed');
    }

    private resize = (): void => {
        if (!this.canvas) return;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    };

    // Get spawn position based on mode
    private getSpawnPosition(mode: PositionMode): { x: number; y: number } {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.2;

        switch (mode) {
            case 'center':
                // Spawn at center with small variance
                return {
                    x: centerX + (Math.random() - 0.5) * 50,
                    y: centerY + (Math.random() - 0.5) * 50,
                };
            case 'clockEdge':
                // Spawn around clock edge
                const angle = Math.random() * Math.PI * 2;
                return {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                };
            case 'random':
            default:
                // Random position on screen
                return {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                };
        }
    }

    // Spawn particles with settings
    private spawn(type: Particle['type'], color: string, settings: VisualLayerSettings): void {
        const baseCfg = this.baseConfig[type];

        // Apply settings multipliers
        const count = Math.max(1, Math.round(baseCfg.count * settings.intensity));
        const sizeMin = baseCfg.sizeMin * settings.sizeMultiplier;
        const sizeMax = baseCfg.sizeMax * settings.sizeMultiplier;
        const life = settings.decayTime * 1000; // Convert seconds to ms

        for (let i = 0; i < count; i++) {
            const pos = this.getSpawnPosition(settings.positionMode);

            const particle: Particle = {
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * baseCfg.speed * 2,
                vy: (Math.random() - 0.5) * baseCfg.speed * 2 - baseCfg.speed, // Slight upward bias
                size: sizeMin + Math.random() * (sizeMax - sizeMin),
                color,
                life,
                maxLife: life,
                type,
                opacity: settings.opacity,
                trail: [],
            };

            this.particles.push(particle);
        }
    }

    render(_time: number): void {
        if (!this.ctx || !this.canvas) return;

        // NOTE: Don't clear canvas - MultiRenderer handles that
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Store trail position before updating
            if (this.enableTrail) {
                const lifeRatio = p.life / p.maxLife;
                p.trail.unshift({ x: p.x, y: p.y, alpha: lifeRatio * p.opacity });
                if (p.trail.length > this.maxTrailLength) {
                    p.trail.pop();
                }
            }

            // Update physics
            p.vy += this.baseConfig.gravity;
            p.vx *= this.baseConfig.friction;
            p.vy *= this.baseConfig.friction;
            p.x += p.vx;
            p.y += p.vy;

            // Update lifetime
            p.life -= 16; // Approximate 60fps

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Calculate alpha based on remaining life and opacity setting
            const lifeRatio = p.life / p.maxLife;
            const alpha = lifeRatio * p.opacity;

            // Draw trail (ghost effect)
            if (this.enableTrail && p.trail.length > 0) {
                for (let t = 0; t < p.trail.length; t++) {
                    const trailPoint = p.trail[t];
                    const trailAlpha = trailPoint.alpha * (1 - (t + 1) / (p.trail.length + 1)) * 0.5;
                    const trailSize = p.size * lifeRatio * (1 - t * 0.1);

                    this.ctx.beginPath();
                    this.ctx.arc(trailPoint.x, trailPoint.y, Math.max(1, trailSize), 0, Math.PI * 2);
                    this.ctx.fillStyle = this.colorWithAlpha(p.color, trailAlpha);
                    this.ctx.fill();
                }
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colorWithAlpha(p.color, alpha * 0.8);
            this.ctx.fill();

            // Optional glow effect for larger particles
            if (p.type === 'hour' || p.type === 'minute') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * lifeRatio * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colorWithAlpha(p.color, alpha * 0.2);
                this.ctx.fill();
            }
        }
    }

    // Convert hex/rgb color to rgba
    private colorWithAlpha(color: string, alpha: number): string {
        // Handle hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // Handle rgb colors
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }
        // Fallback
        return `rgba(255, 255, 255, ${alpha})`;
    }

    // Clear all particles of a specific type (when layer is disabled)
    clearByType(type: Particle['type']): void {
        this.particles = this.particles.filter(p => p.type !== type);
    }

    // Clear all particles
    clearAll(): void {
        this.particles = [];
    }

    // Audio event handlers - now use settings
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

export default ParticleRenderer;
