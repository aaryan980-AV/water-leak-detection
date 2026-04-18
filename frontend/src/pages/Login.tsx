import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HardHat, LogIn, Radar, Droplets, ShieldCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from '../components/ThemeToggle'

type Role = 'maintenance' | 'water_supplier' | 'supervisor' | null

const ROLES = [
  {
    id: 'maintenance' as const,
    label: 'Maintenance Team',
    desc: 'Field crew & repair technicians',
    icon: HardHat,
    color: 'from-orange-500/20 to-orange-400/10 border-orange-400/40 text-orange-700 dark:text-orange-300',
    glow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]',
  },
  {
    id: 'water_supplier' as const,
    label: 'Water Supplier',
    desc: 'Distribution & supply operations',
    icon: Droplets,
    color: 'from-blue-500/20 to-cyan-400/10 border-blue-400/40 text-blue-700 dark:text-blue-300',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
  {
    id: 'supervisor' as const,
    label: 'Supervisor / Admin',
    desc: 'Management & operational oversight',
    icon: ShieldCheck,
    color: 'from-cyan-500/20 to-fuchsia-400/10 border-cyan-400/40 text-cyan-700 dark:text-cyan-300',
    glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [role, setRole] = useState<Role>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const result = await login(email, password)
      if (result.ok) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('A system error occurred. Please try again.')
    }
  }

  return (
    <div className="relative min-h-svh flex items-center justify-center p-6 grid-bg">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl glass border border-cyan-500/25 p-8 shadow-[0_0_60px_-20px_rgba(34,211,238,0.35)]"
      >
        <Link to="/" className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-8 hover:underline">
          <Radar className="w-4 h-4" />
          Back to home
        </Link>

        {step === 'role' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Who is accessing?</h1>
                <p className="text-sm text-slate-600 dark:text-slate-500">Select your role to continue</p>
              </div>
            </div>
            <div className="space-y-3">
              {ROLES.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setStep('form') }}
                    className={`w-full flex items-center gap-4 rounded-2xl bg-gradient-to-r ${r.color} border p-4 transition-all ${r.glow} group`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.label}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{r.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
                <p className="text-sm text-slate-600 dark:text-slate-500">
                  Signing in as:{' '}
                  <span className="font-medium text-cyan-600 dark:text-cyan-400">
                    {ROLES.find((r) => r.id === role)?.label}
                  </span>
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-600"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="flex-1 rounded-xl border border-slate-200 text-slate-700 font-medium py-3 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-semibold py-3 hover:brightness-110 transition"
                >
                  Sign in
                </button>
              </div>
            </form>
          </motion.div>
        )}
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-500">
          No account?{' '}
          <Link to="/signup" className="text-cyan-600 dark:text-cyan-400 hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
