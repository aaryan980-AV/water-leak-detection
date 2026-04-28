import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  Home,
  Map as MapIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { getStatus, isUsingMock } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { LogIn, LogOut, UserPlus } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import logo from '../assets/logo.png'

const nav = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/map', label: 'Smart Map', icon: MapIcon },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Layout() {
  const loc = useLocation()
  const { user, logout } = useAuth()
  const [mock, setMock] = useState(false)
  useEffect(() => {
    getStatus().finally(() => setMock(isUsingMock()))
  }, [])

  return (
    <div className="min-h-svh flex flex-col md:flex-row text-left">
      <motion.aside
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="md:w-56 shrink-0 glass border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/10 p-4 flex md:flex-col gap-2 md:gap-6 z-20"
      >
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img src={logo} alt="Mumbai City Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400/80">AquaSense</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Mumbai City</p>
            </div>
          </div>
          <ThemeToggle className="shrink-0 md:hidden" />
        </div>
        <div className="hidden md:flex justify-end px-2">
          <ThemeToggle />
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive || (to !== '/' && loc.pathname.startsWith(to))
                    ? 'bg-cyan-500/15 text-cyan-800 border border-cyan-500/40 dark:text-cyan-200 dark:border-cyan-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5',
                )
              }
              end={to === '/'}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 px-2 pt-4 border-t border-slate-200/80 dark:border-white/10 md:border-0 md:pt-0">
          {user ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-500 truncate" title={user.email}>
                {user.name}
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 px-3 py-2 text-xs font-medium text-cyan-800 hover:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-500/35"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign up
              </Link>
            </div>
          )}
          <div className="hidden md:block text-xs text-slate-500">
            {mock && (
              <span className="inline-flex items-center gap-1 text-amber-400/90">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Mock data (API offline)
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 min-w-0 p-4 md:p-8 grid-bg">
        <Outlet />
      </main>
    </div>
  )
}
