// ─── Styles ───────────────────────────────────────────────────────────────────

const fieldStyle = { marginBottom: '14px' }

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle = {
  ...inputStyle,
  background: '#fff',
}

// ─── Field renderers per component type ───────────────────────────────────────

function EngineParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Объём масла (л)</label>
        <input style={inputStyle} type="text" placeholder="4.5" {...register('componentParams.oilVolume')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Тип масла</label>
        <input style={inputStyle} type="text" placeholder="Моторное" {...register('componentParams.oilType')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Вязкость SAE (полная)</label>
        <input style={inputStyle} type="text" placeholder="5W-40" {...register('componentParams.saeFull')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Пробег (км)</label>
        <input style={inputStyle} type="text" placeholder="85000" {...register('componentParams.mileage')} />
      </div>
    </>
  )
}

function GearboxParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Тип трансмиссии</label>
        <select style={selectStyle} {...register('componentParams.transmissionType')}>
          <option value="">— Выберите —</option>
          <option value="manual">Механика</option>
          <option value="auto">Автомат</option>
          <option value="cvt">Вариатор</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Объём масла (л)</label>
        <input style={inputStyle} type="text" placeholder="2.0" {...register('componentParams.oilVolume')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Марка масла</label>
        <input style={inputStyle} type="text" placeholder="ATF Dexron VI" {...register('componentParams.oilBrand')} />
      </div>
    </>
  )
}

function SuspensionParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Дефекты</label>
        <input style={inputStyle} type="text" placeholder="Стук, износ сайлентблоков..." {...register('componentParams.defects')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Пробег (км)</label>
        <input style={inputStyle} type="text" placeholder="85000" {...register('componentParams.mileage')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Тип амортизаторов</label>
        <input style={inputStyle} type="text" placeholder="Газомасляные" {...register('componentParams.shockType')} />
      </div>
    </>
  )
}

function BrakesParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Тип колодок</label>
        <input style={inputStyle} type="text" placeholder="Ceramic" {...register('componentParams.padType')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Диаметр диска (мм)</label>
        <input style={inputStyle} type="text" placeholder="300" {...register('componentParams.discDiameter')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Ось</label>
        <select style={selectStyle} {...register('componentParams.axle')}>
          <option value="">— Выберите —</option>
          <option value="front">Передняя</option>
          <option value="rear">Задняя</option>
          <option value="all">Обе</option>
        </select>
      </div>
    </>
  )
}

function ElectricsParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Описание проблемы</label>
        <input style={inputStyle} type="text" placeholder="Не заводится, мигает сигнализация..." {...register('componentParams.description')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Код ошибки (OBD)</label>
        <input style={inputStyle} type="text" placeholder="P0301" {...register('componentParams.errorCode')} />
      </div>
    </>
  )
}

function TiresParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Размер шины</label>
        <input style={inputStyle} type="text" placeholder="205/55 R16" {...register('componentParams.tireSize')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Тип шины</label>
        <select style={selectStyle} {...register('componentParams.tireType')}>
          <option value="">— Выберите —</option>
          <option value="summer">Летние</option>
          <option value="winter">Зимние</option>
          <option value="allseason">Всесезонные</option>
        </select>
      </div>
    </>
  )
}

function BodyParams({ register }) {
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Повреждения</label>
        <input style={inputStyle} type="text" placeholder="Вмятина на двери, царапина на капоте..." {...register('componentParams.damages')} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Описание</label>
        <input style={inputStyle} type="text" placeholder="Дополнительные сведения..." {...register('componentParams.description')} />
      </div>
    </>
  )
}

function OtherParams({ register }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>Примечания</label>
      <input style={inputStyle} type="text" placeholder="Опишите задачу..." {...register('componentParams.notes')} />
    </div>
  )
}

// ─── Map component → params renderer ──────────────────────────────────────────

const PARAMS_RENDERERS = {
  engine: EngineParams,
  gearbox: GearboxParams,
  suspension: SuspensionParams,
  brakes: BrakesParams,
  electrics: ElectricsParams,
  tires: TiresParams,
  body: BodyParams,
  other: OtherParams,
}

/**
 * Шаг 4 мастера — параметры выбранного узла.
 * Динамически рендерит форму по vehicleComponent (ADR-21-03).
 *
 * @param {{
 *   vehicleComponent: string,
 *   register: Function,
 * }} props
 */
function WizardStep4Params({ vehicleComponent, register }) {
  const ParamsForm = PARAMS_RENDERERS[vehicleComponent]

  return (
    <div data-testid="wizard-step-4">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 4 из 7 — Параметры узла
      </h2>

      {!vehicleComponent ? (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Сначала выберите узел на предыдущем шаге.
        </p>
      ) : ParamsForm ? (
        <ParamsForm register={register} />
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Для данного типа узла параметры не требуются.
        </p>
      )}
    </div>
  )
}

export default WizardStep4Params
