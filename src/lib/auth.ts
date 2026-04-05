const AUTH_SESSION_KEY = 'rising-star-auth-session'
const AUTH_EMAIL_KEY = 'rising-star-auth-email'

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function isAuthenticated() {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  return storage.getItem(AUTH_SESSION_KEY) === 'active'
}

export function signIn(email: string) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(AUTH_SESSION_KEY, 'active')
  storage.setItem(AUTH_EMAIL_KEY, email)
}

export function signOut() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(AUTH_SESSION_KEY)
  storage.removeItem(AUTH_EMAIL_KEY)
}

export function getAuthenticatedEmail() {
  const storage = getStorage()

  if (!storage) {
    return ''
  }

  return storage.getItem(AUTH_EMAIL_KEY) ?? ''
}
