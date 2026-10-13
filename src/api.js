const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
let authToken = localStorage.getItem('webos-token')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(options.headers || {}) },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Request failed')
  return payload
}

export const api = {
  login: async (username, password) => { const result = await request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }); authToken = result.token; localStorage.setItem('webos-token', result.token); return result },
  logout: () => { authToken = null; localStorage.removeItem('webos-token') },
  getNotes: () => request('/api/notes'),
  saveNote: (note) => request(`/api/notes/${note.id}`, { method: 'PUT', body: JSON.stringify(note) }),
  createNote: (note) => request('/api/notes', { method: 'POST', body: JSON.stringify(note) }),
  deleteNote: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
  getEvents: () => request('/api/events'),
  createEvent: (event) => request('/api/events', { method: 'POST', body: JSON.stringify(event) }),
  deleteEvent: (id) => request(`/api/events/${id}`, { method: 'DELETE' }),
}
