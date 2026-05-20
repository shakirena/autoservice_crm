import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
} from '../services/ordersService.js'

/** Ключ кеша TanStack Query для коллекции orders */
export const ORDERS_QUERY_KEY = ['orders']

/**
 * Возвращает список всех заказов, отсортированных по date desc (клиент-сайд, ADR-21-04).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/ordersService.js').OrderDoc[]>}
 */
export function useOrders() {
  return useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: getOrders,
  })
}

/**
 * Возвращает одиночный заказ по ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/ordersService.js').OrderDoc>}
 */
export function useOrder(id) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, id],
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
  })
}

/**
 * Мутация создания заказа.
 * При успехе инвалидирует кеш orders.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления статуса заказа.
 * При успехе инвалидирует кеш orders (список + конкретный заказ).
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, uid }) => updateOrderStatus(id, status, uid),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, variables.id] })
    },
  })
}
