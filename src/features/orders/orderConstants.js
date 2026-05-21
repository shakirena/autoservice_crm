/** @type {{ value: string, label: string }[]} */
export const VEHICLE_COMPONENT_OPTIONS = [
  { value: 'engine',     label: 'Двигатель' },
  { value: 'gearbox',    label: 'КПП' },
  { value: 'suspension', label: 'Подвеска' },
  { value: 'brakes',     label: 'Тормоза' },
  { value: 'electrics',  label: 'Электрика' },
  { value: 'tires',      label: 'Шины' },
  { value: 'body',       label: 'Кузов' },
  { value: 'other',      label: 'Прочее' },
]

export const ORDER_STATUSES = {
  draft:       { label: 'Черновик',   color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: 'В работе',   color: '#1d4ed8', bg: '#dbeafe' },
  completed:   { label: 'Выполнен',   color: '#065f46', bg: '#d1fae5' },
}
