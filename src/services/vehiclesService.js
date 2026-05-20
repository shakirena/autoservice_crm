import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} VehicleDoc
 * @property {string} id
 * @property {string} clientId
 * @property {string} make
 * @property {string} model
 * @property {number} year
 * @property {string} licensePlate
 * @property {string} [vin]
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

// ── Vehicle operations ────────────────────────────────────────────────────────

/**
 * Возвращает все автомобили, отсортированных по дате создания (новые первые).
 * Сортировка выполняется на клиенте — не используем orderBy в Firestore
 * во избежание необходимости создавать составные индексы (ADR-20-03).
 *
 * @returns {Promise<VehicleDoc[]>}
 */
export async function getVehicles() {
  const snap = await getDocs(collection(db, 'vehicles'))
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

/**
 * Возвращает автомобили конкретного клиента, отсортированные по дате создания (новые первые).
 * Используем where без orderBy — сортировка на клиенте (ADR-20-03).
 *
 * @param {string} clientId
 * @returns {Promise<VehicleDoc[]>}
 */
export async function getVehiclesByClient(clientId) {
  const q = query(collection(db, 'vehicles'), where('clientId', '==', clientId))
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

/**
 * Создаёт новый автомобиль.
 *
 * @param {{
 *   clientId: string,
 *   make: string,
 *   model: string,
 *   year: number,
 *   licensePlate: string,
 *   vin?: string,
 * }} data
 * @returns {Promise<{ id: string }>}
 */
export async function createVehicle(data) {
  const ref = await addDoc(collection(db, 'vehicles'), {
    clientId: data.clientId,
    make: data.make,
    model: data.model,
    year: Number(data.year),
    licensePlate: data.licensePlate,
    vin: data.vin ?? '',
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет поля существующего автомобиля.
 * createdAt не изменяется.
 *
 * @param {string} id
 * @param {{
 *   clientId?: string,
 *   make?: string,
 *   model?: string,
 *   year?: number,
 *   licensePlate?: string,
 *   vin?: string,
 * }} data
 * @returns {Promise<void>}
 */
export async function updateVehicle(id, data) {
  await updateDoc(doc(db, 'vehicles', id), {
    ...(data.clientId !== undefined && { clientId: data.clientId }),
    ...(data.make !== undefined && { make: data.make }),
    ...(data.model !== undefined && { model: data.model }),
    ...(data.year !== undefined && { year: Number(data.year) }),
    ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate }),
    ...(data.vin !== undefined && { vin: data.vin }),
  })
}

// NOTE: Физическое удаление автомобиля не предусмотрено (ADR-20-02).
// Автомобиль может быть привязан к заказам (#21). При необходимости деактивации
// добавить поле archived: boolean и функцию archiveVehicle аналогично archiveService.
