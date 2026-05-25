import { useState, useRef, useCallback } from 'react'

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapStyle = { position: 'relative', width: '100%' }

const inputBase = {
  width: '100%',
  padding: '9px 36px 9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  cursor: 'text',
}

const inputErrorStyle  = { ...inputBase, borderColor: '#ef4444' }
const inputLoadStyle   = { ...inputBase, color: '#9ca3af', cursor: 'not-allowed' }

const chevronStyle = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: '#9ca3af',
  fontSize: '11px',
  userSelect: 'none',
}

const dropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  maxHeight: '220px',
  overflowY: 'auto',
  zIndex: 100,
}

const optBase = { padding: '9px 12px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }
const optHover    = { ...optBase, background: '#eff6ff' }
const optSelected = { ...optBase, background: '#dbeafe', fontWeight: 600 }
const optEmpty    = { ...optBase, color: '#9ca3af', cursor: 'default', textAlign: 'center' }

/**
 * Searchable combobox — замена нативного <select> с фильтрацией по тексту.
 *
 * Интеграция с React Hook Form через скрытый <input type="hidden"> + setValue:
 *   1. зарегистрируй <input type="hidden" {...register('fieldName', rules)} />
 *   2. передай watch('fieldName') как value
 *   3. передай коллбэк, который вызывает setValue('fieldName', id) как onChange
 *
 * Компонент НЕ вызывает setState внутри useEffect — displayValue вычисляется
 * напрямую из props (value + options), что устраняет cascading renders.
 *
 * @param {{
 *   options:     { value: string, label: string, sublabel?: string }[],
 *   value:       string,
 *   onChange:    (value: string) => void,
 *   placeholder?: string,
 *   loading?:    boolean,
 *   hasError?:   boolean,
 *   testId?:     string,
 * }} props
 */
function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '— Выберите —',
  loading = false,
  hasError = false,
  testId,
}) {
  // query — текст поиска, непустой когда пользователь печатает
  const [query, setQuery]           = useState('')
  const [isFiltering, setIsFiltering] = useState(false) // пользователь что-то набрал
  const [isOpen, setIsOpen]         = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  // Предотвращает закрытие по onBlur при клике на опцию
  const skipBlurRef = useRef(false)

  // Метка выбранного элемента — вычисляем из props, без useEffect
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  // Что показывается в input: при фильтрации — поисковый запрос, иначе — метка
  const displayValue = isFiltering ? query : selectedLabel

  // Фильтруем список при активном поиске, иначе показываем всё
  const filtered = isFiltering
    ? options.filter((o) => {
        const q = query.toLowerCase()
        return (
          o.label.toLowerCase().includes(q) ||
          (o.sublabel ?? '').toLowerCase().includes(q)
        )
      })
    : options

  const openDropdown = useCallback(() => {
    setIsOpen(true)
    setHighlighted(0)
  }, [])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setIsFiltering(false)
    setQuery('')
  }, [])

  function handleInputChange(e) {
    const v = e.target.value
    setQuery(v)
    setHighlighted(0)

    if (v === '') {
      // Пустое поле — сбрасываем выбор и выходим из режима фильтрации
      setIsFiltering(false)
      onChange('')
      setIsOpen(true)
    } else {
      setIsFiltering(true)
      setIsOpen(true)
    }
  }

  function selectOption(opt) {
    onChange(opt.value)
    setIsFiltering(false)
    setQuery('')
    setIsOpen(false)
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') openDropdown()
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[highlighted]) selectOption(filtered[highlighted])
        break
      case 'Escape':
        closeDropdown()
        break
      default:
        break
    }
  }

  function handleBlur() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    closeDropdown()
  }

  const resolvedInputStyle = loading ? inputLoadStyle : hasError ? inputErrorStyle : inputBase

  return (
    <div style={wrapStyle}>
      <input
        data-testid={testId}
        type="text"
        value={displayValue}
        placeholder={loading ? 'Загрузка...' : placeholder}
        disabled={loading}
        autoComplete="off"
        style={resolvedInputStyle}
        onChange={handleInputChange}
        onFocus={openDropdown}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      <span style={chevronStyle} aria-hidden="true">{isOpen ? '▲' : '▼'}</span>

      {isOpen && !loading && (
        <div
          role="listbox"
          data-testid={testId ? `${testId}-dropdown` : undefined}
          style={dropdownStyle}
        >
          {filtered.length === 0 ? (
            <div
              style={optEmpty}
              data-testid={testId ? `${testId}-empty` : undefined}
            >
              Ничего не найдено
            </div>
          ) : (
            filtered.map((opt, i) => {
              const isSel  = opt.value === value
              const isHigh = i === highlighted
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSel}
                  data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
                  style={isSel ? optSelected : isHigh ? optHover : optBase}
                  onMouseDown={() => { skipBlurRef.current = true }}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <div>{opt.label}</div>
                  {opt.sublabel && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {opt.sublabel}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
