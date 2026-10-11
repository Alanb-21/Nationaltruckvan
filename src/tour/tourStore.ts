import { create } from 'zustand'
import { useDemo } from '@/store'

interface TourState {
  active: boolean
  step: number
  busy: boolean
  welcome: boolean
  closing: boolean
  finger: { x: number; y: number; tap: number } | null
  start: () => void
  stop: () => void
  go: (n: number) => void
  setBusy: (b: boolean) => void
  showWelcome: (b: boolean) => void
  setClosing: (b: boolean) => void
  setFinger: (f: { x: number; y: number } | null) => void
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  step: 0,
  busy: false,
  welcome: false,
  closing: false,
  finger: null,
  start: () => {
    // a fresh, seeded morning every time so the script always lines up
    useDemo.getState().resetDemo()
    useDriver.getState().reset()
    set({ active: true, step: 0, welcome: false, closing: false, busy: false, finger: null })
  },
  stop: () => set({ active: false, busy: false, finger: null, closing: false }),
  go: (n) => set({ step: n, finger: null }),
  setBusy: (busy) => set({ busy }),
  showWelcome: (welcome) => set({ welcome }),
  setClosing: (closing) => set({ closing }),
  setFinger: (f) => set({ finger: f ? { ...f, tap: (get().finger?.tap ?? 0) + 1 } : null }),
}))

/** Driver app screen state lives here so the walkthrough can drive it. */
export type DriverScreen = 'scan' | 'scanning' | 'vehicle' | 'walkaround' | 'defect' | 'camera' | 'submitting' | 'done' | 'breakdown'
interface DriverState {
  screen: DriverScreen
  vehicleId: string | null
  answers: Record<string, 'ok' | 'defect'>
  defect: { item: string; fault?: string; severity?: 'Safe to drive' | 'Not safe to drive'; photo?: boolean; note?: string } | null
  breakdownStage: number
  set: (p: Partial<Omit<DriverState, 'set' | 'reset'>>) => void
  reset: () => void
}
const driverInit = { screen: 'scan' as DriverScreen, vehicleId: null, answers: {}, defect: null, breakdownStage: 0 }
export const useDriver = create<DriverState>((set) => ({
  ...driverInit,
  set: (p) => set(p),
  reset: () => set(driverInit),
}))
