import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClients,
  createClient,
  updateClient,
} from '../services/clientsService.js'

/** Ключ кеша TanStack Query для коллекции clients */
export const CLIENTS_QUERY_KEY = ['clients']

/**
 * Возвращает список всех клиентов (отсортированных по createdAt desc).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/clientsService.js').ClientDoc[]>}
 */
export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: getClients,
  })
}

/**
 * Мутация создания клиента.
 * При успехе инвалидирует кеш clients.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      // return промис — mutateAsync ждёт завершения рефетча перед резолвом
      return queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления клиента.
 * При успехе инвалидирует кеш clients.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY })
    },
  })
}
