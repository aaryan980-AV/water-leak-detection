import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LeakRecord } from '../types'
import { getHistory } from '../api/client'

export default function AnalyticsPage() {
  const [history, setHistory] = useState<LeakRecord[]>([])

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

  const byDay = useMemo(() => {
    const map = new Map<string, { day: string; leaks: number; checks: number }>()
    for (const h of history) {
      const day = h.timestamp.slice(0, 10)
      const cur = map.get(day) ?? { day, leaks: 0, checks: 0 }
      cur.checks += 1
      if (h.result === 'Leak') cur.leaks += 1
      map.set(day, cur)
    }
    return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
  }, [history])

  const confidenceSeries = useMemo(
    () =>
      [...history]
        .reverse()
        .slice(-12)
        .map((h, i) => ({
          n: i + 1,
          conf: Math.round(h.confidence * 100),
          leak: h.result === 'Leak' ? 1 : 0,
        })),
    [history],
  )

  const heat = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((d, i) => ({
      d,
      v: (i + history.length * 0.13) % 7,
    }))
  }, [history])

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">GET /history — leak frequency, confidence trends, operational heatmap.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div className="rounded-2xl glass border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Leak vs inspections by day</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 12 }} />
                <Bar dataKey="checks" fill="rgba(34,211,238,0.35)" name="Runs" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="leaks" fill="rgba(249,115,22,0.85)" name="Leaks" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="rounded-2xl glass border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Confidence trend (recent)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={confidenceSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="n" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={[60, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="conf" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#e879f9' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div className="rounded-2xl glass border border-cyan-500/20 p-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Synthetic weekly heat (presentation)</h2>
        <div className="grid grid-cols-7 gap-2">
          {heat.map((c) => (
            <div key={c.d} className="text-center">
              <div
                className="h-16 rounded-xl border border-white/10 mb-2 transition-colors"
                style={{
                  background: `linear-gradient(180deg, rgba(34,211,238,${0.15 + (c.v / 10) * 0.55}) 0%, rgba(232,121,249,${0.1 + (c.v / 12) * 0.4}) 100%)`,
                }}
              />
              <span className="text-xs text-slate-500">{c.d}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
