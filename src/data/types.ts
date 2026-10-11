export type VehicleType =
  | 'panel-van'
  | 'high-roof-van'
  | 'fridge-van'
  | 'luton'
  | 'rigid-box'
  | 'tail-lift'
  | 'curtain-sider'
  | 'fridge-rigid'
  | 'tipper'
  | 'tractor'

export type Depot = 'Dublin' | 'Cork'

export type VehicleStatus =
  | 'On hire'
  | 'Available'
  | 'In workshop'
  | 'VOR'
  | 'Awaiting collection'
  | 'Defleet'

export type ComplianceKind = 'CVRT' | '13-week' | 'Tacho' | 'Tail-lift' | 'Fridge' | 'Probe' | 'Tax'

export interface Contract {
  kind: 'Contract hire' | 'Short-term rental'
  ref: string
  start: string
  end: string
  annualAllowanceKm: number
}

export interface Defect {
  id: string
  item: string
  fault: string
  severity: 'Safe to drive' | 'Not safe to drive'
  reportedAt: string
  reportedBy: string
  note?: string
  photo?: boolean
  jobId?: string
}

export interface VorInfo {
  reason: string
  location: string
  lat: number
  lon: number
  since: string
  eta: string
}

export interface Vehicle {
  id: string
  idx: number
  reg: string
  type: VehicleType
  make: string
  model: string
  year: number
  depot: Depot
  status: VehicleStatus
  customerId?: string
  site?: string
  contract?: Contract
  odometer: number
  fridgeUnit?: string
  tailLift?: boolean
  due: Partial<Record<ComplianceKind, string>>
  nextService: { date: string; km: number }
  defects: Defect[]
  vor?: VorInfo
  reservedFor?: string
}

export interface Customer {
  id: string
  name: string
  sector: string
  town: string
  lat: number
  lon: number
  contact: string
  contactRole: string
  depot: Depot
}

export interface Person {
  id: string
  name: string
  role: string
  depot?: Depot
}

export interface MobileTech extends Person {
  job: string
  place: string
}

export type JobStage = 'Booked' | 'In bay' | 'Awaiting parts' | 'QC' | 'Ready'

export interface Job {
  id: string
  vehicleId: string
  depot: Depot
  stage: JobStage
  title: string
  kind: string
  techId?: string
  bay?: number
  stageSince: string
  bookedFor?: string
  createdAt: string
  source?: 'Driver app' | 'Compliance' | 'Customer' | 'Workshop' | 'Breakdown'
  replacementId?: string
  isNew?: boolean
}

export type FeedKind = 'defect' | 'breakdown' | 'compliance' | 'return' | 'request' | 'message'

export interface FeedItem {
  id: string
  kind: FeedKind
  title: string
  context: string
  time: string
  vehicleId?: string
  refId?: string
  done?: boolean
  doneLabel?: string
  isNew?: boolean
}

export type BreakdownStep = 'Reported' | 'Recovery assigned' | 'Replacement matched' | 'Customer notified' | 'Back on the road'

export interface Breakdown {
  id: string
  vehicleId: string
  place: string
  lat: number
  lon: number
  fault: string
  reportedAt: string
  driver: string
  recovery?: { by: string; eta: string }
  replacementId?: string
  replacementEta?: string
  steps: { step: BreakdownStep; at: string }[]
}

export interface DamageMark {
  id: string
  zone: string
  side: 'Nearside' | 'Offside'
  type: 'Scuff' | 'Scratch' | 'Dent' | 'Crack' | 'Missing part'
  severity: 'Minor' | 'Moderate' | 'Major'
}

export interface ReturnCheck {
  id: string
  vehicleId: string
  customerId: string
  returnedAt: string
  hireDays: number
  before: DamageMark[]
  after: DamageMark[]
  fuelOut: number
  fuelIn: number
  kmOut: number
  kmIn: number
  allowanceKm: number
  status: 'Waiting' | 'Raised' | 'Clear'
}

export interface RechargeLine {
  label: string
  amount: number
}

export interface Recharge {
  id: string
  vehicleId: string
  customerId: string
  raisedAt: string
  lines: RechargeLine[]
  total: number
  status: 'Queued for invoicing' | 'Invoiced'
}

export interface Message {
  id: string
  from: 'them' | 'us'
  text: string
  at: string
}

export type ThreadKind = 'Customer' | 'Driver' | 'Website form'

export interface Thread {
  id: string
  kind: ThreadKind
  tag: string
  name: string
  customerId?: string
  vehicleId?: string
  messages: Message[]
  unread: boolean
  converted?: string
  isNew?: boolean
}

export interface ComplianceBooking {
  itemId: string
  date: string
  depot: Depot
  bay: number
  replacementId?: string
  jobId: string
}

export interface CustomerNotice {
  id: string
  customerId: string
  title: string
  body: string
  at: string
  kind: 'replacement' | 'booking' | 'request' | 'info'
  vehicleId?: string
  isNew?: boolean
}

export interface Swap {
  id: string
  forVehicleId: string
  replacementId: string
  eta: string
  place: string
  reason: string
  createdAt: string
}

export interface VorEpisode {
  vehicleId: string
  reason: string
  start: string
  days: number
}

export interface ComplianceRecord {
  kind: ComplianceKind
  due: string
  done: string
}
