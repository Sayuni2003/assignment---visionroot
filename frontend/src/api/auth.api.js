import { request } from './client.js'

export function register(data) {
  return request('/auth/register', { method: 'POST', body: data })
}

export function login(data) {
  return request('/auth/login', { method: 'POST', body: data })
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export function getMe() {
  return request('/auth/me')
}
