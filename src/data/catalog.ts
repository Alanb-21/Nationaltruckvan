import type { ComplianceKind, Depot, VehicleStatus, VehicleType } from './types'

export const TYPE_LABEL: Record<VehicleType, string> = {
  'panel-van': 'Panel van',
  'high-roof-van': 'High-roof van',
  'fridge-van': 'Refrigerated van',
  luton: 'Luton',
  'rigid-box': 'Rigid box',
  'tail-lift': 'Tail-lift rigid',
  'curtain-sider': 'Curtain-sider',
  'fridge-rigid': 'Refrigerated rigid',
  tipper: 'Tipper / dropside',
  tractor: 'Tractor unit',
}

export const TYPE_SHORT: Record<VehicleType, string> = {
  'panel-van': 'Van',
  'high-roof-van': 'High-roof',
  'fridge-van': 'Fridge van',
  luton: 'Luton',
  'rigid-box': 'Rigid',
  'tail-lift': 'Tail-lift',
  'curtain-sider': 'Curtain',
  'fridge-rigid': 'Fridge rigid',
  tipper: 'Tipper',
  tractor: 'Tractor',
}

export const TYPES: VehicleType[] = [
  'panel-van',
  'high-roof-van',
  'fridge-van',
  'luton',
  'rigid-box',
  'tail-lift',
  'curtain-sider',
  'fridge-rigid',
  'tipper',
  'tractor',
]

export const HGV: VehicleType[] = ['rigid-box', 'tail-lift', 'curtain-sider', 'fridge-rigid', 'tipper', 'tractor']
export const isHGV = (t: VehicleType) => HGV.includes(t)
export const isFridge = (t: VehicleType) => t === 'fridge-van' || t === 'fridge-rigid'

export const STATUSES: VehicleStatus[] = ['On hire', 'Available', 'In workshop', 'VOR', 'Awaiting collection', 'Defleet']

export const COMPLIANCE_LABEL: Record<ComplianceKind, string> = {
  CVRT: 'CVRT',
  '13-week': '13-week inspection',
  Tacho: 'Tacho calibration',
  'Tail-lift': 'Tail-lift exam',
  Fridge: 'Fridge service',
  Probe: 'Temperature probe calibration',
  Tax: 'Motor tax',
}

/** Radar filter groups: fridge service and probe calibration sit together */
export const COMPLIANCE_FILTERS = ['CVRT', '13-week', 'Tacho', 'Tail-lift', 'Fridge', 'Tax'] as const

export const DEPOTS: Record<Depot, { name: string; address: string; lat: number; lon: number; bays: number; site: string }> = {
  Dublin: {
    name: 'Dublin',
    site: 'Ballycoolin',
    address: 'Stadium Business Park, Ballycoolin Road, Dublin 11, D11 CY95',
    lat: 53.4055,
    lon: -6.3597,
    bays: 12,
  },
  Cork: {
    name: 'Cork',
    site: 'Douglas',
    address: 'Johnson & Perrott, Douglas Road, Douglas, T12 E373',
    lat: 51.8853,
    lon: -8.4357,
    bays: 8,
  },
}

export const JOB_STAGES = ['Booked', 'In bay', 'Awaiting parts', 'QC', 'Ready'] as const

export const WALKAROUND_ITEMS = [
  'Tyres and wheels',
  'Lights',
  'Mirrors and glass',
  'Brakes',
  'Tail-lift',
  'Fridge unit and temperature',
  'Body and load security',
  'Fluids and warnings',
] as const

export const COMMON_FAULTS: Record<string, string[]> = {
  'Tyres and wheels': ['Low tread', 'Sidewall damage', 'Low pressure', 'Wheel nut indicator moved'],
  Lights: ['Headlight out', 'Indicator out', 'Brake light out', 'Marker light out'],
  'Mirrors and glass': ['Mirror cracked', 'Windscreen chip', 'Windscreen crack', 'Mirror loose'],
  Brakes: ['Air leak', 'Pulling to one side', 'Handbrake weak', 'Warning light on'],
  'Tail-lift': ['Tail-lift not operating', 'Hydraulic leak', 'Platform not level', 'Controls damaged'],
  'Fridge unit and temperature': ['Not holding temperature', 'Unit alarm', 'Display fault', 'Door seal damaged'],
  'Body and load security': ['Panel damage', 'Door not latching', 'Curtain torn', 'Strap rail damaged'],
  'Fluids and warnings': ['Engine warning light', 'AdBlue warning', 'Coolant low', 'Oil leak'],
}

