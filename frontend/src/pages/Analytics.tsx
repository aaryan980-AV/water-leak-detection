import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { UploadCloud, Activity, AlertTriangle, CheckCircle, FileAudio } from 'lucide-react'
import type { LeakRecord } from '../types'
import { getHistory } from '../api/client'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

interface SpectrogramResult {
  is_leak: boolean;
  confidence: number;
  spectrogram_b64: string;
  error?: string;
}

export default function AnalyticsPage() {
  const [history, setHistory] = useState<LeakRecord[]>([])
  
  // Spectrogram state
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<SpectrogramResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/predict-spectrogram`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ is_leak: false, confidence: 0, spectrogram_b64: '', error: 'Failed to process audio' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Spectrogram CNN analysis, confidence trends, and system heatmaps.</p>
      </div>

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Spectrogram Upload & Visualization */}
        <motion.div className="rounded-2xl glass border border-white/10 p-6 flex flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Spectrogram Analysis Module</h2>
          
          <div 
            className="flex-1 rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition flex flex-col items-center justify-center p-8 cursor-pointer text-center relative overflow-hidden"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="audio/wav, audio/mpeg" 
              onChange={handleFileUpload}
            />
            
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-cyan-400 font-medium">Generating Spectrogram...</p>
                </motion.div>
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-4">
                  <img 
                    src={`data:image/png;base64,${result.spectrogram_b64}`} 
                    alt="Spectrogram" 
                    className="w-full max-w-sm rounded-lg shadow-lg border border-slate-700 object-cover"
                  />
                  <div className={`px-6 py-3 rounded-full border flex items-center gap-2 shadow-lg ${result.is_leak ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'}`}>
                    {result.is_leak ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span className="font-bold text-lg">{result.is_leak ? 'LEAK DETECTED' : 'NORMAL'}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-black/30 text-sm">{Math.round(result.confidence * 100)}% Conf</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Click to analyze another file</p>
                </motion.div>
              ) : (
                <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="h-16 w-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileAudio className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Upload Acoustic Sample</p>
                    <p className="text-sm mt-1">Select a .wav file from a field sensor</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Confidence Trend */}
        <div className="space-y-6 flex flex-col">
          <motion.div className="rounded-2xl glass border border-white/10 p-5 flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">AI Confidence Trend (Recent)</h2>
            <div className="h-48">
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
          
          {/* Heatmap */}
          <motion.div className="rounded-2xl glass border border-cyan-500/20 p-5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Synthetic Weekly Heatmap</h2>
            <div className="grid grid-cols-7 gap-2">
              {heat.map((c) => (
                <div key={c.d} className="text-center">
                  <div
                    className="h-12 rounded-xl border border-white/10 mb-2 transition-colors"
                    style={{
                      background: `linear-gradient(180deg, rgba(34,211,238,${0.15 + (c.v / 10) * 0.55}) 0%, rgba(232,121,249,${0.1 + (c.v / 12) * 0.4}) 100%)`,
                    }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium uppercase">{c.d}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
