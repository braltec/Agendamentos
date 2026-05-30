export const DASHBOARD_PERIOD_PRESETS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'ultimos_7_dias', label: 'Últimos 7 dias' },
  { value: 'ultimos_15_dias', label: 'Últimos 15 dias' },
  { value: 'ultimos_30_dias', label: 'Últimos 30 dias' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'ultimos_3_meses', label: 'Últimos 3 meses' },
  { value: 'ultimos_6_meses', label: 'Últimos 6 meses' },
  { value: 'ultimos_12_meses', label: 'Últimos 12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
]

const VALID_PRESETS = new Set(DASHBOARD_PERIOD_PRESETS.map((preset) => preset.value))

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseInputDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null
  }

  return date
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date, amount) {
  const next = new Date(date)
  const originalDay = next.getDate()

  next.setDate(1)
  next.setMonth(next.getMonth() + amount)

  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(originalDay, lastDay))
  return next
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function getPresetLabel(preset) {
  return DASHBOARD_PERIOD_PRESETS.find((item) => item.value === preset)?.label || 'Mês atual'
}

export function formatDisplayDate(value) {
  const date = parseInputDate(value)
  if (!date) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getDateRangeFromPreset(preset = 'mes_atual', customStartDate, customEndDate) {
  const safePreset = VALID_PRESETS.has(preset) ? preset : 'mes_atual'
  const today = new Date()
  let startDate
  let endDate

  switch (safePreset) {
    case 'hoje':
      startDate = today
      endDate = today
      break
    case 'ontem':
      startDate = addDays(today, -1)
      endDate = startDate
      break
    case 'ultimos_7_dias':
      startDate = addDays(today, -6)
      endDate = today
      break
    case 'ultimos_15_dias':
      startDate = addDays(today, -14)
      endDate = today
      break
    case 'ultimos_30_dias':
      startDate = addDays(today, -29)
      endDate = today
      break
    case 'mes_anterior': {
      const previousMonth = addMonths(startOfMonth(today), -1)
      startDate = startOfMonth(previousMonth)
      endDate = endOfMonth(previousMonth)
      break
    }
    case 'ultimos_3_meses':
      startDate = addDays(addMonths(today, -3), 1)
      endDate = today
      break
    case 'ultimos_6_meses':
      startDate = addDays(addMonths(today, -6), 1)
      endDate = today
      break
    case 'ultimos_12_meses':
      startDate = addDays(addMonths(today, -12), 1)
      endDate = today
      break
    case 'personalizado':
      startDate = parseInputDate(customStartDate)
      endDate = parseInputDate(customEndDate)
      break
    case 'mes_atual':
    default:
      startDate = startOfMonth(today)
      endDate = endOfMonth(today)
      break
  }

  return {
    preset: safePreset,
    startDate: startDate ? formatDateInput(startDate) : '',
    endDate: endDate ? formatDateInput(endDate) : '',
  }
}

export function validateDateRange(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Informe data inicial e data final.'
  }

  const startDate = parseInputDate(dateRange.startDate)
  const endDate = parseInputDate(dateRange.endDate)

  if (!startDate || !endDate) {
    return 'Informe datas válidas.'
  }

  if (dateRange.startDate > dateRange.endDate) {
    return 'A data inicial não pode ser maior que a data final.'
  }

  return ''
}

export function buildDateRangeLabel(dateRange) {
  const presetLabel = getPresetLabel(dateRange?.preset)
  const start = formatDisplayDate(dateRange?.startDate)
  const end = formatDisplayDate(dateRange?.endDate)

  if (!start || !end) return presetLabel
  if (dateRange?.startDate === dateRange?.endDate) return `${presetLabel}: ${start}`
  return `${presetLabel}: ${start} a ${end}`
}

export function readDateRangeFromSearchParams(searchParams) {
  const preset = searchParams.get('preset') || 'mes_atual'
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  if (preset === 'personalizado') {
    const range = getDateRangeFromPreset('personalizado', startDate, endDate)
    return validateDateRange(range) ? getDateRangeFromPreset('mes_atual') : range
  }

  return getDateRangeFromPreset(preset)
}
