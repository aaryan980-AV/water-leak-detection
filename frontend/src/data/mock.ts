import type { AlertRecord, LeakRecord, LocationsResponse, StatusResponse, FeedItem } from '../types'
import { BASE_LAT, BASE_LON } from '../config/region'

// ─── Live status (starts "No Leak", toggled by Dashboard simulate buttons) ───
export const mockStatus: StatusResponse = {
  overall: 'Leak',
  active_leak_gps: { lat: 19.0805, lon: 72.8808 },
  nearest_team_id: 'RT-114',
  updated_at: new Date().toISOString(),
}

// ─── Locations ────────────────────────────────────────────────────────────────
export const mockLocations: LocationsResponse = {
  sensors: [
    { id: 'sens101', name: 'Murarji Peth Acoustic',     lat: BASE_LAT + 0.014, lon: BASE_LON + 0.007,  status: 'online',   last_update: '2026-04-12T10:22:01Z' },
    { id: 'sens102', name: 'Hotgi Road Node A',         lat: BASE_LAT + 0.011, lon: BASE_LON - 0.005,  status: 'online',   last_update: '2026-04-12T10:21:58Z' },
    { id: 'sens103', name: 'Railway Feeder B',          lat: BASE_LAT - 0.007, lon: BASE_LON + 0.011,  status: 'degraded', last_update: '2026-04-12T10:15:40Z' },
    { id: 'sens104', name: 'Vijay Nagar East',          lat: BASE_LAT - 0.013, lon: BASE_LON - 0.003,  status: 'online',   last_update: '2026-04-12T10:22:00Z' },
    { id: 'sens105', name: 'Siddheshwar Sector',        lat: BASE_LAT + 0.005, lon: BASE_LON + 0.014,  status: 'online',   last_update: '2026-04-12T10:21:55Z' },
    { id: 'sens106', name: 'South Kasba Line',          lat: BASE_LAT + 0.003, lon: BASE_LON - 0.011,  status: 'online',   last_update: '2026-04-12T10:21:52Z' },
    { id: 'sens107', name: 'Madha Road Junction',       lat: BASE_LAT - 0.005, lon: BASE_LON + 0.006,  status: 'online',   last_update: '2026-04-12T10:21:50Z' },
    { id: 'sens108', name: 'Navi Peth Grid',            lat: BASE_LAT + 0.017, lon: BASE_LON + 0.002,  status: 'online',   last_update: '2026-04-12T10:21:48Z' },
    { id: 'sens109', name: 'Kacheri Chowk',             lat: BASE_LAT - 0.018, lon: BASE_LON + 0.008,  status: 'degraded', last_update: '2026-04-12T10:12:00Z' },
    { id: 'sens110', name: 'Indira Nagar Loop',         lat: BASE_LAT + 0.004, lon: BASE_LON + 0.018,  status: 'online',   last_update: '2026-04-12T10:21:45Z' },
    { id: 'sens111', name: 'Bhavani Peth Trunk',        lat: BASE_LAT - 0.011, lon: BASE_LON - 0.012,  status: 'online',   last_update: '2026-04-12T10:21:42Z' },
    { id: 'sens112', name: 'Vijapur Road',              lat: BASE_LAT + 0.008, lon: BASE_LON - 0.016,  status: 'online',   last_update: '2026-04-12T10:21:40Z' },
    { id: 'sens113', name: 'Ring Road North',           lat: BASE_LAT + 0.019, lon: BASE_LON - 0.008,  status: 'online',   last_update: '2026-04-12T10:21:38Z' },
    { id: 'sens114', name: 'Lamantanda Field',          lat: BASE_LAT - 0.016, lon: BASE_LON + 0.014,  status: 'online',   last_update: '2026-04-12T10:21:35Z' },
    { id: 'sens115', name: 'Bandra Reclamation',        lat: BASE_LAT + 0.024, lon: BASE_LON - 0.020,  status: 'online',   last_update: '2026-04-12T10:22:05Z' },
    { id: 'sens116', name: 'Wadala Terminal',           lat: BASE_LAT + 0.010, lon: BASE_LON + 0.025,  status: 'online',   last_update: '2026-04-12T10:22:10Z' },
    { id: 'sens117', name: 'Kurla Junction',            lat: BASE_LAT - 0.005, lon: BASE_LON + 0.030,  status: 'online',   last_update: '2026-04-12T10:22:15Z' },
    { id: 'sens118', name: 'Mulund Check Naka',         lat: BASE_LAT + 0.035, lon: BASE_LON + 0.040,  status: 'online',   last_update: '2026-04-12T10:22:20Z' },
    { id: 'sens119', name: 'Borivali Park Gate',        lat: BASE_LAT + 0.050, lon: BASE_LON - 0.015,  status: 'online',   last_update: '2026-04-12T10:22:25Z' },
    { id: 'sens120', name: 'Andheri West Node',         lat: BASE_LAT + 0.015, lon: BASE_LON - 0.030,  status: 'online',   last_update: '2026-04-12T10:22:30Z' },
  ],
  water_sources: [
    { id: 'wtr-01', name: 'Siddheshwar Reservoir',     type: 'reservoir',       lat: BASE_LAT + 0.006, lon: BASE_LON + 0.004  },
    { id: 'wtr-02', name: 'Ujani Canal Tap',           type: 'canal_tap',       lat: BASE_LAT - 0.004, lon: BASE_LON + 0.016  },
    { id: 'wtr-03', name: 'PMC Main Pump Station',     type: 'pump_station',    lat: BASE_LAT + 0.012, lon: BASE_LON - 0.012  },
    { id: 'wtr-04', name: 'Bhandup Treatment Plant',   type: 'treatment_plant', lat: BASE_LAT + 0.022, lon: BASE_LON + 0.018  },
    { id: 'wtr-05', name: 'Vihar Lake Reservoir',      type: 'reservoir',       lat: BASE_LAT + 0.030, lon: BASE_LON + 0.022  },
  ],
  teams: [
    { id: 'team-01', name: 'Solapur Rapid Response',   lat: BASE_LAT + 0.016, lon: BASE_LON + 0.005,  availability: 'available' },
    { id: 'team-02', name: 'PMC Jal Squad — Vijay Nagar', lat: BASE_LAT - 0.012, lon: BASE_LON + 0.002, availability: 'available' },
    { id: 'team-03', name: 'Hydrotech Field Alpha',    lat: BASE_LAT + 0.007, lon: BASE_LON - 0.009,  availability: 'busy'      },
    { id: 'team-04', name: 'MJP Maintenance West',     lat: BASE_LAT - 0.006, lon: BASE_LON - 0.010,  availability: 'available' },
    { id: 'team-05', name: 'Smart City Water OSS',     lat: BASE_LAT + 0.002, lon: BASE_LON + 0.012,  availability: 'available' },
    { id: 'team-06', name: 'Ring Road Emergency Unit', lat: BASE_LAT + 0.018, lon: BASE_LON - 0.004,  availability: 'available' },
    { id: 'team-07', name: 'Lamantanda Crew',          lat: BASE_LAT - 0.014, lon: BASE_LON + 0.011,  availability: 'busy'      },
    { id: 'team-08', name: 'Dharavi Tech Squad',       lat: BASE_LAT - 0.010, lon: BASE_LON - 0.005,  availability: 'available' },
    { id: 'team-09', name: 'Chembur Maintenance',      lat: BASE_LAT - 0.005, lon: BASE_LON + 0.020,  availability: 'available' },
  ],
  pipeline_segments: [
    [[BASE_LAT+0.018,BASE_LON-0.006],[BASE_LAT+0.012,BASE_LON],[BASE_LAT+0.006,BASE_LON+0.008],[BASE_LAT,BASE_LON+0.012]],
    [[BASE_LAT+0.008,BASE_LON-0.014],[BASE_LAT+0.002,BASE_LON-0.006],[BASE_LAT-0.006,BASE_LON]],
    [[BASE_LAT-0.016,BASE_LON+0.004],[BASE_LAT-0.010,BASE_LON+0.008],[BASE_LAT-0.002,BASE_LON+0.010]],
    [[BASE_LAT+0.014,BASE_LON+0.012],[BASE_LAT+0.006,BASE_LON+0.014],[BASE_LAT-0.004,BASE_LON+0.016]],
    [[BASE_LAT+0.016,BASE_LON+0.003],[BASE_LAT+0.008,BASE_LON+0.002],[BASE_LAT,BASE_LON],[BASE_LAT-0.010,BASE_LON-0.004]],
  ],
}

