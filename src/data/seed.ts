import type {
  Breakdown,
  ComplianceBooking,
  ComplianceKind,
  ComplianceRecord,
  Customer,
  CustomerNotice,
  DamageMark,
  Depot,
  FeedItem,
  Job,
  JobStage,
  MobileTech,
  Person,
  Recharge,
  ReturnCheck,
  Swap,
  Thread,
  Vehicle,
  VehicleType,
  VorEpisode,
} from './types'
import { PLACES, damageCharge, isFridge, isHGV, TANK_LITRES, FUEL_RATE_PER_LITRE, REFUEL_SERVICE, EXCESS_KM_RATE } from './catalog'
import { NOW, at, dayOffset, minutesFromNow } from '@/lib/time'

// ---------- deterministic random ----------
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SEED = 20251011
let rnd = mulberry32(SEED)
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
function weighted<T>(items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) {
    r -= w
    if (r <= 0) return v
  }
  return items[items.length - 1][0]
}

// ---------- fixed cast ----------
export const MARTIN: Person = { id: 'p-martin', name: 'Martin Brannock', role: 'Head of Fleet Operations' }

export const STAFF: Person[] = [
  { id: 'p-declan', name: 'Declan Furlong', role: 'Workshop Manager', depot: 'Dublin' },
  { id: 'p-siobhan', name: 'Siobhán Twomey', role: 'Workshop Manager', depot: 'Cork' },
  { id: 'p-aoife', name: 'Aoife Kinsella', role: 'Hire Desk', depot: 'Dublin' },
  { id: 'p-ronan', name: 'Ronan Healy', role: 'Hire Desk', depot: 'Dublin' },
  { id: 'p-maeve', name: 'Maeve Desmond', role: 'Hire Desk', depot: 'Cork' },
]

export const TECHNICIANS: Person[] = [
  { id: 't-gary', name: 'Gary Doyle', role: 'HGV Technician', depot: 'Dublin' },
  { id: 't-paul', name: 'Paul Byrne', role: 'HGV Technician', depot: 'Dublin' },
  { id: 't-niall', name: 'Niall Kavanagh', role: 'Fridge Technician', depot: 'Dublin' },
  { id: 't-tomasz', name: 'Tomasz Nowak', role: 'HGV Technician', depot: 'Dublin' },
  { id: 't-eoin', name: 'Eoin Fitzgerald', role: 'Tail-lift Technician', depot: 'Dublin' },
  { id: 't-lukas', name: 'Lukas Petrauskas', role: 'LCV Technician', depot: 'Dublin' },
  { id: 't-shane', name: 'Shane Dunne', role: 'LCV Technician', depot: 'Dublin' },
  { id: 't-colm', name: "Colm O'Sullivan", role: 'HGV Technician', depot: 'Cork' },
  { id: 't-donal', name: 'Donal Murphy', role: 'HGV Technician', depot: 'Cork' },
  { id: 't-kieran', name: 'Kieran Cronin', role: 'Fridge Technician', depot: 'Cork' },
  { id: 't-piotr', name: 'Piotr Zieliński', role: 'LCV Technician', depot: 'Cork' },
  { id: 't-fergal', name: 'Fergal Lynch', role: 'Tail-lift Technician', depot: 'Cork' },
]

export const MOBILE_TECHS: MobileTech[] = [
  { id: 'm-barry', name: 'Barry Nolan', role: 'Mobile Technician', depot: 'Dublin', job: 'Tail-lift repair', place: 'Blanchardstown' },
  { id: 'm-alan', name: 'Alan Cullen', role: 'Mobile Technician', depot: 'Dublin', job: 'Tyre change', place: 'Swords' },
  { id: 'm-mark', name: 'Mark Behan', role: 'Mobile Technician', depot: 'Dublin', job: 'Fridge alarm callout', place: 'Navan' },
  { id: 'm-jimmy', name: 'Jimmy Coughlan', role: 'Mobile Technician', depot: 'Cork', job: 'On-site service', place: 'Mallow' },
]

export const TOUR = {
  driverVehicleId: 'v-0000',
  replacementId: 'v-0001',
  returnVanId: 'v-0002',
  returnId: 'r-tour',
  slaneyId: 'c-slaney',
  driverName: 'Darren Kehoe',
  site: 'Naas',
}

