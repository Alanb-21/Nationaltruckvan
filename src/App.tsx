import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AppShell } from '@/components/shell/AppShell'
import { Toaster } from '@/components/ui'
import Today from '@/screens/ops/Today'
import Fleet from '@/screens/ops/Fleet'
import VehicleDetail from '@/screens/ops/VehicleDetail'
import Compliance from '@/screens/ops/Compliance'
import Workshop from '@/screens/ops/Workshop'
import Live from '@/screens/ops/Live'
import Returns from '@/screens/ops/Returns'
import InboxScreen from '@/screens/ops/Inbox'
import DriverApp from '@/screens/driver/DriverApp'
import Portal from '@/screens/customer/Portal'
import { Welcome } from '@/tour/Welcome'
import { TourHost } from '@/tour/TourHost'
import { useDemo } from '@/store'
import { useTour } from '@/tour/tourStore'

const Insights = lazy(() => import('@/screens/ops/Insights'))
const ArtGallery = lazy(() => import('@/screens/qa/ArtGallery'))

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function FirstLoad() {
  const welcomeSeen = useDemo((s) => s.welcomeSeen)
  const showWelcome = useTour((s) => s.showWelcome)
  useEffect(() => {
    if (!welcomeSeen) showWelcome(true)
  }, [welcomeSeen, showWelcome])
  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <div className="ambient">
          <i />
        </div>
        <ScrollReset />
        <FirstLoad />
        <Routes>
          <Route path="/__art" element={<Suspense fallback={null}><ArtGallery /></Suspense>} />
          <Route
            path="*"
            element={
              <AppShell>
                <Suspense fallback={<div className="p-8 text-muted">Loading</div>}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/today" replace />} />
                    <Route path="/today" element={<Today />} />
                    <Route path="/fleet" element={<Fleet />} />
                    <Route path="/fleet/:id" element={<VehicleDetail />} />
                    <Route path="/compliance" element={<Compliance />} />
                    <Route path="/workshop" element={<Workshop />} />
                    <Route path="/live" element={<Live />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/returns/:id" element={<Returns />} />
                    <Route path="/inbox" element={<InboxScreen />} />
                    <Route path="/inbox/:id" element={<InboxScreen />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/driver" element={<DriverApp />} />
                    <Route path="/portal/*" element={<Portal />} />
                    <Route path="*" element={<Navigate to="/today" replace />} />
                  </Routes>
                </Suspense>
              </AppShell>
            }
          />
        </Routes>
        <Welcome />
        <TourHost />
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  )
}
