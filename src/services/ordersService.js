import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} OrderServiceItem
 * @property {string} serviceId
 * @property {string} name
 * @property {number} price
 */

/**
 * @typedef {Object} OrderDoc
 * @property {string} id
 * @property {string} clientId
 * @property {string} vehicleId
 * @property {string} vehicleComponent
 * @property {Object} componentParams
 * @property {OrderServiceItem[]} services
 * @property {number} totalAmount
 * @property {string} date
 * @property {string} createdBy
 * @property {'draft'|'in_progress'|'completed'} status
 * @property {string|null} [appointmentId]  - ID связанной записи или null
 * @property {import('firebase/firestore').Timestamp|null} completedAt
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

// ── Orders operations ──────────────────────────────────────────────────────────

/**
 * Возвращает все заказы, отсортированные по дате (новые первые).
 * Сортировка выполняется на клиенте — не используем orderBy в Firestore (ADR-21-04).
 * Лексикографическое сравнение ISO-строк (YYYY-MM-DD) даёт правильный хронологический порядок.
 *
 * @returns {Promise<OrderDoc[]>}
 */
export async function getOrders() {
  const snap = await getDocs(collection(db, 'orders'))
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    // Сортировка по date (ISO строка) — новые первые
    if (b.date > a.date) return 1
    if (b.date < a.date) return -1
    // При одинаковой дате — по createdAt (новые первые)
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

/**
 * Возвращает заказы для механика.
 * MVP: загружает все заказы, фильтрует клиент-сайд по createdBy == uid.
 * При необходимости добавить поле mechanicId и where-фильтр в отдельном PR.
 *
 * @param {string} uid - UID механика
 * @returns {Promise<OrderDoc[]>}
 */
export async function getOrdersByMechanic(uid) {
  const all = await getOrders()
  return all.filter((o) => o.createdBy === uid)
}

/**
 * Возвращает одиночный заказ по ID.
 *
 * @param {string} id
 * @returns {Promise<OrderDoc>}
 */
export async function getOrder(id) {
  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) throw new Error(`Order ${id} not found`)
  return { id: snap.id, ...snap.data() }
}

/**
 * Создаёт новый заказ.
 * services[] хранится как снапшот (name+price) — историческая точность цен (ADR-21-02).
 * completedAt устанавливается в null при создании.
 * appointmentId — опциональная ссылка на запись клиента (feature #70).
 *
 * @param {{
 *   clientId: string,
 *   vehicleId?: string,
 *   vehicleComponent?: string,
 *   componentParams?: Object,
 *   services?: OrderServiceItem[],
 *   totalAmount?: number,
 *   date: string,
 *   createdBy: string,
 *   status?: 'draft'|'in_progress'|'completed',
 *   appointmentId?: string|null,
 * }} data
 * @returns {Promise<{ id: string }>}
 */
export async function createOrder(data) {
  const ref = await addDoc(collection(db, 'orders'), {
    clientId: data.clientId,
    vehicleId: data.vehicleId ?? null,
    vehicleComponent: data.vehicleComponent ?? '',
    componentParams: data.componentParams ?? {},
    services: data.services ?? [],
    totalAmount: Number(data.totalAmount ?? 0),
    date: data.date,
    createdBy: data.createdBy,
    status: data.status ?? 'draft',
    appointmentId: data.appointmentId ?? null,
    completedAt: null,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет статус заказа.
 * Если status === 'completed' — устанавливает completedAt = serverTimestamp().
 * Иначе completedAt сбрасывается в null.
 * uid передаётся для логирования (не записывается в документ на MVP).
 *
 * @param {string} id - ID заказа
 * @param {'draft'|'in_progress'|'completed'} status
 * @param {string} uid - UID пользователя, меняющего статус (для будущего аудит-лога)
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(id, status, uid) {
  void uid // зарезервировано для будущего аудит-лога (#22)
  await updateDoc(doc(db, 'orders', id), {
    status,
    completedAt: status === 'completed' ? serverTimestamp() : null,
  })
}
