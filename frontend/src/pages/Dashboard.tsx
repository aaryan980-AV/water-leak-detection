import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Activity, AlertTriangle, ShieldCheck, RefreshCw, Droplet, Thermometer, Wind, Zap } from 'lucide-react'
import { SystemMap } from '../components/SystemMap'
import { GeospatialMapFrame } from '../components/GeospatialMapFrame'
import type { LocationsResponse, StatusResponse, MapFilters } from '../types'
import { getLocations, getStatus } from '../api/client'

const defaultFilters: MapFilters = {
  sensors: true,
  water: true,
  teams: true,
  pipelines: true,
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [locations, setLocations] = useState<LocationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [metricsData, setMetricsData] = useState<{ t: string, pressure: number, flow: number, vibration: number, temp: number }[]>([])

  const refresh = useCallback(async () => {
    try {
      const [s, loc] = await Promise.all([getStatus(), getLocations()])
      setStatus(s)
      setLocations(loc)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 8000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', fractionalSecondDigits: 1 } as any)
      setMetricsData((prev) => {
        const next = [...prev, { 
          t, 
          pressure: 80 + Math.sin(Date.now() / 1000) * 10 + Math.random() * 2,
          flow: 120 + Math.cos(Date.now() / 800) * 15 + Math.random() * 5,
          vibration: 2 + Math.sin(Date.now() / 500) * 0.5 + Math.random() * 0.2,
          temp: 22 + Math.cos(Date.now() / 2000) * 1 + Math.random() * 0.5,
        }]
        return next.slice(-30)
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    if (!locations) return { total: 0, active: 0, resolved: 0, normal: 0 }
    const sensors = locations.sensors || []
    return {
      total: sensors.length,
      active: sensors.filter(s => s.leak_status === 1).length,
      resolved: sensors.filter(s => s.dismissed === true).length,
      normal: sensors.filter(s => s.leak_status !== 1 && s.dismissed !== true).length,
    }
  }, [locations])

  if (!status || !locations) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-600 dark:text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        Syncing system telemetry...
      </div>
    )
  }

  const leakActive = stats.active > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Mumbai City Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time pipeline monitoring, leak detection, and sensor status overview.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="rounded-2xl glass p-5 border border-slate-200/50 dark:border-white/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Sensors</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
        </motion.div>
        <motion.div className="rounded-2xl glass p-5 border border-blue-500/30 bg-blue-500/5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold mb-1">Normal (Online)</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.normal}</p>
        </motion.div>
        <motion.div className="rounded-2xl glass p-5 border border-red-500/40 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-xs uppercase tracking-widest text-red-600 dark:text-red-400 font-semibold mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Active Leaks
          </p>
          <p className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.active}</p>
        </motion.div>
        <motion.div className="rounded-2xl glass p-5 border border-emerald-500/30 bg-emerald-500/5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Resolved Leaks
          </p>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.resolved}</p>
        </motion.div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        
        {/* Real-time Metrics Chart */}
        <div className="xl:col-span-2 rounded-2xl glass p-5 border border-slate-200/80 dark:border-white/10 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              Live Sensor Telemetry
            </h2>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-cyan-500"><Droplet className="w-3 h-3" /> Pressure (PSI)</span>
              <span className="flex items-center gap-1 text-blue-500"><Wind className="w-3 h-3" /> Flow (GPM)</span>
              <span className="flex items-center gap-1 text-fuchsia-500"><Zap className="w-3 h-3" /> Vibration (mm/s)</span>
              <span className="flex items-center gap-1 text-orange-500"><Thermometer className="w-3 h-3" /> Temp (°C)</span>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="t" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 12 }}
                  itemStyle={{ fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
                />
                <Line type="monotone" dataKey="flow" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="pressure" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="vibration" stroke="#d946ef" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Status Panel */}
        <div className="rounded-2xl glass border border-slate-200/80 dark:border-white/10 flex flex-col max-h-[350px]">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              Sensor Fleet Status
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Live</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {locations.sensors.map((s) => {
              const isLeak = s.leak_status === 1
              const isCleared = s.dismissed === true
              return (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isLeak ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : isCleared ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isLeak ? 'bg-red-500/20 text-red-500' : isCleared ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {isLeak ? 'Leak' : isCleared ? 'Resolved' : 'Normal'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="rounded-2xl glass border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-lg shadow-black/5">
        <GeospatialMapFrame subtitle="Real-time geo-spatial sensor tracking overlay">
          <SystemMap
            locations={locations}
            status={status}
            filters={defaultFilters}
            minHeight="min-h-[500px] h-[500px]"
          />
        </GeospatialMapFrame>
      </div>

    </div>
  )
}
