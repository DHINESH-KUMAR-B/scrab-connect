import { useState } from 'react'
import { Glass, StatCard, Grid, useToast } from '../components/ui'
import { users, collectors as c0, pickups, monthly } from '../data/mock'
import { predictPrices } from '../lib/ai'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
export default function Admin() {
  const toast = useToast(), [q, setQ] = useState(''), [st, setSt] = useState('all'), [cols, setCols] = useState(c0)
  const verify = id => { setCols(cols.map(c => c.id === id ? { ...c, verified: true } : c)); toast('Collector verified') }
  const shown = pickups.filter(p => (st === 'all' || p.status === st) && (p.area + p.scrapType + p.id).toLowerCase().includes(q.toLowerCase()))
  return (<div className="space-y-6"><h1 className="text-2xl font-bold">Admin</h1>
    <Grid><StatCard label="Users" value={users.length}/><StatCard label="Collectors" value={cols.length}/><StatCard label="Pending verification" value={cols.filter(c => !c.verified).length}/><StatCard label="Revenue (Nov)" value={'₹' + monthly[5].revenue}/></Grid>
    <div className="grid gap-4 lg:grid-cols-2">
      <Glass><h2 className="mb-2 font-semibold">Revenue</h2><div className="h-48"><ResponsiveContainer><AreaChart data={monthly}><XAxis dataKey="month"/><YAxis/><Tooltip/><Area dataKey="revenue" stroke="#22c55e" fill="#22c55e55"/></AreaChart></ResponsiveContainer></div></Glass>
      <Glass><h2 className="mb-2 font-semibold">Predicted metal price (₹/kg)</h2><div className="h-48"><ResponsiveContainer><LineChart data={predictPrices(35)}><XAxis dataKey="month"/><YAxis domain={['auto', 'auto']}/><Tooltip/><Line dataKey="price" stroke="#4ade80" strokeWidth={3}/></LineChart></ResponsiveContainer></div></Glass></div>
    <Glass><h2 className="mb-2 font-semibold">Collector verification</h2>{cols.map(c => <div key={c.id} className="flex items-center justify-between border-b border-white/10 py-2 text-sm"><span>{c.name} · {c.vehicle}</span>{c.verified ? <span className="text-leaf-400">Verified</span> : <button className="btn !py-1" onClick={() => verify(c.id)}>Verify</button>}</div>)}</Glass>
    <Glass><h2 className="mb-2 font-semibold">Pickups</h2><div className="mb-3 flex gap-2"><input className="input" placeholder="Search area, category, ID" aria-label="Search pickups" value={q} onChange={e => setQ(e.target.value)}/><select className="input !w-40" aria-label="Status" value={st} onChange={e => setSt(e.target.value)}><option value="all">All</option><option>scheduled</option><option>completed</option></select></div>
      {shown.map(p => <div key={p.id} className="flex justify-between border-b border-white/10 py-2 text-sm"><span>{p.id} · {p.area}</span><span>{p.scrapType} {p.weight} kg</span><span>{p.status}</span></div>)}{!shown.length && <p className="text-sm opacity-70">No pickups match. Clear the search or change the status filter.</p>}</Glass>
    <Glass><h2 className="mb-2 font-semibold">Users</h2>{users.map(u => <div key={u.id} className="flex justify-between border-b border-white/10 py-2 text-sm"><span>{u.name}</span><span>{u.email}</span><span>{u.greenPoints} pts</span></div>)}</Glass></div>)
}
