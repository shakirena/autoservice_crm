# Тест-кейсы: Feature #1 — Инициализация CRM-проекта

## Покрытие

| Story | Файл тестов | Кейсов | Статус |
|-------|-------------|--------|--------|
| US-1: Структура папок | Ручная проверка / npm run dev | — | PASS |
| US-2: firebase.js | (мок-тест в authContext) | 2 | PASS |
| US-3: .env.example | Ручная проверка git | — | PASS |
| US-4: Security Rules | TC-04 (ручной) | 5 | PASS |
| US-5: AuthContext + useAuth | authContext.test.jsx | 5 | PASS |
| — | users.test.js | 4 | PASS |
| — | LoginPage.test.jsx | 1 | PASS |
| — | DashboardPage.test.jsx | 3 | PASS |

---

## TC-01: AuthContext — инициализация

**Файл:** `src/lib/__tests__/authContext.test.jsx`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 1.1 | Рендер при инициализации (auth pending) | Показывает `data-testid="loading"` | PASS |
| 1.2 | Пользователь аутентифицирован, роль `admin` в claims | `user.email` и `role=admin` доступны через `useAuth` | PASS |
| 1.3 | Claim `role` отсутствует | `role` по умолчанию `client` | PASS |
| 1.4 | Пользователь вышел из системы | `user=null`, `role=null` | PASS |
| 1.5 | `useAuth` вызван вне `AuthProvider` | Выбрасывает ошибку с понятным сообщением | PASS |

---

## TC-02: Сервис пользователей

**Файл:** `src/services/__tests__/users.test.js`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 2.1 | `createUserDoc` — запись нового пользователя | Документ содержит `uid`, `serverTimestamp` для `createdAt`/`updatedAt` | PASS |
| 2.2 | `createUserDoc` — передача поля `role` клиентом | Поле `role` удалено из документа | PASS |
| 2.3 | `getUserDoc` — документ существует | Возвращает данные документа | PASS |
| 2.4 | `getUserDoc` — документ не существует | Возвращает `null` | PASS |

---

## TC-03: Страницы

**Файлы:** `src/pages/__tests__/LoginPage.test.jsx`, `DashboardPage.test.jsx`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 3.1 | `LoginPage` — рендер | Отображает заголовок `AutoService CRM` и подзаголовок | PASS |
| 3.2 | `DashboardPage` — `loading=true` | Показывает `data-testid="dashboard-loading"` | PASS |
| 3.3 | `DashboardPage` — аутентифицированный admin | Показывает email, роль и кнопку выхода | PASS |
| 3.4 | `DashboardPage` — роль mechanic | Placeholder содержит слово `mechanic` | PASS |

---

## TC-04: Firestore Security Rules (ручная верификация)

Для запуска: `firebase emulators:start --only firestore`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 4.1 | Неаутентифицированный запрос к `users/{uid}` | `PERMISSION_DENIED` | PASS (rules review) |
| 4.2 | Клиент читает чужой `users/{uid}` | `PERMISSION_DENIED` | PASS (rules review) |
| 4.3 | Менеджер читает любой `users/{uid}` | Разрешено | PASS (rules review) |
| 4.4 | Не-admin пытается изменить `role` | `PERMISSION_DENIED` | PASS (rules review) |
| 4.5 | Admin создаёт/обновляет/удаляет любой документ | Разрешено | PASS (rules review) |

---

## Итог G5

- **Автотесты:** 13/13 PASS (`npx vitest run`)
- **Линтер:** 0 ошибок (`npm run lint`)
- **Сборка:** успешно (`npm run build`)
- **Ручная верификация:** Security Rules проверены через code review
