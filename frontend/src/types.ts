export type LeakResult = 'Leak' | 'No Leak'

export interface Gps {
  lat: number
  lon: number
}

export interface LeakRecord {
  id: string
  timestamp: string
  result: LeakResult
  confidence: number
  location_gps: Gps
}

export type AlertType = 'SMS' | 'Email' | 'In-App'

export interface AlertRecord {
  id: string
  type: AlertType
  status: string
  time: string
  assigned_team_id: string
  assigned_team_gps: Gps
  message?: string
  leak_gps?: Gps
}

export interface SensorLoc {
  id: string
  name: string
  lat: number
  lon: number
  status: string
  last_update: string
}

export interface WaterSourceLoc {
  id: string
  name: string
  type: string
  lat: number
  lon: number
}

export interface TeamLoc {
  id: string
  name: string
  lat: number
  lon: number
  availability: string
}

export interface LocationsResponse {
  sensors: SensorLoc[]
  water_sources: WaterSourceLoc[]
  teams: TeamLoc[]
  pipeline_segments: [number, number][][]
}

export interface StatusResponse {
  overall: LeakResult | string
  active_leak_gps: Gps | null
  nearest_team_id: string | null
  updated_at: string
}

export interface MapFilters {
  sensors: boolean
  water: boolean
  teams: boolean
  pipelines: boolean
}

export interface FeedItem {
  time: string
  /** e.g. sensor stream source label */
  endpoint: string
  prediction: string
  confidence: number
  sensor_id?: string
}
