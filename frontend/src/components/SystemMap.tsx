import { useMemo, useEffect } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, Circle, CircleMarker, ZoomControl, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import clsx from 'clsx'
import type { LocationsResponse, MapFilters, StatusResponse, SensorLoc, TeamLoc } from '../types'
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from '../config/region'
import 'leaflet/dist/leaflet.css'

/* ─────────────────────────────────────────────────────────────────────────────
   Fix Leaflet's default icon URL resolution (Webpack/Vite asset issue)
   Taken directly from the reference LeakMap.jsx pattern.
───────────────────────────────────────────────────────────────────────────── */
// @ts-expect-error – _getIconUrl is a private leaflet property
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const LIGHT_MAP_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

/* ─────────────────────────────────────────────────────────────────────────────
   MAINTENANCE ICON  — exact wrench + screwdriver SVG from LeakMap.jsx
   White circle, blue (#296593) stroke, crossed tools
───────────────────────────────────────────────────────────────────────────── */
const MAINTENANCE_ICON = new L.DivIcon({
  html: `
<div style="display:flex;justify-content:center;align-items:center;width:52px;height:52px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
  <svg width="52" height="52" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="white" stroke="#296593" stroke-width="8"/>

    <!-- Screwdriver (bottom-left to top-right) -->
    <g transform="rotate(45 50 50)">
      <rect x="46" y="20" width="8" height="40" fill="#296593"/>
      <polygon points="46,20 48,12 52,12 54,20" fill="#296593"/>
      <rect x="40" y="55" width="20" height="28" rx="6" fill="#296593"/>
    </g>

    <!-- Wrench (top-left to bottom-right) -->
    <g transform="rotate(-45 50 50)">
      <rect x="40" y="40" width="20" height="45" rx="8" fill="#296593"/>
      <circle cx="50" cy="30" r="18" fill="#296593"/>
      <circle cx="50" cy="20" r="10" fill="white"/>
      <rect x="40" y="8" width="20" height="15" fill="white"/>
      <circle cx="50" cy="76" r="3.5" fill="white"/>
    </g>
  </svg>
</div>`,
  className: 'custom-div-icon',
  iconSize:   [52, 52],
  iconAnchor: [26, 26],
  popupAnchor:[0, -28],
})

/* ─────────────────────────────────────────────────────────────────────────────
   WATER SUPPLY ICON  — white circle with blue border + water tower SVG
   Pattern from LeakMap's supplyIcon (white circle, blue 1976D2 border)
───────────────────────────────────────────────────────────────────────────── */
const WATER_ICON = new L.DivIcon({
  html: `
<div style="background:white;border:3.5px solid #1976D2;border-radius:50%;box-shadow:0 4px 10px rgba(0,0,0,0.22);display:flex;justify-content:center;align-items:center;width:52px;height:52px;overflow:hidden;">
  <svg width="36" height="36" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <!-- Roof -->
    <polygon points="40,6 62,22 18,22" fill="#1976D2"/>
    <!-- Tank body -->
    <rect x="18" y="22" width="44" height="24" rx="3" fill="#90caf9"/>
    <!-- Water fill -->
    <rect x="19" y="30" width="42" height="15" rx="2" fill="#1976D2" opacity="0.35"/>
    <!-- Water drop -->
    <path d="M40 26 Q36 32 36 36 Q36 40 40 40 Q44 40 44 36 Q44 32 40 26Z" fill="#1976D2"/>
    <!-- Platform -->
    <rect x="14" y="46" width="52" height="5" rx="2" fill="#455a64"/>
    <!-- Legs -->
    <line x1="24" y1="51" x2="19" y2="68" stroke="#37474f" stroke-width="4" stroke-linecap="round"/>
    <line x1="56" y1="51" x2="61" y2="68" stroke="#37474f" stroke-width="4" stroke-linecap="round"/>
    <line x1="33" y1="51" x2="29" y2="68" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>
    <line x1="47" y1="51" x2="51" y2="68" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>
    <!-- Cross braces -->
    <line x1="20" y1="54" x2="32" y2="64" stroke="#90a4ae" stroke-width="2"/>
    <line x1="32" y1="54" x2="20" y2="64" stroke="#90a4ae" stroke-width="2"/>
    <line x1="48" y1="54" x2="60" y2="64" stroke="#90a4ae" stroke-width="2"/>
    <line x1="60" y1="54" x2="48" y2="64" stroke="#90a4ae" stroke-width="2"/>
  </svg>
</div>`,
  className: 'custom-div-icon',
  iconSize:   [52, 52],
  iconAnchor: [26, 26],
  popupAnchor:[0, -28],
})

