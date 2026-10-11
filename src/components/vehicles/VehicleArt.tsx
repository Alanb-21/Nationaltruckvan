import { useId } from 'react'
import type { VehicleType } from '@/data/types'

/**
 * One family of side-profile vehicle illustrations.
 * Shared rules: viewBox 280x120, ground at y=104, wheel r=13 at y=91,
 * cab faces right, same body gradient, glass, livery band and wheel.
 */

const C = {
  glass: '#13233d',
  glassHi: '#3a5478',
  dark: '#18233a',
  darker: '#0c1424',
  trim: '#2a3752',
  line: 'rgba(8,18,36,0.38)',
  navy: '#0b2550',
  yellow: '#FFCD00',
  head: '#fff4cc',
  tail: '#e2685e',
}

type Ids = { body: string; glass: string; shade: string; shadow: string }

function Wheel({ x, ids, dual }: { x: number; ids: Ids; dual?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={91} r={13} fill={C.darker} />
      <circle cx={x} cy={91} r={12.2} fill="none" stroke="#1e2a42" strokeWidth={1.2} />
      <circle cx={x} cy={91} r={7.4} fill={`url(#${ids.shade})`} />
      <circle cx={x} cy={91} r={7.4} fill="none" stroke="#7e8ba0" strokeWidth={0.6} />
      {dual && <circle cx={x} cy={91} r={5.2} fill="none" stroke="#6b788e" strokeWidth={0.8} />}
      <circle cx={x} cy={91} r={2.4} fill="#4d5a70" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 4.6} cy={91 + Math.sin((a * Math.PI) / 180) * 4.6} r={0.75} fill="#4d5a70" />
      ))}
    </g>
  )
}

/** Dark wheel arch cut into the body above the wheel */
function Arch({ x, bottom = 92, r = 16.5 }: { x: number; bottom?: number; r?: number }) {
  return <path d={`M ${x - r} ${bottom} A ${r} ${r} 0 0 1 ${x + r} ${bottom} Z`} fill={C.darker} />
}

/** Mudguard arc over a truck's rear wheel (box bodies sit above, no arch) */
function Guard({ x }: { x: number }) {
  return (
    <g>
      <path d={`M ${x - 16.5} 89 A 16.5 16.5 0 0 1 ${x + 16.5} 89`} fill="none" stroke={C.dark} strokeWidth={6} />
      <path d={`M ${x - 18.8} 89 A 18.8 18.8 0 0 1 ${x + 18.8} 89`} fill="none" stroke="#2f3d5a" strokeWidth={1.2} />
    </g>
  )
}

