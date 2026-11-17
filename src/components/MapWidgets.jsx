import { lazy, Suspense } from 'react'

const LazyMapPicker = lazy(() => import('./PickupMap').then(module => ({ default: module.MapPicker })))
const LazyPickupMap = lazy(() => import('./PickupMap').then(module => ({ default: module.PickupMap })))

export function MapPicker(props) {
  return <Suspense fallback={<div className="glass flex h-72 items-center justify-center text-sm opacity-70">Loading map…</div>}><LazyMapPicker {...props}/></Suspense>
}

export function PickupMap(props) {
  return <Suspense fallback={<div className="glass flex h-80 items-center justify-center text-sm opacity-70">Loading map…</div>}><LazyPickupMap {...props}/></Suspense>
}
