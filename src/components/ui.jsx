import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
export const Glass = ({ className = '', children }) => <div className={`glass p-5 ${className}`}>{children}</div>
export const Skeleton = ({ className = 'h-24' }) => <div aria-hidden className={`glass animate-pulse ${className}`}/>
export const StatCard = ({ label, value, unit }) => (
  <Glass><p className="text-sm opacity-70">{label}</p><p className="mt-1 text-3xl font-extrabold">{value}<span className="ml-1 text-base font-normal opacity-70">{unit}</span></p></Glass>)
export const Grid = ({ children }) => <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
export function useLoading(ms = 700) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(timer)
  }, [ms])
  return loading
}
const T = createContext(() => {})
export const useToast = () => useContext(T)
export function ToastProvider({ children }) {
  const [items, set] = useState([])
  const push = useCallback(msg => { const id = Date.now(); set(i => [...i, { id, msg }]); setTimeout(() => set(i => i.filter(x => x.id !== id)), 3500) }, [])
  return <T.Provider value={push}>{children}
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>{items.map(t => <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="glass px-4 py-3">{t.msg}</motion.div>)}</AnimatePresence></div></T.Provider>
}
export function Navbar() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('scrap-theme') !== 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('scrap-theme', dark ? 'dark' : 'light')
  }, [dark])
  const home = user ? { user: '/dashboard', collector: '/collector', admin: '/admin' }[user.role] : '/login'
  const navigation = user?.role === 'collector'
    ? [{ to: '/collector', label: 'My route', icon: '⌖' }]
    : user?.role === 'admin'
      ? [{ to: '/admin', label: 'Overview', icon: '▦' }]
      : [{ to: '/dashboard', label: 'Dashboard', icon: '▦' }, { to: '/pickup', label: 'Book a pickup', icon: '＋' }]
  return (<>
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between !py-3" aria-label="Main">
        <div className="flex items-center gap-3">
          {user && <button type="button" onClick={() => setSidebarOpen(value => !value)} aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={sidebarOpen} className="rounded-lg px-2 py-1 hover:bg-white/10 lg:hidden">{sidebarOpen ? '×' : '☰'}</button>}
          <Link to="/" className="text-lg font-extrabold">Scrap Connect</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {!user && <Link to="/login">Log in</Link>}
          <button onClick={() => setDark(value => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} className="rounded-lg px-2 py-1 hover:bg-white/10">{dark ? '☼' : '◐'}</button>
          {user && <button onClick={logout} className="opacity-70">Log out</button>}
        </div>
      </nav>
    </header>
    {user && <>
      {sidebarOpen && <button type="button" aria-label="Close navigation menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden"/>}
      <aside className={`glass fixed bottom-0 left-0 top-20 z-40 w-64 rounded-none border-l-0 border-b-0 p-4 transition-transform lg:top-24 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Sidebar navigation">
        <p className="mb-1 truncate font-semibold">{user.name || user.email}</p>
        <p className="mb-6 text-xs capitalize opacity-60">{user.role} account</p>
        <nav className="space-y-2" aria-label="Workspace">
          {navigation.map(item => <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-leaf-500/20 text-leaf-400' : 'opacity-75 hover:bg-white/10 hover:opacity-100'}`}><span aria-hidden="true" className="w-5 text-lg">{item.icon}</span>{item.label}</NavLink>)}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="text-xs leading-relaxed opacity-60">Make recycling easier. Track pickups, explore local scrap options and grow your green impact.</p>
          <Link className="btn mt-4 block text-center text-sm" to={home} onClick={() => setSidebarOpen(false)}>Go to my home</Link>
        </div>
      </aside>
    </>}
  </>)
}
