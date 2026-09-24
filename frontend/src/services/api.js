export const API_URL = import.meta.env.VITE_API_URL

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`, { credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
