import { createContext, useContext, useEffect } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase.js'
import { useAuthStore } from '../store/authStore.js'
import { logout } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setRole = useAuthStore((s) => s.setRole)
  const setLoading = useAuthStore((s) => s.setLoading)
  const reset = useAuthStore((s) => s.reset)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Read role from Firestore users/{uid}.role — not from custom claims
        // so the UI reflects the mirror field immediately without a token refresh.
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          // MVP-блокировка: если disabled === true — принудительно разлогиниваем.
          // Реальный disabled через Admin SDK недоступен из браузера; ProtectedRoute
          // перенаправит на /login как только user станет null.
          if (snap.exists() && snap.data().disabled === true) {
            await firebaseSignOut(auth)
            reset()
            setLoading(false)
            return
          }
          const role = snap.exists() ? (snap.data().role ?? 'client') : 'client'
          setUser(firebaseUser)
          setRole(role)
        } catch (err) {
          // Firestore read failed — fall back to 'client' role; log for audit (no sensitive data)
          console.error('[auth] Не удалось прочитать роль пользователя из Firestore:', err.code ?? err.message)
          setUser(firebaseUser)
          setRole('client')
        }
      } else {
        reset()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Expose signOut so consumers do not import authService directly
  async function signOut() {
    await logout()
  }

  // AuthContext value is derived from Zustand on every render.
  // Components should call useAuth() — do not read the store directly
  // so that signOut stays available through the same hook.
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const loading = useAuthStore((s) => s.loading)

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
