import { motion } from 'framer-motion'

export function ConfidenceMeter({ value, leak }: { value: number; leak: boolean }) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Model confidence</span>
        <span className={leak ? 'text-orange-300' : 'text-cyan-300'}>{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden border border-white/10">
        <motion.div
          className={leak ? 'h-full bg-gradient-to-r from-red-600 to-orange-400' : 'h-full bg-gradient-to-r from-cyan-700 to-cyan-400'}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
