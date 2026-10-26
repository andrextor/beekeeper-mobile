import { errorCode, isNetworkError, messageFor } from './errors'

const rpc = (details: string, message = 'Mensaje del servidor.') => ({
  code: 'P0001',
  details,
  message,
})

describe('messageFor', () => {
  it('maps every Auth error code in api.md', () => {
    expect(messageFor({ name: 'AuthApiError', code: 'invalid_credentials', status: 400 })).toBe(
      'Correo o contraseña incorrectos.',
    )
    expect(messageFor({ code: 'user_already_exists' })).toMatch(/^Ya existe una cuenta/)
    expect(messageFor({ code: 'email_exists' })).toMatch(/^Ya existe una cuenta/)
    expect(messageFor({ code: 'weak_password' })).toBe(
      'La contraseña debe tener al menos 8 caracteres.',
    )
    expect(messageFor({ code: 'validation_failed' })).toBe('Revisa el correo y la contraseña.')
    expect(messageFor({ code: 'over_request_rate_limit', status: 429 })).toBe(
      'Demasiados intentos. Espera un minuto.',
    )
    expect(messageFor({ code: 'user_banned', status: 403 })).toBe('Esta cuenta está desactivada.')
  })

  it('treats fetch failures as no connection', () => {
    const offline = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'
    expect(messageFor({ name: 'AuthRetryableFetchError', status: 0 })).toBe(offline)
    expect(messageFor({ message: 'TypeError: Network request failed', code: '' })).toBe(offline)
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true)
  })

  it('uses app copy for some RPC details and the server message for the rest', () => {
    expect(messageFor(rpc('invalid_code'))).toBe(
      'El código no es válido, ya se usó o venció. Pide uno nuevo al propietario.',
    )
    expect(messageFor(rpc('invalid_name'))).toBe('Escribe un nombre de 1 a 120 caracteres.')
    expect(messageFor(rpc('parent_deleted', 'El registro relacionado fue eliminado.'))).toBe(
      'El registro relacionado fue eliminado.',
    )
  })

  it('maps unique, check and RLS violations', () => {
    expect(
      messageFor({ code: '23505', message: 'duplicate key value violates "hives_qr_code_key"' }),
    ).toBe('Ese código QR ya está en uso en otra colmena.')
    expect(messageFor({ code: '23514', message: 'hives_name_check' })).toBe(
      'Revisa los datos: hay un valor fuera de rango.',
    )
    expect(messageFor({ code: '42501' })).toBe(
      'No tienes permiso para este cambio. Pide al propietario que lo haga.',
    )
  })

  it('falls back to a generic message', () => {
    expect(messageFor(undefined)).toBe('Algo salió mal. Inténtalo de nuevo.')
    expect(messageFor({ code: 'something_new' })).toBe('Algo salió mal. Inténtalo de nuevo.')
  })
})

describe('errorCode', () => {
  it('reads RPC details, mapped constraints and Auth codes', () => {
    expect(errorCode(rpc('id_taken'))).toBe('id_taken')
    expect(errorCode({ code: '23505', message: 'violates "apiaries_org_name_key"' })).toBe(
      'duplicate_name',
    )
    expect(errorCode({ code: 'user_banned' })).toBe('user_banned')
    expect(errorCode(null)).toBeUndefined()
  })
})
