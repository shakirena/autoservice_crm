/**
 * useAppointments — TanStack Query хуки для работы с записями клиентов.
 *
 * Включает real-time подписку через onSnapshot.
 *
 * @module useAppointments
 */

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  subscribeAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  linkClientToAppointment,
} from '../services/appointmentsService.js'

/** Ключ кеша TanStack Query для коллекции appointments */
export const APPOINTMENTS_QUERY_KEY = ['appointments']

/**
 * Список записей с опциональной фильтрацией.
 * Использует real-time onSnapshot — данные обновляются автоматически.
 *
 * @param {{ mechanicId?: string, dateFrom?: string, dateTo?: string, status?: string }} [filters]
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/appointmentsService.js').AppointmentDoc[]>}
 */
export function useAppointments(filters = {}) {
  const queryClient = useQueryClient()
  // Стабильная строка ключа для фильтров — чтобы useEffect не перезапускался при каждом рендере
  const filtersKey = JSON.stringify(filters)
  const unsubRef = useRef(null)

  useEffect(() => {
    const parsedFilters = JSON.parse(filtersKey)
    // Запускаем onSnapshot и кладём данные прямо в кеш React Query
    unsubRef.current = subscribeAppointments(parsedFilters, (docs) => {
      queryClient.setQueryData([...APPOINTMENTS_QUERY_KEY, filtersKey], docs)
    })
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [filtersKey, queryClient])

  return useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, filtersKey],
    // queryFn не нужен — данные поставляются через setQueryData из onSnapshot
    queryFn: () => queryClient.getQueryData([...APPOINTMENTS_QUERY_KEY, filtersKey]) ?? [],
    staleTime: Infinity,
  })
}

/**
 * Одиночная запись по ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/appointmentsService.js').AppointmentDoc>}
 */
export function useAppointment(id) {
  return useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, id],
    queryFn: () => getAppointment(id),
    enabled: Boolean(id),
  })
}

/**
 * Мутация создания записи.
 * При успехе инвалидирует кеш appointments.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления полей записи.
 * При успехе инвалидирует кеш appointments.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY })
    },
  })
}

/**
 * Мутация удаления записи.
 * При успехе инвалидирует кеш appointments.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY })
    },
  })
}

/**
 * Мутация привязки клиента к анонимной записи.
 * При успехе инвалидирует кеш appointments.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useLinkClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId, clientName, clientPhone }) =>
      linkClientToAppointment(id, clientId, clientName, clientPhone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY })
    },
  })
}
