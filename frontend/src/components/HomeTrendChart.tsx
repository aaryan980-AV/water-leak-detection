import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/** Live-style acoustic RMS trend for the home page (replaces mel spectrogram block). */
export function HomeTrendChart() {
  const [data, setData] = useState<{ t: string; rms: number; leakScore: number }[]>([])

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setData((prev) => {
        const base = 35 + Math.sin(Date.now() / 1200) * 22 + Math.random() * 12
        const leakScore = Math.max(0, Math.min(100, 18 + Math.sin(Date.now() / 2100) * 15 + Math.random() * 10))
        const next = [...prev, { t, rms: base, leakScore }]
        return next.slice(-36)
      })
    }
    tick()
    const id = setInterval(tick, 1100)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl glass border border-cyan-500/20 dark:border-cyan-500/25 p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Live acoustic trend</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Aggregated RMS from streamed sensors vs model leak score (demo series — same style as the operations dashboard).
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 shrink-0">updates ~1.1s</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="homeRms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="homeLeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" className="dark:stroke-slate-700" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#94a3b8" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#94a3b8" width={36} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.96)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                borderRadius: 12,
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area type="monotone" dataKey="rms" name="RMS (mesh)" stroke="#06b6d4" fill="url(#homeRms)" strokeWidth={2} isAnimationActive={false} />
            <Area type="monotone" dataKey="leakScore" name="CNN leak score" stroke="#ea580c" fill="url(#homeLeak)" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
