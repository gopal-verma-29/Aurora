// api.js — single source of truth for all backend calls
// WHY: if the API changes, you update one file, not 6 components
// The Vite proxy forwards these to http://localhost:3003

const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

// Lead search
export const searchLeads = (params) => request('POST', '/leads', params)

// Seen leads
export const getSeenCount  = ()     => request('GET',    '/seen/count')
export const resetSeen     = ()     => request('DELETE', '/seen')

// Shortlist CRUD
export const getSaved      = ()          => request('GET',    '/saved')
export const saveLead      = (lead)      => request('POST',   '/saved', lead)
export const updateStatus  = (id, data)  => request('PATCH',  `/saved/${id}`, data)
export const removeSaved   = (id)        => request('DELETE', `/saved/${id}`)
