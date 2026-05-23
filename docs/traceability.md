# Traceability Matrix

_Обновлено: 2026-05-23_

## Feature Traceability

| Feature | Issue | Stories | Spec | Arch | Статус |
|---------|-------|---------|------|------|--------|
| Инициализация CRM: структура + Firebase | #1 | #2, #3, #4, #5, #6 | docs/specs/feature-1-init-firebase.md | docs/arch/feature-1-init-firebase.md | ready-to-deploy |
| Справочник услуг | #18 | #28, #29, #30, #31, #32 | docs/specs/feature-18-service-catalog.md | docs/arch/feature-18-service-catalog.md | ready-for-dev |
| Modal-создание клиента и авто в wizard | #50 | #51, #52 | docs/specs/feature-50-modal-create-wizard.md | docs/arch/feature-50-modal-create-wizard.md | ready-for-dev |

## Story Traceability

| Story | Feature | Spec | Файлы кода | Тесты | TC |
|-------|---------|------|-----------|-------|----|
| #2 US-1: Структура папок | #1 | AC-1 | src/ (все поддиректории) | — | TC-01 |
| #3 US-2: firebase.js | #1 | AC-2, AC-3 | src/lib/firebase.js | authContext.test.jsx | TC-01 |
| #4 US-3: .env.example | #1 | AC-8 | .env.example | — | — |
| #5 US-4: Security Rules | #1 | AC-4 | firestore.rules | — | TC-04 |
| #6 US-5: AuthContext + useAuth | #1 | AC-5 | src/lib/authContext.jsx | authContext.test.jsx | TC-01 |
| #28 US-18-1: Список категорий и услуг | #18 | AC US-18-1 | src/pages/dashboard/ServicesPage.jsx | — | — |
| #29 US-18-2: CRUD категорий | #18 | AC US-18-2 | src/features/services/CategoryForm.jsx, CategoryList.jsx | — | — |
| #30 US-18-3: CRUD услуг | #18 | AC US-18-3 | src/features/services/ServiceForm.jsx, ServiceList.jsx | — | — |
| #31 US-18-4: Архивирование услуги | #18 | AC US-18-4 | src/features/services/ServiceCard.jsx | — | — |
| #32 US-18-5: Фильтрация по узлу | #18 | AC US-18-5 | src/features/services/ServiceList.jsx | — | — |
| #51 US-50-A: CreateClientModal в wizard | #50 | AC-1..6 | src/features/orders/wizard/CreateClientModal.jsx, WizardStep1Client.jsx | — | TC-50-01..04, TC-50-08 |
| #52 US-50-B: CreateVehicleModal в wizard | #50 | AC-7..12 | src/features/orders/wizard/CreateVehicleModal.jsx, WizardStep2Vehicle.jsx | — | TC-50-05..08 |

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
