// useLeads.js — Aurora v1
// CHANGED FROM v7:
//   - "language" field renamed to "outputMode" (linkedin | loom)
//   - Default minRating lowered to 3.5 for UK/AU market
//   - Default minReviews lowered to 15 for UK/AU market
//   - Default service updated to UK/AU positioning
//   - searchLeads sends outputMode not language to backend

import { useReducer, useCallback } from 'react'
import { searchLeads } from '../api'

const initialState = {
  // Form
  niche:      '',
  city:       '',
  service:    'modern website design, online booking systems & mobile-first builds',
  count:      5,
  minRating:  3.5,
  minReviews: 15,
  outputMode: 'linkedin',   // CHANGED: replaces "language"

  // Results
  leads:   [],
  summary: '',

  // UI
  loading: false,
  error:   null,
  ran:     false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SEARCH_START':
      return { ...state, loading: true, error: null, leads: [], summary: '' }
    case 'SEARCH_SUCCESS':
      return { ...state, loading: false, leads: action.leads, summary: action.summary, ran: true }
    case 'SEARCH_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'CLEAR':
      return { ...state, leads: [], summary: '', error: null, ran: false }
    case 'LOAD_DEFAULTS':
      return { ...state, ...action.defaults }
    default:
      return state
  }
}

export function useLeads() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadDefaults = useCallback(() => {
    try {
      const saved = localStorage.getItem('aurora-defaults')
      if (saved) dispatch({ type: 'LOAD_DEFAULTS', defaults: JSON.parse(saved) })
    } catch {}
  }, [])

  const setField = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const search = useCallback(async () => {
    const { niche, city, service, count, minRating, minReviews, outputMode } = state
    if (!niche || !city || !service) {
      dispatch({ type: 'SEARCH_ERROR', error: 'Niche, city, and service are required.' })
      return
    }
    dispatch({ type: 'SEARCH_START' })
    try {
      // CHANGED: sends outputMode (not language) to backend
      const data = await searchLeads({ niche, city, service, count, minRating, minReviews, outputMode })
      dispatch({ type: 'SEARCH_SUCCESS', leads: data.leads || [], summary: data.summary || '' })
    } catch (err) {
      dispatch({ type: 'SEARCH_ERROR', error: err.message })
    }
  }, [state])

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  return { state, setField, search, clear, loadDefaults }
}