// ---------- customers ----------
type Sector = 'Pharma logistics' | 'Food distribution' | 'Parcels' | 'Retail' | 'Building supplies' | 'Haulage' | 'Facilities'
const CUSTOMER_DEFS: [string, string, Sector, string, string, string][] = [
  ['c-slaney', 'Slaney Pharma Logistics', 'Pharma logistics', 'Naas', 'Clodagh Byrne', 'Fleet Manager'],
  ['c-ferrycarrig', 'Ferrycarrig Foods', 'Food distribution', 'Wexford', 'Seán Rossiter', 'Transport Manager'],
  ['c-midland', 'Midland Parcel Co.', 'Parcels', 'Athlone', 'Gráinne Fallon', 'Operations Manager'],
  ['c-barrow', 'Barrow Valley Builders Supplies', 'Building supplies', 'Carlow', 'Pat Nolan', 'Yard Manager'],
  ['c-liffey', 'Liffey Cash & Carry', 'Retail', 'Blanchardstown', 'Derek Moran', 'Logistics Manager'],
  ['c-atlantic', 'Atlantic Seafoods Distribution', 'Food distribution', 'Galway', 'Niamh Conneely', 'Fleet Coordinator'],
  ['c-shannonside', 'Shannonside Dairies', 'Food distribution', 'Limerick', 'Brendan Hayes', 'Transport Manager'],
  ['c-boyne', 'Boyne Fresh Produce', 'Food distribution', 'Drogheda', 'Orla Duffy', 'Fleet Manager'],
  ['c-corrib', 'Corrib Medical Supplies', 'Pharma logistics', 'Galway', 'Kevin Walsh', 'Distribution Manager'],
  ['c-leevalley', 'Lee Valley Bakeries', 'Food distribution', 'Mallow', 'Máire Buckley', 'Transport Manager'],
  ['c-suir', 'Suir Logistics', 'Haulage', 'Waterford', 'John Power', 'Managing Director'],
  ['c-knockmealdown', 'Knockmealdown Cold Chain', 'Food distribution', 'Clonmel', 'Eileen Ryan', 'Fleet Manager'],
  ['c-northside', 'Northside Parcel Express', 'Parcels', 'Swords', 'Stephen Carroll', 'Depot Manager'],
  ['c-kingdom', 'Kingdom Building Providers', 'Building supplies', 'Tralee', 'Donncha Moriarty', 'Operations Manager'],
  ['c-burren', 'Burren Wholesale', 'Retail', 'Ennis', 'Aisling Clancy', 'Logistics Lead'],
  ['c-wicklow', 'Wicklow Hills Water', 'Food distribution', 'Arklow', 'Colin Byrne', 'Transport Manager'],
  ['c-mourne', 'Mourne View Haulage', 'Haulage', 'Dundalk', 'Gerard McArdle', 'Transport Manager'],
  ['c-comeragh', 'Comeragh Meats', 'Food distribution', 'Clonmel', 'Tadhg Keating', 'Fleet Manager'],
  ['c-erne', 'Erne Pharma Distribution', 'Pharma logistics', 'Cavan', 'Louise Brady', 'Quality and Fleet Lead'],
  ['c-midleton', 'Midleton Packaging', 'Facilities', 'Midleton', 'Rory Ahern', 'Site Manager'],
  ['c-tullamore', 'Tullamore Office Supplies', 'Retail', 'Tullamore', 'Fiona Dolan', 'Distribution Manager'],
  ['c-mayo', 'Mayo Agri Supplies', 'Building supplies', 'Castlebar', 'Pádraig Gallagher', 'Branch Manager'],
  ['c-bandon', 'Bandon Valley Foods', 'Food distribution', 'Bandon', 'Siobhán Hurley', 'Transport Manager'],
  ['c-royalcanal', 'Royal Canal Furniture', 'Retail', 'Mullingar', 'Declan Shaw', 'Logistics Manager'],
  ['c-kilkenny', 'Nore Craft Brewers', 'Food distribution', 'Kilkenny', 'Ciara Brennan', 'Operations Lead'],
  ['c-bloom', 'Slieve Bloom Event Hire', 'Facilities', 'Portlaoise', 'Liam Dunne', 'Operations Manager'],
  ['c-swilly', 'Swilly Freight', 'Haulage', 'Letterkenny', 'Martina McGinley', 'Transport Manager'],
  ['c-tallaght', 'Tallaght Trade Centre', 'Building supplies', 'Tallaght', 'Keith Murray', 'Yard Manager'],
  ['c-navan', 'Navan Road Electrical Wholesale', 'Building supplies', 'Navan', 'Alan Reilly', 'Logistics Manager'],
  ['c-blackwater', 'Blackwater Veterinary Supplies', 'Pharma logistics', 'Fermoy', 'Nora Barry', 'Distribution Lead'],
  ['c-ox', 'Ox Mountain Logistics', 'Haulage', 'Sligo', 'Eamon Feeney', 'Managing Director'],
  ['c-newbridge', 'Newbridge Home Store', 'Retail', 'Newbridge', 'Sinéad Kelly', 'Store Operations'],
  ['c-harbour', 'Harbour Fresh Fish', 'Food distribution', 'Dungarvan', 'Mícheál Curran', 'Owner'],
  ['c-leinster', 'Leinster Linen Services', 'Facilities', 'Carlow', 'Paula Doyle', 'Fleet Coordinator'],
  ['c-fastnet', 'Fastnet Clinical Couriers', 'Pharma logistics', 'Swords', 'Ruth Hennessy', 'Operations Manager'],
  ['c-brosna', 'Brosna Timber Products', 'Building supplies', 'Tullamore', 'Joe Egan', 'Transport Manager'],
  ['c-westlink', 'Westlink Retail Distribution', 'Retail', 'Blanchardstown', 'Mark Kinsella', 'Fleet Manager'],
  ['c-rebel', 'Rebel City Parcels', 'Parcels', 'Douglas', 'Dave Twomey', 'Depot Manager'],
  ['c-southern', 'Southern Chill Distribution', 'Food distribution', 'Mallow', 'Áine Sheehan', 'Fleet Manager'],
  ['c-deise', 'Déise Builders Merchants', 'Building supplies', 'Waterford', 'Tom Flynn', 'Yard Manager'],
]

const SECTOR_PREF: Record<Sector, Partial<Record<VehicleType, number>>> = {
  'Pharma logistics': { 'fridge-van': 6, 'fridge-rigid': 6, 'panel-van': 2, 'tail-lift': 1 },
  'Food distribution': { 'fridge-van': 3, 'fridge-rigid': 4, 'tail-lift': 3, 'rigid-box': 2, 'high-roof-van': 1, 'curtain-sider': 1 },
  Parcels: { 'panel-van': 5, 'high-roof-van': 6, luton: 4 },
  Retail: { 'tail-lift': 4, 'rigid-box': 3, luton: 3, 'curtain-sider': 2, 'high-roof-van': 2 },
  'Building supplies': { tipper: 5, 'curtain-sider': 3, 'panel-van': 2, 'rigid-box': 1 },
  Haulage: { tractor: 6, 'curtain-sider': 4, 'rigid-box': 1 },
  Facilities: { 'panel-van': 4, luton: 3, 'high-roof-van': 2, 'tail-lift': 1 },
}

function depotFor(lat: number, lon: number): Depot {
  return lat < 52.45 && lon < -7.4 ? 'Cork' : lat < 52.3 ? 'Cork' : 'Dublin'
}

// ---------- vehicles ----------
const MODELS: Record<VehicleType, [string, string][]> = {
  'panel-van': [['Ford', 'Transit 350 L3H2'], ['Mercedes-Benz', 'Sprinter 314 L2H2'], ['Renault', 'Master MWB'], ['Volkswagen', 'Crafter L3H2']],
  'high-roof-van': [['Ford', 'Transit 350 L4H3'], ['Mercedes-Benz', 'Sprinter 317 L3H3'], ['Renault', 'Master LWB High Roof'], ['Volkswagen', 'Crafter L4H3']],
  'fridge-van': [['Mercedes-Benz', 'Sprinter 316 Chiller'], ['Ford', 'Transit 350 Chiller'], ['Renault', 'Master Chiller'], ['Volkswagen', 'Crafter Chiller']],
  luton: [['Ford', 'Transit Luton'], ['Renault', 'Master Luton'], ['Iveco', 'Daily 35S16 Luton']],
  'rigid-box': [['DAF', 'LF 180 Box'], ['Iveco', 'Eurocargo 120E Box'], ['Renault Trucks', 'D 12 Box'], ['Mercedes-Benz', 'Atego 1224 Box'], ['Volvo', 'FL 250 Box']],
  'tail-lift': [['DAF', 'LF 230 Tail-lift'], ['Iveco', 'Eurocargo 160E Tail-lift'], ['Renault Trucks', 'D 16 Tail-lift'], ['Mercedes-Benz', 'Atego 1530 Tail-lift'], ['Volvo', 'FL 280 Tail-lift']],
  'curtain-sider': [['DAF', 'CF 340 Curtainsider'], ['Volvo', 'FE 320 Curtainsider'], ['Scania', 'P 280 Curtainsider'], ['Mercedes-Benz', 'Antos 2533 Curtainsider']],
  'fridge-rigid': [['DAF', 'LF 230 Fridge'], ['DAF', 'CF 300 Fridge'], ['Volvo', 'FL 280 Fridge'], ['Scania', 'P 280 Fridge'], ['Mercedes-Benz', 'Atego 1530 Fridge']],
  tipper: [['Scania', 'P 410 8x4 Tipper'], ['Volvo', 'FMX 460 Tipper'], ['DAF', 'CF 450 Tipper'], ['Mercedes-Benz', 'Arocs 3240 Tipper'], ['Iveco', 'Daily 70C Dropside']],
  tractor: [['DAF', 'XF 480'], ['Volvo', 'FH 500'], ['Scania', 'R 450'], ['Mercedes-Benz', 'Actros 1845'], ['Renault Trucks', 'T 480']],
}
const FRIDGE_UNITS_VAN = ['Thermo King V-520', 'Carrier Transicold Xarios 350', 'Thermo King V-320']
const FRIDGE_UNITS_RIGID = ['Thermo King T-880R', 'Carrier Transicold Supra 1150', 'Thermo King T-680R', 'Carrier Transicold Supra 950']

