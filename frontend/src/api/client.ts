import axios from 'axios'
import type { AlertRecord, FeedItem, LeakRecord, LocationsResponse, StatusResponse } from '../types'
import * as mock from '../data/mock'
import { getApiBase } from './config'

export const apiBase = '/api'

const http = axios.create({
  timeout: 8000,
})

// Add a request interceptor to include the JWT token
http.interceptors.request.use(
  async (config) => {
    config.baseURL = await getApiBase()

    const token = localStorage.getItem('aquasense_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let useMock = false

function fallback<T>(data: T): T {
  useMock = true
  return data
}

export function isUsingMock() {
  return useMock
}

export async function getStatus(): Promise<StatusResponse> {
  try {
    const { data } = await http.get<StatusResponse>('/status')
    return data
  } catch {
    return fallback({ ...mock.mockStatus, updated_at: new Date().toISOString() })
  }
}

export async function getLocations(): Promise<LocationsResponse> {
  try {
    const { data } = await http.get<LocationsResponse>('/locations')
    return data
  } catch {
    return fallback(mock.mockLocations)
  }
}

export async function getHistory(): Promise<LeakRecord[]> {
  try {
    const { data } = await http.get<{ items: LeakRecord[] }>('/history')
    return data.items
  } catch {
    return fallback([...mock.mockHistory])
  }
}

export async function getAlerts(): Promise<AlertRecord[]> {
  try {
    const { data } = await http.get<{ items: AlertRecord[] }>('/alerts')
    return data.items
  } catch {
    return fallback([...mock.mockAlerts])
  }
}

export async function getEvents(): Promise<FeedItem[]> {
  try {
    const { data } = await http.get<{ items: FeedItem[] }>('/history') // My backend uses history/leaks for events
    return data.items.map((item: any) => ({
      time: item.timestamp,
      prediction: item.result,
      confidence: item.confidence,
      endpoint: `Lat: ${item.location_gps?.lat?.toFixed(4) ?? 0}, Lon: ${item.location_gps?.lon?.toFixed(4) ?? 0}`,
      sensor_id: item.id
    }))
  } catch {
    return fallback([...mock.mockFeed])
  }
}

export interface PipelineStats {
  ingest_hz: number
  cnn_inferences_per_sec: number
  train_buffer_pct: number
  model_version: string
}

export async function getPipelineStats(): Promise<PipelineStats> {
  try {
    const { data } = await http.get<PipelineStats>('/pipeline-stats')
    return data
  } catch {
    return fallback({ ...mock.mockPipelineStats })
  }
}

export async function postSimulateLeak(lat?: number, lon?: number): Promise<void> {
  await http.post('/simulate-leak', null, { params: { lat, lon } })
}

export async function postClearLeak(): Promise<void> {
  await http.post('/clear-leak')
}

export async function getDataset(): Promise<any[]> {
  try {
    const { data } = await http.get<{ items: any[] }>('/dataset')
    return data.items
  } catch {
    return []
  }
}

export async function postPredictAcoustic(file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post('/predict-acoustic', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
