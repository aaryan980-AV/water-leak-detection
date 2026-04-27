const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const DEFAULT_BASE = (configuredApiUrl || '/api').replace(/\/$/, '')

export async function getApiBase(): Promise<string> {
  return DEFAULT_BASE
}

export async function getApiUrl(path: string): Promise<string> {
  const base = await getApiBase()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
