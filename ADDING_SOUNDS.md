# Cómo Agregar Nuevos Sonidos a SynthClock

Los sonidos en SynthClock se definen como "Presets" en el archivo:
`app/src/core/audio/presets.ts`

## Estructura de un Preset

Cada preset es un objeto con la siguiente estructura:

```typescript
{
    id: 'H06',                  // ID único (H=Hour, M=Minute, S=Second)
    name: 'Nombre del Sonido',  // Nombre visible en el editor
    description: 'Descripción', // Breve descripción
    layer: 'hour',              // Capa: 'hour' | 'minute' | 'second'
    waveform: 'sawtooth',       // Tipo de onda: 'sine' | 'square' | 'sawtooth' | 'triangle'
    synthesisType: 'subtractive', // Tipo de síntesis
    envelope: {                 // Envolvente ADSR
        attack: 2.0,            // Tiempo de ataque (s)
        decay: 1.0,             // Tiempo de decaimiento (s)
        sustain: 0.8,           // Nivel de sustain (0-1)
        release: 4.0            // Tiempo de liberación (s)
    },
    filter: {                   // Filtro
        type: 'lowpass',        // Tipo: 'lowpass' | 'highpass' | 'bandpass'
        frequency: 2000,        // Frecuencia de corte (Hz)
        resonance: 1            // Resonancia (Q)
    },
    effects: {                  // Efectos
        reverb: 0.8,            // Nivel de Reverb (0-1)
        delay: 0.3,             // Nivel de Delay (0-1)
        delayTime: 0.5,         // Tiempo de Delay (s)
        delayFeedback: 0.6,     // Feedback de Delay (0-0.9)
        chorus: 0.2,            // Nivel de Chorus (0-1)
        distortion: 0,          // Nivel de Distorsión (0-1)
        tremolo: 0,             // Profundidad de Tremolo (0-1)
        noiseGate: -100         // Umbral de Noise Gate (-100 a 0 dB)
    },
    detune: 0,                  // Desafinación en cents
    volume: -12,                // Volumen base en dB
}
```

## Pasos para Agregar un Sonido

1. Abre `app/src/core/audio/presets.ts`.
2. Busca el array `export const presets: SynthPreset[] = [...]`.
3. Agrega tu nuevo objeto preset al final del array.
4. Asegúrate de usar un ID único (ej. `H06` si es para horas, `M06` para minutos).
5. Guarda el archivo. El sonido aparecerá automáticamente en el selector del Sound Editor.

## Tips de Diseño Sonoro

- **Horas (Layers H)**: Usa ataques largos y mucho reverb para crear "drones" o pads ambientales. Sonidos que evolucionan lentamente.
- **Minutos (Layers M)**: Sonidos con ataque medio, tipo "pluck" suave o instrumentos de viento. Melódicos pero no percusivos.
- **Segundos (Layers S)**: Sonidos cortos, percusivos, "blips" o clicks. Ataque rápido (0.01s) y decay corto.
