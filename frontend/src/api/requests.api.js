import { request } from './client.js'

export function getRequests(params) {
  return request('/requests', { params })
}

export function getRequest(id) {
  return request(`/requests/${id}`)
}

export function createRequest(data) {
  return request('/requests', { method: 'POST', body: data })
}

export function updateRequest(id, data) {
  return request(`/requests/${id}`, { method: 'PATCH', body: data })
}

export function cancelRequest(id) {
  return request(`/requests/${id}`, { method: 'DELETE' })
}

export function updateRequestStatus(id, status) {
  return request(`/requests/${id}/status`, { method: 'PATCH', body: { status } })
}
