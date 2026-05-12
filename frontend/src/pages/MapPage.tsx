import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Layers,
  Radio, RefreshCw, ShieldCheck, Zap,
} from 'lucide-react'
import { SystemMap } from '../components/SystemMap'
import { GeospatialMapFrame } from '../components/GeospatialMapFrame'
import type { LocationsResponse, MapFilters, StatusResponse } from '../types'
import { getLocations, getStatus, postClearLeak, postSimulateLeak } from '../api/client'



export default function MapPage() {
  const [status, setStatus]     = useState<StatusResponse | null>(null)
  const [locations, setLocations] = useState<LocationsResponse | null>(null)
  const [filters]               = useState<MapFilters>({ sensors: true, water: true, teams: true, pipelines: false })
  const [detail, setDetail]     = useState<{ title: string; body: string } | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [mapCenter]             = useState<[number, number] | undefined>(undefined)
  const [clearedSensorIds, setClearedSensorIds] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const [s, l] = await Promise.all([getStatus(), getLocations()])
    setStatus(s)
    setLocations(l)
    setLastRefresh(Date.now())
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => void load(), 8000)
    void load()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load])


  const isLeak = status?.overall === 'Leak' && status?.active_leak_gps
  const nearestSensorIdToLeak = useMemo(() => {
    if (!isLeak || !status?.active_leak_gps || !locations) return null
    let best: string | null = null, bestD = Infinity
    for (const s of locations.sensors) {
      // rough distance calculation for state tracking
      const d = Math.hypot(s.lat - status.active_leak_gps.lat, s.lon - status.active_leak_gps.lon)
      if (d < bestD) { bestD = d; best = s.id }
    }
    return best
  }, [isLeak, status?.active_leak_gps, locations])

  // Watch for leak clearance from other tabs/pages (polling)
  const prevIsLeak = useRef(isLeak)
  useEffect(() => {
    if (prevIsLeak.current && !isLeak && nearestSensorIdToLeak) {
      setClearedSensorIds(prev => Array.from(new Set([...prev, nearestSensorIdToLeak])))
    }
    prevIsLeak.current = isLeak
  }, [isLeak, nearestSensorIdToLeak])

  const handleClear = async () => {
    if (nearestSensorIdToLeak) {
      setClearedSensorIds(prev => Array.from(new Set([...prev, nearestSensorIdToLeak])))
    }
    try { await postClearLeak() } catch { /* ignore */ }
    await load()
  }

  const handleSimulate = async () => {
    try { await postSimulateLeak() } catch { /* ignore */ }
    await load()
  }

  if (!status || !locations) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-600 dark:text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading map layers…</span>
      </div>
    )
  }

  // isLeak already defined above
  const assignedTeam = status.nearest_team_id
    ? locations.teams.find((t) => t.id === status.nearest_team_id)
    : undefined
  const totalSensors = locations.sensors.length
  const onlineSensors = locations.sensors.filter((s) => s.leak_status !== 1 && s.dismissed !== true).length
  const resolvedSensors = locations.sensors.filter((s) => s.dismissed === true).length

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-cyan-400" />
            Smart Map
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Mumbai MMR · {totalSensors} acoustic sensors · {locations.water_sources.length} water sources · {locations.teams.length} maintenance teams
          </p>
        </div>

        {/* Header Action Row */}
        <div className="flex flex-wrap items-center gap-2">
          {!isLeak ? (
            <button
              type="button"
              onClick={handleSimulate}
              className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-500/25 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              Simulate Leak
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition"
            >
              <CheckCircle className="w-4 h-4" />
              Clear Leak
            </button>
          )}
        </div>
      </div>

      {/* ── Live Leak Alert Banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {isLeak && (
          <motion.div
            key="leak-banner"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="rounded-2xl border border-red-500/60 bg-gradient-to-r from-red-950/60 to-orange-950/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 border border-red-500/50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              </span>
              <div>
                <p className="font-bold text-red-300 text-lg">🚨 Leak Detected!</p>
                <p className="text-orange-200/80 text-sm mt-0.5">
                  GPS: {status.active_leak_gps?.lat?.toFixed(4)}, {status.active_leak_gps?.lon?.toFixed(4)}
                  {assignedTeam && (
                    <span className="ml-3 text-white font-medium">
                      → Nearest crew: <span className="text-orange-300">{assignedTeam.name}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span className="text-xs text-red-400/70 font-mono">
              {new Date(status.updated_at).toLocaleTimeString()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: ShieldCheck,
            label: 'System Status',
            value: isLeak ? 'LEAK ACTIVE' : 'ALL CLEAR',
            color: isLeak ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
            bg: isLeak ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5',
          },
          {
            icon: Radio,
            label: 'Sensors Online',
            value: `${onlineSensors} / ${totalSensors}`,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'border-blue-500/20 bg-blue-500/5',
          },
          {
            icon: CheckCircle,
            label: 'Resolved',
            value: resolvedSensors > 0 ? `${resolvedSensors} nodes` : 'None',
            color: resolvedSensors > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500',
            bg: 'border-emerald-500/20 bg-emerald-500/5',
          },
          {
            icon: Zap,
            label: 'Updated',
            value: new Date(lastRefresh).toLocaleTimeString(),
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'border-cyan-500/20 bg-cyan-500/5',
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border ${bg} p-4 glass`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Main Map + Filter sidebar ──────────────────────────────────── */}
      <div className="grid xl:grid-cols-[260px_1fr] gap-5">

        {/* Sidebar */}
        <aside className="space-y-4 h-fit">



          {/* Marker guide */}
          <div className="rounded-2xl glass border border-slate-200/80 dark:border-white/10 p-5 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Marker Guide</p>
            {[
              { icon: '🔵', label: 'Acoustic Sensor', sub: 'Normal — no leak', color: 'text-blue-700 dark:text-blue-300' },
              { icon: '🔴', label: 'Sensor (Leak!)',  sub: 'Nearest to active leak', color: 'text-red-700 dark:text-red-300' },
              { icon: '🛠', label: 'Maintenance Team', sub: 'Field crew', color: 'text-orange-700 dark:text-orange-300' },
              { icon: '💧', label: 'Water Supply',    sub: 'Reservoir / pump', color: 'text-sky-700 dark:text-sky-300' },
              { icon: '🚨', label: 'Active Leak Zone', sub: 'AI detected location', color: 'text-red-600' },
            ].map(({ icon, label, sub, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className={`text-xs font-bold ${color}`}>{label}</p>
                  <p className="text-[10px] text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>


        </aside>

        {/* Map */}
        <GeospatialMapFrame className="min-h-[72vh]" subtitle="Mumbai MMR · Positron basemap · live sensors">
          <SystemMap
            locations={locations}
            status={status}
            filters={filters}
            center={mapCenter}
            clearedSensorIds={clearedSensorIds}
            minHeight="min-h-[72vh] h-[72vh]"
            onSelect={(d) => setDetail({ title: d.title, body: d.body })}
          />
        </GeospatialMapFrame>
      </div>

      {/* ── Marker detail panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {detail && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="rounded-2xl border border-cyan-500/30 bg-white/95 dark:bg-slate-900/90 dark:border-cyan-500/20 p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-cyan-700 dark:text-cyan-300 text-base">{detail.title}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm whitespace-pre-line leading-relaxed">{detail.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
              >
                ✕ Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
