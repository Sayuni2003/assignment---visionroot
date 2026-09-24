const API_URL = import.meta.env.VITE_API_URL

// A 401 from these paths is a real answer (wrong password, refresh failed, ...),
// so they must never trigger a refresh-and-retry.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

// The refresh that is currently running, or null. A refresh token works only once,
// so concurrent 401s must wait for this one refresh instead of each starting their own.
let refreshPromise = null

// Called when a refresh fails, i.e. the session is over. AuthContext sets it.
let sessionExpiredHandler = null

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler
}

function buildUrl(path, params = {}) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  }

  const queryString = query.toString()
  return queryString ? `${API_URL}${path}?${queryString}` : `${API_URL}${path}`
}

// Returns the parsed body, or null when the body is empty or not JSON.
async function readJson(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Sends one HTTP request and returns the raw response together with its parsed body.
async function send(path, { method, body, params }) {
  const options = { method, credentials: 'include' }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(buildUrl(path, params), options)
  } catch {
    throw new Error('Cannot reach the server. Please try again.')
  }

  const data = await readJson(response)
  return { response, data }
}

// Asks the backend for new auth cookies and resolves to true if it worked.
// If a refresh is already running, every caller shares it. It is cleared once it
// finishes, so a later expiry can start a fresh one.
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = send('/auth/refresh', { method: 'POST' })
      .then(({ response }) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function createError(status, data) {
  const error = new Error(data?.message || 'Something went wrong')
  error.status = status
  error.errors = data?.errors
  return error
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const options = { method, body, params }
  let result = await send(path, options)

  // The access token has probably expired: refresh once, then retry the original request once.
  if (result.response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await refreshSession()

    if (!refreshed) {
      sessionExpiredHandler?.()
      throw createError(401, { message: 'Your session has expired. Please log in again.' })
    }

    result = await send(path, options)
  }

  if (result.response.ok) {
    return result.data
  }

  throw createError(result.response.status, result.data)
}
