# TC — Feature #57: Таблицы данных

Покрывает Story #58 (DataTable), Story #59 (ServiceTable / VehicleTable), Story #60 (OrderTable).

---

## DataTable (shared primitives) — Story #58

| ID | Название | Steps | Expected |
|----|----------|-------|----------|
| TC-57-01 | `rowStyle` возвращает белый фон для чётной строки | Вызвать `rowStyle(0)` и `rowStyle(2)` | `background === '#ffffff'` |
| TC-57-02 | `rowStyle` возвращает серый фон для нечётной строки | Вызвать `rowStyle(1)` и `rowStyle(3)` | `background === '#f9fafb'` |
| TC-57-03 | `SkeletonRow` рендерит ровно N ячеек (cols=3) | Рендер `<SkeletonRow cols={3} />` | В DOM 3 элемента `<td>` |
| TC-57-04 | `SkeletonRow` рендерит ровно N ячеек (cols=6) | Рендер `<SkeletonRow cols={6} />` | В DOM 6 элементов `<td>` |
| TC-57-05 | `EmptyRow` показывает дефолтное сообщение | Рендер `<EmptyRow cols={3} />` без `message` | Текст «Нет данных» в DOM |
| TC-57-06 | `EmptyRow` показывает кастомный `message` | Рендер `<EmptyRow cols={3} message="Услуги не найдены" />` | Текст «Услуги не найдены» в DOM |
| TC-57-07 | `EmptyRow` применяет `colSpan` равный `cols` | Рендер `<EmptyRow cols={5} />` | `td[colspan="5"]` в DOM |
| TC-57-08 | `ErrorRow` рендерит переданный `message` | Рендер `<ErrorRow cols={3} message="Ошибка загрузки" />` | Текст «Ошибка загрузки» в DOM |
| TC-57-09 | `ErrorRow` показывает текст красным цветом | Рендер `<ErrorRow cols={3} message="Ошибка" />` | `td` имеет `color: #ef4444` |

---

## ServiceTable — Story #59

| ID | Название | Steps | Expected |
|----|----------|-------|----------|
| TC-57-10 | Скелетон при загрузке | `isLoading=true` → рендер `ServiceTable` | Строки данных отсутствуют, таблица в DOM |
| TC-57-11 | Блок ошибки при `isError=true` | `isError=true`, `error.message="Firestore error"` | Текст «Ошибка загрузки услуг» виден |
| TC-57-12 | Пустое состояние при `services=[]` | `services=[]` → рендер | Текст «Услуги не найдены» виден |
| TC-57-13 | Строки для каждой услуги | `services=[{id:'svc1',...},{id:'svc2',...}]` | `[data-testid="service-table-row-svc1"]` и `...-svc2` в DOM |
| TC-57-14 | Название услуги | Рендер с services, проверить `data-testid="service-table-name-{id}"` | Содержит `service.name` |
| TC-57-15 | Форматированная цена с ₼ | `price=250` | `service-table-price-{id}` содержит «250» и «₼» |
| TC-57-16 | «Не указана» при `price=null` | `price=null` | `service-table-price-{id}` содержит «Не указана» |
| TC-57-17 | Статус «Активна» для `archived=false` | `archived=false` | `service-table-status-{id}` содержит «Активна» |
| TC-57-18 | Статус «Архив» для `archived=true` | `archived=true` | `service-table-status-{id}` содержит «Архив» |
| TC-57-19 | Кнопки действий скрыты для `isAdmin=false` | `isAdmin=false` | `service-table-edit-{id}` и `service-table-archive-{id}` отсутствуют |
| TC-57-20 | Кнопка редактировать видна для `isAdmin=true` | `isAdmin=true` | `service-table-edit-{id}` в DOM |
| TC-57-21 | `onEdit` вызывается при клике на «Редактировать» | `isAdmin=true`, клик на `service-table-edit-{id}` | `onEdit` вызван с объектом услуги |
| TC-57-22 | Категория по имени (не по id) | `categoryId='cat1'`, categories=[{id:'cat1', name:'Двигатель'}] | Строка содержит «Двигатель» |

---

