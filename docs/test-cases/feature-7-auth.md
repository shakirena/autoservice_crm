# Тест-кейсы: Feature #7 — Модуль аутентификации

## Покрытие

| Story | Файл тестов | Кейсов | Статус |
|-------|-------------|--------|--------|
| US-1: authService | (мок в LoginPage тестах) | — | PASS |
| US-2: authStore | (интеграция через authContext) | — | PASS |
| US-3: LoginPage форма | pages/__tests__/LoginPage.test.jsx | 8 | PASS |
| US-4: AuthContext + Firestore роль | lib/__tests__/authContext.test.jsx | 7 | PASS |

**Итого автотестов:** 23/23 PASS

---

## TC-05: LoginPage — форма входа

**Файл:** `src/pages/__tests__/LoginPage.test.jsx`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 5.1 | Рендер страницы | Заголовок AutoService CRM, подзаголовок, форма | PASS |
| 5.2 | Поля и кнопка отображаются | email-input, password-input, submit-button | PASS |
| 5.3 | Отправка пустой формы | Ошибки валидации для email и password | PASS |
| 5.4 | Некорректный формат email | Ошибка "Введите корректный email" | PASS |
| 5.5 | Пароль короче 6 символов | Ошибка "не менее 6 символов" | PASS |
| 5.6 | Успешный вызов loginWithEmail | Вызван с правильными email + password | PASS |
| 5.7 | Firebase ошибка auth/invalid-credential | Отображает "Неверный email или пароль" (по-русски) | PASS |
| 5.8 | Firebase ошибка auth/too-many-requests | Отображает "Слишком много попыток" | PASS |
| 5.9 | Состояние загрузки | Кнопка disabled, spinner видим | PASS |

---

## TC-06: AuthContext — интеграция с Firestore и Zustand

**Файл:** `src/lib/__tests__/authContext.test.jsx`

| # | Сценарий | Ожидаемый результат | Статус |
|---|----------|---------------------|--------|
| 6.1 | Инициализация (auth pending) | loading spinner | PASS |
| 6.2 | Пользователь вошёл, роль в Firestore = admin | user.email + role=admin через useAuth | PASS |
| 6.3 | Поле role отсутствует в документе | role=client (fallback) | PASS |
| 6.4 | Документ users/{uid} не существует | role=client (fallback) | PASS |
| 6.5 | Ошибка Firestore при чтении | user установлен, role=client (fallback) | PASS |
| 6.6 | Выход из системы | user=null, role=null | PASS |
| 6.7 | useAuth вне AuthProvider | Выбрасывает ошибку с понятным сообщением | PASS |

---

## TC-07: Security (код-ревью)

| # | Проверка | Результат |
|---|----------|-----------|
| 7.1 | Нет жёстко прописанных credentials | PASS |
| 7.2 | Firebase коды ошибок не раскрываются пользователю | PASS |
| 7.3 | Роль читается из Firestore по auth.uid (не из user input) | PASS |
| 7.4 | Нет console.log с паролями или токенами | PASS |
| 7.5 | loginWithEmail пробрасывает ошибки до UI | PASS |
| 7.6 | Нет XSS в JSX | PASS |
| 7.7 | loading=true при старте предотвращает race condition | PASS |
| 7.8 | Ошибка Firestore логируется без чувствительных данных | PASS (исправлено) |

---

## Итог G5

- **Автотесты:** 23/23 PASS
- **Линтер:** 0 ошибок
- **Сборка:** успешно
- **Security review:** PASS (1 WARN исправлен)
