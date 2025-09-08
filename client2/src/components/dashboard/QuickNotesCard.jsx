import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'

export function QuickNotesCard() {
  const { t } = useTranslation()
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState([
    {
      id: '1',
      content: 'Remember to follow up with John about anxiety homework',
      timestamp: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      id: '2',
      content: 'Jane showed significant improvement in mood regulation',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ])

  const handleSaveNote = () => {
    if (!notes.trim()) return

    const newNote = {
      id: Date.now().toString(),
      content: notes.trim(),
      timestamp: new Date()
    }

    setSavedNotes(prev => [newNote, ...prev])
    setNotes('')
  }

  const handleDeleteNote = (noteId) => {
    setSavedNotes(prev => prev.filter(note => note.id !== noteId))
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2" />
        Quick Notes
      </h2>

      {/* Add new note */}
      <div className="mb-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a quick note..."
          className="w-full input text-sm"
          rows={3}
        />
        <button
          onClick={handleSaveNote}
          disabled={!notes.trim()}
          className="mt-2 btn btn-primary btn-sm flex items-center disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Note
        </button>
      </div>

      {/* Saved notes */}
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
        {savedNotes.map((note) => (
          <div
            key={note.id}
            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <p className="text-sm text-gray-900 dark:text-white">
              {note.content}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(note.timestamp, 'MMM d, h:mm a')}
              </p>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {savedNotes.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No notes yet
          </p>
        )}
      </div>
    </div>
  )
}
