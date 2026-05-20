# AutoService CRM — Project Context

## Стек

- **Frontend:** React 19 + Vite 8
- **Routing:** React Router DOM 7
- **State:** Zustand 5
- **Data fetching:** TanStack React Query 5
- **Forms:** React Hook Form 7
- **Backend / DB:** Firebase (Firestore, Auth, Storage)
- **Language:** JavaScript (ESM)
- **Linter:** ESLint 10

## Структура проекта

```
src/
├── components/     # Переиспользуемые UI-компоненты
├── pages/          # Страницы (роуты)
├── features/       # Feature-модули (бизнес-логика)
├── services/       # Firebase-сервисы (Firestore CRUD)
├── hooks/          # Кастомные React-хуки
├── store/          # Zustand-сторы
├── lib/            # Инициализация Firebase и утилиты
└── types/          # JSDoc typedef / PropTypes
```

## Build-команды

```bash
npm run dev       # Dev-сервер (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint проверка
npm run preview   # Preview production build
```

## Test-команды

```bash
# Unit-тесты (когда будут добавлены)
npm test
npm run test:coverage
```

## Ролевая модель (RBAC)

| Роль | Права |
|------|-------|
| `admin` | Полный доступ |
| `manager` | CRM-операции, нет настроек системы |
| `mechanic` | Просмотр + редактирование заказов |
| `client` | Только свои заказы |

Роль хранится в Firebase Auth custom claims и Firestore `users/{uid}.role`.

## Deploy

```bash
npm run build
# Статика из dist/ деплоится на Firebase Hosting
firebase deploy --only hosting
```

## Firebase проект

Конфиг в `src/lib/firebase.js`. Переменные окружения в `.env.local`.

## Агентская система

Документация: `.claude/AGENTS_FRAMEWORK.md`

Быстрый старт:
- `/setup-board` — инициализировать GitHub labels + Project Board (один раз)
- `/feature <описание>` — создать новую фичу
- `/kanban <описание>` — полный pipeline от идеи до staging