function Defs({ ids }: { ids: Ids }) {
  return (
    <defs>
      <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f7fb" />
        <stop offset="0.55" stopColor="#e3e9f1" />
        <stop offset="1" stopColor="#c3cddb" />
      </linearGradient>
      <linearGradient id={ids.glass} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={C.glassHi} />
        <stop offset="0.45" stopColor={C.glass} />
        <stop offset="1" stopColor="#0d1a2f" />
      </linearGradient>
      <radialGradient id={ids.shade} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#dfe5ee" />
        <stop offset="1" stopColor="#8d99ad" />
      </radialGradient>
      <radialGradient id={ids.shadow} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.55" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Shadow({ ids, x1 = 16, x2 = 262 }: { ids: Ids; x1?: number; x2?: number }) {
  return <ellipse cx={(x1 + x2) / 2} cy={104.5} rx={(x2 - x1) / 2 + 8} ry={5} fill={`url(#${ids.shadow})`} />
}

/* ---------- van front (Transit-style), used by vans and luton ---------- */
function VanCab({ ids, roofY, x0 }: { ids: Ids; roofY: number; x0: number }) {
  // x0 = where the cab door begins. Nose ends at 252.
  return (
    <g>
      {/* side window */}
      <path d={`M ${x0 + 4} ${roofY + 7} L ${x0 + 23} ${roofY + 7} Q ${x0 + 27} ${roofY + 7} ${x0 + 30} ${roofY + 11} L ${x0 + 45} 58 L ${x0 + 4} 58 Z`} fill={`url(#${ids.glass})`} />
      <path d={`M ${x0 + 8} ${roofY + 10} L ${x0 + 17} ${roofY + 10} L ${x0 + 9} 54 L ${x0 + 7} 54 Z`} fill="#fff" opacity={0.07} />
      {/* door shut line and handle */}
      <path d={`M ${x0} ${roofY + 4} L ${x0} 90 M ${x0} 90 L ${x0 + 40} 90`} stroke={C.line} strokeWidth={1} fill="none" />
      <rect x={x0 + 6} y={63} width={9} height={2.4} rx={1.2} fill={C.trim} />
      {/* mirror */}
      <path d={`M ${x0 + 41} 48 l 6 -1 q 2 0 2 2 l 0 8 q 0 2 -2 2 l -5 0 z`} fill={C.dark} />
      {/* headlight + indicator */}
      <path d="M 240 66 L 249 68 Q 251 69 250.5 71 L 249.5 73 L 239 71.5 Z" fill={C.head} />
      <rect x={244} y={74} width={6} height={2} rx={1} fill={C.yellow} opacity={0.85} />
      {/* grille and bumper */}
      <path d="M 246 76 L 252 77 L 252 82 L 246 82 Z" fill={C.dark} />
      <path d="M 232 84 L 251 84 Q 254 84 254 87 L 254 90 Q 254 93 251 93 L 232 93 Z" fill={C.trim} />
    </g>
  )
}

function vanBodyPath(rear: number, roofY: number, cabTurn: number) {
  // rear: x of back; roofY: top of load box; cabTurn: x where roof meets windscreen
  return `M ${rear} 92 L ${rear} ${roofY + 10} Q ${rear} ${roofY} ${rear + 10} ${roofY} L ${cabTurn - 12} ${roofY} Q ${cabTurn} ${roofY} ${cabTurn + 5} ${roofY + 9} L 226 58 Q 248 61 251 72 L 253 86 Q 253 92 247 92 Z`
}

function Livery({ x1, x2, y = 72 }: { x1: number; x2: number; y?: number }) {
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={6} fill={C.navy} />
      <rect x={x1} y={y + 6} width={x2 - x1} height={2} fill={C.yellow} />
    </g>
  )
}

function TailLight({ x, y = 62, h = 14 }: { x: number; y?: number; h?: number }) {
  return <rect x={x} y={y} width={3.4} height={h} rx={1.2} fill={C.tail} />
}

function PanelVan({ ids, roofY = 30, rear = 30, fridge = false }: { ids: Ids; roofY?: number; rear?: number; fridge?: boolean }) {
  const x0 = 180
  return (
    <g>
      <Shadow ids={ids} x1={rear} x2={254} />
      <path d={vanBodyPath(rear, roofY, x0 + 6)} fill={`url(#${ids.body})`} />
      {/* roof highlight */}
      <path d={`M ${rear + 8} ${roofY + 1.2} L ${x0} ${roofY + 1.2}`} stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} />
      <Livery x1={rear} x2={252} />
      {/* rear door and sliding door lines */}
      <path d={`M ${rear + 6} ${roofY + 4} L ${rear + 6} 90 M ${x0 - 52} ${roofY + 5} L ${x0 - 52} 90 M ${x0 - 4} ${roofY + 5} L ${x0 - 4} 90`} stroke={C.line} strokeWidth={1} />
      <path d={`M ${x0 - 52} ${roofY + 5} L ${x0 - 4} ${roofY + 5}`} stroke={C.line} strokeWidth={0.8} />
      <rect x={x0 - 48} y={63} width={9} height={2.4} rx={1.2} fill={C.trim} />
      {/* rub strip */}
      <rect x={rear + 2} y={84} width={226 - rear} height={8} fill={C.trim} opacity={0.9} />
      <TailLight x={rear - 0.4} y={roofY + 30} />
      <VanCab ids={ids} roofY={roofY < 24 ? 26 : roofY} x0={x0} />
      {fridge && (
        <g>
          <rect x={136} y={roofY - 9} width={44} height={10} rx={3} fill="#dfe6ef" />
          <rect x={136} y={roofY - 9} width={44} height={10} rx={3} fill="none" stroke={C.line} strokeWidth={0.8} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={142 + i * 5} y={roofY - 6.5} width={2.2} height={5} rx={1} fill={C.dark} opacity={0.75} />
          ))}
          <rect x={rear + 10} y={roofY + 12} width={18} height={5} rx={2} fill="#9fb4cf" opacity={0.55} />
        </g>
      )}
      <Arch x={70} />
      <Arch x={214} />
      <Wheel x={70} ids={ids} />
      <Wheel x={214} ids={ids} />
    </g>
  )
}

