const SENSITIVE_KEY_PATTERN = /(senha|password|token|secret|api[_-]?key|authorization|jwt|refresh|payload|webhook|mensagem|message|telefone|whatsapp|gcalendar_id|instancia_id|conecta_db)/i

function maskIdentifier(value) {
  const text = String(value)
  if (text.length <= 8) return '[REDACTED]'
  return `${text.slice(0, 4)}...${text.slice(-4)}`
}

function sanitizeValue(key, value) {
  if (value instanceof Error) {
    return {
      message: value.message,
      ...(process.env.NODE_ENV === 'development' && { stack: value.stack }),
    }
  }

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return typeof value === 'string' ? maskIdentifier(value) : '[REDACTED]'
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(key, item))
  }

  if (value && typeof value === 'object') {
    return sanitizeMeta(value)
  }

  return value
}

export function sanitizeMeta(meta = {}) {
  return Object.entries(meta).reduce((acc, [key, value]) => {
    acc[key] = sanitizeValue(key, value)
    return acc
  }, {})
}

function write(level, message, meta) {
  const sanitized = sanitizeMeta(meta)
  const output = Object.keys(sanitized).length > 0
    ? [message, sanitized]
    : [message]

  if (level === 'error') {
    console.error(...output)
    return
  }

  if (level === 'warn') {
    console.warn(...output)
    return
  }

  console.log(...output)
}

export const logger = {
  info(message, meta = {}) {
    write('info', message, meta)
  },
  warn(message, meta = {}) {
    write('warn', message, meta)
  },
  error(message, meta = {}) {
    write('error', message, meta)
  },
}
