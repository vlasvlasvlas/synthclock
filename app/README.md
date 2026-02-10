# SynthClock — App

Aplicación web construida con React + TypeScript + Vite.

## Requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con HMR (`http://localhost:5173`) |
| `npm run build` | Compila TypeScript y genera bundle de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Ejecuta ESLint sobre el código |

## Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | 19.x | Framework UI |
| `react-dom` | 19.x | Renderizado DOM |
| `tone` | 15.x | Motor de síntesis de audio (Web Audio API) |
| `zustand` | 5.x | Estado global con persistencia en localStorage |

## Estructura de Archivos

```
src/
├── core/                        # Lógica de negocio (sin UI)
│   ├── audio/
│   │   ├── AudioEngine.ts       # Motor de síntesis (Tone.js)
│   │   ├── Arpeggiator.ts       # Secuenciador de arpegios
│   │   └── presets.ts           # Definiciones de presets de sonido
│   ├── theory/
│   │   └── ToneClock.ts         # Teoría musical (Tone Clock de Peter Schat)
│   ├── time/
│   │   └── TimeDilator.ts       # Reloj virtual con velocidad variable
│   └── visuals/
│       ├── VisualEngine.ts      # Motor de renderizado visual
│       ├── themes.ts            # Definiciones de temas
│       └── renderers/           # Efectos visuales pluggables
│           ├── MultiRenderer.ts # Dispatcher de efectos por capa
│           ├── ParticleRenderer.ts
│           ├── RippleRenderer.ts
│           ├── DropletRenderer.ts
│           └── WaveRenderer.ts
├── components/                  # Componentes React
│   ├── clock/
│   │   └── ClockDisplay.tsx     # Reloj analógico y digital
│   ├── editors/
│   │   ├── SoundEditor.tsx      # Editor de sonido por capa
│   │   ├── VisualEditor.tsx     # Editor de efectos visuales por capa
│   │   └── ThemeSelector.tsx    # Selector de tema y fondo
│   ├── mixer/
│   │   └── Mixer.tsx            # Control de volumen y mute por canal
│   └── visuals/
│       └── VisualCanvas.tsx     # Canvas fullscreen para efectos visuales
├── hooks/
│   └── useStore.ts              # Estado global (Zustand + persistencia)
├── App.tsx                      # Componente principal — orquesta audio, tiempo y visuales
├── main.tsx                     # Punto de entrada
└── index.css                    # Estilos globales
```

## Notas de Desarrollo

- El audio requiere interacción del usuario para iniciar (`Tone.start()`)
- Los efectos visuales usan `requestAnimationFrame` para renderizado
- El estado se persiste en `localStorage` (temas, presets, mixer, velocidad)
- Los singletons exportados (`audioEngine`, `visualEngine`, `timeDilator`, `arpeggiator`) se instancian una sola vez
