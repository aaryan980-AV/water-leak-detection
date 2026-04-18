import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, Cpu, Radio, RefreshCw, ShieldCheck, Zap } from 'lucide-react'
import { SystemMap } from '../components/SystemMap'
import { GeospatialMapFrame } from '../components/GeospatialMapFrame'
import { ConfidenceMeter } from '../components/ConfidenceMeter'
import type { FeedItem, LocationsResponse, MapFilters, StatusResponse } from '../types'
import type { PipelineStats } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { getEvents, getLocations, getPipelineStats, getStatus, postClearLeak, postSimulateLeak } from '../api/client'

const defaultFilters: MapFilters = {
  sensors: true,
  water: true,
  teams: true,
  pipelines: true,
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [locations, setLocations] = useState<LocationsResponse | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [chartData, setChartData] = useState<{ t: string; v: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<{ title: string; body: string } | null>(null)
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [s, loc, ev, pipe] = await Promise.all([
        getStatus(),
        getLocations(),
        getEvents(),
        getPipelineStats(),
      ])
      setStatus(s)
      setLocations(loc)
      setFeed(ev)
      setPipeline(pipe)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      void refresh()
    }, 8000)
    queueMicrotask(() => {
      void refresh()
    })
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setChartData((prev) => {
        const next = [...prev, { t, v: 40 + Math.sin(Date.now() / 900) * 25 + Math.random() * 8 }]
        return next.slice(-24)
      })
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [])

  const { user } = useAuth()
  const isAdmin = user?.role === 'supervisor' || user?.role === 'admin'
  const isMaintenance = user?.role === 'maintenance'
  const isSupplier = user?.role === 'water_supplier'

  const leakActive = status?.overall === 'Leak'
  const lastConfidence = useMemo(() => {
    const hit = feed.find((f) => f.prediction === 'Leak') ?? feed[0]
    return hit?.confidence ?? 0.9
  }, [feed])

  if (!status || !locations) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-600 dark:text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        Syncing grid telemetry…
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome, {user?.name || 'Operator'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            <span className="capitalize px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-mono mr-2">
              {user?.role?.replace('_', ' ') || 'operator'}
            </span>
            {isMaintenance ? 'Your task: Respond to active leaks and maintain sensor nodes.' : 
             isSupplier ? 'Your task: Monitor reservoir levels and pipeline throughput.' : 
             'System overview and automated CNN inference monitoring.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await postSimulateLeak()
                  } catch {
                    /* error */
                  }
                  await refresh()
                }}
                className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm text-orange-800 hover:bg-orange-500/20 dark:text-orange-200"
              >
                Simulate leak
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await postClearLeak()
                  } catch {
                    /* error */
                  }
                  await refresh()
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Clear leak
              </button>
            </>
          )}
        </div>
      </div>

      {pipeline && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50/90 via-white to-cyan-50/80 p-4 md:p-5 dark:border-emerald-500/25 dark:from-emerald-950/40 dark:via-slate-900/40 dark:to-cyan-950/30"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Radio className="w-5 h-5" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Real-time sensor → CNN pipeline</span>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 flex-1 text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>
                  Ingest <span className="text-cyan-700 dark:text-cyan-300 font-mono">{pipeline.ingest_hz}</span> Hz
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Cpu className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                <span>
                  CNN <span className="text-fuchsia-700 dark:text-fuchsia-300 font-mono">{pipeline.cnn_inferences_per_sec}</span> inf/s
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-[200px] flex-1">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 mb-1">
                    <span>Training buffer (streaming windows)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono">{pipeline.train_buffer_pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:bg-slate-800 dark:border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500"
                      animate={{ width: `${Math.min(100, pipeline.train_buffer_pct)}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-500 lg:text-right shrink-0">{pipeline.model_version}</p>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          layout
          className={`lg:col-span-1 rounded-2xl glass p-6 border ${leakActive ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'border-cyan-500/25'}`}
        >
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">System status</p>
          <div className="flex items-center gap-3">
            {leakActive ? (
              <AlertTriangle className="w-10 h-10 text-red-400 text-glow-red" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-cyan-400" />
            )}
            <div>
              <p className={`text-2xl font-bold ${leakActive ? 'text-red-400' : 'text-cyan-300'}`}>
                {leakActive ? 'Leak detected' : 'No leak'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Updated {new Date(status.updated_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-6">
            <ConfidenceMeter value={lastConfidence} leak={leakActive} />
          </div>
          {leakActive && status.active_leak_gps && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-orange-300"
            >
              Nearest crew highlighted on map — route shows dispatch path.
            </motion.p>
          )}
        </motion.div>

        <div className="lg:col-span-2 rounded-2xl glass p-4 border border-slate-200/80 dark:border-white/10 min-h-[280px]">
          <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Aggregated live envelope (sensor mesh)</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="t" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <GeospatialMapFrame className="xl:col-span-2" subtitle="Mumbai MMR · Positron basemap · OSM">
          <SystemMap
            locations={locations}
            status={status}
            filters={defaultFilters}
            minHeight="min-h-[420px] h-[420px]"
            onSelect={(d) => setPanel({ title: d.title, body: d.body })}
          />
        </GeospatialMapFrame>

        <div className="rounded-2xl glass border border-slate-200/80 dark:border-white/10 flex flex-col max-h-[480px]">
          <div className="p-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live inference feed</h2>
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">Per-sensor stream → CNN output (latest windows)</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {feed.map((e) => (
              <motion.div
                key={`${e.time}-${e.endpoint}`}
                layout
                className="rounded-xl bg-slate-100/90 border border-slate-200/80 p-3 text-sm dark:bg-slate-900/60 dark:border-white/5"
              >
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 gap-2">
                  <span className="truncate" title={e.endpoint}>
                    {e.sensor_id && <span className="text-cyan-600 dark:text-cyan-500/80 font-mono mr-1">{e.sensor_id}</span>}
                    {e.endpoint}
                  </span>
                  <span className="shrink-0">{new Date(e.time).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-slate-900 dark:text-white font-medium">
                  {e.prediction}{' '}
                  <span className="text-cyan-600 dark:text-cyan-400/90">{(e.confidence * 100).toFixed(1)}%</span>
                </p>
              </motion.div>
            ))}
          </div>
          {panel && (
            <div className="p-4 border-t border-slate-200 dark:border-white/10 text-sm">
              <p className="text-cyan-700 dark:text-cyan-300 font-medium">{panel.title}</p>
              <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">{panel.body}</p>
              <button type="button" className="mt-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setPanel(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
