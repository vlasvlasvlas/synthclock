# Cómo Agregar Nuevos Sonidos a SynthClock

Los sonidos en SynthClock se definen como "Presets" en el archivo:
`app/src/core/audio/presets.ts`

## Estructura de un Preset

Cada preset es un objeto con la siguiente estructura:

```typescript
{
    id: 'H06',                  // ID único (H=Hour, M=Minute, S=Second, A=Arp)
    name: 'Nombre del Sonido',  // Nombre visible en el editor
    description: 'Descripción', // Breve descripción
    layer: 'hour',              // Capa: 'hour' | 'minute' | 'second' | 'arp'
    waveform: 'sawtooth',       // Tipo de onda: 'sine' | 'square' | 'sawtooth' | 'triangle'
    synthesisType: 'subtractive', // Tipo de síntesis
    envelope: {                 // Envolvente ADSR
        attack: 2.0,            // Tiempo de ataque (s)
        decay: 1.0,             // Tiempo de decaimiento (s)
        sustain: 0.8,           // Nivel de sustain (0-1)
        release: 4.0            // Tiempo de liberación (s)
    },
    filter: {                   // Filtro
        type: 'lowpass',        // Tipo: 'lowpass' | 'highpass' | 'bandpass' | 'notch'
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

## Cadena de Efectos

Cada canal tiene su propia cadena de efectos:

**Canales estándar** (Hour, Minute, Second):
```
PolySynth → Filter → Tremolo → Delay → Reverb → Gate → Volume → Master
```

**Canal del Arpegiador**:
```
MonoSynth → Filter → FeedbackDelay → Reverb → Volume → Master
```

## Pasos para Agregar un Sonido

1. Abre `app/src/core/audio/presets.ts`.
2. Busca el array `export const presets: SynthPreset[] = [...]`.
3. Agrega tu nuevo objeto preset al final del array.
4. Asegúrate de usar un ID único:
   - `H##` para Hour (drones)
   - `M##` para Minute (melódicos)
   - `S##` para Second (percusivos)
   - `A##` para Arp (arpegiados)
5. Guarda el archivo. El sonido aparecerá automáticamente en el selector del Sound Editor.

## Tips de Diseño Sonoro

### Hours (Layers H) — Drones Ambientales
- Ataques largos (2-5s) con mucho reverb
- Crear "drones" o pads que evolucionan lentamente
- Envelope: attack alto, sustain alto, release largo
- Ejemplo: `{ attack: 3.0, decay: 2.0, sustain: 0.9, release: 5.0 }`

### Minutes (Layers M) — Melodías
- Sonidos con ataque medio, tipo "pluck" suave o viento
- Melódicos pero no percusivos
- Filtros con resonancia moderada para color
- Ejemplo: `{ attack: 0.1, decay: 0.5, sustain: 0.5, release: 1.0 }`

### Seconds (Layers S) — Ritmos
- Sonidos cortos, percusivos, "blips" o clicks
- Ataque muy rápido (0.01s) y decay corto
- Poco o nada de reverb
- Ejemplo: `{ attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 }`

### Arp (Layers A) — Arpegiados
- Sonidos rápidos y articulados, similares a seconds
- Glissando/portamento entre notas (controlado por slider)
- Se benefician de delay con feedback para efecto rítmico
- Ejemplo: `{ attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }`
