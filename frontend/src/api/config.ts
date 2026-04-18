const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const DEFAULT_BASE = (configuredApiUrl || '/api').replace(/\/$/, '')
const DEV_PORTS = Array.from({ length: 31 }, (_, index) => 8000 + index)

let resolvedApiBase: string | null = null
let resolvingApiBase: Promise<string> | null = null

function isAbsoluteHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value)
}

function withTimeout(ms: number) {
	const controller = new AbortController()
	const timer = window.setTimeout(() => controller.abort(), ms)
	return {
		signal: controller.signal,
		clear: () => window.clearTimeout(timer),
	}
}

async function isReachable(base: string): Promise<boolean> {
	const { signal, clear } = withTimeout(2000)
	try {
		const statusResp = await fetch(`${base}/status`, { method: 'GET', signal })
		if (!statusResp.ok) {
			return false
		}

		const loginResp = await fetch(`${base}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
			signal,
		})

		if (![400, 401, 422].includes(loginResp.status)) {
			return false
		}

		const probeEmail = `probe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
		const signupResp = await fetch(`${base}/auth/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Connectivity Probe',
				email: probeEmail,
				password: 'ProbePass123!',
				role: 'operator',
			}),
			signal,
		})

		// Healthy backends should execute signup route without 5xx.
		return [200, 400, 409, 422].includes(signupResp.status)
	} catch {
		return false
	} finally {
		clear()
	}
}

async function discoverApiBase(): Promise<string> {
	if (!import.meta.env.DEV) {
		return DEFAULT_BASE
	}

	const normalizedConfigured = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : ''
	if (normalizedConfigured && normalizedConfigured !== '/api' && isAbsoluteHttpUrl(normalizedConfigured)) {
		return normalizedConfigured
	}

	// In development, prefer the proxy '/api' first as it is more stable (same-origin).
	// Only probe absolute URLs if '/api' is clearly not going to work.
	return '/api'
}

export async function getApiBase(): Promise<string> {
	if (resolvedApiBase) {
		return resolvedApiBase
	}

	if (!resolvingApiBase) {
		resolvingApiBase = discoverApiBase().then((base) => {
			resolvedApiBase = base.replace(/\/$/, '')
			return resolvedApiBase
		})
	}

	return resolvingApiBase
}

export async function getApiUrl(path: string): Promise<string> {
	const base = await getApiBase()
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return `${base}${normalizedPath}`
}
