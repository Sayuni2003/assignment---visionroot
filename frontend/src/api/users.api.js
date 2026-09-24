import { request } from './client.js'

export function getUsers() {
  return request('/users')
}
