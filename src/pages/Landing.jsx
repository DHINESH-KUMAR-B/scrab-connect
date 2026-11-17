import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Glass } from '../components/ui'
const features = [
  ['Live price check', 'See the rate per kg for every category before you book. No haggling at the door.'],
  ['Verified collectors', 'Every collector is ID- and vehicle-checked by our admins and rated after each pickup.'],
  ['Small loads welcome', 'Smart batching groups nearby pickups, so even 5 kg is worth a trip.'],
  ['AI scrap scanner', 'Snap a photo. We detect the category and estimate its value.'],
  ['Rewards that last', 'Earn green points, badges and levels with every pickup.'],
  ['Impact tracking', 'Trees saved, CO₂ cut, water and energy preserved.']]
const steps = ['Snap or pick a category', 'Choose a time slot', 'A verified collector arrives', 'Get paid and earn points']
const quotes = [['Priya S.', 'Price was shown upfront and matched the final payout.'], ['GreenCafe', 'Our weekly cardboard pickup is now one tap.'], ['Ravi K., collector', 'Batched routes cut my fuel spend noticeably.']]
export default function Landing() {
  return (<div className="space-y-24">
    <section className="pt-10 text-center"><motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">Your scrap has a price. Know it before the collector arrives.</motion.h1>
      <p className="mx-auto mt-5 max-w-xl opacity-80">Scrap Connect links households, businesses and verified collectors, with transparent rates, on-time pickups and rewards for recycling.</p>
      <div className="mt-8 flex justify-center gap-3"><Link className="btn" to="/login">Book a pickup</Link><Link className="glass px-5 py-2.5" to="/login">Join as collector</Link></div></section>
    <section aria-labelledby="f"><h2 id="f" className="mb-6 text-2xl font-bold">Built to fix what scrap apps get wrong</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(([t, d]) => <Glass key={t}><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm opacity-75">{d}</p></Glass>)}</div></section>
    <section aria-labelledby="h"><h2 id="h" className="mb-6 text-2xl font-bold">How it works</h2>
      <ol className="grid gap-4 sm:grid-cols-4">{steps.map((s, i) => <Glass key={s}><span className="text-leaf-400 font-extrabold">{i + 1}</span><p className="mt-2">{s}</p></Glass>)}</ol></section>
    <section className="grid grid-cols-2 gap-4 text-center lg:grid-cols-4">{[['48,000 kg', 'recycled'], ['3,200', 'households'], ['310', 'verified collectors'], ['820', 'trees saved']].map(([a, b]) => <Glass key={b}><p className="text-3xl font-extrabold">{a}</p><p className="text-sm opacity-70">{b}</p></Glass>)}</section>
    <section><h2 className="mb-6 text-2xl font-bold">What people say</h2><div className="grid gap-4 md:grid-cols-3">{quotes.map(([n, q]) => <Glass key={n}><p>“{q}”</p><p className="mt-3 text-sm opacity-70">{n}</p></Glass>)}</div></section>
    <footer className="border-t border-white/10 pt-6 text-sm opacity-70">© 2026 Scrap Connect. Demo data shown.</footer></div>)
}
