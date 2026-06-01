import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Layout from '../components/Layout'

interface ChatUser {
  id: string
  username?: string
  email?: string
}

interface ChatRoom {
  id: string
  participant1Id: string
  participant2Id: string
  participant1?: ChatUser
  participant2?: ChatUser
  messages?: Array<{ id: string; content: string; createdAt: string; sender?: ChatUser }>
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender?: ChatUser
}

export default function ChatPage() {
  const router = useRouter()
  const roomIdParam = typeof router.query.roomId === 'string' ? router.query.roomId : ''

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string>(roomIdParam)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }, [])

  useEffect(() => {
    if (!token) {
      toast.error('Please login to view messages')
      router.push('/auth/login')
    }
  }, [router, token])

  useEffect(() => {
    if (!roomIdParam) return
    setActiveRoomId(roomIdParam)
  }, [roomIdParam])

  const getMeFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem('user')
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const getOtherParticipant = (room: ChatRoom) => {
    const me = getMeFromLocalStorage()
    const myId = me?.id
    const other = room.participant1Id === myId ? room.participant2 : room.participant1
    return other
  }

  const fetchRooms = async () => {
    if (!token) return
    setLoadingRooms(true)
    try {
      const res = await axios.get('/api/chat/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const list: ChatRoom[] = res.data?.rooms || []
      setRooms(list)
      if (!activeRoomId && list[0]?.id) {
        setActiveRoomId(list[0].id)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load conversations')
    } finally {
      setLoadingRooms(false)
    }
  }

  const fetchMessages = async (rid: string) => {
    if (!token || !rid) return
    setLoadingMessages(true)
    try {
      const res = await axios.get(`/api/chat/rooms/${encodeURIComponent(rid)}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data?.messages || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeRoomId) return
    fetchMessages(activeRoomId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId])

  const sendMessage = async () => {
    if (!token || !activeRoomId) return
    const content = draft.trim()
    if (!content) return

    setSending(true)
    try {
      const res = await axios.post(
        `/api/chat/rooms/${encodeURIComponent(activeRoomId)}/messages`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const msg = res.data?.message
      if (msg) {
        setMessages((prev) => [...prev, msg])
        setDraft('')
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null
  const other = activeRoom ? getOtherParticipant(activeRoom) : null

  return (
    <Layout>
      <Head>
        <title>Messages - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your conversations</p>
              </div>
              <div className="max-h-[70vh] overflow-auto">
                {loadingRooms ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</div>
                ) : rooms.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No conversations yet.</div>
                ) : (
                  rooms.map((r) => {
                    const o = getOtherParticipant(r)
                    const title = o?.username || o?.email || 'User'
                    const last = r.messages?.[0]
                    const isActive = r.id === activeRoomId
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setActiveRoomId(r.id)
                          router.replace(`/chat?roomId=${encodeURIComponent(r.id)}`, undefined, { shallow: true })
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${isActive ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {last ? last.content : 'No messages yet'}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {other?.username || other?.email || (activeRoom ? 'Conversation' : 'Select a conversation')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Buyer ↔ Seller chat</div>
              </div>

              <div className="flex-1 p-4 overflow-auto max-h-[65vh]">
                {!activeRoomId ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Select a conversation to start messaging.</div>
                ) : loadingMessages ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No messages yet. Say hi!</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const me = getMeFromLocalStorage()
                      const isMine = m.sender?.id && me?.id ? m.sender.id === me.id : false
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm border ${
                              isMine
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.content}</div>
                            <div className={`mt-1 text-[10px] ${isMine ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={activeRoomId ? 'Type a message…' : 'Select a conversation…'}
                    disabled={!activeRoomId || sending}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={!activeRoomId || sending || !draft.trim()}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
