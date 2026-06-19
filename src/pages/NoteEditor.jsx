import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNote, updateNote, addContributor, getContributors, getNoteHistory } from '../api/notes'
import { useNoteSocket } from '../hooks/useNoteSocket'
import { useAuth } from '../context/AuthContext'

export default function NoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [note, setNote] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)

  // collab state
  const [typingUsers, setTypingUsers] = useState({})
  const [onlineUsers, setOnlineUsers] = useState({})
  const [contributors, setContributors] = useState([])

  // panels
  const [showContributors, setShowContributors] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  const typingTimeout = useRef(null)
  const saveTimeout = useRef(null)
  const versionRef = useRef(1)

  // load note
  useEffect(() => {
    getNote(id).then(({ data }) => {
      setNote(data)
      setTitle(data.title)
      setContent(data.content)
      versionRef.current = data.version
    }).catch(() => navigate('/notes'))

    getContributors(id).then(({ data }) => setContributors(data))
  }, [id])

  // websocket
  const { sendTyping, sendEdit } = useNoteSocket({
    noteId: id,
    onEdit: (event) => {
      // don't apply own edits
      if (event.editedBy === user?.id) return
      setTitle(event.title)
      setContent(event.content)
      versionRef.current = event.version
      setNote(n => ({ ...n, version: event.version }))
    },
    onTyping: (event) => {
      if (event.userId === user?.id) return
      setTypingUsers(prev => ({ ...prev, [event.userId]: event }))
      // clear typing after 3s
      setTimeout(() => {
        setTypingUsers(prev => {
          const next = { ...prev }
          if (!event.typing) delete next[event.userId]
          return next
        })
      }, 3000)
    },
    onPresence: (event) => {
      if (event.userId === user?.id) return
      setOnlineUsers(prev => {
        const next = { ...prev }
        if (event.status === 'online') next[event.userId] = event
        else delete next[event.userId]
        return next
      })
    }
  })

  // auto save with debounce
  const triggerSave = useCallback((newTitle, newContent) => {
    setSaved(false)
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try {
        const { data } = await updateNote(id, {
          title: newTitle,
          content: newContent,
          version: versionRef.current
        })
        versionRef.current = data.version
        setNote(data)
        setSaved(true)
        setConflict(false)
      } catch (err) {
        if (err.response?.status === 409) {
          setConflict(true)
        } else {
          setError(err.response?.data?.message || 'Save failed')
        }
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [id])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    triggerSave(e.target.value, content)
    handleTyping()
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    triggerSave(title, e.target.value)
    handleTyping()
  }

  const handleTyping = () => {
    sendTyping(true)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => sendTyping(false), 2000)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setInviteMsg('')
    try {
      await addContributor(id, inviteEmail)
      const { data } = await getContributors(id)
      setContributors(data)
      setInviteEmail('')
      setInviteMsg('Collaborator added!')
    } catch (err) {
      setInviteMsg(err.response?.data?.message || 'Failed to add')
    } finally {
      setInviting(false)
    }
  }

  const loadHistory = async () => {
    const { data } = await getNoteHistory(id)
    setHistory(data)
    setShowHistory(true)
  }

  const typingList = Object.values(typingUsers).filter(u => u.typing)
  const onlineList = Object.values(onlineUsers)
  const isOwner = note?.ownerId === user?.id

  if (!note) return (
    <div className="min-h-screen flex items-center justify-center text-muted text-sm">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 bg-base/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="btn-ghost text-xs">← Back</button>
          <span className="font-mono text-xs text-muted">
            {saving ? 'Saving...' : saved ? 'Saved' : 'Unsaved'}
          </span>
          {conflict && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
              Conflict — reload to get latest
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* online presence */}
          {onlineList.length > 0 && (
            <div className="flex items-center gap-1.5">
              {onlineList.map(u => (
                <div key={u.userId} title={u.username}
                  className="w-6 h-6 rounded-full bg-amber/20 border border-amber/40 flex items-center justify-center text-xs text-amber font-mono">
                  {u.username?.[0]?.toUpperCase()}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setShowHistory(false); setShowContributors(v => !v) }}
            className={`btn-ghost text-xs ${showContributors ? 'text-amber' : ''}`}>
            Share
          </button>
          <button onClick={() => { setShowContributors(false); loadHistory() }}
            className={`btn-ghost text-xs ${showHistory ? 'text-amber' : ''}`}>
            History
          </button>
          <span className="font-mono text-xs text-muted">v{note.version}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Editor */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-8 py-10">
          {/* typing indicator */}
          {typingList.length > 0 && (
            <div className="text-xs text-amber/70 mb-3 font-mono">
              {typingList.map(u => u.username).join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          <input
            className="bg-transparent text-2xl font-semibold outline-none text-text placeholder-muted mb-4 cursor-blink"
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
          />

          <textarea
            className="bg-transparent flex-1 outline-none text-text/90 placeholder-muted resize-none text-sm leading-relaxed min-h-[60vh]"
            placeholder="Start writing..."
            value={content}
            onChange={handleContentChange}
          />

          {error && (
            <p className="text-red-400 text-xs mt-4">{error}</p>
          )}
        </div>

        {/* Side panel */}
        {(showContributors || showHistory) && (
          <aside className="w-72 border-l border-border p-5 overflow-y-auto">
            {showContributors && (
              <div>
                <h3 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Collaborators</h3>

                {/* current contributors */}
                <div className="space-y-2 mb-6">
                  {contributors.length === 0
                    ? <p className="text-xs text-muted">No collaborators yet</p>
                    : contributors.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted font-mono">
                            {c.userName?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-subtle">{c.email}</span>
                          {onlineUsers[c.id] && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" />
                          )}
                        </div>
                      ))
                  }
                </div>

                {isOwner && (
                  <form onSubmit={handleInvite} className="space-y-2">
                    <label className="text-xs text-muted block">Invite by email</label>
                    <input
                      className="input text-xs"
                      type="email"
                      placeholder="collaborator@email.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary w-full text-xs" disabled={inviting}>
                      {inviting ? 'Adding...' : 'Add collaborator'}
                    </button>
                    {inviteMsg && (
                      <p className={`text-xs ${inviteMsg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>
                        {inviteMsg}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {showHistory && (
              <div>
                <h3 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Edit history</h3>
                <div className="space-y-3">
                  {history.length === 0
                    ? <p className="text-xs text-muted">No history yet</p>
                    : history.map(h => (
                        <div key={h.id} className="border-l-2 border-border pl-3 py-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-amber">v{h.version}</span>
                            <span className="text-xs text-muted">{h.editedBy}</span>
                          </div>
                          <p className="text-xs text-subtle truncate">{h.title}</p>
                          <p className="text-xs text-muted">
                            {new Date(h.editedAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