function Luton({ ids }: { ids: Ids }) {
  return (
    <g>
      <Shadow ids={ids} x1={14} x2={254} />
      {/* chassis under box */}
      <rect x={18} y={84} width={170} height={8} fill={C.dark} />
      {/* cab */}
      <path d="M 180 92 L 180 40 L 196 40 Q 204 40 208 47 L 226 60 Q 248 63 251 73 L 253 86 Q 253 92 247 92 Z" fill={`url(#${ids.body})`} />
      <VanCab ids={ids} roofY={34} x0={182} />
      <rect x={182} y={84} width={46} height={8} fill={C.trim} opacity={0.9} />
      {/* box with luton peak */}
      <path d="M 14 84 L 14 20 Q 14 12 22 12 L 212 12 Q 222 12 222 20 L 222 30 Q 222 37 214 37.5 L 186 40 L 186 84 Z" fill={`url(#${ids.body})`} />
      <path d="M 22 13.4 L 212 13.4" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} />
      <path d="M 186 40 L 214 37.5" stroke={C.line} strokeWidth={0.8} />
      <Livery x1={14} x2={186} y={70} />
      <Livery x1={186} x2={252} y={72} />
      <path d="M 20 14 L 20 82" stroke={C.line} strokeWidth={1} />
      <rect x={14} y={80} width={172} height={4} fill={C.trim} />
      <TailLight x={13.6} y={60} />
      <Arch x={62} bottom={92} />
      <Arch x={214} />
      <Wheel x={62} ids={ids} dual />
      <Wheel x={214} ids={ids} />
    </g>
  )
}

/* ---------- cab-over truck cab, shared by all rigids ---------- */
function TruckCab({ ids, x0 = 198, roofY = 20, sleeper = false }: { ids: Ids; x0?: number; roofY?: number; sleeper?: boolean }) {
  const nose = 256
  return (
    <g>
      <path d={`M ${x0} 92 L ${x0} ${roofY + 8} Q ${x0} ${roofY} ${x0 + 8} ${roofY} L ${nose - 12} ${roofY} Q ${nose - 3} ${roofY} ${nose - 2} ${roofY + 10} L ${nose} 86 Q ${nose} 92 ${nose - 6} 92 Z`} fill={`url(#${ids.body})`} />
      <path d={`M ${x0 + 8} ${roofY + 1.2} L ${nose - 12} ${roofY + 1.2}`} stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} />
      {sleeper && (
        <g>
          <path d={`M ${x0 + 4} ${roofY} L ${x0 + 10} ${roofY - 12} Q ${x0 + 12} ${roofY - 15} ${x0 + 17} ${roofY - 15} L ${nose - 14} ${roofY - 15} Q ${nose - 6} ${roofY - 15} ${nose - 5} ${roofY - 8} L ${nose - 4} ${roofY} Z`} fill={`url(#${ids.body})`} />
          <path d={`M ${x0 + 6} ${roofY} L ${nose - 4} ${roofY}`} stroke={C.line} strokeWidth={0.8} />
        </g>
      )}
      {/* door window */}
      <path d={`M ${x0 + 9} ${roofY + 9} L ${nose - 18} ${roofY + 9} Q ${nose - 9} ${roofY + 9} ${nose - 8} ${roofY + 17} L ${nose - 7} 54 L ${x0 + 9} 54 Z`} fill={`url(#${ids.glass})`} />
      <path d={`M ${x0 + 14} ${roofY + 12} L ${x0 + 24} ${roofY + 12} L ${x0 + 15} 51 L ${x0 + 13} 51 Z`} fill="#fff" opacity={0.07} />
      {/* door outline */}
      <path d={`M ${x0 + 5} ${roofY + 5} L ${x0 + 5} 78 Q ${x0 + 5} 82 ${x0 + 9} 82 L ${nose - 10} 82`} stroke={C.line} strokeWidth={1} fill="none" />
      <rect x={x0 + 10} y={60} width={9} height={2.4} rx={1.2} fill={C.trim} />
      {/* steps */}
      <rect x={x0 + 8} y={84} width={16} height={3} rx={1} fill={C.trim} />
      {/* mirror arm */}
      <path d={`M ${nose - 3} 40 L ${nose + 4} 38 L ${nose + 4} 56 Q ${nose + 4} 58 ${nose + 2} 58 L ${nose} 58 L ${nose} 42`} fill={C.dark} />
      {/* front: grille, light, bumper */}
      <rect x={nose - 3.5} y={58} width={3.5} height={18} rx={1} fill={C.dark} />
      <path d={`M ${nose - 5} 77 L ${nose + 0.5} 77 L ${nose + 0.5} 82 L ${nose - 5} 82 Z`} fill={C.head} />
      <path d={`M ${nose - 16} 84 L ${nose} 84 Q ${nose + 2} 84 ${nose + 2} 86 L ${nose + 2} 91 Q ${nose + 2} 93 ${nose} 93 L ${nose - 16} 93 Z`} fill={C.trim} />
      <Livery x1={x0} x2={nose} y={65} />
    </g>
  )
}

