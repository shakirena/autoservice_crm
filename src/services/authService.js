import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase.js'

/**
 * Sign in with email and password.
 * Re-throws Firebase errors so the caller can inspect error.code.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Sign out the currently authenticated user.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth)
}

/**
 * Return the Firebase Auth user that is currently signed in, or null.
 *
 * @returns {import('firebase/auth').User | null}
 */
export function getCurrentUser() {
  return auth.currentUser
}
