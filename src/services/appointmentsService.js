/**
 * appointmentsService — CRUD-операции и real-time listener для коллекции `appointments`.
 *
 * Все операции требуют аутентификации (Firestore Rules: request.auth != null).
 * Роль-фильтрация выполняется на клиенте для MVP (ADR-21-04 pattern);
 * при масштабировании — добавить Firestore compound index + where-clause.
 *
 * @module appointmentsService
 */

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} AppointmentDoc
 * @property {string}           id           - Firestore document ID
 * @property {string}           date         - ISO дата, "YYYY-MM-DD"
 * @property {string}           time         - Время, "HH:MM" (24h)
 * @property {number}           duration     - Продолжительность в минутах
 * @property {string}           serviceType  - Тип услуги
 * @property {'waiting'|'confirmed'|'in_progress'|'done'|'cancelled'} status
 * @property {string|null}      clientId     - ID клиента или null (анонимная запись)
 * @property {string}           clientPhone  - Телефон (всегда заполнен)
 * @property {string}           clientName   - ФИО / имя (всегда заполнен)
 * @property {string|null}      mechanicId   - UID механика или null
 * @property {string}           [notes]      - Примечания
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} AppointmentFilters
 * @property {string} [dateFrom]   // "YYYY-MM-DD"
 * @property {string} [dateTo]     // "YYYY-MM-DD"
 * @property {string} [status]
 * @property {string} [mechanicId]
 */

// ── Real-time listener ────────────────────────────────────────────────────────

/**
 * Подписывается на изменения коллекции appointments.
 * Опционально фильтрует по диапазону дат, статусу и механику.
 * Возвращает функцию отписки (unsubscribe).
 *
 * @param {AppointmentFilters} filters
 * @param {(docs: AppointmentDoc[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAppointments(filters = {}, callback) {
  const constraints = []

  if (filters.dateFrom) {
    constraints.push(where('date', '>=', filters.dateFrom))
  }
  if (filters.dateTo) {
    constraints.push(where('date', '<=', filters.dateTo))
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status))
  }
  if (filters.mechanicId) {
    constraints.push(where('mechanicId', '==', filters.mechanicId))
  }

  const q = constraints.length
    ? query(collection(db, 'appointments'), ...constraints)
    : collection(db, 'appointments')

  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    // Сортировка по дате + времени (хронологический порядок)
    docs.sort((a, b) => {
      const da = `${a.date}T${a.time ?? '00:00'}`
      const db2 = `${b.date}T${b.time ?? '00:00'}`
      if (da < db2) return -1
      if (da > db2) return 1
      return 0
    })
    callback(docs)
  })
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Возвращает одиночную запись по ID.
 *
 * @param {string} id
 * @returns {Promise<AppointmentDoc>}
 */
export async function getAppointment(id) {
  const snap = await getDoc(doc(db, 'appointments', id))
  if (!snap.exists()) throw new Error(`Appointment ${id} not found`)
  return { id: snap.id, ...snap.data() }
}

/**
 * Создаёт новую запись.
 * createdAt устанавливается через serverTimestamp().
 *
 * @param {Omit<AppointmentDoc, 'id'|'createdAt'>} data
 * @returns {Promise<{ id: string }>}
 */
export async function createAppointment(data) {
  const ref = await addDoc(collection(db, 'appointments'), {
    date: data.date,
    time: data.time,
    duration: Number(data.duration ?? 60),
    serviceType: data.serviceType,
    status: data.status ?? 'waiting',
    clientId: data.clientId ?? null,
    clientPhone: data.clientPhone ?? '',
    clientName: data.clientName ?? '',
    mechanicId: data.mechanicId ?? null,
    notes: data.notes ?? '',
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет поля существующей записи.
 *
 * @param {string} id
 * @param {Partial<AppointmentDoc>} data
 * @returns {Promise<void>}
 */
export async function updateAppointment(id, data) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, createdAt: _createdAt, ...rest } = data
  await updateDoc(doc(db, 'appointments', id), rest)
}

/**
 * Удаляет запись.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAppointment(id) {
  await deleteDoc(doc(db, 'appointments', id))
}

/**
 * Привязывает существующего клиента к анонимной записи.
 *
 * @param {string} id             — ID записи
 * @param {string} clientId       — ID клиента
 * @param {string} clientName
 * @param {string} clientPhone
 * @returns {Promise<void>}
 */
export async function linkClientToAppointment(id, clientId, clientName, clientPhone) {
  await updateDoc(doc(db, 'appointments', id), {
    clientId,
    clientName,
    clientPhone,
  })
}
