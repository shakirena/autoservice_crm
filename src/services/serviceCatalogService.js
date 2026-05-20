import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} CategoryDoc
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other'} vehicleComponent
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} ServiceDoc
 * @property {string}  id
 * @property {string}  name
 * @property {string}  [description]
 * @property {number}  price
 * @property {string}  categoryId
 * @property {'engine'|'gearbox'|'suspension'|'brakes'|'electrics'|'tires'|'body'|'other'} vehicleComponent
 * @property {boolean} archived
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/** @type {readonly string[]} */
export const VEHICLE_COMPONENTS = [
  'engine',
  'gearbox',
  'suspension',
  'brakes',
  'electrics',
  'tires',
  'body',
  'other',
]

// ── Category operations ───────────────────────────────────────────────────────

/**
 * Возвращает все категории услуг, отсортированные по имени.
 *
 * @returns {Promise<CategoryDoc[]>}
 */
export async function getCategories() {
  const snap = await getDocs(collection(db, 'serviceCategories'))
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

/**
 * Создаёт новую категорию услуг.
 *
 * @param {{ name: string, description?: string, vehicleComponent: string }} data
 * @returns {Promise<{ id: string }>}
 */
export async function createCategory(data) {
  const ref = await addDoc(collection(db, 'serviceCategories'), {
    name: data.name,
    description: data.description ?? '',
    vehicleComponent: data.vehicleComponent,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет поля существующей категории.
 *
 * @param {string} id
 * @param {{ name?: string, description?: string, vehicleComponent?: string }} data
 * @returns {Promise<void>}
 */
export async function updateCategory(id, data) {
  await updateDoc(doc(db, 'serviceCategories', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Удаляет категорию. Блокирует удаление если к ней привязаны активные (не архивированные) услуги.
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {Error} если активные услуги ссылаются на эту категорию
 */
export async function deleteCategory(id) {
  const activeServicesSnap = await getDocs(
    query(
      collection(db, 'services'),
      where('categoryId', '==', id),
      where('archived', '==', false),
    ),
  )
  if (!activeServicesSnap.empty) {
    throw new Error('Нельзя удалить категорию: к ней привязаны активные услуги')
  }
  await deleteDoc(doc(db, 'serviceCategories', id))
}

// ── Service operations ────────────────────────────────────────────────────────

/**
 * Возвращает список услуг с опциональной фильтрацией.
 * По умолчанию возвращает только неархивированные услуги.
 *
 * @param {{ categoryId?: string, vehicleComponent?: string, archived?: boolean }} [filters]
 * @returns {Promise<ServiceDoc[]>}
 */
export async function getServices(filters = {}) {
  const { categoryId, vehicleComponent, archived = false } = filters

  // orderBy перенесён на клиент — избегает составного индекса Firestore
  const constraints = [where('archived', '==', archived)]

  if (categoryId) constraints.push(where('categoryId', '==', categoryId))
  if (vehicleComponent) constraints.push(where('vehicleComponent', '==', vehicleComponent))

  const q = query(collection(db, 'services'), ...constraints)
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

/**
 * Создаёт новую услугу (неархивированную по умолчанию).
 *
 * @param {{ name: string, description?: string, price: number, categoryId: string, vehicleComponent: string }} data
 * @returns {Promise<{ id: string }>}
 */
export async function createService(data) {
  const ref = await addDoc(collection(db, 'services'), {
    name: data.name,
    description: data.description ?? '',
    price: data.price,
    categoryId: data.categoryId,
    vehicleComponent: data.vehicleComponent,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет поля существующей услуги.
 *
 * @param {string} id
 * @param {Partial<Omit<ServiceDoc, 'id'|'createdAt'>>} data
 * @returns {Promise<void>}
 */
export async function updateService(id, data) {
  await updateDoc(doc(db, 'services', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Переключает флаг архивирования услуги (мягкое удаление / восстановление).
 *
 * @param {string} id
 * @param {boolean} archived
 * @returns {Promise<void>}
 */
export async function archiveService(id, archived) {
  await updateDoc(doc(db, 'services', id), {
    archived,
    updatedAt: serverTimestamp(),
  })
}
