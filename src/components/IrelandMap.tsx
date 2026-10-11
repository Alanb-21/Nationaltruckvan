import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { geoCentroid, geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

type Geo = Feature<Polygon | MultiPolygon>
let cache: FeatureCollection | null = null

/** Island of Ireland: the Ireland feature plus only the UK polygons whose centroid falls in Northern Ireland. */
async function loadIsland(): Promise<FeatureCollection> {
  if (cache) return cache
  const topo = (await import('world-atlas/countries-50m.json')).default as unknown as Parameters<typeof feature>[0]
  const countries = feature(topo, (topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } }).objects.countries) as unknown as FeatureCollection
  const ie = countries.features.find((f) => f.id === '372') as Geo
  const uk = countries.features.find((f) => f.id === '826') as Geo
  const ni: Geo[] = []
  if (uk && uk.geometry.type === 'MultiPolygon') {
    for (const coords of uk.geometry.coordinates) {
      const poly: Geo = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: coords } }
      const [lon, lat] = geoCentroid(poly)
      if (lon > -8.2 && lon < -5.4 && lat > 54.0 && lat < 55.4) ni.push(poly)
    }
  }
  cache = { type: 'FeatureCollection', features: [ie, ...ni] }
  return cache
}

export interface MapPin {
  id: string
  lat: number
  lon: number
  kind: 'depot' | 'breakdown' | 'vor' | 'vehicle' | 'replacement'
  label?: string
  active?: boolean
  onClick?: () => void
}

const W = 420
const H = 520

export function IrelandMap({ pins, className, children, showLabels = true }: { pins: MapPin[]; className?: string; children?: ReactNode; showLabels?: boolean }) {
  const [geo, setGeo] = useState<FeatureCollection | null>(cache)
  useEffect(() => {
    if (!geo) loadIsland().then(setGeo)
  }, [geo])

  const { path, project } = useMemo(() => {
    const proj = geoMercator()
    if (geo) proj.fitExtent([[24, 18], [W - 24, H - 18]], geo as GeoPermissibleObjects)
    const p = geoPath(proj)
    return { path: p, project: (lon: number, lat: number) => proj([lon, lat]) ?? [0, 0] }
  }, [geo])

  const order = { depot: 0, vehicle: 1, replacement: 2, vor: 3, breakdown: 4 }
  const sorted = [...pins].sort((a, b) => order[a.kind] - order[b.kind])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Map of Ireland">
      <defs>
        <radialGradient id="land" cx="0.45" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#11284c" />
          <stop offset="1" stopColor="#0a1a34" />
        </radialGradient>
        <filter id="pinGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      {geo && (
        <g>
          {geo.features.map((f, i) => (
            <path key={i} d={path(f) ?? ''} fill="url(#land)" stroke="rgba(160,190,235,0.32)" strokeWidth={0.7} strokeLinejoin="round" />
          ))}
        </g>
      )}
      {geo &&
        sorted.map((p) => {
          const [x, y] = project(p.lon, p.lat)
          const color = p.kind === 'breakdown' ? '#e2685e' : p.kind === 'vor' ? '#e2aa4c' : p.kind === 'depot' ? '#FFCD00' : p.kind === 'replacement' ? '#5cb88a' : '#9fb3d1'
          return (
            <g key={p.id} transform={`translate(${x} ${y})`} onClick={p.onClick} style={{ cursor: p.onClick ? 'pointer' : 'default' }} data-pin={p.id}>
              {p.kind === 'breakdown' && (
                <>
                  <circle r={9} fill={color} opacity={0.5} className="pulse-ring" />
                  <circle r={9} fill={color} opacity={0.35} className="pulse-ring" style={{ animationDelay: '0.9s' }} />
                </>
              )}
              <circle r={p.kind === 'depot' ? 9 : 6} fill={color} opacity={0.55} filter="url(#pinGlow)" />
              {p.kind === 'depot' ? (
                <>
                  <circle r={7} fill="#071b3a" stroke={color} strokeWidth={2} />
                  <circle r={2.6} fill={color} />
                </>
              ) : (
                <circle r={p.active ? 6 : 4.5} fill={color} stroke="#071b3a" strokeWidth={1.6} />
              )}
              {p.onClick && <circle r={14} fill="transparent" />}
              {showLabels && p.label && (
                <text x={p.kind === 'depot' ? 13 : 10} y={4} fontSize={p.kind === 'depot' ? 12 : 11} fontWeight={600} fill={p.kind === 'depot' ? '#f2f5fa' : '#c9d4e6'} style={{ paintOrder: 'stroke', stroke: '#06142b', strokeWidth: 3 }}>
                  {p.label}
                </text>
              )}
            </g>
          )
        })}
      {children}
    </svg>
  )
}