/* ─────────────────────────────────────────────────────────────────────────────
   SENSOR ICONS  — classic pin shape, 3 states
   • Normal  → blue  (#1d4ed8)
   • Leak    → red   (#dc2626)  + bounce animation (from LeakMap alertIcon concept)
   • Cleared → green (#16a34a)  + glow animation  (from LeakMap clearIcon concept)
───────────────────────────────────────────────────────────────────────────── */
type SensorState = 'normal' | 'leak' | 'degraded' | 'cleared'

function sensorIcon(sensor: SensorLoc, state: SensorState) {
  const cfg = {
    normal:   { pin: '#1d4ed8', ring: '#eff6ff', text: '#1e40af', badge: '● ONLINE',   anim: '' },
    degraded: { pin: '#1d4ed8', ring: '#eff6ff', text: '#1e40af', badge: '⚠ SIGNAL',   anim: '' },
    leak:     { pin: '#dc2626', ring: '#fef2f2', text: '#dc2626', badge: '🔴 LEAK',    anim: 'sensor-leak-bounce' },
    cleared:  { pin: '#16a34a', ring: '#f0fdf4', text: '#15803d', badge: '✅ RESOLVED', anim: 'sensor-cleared-glow' },
  }[state]

  const html = `
<div style="display:flex;flex-direction:column;align-items:center;">
  <div class="${cfg.anim}" style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.3));">
    <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2 C10 2 3 10 3 20 C3 33 20 50 20 50 S37 33 37 20 C37 10 30 2 20 2Z"
            fill="${cfg.pin}" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
      <circle cx="20" cy="20" r="3.5" fill="${cfg.pin}"/>
    </svg>
  </div>
  <!-- Sensor ID badge -->
  <div style="margin-top:-5px;background:${cfg.pin};color:#fff;font:800 9.5px ui-monospace,monospace;padding:2.5px 8px;border-radius:10px;border:2px solid white;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);letter-spacing:0.4px;">${sensor.id}</div>
  <!-- Status chip -->
  <div style="margin-top:2px;background:${cfg.ring};color:${cfg.text};font:600 8px Arial,sans-serif;padding:1.5px 5px;border-radius:6px;border:1px solid ${cfg.pin}40;white-space:nowrap;">${cfg.badge}</div>
</div>`

  return L.divIcon({
    className: '',
    html,
    iconSize:   [80, 86],
    iconAnchor: [40, 74],
    popupAnchor:[0, -74],
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVE LEAK ZONE marker  — from LeakMap alertIcon concept, but as divIcon
   so we can embed the 🚨 emoji with custom styling
───────────────────────────────────────────────────────────────────────────── */
const leakZoneIcon = () => L.divIcon({
  className: '',
  html: `
<div style="display:flex;flex-direction:column;align-items:center;">
  <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(220,38,38,0.92);border:4px solid white;font-size:24px;box-shadow:0 0 0 5px rgba(239,68,68,0.35),0 0 30px rgba(239,68,68,0.6);animation:pulse-leak 1.2s ease-in-out infinite;">💧</div>
  <div style="margin-top:4px;background:#dc2626;color:white;font:800 9px Arial,sans-serif;padding:3px 9px;border-radius:10px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;letter-spacing:0.5px;">⚠ ACTIVE LEAK</div>
</div>`,
  iconSize:   [100, 78],
  iconAnchor: [50, 56],
  popupAnchor:[0, -58],
})

/* ─────────────────────────────────────────────────────────────────────────────
   Haversine distance (km) — same formula used in backend assign-team logic
───────────────────────────────────────────────────────────────────────────── */
/*
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
*/

/* ─────────────────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────────────────── */
interface SystemMapProps {
  locations: LocationsResponse
  status: StatusResponse
  filters: MapFilters
  className?: string
  minHeight?: string
  onSelect?: (detail: { kind: string; title: string; body: string }) => void
  /** IDs of sensors that have been recently cleared (green state) */
  clearedSensorIds?: string[]
  /** Center the map on these coordinates when they change */
  center?: [number, number]
}

function ChangeView({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), { animate: true })
  }, [center, zoom, map])
  return null
}

