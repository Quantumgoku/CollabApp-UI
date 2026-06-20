import { useEffect, useRef, useCallback } from 'react'
import Stomp from 'stompjs'

export function useNoteSocket({ noteId, onEdit, onTyping, onPresence }) {
  const clientRef = useRef(null)

  useEffect(() => {
    if (!noteId) return
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const socket = new WebSocket(`${process.env.VITE_WS_URL}?token=${token}`)
    const client = Stomp.over(socket)
    client.debug = null

    client.connect({}, () => {
      clientRef.current = client

      client.subscribe(`/topic/note.${noteId}`, (msg) => {
        onEdit?.(JSON.parse(msg.body))
      })
      client.subscribe(`/topic/note.${noteId}.typing`, (msg) => {
        onTyping?.(JSON.parse(msg.body))
      })
      client.subscribe(`/topic/note.${noteId}.presence`, (msg) => {
        onPresence?.(JSON.parse(msg.body))
      })

      // announce presence
      client.send('/app/note.presence', {}, JSON.stringify({
        noteId, status: 'online'
      }))
    })

    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.send('/app/note.presence', {}, JSON.stringify({
          noteId, status: 'offline'
        }))
        clientRef.current.disconnect()
      }
    }
  }, [noteId])

  const sendTyping = useCallback((typing) => {
    clientRef.current?.send('/app/note.typing', {}, JSON.stringify({
      noteId, typing
    }))
  }, [noteId])

  const sendEdit = useCallback((data) => {
    clientRef.current?.send('/app/note.edit', {}, JSON.stringify({
      noteId, ...data
    }))
  }, [noteId])

  return { sendTyping, sendEdit }
}
