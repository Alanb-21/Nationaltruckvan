import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui'
import { useDemo } from '@/store'
import { useTour } from './tourStore'

export function Welcome() {
  const open = useTour((s) => s.welcome)
  const navigate = useNavigate()
  const close = () => {
    useTour.getState().showWelcome(false)
    useDemo.getState().setWelcomeSeen(true)
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020814]/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            data-tour="welcome"
            className="glass-strong w-full max-w-[460px] rounded-2xl px-8 pb-6 pt-9 text-center"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="flex justify-center">
              <Logo className="h-11" />
            </div>
            <h1 className="mt-8 text-[28px] font-semibold leading-[34px] tracking-tight">Fleet Command for National Truck &amp; Van Rental</h1>
            <p className="mt-3 text-base text-muted">One live view of the whole fleet operation.</p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="lg"
                data-tour="start-tour"
                onClick={() => {
                  close()
                  useTour.getState().start()
                }}
              >
                Start the walkthrough
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  close()
                  navigate('/today')
                }}
              >
                Explore on my own
              </Button>
            </div>
            <div className="mt-7 text-2xs uppercase tracking-[0.14em] text-faint">Prepared by MTMN</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
