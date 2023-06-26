export function toBoolean(value: string | number | boolean) {
  // If undefined then consider false
  if (value === undefined) return false

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true' || value === '1') return true
    else return false
  }

  if (typeof value === 'number') {
    if (value <= 0) return false
    else return true
  }

  // fallback
  return false
}
