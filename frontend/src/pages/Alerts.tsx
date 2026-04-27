import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, Mail, MessageSquare, Smartphone, AlertTriangle, Clock, MapPin, Wrench, Megaphone, RotateCcw, X } from 'lucide-react'
import type { AlertRecord } from '../types'
import { getAlerts, postDismissLeak } from '../api/client'

function iconFor(t: AlertRecord['type']) {
  if (t === 'SMS') return Smartphone
  if (t === 'Email') return Mail
  return MessageSquare
}

type WorkflowStage = 'notified' | 'on_site' | 'maintaining' | 'cleared' | null

export default function AlertsPage() {
  const [items, setItems] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [workflowStates, setWorkflowStates] = useState<Record<string, WorkflowStage>>({})

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = async (alertId: string) => {
    const sensorId = alertId.replace('ALT-', '')
    try {
      await postDismissLeak(sensorId)
      await fetchAlerts()
    } catch (e) {
      console.error('Failed to dismiss leak', e)
    }
  }

  const setWorkflow = (alertId: string, stage: WorkflowStage) => {
    setWorkflowStates(prev => ({ ...prev, [alertId]: stage }))
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-orange-400" />
            Alerts panel
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Dispatch log with field workflow: track crew assignment, repair status, and leak clearance.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <span className="text-xs text-slate-400 font-medium bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            {items.length} active <span className="mx-1">•</span> 0 cleared
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 py-10 justify-center">
          <Clock className="w-5 h-5 animate-spin" />
          <span>Fetching alert history…</span>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((a, i) => {
              const Icon = iconFor(a.type)
              const stage = workflowStates[a.id] || null
              
              const isNotified = stage === 'notified' || stage === 'on_site' || stage === 'maintaining' || stage === 'cleared'
              const isOnSite = stage === 'on_site' || stage === 'maintaining' || stage === 'cleared'
              const isMaintaining = stage === 'maintaining' || stage === 'cleared'
              const isCleared = stage === 'cleared'

              return (
                <motion.article
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="relative rounded-2xl glass border border-slate-700/60 bg-[#0b1120]/80 p-5 flex flex-col gap-4 shadow-xl hover:border-slate-600/80 transition-colors group overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4 z-10">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-cyan-400">{a.id.toLowerCase()}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">{a.type === 'MessageSquare' ? 'In-App' : a.type}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Channel: delivered</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">Ops: {stage ? stage.replace('_', ' ') : 'Open'}</span>
                      </div>
                      
                      <h2 className="text-white font-semibold text-lg leading-tight mb-1">
                        {a.type === 'MessageSquare' ? `Dashboard ping: sens${a.id.replace('ALT-', '')} alert - nearest crew assigned` : 
                         a.type === 'Email' ? `Dispatch order for sens${a.id.replace('ALT-', '')} repair team dispatched` :
                         `CRITICAL: sens${a.id.replace('ALT-', '')} is leaked (Signal Degraded zone)`}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-2">
                        <span>Routed to team <span className="text-slate-200 font-mono">team-02</span></span>
                        <span>•</span>
                        <span>GPS ({a.leak_gps?.lat?.toFixed(4) || '19.0640'}, {a.leak_gps?.lon?.toFixed(4) || '72.8797'})</span>
                      </div>
                      
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-red-400/90 font-mono mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Leak coords: {a.leak_gps?.lat?.toFixed(4) || '19.0750'}, {a.leak_gps?.lon?.toFixed(4) || '72.8787'}
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-500 font-mono shrink-0 pt-1 text-right">
                      {new Date(a.time).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 z-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mr-2 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Field status:
                      </span>
                      
                      <button 
                        onClick={() => setWorkflow(a.id, 'notified')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isNotified ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}
                      >
                        <Megaphone className="w-3.5 h-3.5" /> Team notified
                      </button>
                      
                      <button 
                        onClick={() => setWorkflow(a.id, 'on_site')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isOnSite ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}
                      >
                        <MapPin className="w-3.5 h-3.5" /> Crew on site
                      </button>
                      
                      <button 
                        onClick={() => setWorkflow(a.id, 'maintaining')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isMaintaining ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}
                      >
                        <Wrench className="w-3.5 h-3.5" /> Maintaining leak
                      </button>
                      
                      <button 
                        onClick={() => setWorkflow(a.id, 'cleared')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isCleared ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Leak clear
                      </button>
                      
                      <button 
                        onClick={() => setWorkflow(a.id, null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-transparent text-slate-500 border border-slate-700/30 hover:bg-slate-800 hover:text-slate-300 transition-all ml-1"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDismiss(a.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear leak & dismiss alert
                    </button>
                  </div>
                  
                  {/* Subtle gradient background based on state */}
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none transition-colors duration-500 ${isCleared ? 'bg-emerald-500' : isMaintaining ? 'bg-purple-500' : isOnSite ? 'bg-amber-500' : isNotified ? 'bg-blue-500' : 'bg-red-500'}`} />
                </motion.article>
              )
            })}
          </AnimatePresence>

          {items.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-emerald-500/20 bg-[#0b1120]/60 p-16 text-center shadow-inner mt-8"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-2xl font-semibold text-emerald-400">All Clear</p>
              <p className="text-slate-400 mt-2 max-w-md mx-auto text-sm">No active leaks detected in the network. All sensors are operating nominally.</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
