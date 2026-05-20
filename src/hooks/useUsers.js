import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsers,
  createEmployee,
  updateUserRole,
  toggleUserBlock,
} from '../services/usersService.js'

/** Ключ кеша TanStack Query для коллекции users */
export const USERS_QUERY_KEY = ['users']

/**
 * Возвращает список всех пользователей системы.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/usersService.js').UserDoc[]>}
 */
export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: getUsers,
  })
}

/**
 * Мутация создания нового сотрудника.
 * При успехе инвалидирует кеш users.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

/**
 * Мутация смены роли пользователя.
 * При успехе инвалидирует кеш users.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, role }) => updateUserRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

/**
 * Мутация блокировки/разблокировки пользователя.
 * При успехе инвалидирует кеш users.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useToggleUserBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, disabled }) => toggleUserBlock(uid, disabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}
