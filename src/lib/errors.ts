// Supabase errors → Spanish, per ../beekeeper/docs/api.md → Errors and Auth. Shared by every module.

export const minPasswordLength = 8
export const passwordTooShort = `La contraseña debe tener al menos ${minPasswordLength} caracteres.`

const generic = 'Algo salió mal. Inténtalo de nuevo.'
const network = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'

/** RPC/trigger `details` whose app copy replaces the server's message. */
const detailMessages: Record<string, string> = {
  invalid_code: 'El código no es válido, ya se usó o venció. Pide uno nuevo al propietario.',
  invalid_name: 'Escribe un nombre de 1 a 120 caracteres.',
}

/** `23505`: the constraint name comes in `message`. */
const uniqueViolations: Record<string, { code: string; message: string }> = {
  organization_invites_code_key: {
    code: 'code_collision',
    message: 'No pudimos crear el código. Inténtalo de nuevo.',
  },
  apiaries_org_name_key: {
    code: 'duplicate_name',
    message: 'Ya tienes un apiario con ese nombre.',
  },
  hives_apiary_name_key: {
    code: 'duplicate_name',
    message: 'Ya hay una colmena con ese nombre en este apiario.',
  },
  hives_qr_code_key: { code: 'qr_taken', message: 'Ese código QR ya está en uso en otra colmena.' },
}

function uniqueViolation(message: unknown) {
  const constraint = Object.keys(uniqueViolations).find((c) => str(message)?.includes(c))
  return constraint ? uniqueViolations[constraint] : undefined
}

const authMessages: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.',
  email_exists: 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.',
  weak_password: passwordTooShort,
  validation_failed: 'Revisa el correo y la contraseña.',
  over_request_rate_limit: 'Demasiados intentos. Espera un minuto.',
  user_banned: 'Esta cuenta está desactivada.',
}

type ErrorShape = {
  name?: unknown
  code?: unknown
  details?: unknown
  message?: unknown
  status?: unknown
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined

function shape(error: unknown): ErrorShape {
  return typeof error === 'object' && error !== null ? (error as ErrorShape) : {}
}

export function isNetworkError(error: unknown): boolean {
  const { name, message, status } = shape(error)
  if (name === 'AuthRetryableFetchError' || status === 0) return true
  return /network request failed|failed to fetch|network error/i.test(str(message) ?? '')
}

/** Stable machine code to branch on: RPC `details`, a mapped `23505`, or the Auth `error_code`. */
export function errorCode(error: unknown): string | undefined {
  const { code, details, message } = shape(error)
  if (code === 'P0001') return str(details)
  if (code === '23505') return uniqueViolation(message)?.code ?? 'duplicate'
  return str(code)
}

export function messageFor(error: unknown): string {
  if (isNetworkError(error)) return network
  const { code, details, message } = shape(error)
  if (code === 'P0001') {
    const detail = str(details)
    return (detail && detailMessages[detail]) ?? str(message) ?? generic
  }
  if (code === '23505') return uniqueViolation(message)?.message ?? generic
  if (code === '23514') return 'Revisa los datos: hay un valor fuera de rango.'
  if (code === '42501')
    return 'No tienes permiso para este cambio. Pide al propietario que lo haga.'
  const auth = str(code)
  return (auth && authMessages[auth]) ?? generic
}