export const REQUEST_TYPES = [
  'Request a Call Back',
  'Book a Service',
  'Ask a Question',
  'Parts Enquiry',
  'CVRT',
  'Tail Lift Inspection',
  'Request an extra vehicle',
] as const

export const DAMAGE_TYPES = ['Scuff', 'Scratch', 'Dent', 'Crack', 'Missing part'] as const
export const SEVERITIES = ['Minor', 'Moderate', 'Major'] as const

const DAMAGE_RATES: Record<string, [number, number, number]> = {
  Scuff: [85, 160, 290],
  Scratch: [110, 210, 380],
  Dent: [180, 340, 620],
  Crack: [140, 280, 520],
  'Missing part': [95, 190, 360],
}
export function damageCharge(type: string, severity: string) {
  const i = severity === 'Minor' ? 0 : severity === 'Moderate' ? 1 : 2
  return DAMAGE_RATES[type]?.[i] ?? 0
}
export const FUEL_RATE_PER_LITRE = 1.85
export const REFUEL_SERVICE = 15
export const EXCESS_KM_RATE = 0.18
export const TANK_LITRES: Record<VehicleType, number> = {
  'panel-van': 80,
  'high-roof-van': 80,
  'fridge-van': 75,
  luton: 80,
  'rigid-box': 200,
  'tail-lift': 200,
  'curtain-sider': 300,
  'fridge-rigid': 250,
  tipper: 300,
  tractor: 600,
}

export const PLACES: Record<string, { lat: number; lon: number }> = {
  Naas: { lat: 53.2159, lon: -6.6669 },
  Ballycoolin: { lat: 53.4055, lon: -6.3597 },
  Douglas: { lat: 51.8853, lon: -8.4357 },
  Monasterevin: { lat: 53.1405, lon: -7.0656 },
  Dungarvan: { lat: 52.0889, lon: -7.6253 },
  Galway: { lat: 53.2707, lon: -9.0568 },
  Limerick: { lat: 52.6638, lon: -8.6267 },
  Athlone: { lat: 53.4239, lon: -7.9407 },
  Drogheda: { lat: 53.7179, lon: -6.3561 },
  Waterford: { lat: 52.2593, lon: -7.1101 },
  Sligo: { lat: 54.2766, lon: -8.4761 },
  Portlaoise: { lat: 53.0344, lon: -7.2998 },
  Mallow: { lat: 52.1345, lon: -8.6454 },
  Wexford: { lat: 52.3369, lon: -6.4633 },
  Kilkenny: { lat: 52.6541, lon: -7.2448 },
  Tralee: { lat: 52.2713, lon: -9.6999 },
  Letterkenny: { lat: 54.9503, lon: -7.7334 },
  Dundalk: { lat: 54.0, lon: -6.4167 },
  Swords: { lat: 53.4597, lon: -6.2181 },
  Enniscorthy: { lat: 52.5008, lon: -6.5578 },
  Mullingar: { lat: 53.5259, lon: -7.3381 },
  Ennis: { lat: 52.8436, lon: -8.9864 },
  Cavan: { lat: 53.9908, lon: -7.3606 },
  Carlow: { lat: 52.8408, lon: -6.9261 },
  Clonmel: { lat: 52.355, lon: -7.7039 },
  Tullamore: { lat: 53.2739, lon: -7.4889 },
  Castlebar: { lat: 53.8547, lon: -9.2988 },
  Bandon: { lat: 51.746, lon: -8.7425 },
  Midleton: { lat: 51.9153, lon: -8.1755 },
  Blanchardstown: { lat: 53.3881, lon: -6.3775 },
  Tallaght: { lat: 53.2859, lon: -6.3733 },
  Navan: { lat: 53.6528, lon: -6.6814 },
  Newbridge: { lat: 53.1819, lon: -6.7967 },
  Arklow: { lat: 52.7978, lon: -6.1599 },
  Fermoy: { lat: 52.1386, lon: -8.2756 },
}
