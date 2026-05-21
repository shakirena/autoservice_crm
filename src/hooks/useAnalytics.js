import { useMemo } from 'react'
import { useOrders } from './useOrders.js'
import * as analyticsService from '../services/analyticsService.js'

/**
 * Хук аналитики: фильтрует заказы по периоду и вычисляет агрегированные метрики.
 * Нет дополнительных Firestore-запросов — использует кеш useOrders() (ADR-22-01).
 *
 * @param {'today'|'week'|'month'|'all'} period
 * @returns {{
 *   isLoading: boolean,
 *   isError: boolean,
 *   revenue: number,
 *   orderCount: number,
 *   avgTicket: number,
 *   topServices: import('../services/analyticsService.js').ServiceStat[],
 *   staffStats: import('../services/analyticsService.js').StaffStat[],
 *   filtered: import('../services/ordersService.js').OrderDoc[],
 * }}
 */
export function useAnalytics(period) {
  const { data: orders = [], isLoading, isError } = useOrders()

  const filtered = useMemo(
    () => analyticsService.filterByPeriod(orders, period),
    [orders, period],
  )

  const revenue = useMemo(() => analyticsService.computeRevenue(filtered), [filtered])

  const orderCount = useMemo(() => analyticsService.computeOrderCount(filtered), [filtered])

  const avgTicket = useMemo(() => analyticsService.computeAvgTicket(filtered), [filtered])

  const topServices = useMemo(() => analyticsService.computeTopServices(filtered), [filtered])

  const staffStats = useMemo(() => analyticsService.computeStaffStats(filtered), [filtered])

  return { isLoading, isError, revenue, orderCount, avgTicket, topServices, staffStats, filtered }
}
