import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getApiUrl } from '../api/config'

const SESSION_KEY = 'aquasense_session'
const TOKEN_KEY = 'aquasense_token'

export interface User {
  id: number
  email: string
  name: string
  role: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  googleLogin: () => Promise<{ ok: boolean; error?: string }>
  signup: (name: string, email: string, password: string, role?: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const login = useCallback(async (email: string, password: string) => {
    try {
      const loginUrl = await getApiUrl('/auth/login')
      const resp = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) return { ok: false, error: data.detail || 'Login failed' }

      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: 'Connection error' }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string, role = 'operator') => {
    try {
      const signupUrl = await getApiUrl('/auth/signup')
      const resp = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) return { ok: false, error: data.detail || 'Signup failed' }

      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: 'Connection error' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const googleLogin = useCallback(async () => {
    try {
      // Mock Google OAuth flow since no Client ID was provided
      // In production, you would use Firebase Auth or @react-oauth/google here
      const demoEmail = 'google_demo@example.com'
      const demoPass = 'google_secure_123'
      
      // Ensure user exists in backend
      await signup('Google User', demoEmail, demoPass, 'supervisor')
      
      // Log them in
      return await login(demoEmail, demoPass)
    } catch (err) {
      return { ok: false, error: 'Google Login failed' }
    }
  }, [login, signup])

  const value = useMemo(
    () => ({ user, token, login, googleLogin, signup, logout }),
    [user, token, login, googleLogin, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
