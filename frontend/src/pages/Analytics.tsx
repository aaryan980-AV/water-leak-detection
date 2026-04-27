import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts'
import { Activity, Radio } from 'lucide-react'
import type { LeakRecord } from '../types'
import { getHistory } from '../api/client'

export default function AnalyticsPage() {
  const [history, setHistory] = useState<LeakRecord[]>([])
  const [liveData, setLiveData] = useState<{ time: string, freq1: number, freq2: number, freq3: number }[]>([])

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

  // Simulate Live Spectrogram Stream
  useEffect(() => {
    // Initial data
    const initial = Array.from({ length: 30 }).map((_, i) => ({
      time: new Date(Date.now() - (30 - i) * 100).toLocaleTimeString([], { hour12: false, second: '2-digit', fractionalSecondDigits: 1 } as any),
      freq1: Math.random() * 40 + 20,
      freq2: Math.random() * 30 + 10,
      freq3: Math.random() * 50 + 30,
    }))
    setLiveData(initial)

    const interval = setInterval(() => {
      setLiveData(prev => {
        const next = [...prev.slice(1)]
        const t = Date.now()
        next.push({
          time: new Date(t).toLocaleTimeString([], { hour12: false, second: '2-digit', fractionalSecondDigits: 1 } as any),
          freq1: Math.sin(t / 500) * 20 + 40 + Math.random() * 10,
          freq2: Math.cos(t / 800) * 15 + 25 + Math.random() * 10,
          freq3: Math.sin(t / 300) * 25 + 50 + Math.random() * 15,
        })
        return next
      })
    }, 100)

    return () => clearInterval(interval)
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

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Live Spectrogram Stream */}
        <motion.div className="rounded-2xl glass border border-white/10 p-6 flex flex-col h-[500px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-fuchsia-500 animate-pulse" />
              Live Spectrogram Stream
            </h2>
            <span className="px-2 py-1 text-xs font-mono bg-fuchsia-500/10 text-fuchsia-500 rounded border border-fuchsia-500/20">LIVE</span>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFreq1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFreq2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFreq3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 12 }}
                  itemStyle={{ fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="freq3" stroke="#ec4899" fillOpacity={1} fill="url(#colorFreq3)" isAnimationActive={false} />
                <Area type="monotone" dataKey="freq1" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFreq1)" isAnimationActive={false} />
                <Area type="monotone" dataKey="freq2" stroke="#06b6d4" fillOpacity={1} fill="url(#colorFreq2)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Confidence Trend */}
        <div className="space-y-6 flex flex-col">
          <motion.div className="rounded-2xl glass border border-white/10 p-5 flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">AI Confidence Trend (Recent)</h2>
            <div className="h-64">
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
