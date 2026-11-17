import { useEffect, useMemo, useState } from 'react'
import { Glass, StatCard, Grid, Skeleton } from '../components/ui'
import { pickups as samplePickups, monthly, getDemoPickups } from '../data/mock'
import { batchPickups, optimizeRoute } from '../lib/ai'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { PickupMap } from '../components/MapWidgets'
import { useAuth } from '../context/AuthContext'
import { configured, db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

const START = { lat: 13.0475, lng: 80.209 }

export default function Collector() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [start, setStart] = useState(START)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    let active = true
    async function loadJobs() {
      try {
        if (configured) {
          const result = await getDocs(query(collection(db, 'pickups'), where('collectorId', '==', user.id)))
          if (active) setJobs(result.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })))
        } else {
          const demoJobs = [...samplePickups.filter(pickup => pickup.status === 'scheduled'), ...getDemoPickups()]
          if (active) setJobs(demoJobs)
        }
      } catch (error) {
        console.error('Unable to load collector pickups.', error)
        if (active) setLoadError(error.message || 'Unable to load collector pickups.')
      } finally {
        if (active) setLoaded(true)
      }
    }
    if (user) loadJobs()
    return () => { active = false }
  }, [user])

  const scheduled = useMemo(
    () => jobs.filter(pickup => pickup.status === 'scheduled' && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)),
    [jobs]
  )
  const matching = useMemo(
    () => scheduled.filter(pickup => `${pickup.address || pickup.area || ''} ${pickup.scrapType || ''} ${pickup.id || ''}`.toLowerCase().includes(search.toLowerCase())),
    [scheduled, search]
  )
  const route = useMemo(() => optimizeRoute(matching, start), [matching, start])
  const batches = batchPickups(matching)
  const completed = jobs.filter(pickup => pickup.status === 'completed')
  const earned = completed.reduce((sum, pickup) => sum + Number(pickup.price || 0), 0)
  const selected = matching.find(pickup => pickup.id === selectedId)
  const mapStops = selected ? [selected, ...route.filter(pickup => pickup.id !== selected.id)] : route

  if (!loaded) return <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i}/>)}</Grid>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Collector route</h1>
        <p className="mt-1 text-sm opacity-70">See scheduled pickup locations and follow an optimized stop order.</p>
      </div>
      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{loadError}</p>}
      <Grid>
        <StatCard label="Scheduled pickups" value={scheduled.length}/>
        <StatCard label="Earned from completed pickups" value={`₹${earned}`}/>
        <StatCard label="Rating" value="4.8" unit="/5"/>
        <StatCard label="Trips saved by batching" value={batches.reduce((sum, batch) => sum + batch.list.length - 1, 0)}/>
      </Grid>
      <div className="grid gap-4 lg:grid-cols-3">
        <Glass className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold">Pickup map</h2><p className="text-xs opacity-70">Pins show the scheduled stops in your route.</p></div>
            <button type="button" className="text-sm underline" onClick={() => {
              if (!navigator.geolocation) { setLoadError('Location is not available in this browser. The route will start from Chennai.'); return }
              navigator.geolocation.getCurrentPosition(
                position => {
                  setStart({ lat: position.coords.latitude, lng: position.coords.longitude })
                  setLoadError('')
                },
                error => setLoadError(error.code === error.PERMISSION_DENIED
                  ? 'Location permission was denied. The route will start from Chennai.'
                  : 'Unable to get your location. The route will start from Chennai.')
              )
            }}>Start route from my location</button>
          </div>
          {route.length
            ? <PickupMap pickups={mapStops} route onSelect={pickup => setSelectedId(pickup.id)}/>
            : <p className="rounded-xl bg-white/5 p-4 text-sm opacity-75">No scheduled pickup locations found for this route.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <input className="input min-w-48 flex-1" placeholder="Search address, scrap or ID" aria-label="Search pickup stops" value={search} onChange={event => setSearch(event.target.value)}/>
            {selected && <button className="text-sm underline" onClick={() => setSelectedId('')}>Clear selected stop</button>}
          </div>
          <ol className="mt-3 space-y-2">
            {route.map((pickup, index) => (
              <li key={pickup.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm ${selectedId === pickup.id ? 'border-leaf-400 bg-leaf-500/10' : 'border-white/10'}`}>
                <button className="text-left" onClick={() => setSelectedId(pickup.id)}>
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-leaf-500 text-xs font-bold text-emerald-950">{index + 1}</span>
                  {pickup.address || pickup.area || 'Pickup'} · {pickup.scrapType} · {pickup.weight} kg · {pickup.date}
                </button>
                <a className="underline" href={`https://www.openstreetmap.org/?mlat=${pickup.lat}&mlon=${pickup.lng}#map=16/${pickup.lat}/${pickup.lng}`} target="_blank" rel="noreferrer">Directions</a>
              </li>
            ))}
            {!route.length && <li className="text-sm opacity-70">No stops match this search.</li>}
          </ol>
          {batches.map(batch => <p key={batch.area} className="mt-3 rounded-xl bg-leaf-500/15 p-3 text-sm">Batch: {batch.list.length} pickups in {batch.area} ({batch.kg} kg). Saves about ₹{batch.saved} in transport.</p>)}
        </Glass>
        <Glass>
          <h2 className="mb-2 font-semibold">Earnings</h2>
          <div className="h-48"><ResponsiveContainer><BarChart data={monthly}><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="revenue" fill="#22c55e" radius={6}/></BarChart></ResponsiveContainer></div>
          <p className="mt-2 text-xs opacity-70">Chart uses demo monthly figures.</p>
        </Glass>
      </div>
      <Glass>
        <h2 className="mb-2 font-semibold">Completed pickups</h2>
        {completed.length
          ? completed.map(pickup => <div key={pickup.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2 text-sm"><span>{pickup.date} · {pickup.address || pickup.area}</span><span>{pickup.scrapType} {pickup.weight} kg</span><span>₹{pickup.price}</span></div>)
          : <p className="text-sm opacity-70">Completed collections will appear here.</p>}
      </Glass>
    </div>
  )
}
