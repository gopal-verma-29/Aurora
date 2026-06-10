// usePipeline.js — shortlist state + CRUD operations
// Shared across Search (save button) and Pipeline (kanban) pages
// Uses Context so both pages share the same state without prop drilling

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { getSaved, saveLead, updateStatus, removeSaved } from '../api'

const PipelineContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      // Convert array to map keyed by id for O(1) lookups
      return action.leads.reduce((acc, l) => ({ ...acc, [l.id]: l }), {})
    case 'ADD':
      return { ...state, [action.lead.id]: { ...action.lead, status: 'new' } }
    case 'UPDATE':
      return { ...state, [action.id]: { ...state[action.id], ...action.data } }
    case 'REMOVE': {
      const next = { ...state }
      delete next[action.id]
      return next
    }
    default:
      return state
  }
}

export function PipelineProvider({ children }) {
  const [leads, dispatch] = useReducer(reducer, {})

  // Load existing shortlist on mount
  useEffect(() => {
    getSaved()
      .then(d => dispatch({ type: 'LOAD', leads: d.saved || [] }))
      .catch(() => {})
  }, [])

  const save = useCallback(async (lead) => {
    if (leads[lead.id]) return // already saved
    await saveLead(lead)
    dispatch({ type: 'ADD', lead })
  }, [leads])

  const update = useCallback(async (id, data) => {
    await updateStatus(id, data)
    dispatch({ type: 'UPDATE', id, data })
  }, [])

  const remove = useCallback(async (id) => {
    await removeSaved(id)
    dispatch({ type: 'REMOVE', id })
  }, [])

  const isSaved = useCallback((id) => !!leads[id], [leads])

  const byStatus = useCallback((status) =>
    Object.values(leads).filter(l => l.status === status),
  [leads])

  return (
    <PipelineContext.Provider value={{ leads, save, update, remove, isSaved, byStatus }}>
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipeline() {
  const ctx = useContext(PipelineContext)
  if (!ctx) throw new Error('usePipeline must be used inside PipelineProvider')
  return ctx
}
