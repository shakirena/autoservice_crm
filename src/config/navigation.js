/**
 * @typedef {{ label: string, path: string, testId: string, icon: string }} NavItem
 */

/** @type {Record<string, NavItem[]>} */
const NAV_CONFIG = {
  admin: [
    { label: 'Пользователи', path: 'users',        testId: 'nav-item-users',        icon: '👥' },
    { label: 'Заказы',       path: 'orders',       testId: 'nav-item-orders',       icon: '📋' },
    { label: 'Записи',       path: 'appointments', testId: 'nav-item-appointments', icon: '📅' },
    { label: 'Клиенты',      path: 'clients',      testId: 'nav-item-clients',      icon: '👤' },
    { label: 'Автомобили',   path: 'vehicles',     testId: 'nav-item-vehicles',     icon: '🚗' },
    { label: 'Услуги',       path: 'services',     testId: 'nav-item-services',     icon: '🔧' },
    { label: 'Аналитика',    path: 'analytics',    testId: 'nav-item-analytics',    icon: '📊' },
    { label: 'Настройки',    path: 'settings',     testId: 'nav-item-settings',     icon: '⚙️' },
  ],
  manager: [
    { label: 'Заказы',      path: 'orders',       testId: 'nav-item-orders',       icon: '📋' },
    { label: 'Записи',      path: 'appointments', testId: 'nav-item-appointments', icon: '📅' },
    { label: 'Клиенты',     path: 'clients',      testId: 'nav-item-clients',      icon: '👤' },
    { label: 'Автомобили',  path: 'vehicles',     testId: 'nav-item-vehicles',     icon: '🚗' },
    { label: 'Услуги',      path: 'services',     testId: 'nav-item-services',     icon: '🔧' },
  ],
  mechanic: [
    { label: 'Мои заказы', path: 'my-orders',     testId: 'nav-item-my-orders',     icon: '🔩' },
    { label: 'Записи',     path: 'appointments',  testId: 'nav-item-appointments',  icon: '📅' },
  ],
  client: [],
}

/**
 * Returns navigation items for the given role.
 * Unknown roles return an empty array.
 *
 * @param {string | null | undefined} role
 * @returns {NavItem[]}
 */
export function getNavItems(role) {
  return NAV_CONFIG[role] ?? []
}
