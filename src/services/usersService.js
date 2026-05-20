import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { db, firebaseConfig } from '../lib/firebase.js'

/**
 * @typedef {Object} UserDoc
 * @property {string}   uid
 * @property {string}   email
 * @property {string}   displayName
 * @property {'admin'|'manager'|'mechanic'|'client'} role
 * @property {boolean}  disabled
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

// Secondary Firebase App — используется только для createUserWithEmailAndPassword,
// чтобы не прерывать активную сессию admin.
const SECONDARY_APP_NAME = 'secondary'
const secondaryApp =
  getApps().find((a) => a.name === SECONDARY_APP_NAME) ??
  initializeApp(firebaseConfig, SECONDARY_APP_NAME)
const secondaryAuth = getAuth(secondaryApp)

/**
 * Маппинг кодов Firebase Auth ошибок на русскоязычные сообщения.
 *
 * @param {string} code
 * @returns {string}
 */
export function mapAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'Пользователь с таким email уже существует',
    'auth/invalid-email': 'Некорректный формат email',
    'auth/weak-password': 'Пароль слишком простой. Минимум 8 символов',
    'auth/operation-not-allowed':
      'Создание пользователей через email/password не настроено',
    'auth/network-request-failed':
      'Ошибка сети. Проверьте подключение к интернету',
  }
  return map[code] ?? 'Ошибка создания пользователя. Попробуйте снова'
}

/**
 * Возвращает все документы коллекции users, отсортированные по createdAt desc.
 *
 * @returns {Promise<UserDoc[]>}
 */
export async function getUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

/**
 * Создаёт нового сотрудника.
 * 1. createUserWithEmailAndPassword через secondaryAuth (сессия admin не прерывается).
 * 2. updateProfile — устанавливает displayName в Firebase Auth.
 * 3. setDoc — создаёт документ в Firestore users/{uid}.
 * 4. signOut из secondaryAuth — очищаем secondary сессию.
 *
 * @param {{ email: string, displayName: string, role: 'manager'|'mechanic', password: string }} data
 * @returns {Promise<{ uid: string }>}
 */
export async function createEmployee({ email, displayName, role, password }) {
  // Создаём аккаунт через secondary app — основная сессия admin остаётся нетронутой
  let credential
  try {
    credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password,
    )
  } catch (err) {
    throw new Error(mapAuthError(err.code), { cause: err })
  }

  const newUser = credential.user

  // Устанавливаем displayName в Firebase Auth Profile
  try {
    await updateProfile(newUser, { displayName })
  } catch {
    // Non-critical — продолжаем; displayName будет в Firestore
  }

  // Создаём документ в Firestore (запись выполняется от имени admin — основная сессия)
  await setDoc(doc(db, 'users', newUser.uid), {
    uid: newUser.uid,
    email,
    displayName,
    role,
    disabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Немедленно разлогиниваем secondary app — он больше не нужен
  await signOut(secondaryAuth)

  return { uid: newUser.uid }
}

/**
 * Обновляет роль пользователя в Firestore.
 *
 * @param {string} uid
 * @param {'admin'|'manager'|'mechanic'} newRole
 * @returns {Promise<void>}
 */
export async function updateUserRole(uid, newRole) {
  await updateDoc(doc(db, 'users', uid), {
    role: newRole,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Устанавливает/снимает флаг блокировки пользователя в Firestore.
 * MVP-блокировка: реальный disabled через Admin SDK недоступен из браузера.
 *
 * @param {string} uid
 * @param {boolean} disabled — true = заблокировать, false = разблокировать
 * @returns {Promise<void>}
 */
export async function toggleUserBlock(uid, disabled) {
  await updateDoc(doc(db, 'users', uid), {
    disabled,
    updatedAt: serverTimestamp(),
  })
}
