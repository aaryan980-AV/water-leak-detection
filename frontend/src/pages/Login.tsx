import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Radar, Mail, Lock } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from '../components/ThemeToggle'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.ok) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('A system error occurred. Please try again.')
    } finally {
      setIsLoading(false)
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

        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-lg mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to your AquaSense account to access the detection dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition shadow-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-500/10 py-2.5 px-3 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white p-3.5 font-bold transition shadow-lg shadow-cyan-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-500 font-medium">
          Trouble signing in?{' '}
          <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:underline">Contact IT Support</a>
        </p>
      </motion.div>
    </div>
  )
}
