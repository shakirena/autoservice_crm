# Traceability Matrix

_Обновлено: 2026-05-20_

## Feature Traceability

| Feature | Issue | Stories | Spec | Arch | Статус |
|---------|-------|---------|------|------|--------|
| Инициализация CRM: структура + Firebase | #1 | #2, #3, #4, #5, #6 | docs/specs/feature-1-init-firebase.md | docs/arch/feature-1-init-firebase.md | ready-to-deploy |

## Story Traceability

| Story | Feature | Spec | Файлы кода | Тесты | TC |
|-------|---------|------|-----------|-------|----|
| #2 US-1: Структура папок | #1 | AC-1 | src/ (все поддиректории) | — | TC-01 |
| #3 US-2: firebase.js | #1 | AC-2, AC-3 | src/lib/firebase.js | authContext.test.jsx | TC-01 |
| #4 US-3: .env.example | #1 | AC-8 | .env.example | — | — |
| #5 US-4: Security Rules | #1 | AC-4 | firestore.rules | — | TC-04 |
| #6 US-5: AuthContext + useAuth | #1 | AC-5 | src/lib/authContext.jsx | authContext.test.jsx | TC-01 |

## Code Coverage

| Файл | Тест-файл | Кейсов |
|------|-----------|--------|
| src/lib/authContext.jsx | src/lib/__tests__/authContext.test.jsx | 5 |
| src/services/users.js | src/services/__tests__/users.test.js | 4 |
| src/pages/LoginPage.jsx | src/pages/__tests__/LoginPage.test.jsx | 1 |
| src/pages/DashboardPage.jsx | src/pages/__tests__/DashboardPage.test.jsx | 3 |
| src/App.jsx | — | — |
| src/lib/firebase.js | — (мок в тестах) | — |
| firestore.rules | TC-04 ручная верификация | 5 |

_Заполняется doc-sync по мере работы pipeline_
