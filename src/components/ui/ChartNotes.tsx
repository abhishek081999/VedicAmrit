'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Note {
  _id: string
  content: string
  createdAt: string
}

export function ChartNotes({ chartId }: { chartId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [chartId])

  const fetchNotes = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/chart/notes?chartId=${chartId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setNotes(json.notes)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [chartId])

  async function handleAdd() {
    if (!newNote.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/chart/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, content: newNote.trim() })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setNotes(json.notes)
      setNewNote('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(noteId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/chart/notes?chartId=${chartId}&noteId=${noteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setNotes(json.notes)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete note')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <div style={{ color: 'var(--rose)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>{error}</div>}
      
      {loading ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Loading notes…</div>
      ) : notes.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          No notes yet. Add your observations below.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
          {notes.map(note => (
            <div key={note._id} style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', fontFamily: 'var(--font-display)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{note.content}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                <button
                  onClick={() => handleDelete(note._id)}
                  title="Delete note"
                  style={{ background: 'transparent', border: 'none', color: 'var(--rose)', cursor: 'pointer', opacity: 0.6, fontSize: '0.8rem', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a new observation or note..."
          className="input"
          rows={2}
          style={{ flex: 1, resize: 'vertical', minHeight: '2.5rem', fontSize: '0.82rem', padding: '0.5rem 0.6rem' }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newNote.trim()}
          className="btn btn-primary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', height: 'fit-content', opacity: (!newNote.trim() || saving) ? 0.5 : 1 }}
        >
          {saving ? '…' : 'Add Note'}
        </button>
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '-0.3rem' }}>
        Cmd/Ctrl + Enter to save
      </div>
    </div>
  )
}