function Chassis({ x1, x2, guard }: { x1: number; x2: number; guard?: [number, number] }) {
  return (
    <g>
      <rect x={x1} y={78} width={x2 - x1} height={12} fill={C.dark} />
      {guard && <rect x={guard[0]} y={93} width={guard[1] - guard[0]} height={2.6} rx={1.3} fill={C.trim} />}
    </g>
  )
}

function Tank({ x, w = 26 }: { x: number; w?: number }) {
  return (
    <g>
      <rect x={x} y={85} width={w} height={11} rx={3} fill="#3a4866" />
      <rect x={x + 2} y={86.2} width={w - 4} height={1.4} rx={0.7} fill="#fff" opacity={0.15} />
    </g>
  )
}

function BoxBody({ ids, x1, x2, top = 10, bottom = 78, insulated = false }: { ids: Ids; x1: number; x2: number; top?: number; bottom?: number; insulated?: boolean }) {
  const r = insulated ? 7 : 3.5
  return (
    <g>
      <rect x={x1} y={top} width={x2 - x1} height={bottom - top} rx={r} fill={`url(#${ids.body})`} />
      <path d={`M ${x1 + r} ${top + 1.2} L ${x2 - r} ${top + 1.2}`} stroke="#fff" strokeOpacity={0.65} strokeWidth={1.2} />
      <rect x={x1} y={top} width={x2 - x1} height={4} rx={2} fill={C.trim} opacity={insulated ? 0 : 0.35} />
      <rect x={x1} y={bottom - 5} width={x2 - x1} height={5} rx={insulated ? 3 : 1} fill={C.trim} opacity={0.85} />
      <path d={`M ${x1 + 6} ${top + 4} L ${x1 + 6} ${bottom - 5}`} stroke={C.line} strokeWidth={1} />
      <Livery x1={x1} x2={x2} y={bottom - 13} />
      <TailLight x={x1 - 0.5} y={bottom - 2} h={6} />
    </g>
  )
}

function RigidBox({ ids }: { ids: Ids }) {
  return (
    <g>
      <Shadow ids={ids} x1={14} x2={258} />
      <Chassis x1={20} x2={200} guard={[92, 206]} />
      <Guard x={68} />
      <Tank x={150} />
      <BoxBody ids={ids} x1={16} x2={192} />
      <TruckCab ids={ids} />
      <Arch x={226} />
      <Wheel x={68} ids={ids} dual />
      <Wheel x={226} ids={ids} />
    </g>
  )
}

function TailLift({ ids }: { ids: Ids }) {
  return (
    <g>
      <Shadow ids={ids} x1={6} x2={258} />
      <Chassis x1={20} x2={200} guard={[92, 206]} />
      <Guard x={72} />
      <Tank x={150} />
      <BoxBody ids={ids} x1={22} x2={192} />
      {/* folded tail-lift platform */}
      <rect x={20} y={78} width={10} height={12} fill={C.dark} />
      <rect x={9} y={26} width={10} height={64} rx={2} fill="#cfd7e2" />
      <rect x={9} y={26} width={10} height={64} rx={2} fill="none" stroke={C.line} strokeWidth={0.9} />
      {[38, 50, 62, 74].map((y) => (
        <rect key={y} x={11} y={y} width={6} height={1.4} rx={0.7} fill={C.line} />
      ))}
      <path d="M 9 28 l 10 0 l 0 5 l -10 0 z" fill={C.tail} opacity={0.9} />
      <path d="M 9 30.5 l 10 0" stroke="#fff" strokeWidth={1} opacity={0.9} />
      <path d="M 16 90 L 26 90 L 26 96 L 16 96 Z" fill={C.trim} />
      <circle cx={21} cy={92} r={1.6} fill="#7e8ba0" />
      <TruckCab ids={ids} />
      <Arch x={226} />
      <Wheel x={72} ids={ids} dual />
      <Wheel x={226} ids={ids} />
    </g>
  )
}

