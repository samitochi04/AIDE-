import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const SimulationContext = createContext(null)

const STORAGE_KEY = 'aide_simulation'

// Default simulation state
const DEFAULT_STATE = {
  step: 0,
  completed: false,
  answers: {
    age: null,
    nationality: null,
    residenceStatus: null,
    region: null,
    isStudent: null,
    employmentStatus: null,
    incomeBracket: null,
    familySituation: null,
    hasChildren: false,
    numberOfChildren: 0,
  },
  results: null,
  resultsPreview: null, // For guest mode partial results
}

export function SimulationProvider({ children }) {
  const [state, setState] = useState(() => {
    // Load from localStorage for guest mode persistence
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return { ...DEFAULT_STATE, ...JSON.parse(stored) }
        } catch {
          return DEFAULT_STATE
        }
      }
    }
    return DEFAULT_STATE
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Update a single answer
  const setAnswer = useCallback((key, value) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [key]: value,
      },
    }))
  }, [])

  // Update multiple answers at once
  const setAnswers = useCallback((answers) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        ...answers,
      },
    }))
  }, [])

  // Navigate to a step
  const goToStep = useCallback((step) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  // Go to next step
  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }))
  }, [])

  // Go to previous step
  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }))
  }, [])

  // Mark simulation as completed
  const complete = useCallback((results, isPreview = false) => {
    setState((prev) => ({
      ...prev,
      completed: true,
      results: isPreview ? null : results,
      resultsPreview: isPreview ? results : prev.resultsPreview,
    }))
  }, [])

  // Set full results (when user logs in)
  const setFullResults = useCallback((results) => {
    setState((prev) => ({
      ...prev,
      results,
      resultsPreview: null,
    }))
  }, [])

  // Reset simulation
  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Check if simulation has answers
  const hasAnswers = Object.values(state.answers).some(
    (v) => v !== null && v !== false && v !== 0
  )

  // Get progress percentage
  const progress = (() => {
    const totalQuestions = Object.keys(DEFAULT_STATE.answers).length
    const answered = Object.values(state.answers).filter(
      (v) => v !== null && v !== undefined
    ).length
    return Math.round((answered / totalQuestions) * 100)
  })()

  const value = {
    ...state,
    setAnswer,
    setAnswers,
    goToStep,
    nextStep,
    prevStep,
    complete,
    setFullResults,
    reset,
    hasAnswers,
    progress,
    isGuest: true, // Will be overridden by auth context if logged in
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider')
  }
  return context
}

export default SimulationContext
