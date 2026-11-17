import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, configured, firebaseConfigError } from '../lib/firebase'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [authError, setAuthError] = useState(firebaseConfigError)
  const profileSetup = useRef(false)
  useEffect(() => {
    if (firebaseConfigError) { setLoading(false); return }
    if (!configured) {
      try {
        const saved = localStorage.getItem('demo-user')
        if (saved) setUser(JSON.parse(saved))
      } catch (error) {
        console.error('Unable to restore the demo session.', error)
        localStorage.removeItem('demo-user')
      }
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async currentUser => {
      setAuthError(null)
      if (!currentUser) { setUser(null); setLoading(false); return }
      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid))
        if (!snapshot.exists()) {
          if (profileSetup.current) return
          throw new Error('Your account profile was not found. Contact an administrator.')
        }
        setUser({ id: currentUser.uid, email: currentUser.email, ...snapshot.data() })
      } catch (error) {
        console.error('Unable to load the signed-in user profile.', error)
        setUser(null)
        setAuthError(error.message || 'Unable to load your account profile.')
      } finally {
        setLoading(false)
      }
    })
  }, [])
  const login = async (email, password, role, name = 'Demo') => {
    setAuthError(null)
    if (firebaseConfigError) throw new Error(firebaseConfigError)
    if (!configured) {
      const demoUser = { id: 'demo-' + role, email, name, role }
      localStorage.setItem('demo-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    }
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const snapshot = await getDoc(doc(db, 'users', credential.user.uid))
    if (!snapshot.exists()) throw new Error('Your account profile was not found. Contact an administrator.')
    const authenticatedUser = { id: credential.user.uid, email: credential.user.email, ...snapshot.data() }
    setUser(authenticatedUser)
    return authenticatedUser
  }
  const register = async (email, password, name, role = 'user') => {
    if (!configured) return login(email, password, role, name)
    profileSetup.current = true
    try {
      const c = await createUserWithEmailAndPassword(auth, email, password)
      const profile = { name, email, phone: '', greenPoints: 0, role: role === 'collector' ? 'collector' : 'user' }
      await setDoc(doc(db, 'users', c.user.uid), profile)
      if (profile.role === 'collector') {
        await setDoc(doc(db, 'collectors', c.user.uid), { name, vehicle: '', verified: false, rating: 0 })
      }
      const authenticatedUser = { id: c.user.uid, ...profile }
      setAuthError(null)
      setUser(authenticatedUser)
      return authenticatedUser
    } finally {
      profileSetup.current = false
    }
  }
  const logout = async () => {
    if (configured) await signOut(auth)
    else localStorage.removeItem('demo-user')
    setUser(null)
    setAuthError(null)
  }
  return <Ctx.Provider value={{ user, loading, authError, login, register, logout }}>{children}</Ctx.Provider>
}