function CurtainSider({ ids }: { ids: Ids }) {
  const x1 = 12
  const x2 = 192
  return (
    <g>
      <Shadow ids={ids} x1={10} x2={258} />
      <Chassis x1={16} x2={200} guard={[106, 206]} />
      <Guard x={52} />
      <Guard x={82} />
      <Tank x={156} w={24} />
      {/* frame */}
      <rect x={x1} y={10} width={x2 - x1} height={68} rx={3} fill="#d9e0ea" />
      {/* curtain folds */}
      <rect x={x1 + 4} y={16} width={x2 - x1 - 8} height={53} fill={`url(#${ids.body})`} />
      {Array.from({ length: 22 }, (_, i) => (
        <path key={i} d={`M ${x1 + 9 + i * 8} 16 Q ${x1 + 10.5 + i * 8} 42 ${x1 + 9 + i * 8} 69`} stroke={C.line} strokeWidth={0.6} fill="none" opacity={0.7} />
      ))}
      <path d={`M ${x1 + 3} 11.2 L ${x2 - 3} 11.2`} stroke="#fff" strokeOpacity={0.65} strokeWidth={1.2} />
      <rect x={x1} y={10} width={x2 - x1} height={6} rx={2} fill={C.trim} opacity={0.4} />
      <Livery x1={x1 + 4} x2={x2 - 4} y={55} />
      {/* straps and buckles */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={x1 + 18 + i * 22} y={63} width={2.2} height={10} fill={C.dark} />
          <rect x={x1 + 16.6 + i * 22} y={69} width={5} height={3.4} rx={0.8} fill="#7e8ba0" />
        </g>
      ))}
      <rect x={x1} y={72} width={x2 - x1} height={6} rx={1} fill={C.trim} />
      <TailLight x={x1 - 0.5} y={72} h={6} />
      <TruckCab ids={ids} />
      <Arch x={226} />
      <Wheel x={52} ids={ids} dual />
      <Wheel x={82} ids={ids} dual />
      <Wheel x={226} ids={ids} />
    </g>
  )
}

function FridgeRigid({ ids }: { ids: Ids }) {
  return (
    <g>
      <Shadow ids={ids} x1={14} x2={258} />
      <Chassis x1={20} x2={200} guard={[92, 206]} />
      <Guard x={68} />
      <Tank x={150} />
      <BoxBody ids={ids} x1={16} x2={190} top={8} insulated />
      {/* door seal hint */}
      <path d="M 26 14 L 26 76" stroke={C.line} strokeWidth={0.8} />
      {/* fridge unit on the headboard */}
      <path d="M 186 9 L 206 9 Q 212 9 212 15 L 212 34 Q 212 40 206 40 L 186 40 Z" fill="#dfe6ef" />
      <path d="M 186 9 L 206 9 Q 212 9 212 15 L 212 34 Q 212 40 206 40 L 186 40" fill="none" stroke={C.line} strokeWidth={0.9} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={194} y={14 + i * 5} width={13} height={2} rx={1} fill={C.dark} opacity={0.75} />
      ))}
      <rect x={189} y={14} width={3} height={22} rx={1.5} fill={C.navy} opacity={0.85} />
      <TruckCab ids={ids} roofY={22} />
      <Arch x={226} />
      <Wheel x={68} ids={ids} dual />
      <Wheel x={226} ids={ids} />
    </g>
  )
}