/* ─────────────────────────────────────────────────────────────────────────────
   SystemMap Component
───────────────────────────────────────────────────────────────────────────── */
export function SystemMap({
  locations,
  status,
  filters,
  className,
  minHeight = 'min-h-[380px]',
  onSelect,
  clearedSensorIds = [],
  center,
}: SystemMapProps) {
  const nearestTeam: TeamLoc | undefined = useMemo(() =>
    status.nearest_team_id
      ? locations.teams.find((t) => t.id === status.nearest_team_id)
      : undefined,
    [locations.teams, status.nearest_team_id],
  )

  const routeLine: [number, number][] | null = useMemo(() => {
    if (!status.active_leak_gps || !nearestTeam) return null
    return [
      [nearestTeam.lat, nearestTeam.lon],
      [status.active_leak_gps.lat, status.active_leak_gps.lon],
    ]
  }, [nearestTeam, status.active_leak_gps])

  const leak = status.active_leak_gps
  const isLeak = status.overall === 'Leak' && leak && typeof leak.lat === 'number' && typeof leak.lon === 'number'


  /** Derive per-sensor state:
   *  leak_status === 1 → 'leak'
   *  dismissed === true → 'cleared'
   *  otherwise → 'normal'
   */
  function getSensorState(s: SensorLoc): SensorState {
    if (s.leak_status === 1) return 'leak'
    if (s.dismissed || clearedSensorIds.includes(s.id)) return 'cleared'
    return 'normal'
  }

  return (
    <div className={clsx('relative overflow-hidden rounded-2xl bg-white', minHeight, className)}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        className={clsx('h-full w-full z-0', minHeight)}
        scrollWheelZoom
      >
        <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url={LIGHT_MAP_TILES} />
        <ZoomControl position="topleft" />
        {center && <ChangeView center={center} zoom={15} />}



        {/* ── Dispatch route (orange dashed) — LeakMap pattern ────────── */}
        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#dc2626', weight: 4, dashArray: '10 12', opacity: 0.95 }}
          />
        )}

        {/* ── SENSORS ─────────────────────────────────────────────────── */}
        {filters.sensors && locations.sensors.map((s) => {
          const state = getSensorState(s)
          const isLeakSensor = state === 'leak'
          const isCleared   = state === 'cleared'

          return (
            <div key={s.id}>
              {/* Sensor pin marker */}
              <Marker
                position={[s.lat, s.lon]}
                icon={sensorIcon(s, state)}
                zIndexOffset={isLeakSensor ? 900 : isCleared ? 500 : 200}
                eventHandlers={{
                  click: () => onSelect?.({
                    kind: 'sensor',
                    title: `${isLeakSensor ? '🔴' : isCleared ? '✅' : '🔵'} Sensor: ${s.id}`,
                    body: [
                      s.name,
                      `Status: ${state.toUpperCase()}`,
                      isLeakSensor ? '🚨 Nearest to active leak — crew dispatched' : '',
                      isCleared ? '✅ Leak cleared & repaired' : '',
                      `Last update: ${s.last_update}`,
                    ].filter(Boolean).join('\n'),
                  }),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                      <span style={{ width:11, height:11, borderRadius:'50%', display:'inline-block',
                        background: isLeakSensor ? '#dc2626' : '#16a34a' }} />
                      <strong style={{ color: isLeakSensor ? '#dc2626' : '#15803d', fontSize:13 }}>{s.id}</strong>
                    </div>
                    <p style={{ margin:'2px 0', fontSize:12, color:'#475569' }}>{s.name}</p>
                    <p style={{ margin:'4px 0 2px', fontSize:11, fontWeight:700,
                      color: isLeakSensor ? '#dc2626' : isCleared ? '#16a34a' : '#1d4ed8' }}>
                      {isLeakSensor  ? '🔴 Leak Detected — active alert!' :
                       isCleared     ? '✅ Issue Resolved' :
                       '🔵 Normal — no leak'}
                    </p>
                    <p style={{ margin:0, fontSize:10, color:'#94a3b8' }}>{s.last_update}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Pulsing alert circle — from LeakMap `pulse-circle` pattern */}
              {isLeakSensor && (
                <Circle
                  center={[s.lat, s.lon]}
                  radius={200}
                  className="pulse-circle"
                  pathOptions={{ color: '#d32f2f', fillColor: '#d32f2f', fillOpacity: 0.2, weight: 3 }}
                />
              )}

              {/* Softer green glow for cleared sensors */}
              {isCleared && (
                <Circle
                  center={[s.lat, s.lon]}
                  radius={120}
                  pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.12, weight: 2, dashArray: '5 5' }}
                />
              )}
            </div>
          )
        })}

        {/* ── WATER SUPPLY — white circle + blue border (LeakMap supplyIcon) */}
        {filters.water && locations.water_sources.map((w) => (
          <Marker
            key={w.id}
            position={[w.lat, w.lon]}
            icon={WATER_ICON}
            eventHandlers={{
              click: () => onSelect?.({
                kind: 'water',
                title: `🚰 Water Supply: ${w.name}`,
                body: `Type: ${w.type}\nID: ${w.id}`,
              }),
            }}
          >
            <Popup>
              <div style={{ minWidth: 170 }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, color:'#1976D2' }}>🚰 {w.name}</p>
                <p style={{ margin:'2px 0', fontSize:11, color:'#475569' }}>ID: {w.id}</p>
                <p style={{ margin:0, fontSize:11, color:'#1976D2', fontWeight:600 }}>Active Supply Line</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── MAINTENANCE TEAMS — wrench + screwdriver SVG (LeakMap maintenanceIcon) */}
        {filters.teams && locations.teams.map((t) => {
          const isNearest = status.nearest_team_id === t.id && !!isLeak
          return (
            <Marker
              key={t.id}
              position={[t.lat, t.lon]}
              icon={MAINTENANCE_ICON}
              zIndexOffset={isNearest ? 800 : 400}
              eventHandlers={{
                click: () => onSelect?.({
                  kind: 'team',
                  title: `👷 Maintenance: ${t.name}`,
                  body: [
                    `Availability: ${t.availability.toUpperCase()}`,
                    isNearest ? '🚨 ASSIGNED — dispatched to active incident' : '',
                  ].filter(Boolean).join('\n'),
                }),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ margin:'0 0 4px', fontWeight:700, color:'#1d4ed8' }}>👷 {t.name}</p>
                  {isNearest && <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#dc2626' }}>🚨 Assigned to active incident</p>}
                  <p style={{ margin:0, fontSize:11,
                    color: t.availability === 'available' ? '#16a34a' : '#64748b',
                    fontWeight: 600 }}>
                    {t.availability === 'available' ? '✅ Available' : '⏳ Busy'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* ── ACTIVE LEAK ZONE + outer danger ring ───────────────────────── */}
        {isLeak && leak && (
          <>
            <Marker position={[leak.lat, leak.lon]} icon={leakZoneIcon()} zIndexOffset={1000}>
              <Popup>
                <div style={{ minWidth: 175 }}>
                  <p style={{ margin:'0 0 4px', fontWeight:800, color:'#dc2626', fontSize:14 }}>🚨 Active Leak Zone</p>
                  <p style={{ margin:'0 0 2px', fontSize:11, color:'#475569' }}>
                    GPS: {leak.lat.toFixed(4)}, {leak.lon.toFixed(4)}
                  </p>
                  {nearestTeam && (
                    <p style={{ margin:0, fontSize:11, color:'#dc2626', fontWeight:600 }}>
                      🔧 Routed to: {nearestTeam.name}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Large pulsing outer zone circle — matching LeakMap Circle radius pattern */}
            <CircleMarker
              center={[leak.lat, leak.lon]}
              radius={60}
              pathOptions={{ color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.07, weight:2, dashArray:'6 4' }}
            />
          </>
        )}
      </MapContainer>

      {/* ── Floating Legend Panel (top-right) ────────────────────────────── */}
      <div className="pointer-events-none absolute top-3 right-3 z-[500]">
        <div className="rounded-xl bg-white/97 border border-slate-200 shadow-lg backdrop-blur-sm p-3 space-y-2 min-w-[200px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 pb-1 border-b border-slate-100">
            Map Legend
          </p>

          {/* Normal sensor */}
          <div className="flex items-center gap-2.5">
            <svg width="20" height="25" viewBox="0 0 40 52"><path d="M20 2 C10 2 3 10 3 20 C3 33 20 50 20 50 S37 33 37 20 C37 10 30 2 20 2Z" fill="#1d4ed8" stroke="white" strokeWidth="3"/><circle cx="20" cy="20" r="8" fill="white"/><circle cx="20" cy="20" r="3.5" fill="#1d4ed8"/></svg>
            <div><p className="text-[11px] font-bold text-blue-700">Acoustic Sensor</p><p className="text-[9px] text-slate-500">Normal — no leak</p></div>
          </div>

          {/* Cleared sensor */}
          <div className="flex items-center gap-2.5">
            <svg width="20" height="25" viewBox="0 0 40 52"><path d="M20 2 C10 2 3 10 3 20 C3 33 20 50 20 50 S37 33 37 20 C37 10 30 2 20 2Z" fill="#16a34a" stroke="white" strokeWidth="3"/><circle cx="20" cy="20" r="8" fill="white"/><circle cx="20" cy="20" r="3.5" fill="#16a34a"/></svg>
            <div><p className="text-[11px] font-bold text-emerald-700">Resolved Sensor</p><p className="text-[9px] text-slate-500">Leak cleared (Green)</p></div>
          </div>

          {/* Leak sensor */}
          <div className="flex items-center gap-2.5">
            <svg width="20" height="25" viewBox="0 0 40 52"><path d="M20 2 C10 2 3 10 3 20 C3 33 20 50 20 50 S37 33 37 20 C37 10 30 2 20 2Z" fill="#dc2626" stroke="white" strokeWidth="3"/><circle cx="20" cy="20" r="8" fill="white"/><circle cx="20" cy="20" r="3.5" fill="#dc2626"/></svg>
            <div><p className="text-[11px] font-bold text-red-700">Sensor (Leak 🔴)</p><p className="text-[9px] text-red-500">Pulsing alert circle</p></div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Maintenance */}
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="white" stroke="#296593" strokeWidth="8"/>
              <g transform="rotate(45 50 50)"><rect x="46" y="20" width="8" height="40" fill="#296593"/><polygon points="46,20 48,12 52,12 54,20" fill="#296593"/><rect x="40" y="55" width="20" height="28" rx="6" fill="#296593"/></g>
              <g transform="rotate(-45 50 50)"><rect x="40" y="40" width="20" height="45" rx="8" fill="#296593"/><circle cx="50" cy="30" r="18" fill="#296593"/><circle cx="50" cy="20" r="10" fill="white"/><rect x="40" y="8" width="20" height="15" fill="white"/></g>
            </svg>
            <div><p className="text-[11px] font-bold" style={{ color:'#296593' }}>Maintenance Team</p><p className="text-[9px] text-slate-500">Field crew position</p></div>
          </div>

          {/* Water supply */}
          <div className="flex items-center gap-2.5">
            <div style={{ width:26, height:26, background:'white', border:'2.5px solid #1976D2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:13 }}>🚰</span>
            </div>
            <div><p className="text-[11px] font-bold text-blue-700">Water Supply</p><p className="text-[9px] text-slate-500">Reservoir / pump</p></div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Leak zone */}
          <div className="flex items-center gap-2.5">
            <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(220,38,38,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, border:'2px solid white', boxShadow:'0 0 6px rgba(239,68,68,0.5)' }}>💧</div>
            <div><p className="text-[11px] font-bold text-red-700">Active Leak Zone</p><p className="text-[9px] text-slate-500">AI-detected location</p></div>
          </div>


        </div>
      </div>
    </div>
  )
}
