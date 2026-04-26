import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Radar } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from '../components/ThemeToggle'

export default function LoginPage() {
  const { googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await googleLogin()
      if (result.ok) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Failed to authenticate with Google')
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
            Sign in securely using your Google Workspace account to access the AquaSense dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {isLoading ? 'Authenticating...' : 'Sign in with Google'}
            </span>
          </button>
          
          {error && <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</p>}
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-500">
          Trouble signing in?{' '}
          <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:underline">Contact IT Support</a>
        </p>
      </motion.div>
    </div>
  )
}
