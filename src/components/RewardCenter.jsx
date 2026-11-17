import { useState } from 'react'
import { Glass, useToast } from './ui'

const offers = [
  {
    id: 'green50',
    title: 'Green start cashback',
    detail: 'Get ₹50 off your next pickup when you recycle 5 kg this month.',
    requirement: 5,
    code: 'GREEN50',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
    alt: 'Recyclable materials sorted for collection'
  },
  {
    id: 'circle150',
    title: 'Circular champion reward',
    detail: 'Unlock ₹150 off your next pickup after recycling 25 kg this month.',
    requirement: 25,
    code: 'CIRCLE150',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80',
    alt: 'Green landscape representing environmental impact'
  }
]

function readStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch (error) {
    console.error('Unable to read saved reward settings.', error)
    return fallback
  }
}

export default function RewardCenter({ userId, monthlyKg }) {
  const toast = useToast()
  const month = new Date().toISOString().slice(0, 7)
  const goalKey = `scrap-monthly-goal:${userId}:${month}`
  const claimsKey = `scrap-reward-claims:${userId}:${month}`
  const [goal, setGoal] = useState(() => {
    const saved = Number(readStoredValue(goalKey, 50))
    return Number.isFinite(saved) && saved >= 10 && saved <= 200 ? saved : 50
  })
  const [claimed, setClaimed] = useState(() => {
    try {
      const saved = readStoredValue(claimsKey, '{}')
      const parsed = JSON.parse(saved)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch (error) {
      console.error('Unable to restore reward claims.', error)
      return {}
    }
  })
  const [storageError, setStorageError] = useState('')
  const progress = Math.min(100, Math.round((monthlyKg / goal) * 100))

  const updateGoal = event => {
    const nextGoal = Number(event.target.value)
    try {
      localStorage.setItem(goalKey, String(nextGoal))
      setGoal(nextGoal)
      setStorageError('')
    } catch (error) {
      console.error('Unable to save the monthly recycling goal.', error)
      setStorageError('Could not save your goal in this browser. Check storage settings and try again.')
    }
  }

  const claim = offer => {
    if (monthlyKg < offer.requirement || claimed[offer.id]) return
    const nextClaims = { ...claimed, [offer.id]: offer.code }
    try {
      localStorage.setItem(claimsKey, JSON.stringify(nextClaims))
      setClaimed(nextClaims)
      setStorageError('')
      toast(`Reward unlocked: ${offer.code}`)
    } catch (error) {
      console.error('Unable to save this reward claim.', error)
      setStorageError('Could not save your reward. Check storage settings and try again.')
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="rewards-heading">
      <div>
        <h2 id="rewards-heading" className="text-xl font-bold">Monthly goals & rewards</h2>
        <p className="mt-1 text-sm opacity-70">Earn more by recycling. Rewards are demo vouchers until payments are connected.</p>
      </div>
      {storageError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{storageError}</p>}
      <Glass>
        <div className="grid gap-5 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="relative min-h-48 overflow-hidden rounded-xl">
            <img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80" alt="Green landscape representing this month's recycling goal" loading="lazy"/>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent"/>
            <div className="absolute bottom-4 left-4 text-white"><p className="text-sm font-semibold">Your monthly challenge</p><p className="text-2xl font-extrabold">{monthlyKg} / {goal} kg</p></div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Recycle {goal} kg this month</h3><span className="text-sm font-semibold text-leaf-400">{progress}%</span></div>
            <div className="my-3 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Monthly recycling goal progress" aria-valuenow={Math.min(monthlyKg, goal)} aria-valuemin={0} aria-valuemax={goal}>
              <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${progress}%` }}/>
            </div>
            <p className="text-sm opacity-75">{monthlyKg >= goal ? 'Goal reached — great work!' : `${Math.max(0, goal - monthlyKg)} kg left to reach your goal.`}</p>
            <label className="mt-5 block text-sm" htmlFor="monthly-goal">Set your goal: {goal} kg</label>
            <input id="monthly-goal" className="mt-2 w-full accent-green-500" type="range" min="10" max="200" step="5" value={goal} onChange={updateGoal}/>
            <div className="flex justify-between text-xs opacity-60"><span>10 kg</span><span>200 kg</span></div>
          </div>
        </div>
      </Glass>
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map(offer => {
          const eligible = monthlyKg >= offer.requirement
          const code = claimed[offer.id]
          return (
            <article key={offer.id} className="glass overflow-hidden">
              <div className="relative h-40">
                <img className="h-full w-full object-cover" src={offer.image} alt={offer.alt} loading="lazy"/>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent"/>
                <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-emerald-950">{offer.requirement}+ kg this month</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold">{offer.title}</h3>
                <p className="mt-1 text-sm opacity-75">{offer.detail}</p>
                {code
                  ? <p className="mt-4 rounded-lg bg-leaf-500/15 p-3 text-sm">Your demo voucher: <strong className="select-all">{code}</strong></p>
                  : <button className="btn mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={!eligible} onClick={() => claim(offer)}>
                    {eligible ? 'Claim reward' : `Recycle ${Math.max(0, offer.requirement - monthlyKg)} more kg to unlock`}
                  </button>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
