import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'
import UserDashboard from './pages/UserDashboard'
import Pickup from './pages/Pickup'
import Collector from './pages/Collector'
import Admin from './pages/Admin'
const Guard = ({ role, children }) => { const { user, loading, authError } = useAuth()
  if (loading) return null
  if (authError) return <div role="alert" className="glass mx-auto max-w-xl p-6">{authError} <Link className="underline" to="/login">Return to login</Link></div>
  return user && (!role || user.role === role) ? children : <Navigate to="/login" replace/> }
export default function App() {
  const { user } = useAuth()
  return (<><Navbar/><main className={`mx-auto max-w-6xl px-4 pb-16 pt-24 ${user ? 'lg:ml-64' : ''}`}>
    <Routes>
      <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/>
      <Route path="/dashboard" element={<Guard role="user"><UserDashboard/></Guard>}/>
      <Route path="/pickup" element={<Guard role="user"><Pickup/></Guard>}/>
      <Route path="/collector" element={<Guard role="collector"><Collector/></Guard>}/>
      <Route path="/admin" element={<Guard role="admin"><Admin/></Guard>}/>
    </Routes></main></>)
}
