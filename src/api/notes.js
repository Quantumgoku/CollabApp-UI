import api from './client'

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password })

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken })

// Notes
export const fetchNotes = () => api.get('/notes')
export const fetchSharedNotes = () => api.get('/notes/shared-with-me')
export const getNote = (id) => api.get(`/notes/${id}`)
export const createNote = (data) => api.post('/notes', data)
export const updateNote = (id, data) => api.put(`/notes/${id}`, data)
export const deleteNote = (id) => api.delete(`/notes/${id}`)
export const searchNotes = (params) => api.get('/notes/search', { params })

// Collaborators
export const addContributor = (noteId, email) =>
  api.post(`/notes/${noteId}/contributors`, { email })
export const removeContributor = (noteId, contributorId) =>
  api.delete(`/notes/${noteId}/contributors/${contributorId}`)
export const getContributors = (noteId) =>
  api.get(`/notes/${noteId}/contributors`)

// History
export const getNoteHistory = (noteId) =>
  api.get(`/notes/${noteId}/history`)
