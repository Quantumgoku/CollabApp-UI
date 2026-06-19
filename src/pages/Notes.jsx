import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchNotes, fetchSharedNotes, createNote, deleteNote, searchNotes } from '../api/notes'
import { useAuth } from '../context/AuthContext'

function NoteCard({ note, onClick, onDelete, isOwner }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-amber/30 transition-all duration-150 group relative"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-text truncate group-hover:text-amber transition-colors">
            {note.title || 'Untitled'}
          </h3>
          <p className="text-xs text-muted mt-1 line-clamp-2">
            {note.content || 'No content'}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(note.id) }}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-xs px-1.5 py-1 rounded hover:bg-red-400/10"
          >
            del
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="font-mono text-xs text-muted">v{note.version}</span>
        {note.updatedAt && (
          <span className="text-xs text-muted">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Notes() {
  const [myNotes, setMyNotes] = useState([])
  const [sharedNotes, setSharedNotes] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const load = async () => {
    try {
      const [mine, shared] = await Promise.all([fetchNotes(), fetchSharedNotes()])
      setMyNotes(mine.data)
      setSharedNotes(shared.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // debounced search
  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      const { data } = await searchNotes({ query: search, size: 20 })
      setSearchResults(data.content)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const { data } = await createNote({ title: 'Untitled', content: '' })
      navigate(`/notes/${data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    await deleteNote(id)
    setMyNotes(n => n.filter(x => x.id !== id))
  }

  const displayNotes = searchResults ?? myNotes

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <span className="font-mono text-amber font-medium tracking-tight">
          collab<span className="text-text">app</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user?.email}</span>
          <button onClick={logout} className="btn-ghost text-xs">Sign out</button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-8">
          <input
            className="input flex-1"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={handleCreate} className="btn-primary whitespace-nowrap" disabled={creating}>
            {creating ? '...' : '+ New note'}
          </button>
        </div>

        {loading ? (
          <div className="text-muted text-sm">Loading...</div>
        ) : searchResults ? (
          <>
            <SectionLabel label={`Search results (${searchResults.length})`} />
            <NoteGrid notes={searchResults} navigate={navigate} onDelete={handleDelete} userId={user?.id} />
          </>
        ) : (
          <>
            <SectionLabel label="My notes" />
            {myNotes.length === 0
              ? <EmptyState onCreate={handleCreate} />
              : <NoteGrid notes={myNotes} navigate={navigate} onDelete={handleDelete} userId={user?.id} />
            }

            {sharedNotes.length > 0 && (
              <div className="mt-10">
                <SectionLabel label="Shared with me" />
                <NoteGrid notes={sharedNotes} navigate={navigate} onDelete={() => {}} userId={user?.id} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  )
}

function NoteGrid({ notes, navigate, onDelete, userId }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => navigate(`/notes/${note.id}`)}
          onDelete={onDelete}
          isOwner={note.ownerId === userId}
        />
      ))}
    </div>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <p className="text-muted text-sm mb-4">No notes yet</p>
      <button onClick={onCreate} className="btn-primary">Create your first note</button>
    </div>
  )
}
