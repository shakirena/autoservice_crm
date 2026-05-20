import { create } from 'zustand'

/**
 * @typedef {'admin'|'manager'|'mechanic'|'client'} UserRole
 */

/**
 * @typedef {Object} AuthState
 * @property {import('firebase/auth').User | null} user
 * @property {UserRole | null} role
 * @property {boolean} loading
 * @property {(user: import('firebase/auth').User | null) => void} setUser
 * @property {(role: UserRole | null) => void} setRole
 * @property {(loading: boolean) => void} setLoading
 * @property {() => void} reset
 */

/** @type {import('zustand').StoreApi<AuthState>} */
export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user }),

  setRole: (role) => set({ role }),

  setLoading: (loading) => set({ loading }),

  reset: () => set({ user: null, role: null, loading: false }),
}))
