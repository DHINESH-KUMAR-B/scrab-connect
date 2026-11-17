import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Glass, StatCard, Grid, Skeleton } from '../components/ui'
import { pickups, badges, levels, users, getDemoPickups } from '../data/mock'
import { impact } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import { configured, db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { PickupMap } from '../components/MapWidgets'
import RewardCenter from '../components/RewardCenter'

export default function UserDashboard() {
  const { user } = useAuth()
  const [mine, setMine] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    async function loadPickups() {
      try {
        if (configured) {
          const result = await getDocs(query(collection(db, 'pickups'), where('userId', '==', user.id)))
          if (active) setMine(result.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })))
        } else {
          const sample = user.id.startsWith('demo-') ? pickups.filter(pickup => pickup.userId === 'u1') : []
          if (active) setMine([...sample, ...getDemoPickups().filter(pickup => pickup.userId === user.id)])
        }
      } catch (error) {
        console.error('Unable to load your pickups.', error)
        if (active) setLoadError(error.message || 'Unable to load your pickups.')
      } finally {
        if (active) setLoaded(true)
      }
    }
    if (user) loadPickups()
    return () => { active = false }
  }, [user])

  if (!loaded) return <Grid>{[...Array(8)].map((_, i) => <Skeleton key={i}/>)}</Grid>

  const completed = mine.filter(pickup => pickup.status === 'completed')
  const kg = completed.reduce((sum, pickup) => sum + Number(pickup.weight || 0), 0)
  const earned = mine.filter(pickup => pickup.status === 'completed').reduce((sum, pickup) => sum + Number(pickup.price || 0), 0)
  const pts = user.greenPoints ?? (user.id.startsWith('demo-') ? 1240 : 0)
  const im = impact(kg)
  const date = new Date()
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const monthlyKg = completed
    .filter(pickup => String(pickup.date || '').startsWith(month))
    .reduce((sum, pickup) => sum + Number(pickup.weight || 0), 0)
  const lvl = [...levels].reverse().find(level => pts >= level.min) || levels[0]
  const next = levels[levels.indexOf(lvl) + 1]
  const upcoming = mine.filter(pickup => pickup.status === 'scheduled' && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Your impact</h1><p className="mt-1 text-sm opacity-70">Track your pickups and see where your next collection is scheduled.</p></div>
        <Link className="btn" to="/pickup">Book a pickup</Link>
      </div>
      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{loadError}</p>}
      <Grid>
        <StatCard label="Scrap recycled" value={kg} unit="kg"/>
        <StatCard label="Money earned" value={`₹${earned}`}/>
        <StatCard label="Green points" value={pts}/>
        <StatCard label="Trees saved" value={im.trees}/>
        <StatCard label="CO₂ reduced" value={im.co2} unit="kg"/>
        <StatCard label="Water conserved" value={im.water} unit="L"/>
        <StatCard label="Energy preserved" value={im.energy} unit="kWh"/>
        <StatCard label="Kept from landfill" value={im.landfill} unit="kg"/>
      </Grid>
      <RewardCenter key={user.id} userId={user.id} monthlyKg={monthlyKg}/>
      <div className="grid gap-4 lg:grid-cols-3">
        <Glass className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Upcoming pickup map</h2>
            <span className="text-xs opacity-70">{upcoming.length} scheduled stop{upcoming.length === 1 ? '' : 's'}</span>
          </div>
          {upcoming.length
            ? <PickupMap pickups={upcoming}/>
            : <p className="rounded-xl bg-white/5 p-4 text-sm opacity-75">No scheduled pickup locations yet. Book a pickup and pin its location on the map.</p>}
        </Glass>
        <Glass>
          <h2 className="font-semibold">Level: {lvl.n}</h2>
          <div className="my-2 h-2 rounded bg-white/10"><div className="h-2 rounded bg-leaf-500" style={{ width: next ? `${Math.min(100, ((pts - lvl.min) / (next.min - lvl.min)) * 100)}%` : '100%' }}/></div>
          <p className="text-xs opacity-70">{next ? `${Math.max(0, next.min - pts)} points to ${next.n}` : 'Top level reached'}</p>
          <h3 className="mt-4 font-semibold">Badges</h3>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">{badges.map(badge => <li key={badge.n} className={`rounded-full px-3 py-1 ${badge.on ? 'bg-leaf-500 text-emerald-950' : 'bg-white/10 opacity-60'}`}>{badge.n}</li>)}</ul>
          <h3 className="mt-4 font-semibold">Leaderboard</h3>
          <ol className="mt-2 text-sm">{[...users].sort((a, b) => b.greenPoints - a.greenPoints).map((person, i) => <li key={person.id} className="flex justify-between py-0.5"><span>{i + 1}. {person.name}</span><span>{person.greenPoints}</span></li>)}</ol>
        </Glass>
      </div>
      <Glass>
        <h2 className="mb-3 font-semibold">Pickup history</h2>
        {mine.length
          ? mine.map(pickup => (
            <div key={pickup.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-3 text-sm">
              <span>{pickup.scrapType} · {pickup.weight} kg · {pickup.address || pickup.area}</span>
              <span>{pickup.date} · <span className="capitalize">{pickup.status}</span></span>
              <span>₹{pickup.price}</span>
              {Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng) && <a className="underline" href={`https://www.openstreetmap.org/?mlat=${pickup.lat}&mlon=${pickup.lng}#map=16/${pickup.lat}/${pickup.lng}`} target="_blank" rel="noreferrer">View map</a>}
            </div>
          ))
          : <p className="text-sm opacity-70">Your pickups will appear here after you book one.</p>}
      </Glass>
    </div>
  )
}
