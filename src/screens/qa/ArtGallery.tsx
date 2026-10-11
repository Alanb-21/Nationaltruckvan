import { VehicleArt } from '@/components/vehicles/VehicleArt'
import { TYPES, TYPE_LABEL } from '@/data/catalog'

/** Internal QA page: every illustration side by side at the same size. */
export default function ArtGallery() {
  return (
    <div className="relative z-10 grid h-full grid-cols-2 gap-4 overflow-auto p-6 md:grid-cols-3">
      {TYPES.map((t) => (
        <div key={t} className="card rounded-xl p-4">
          <VehicleArt type={t} className="w-full" />
          <div className="mt-2 text-sm text-muted">{TYPE_LABEL[t]}</div>
        </div>
      ))}
    </div>
  )
}
