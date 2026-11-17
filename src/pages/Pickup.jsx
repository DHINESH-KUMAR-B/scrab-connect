import { useState } from 'react'
import { motion } from 'framer-motion'
import { Glass, useToast } from '../components/ui'
import { CATEGORIES, recognizeScrap } from '../lib/ai'
import { configured, db } from '../lib/firebase'
import { addDoc, collection } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { saveDemoPickup } from '../data/mock'
import { MapPicker } from '../components/MapWidgets'

const today = new Date()
const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

export default function Pickup() {
  const { user } = useAuth(), toast = useToast()
  const [f, setF] = useState({ type: 'Paper', weight: 5, address: '', date: '', time: '10:00' }), [ai, setAi] = useState(null), [busy, setBusy] = useState(false), [done, setDone] = useState(null), [location, setLocation] = useState(null)
  const est = Math.round(Number(f.weight) * CATEGORIES[f.type])
  const onFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const result = await recognizeScrap(file)
      setAi(result)
      setF(value => ({ ...value, type: result.category }))
      toast(`AI suggestion: ${result.category} (${Math.round(result.confidence * 100)}%)`)
    } catch (error) {
      console.error('Scrap image recognition failed.', error)
      toast(error.message || 'Unable to analyze this image.')
    } finally { setBusy(false) }
  }
  const submit = async e => {
    e.preventDefault()
    if (!location) {
      toast('Select the pickup point on the map or use your current location.')
      return
    }
    setBusy(true)
    const pickup = {
      userId: user.id,
      collectorId: null,
      scrapType: f.type,
      weight: Number(f.weight),
      status: 'scheduled',
      price: est,
      address: f.address.trim(),
      area: f.address.trim(),
      date: f.date,
      time: f.time,
      lat: location[0],
      lng: location[1],
      createdAt: new Date().toISOString()
    }
    try {
      if (configured) {
        const reference = await addDoc(collection(db, 'pickups'), pickup)
        setDone({ ...pickup, id: reference.id })
      } else {
        const saved = saveDemoPickup({ ...pickup, id: `P-${Date.now()}` })
        setDone(saved)
      }
      toast('Pickup booked')
    } catch (error) {
      console.error('Unable to book the pickup.', error)
      toast(error.message || 'Unable to book your pickup. Please try again.')
    } finally { setBusy(false) }
  }
  if (done) return <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Glass className="mx-auto max-w-md text-center"><h1 className="text-2xl font-bold">Pickup confirmed</h1><p className="mt-2">{done.scrapType}, about {done.weight} kg on {done.date} at {done.time}.</p><p className="mt-1 opacity-75">Estimated payout ₹{done.price}. A verified collector will be assigned shortly; nearby requests may be batched to keep the visit on time.</p></Glass></motion.div>
  return (<Glass className="mx-auto max-w-xl"><h1 className="mb-4 text-2xl font-bold">Book a pickup</h1>
    <form onSubmit={submit} className="space-y-4">
      <div role="radiogroup" aria-label="Scrap category" className="grid grid-cols-2 gap-2 sm:grid-cols-3">      {Object.entries(CATEGORIES).map(([c, p]) => <button type="button" role="radio" aria-checked={f.type === c} key={c} onClick={() => setF({ ...f, type: c })} className={`rounded-xl border px-3 py-2 text-sm ${f.type === c ? 'border-leaf-400 bg-leaf-500/20' : 'border-white/10'}`}>{c}<br/><span className="opacity-60">₹{p}/kg est.</span></button>)}</div>
      <label className="block text-sm font-medium">AI product finder
        <span className="mt-1 block text-xs font-normal opacity-70">Upload a clear photo. The on-device image model suggests a scrap category; confirm it before booking.</span>
        <input type="file" accept="image/*" onChange={onFile} className="input mt-2"/>
      </label>
      {busy && <p role="status" className="text-sm">Loading the image model and checking your photo…</p>}
      {ai && <div className="space-y-2 rounded-xl border border-leaf-400/30 bg-leaf-500/10 p-3 text-sm">
        <p className="text-leaf-400">AI suggestion: <strong>{ai.category}</strong> · {Math.round(ai.confidence * 100)}% model confidence · estimated ₹{ai.perKg}/kg</p>
        <p className="text-xs opacity-70">Image label: {ai.label}. Scrap category and prices are estimates; please verify before booking.</p>
        {ai.alternatives.length > 1 && <div className="flex flex-wrap gap-2"><span className="self-center text-xs opacity-70">Choose a suggestion:</span>{ai.alternatives.map(category => <button type="button" key={category} onClick={() => setF(value => ({ ...value, type: category }))} className={`rounded-full border px-3 py-1 text-xs ${f.type === category ? 'border-leaf-400 bg-leaf-500/20' : 'border-white/15'}`}>{category}</button>)}</div>}
      </div>}
      <label className="block text-sm">Approx. weight: {f.weight} kg<input type="range" min="1" max="100" value={f.weight} onChange={e => setF({ ...f, weight: e.target.value })} className="w-full"/></label>
      <input required className="input" placeholder="Pickup address" aria-label="Address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })}/>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium" htmlFor="pickup-map">Pickup point</label>
          <button type="button" className="text-sm underline" onClick={() => {
            if (!navigator.geolocation) { toast('Location is not available in this browser. Select a point on the map.'); return }
            navigator.geolocation.getCurrentPosition(
              position => setLocation([position.coords.latitude, position.coords.longitude]),
              error => toast(error.code === error.PERMISSION_DENIED
                ? 'Location permission was denied. Select a point on the map instead.'
                : 'Unable to get your location. Select a point on the map instead.')
            )
          }}>Use my location</button>
        </div>
        <div id="pickup-map"><MapPicker location={location} onSelect={setLocation}/></div>
      </div>
      <div className="grid grid-cols-2 gap-2"><input required type="date" min={minDate} className="input" aria-label="Date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })}/><input required type="time" className="input" aria-label="Time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })}/></div>
      <p className="text-lg font-semibold">Estimated payout: ₹{est}</p><button disabled={busy} className="btn w-full disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : 'Confirm pickup'}</button></form></Glass>)
}
