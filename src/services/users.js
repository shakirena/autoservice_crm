import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} UserDoc
 * @property {string}   uid
 * @property {string}   email
 * @property {string}   displayName
 * @property {'admin'|'manager'|'mechanic'|'client'} role
 * @property {string}   [phone]
 * @property {string}   [avatarUrl]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @param {string} uid
 * @param {Omit<UserDoc, 'uid'|'createdAt'|'updatedAt'>} data
 * @returns {Promise<void>}
 */
export async function createUserDoc(uid, data) {
  // role must be set only via Admin SDK custom claims — strip from client writes
  const safeData = Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'role'))
  await setDoc(doc(db, 'users', uid), {
    ...safeData,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * @param {string} uid
 * @returns {Promise<UserDoc|null>}
 */
export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