## VehicleTable — Story #59

| ID | Название | Steps | Expected |
|----|----------|-------|----------|
| TC-57-23 | Скелетон при `isLoading=true` | `isLoading=true` → рендер | `[data-testid="vehicles-skeleton"]` в DOM |
| TC-57-24 | Пустое состояние при `vehicles=[]` | `vehicles=[]`, `isLoading=false` | `[data-testid="vehicles-empty"]` в DOM |
| TC-57-25 | Строки с `vehicle-table-row-{id}` | `vehicles=[{id:'v1',...},{id:'v2',...}]` | Оба `data-testid` в DOM |
| TC-57-26 | Марка и модель в одной колонке | `make='Toyota'`, `model='Camry'` | `vehicle-table-make-model-{id}` содержит «Toyota» и «Camry» |
| TC-57-27 | Год (vehicle-table-year-{id}) | `year=2020` | `vehicle-table-year-{id}` содержит «2020» |
| TC-57-28 | Гос. номер (vehicle-table-plate-{id}) | `licensePlate='10-AA-001'` | `vehicle-table-plate-{id}` содержит «10-AA-001» |
| TC-57-29 | Кнопка «Редактировать» видна для `role='admin'` | `role='admin'` | `btn-edit-vehicle-{id}` в DOM |
| TC-57-30 | Кнопка «Редактировать» видна для `role='manager'` | `role='manager'` | `btn-edit-vehicle-{id}` в DOM |
| TC-57-31 | Кнопки скрыты для `role='mechanic'` | `role='mechanic'` | `btn-edit-vehicle-{id}` отсутствует |

---

## OrderTable — Story #60

| ID | Название | Steps | Expected |
|----|----------|-------|----------|
| TC-57-32 | Скелетон при `isLoading=true` | `isLoading=true, orders=[]` → рендер | Строки данных отсутствуют, `order-table` в DOM |
| TC-57-33 | Блок ошибки при `isError=true` | `isError=true, error.message="..."` | Текст «Ошибка загрузки заказов» виден |
| TC-57-34 | Пустое состояние при `orders=[]` | `orders=[]`, `isError=false` | Текст «Заказов пока нет.» виден |
| TC-57-35 | Строки `order-table-row-{id}` | `orders=[{id:'o1',...},...]` | Все `data-testid` в DOM |
| TC-57-36 | Порядковый номер 1, 2, 3 | Три заказа без фильтра | Первая `<td>` в строках содержит 1, 2, 3 |
| TC-57-37 | Статус badge `order-table-status-{id}` | Рендер с заказами | `data-testid` присутствует |
| TC-57-38 | Сумма с ₼ (`order-table-total-{id}`) | `totalAmount=1500` | Содержит «1» и «₼» |
| TC-57-39 | «—» при `totalAmount=null` | `totalAmount=null` | `order-table-total-{id}` содержит «—» |
| TC-57-40 | Кнопка «Открыть» присутствует | Рендер с заказами | `order-table-open-{id}` в DOM |
| TC-57-41 | Клик на «Открыть» вызывает navigate | Клик на `order-table-open-o1` | `navigate('/dashboard/orders/o1')` вызван |
| TC-57-42 | Статус «completed» → зелёный badge | `status='completed'` | `badge` имеет `background: #d1fae5`, текст «Выполнен» |
| TC-57-43 | Статус «draft» → серый badge | `status='draft'` | `badge` имеет `background: #f3f4f6`, текст «Черновик» |
| TC-57-44 | Фильтрация по `statusFilter` | `statusFilter='draft'`, orders содержит draft и completed | Показан только draft-заказ |

---

## Итог

| Компонент | TC-IDs | Кол-во |
|-----------|--------|--------|
| DataTable (primitives) | TC-57-01 — TC-57-09 | 9 |
| ServiceTable | TC-57-10 — TC-57-22 | 13 |
| VehicleTable | TC-57-23 — TC-57-31 | 9 |
| OrderTable | TC-57-32 — TC-57-44 | 13 |
| **Итого** | | **44** |

Все тест-кейсы покрыты автоматическими unit-тестами (220/220 pass).