export const mockHistory: LeakRecord[] = [
  { id: 'lk-1001', timestamp: '2026-04-12T07:15:00Z', result: 'Leak',    confidence: 0.97, location_gps: { lat: BASE_LAT - 0.013, lon: BASE_LON - 0.003 } },
  { id: 'lk-1002', timestamp: '2026-04-12T05:40:00Z', result: 'No Leak', confidence: 0.92, location_gps: { lat: BASE_LAT + 0.005, lon: BASE_LON + 0.009 } },
  { id: 'lk-1003', timestamp: '2026-04-11T14:32:00Z', result: 'Leak',    confidence: 0.94, location_gps: { lat: BASE_LAT - 0.001, lon: BASE_LON + 0.001 } },
  { id: 'lk-1004', timestamp: '2026-04-11T09:10:00Z', result: 'No Leak', confidence: 0.88, location_gps: { lat: BASE_LAT + 0.002, lon: BASE_LON - 0.002 } },
]

export const mockAlerts: AlertRecord[] = [
  {
    id: 'alt-501', type: 'SMS', status: 'delivered', time: '2026-04-12T07:15:18Z',
    assigned_team_id: 'team-02',
    assigned_team_gps: { lat: mockLocations.teams[1].lat, lon: mockLocations.teams[1].lon },
    message: 'CRITICAL: Leak detected near Vijay Nagar East (sens104) — confidence 97%',
    leak_gps: { lat: BASE_LAT - 0.013, lon: BASE_LON - 0.003 },
  },
  {
    id: 'alt-502', type: 'Email', status: 'sent', time: '2026-04-12T07:15:22Z',
    assigned_team_id: 'team-02',
    assigned_team_gps: { lat: mockLocations.teams[1].lat, lon: mockLocations.teams[1].lon },
    message: 'Dispatch order issued — Crew en-route to Vijay Nagar East sector',
    leak_gps: { lat: BASE_LAT - 0.013, lon: BASE_LON - 0.003 },
  },
  {
    id: 'alt-503', type: 'In-App', status: 'delivered', time: '2026-04-12T07:15:09Z',
    assigned_team_id: 'team-02',
    assigned_team_gps: { lat: mockLocations.teams[1].lat, lon: mockLocations.teams[1].lon },
    message: 'Dashboard ping: assign nearest crew',
    leak_gps: { lat: BASE_LAT - 0.013, lon: BASE_LON - 0.003 },
  },
]

export const mockFeed: FeedItem[] = [
  { time: new Date(Date.now() - 90000).toISOString(),  endpoint: 'Navi Peth Grid · live stream',      sensor_id: 'sens108', prediction: 'No Leak', confidence: 0.91 },
  { time: new Date(Date.now() - 180000).toISOString(), endpoint: 'Hotgi Road Node A · live stream',   sensor_id: 'sens102', prediction: 'No Leak', confidence: 0.87 },
  { time: new Date(Date.now() - 300000).toISOString(), endpoint: 'Vijay Nagar East · live stream',    sensor_id: 'sens104', prediction: 'Leak',    confidence: 0.97 },
  { time: new Date(Date.now() - 420000).toISOString(), endpoint: 'South Kasba Line · live stream',    sensor_id: 'sens106', prediction: 'No Leak', confidence: 0.89 },
  { time: new Date(Date.now() - 540000).toISOString(), endpoint: 'Siddheshwar Sector · live stream',  sensor_id: 'sens105', prediction: 'No Leak', confidence: 0.93 },
]

export const mockPipelineStats = {
  ingest_hz: 49.2,
  cnn_inferences_per_sec: 14.1,
  train_buffer_pct: 78.0,
  model_version: 'cnn-leak-v3.2-stream',
}
