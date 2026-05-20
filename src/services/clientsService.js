import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * @typedef {Object} ClientDoc
 * @property {string} id
 * @property {string} fullName
 * @property {string} phone
 * @property {string} [email]
 * @property {string} createdBy
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

// ── Client operations ─────────────────────────────────────────────────────────

/**
 * Возвращает всех клиентов, отсортированных по дате создания (новые первые).
 *
 * @returns {Promise<ClientDoc[]>}
 */
export async function getClients() {
  const snap = await getDocs(collection(db, 'clients'))
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

/**
 * Создаёт нового клиента.
 * createdBy передаётся явно — берётся из auth.currentUser.uid на вызывающей стороне.
 *
 * @param {{ fullName: string, phone: string, email?: string, createdBy: string }} data
 * @returns {Promise<{ id: string }>}
 */
export async function createClient(data) {
  const ref = await addDoc(collection(db, 'clients'), {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email ?? '',
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

/**
 * Обновляет поля существующего клиента.
 * createdAt и createdBy не изменяются.
 *
 * @param {string} id
 * @param {{ fullName?: string, phone?: string, email?: string }} data
 * @returns {Promise<void>}
 */
export async function updateClient(id, data) {
  await updateDoc(doc(db, 'clients', id), {
    ...(data.fullName !== undefined && { fullName: data.fullName }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
  })
}

// NOTE: Физическое удаление клиента не предусмотрено (ADR-19-02).
// Клиент может быть привязан к заказам (#21). При необходимости деактивации
// добавить поле archived: boolean и функцию archiveClient аналогично archiveService.