function Tipper({ ids }: { ids: Ids }) {
  return (
    <g>
      <Shadow ids={ids} x1={12} x2={258} />
      <Chassis x1={16} x2={200} />
      <Guard x={54} />
      <Guard x={84} />
      {/* ram */}
      <rect x={186} y={40} width={7} height={40} rx={2} fill={C.trim} />
      <rect x={187.5} y={46} width={4} height={30} rx={1.5} fill="#8d99ad" />
      {/* body */}
      <path d="M 14 32 L 184 32 L 184 78 L 32 78 Q 18 78 15 66 Z" fill={`url(#${ids.body})`} />
      <rect x={14} y={30} width={170} height={5} rx={1.5} fill={C.trim} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={36 + i * 22} y={35} width={3} height={43} fill={C.line} opacity={0.75} />
      ))}
      <path d="M 14 32 L 15 66" stroke={C.line} strokeWidth={1.2} />
      <Livery x1={30} x2={184} y={65} />
      <path d="M 184 30 L 196 22 L 198 26 L 186 36 Z" fill={C.trim} />
      <TailLight x={18} y={73} h={5} />
      <TruckCab ids={ids} roofY={24} />
      <Arch x={204} r={16} />
      <Arch x={234} r={16} />
      <Wheel x={54} ids={ids} dual />
      <Wheel x={84} ids={ids} dual />
      <Wheel x={204} ids={ids} />
      <Wheel x={234} ids={ids} />
    </g>
  )
}

function Tractor({ ids }: { ids: Ids }) {
  // shifted left so the shorter unit sits centred
  return (
    <g transform="translate(-34 0)">
      <Shadow ids={ids} x1={82} x2={262} />
      <rect x={84} y={80} width={124} height={10} fill={C.dark} />
      {/* fifth wheel */}
      <path d="M 108 74 L 146 74 Q 150 74 150 78 L 150 80 L 104 80 L 104 78 Q 104 74 108 74 Z" fill="#3a4866" />
      <rect x={112} y={71} width={30} height={3} rx={1.5} fill="#56637c" />
      {/* catwalk + air lines */}
      <path d="M 196 50 Q 176 52 170 74" stroke={C.yellow} strokeWidth={1.2} fill="none" opacity={0.5} />
      <path d="M 196 54 Q 180 56 174 74" stroke={C.tail} strokeWidth={1.2} fill="none" opacity={0.5} />
      {/* mudguards */}
      <Tank x={168} w={28} />
      <TruckCab ids={ids} x0={198} roofY={26} sleeper />
      <Arch x={232} />
      <Wheel x={119} ids={ids} dual />
      <Wheel x={149} ids={ids} dual />
      <rect x={101} y={72.5} width={66} height={4} rx={2} fill={C.dark} />
      <rect x={101} y={72.5} width={66} height={1.2} rx={0.6} fill="#3a4866" />
      <Wheel x={232} ids={ids} />
      <rect x={84} y={78} width={4} height={12} rx={1} fill={C.tail} />
    </g>
  )
}

export function VehicleArt({ type, className, title }: { type: VehicleType; className?: string; title?: string }) {
  const uid = useId().replace(/:/g, '')
  const ids: Ids = { body: `b${uid}`, glass: `g${uid}`, shade: `s${uid}`, shadow: `h${uid}` }
  return (
    <svg viewBox="0 0 280 120" className={className} role="img" aria-label={title ?? type}>
      <Defs ids={ids} />
      {type === 'panel-van' && <PanelVan ids={ids} />}
      {type === 'high-roof-van' && <PanelVan ids={ids} roofY={16} rear={22} />}
      {type === 'fridge-van' && <PanelVan ids={ids} roofY={20} rear={24} fridge />}
      {type === 'luton' && <Luton ids={ids} />}
      {type === 'rigid-box' && <RigidBox ids={ids} />}
      {type === 'tail-lift' && <TailLift ids={ids} />}
      {type === 'curtain-sider' && <CurtainSider ids={ids} />}
      {type === 'fridge-rigid' && <FridgeRigid ids={ids} />}
      {type === 'tipper' && <Tipper ids={ids} />}
      {type === 'tractor' && <Tractor ids={ids} />}
    </svg>
  )
}

/** Small rounded tile with the vehicle, for list rows */
export function VehicleThumb({ type, className }: { type: VehicleType; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-b from-white/[0.07] to-white/[0.02] ring-1 ring-inset ring-white/[0.06] ${className ?? 'h-11 w-14'}`}>
      <VehicleArt type={type} className="w-[128%] max-w-none translate-y-[4%]" />
    </div>
  )
}
