/**
 * Константы модуля записей — статусы, цвета, переходы.
 *
 * Вынесены в отдельный файл, чтобы не нарушать react-refresh/only-export-components.
 *
 * @module appointmentConstants
 */

/** @type {Record<string, string>} */
export const STATUS_LABELS = {
  waiting:     'Ожидает',
  confirmed:   'Подтверждено',
  in_progress: 'В работе',
  done:        'Завершено',
  cancelled:   'Отменено',
}

/** Цвет текста/акцента для каждого статуса */
export const STATUS_COLORS = {
  waiting:     '#6b7280', // gray
  confirmed:   '#2563eb', // blue
  in_progress: '#d97706', // yellow/amber
  done:        '#16a34a', // green
  cancelled:   '#dc2626', // red
}

/** Цвет фона для каждого статуса */
export const STATUS_BG = {
  waiting:     '#f3f4f6',
  confirmed:   '#dbeafe',
  in_progress: '#fef3c7',
  done:        '#dcfce7',
  cancelled:   '#fee2e2',
}

/** Следующий статус в цепочке (для кнопки «→ Следующий») */
export const NEXT_STATUS = {
  waiting:     'confirmed',
  confirmed:   'in_progress',
  in_progress: 'done',
}

/** Метка кнопки перехода к следующему статусу */
export const NEXT_STATUS_LABEL = {
  confirmed:   'Подтвердить',
  in_progress: 'В работу',
  done:        'Завершить',
}
