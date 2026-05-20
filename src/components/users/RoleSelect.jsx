/**
 * Переиспользуемый select для выбора роли сотрудника.
 *
 * @param {{
 *   value: string,
 *   onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
 *   disabled?: boolean,
 *   id?: string,
 *   style?: React.CSSProperties,
 * }} props
 */

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Менеджер' },
  { value: 'mechanic', label: 'Механик' },
  { value: 'admin', label: 'Администратор' },
]

function RoleSelect({ value, onChange, disabled = false, id, style }) {
  const baseStyle = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: disabled ? '#f9fafb' : '#fff',
    color: disabled ? '#6b7280' : '#111827',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: '100%',
    ...style,
  }

  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={baseStyle}
    >
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default RoleSelect