const TYPE_WEIGHTS: [VehicleType, number][] = [
  ['panel-van', 22],
  ['high-roof-van', 18],
  ['fridge-van', 7],
  ['luton', 9],
  ['rigid-box', 10],
  ['tail-lift', 10],
  ['curtain-sider', 7],
  ['fridge-rigid', 8],
  ['tipper', 4],
  ['tractor', 5],
]

const usedRegs = new Set<string>()
function makeReg(year: number, depot: Depot) {
  const yy = String(year).slice(2)
  for (;;) {
    const half = rnd() < 0.62 ? 1 : 2
    const county =
      depot === 'Dublin'
        ? weighted([['D', 62], ['KE', 12], ['MH', 10], ['WW', 7], ['L', 5], ['G', 4]] as const)
        : weighted([['C', 76], ['KY', 8], ['W', 7], ['L', 9]] as const)
    const n = county === 'D' ? int(1, 64999) : county === 'C' ? int(1, 29999) : int(1, 9999)
    const reg = `${yy}${half}-${county}-${n}`
    if (!usedRegs.has(reg)) {
      usedRegs.add(reg)
      return reg
    }
  }
}

function kmPerYear(t: VehicleType) {
  if (t === 'tractor') return int(115000, 145000)
  if (t === 'tipper') return int(45000, 70000)
  if (isHGV(t)) return int(60000, 95000)
  return int(32000, 52000)
}

function dueFor(v: Pick<Vehicle, 'type' | 'tailLift' | 'year'>): Vehicle['due'] {
  const due: Vehicle['due'] = { CVRT: dayOffset(int(31, 365)), Tax: dayOffset(int(31, 365)) }
  if (isHGV(v.type)) {
    due['13-week'] = dayOffset(int(31, 91))
    due.Tacho = dayOffset(int(31, 700))
  }
  if (v.tailLift) due['Tail-lift'] = dayOffset(int(31, 182))
  if (isFridge(v.type)) {
    due.Fridge = dayOffset(int(31, 182))
    due.Probe = dayOffset(int(31, 365))
  }
  return due
}

let vIdx = 0
function makeVehicle(opts: Partial<Vehicle> & { type: VehicleType }): Vehicle {
  const idx = vIdx++
  const type = opts.type
  const year = opts.year ?? weighted([[2019, 8], [2020, 10], [2021, 14], [2022, 17], [2023, 19], [2024, 18], [2025, 14]] as const)
  const depot = opts.depot ?? (rnd() < 0.68 ? 'Dublin' : 'Cork')
  const [make, model] = opts.make && opts.model ? [opts.make, opts.model] : pick(MODELS[type])
  const age = Math.max(0.3, NOW.getFullYear() - year + rnd() * 0.8 - 0.4)
  const tailLift = opts.tailLift ?? (type === 'tail-lift' || (type === 'luton' && rnd() < 0.5) || (type === 'fridge-rigid' && rnd() < 0.55))
  const v: Vehicle = {
    id: `v-${String(idx).padStart(4, '0')}`,
    idx,
    reg: opts.reg ?? makeReg(year, depot),
    type,
    make,
    model,
    year,
    depot,
    status: opts.status ?? 'Available',
    odometer: opts.odometer ?? Math.round(age * kmPerYear(type)),
    tailLift,
    fridgeUnit: type === 'fridge-van' ? pick(FRIDGE_UNITS_VAN) : type === 'fridge-rigid' ? pick(FRIDGE_UNITS_RIGID) : undefined,
    due: {},
    nextService: { date: dayOffset(int(5, 120)), km: 0 },
    defects: [],
    customerId: opts.customerId,
    site: opts.site,
  }
  if (opts.reg) usedRegs.add(opts.reg)
  v.due = dueFor(v)
  v.nextService.km = Math.ceil((v.odometer + int(2000, 25000)) / 1000) * 1000
  return v
}

function contractFor(kind: 'Contract hire' | 'Short-term rental', type: VehicleType) {
  const start = kind === 'Contract hire' ? dayOffset(-int(60, 1300)) : dayOffset(-int(2, 20))
  const end = kind === 'Contract hire' ? dayOffset(int(90, 900)) : dayOffset(int(1, 25))
  return {
    kind,
    ref: `${kind === 'Contract hire' ? 'CH' : 'RT'}-${int(10000, 99999)}`,
    start,
    end,
    annualAllowanceKm: kind === 'Contract hire' ? (isHGV(type) ? pick([80000, 100000, 120000]) : pick([40000, 50000, 60000])) : 200 * 365,
  }
}

// ---------- build ----------
export interface Seed {
  vehicles: Vehicle[]
  customers: Customer[]
  jobs: Job[]
  feed: FeedItem[]
  breakdowns: Breakdown[]
  returns: ReturnCheck[]
  recharges: Recharge[]
  threads: Thread[]
  bookings: Record<string, ComplianceBooking>
  notices: CustomerNotice[]
  swaps: Swap[]
  vorHistory: VorEpisode[]
  complianceHistory: ComplianceRecord[]
  rechargeHistory: { month: string; total: number; count: number }[]
}

