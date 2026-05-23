# Feature #20 — База автомобилей: Test Cases

_Создано: 2026-05-20_

---

## TC-20-001: Таблица автомобилей отображается для admin и manager

**Priority:** High
**Type:** Functional
**Related AC:** US-20-1 (#39)

### Preconditions
- Пользователь авторизован с ролью admin (или manager)
- Firestore коллекция `vehicles` содержит 3 документа с полями make, model, year, licensePlate, vin, clientId

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/vehicles | Страница загружается без ошибок |
| 2 | Проверить наличие data-testid="vehicles-table" | Элемент таблицы присутствует в DOM |
| 3 | Проверить заголовки колонок | Видны колонки «Марка», «Модель», «Год», «Гос.номер», «VIN», «Клиент», «Действия» |
| 4 | Подсчитать строки таблицы | В таблице 3 строки автомобилей (data-testid="vehicle-row-{id}") |

### Expected Result
Таблица автомобилей отображается корректно со всеми семью колонками и тремя строками данных.

### Test Data
- vehicle-1: { make: "Toyota", model: "Camry", year: 2020, licensePlate: "AA1234BB", vin: "JT2BF22K100054321", clientId: "client-001" }
- vehicle-2: { make: "Ford", model: "Focus", year: 2018, licensePlate: "BB5678CC", vin: "1FADP3F20EL123456", clientId: "client-002" }
- vehicle-3: { make: "BMW", model: "X5", year: 2022, licensePlate: "CC9012DD", vin: "5UXKR0C58E0K12345", clientId: "client-003" }

---

## TC-20-002: Пустой список автомобилей — отображается заглушка

**Priority:** Medium
**Type:** Functional
**Related AC:** US-20-1 (#39)

### Preconditions
- Пользователь авторизован с ролью manager
- Firestore коллекция `vehicles` пуста (нет ни одного документа)

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/vehicles | Страница загружается без ошибок |
| 2 | Проверить наличие таблицы или заглушки | Таблица либо отсутствует, либо содержит 0 строк данных |
| 3 | Проверить наличие сообщения о пустом состоянии | Отображается понятный текст (например, «Автомобілів ще немає» / «Додайте перший автомобіль») |
| 4 | Убедиться, что нет спиннера или ошибок | Страница стабильна, индикатор загрузки не застывает |

### Expected Result
При отсутствии автомобилей в Firestore страница показывает корректное пустое состояние без ошибок и зависания загрузчика.

### Test Data
- Firestore collection `vehicles` — пуста

---

## TC-20-003: RBAC — mechanic заблокирован RoleGuard, редиректится с /dashboard/vehicles

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-20-1 (#39)

### Preconditions
- Пользователь авторизован с ролью mechanic
- Firestore содержит 2 автомобиля

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/vehicles | Происходит редирект (или отображается страница 403 / Forbidden) |
| 2 | Убедиться, что data-testid="vehicles-table" отсутствует | Таблица недоступна |
| 3 | Проверить URL после редиректа | Пользователь перенаправлен на /dashboard или страницу с сообщением об ошибке |

### Expected Result
RoleGuard перехватывает навигацию и запрещает механику доступ к /dashboard/vehicles. Данные автомобилей не загружаются и не рендерятся.

### Test Data
- user: { role: "mechanic", uid: "mech-001" }
- vehicles: [{ make: "Toyota", model: "Camry" }, { make: "Ford", model: "Focus" }]

---

## TC-20-004: Admin/manager успешно создаёт автомобиль, он появляется в таблице без перезагрузки

**Priority:** High
**Type:** Functional
**Related AC:** US-20-2 (#40)

### Preconditions
- Пользователь авторизован с ролью manager
- Страница /dashboard/vehicles открыта
- В таблице 0 автомобилей

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Нажать кнопку «+ Добавити автомобіль» (data-testid="create-vehicle-btn") | Открывается форма / модальное окно (data-testid="vehicle-form") |
| 2 | Ввести марку: "Honda" | Значение отображается в поле |
| 3 | Ввести модель: "Civic" | Значение отображается в поле |
| 4 | Ввести год: "2021" | Значение отображается в поле |
| 5 | Ввести гос. номер: "EE4321FF" | Значение отображается в поле |
| 6 | Ввести VIN: "2HGFB2F56BH123456" | Значение отображается в поле |
| 7 | Выбрать клиента из списка (data-testid="vehicle-client-select") | Клиент "Іваненко Іван" выбран |
| 8 | Нажать «Зберегти» (data-testid="submit-vehicle-btn") | Форма закрывается |
| 9 | Наблюдать за таблицей | Новая строка с маркой "Honda" и моделью "Civic" появляется без перезагрузки |

### Expected Result
Новый автомобиль сохраняется в Firestore `vehicles/{id}` с полями make, model, year, licensePlate, vin, clientId, createdAt. Строка появляется в таблице немедленно (оптимистичный апдейт или инвалидация кэша React Query).

### Test Data
- vehicle: { make: "Honda", model: "Civic", year: 2021, licensePlate: "EE4321FF", vin: "2HGFB2F56BH123456", clientId: "client-001" }
- client: { id: "client-001", fullName: "Іваненко Іван" }

---

## TC-20-005: Валидация — поле «Марка» обязательно, форма не отправляется если оно пустое

**Priority:** High
**Type:** Validation
**Related AC:** US-20-2 (#40)

### Preconditions
- Пользователь авторизован с ролью admin
- Форма создания автомобиля открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Оставить поле «Марка» пустым | Поле пустое |
| 2 | Ввести модель: "Focus", год: "2019", гос. номер: "FF1111GG" | Значения в полях |
| 3 | Нажать «Зберегти» (data-testid="submit-vehicle-btn") | Форма не отправляется |
| 4 | Проверить поле «Марка» | Отображается сообщение об ошибке валидации (data-testid="make-error") |
| 5 | Убедиться, что запросов к Firestore не было | В Network нет вызова на создание документа |

### Expected Result
React Hook Form блокирует отправку при пустом поле «Марка». Поле подсвечивается как невалидное с понятным сообщением. Firestore не вызывается.

### Test Data
- make: "" (пусто)
- model: "Focus"
- year: 2019
- licensePlate: "FF1111GG"

---

## TC-20-006: Валидация — поле «Год» принимает только значения в диапазоне 1900–currentYear

**Priority:** High
**Type:** Validation
**Related AC:** US-20-2 (#40)

### Preconditions
- Пользователь авторизован с ролью admin
- Форма создания автомобиля открыта

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Заполнить поля «Марка» и «Модель» корректными значениями | Значения в полях |
| 2 | Ввести год "1899" (меньше 1900) | Значение в поле |
| 3 | Нажать «Зберегти» | Форма не отправляется |
| 4 | Проверить поле «Год» | Отображается ошибка валидации: год должен быть не ранее 1900 |
| 5 | Ввести год "2027" (больше currentYear = 2026) | Значение в поле |
| 6 | Нажать «Зберегти» | Форма не отправляется |
| 7 | Проверить поле «Год» | Отображается ошибка валидации: год не может быть в будущем |
| 8 | Ввести год "2026" (граничное допустимое значение) | Значение в поле |
| 9 | Нажать «Зберегти» | Форма отправляется успешно |

### Expected Result
React Hook Form применяет правила min(1900) и max(currentYear) для поля «Год». Некорректные значения блокируют отправку с понятными сообщениями. Граничное значение currentYear принимается.

### Test Data
- invalid years: [1899, 2027]
- boundary valid year: 2026 (currentYear)
- make: "Renault", model: "Logan"

---

## TC-20-007: Admin/manager успешно редактирует гос. номер автомобиля, таблица обновляется без перезагрузки

**Priority:** High
**Type:** Functional
**Related AC:** US-20-3 (#41)

### Preconditions
- Пользователь авторизован с ролью admin
- Страница /dashboard/vehicles открыта
- В таблице присутствует автомобиль { make: "Toyota", model: "Camry", licensePlate: "AA1234BB" } с id="vehicle-001"

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Найти строку автомобиля "Toyota Camry" | Строка (data-testid="vehicle-row-vehicle-001") видна |
| 2 | Нажать кнопку редактирования (data-testid="edit-vehicle-btn-vehicle-001") | Открывается форма (data-testid="vehicle-form") |
| 3 | Проверить, что форма предзаполнена | Поля содержат текущие данные: make="Toyota", model="Camry", licensePlate="AA1234BB" |
| 4 | Очистить поле «Гос. номер» и ввести "AA9999ZZ" | Новое значение в поле |
| 5 | Нажать «Зберегти» (data-testid="submit-vehicle-btn") | Форма закрывается |
| 6 | Найти строку автомобиля в таблице | Строка (data-testid="vehicle-row-vehicle-001") по-прежнему присутствует |
| 7 | Проверить отображаемый гос. номер | В колонке «Гос.номер» отображается "AA9999ZZ" |

### Expected Result
Документ `vehicles/vehicle-001` обновлён в Firestore с новым гос. номером. Таблица отражает изменения без перезагрузки страницы.

### Test Data
- existing vehicle: { id: "vehicle-001", make: "Toyota", model: "Camry", licensePlate: "AA1234BB" }
- updated licensePlate: "AA9999ZZ"

---

## TC-20-008: Закрытие формы редактирования без сохранения не изменяет данные

**Priority:** Medium
**Type:** Functional / Edge Case
**Related AC:** US-20-3 (#41)

### Preconditions
- Пользователь авторизован с ролью admin
- В таблице присутствует автомобиль { make: "Ford", model: "Focus", licensePlate: "BB5678CC" }
- Форма редактирования открыта и предзаполнена данными

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Убедиться, что форма открыта с данными автомобиля | Поля содержат make="Ford", model="Focus", licensePlate="BB5678CC" |
| 2 | Изменить гос. номер на "XX0000YY" | Новое значение в поле формы |
| 3 | Нажать «Скасувати» (Cancel) или закрыть модальное окно крестиком | Форма закрывается |
| 4 | Найти строку автомобиля в таблице | Строка присутствует |
| 5 | Проверить гос. номер в таблице | Гос. номер остаётся "BB5678CC" (исходное значение) |
| 6 | Убедиться, что запросов к Firestore не было | В Network нет вызова updateDoc |

### Expected Result
Отмена редактирования не сохраняет никаких изменений. Данные в Firestore и в таблице остаются неизменными.

### Test Data
- existing vehicle: { make: "Ford", model: "Focus", licensePlate: "BB5678CC" }
- introduced (but cancelled) change: licensePlate = "XX0000YY"

---

## TC-20-009: RBAC — manager может редактировать автомобиль

**Priority:** High
**Type:** Security / RBAC
**Related AC:** US-20-3 (#41)

### Preconditions
- Пользователь авторизован с ролью manager
- В таблице присутствует автомобиль { make: "BMW", model: "X5", licensePlate: "CC9012DD" } с id="vehicle-002"

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Перейти на /dashboard/vehicles | Страница загружается, таблица с автомобилями отображается |
| 2 | Найти кнопку data-testid="edit-vehicle-btn-vehicle-002" | Кнопка присутствует в DOM |
| 3 | Нажать кнопку редактирования | Форма открывается с предзаполненными данными |
| 4 | Изменить модель на "X7" и сохранить | Форма закрывается, в таблице строка обновлена: model="X7" |

### Expected Result
Manager имеет право редактировать автомобили наравне с admin. Кнопки редактирования присутствуют, форма открывается, изменения сохраняются успешно.

### Test Data
- user: { role: "manager", uid: "mgr-001" }
- vehicle: { id: "vehicle-002", make: "BMW", model: "X5", licensePlate: "CC9012DD" }
- updated model: "X7"

---

## TC-20-010: Поиск по марке фильтрует таблицу автомобилей в реальном времени

**Priority:** High
**Type:** Functional
**Related AC:** US-20-1 (#39)

### Preconditions
- Пользователь авторизован с ролью manager
- Страница /dashboard/vehicles загружена с 4 автомобилями в таблице

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Найти поле поиска (data-testid="vehicles-search-input") | Поле присутствует и пустое |
| 2 | Ввести "toyota" (нижний регистр) | Символы вводятся |
| 3 | Подождать не более 300 мс (debounce) | Таблица обновляется |
| 4 | Подсчитать строки таблицы | Отображаются только автомобили, у которых make содержит «toyota» (без учёта регистра) |
| 5 | Убедиться, что Ford, BMW, Honda скрыты | Строки других марок не отображаются |
| 6 | Убедиться, что сетевой запрос не выполнялся | В Network нет новых вызовов к Firestore |

### Expected Result
Таблица фильтруется клиентски (client-side) без обращения к Firestore. Поиск нечувствителен к регистру. Видны только строки с совпадением в поле make.

### Test Data
- vehicles: [{ make: "Toyota", model: "Camry" }, { make: "Toyota", model: "RAV4" }, { make: "Ford", model: "Focus" }, { make: "BMW", model: "X5" }]
- search query: "toyota"
- expected matches: "Toyota Camry", "Toyota RAV4"

---

## TC-20-011: Очищение поля поиска показывает все автомобили

**Priority:** Medium
**Type:** Functional / Edge Case
**Related AC:** US-20-1 (#39)

### Preconditions
- Пользователь авторизован с ролью manager
- Страница /dashboard/vehicles загружена с 4 автомобилями
- В поле поиска введён запрос "toyota", таблица показывает 2 совпадения

### Steps
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Убедиться, что в таблице 2 строки (результат поиска "toyota") | Таблица отфильтрована |
| 2 | Очистить поле поиска (удалить все символы) | Поле пустое |
| 3 | Подождать не более 300 мс | Таблица обновляется |
| 4 | Подсчитать строки таблицы | Отображаются все 4 автомобиля |
| 5 | Убедиться, что нет сетевых запросов | В Network нет новых вызовов к Firestore |

### Expected Result
При пустой строке поиска фильтр сбрасывается и в таблице отображаются все автомобили. Сетевого запроса не происходит.

### Test Data
- vehicles: [{ make: "Toyota", model: "Camry" }, { make: "Toyota", model: "RAV4" }, { make: "Ford", model: "Focus" }, { make: "BMW", model: "X5" }]
- initial search query: "toyota" → 2 results
- cleared query: "" → 4 results
