# Architecture: Feature #19 — База клиентов (Client Base)

_Дата: 2026-05-20 | Автор: architect_

---

## ADR (Architecture Decision Records)

### ADR-19-01: Клиент-сайд поиск вместо Firestore-запроса

**Статус:** Accepted

**Контекст:**
История US-19-4 требует фильтрации клиентов по ФИО или телефону. Firestore не поддерживает полнотекстовый поиск и LIKE-запросы. Альтернативы: (a) клиент-сайд фильтрация после загрузки всей коллекции, (b) индексирование через Algolia/Typesense, (c) хранить поле `searchTokens`.

**Решение:** Клиент-сайд фильтрация через `Array.filter` + `String.includes` в `useMemo` внутри `ClientsPage`.

**Обоснование:** На MVP-объёмах (< 10 000 клиентов) один getDocs вернёт данные за ~200 мс. Дополнительный сервис (Algolia) неоправдан. При росте базы переходим на `searchTokens` — это решение не блокирует миграцию.

**Последствия:** При росте > 10 000 клиентов перейти на хранение поля `nameLower` (нормализованное ФИО) и Firestore `where('nameLower', '>=', q)` + `where('nameLower', '<=', q + '')`.

---

### ADR-19-02: Нет физического удаления клиентов

**Статус:** Accepted

**Контекст:** Клиент может быть привязан к заказам (#21). Физическое удаление приведёт к осиротевшим ссылкам в коллекции `orders`.

**Решение:** Hard delete не реализован. `clientsService.js` предоставляет только `getClients`, `createClient`, `updateClient`. При необходимости деактивации — поле `archived: boolean` добавляется в будущем (ADR не принят, задача отложена).

**Последствия:** Пользователь не может удалить клиента из UI на MVP. Если требование появится — добавить `archived` и мягкое удаление аналогично `serviceCatalogService.archiveService`.

---

### ADR-19-03: Верхнеуровневая коллекция, без субколлекций

**Статус:** Accepted

**Контекст:** Можно хранить клиентов в `users/{uid}/clients/{id}` или как top-level `clients/{id}`.

**Решение:** Top-level коллекция `clients/{clientId}`.

**Обоснование:** Заказы (#21) должны ссылаться на клиента через `clientId`. Субколлекции при этом усложняют запрос и требуют Collection Group queries. Top-level коллекция — прямой путь.

---

## Модель данных

### Firestore коллекция: `clients/{clientId}`

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `fullName` | string | да | Полное имя клиента |
| `phone` | string | да | Телефон (форматированный или произвольный) |
| `email` | string | нет | Email (необязательный) |
| `createdAt` | Timestamp | да | serverTimestamp() при создании |
| `createdBy` | string | да | UID создателя (admin или manager) |

Индексы: не требуются (сортировка по `createdAt desc` выполняется на клиенте после загрузки).

---

## Firestore Security Rules

Правила уже присутствуют в `firestore.rules` (добавлены при инициализации feature):

```javascript
match /clients/{clientId} {
  allow read: if isAdmin() || isManager() || isMechanic();
  allow write: if isAdmin() || isManager();
}
```

**RBAC матрица:**

| Роль | read (list + get) | write (create + update + delete) |
|------|-------------------|---------------------------------|
| admin | да | да |
| manager | да | да |
| mechanic | да (read-only) | нет |
| client | нет | нет |
| аноним | нет | нет |

---

## Service Layer Interface

Файл: `src/services/clientsService.js`

```
getClients()                          → Promise<ClientDoc[]>
createClient(data)                    → Promise<{ id: string }>
updateClient(id, data)                → Promise<void>
```

Нет `deleteClient` — см. ADR-19-02.

---

## Component Architecture

```
/dashboard/clients  ←→  ClientsPage (pages/dashboard/ClientsPage.jsx)
    │
    ├── useClients()           (hooks/useClients.js)
    ├── useCreateClient()      (hooks/useClients.js)
    ├── useUpdateClient()      (hooks/useClients.js)
    │
    ├── ClientTable.jsx        (features/clients/ClientTable.jsx)
    │       └── ClientRow.jsx  (features/clients/ClientRow.jsx)
    │               ├── кнопка «Редактировать» — только admin/manager
    │               └── read-only для mechanic
    │
    └── ClientForm.jsx         (features/clients/ClientForm.jsx)
            ├── режим create (без initialData)
            └── режим edit (initialData = ClientDoc)
```

### Компонент ClientsPage

- Хранит состояние поиска (`search`) в `useState`
- Фильтрует список через `useMemo` (клиент-сайд, ADR-19-01)
- Управляет состоянием формы: `showCreate`, `editTarget` (ClientDoc | null)
- Получает роль из `useAuth()` для передачи в `ClientTable`

### Компонент ClientTable

- Принимает `clients[]`, `role`, `onEdit`
- Показывает скелетон при загрузке (аналогично `UsersPage`)
- Рендерит `<ClientRow>` для каждой записи

### Компонент ClientRow

- Принимает `client`, `role`, `onEdit`
- Кнопка «Редактировать» отображается только при `role === 'admin' || role === 'manager'`
- Показывает: ФИО, телефон, email (или —), дата добавления, действия

### Компонент ClientForm

- Управляется через React Hook Form
- `fullName` — required
- `phone` — required
- `email` — optional, validate as email pattern если заполнен
- При `initialData` — режим редактирования, вызывает `updateClient`
- При отсутствии `initialData` — режим создания, вызывает `createClient`

---

## Security Considerations

1. **Firestore Rules** уже применяют role-check на стороне сервера — клиентская RBAC в UI является дополнительным слоем UX, а не единственной защитой.
2. **createdBy** — сохраняется UID создателя для аудита. Не передаётся через форму — берётся из `auth.currentUser.uid` в сервисе.
3. **Механик не может создавать/редактировать** — кнопки скрыты в UI, правила Firestore блокируют попытку записи на уровне сервера.
4. **email** — необязательное поле; валидация формата выполняется React Hook Form перед отправкой, но не Firestore Rules (добавить при необходимости).
5. **Нет hard delete** — исключает случайное удаление клиента, связанного с заказом.

---

## Notes for Developer

- Маршрут `/dashboard/clients` уже присутствует в `src/config/navigation.js` для admin и manager — добавить только `<Route>` в роутер.
- `ClientForm` используется как модальное окно (аналогично `CreateUserModal` / `EditUserModal`) — можно обернуть в простой overlay.
- Сортировка: `getClients()` возвращает записи, отсортированные по `createdAt desc` (клиент-сайд sort, аналогично `getUsers`).
- При реализации #21 (заказы): поле `clientId` в заказе ссылается на `clients/{clientId}`.