export function buildSeed(): Seed {
  rnd = mulberry32(SEED)
  usedRegs.clear()
  vIdx = 0

  const customers: Customer[] = CUSTOMER_DEFS.map(([id, name, sector, town, contact, contactRole]) => {
    const p = PLACES[town]
    return { id, name, sector, town, lat: p.lat, lon: p.lon, contact, contactRole, depot: depotFor(p.lat, p.lon) }
  })
  const custById = Object.fromEntries(customers.map((c) => [c.id, c]))
  const custSize: Record<string, number> = Object.fromEntries(customers.map((c) => [c.id, 1 + rnd() * 9]))

  const vehicles: Vehicle[] = []

  // Tour vehicles first so they win ties in matching.
  vehicles.push(
    makeVehicle({ type: 'tail-lift', reg: '221-D-30418', make: 'DAF', model: 'LF 230 Tail-lift', year: 2022, depot: 'Dublin', status: 'On hire', customerId: TOUR.slaneyId, site: TOUR.site, tailLift: true }),
    makeVehicle({ type: 'tail-lift', reg: '232-D-11642', make: 'DAF', model: 'LF 230 Tail-lift', year: 2023, depot: 'Dublin', status: 'Available', tailLift: true }),
    makeVehicle({ type: 'panel-van', reg: '231-D-48213', make: 'Ford', model: 'Transit 350 L3H2', year: 2023, depot: 'Dublin', status: 'On hire', customerId: 'c-midland', site: 'Athlone' }),
  )

  // Slaney Pharma Logistics: 64 vehicles, mostly refrigerated.
  const slaneyMix: [VehicleType, number][] = [['fridge-rigid', 26], ['fridge-van', 18], ['tail-lift', 6], ['rigid-box', 6], ['panel-van', 7]]
  for (const [type, n] of slaneyMix) {
    for (let i = 0; i < n; i++) {
      vehicles.push(makeVehicle({ type, depot: 'Dublin', status: 'On hire', customerId: TOUR.slaneyId, site: rnd() < 0.7 ? 'Naas' : 'Enniscorthy', year: weighted([[2021, 3], [2022, 4], [2023, 5], [2024, 5], [2025, 3]] as const) }))
    }
  }

  const others = customers.filter((c) => c.id !== TOUR.slaneyId)
  while (vehicles.length < 1312) {
    const type = weighted(TYPE_WEIGHTS)
    const r = rnd()
    const status = r < 0.105 ? 'Available' : r < 0.12 ? 'Awaiting collection' : r < 0.136 ? 'Defleet' : 'On hire'
    if (status === 'On hire' || status === 'Awaiting collection') {
      const cust = weighted(others.map((c) => [c, (SECTOR_PREF[c.sector as Sector][type] ?? 0.15) * custSize[c.id]] as const))
      const depot = rnd() < 0.88 ? cust.depot : cust.depot === 'Dublin' ? 'Cork' : 'Dublin'
      vehicles.push(makeVehicle({ type, depot, status, customerId: cust.id, site: cust.town }))
    } else {
      const v = makeVehicle({ type, status, year: status === 'Defleet' ? pick([2019, 2019, 2020]) : undefined })
      vehicles.push(v)
    }
  }
  // Make sure the count is exact even with tour vehicles
  vehicles.length = 1312
  // non-breaking hyphens so a registration never wraps across two lines
  for (const v of vehicles) v.reg = v.reg.replace(/-/g, '\u2011')

  for (const v of vehicles) {
    if (v.status === 'On hire' || v.status === 'Awaiting collection') {
      const kind = v.customerId === TOUR.slaneyId || rnd() < 0.82 ? 'Contract hire' : 'Short-term rental'
      v.contract = contractFor(kind, v.type)
    }
  }
  vehicles[2].contract = { kind: 'Short-term rental', ref: 'RT-48877', start: dayOffset(-9), end: dayOffset(0), annualAllowanceKm: 200 * 365 }

  const byId = (id: string) => vehicles.find((v) => v.id === id)!
  const taken = new Set<string>([TOUR.driverVehicleId, TOUR.replacementId, TOUR.returnVanId])
  function take(pred: (v: Vehicle) => boolean): Vehicle {
    const pool = vehicles.filter((v) => !taken.has(v.id) && pred(v))
    const v = pool[Math.floor(rnd() * pool.length)]
    taken.add(v.id)
    return v
  }
  const onHire = (t?: VehicleType, depot?: Depot, cust?: string) => (v: Vehicle) =>
    v.status === 'On hire' && (!t || v.type === t) && (!depot || v.depot === depot) && (!cust || v.customerId === cust) && (cust ? true : v.customerId !== TOUR.slaneyId)

  // ---------- VOR (9) ----------
  const vorDefs: [VehicleType, Depot, string | undefined, string, string, number, number, boolean][] = [
    ['fridge-rigid', 'Dublin', TOUR.slaneyId, 'Fridge unit compressor failure', 'Dublin workshop', 3, 1, true],
    ['tractor', 'Cork', undefined, 'Gearbox fault, awaiting part', 'Cork workshop', 5, 3, true],
    ['curtain-sider', 'Cork', undefined, 'Accident damage, assessor booked', 'Bodyshop, Limerick', 6, 8, false],
    ['tail-lift', 'Dublin', undefined, 'Tail-lift hydraulic leak', 'Dublin workshop', 1, 0, true],
    ['high-roof-van', 'Dublin', undefined, 'Engine warning, diagnostics', 'Dealer, Galway', 2, 2, false],
    ['rigid-box', 'Cork', undefined, 'Windscreen replacement', 'Cork workshop', 1, 1, true],
    ['tipper', 'Dublin', undefined, 'AdBlue system fault', 'Dealer, Athlone', 4, 2, false],
    ['panel-van', 'Dublin', undefined, 'Brake caliper seized', 'Dublin workshop', 2, 1, true],
    ['luton', 'Dublin', undefined, 'Tyre and wheel damage', 'Roadside, Sligo', 0, 1, false],
  ]
  const vorVehicles: Vehicle[] = []
  const jobs: Job[] = []
  let jobN = 4100
  const nextJobId = () => `J-${jobN++}`
  const swaps: Swap[] = []
  for (const [type, depot, cust, reason, location, daysOff, etaDays, inWorkshop] of vorDefs) {
    const v = take(onHire(type, depot, cust))
    const placeName = location.includes('Dublin') ? 'Ballycoolin' : location.includes('Cork') ? 'Douglas' : location.split(', ')[1]
    const p = PLACES[placeName]
    v.status = 'VOR'
    v.vor = {
      reason,
      location,
      lat: p.lat,
      lon: p.lon,
      since: at(int(7, 16), pick([0, 15, 30, 45]), -daysOff),
      eta: etaDays === 0 ? at(16, 0) : at(pick([10, 12, 15, 17]), 0, etaDays),
    }
    vorVehicles.push(v)
    if (inWorkshop) {
      jobs.push({
        id: nextJobId(),
        vehicleId: v.id,
        depot: v.depot,
        stage: 'Awaiting parts',
        title: reason.split(',')[0],
        kind: 'Repair',
        techId: pick(TECHNICIANS.filter((t) => t.depot === v.depot)).id,
        stageSince: v.vor.since,
        createdAt: v.vor.since,
        source: 'Workshop',
      })
    }
  }

  // ---------- workshop jobs ----------
  const KINDS = ['Service A', 'Service B', 'CVRT prep', '13-week inspection', 'Tacho calibration', 'Tail-lift exam', 'Fridge service', 'Tyres', 'Brake reline', 'Diagnostics']
  function kindFor(v: Vehicle) {
    const pool = KINDS.filter((k) => {
      if (k === '13-week inspection' || k === 'Tacho calibration' || k === 'Brake reline') return isHGV(v.type)
      if (k === 'Tail-lift exam') return !!v.tailLift
      if (k === 'Fridge service') return isFridge(v.type)
      return true
    })
    return pick(pool)
  }
  const plan: [Depot, JobStage, number][] = [
    ['Dublin', 'In bay', 7],
    ['Dublin', 'QC', 2],
    ['Dublin', 'Ready', 2],
    ['Dublin', 'Booked', 2],
    ['Cork', 'In bay', 5],
    ['Cork', 'QC', 1],
    ['Cork', 'Ready', 1],
    ['Cork', 'Booked', 4],
  ]
  const baysUsed: Record<Depot, number[]> = { Dublin: [], Cork: [] }
  const techBusy = new Set<string>()
  for (const [depot, stage, n] of plan) {
    for (let i = 0; i < n; i++) {
      const v = take(onHire(undefined, depot))
      const occupies = stage === 'In bay' || stage === 'QC'
      if (stage !== 'Booked') v.status = 'In workshop'
      let bay: number | undefined
      let techId: string | undefined
      if (occupies) {
        const free = Array.from({ length: depot === 'Dublin' ? 12 : 8 }, (_, k) => k + 1).filter((b) => !baysUsed[depot].includes(b))
        bay = free[Math.floor(rnd() * free.length)]
        baysUsed[depot].push(bay)
        const techs = TECHNICIANS.filter((t) => t.depot === depot && !techBusy.has(t.id))
        const t = techs.length ? pick(techs) : pick(TECHNICIANS.filter((x) => x.depot === depot))
        techBusy.add(t.id)
        techId = t.id
      } else if (stage === 'Ready') {
        techId = pick(TECHNICIANS.filter((t) => t.depot === depot)).id
      }
      const kind = kindFor(v)
      const sinceMin = stage === 'Booked' ? 60 * 24 * int(1, 3) : int(20, 300)
      jobs.push({
        id: nextJobId(),
        vehicleId: v.id,
        depot,
        stage,
        title: kind,
        kind,
        techId,
        bay,
        stageSince: minutesFromNow(-sinceMin),
        createdAt: minutesFromNow(-sinceMin - 600),
        bookedFor: stage === 'Booked' ? dayOffset(int(1, 4)) : undefined,
        source: 'Workshop',
      })
    }
  }

  // ---------- compliance window (about 60 items in the next 30 days) ----------
  const windowOffsets = [-3, -1, 0, 1, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6]
  for (let i = 0; i < 22; i++) windowOffsets.push(int(7, 20))
  for (let i = 0; i < 22; i++) windowOffsets.push(int(21, 30))
  const windowItems: { v: Vehicle; kind: ComplianceKind; offset: number }[] = []
  const usedPairs = new Set<string>()
  const kindsOf = (v: Vehicle) => Object.keys(v.due) as ComplianceKind[]
  windowOffsets.forEach((offset, i) => {
    // three Slaney items land this week so their portal shows the bookings later
    const slaney = i === 6 || i === 9 || i === 13 || i === 20 || i === 27
    for (;;) {
      const pool = vehicles.filter(
        (v) => !taken.has(v.id) && v.status !== 'Defleet' && (slaney ? v.customerId === TOUR.slaneyId : v.customerId !== TOUR.slaneyId && (v.status === 'On hire' || rnd() < 0.08)),
      )
      const v = pool[Math.floor(rnd() * pool.length)]
      const kinds = kindsOf(v)
      const nonTax = kinds.filter((k) => k !== 'Tax')
      const weightedKinds = nonTax.flatMap((k) => (k === 'CVRT' ? [k, k] : [k, k, k]))
      const kind = rnd() < 0.12 || !weightedKinds.length ? 'Tax' : pick(weightedKinds)
      const key = `${v.id}:${kind}`
      if (usedPairs.has(key)) continue
      usedPairs.add(key)
      taken.add(v.id)
      v.due[kind] = dayOffset(offset)
      windowItems.push({ v, kind, offset })
      break
    }
  })

  // Pre-booked Slaney items (next 2 weeks) so the customer portal has bookings
  const bookings: Record<string, ComplianceBooking> = {}
  const preBook = windowItems.filter((w) => w.v.customerId === TOUR.slaneyId && w.offset >= 7 && w.kind !== 'Tax')
  const reservedRepl = new Set<string>([TOUR.replacementId])
  for (const w of preBook) {
    const repl = vehicles.find((x) => x.status === 'Available' && x.type === w.v.type && x.depot === 'Dublin' && !reservedRepl.has(x.id))
    if (repl) {
      reservedRepl.add(repl.id)
      repl.reservedFor = w.v.id
    }
    const jobId = nextJobId()
    const bay = int(1, 12)
    jobs.push({
      id: jobId,
      vehicleId: w.v.id,
      depot: 'Dublin',
      stage: 'Booked',
      title: w.kind === 'Probe' ? 'Probe calibration' : w.kind === 'Fridge' ? 'Fridge service' : w.kind === '13-week' ? '13-week inspection' : w.kind,
      kind: 'Compliance',
      stageSince: minutesFromNow(-60 * 24 * 2),
      createdAt: minutesFromNow(-60 * 24 * 2),
      bookedFor: dayOffset(w.offset - 1),
      bay,
      source: 'Compliance',
      replacementId: repl?.id,
    })
    bookings[`${w.v.id}:${w.kind}`] = { itemId: `${w.v.id}:${w.kind}`, date: dayOffset(w.offset - 1), depot: 'Dublin', bay, replacementId: repl?.id, jobId }
  }

  // ---------- breakdowns (2 live) ----------
  const b1v = take(onHire('fridge-rigid', 'Cork'))
  b1v.customerId = 'c-harbour'
  b1v.site = 'Dungarvan'
  const b1repl = vehicles.find((x) => x.status === 'Available' && x.type === 'fridge-rigid' && x.depot === 'Cork' && !x.reservedFor)!
  b1repl.status = 'On hire'
  b1repl.customerId = 'c-harbour'
  b1repl.site = 'Dungarvan'
  b1repl.contract = { kind: 'Short-term rental', ref: 'RT-51120', start: dayOffset(0), end: dayOffset(3), annualAllowanceKm: 73000 }
  const b2v = take(onHire('curtain-sider', 'Dublin'))
  b2v.customerId = 'c-mourne'
  b2v.site = 'Dundalk'
  const breakdowns: Breakdown[] = [
    {
      id: 'b-1',
      vehicleId: b1v.id,
      place: 'N25 near Dungarvan',
      ...PLACES.Dungarvan,
      fault: 'Fridge unit alarm and engine cutting out',
      reportedAt: at(2, 14),
      driver: 'Kevin Foley',
      recovery: { by: 'Déise Commercial Recovery', eta: at(3, 10) },
      replacementId: b1repl.id,
      replacementEta: at(8, 40),
      steps: [
        { step: 'Reported', at: at(2, 14) },
        { step: 'Recovery assigned', at: at(2, 19) },
        { step: 'Replacement matched', at: at(2, 26) },
        { step: 'Customer notified', at: at(2, 31) },
      ],
    },
    {
      id: 'b-2',
      vehicleId: b2v.id,
      place: 'M7 near Monasterevin',
      lat: PLACES.Monasterevin.lat,
      lon: PLACES.Monasterevin.lon,
      fault: 'Air leak, brake warning light on',
      reportedAt: at(7, 18),
      driver: 'Paddy Quinn',
      recovery: { by: 'Kildare Commercial Recovery', eta: at(8, 5) },
      steps: [
        { step: 'Reported', at: at(7, 18) },
        { step: 'Recovery assigned', at: at(7, 21) },
      ],
    },
  ]
  swaps.push({ id: 's-b1', forVehicleId: b1v.id, replacementId: b1repl.id, eta: at(8, 40), place: 'Dungarvan', reason: 'Breakdown', createdAt: at(2, 26) })

  // VOR #1 (Slaney fridge rigid) already has a replacement with the customer
  const vor1 = vorVehicles[0]
  const vor1repl = vehicles.find((x) => x.status === 'Available' && x.type === 'fridge-rigid' && x.depot === 'Dublin' && !x.reservedFor)!
  vor1repl.status = 'On hire'
  vor1repl.customerId = TOUR.slaneyId
  vor1repl.site = vor1.site
  vor1repl.contract = { kind: 'Short-term rental', ref: 'RT-51077', start: dayOffset(-3), end: dayOffset(2), annualAllowanceKm: 73000 }
  swaps.push({ id: 's-vor1', forVehicleId: vor1.id, replacementId: vor1repl.id, eta: at(15, 20, -3), place: vor1.site ?? 'Naas', reason: 'Off road', createdAt: at(13, 5, -3) })

  // ---------- returns (6 waiting) ----------
  const mark = (zone: string, type: DamageMark['type'], severity: DamageMark['severity'], side: DamageMark['side'] = 'Nearside'): DamageMark => ({
    id: `d-${zone}-${int(100, 999)}`,
    zone,
    side,
    type,
    severity,
  })
  const tourVan = byId(TOUR.returnVanId)
  const returns: ReturnCheck[] = [
    {
      id: TOUR.returnId,
      vehicleId: tourVan.id,
      customerId: 'c-midland',
      returnedAt: at(7, 36),
      hireDays: 9,
      before: [mark('Rear bumper', 'Scratch', 'Minor')],
      after: [],
      fuelOut: 8,
      fuelIn: 6,
      kmOut: tourVan.odometer - 1962,
      kmIn: tourVan.odometer,
      allowanceKm: 1800,
      status: 'Waiting',
    },
  ]
  const retDefs: [VehicleType, string, number, number, number, number][] = [
    ['high-roof-van', 'c-northside', 5, 8, 7, 1100],
    ['luton', 'c-royalcanal', 3, 8, 8, 650],
    ['tail-lift', 'c-liffey', 14, 8, 5, 2800],
    ['panel-van', 'c-bloom', 2, 8, 8, 400],
    ['high-roof-van', 'c-rebel', 7, 8, 4, 1400],
  ]
  for (const [type, cust, days, fo, fi, allowance] of retDefs) {
    const v = take(onHire(type, custById[cust].depot))
    v.customerId = cust
    v.site = custById[cust].town
    v.contract = { kind: 'Short-term rental', ref: `RT-${int(40000, 59999)}`, start: dayOffset(-days), end: dayOffset(0), annualAllowanceKm: 73000 }
    const used = Math.round(allowance * (0.7 + rnd() * 0.38))
    returns.push({
      id: `r-${v.id}`,
      vehicleId: v.id,
      customerId: cust,
      returnedAt: rnd() < 0.5 ? at(int(6, 7), int(0, 59)) : at(int(17, 19), int(0, 59), -1),
      hireDays: days,
      before: rnd() < 0.6 ? [mark(pick(['Front bumper', 'Rear bumper', 'Rear door']), 'Scuff', 'Minor', pick(['Nearside', 'Offside']))] : [],
      after: [],
      fuelOut: fo,
      fuelIn: fi,
      kmOut: v.odometer - used,
      kmIn: v.odometer,
      allowanceKm: allowance,
      status: 'Waiting',
    })
  }
  // the luton came back with a dent reported at drop-off
  returns[2].after = [mark('Rear corner', 'Dent', 'Moderate', 'Offside')]

  // ---------- recharges already raised this month ----------
  const dayOfMonth = NOW.getDate()
  const recharges: Recharge[] = []
  const rcCount = Math.max(6, Math.round(dayOfMonth * 1.1))
  for (let i = 0; i < rcCount; i++) {
    const v = pick(vehicles.filter((x) => x.status === 'On hire' || x.status === 'Available'))
    const lines = []
    if (rnd() < 0.7) {
      const t = pick(['Scuff', 'Scratch', 'Dent', 'Crack'] as const)
      const s = pick(['Minor', 'Minor', 'Moderate', 'Major'] as const)
      lines.push({ label: `${t}, ${pick(['nearside panel', 'rear bumper', 'offside door', 'front bumper', 'rear door'])} (${s.toLowerCase()})`, amount: damageCharge(t, s) })
    }
    if (rnd() < 0.5) {
      const eighths = int(1, 4)
      const litres = (TANK_LITRES[v.type] / 8) * eighths
      lines.push({ label: `Fuel, ${eighths}/8 tank`, amount: Math.round((litres * FUEL_RATE_PER_LITRE + REFUEL_SERVICE) * 100) / 100 })
    }
    if (rnd() < 0.35 || !lines.length) {
      const km = int(60, 900)
      lines.push({ label: `Excess mileage, ${km} km`, amount: Math.round(km * EXCESS_KM_RATE * 100) / 100 })
    }
    const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100
    recharges.push({
      id: `rc-${i}`,
      vehicleId: v.id,
      customerId: v.customerId ?? pick(others).id,
      raisedAt: at(int(9, 17), int(0, 59), -int(1, Math.max(1, dayOfMonth - 1))),
      lines,
      total,
      status: rnd() < 0.7 ? 'Invoiced' : 'Queued for invoicing',
    })
  }
  recharges.sort((a, b) => b.raisedAt.localeCompare(a.raisedAt))

  // ---------- history for insights ----------
  const VOR_REASONS = [
    ['Tyre and wheel damage', 18],
    ['Fridge unit fault', 14],
    ['Tail-lift fault', 12],
    ['Accident damage', 11],
    ['Engine and emissions', 10],
    ['Brakes', 8],
    ['Electrical', 7],
    ['Gearbox and clutch', 5],
    ['Windscreen', 5],
  ] as const
  const vorHistory: VorEpisode[] = []
  for (let w = 12; w >= 1; w--) {
    const n = int(9, 12) - Math.floor((12 - w) / 3)
    for (let i = 0; i < n; i++) {
      vorHistory.push({ vehicleId: pick(vehicles).id, reason: weighted(VOR_REASONS), start: dayOffset(-w * 7 + int(0, 6)), days: Math.max(1, Math.round(1 + rnd() * rnd() * 9)) })
    }
  }

  const complianceHistory: ComplianceRecord[] = []
  const histKinds: ComplianceKind[] = ['CVRT', 'CVRT', '13-week', '13-week', '13-week', 'Tacho', 'Tail-lift', 'Fridge', 'Probe', 'Tax', 'Tax']
  for (let w = 12; w >= 1; w--) {
    const late = w > 8 ? 0.06 : w > 4 ? 0.035 : 0.015
    for (let i = 0; i < int(55, 75); i++) {
      const due = dayOffset(-w * 7 + int(0, 6))
      const isLate = rnd() < late
      const doneOff = isLate ? int(1, 6) : -int(0, 6)
      const d = new Date(due + 'T12:00:00')
      d.setDate(d.getDate() + doneOff)
      complianceHistory.push({ kind: pick(histKinds), due, done: d.toISOString().slice(0, 10) })
    }
  }

  const rechargeHistory: Seed['rechargeHistory'] = []
  for (let m = 5; m >= 1; m--) {
    const d = new Date(NOW)
    d.setDate(1)
    d.setMonth(d.getMonth() - m)
    const count = int(24, 38) + (5 - m) * 2
    let total = 0
    for (let i = 0; i < count; i++) total += 60 + rnd() * rnd() * 700
    rechargeHistory.push({ month: d.toISOString().slice(0, 7), total: Math.round(total), count })
  }

  // ---------- defects already reported ----------
  const mirrorV = take(onHire('rigid-box', 'Dublin'))
  mirrorV.customerId = 'c-boyne'
  mirrorV.site = 'Drogheda'
  mirrorV.defects.push({ id: 'df-mirror', item: 'Mirrors and glass', fault: 'Mirror cracked', severity: 'Safe to drive', reportedAt: at(6, 48), reportedBy: 'Ger Hanlon', note: 'Nearside mirror glass cracked, still usable.', photo: true })
  for (let i = 0; i < 14; i++) {
    const v = take((x) => x.status === 'On hire')
    const item = pick(['Lights', 'Body and load security', 'Tyres and wheels', 'Mirrors and glass'])
    const faults: Record<string, string[]> = {
      Lights: ['Marker light out', 'Indicator out'],
      'Body and load security': ['Panel damage', 'Strap rail damaged'],
      'Tyres and wheels': ['Low tread'],
      'Mirrors and glass': ['Windscreen chip'],
    }
    v.defects.push({ id: `df-${i}`, item, fault: pick(faults[item]), severity: 'Safe to drive', reportedAt: at(int(6, 18), int(0, 59), -int(1, 6)), reportedBy: 'Driver' })
  }

  // ---------- feed ----------
  const overdue = windowItems.filter((w) => w.offset < 0).sort((a, b) => a.offset - b.offset)
  const soon = windowItems.filter((w) => w.offset >= 0 && w.offset <= 2).sort((a, b) => a.offset - b.offset)
  const label = (k: ComplianceKind) => (k === '13-week' ? '13-week inspection' : k === 'Tail-lift' ? 'Tail-lift exam' : k === 'Fridge' ? 'Fridge service' : k === 'Probe' ? 'Probe calibration' : k === 'Tacho' ? 'Tacho calibration' : k === 'Tax' ? 'Motor tax' : 'CVRT')
  const ctxName = (v: Vehicle) => (v.customerId ? custById[v.customerId].name : `${v.depot} depot`)
  const feed: FeedItem[] = [
    { id: 'f-b2', kind: 'breakdown', title: 'Breakdown on the M7 near Monasterevin', context: `${b2v.reg} curtain-sider, ${custById['c-mourne'].name}. Recovery on the way.`, time: at(7, 18), vehicleId: b2v.id, refId: 'b-2' },
    { id: 'f-web1', kind: 'request', title: 'Book a Service', context: 'Ferrycarrig Foods via the website. Next Tuesday or Wednesday.', time: at(7, 31), refId: 't-3' },
    { id: 'f-ret', kind: 'return', title: 'Returned with damage', context: `${byId(returns[2].vehicleId).reg} luton back from ${custById['c-royalcanal'].name}. Dent noted at drop-off.`, time: at(7, 20), vehicleId: returns[2].vehicleId, refId: returns[2].id },
    ...overdue.map((w, i) => ({
      id: `f-od-${i}`,
      kind: 'compliance' as const,
      title: `${label(w.kind)} overdue`,
      context: `${w.v.reg}, ${ctxName(w.v)}. ${-w.offset} day${w.offset === -1 ? '' : 's'} past due.`,
      time: at(6, 0),
      vehicleId: w.v.id,
      refId: `${w.v.id}:${w.kind}`,
    })),
    { id: 'f-mirror', kind: 'defect', title: 'Mirror cracked', context: `${mirrorV.reg}, ${custById['c-boyne'].name}. Safe to drive. Reported by Ger Hanlon.`, time: at(6, 48), vehicleId: mirrorV.id, refId: 'df-mirror' },
    ...soon.map((w, i) => ({
      id: `f-soon-${i}`,
      kind: 'compliance' as const,
      title: `${label(w.kind)} due ${w.offset === 0 ? 'today' : w.offset === 1 ? 'tomorrow' : 'in 2 days'}`,
      context: `${w.v.reg}, ${ctxName(w.v)}. Not booked yet.`,
      time: at(6, 0),
      vehicleId: w.v.id,
      refId: `${w.v.id}:${w.kind}`,
    })),
    { id: 'f-midland', kind: 'message', title: 'Extra vehicles for the November peak', context: 'Midland Parcel Co. wants 4 high-roof vans from 3 Nov.', time: at(5, 40), refId: 't-1' },
    { id: 'f-b1', kind: 'breakdown', title: 'Replacement on the way to Dungarvan', context: `${b1v.reg} fridge rigid, Harbour Fresh Fish. Replacement ${b1repl.reg} due 08:40.`, time: at(2, 31), vehicleId: b1v.id, refId: 'b-1' },
  ]
  feed.sort((a, b) => b.time.localeCompare(a.time))

  // ---------- inbox ----------
  const ferryV = vehicles.find((v) => v.customerId === 'c-ferrycarrig' && v.status === 'On hire')!
  const atlanticV = vehicles.find((v) => v.customerId === 'c-atlantic' && v.status === 'On hire')!
  const threads: Thread[] = [
    {
      id: 't-1', kind: 'Customer', tag: 'Extra vehicles', name: 'Midland Parcel Co.', customerId: 'c-midland', unread: true,
      messages: [{ id: 'm1', from: 'them', at: at(5, 40), text: "Morning Martin. We'll need 4 extra high-roof vans from 3 November through to Christmas for the peak. Can you hold them for us?" }],
    },
    {
      id: 't-2', kind: 'Driver', tag: 'Defect', name: 'Ger Hanlon', customerId: 'c-boyne', vehicleId: mirrorV.id, unread: true,
      messages: [{ id: 'm1', from: 'them', at: at(6, 48), text: `Walkaround on ${mirrorV.reg}. Mirrors and glass: mirror cracked. Safe to drive. Photo attached.` }],
    },
    {
      id: 't-3', kind: 'Website form', tag: 'Book a Service', name: 'Ferrycarrig Foods', customerId: 'c-ferrycarrig', vehicleId: ferryV.id, unread: true,
      messages: [{ id: 'm1', from: 'them', at: at(7, 31), text: `Please book ${ferryV.reg} in for a service next week. Tuesday or Wednesday suits best. Seán Rossiter` }],
    },
    {
      id: 't-6', kind: 'Website form', tag: 'Parts Enquiry', name: 'Liffey Cash & Carry', customerId: 'c-liffey', unread: true,
      messages: [{ id: 'm1', from: 'them', at: at(7, 2), text: 'Do you hold replacement control boxes for the Dhollandia tail-lifts? One of ours has a cracked casing.' }],
    },
    {
      id: 't-7', kind: 'Driver', tag: 'Breakdown', name: 'Paddy Quinn', customerId: 'c-mourne', vehicleId: b2v.id, unread: false,
      messages: [
        { id: 'm1', from: 'them', at: at(7, 18), text: 'Pulled in on the hard shoulder past Monasterevin. Air warning light on and the brakes feel off.' },
        { id: 'm2', from: 'us', at: at(7, 21), text: 'Stay with the truck and keep the hazards on. Kildare Commercial Recovery are on the way, ETA 08:05.' },
      ],
    },
    {
      id: 't-4', kind: 'Website form', tag: 'Tail Lift Inspection', name: 'Barrow Valley Builders Supplies', customerId: 'c-barrow', unread: false,
      messages: [{ id: 'm1', from: 'them', at: at(16, 12, -1), text: 'Two of our tail-lift trucks are due their exam in November. Can we do both on the same day at Ballycoolin?' }],
    },
    {
      id: 't-5', kind: 'Customer', tag: 'Documents', name: 'Slaney Pharma Logistics', customerId: TOUR.slaneyId, unread: false,
      messages: [
        { id: 'm1', from: 'them', at: at(15, 2, -1), text: 'Hi Martin, could you send on the CVRT certs for our fridge rigids ahead of the GDP audit next week? Clodagh' },
        { id: 'm2', from: 'us', at: at(15, 40, -1), text: "No problem Clodagh. They're all in your portal under Documents, and the compliance pack has the lot in one file." },
      ],
    },
    {
      id: 't-8', kind: 'Customer', tag: 'Question', name: 'Atlantic Seafoods Distribution', customerId: 'c-atlantic', vehicleId: atlanticV.id, unread: false,
      messages: [
        { id: 'm1', from: 'them', at: at(17, 20, -1), text: `Is the swap van for ${atlanticV.reg} arriving before 10 tomorrow?` },
        { id: 'm2', from: 'us', at: at(17, 31, -1), text: "Yes, it leaves Ballycoolin at 06:30. You'll have it by 09:15." },
      ],
    },
  ]

  // ---------- customer notices (Slaney) ----------
  const notices: CustomerNotice[] = [
    { id: 'n-vor1', customerId: TOUR.slaneyId, kind: 'replacement', title: `${vor1repl.reg} is covering for ${vor1.reg}`, body: `${vor1.reg} is in the Dublin workshop for a fridge compressor. Back ${new Intl.DateTimeFormat('en-IE', { weekday: 'long' }).format(new Date(vor1.vor!.eta))}.`, at: at(13, 5, -3), vehicleId: vor1.id },
    ...preBook.map((w, i) => ({
      id: `n-pre-${i}`,
      customerId: TOUR.slaneyId,
      kind: 'booking' as const,
      title: `${label(w.kind)} booked for ${w.v.reg}`,
      body: `Ballycoolin, ${new Intl.DateTimeFormat('en-IE', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(dayOffset(w.offset - 1) + 'T12:00:00'))}. Replacement allocated.`,
      at: at(11, 20 + i, -2),
      vehicleId: w.v.id,
    })),
  ]

  return {
    vehicles,
    customers,
    jobs,
    feed,
    breakdowns,
    returns,
    recharges,
    threads,
    bookings,
    notices,
    swaps,
    vorHistory,
    complianceHistory,
    rechargeHistory,
  }
}

