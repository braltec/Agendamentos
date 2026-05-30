const TIMEZONE = 'America/Sao_Paulo'

const VALID_PRESETS = new Set([
  'hoje',
  'ontem',
  'ultimos_7_dias',
  'ultimos_15_dias',
  'ultimos_30_dias',
  'mes_atual',
  'mes_anterior',
  'ultimos_3_meses',
  'ultimos_6_meses',
  'ultimos_12_meses',
  'personalizado',
])

function todayInTimezone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function parseDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(dateString, amount) {
  const parts = parseDateParts(dateString)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  date.setUTCDate(date.getUTCDate() + amount)
  return formatUtcDate(date)
}

function addMonths(dateString, amount) {
  const parts = parseDateParts(dateString)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  const originalDay = date.getUTCDate()

  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + amount)

  const lastDay = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0,
  )).getUTCDate()

  date.setUTCDate(Math.min(originalDay, lastDay))
  return formatUtcDate(date)
}

function startOfMonth(dateString) {
  const parts = parseDateParts(dateString)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-01`
}

function endOfMonth(dateString) {
  const parts = parseDateParts(dateString)
  const date = new Date(Date.UTC(parts.year, parts.month, 0))
  return formatUtcDate(date)
}

function ensureValidDate(value, fieldName) {
  if (!parseDateParts(value)) {
    const error = new Error(`${fieldName} inválida`)
    error.statusCode = 400
    throw error
  }
}

export function resolveDashboardPeriod(query = {}) {
  const preset = VALID_PRESETS.has(query.preset) ? query.preset : 'mes_atual'
  const today = todayInTimezone()
  let startDate
  let endDate

  switch (preset) {
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
      if (!query.startDate || !query.endDate) {
        const error = new Error('Informe data inicial e data final')
        error.statusCode = 400
        throw error
      }
      ensureValidDate(query.startDate, 'Data inicial')
      ensureValidDate(query.endDate, 'Data final')
      startDate = query.startDate
      endDate = query.endDate
      break
    case 'mes_atual':
    default:
      startDate = startOfMonth(today)
      endDate = endOfMonth(today)
      break
  }

  ensureValidDate(startDate, 'Data inicial')
  ensureValidDate(endDate, 'Data final')

  if (startDate > endDate) {
    const error = new Error('Data inicial não pode ser maior que a data final')
    error.statusCode = 400
    throw error
  }

  return {
    preset,
    startDate,
    endDate,
    endDateExclusive: addDays(endDate, 1),
    timezone: TIMEZONE,
  }
}
