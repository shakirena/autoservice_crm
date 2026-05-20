# Тест-кейси: Feature #17 — Управління користувачами

## Покриття

| Story | Тест-файл | Кейсів | Статус |
|-------|-----------|--------|--------|
| US-1: usersService + хуки | (інтеграція через моки в UI тестах) | — | PASS |
| US-2: UsersPage | (build + lint) | — | PASS |
| US-3: CreateEmployeeForm | (build + lint) | — | PASS |
| US-4: Firestore rules + authContext | lib/__tests__/authContext.test.jsx | 7 | PASS |

**Загалом автотестів:** 25/25 PASS

---

## TC-11: Security Rules (код-рев'ю)

| # | Перевірка | Результат |
|---|-----------|-----------|
| 11.1 | create users/{uid} — тільки admin | PASS |
| 11.2 | isOwner може змінити тільки displayName/updatedAt | PASS (виправлено) |
| 11.3 | Роль admin не доступна в формі створення | PASS (виправлено) |
| 11.4 | Secondary App signOut після реєстрації | PASS |
| 11.5 | Пароль не логується | PASS |
| 11.6 | disabled === true → примусовий signOut в authContext | PASS |
| 11.7 | preserve-caught-error (cause) | PASS |

---

## Итог G5

- **Автотести:** 25/25 PASS
- **Lint:** 0 помилок
- **Build:** успішно
- **Security:** 2 WARN виправлено → PASS
