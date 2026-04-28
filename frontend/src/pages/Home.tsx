import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, Cloud, Cpu, Droplets, HardHat, Radio, ShieldCheck, Waves } from 'lucide-react'
import { HeroViz } from '../components/HeroViz'
import { HomeTrendChart } from '../components/HomeTrendChart'

const flow = [
  { icon: Radio, label: 'Sensors', desc: 'Subsurface acoustic nodes capture pressure & vibration in real time.' },
  { icon: Cloud, label: 'Live Ingest', desc: 'Sensors push acoustic frames continuously — no manual upload needed.' },
  { icon: Waves, label: 'Signal Analysis', desc: 'STFT frequency transform → feature extraction for CNN inference.' },
  { icon: Brain, label: 'AI Model', desc: 'Continuous leak inference + incremental training on live audio windows.' },
  { icon: Cpu, label: 'Live Dashboard', desc: 'Maps, real-time alerts, and analytics for all operators.' },
]

const roles = [
  {
    icon: HardHat,
    label: 'Maintenance Teams',
    desc: 'Field crews dispatched to suspected leak sites based on AI detection.',
    color: 'from-orange-500/20 to-transparent border-orange-400/30 text-orange-700 dark:text-orange-300',
  },
  {
    icon: Droplets,
    label: 'Water Suppliers',
    desc: 'Monitor distribution pressure, flow anomalies, and source intake status.',
    color: 'from-blue-500/20 to-transparent border-blue-400/30 text-blue-700 dark:text-blue-300',
  },
  {
    icon: ShieldCheck,
    label: 'Supervisors',
    desc: 'Tactical oversight of all ongoing incidents, clearances, and team assignments.',
    color: 'from-cyan-500/20 to-transparent border-cyan-400/30 text-cyan-700 dark:text-cyan-300',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 border border-cyan-500/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-cyan-600 dark:text-cyan-400 text-sm font-medium tracking-[0.2em] uppercase mb-3"
            >
              Maharashtra · Mumbai MMR smart water grid
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight dark:[text-shadow:0_0_24px_rgba(34,211,238,0.45)]"
            >
              Hear the grid.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400">
                Stop leaks
              </span>{' '}
              before they surface.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-5 text-slate-600 dark:text-slate-400 max-w-xl text-base md:text-lg"
            >
              Field sensors stream acoustic data into an AI pipeline that classifies leaks in real time — updating continuously as new signal windows arrive. No manual uploads, no delays.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-void px-6 py-3 font-semibold shadow-[0_0_32px_rgba(34,211,238,0.35)] hover:brightness-110 transition"
              >
                Sign in to monitor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-6 py-3 font-medium text-fuchsia-700 dark:text-fuchsia-100 hover:bg-fuchsia-500/20 transition"
              >
                Create account
              </Link>
            </motion.div>
          </div>
          <HeroViz />
        </div>
      </section>

      {/* Trend chart */}
      <section className="space-y-4">
        <HomeTrendChart />
      </section>

      {/* Who uses this system */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Who uses this system?</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl">
          AquaSense serves three types of operators — each with distinct responsibilities in the leak detection lifecycle.
        </p>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {roles.map(({ icon: Icon, label, desc, color }) => (
            <motion.div
              key={label}
              variants={item}
              className={`rounded-2xl bg-gradient-to-br ${color} border p-6 transition-all hover:scale-[1.02]`}
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-lg">{label}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-4 flex justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition"
          >
            Select your role & sign up
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* System pipeline */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">How it works</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
          End-to-end AI pipeline — from buried sensors to dashboard alerts.
        </p>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {flow.map(({ icon: Icon, label, desc }, idx) => (
            <motion.div
              key={label}
              variants={item}
              className="rounded-2xl glass p-5 border border-white/10 hover:border-cyan-500/30 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 text-xl font-black text-slate-200/10 dark:text-white/5 select-none">{idx + 1}</div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-shadow">
                <Icon className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold">{label}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-500 mt-2 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Smart response loop</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              On leak classification, the system picks the nearest available crew using Haversine distance, draws a live route on the map, and fans out SMS / Email / in-app alerts instantly.
            </p>
          </div>
          <Link
            to="/map"
            className="shrink-0 inline-flex items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-400/40 text-orange-200 px-6 py-3 font-medium hover:bg-orange-500/30 transition"
          >
            Open Smart Map
          </Link>
        </div>
      </section>
    </div>
  )
}
