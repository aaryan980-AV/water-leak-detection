import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { Activity } from 'lucide-react'
import type { LeakRecord } from '../types'
import { getHistory } from '../api/client'

export default function AnalyticsPage() {
  const [history, setHistory] = useState<LeakRecord[]>([])

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])


  const confidenceSeries = useMemo(
    () =>
      [...history]
        .reverse()
        .slice(-20)
        .map((h, i) => ({
          n: i + 1,
          conf: Math.round(h.confidence * 100),
          leak: h.result === 'Leak' ? 1 : 0,
        })),
    [history],
  )

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Live spectrogram streaming and AI confidence trends.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Confidence Trend */}
        <div className="space-y-6 flex flex-col">
          <motion.div className="rounded-2xl glass border border-white/10 p-5 flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">AI Confidence Trend (Recent)</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
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

      </div>
    </div>
  )
}