// ---------- derived per-vehicle detail (deterministic, not stored) ----------
export interface ServiceRecord {
  date: string
  title: string
  km: number
  depot: Depot
  tech: string
}
export function serviceHistory(v: Vehicle): ServiceRecord[] {
  const r = mulberry32(SEED + v.idx * 7919)
  const out: ServiceRecord[] = []
  const techs = TECHNICIANS.filter((t) => t.depot === v.depot)
  const kinds = ['Service A', 'Service B', 'CVRT', 'Tyres', 'Brake check', ...(isHGV(v.type) ? ['13-week inspection', 'Tacho calibration'] : []), ...(v.tailLift ? ['Tail-lift exam'] : []), ...(isFridge(v.type) ? ['Fridge service', 'Probe calibration'] : [])]
  let km = v.odometer
  let day = -Math.floor(10 + r() * 30)
  for (let i = 0; i < 7; i++) {
    out.push({ date: dayOffset(day), title: kinds[Math.floor(r() * kinds.length)], km: Math.max(1000, Math.round(km / 100) * 100), depot: v.depot, tech: techs[Math.floor(r() * techs.length)].name })
    day -= Math.floor(25 + r() * 70)
    km -= Math.floor((isHGV(v.type) ? 9000 : 4500) + r() * 6000)
    if (km < 2000) break
  }
  return out
}

export function documentsFor(v: Vehicle) {
  const hist = serviceHistory(v)
  const docs = [
    { name: 'CVRT certificate', date: hist.find((h) => h.title === 'CVRT')?.date ?? dayOffset(-200) },
    { name: 'Motor tax disc', date: dayOffset(-120) },
    { name: 'Insurance certificate', date: dayOffset(-60) },
  ]
  if (isHGV(v.type)) docs.push({ name: '13-week inspection report', date: dayOffset(-40) }, { name: 'Tachograph calibration certificate', date: dayOffset(-300) })
  if (v.tailLift) docs.push({ name: 'Tail-lift LOLER examination', date: dayOffset(-90) })
  if (isFridge(v.type)) docs.push({ name: 'Fridge service record', date: dayOffset(-70) }, { name: 'Temperature probe calibration (GDP)', date: dayOffset(-150) })
  return docs
}
