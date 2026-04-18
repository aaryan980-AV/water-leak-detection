import { motion } from 'framer-motion'

/** Generates a smooth SVG path for a flowing acoustic waveform */
function wavePath(offset: number, amplitude: number, frequency: number, baseline: number, width: number) {
  const points: string[] = []
  const steps = 80
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const currentOffset = isNaN(offset) ? 0 : offset
    const y = baseline - Math.sin((i / steps) * Math.PI * 2 * frequency + currentOffset) * amplitude
             - Math.sin((i / steps) * Math.PI * 2 * (frequency * 1.7) + currentOffset * 0.6) * (amplitude * 0.4)
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return points.join(' ') || 'M 0 0'
}

const WIDTH = 600
const HEIGHT = 200

const waves = [
  { amplitude: 35, frequency: 2.3, baseline: 100, color: '#22d3ee', opacity: 0.9, strokeWidth: 2.5, dur: 3.5 },
  { amplitude: 22, frequency: 3.1, baseline: 100, color: '#a78bfa', opacity: 0.6, strokeWidth: 1.8, dur: 4.2 },
  { amplitude: 14, frequency: 5.0, baseline: 100, color: '#f472b6', opacity: 0.45, strokeWidth: 1.2, dur: 2.8 },
]

// Anomaly spike data
const spikes = [
  { x: 180, h: 55, color: '#ef4444' },
  { x: 410, h: 40, color: '#f97316' },
]

export function HeroViz() {
  return (
    <div className="relative h-48 md:h-64 w-full max-w-3xl mx-auto overflow-hidden rounded-2xl">
      {/* Background glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-fuchsia-950/60 border border-cyan-500/20" />
      
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main waveform SVG */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Area fills */}
        {waves.map((w, i) => (
          <motion.path
            key={`fill-${i}`}
            d={`${wavePath(0, w.amplitude, w.frequency, w.baseline, WIDTH)} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`}
            fill={w.color}
            fillOpacity={0.06}
            animate={{ opacity: [0.04, 0.09, 0.04] }}
            transition={{ duration: w.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Wave lines */}
        {waves.map((w, i) => (
          <motion.path
            key={`wave-${i}`}
            d={wavePath(0, w.amplitude, w.frequency, w.baseline, WIDTH)}
            fill="none"
            stroke={w.color}
            strokeWidth={w.strokeWidth}
            strokeOpacity={w.opacity}
            strokeLinecap="round"
            animate={{ opacity: [w.opacity * 0.7, w.opacity, w.opacity * 0.7] }}
            transition={{ duration: w.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Baseline */}
        <line x1="0" y1="100" x2={WIDTH} y2="100" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4 4" />

        {/* Anomaly spikes */}
        {spikes.map((s, i) => (
          <motion.g key={`spike-${i}`} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}>
            <line x1={s.x} y1={100 - s.h} x2={s.x} y2={100 + s.h * 0.4} stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={s.x} cy={100 - s.h} r="4" fill={s.color} />
            <text x={s.x + 7} y={100 - s.h + 4} fill={s.color} fontSize="10" fontFamily="monospace" fontWeight="bold">! SPIKE</text>
          </motion.g>
        ))}

        {/* Y-axis labels */}
        <text x="8" y="20" fill="#94a3b8" fontSize="9" fontFamily="monospace">+dB</text>
        <text x="8" y="105" fill="#94a3b8" fontSize="9" fontFamily="monospace">0</text>
        <text x="8" y="188" fill="#94a3b8" fontSize="9" fontFamily="monospace">−dB</text>
      </svg>

      {/* Status label */}
      <motion.div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-cyan-300/90 font-mono bg-slate-900/60 px-3 py-1 rounded-full border border-cyan-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        live acoustic spectrum · real-time AI analysis
      </motion.div>
    </div>
  )
}
