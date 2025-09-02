import { create } from 'zustand'
import { sessionService } from '../services/sessionService'
import { useToastStore } from './toastStore'

export const useSessionStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,

  loadSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await sessionService.getSessions()
      set({ sessions, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to load sessions:', error)
    }
  },

  createSession: async (sessionData) => {
    try {
      const session = await sessionService.createSession(sessionData)
      set(state => ({
        sessions: [...state.sessions, session]
      }))
      return session
    } catch (error) {
      useToastStore.getState().addToast({
        type: 'error',
        message: 'Failed to create session'
      })
      throw error
    }
  },

  joinSession: async (sessionId) => {
    try {
      const session = await sessionService.joinSession(sessionId)
      set({ currentSession: session })
      return session
    } catch (error) {
      useToastStore.getState().addToast({
        type: 'error',
        message: 'Failed to join session'
      })
      throw error
    }
  },

  endSession: async (sessionId) => {
    try {
      await sessionService.endSession(sessionId)
      set({ currentSession: null })
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, status: 'ended' } : s
        )
      }))
    } catch (error) {
      useToastStore.getState().addToast({
        type: 'error',
        message: 'Failed to end session'
      })
      throw error
    }
  }
}))
