/**
 * @typedef {{ label: string, path: string, testId: string }} NavItem
 */

/** @type {Record<string, NavItem[]>} */
const NAV_CONFIG = {
  admin: [
    { label: 'Пользователи', path: 'users',     testId: 'nav-item-users'     },
    { label: 'Заказы',       path: 'orders',    testId: 'nav-item-orders'    },
    { label: 'Клиенты',      path: 'clients',   testId: 'nav-item-clients'   },
    { label: 'Услуги',       path: 'services',  testId: 'nav-item-services'  },
    { label: 'Настройки',    path: 'settings',  testId: 'nav-item-settings'  },
  ],
  manager: [
    { label: 'Заказы',   path: 'orders',   testId: 'nav-item-orders'   },
    { label: 'Клиенты',  path: 'clients',  testId: 'nav-item-clients'  },
    { label: 'Услуги',   path: 'services', testId: 'nav-item-services' },
  ],
  mechanic: [
    { label: 'Мои заказы', path: 'my-orders', testId: 'nav-item-my-orders' },
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
