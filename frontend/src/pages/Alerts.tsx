import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, Mail, MessageSquare, Smartphone, Wrench, X, AlertTriangle, Clock } from 'lucide-react'
import type { AlertRecord } from '../types'
import { getAlerts } from '../api/client'

const OPS_KEY = 'aquasense_alert_ops'
const DISMISSED_KEY = 'aquasense_alert_dismissed'

export type AlertOpStatus = 'open' | 'dispatched' | 'in_progress' | 'maintaining' | 'leak_cleared' | 'dismissed'

function readOps(): Record<string, AlertOpStatus> {
  try {
    const raw = localStorage.getItem(OPS_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Record<string, string>
    const out: Record<string, AlertOpStatus> = {}
    for (const [k, v] of Object.entries(p)) {
      if (['open', 'dispatched', 'in_progress', 'maintaining', 'leak_cleared', 'dismissed'].includes(v)) {
        out[k] = v as AlertOpStatus
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeOps(ops: Record<string, AlertOpStatus>) {
  localStorage.setItem(OPS_KEY, JSON.stringify(ops))
}

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
}

function iconFor(t: AlertRecord['type']) {
  if (t === 'SMS') return Smartphone
  if (t === 'Email') return Mail
  return MessageSquare
}

function statusBadge(op: AlertOpStatus) {
  const map: Record<AlertOpStatus, string> = {
    open: 'bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-300',
    dispatched: 'bg-sky-200 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200',
    in_progress: 'bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
    maintaining: 'bg-violet-200 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200',
    leak_cleared: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-200',
    dismissed: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500',
  }
  const label: Record<AlertOpStatus, string> = {
    open: 'Open',
    dispatched: 'Team notified',
    in_progress: 'Crew on site',
    maintaining: 'Maintaining / repair',
    leak_cleared: '✅ Leak cleared',
    dismissed: 'Cleared',
  }
  return { className: map[op], label: label[op] }
}

export default function AlertsPage() {
  const [items, setItems] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [ops, setOps] = useState<Record<string, AlertOpStatus>>(readOps)
  const [dismissed, setDismissed] = useState<Set<string>>(readDismissed)
  const [showDismissed, setShowDismissed] = useState(false)

  const setOp = useCallback((id: string, status: AlertOpStatus) => {
    setOps((prev) => {
      const next = { ...prev, [id]: status }
      writeOps(next)
      return next
    })
  }, [])

  const clearAlert = useCallback((id: string) => {
    setOp(id, 'dismissed')
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      writeDismissed(next)
      return next
    })
  }, [setOp])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      const data = await getAlerts()
      if (!cancel) {
        setItems(data)
        setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [])

  const activeItems = items.filter((a) => !dismissed.has(a.id))
  const dismissedItems = items.filter((a) => dismissed.has(a.id))

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-8 h-8 text-orange-500 dark:text-orange-400" />
            Alerts panel
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Dispatch log with <strong className="text-slate-800 dark:text-slate-200">field workflow</strong>: track crew assignment, repair status, and leak clearance.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeItems.length} active · {dismissedItems.length} cleared
          </span>
          {dismissedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDismissed((v) => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              {showDismissed ? 'Hide cleared' : 'Show cleared'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <Clock className="w-4 h-4 animate-spin" />
          Fetching alert history…
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {activeItems.map((a, i) => {
              const Icon = iconFor(a.type)
              const op = ops[a.id] ?? 'open'
              const badge = statusBadge(op)
              return (
                <motion.article
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04, layout: { duration: 0.3 } }}
                  className="rounded-2xl glass border border-slate-200/80 dark:border-white/10 p-5 flex flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400/90">{a.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300">{a.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'delivered' ? 'bg-emerald-200/90 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-200/90 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'}`}>
                          Channel: {a.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                          Ops: {badge.label}
                        </span>
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium mt-2">{a.message ?? 'Automated leak notification'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Routed to team <span className="text-orange-700 dark:text-orange-200 font-mono">{a.assigned_team_id}</span>
                        {' · '}
                        GPS ({a.assigned_team_gps.lat.toFixed(4)}, {a.assigned_team_gps.lon.toFixed(4)})
                      </p>
                      {a.leak_gps && (
                        <p className="text-xs text-red-700 dark:text-red-300/90 mt-1">
                          <AlertTriangle className="inline w-3 h-3 mr-1" />
                          Leak coords: {a.leak_gps.lat.toFixed(4)}, {a.leak_gps.lon.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 md:text-right shrink-0">{new Date(a.time).toLocaleString()}</div>
                  </div>

                  {/* Workflow buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
                    <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mr-2">
                      <Wrench className="w-3.5 h-3.5" />
                      Field status:
                    </span>
                    <button
                      type="button"
                      onClick={() => setOp(a.id, 'dispatched')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${op === 'dispatched' ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}
                    >
                      📢 Team notified
                    </button>
                    <button
                      type="button"
                      onClick={() => setOp(a.id, 'in_progress')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${op === 'in_progress' ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-400/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20'}`}
                    >
                      🚶 Crew on site
                    </button>
                    <button
                      type="button"
                      onClick={() => setOp(a.id, 'maintaining')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${op === 'maintaining' ? 'bg-violet-500 text-white border-violet-500' : 'border-violet-400/50 bg-violet-500/10 text-violet-900 dark:text-violet-200 hover:bg-violet-500/20'}`}
                    >
                      🔧 Maintaining leak
                    </button>
                    <button
                      type="button"
                      onClick={() => setOp(a.id, 'leak_cleared')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${op === 'leak_cleared' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/25'}`}
                    >
                      ✅ Leak clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setOp(a.id, 'open')}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Clear Leak button — removes alert from view */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => clearAlert(a.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-500/20 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear leak &amp; dismiss alert
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>

          {activeItems.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">All clear — no active alerts</p>
              <p className="text-sm text-slate-500 mt-1">All incidents have been resolved or cleared.</p>
            </motion.div>
          )}

          {/* Dismissed / Cleared alerts section */}
          <AnimatePresence>
            {showDismissed && dismissedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">Cleared alerts</p>
                {dismissedItems.map((a) => {
                  const Icon = iconFor(a.type)
                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4 opacity-60 flex items-center gap-3"
                    >
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-mono text-slate-500">{a.id}</span>
                      <span className="text-xs text-slate-500 flex-1 truncate">{a.message ?? 'Alert'}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Cleared</span>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
