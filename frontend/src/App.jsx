import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import './App.css'

const INITIAL_SUGGESTIONS = [
  "Find scholarships for students from Karnataka",
  "Check my eligibility for PM-YASASVI scheme",
  "List internships for CSE students in 2025",
  "What documents do I need for NSP scholarship?",
  "Government schemes for girls in engineering",
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function createNewChat() {
  return {
    id: generateId(),
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
  }
}

export default function App() {
  const [theme, setTheme] = useState('light')

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  const [chats, setChats] = useState(() => {
    const first = createNewChat()
    return [first]
  })
  const [activeChatId, setActiveChatId] = useState(() => chats[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeChat = chats.find(c => c.id === activeChatId)

  const handleNewChat = useCallback(() => {
    const chat = createNewChat()
    setChats(prev => [chat, ...prev])
    setActiveChatId(chat.id)
  }, [])

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id)
  }, [])

  const handleDeleteChat = useCallback((id) => {
    setChats(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const fresh = createNewChat()
        setActiveChatId(fresh.id)
        return [fresh]
      }
      if (id === activeChatId) {
        setActiveChatId(next[0].id)
      }
      return next
    })
  }, [activeChatId])

  const updateChat = useCallback((chatId, updater) => {
    setChats(prev => prev.map(c => c.id === chatId ? updater(c) : c))
  }, [])

  return (
    <div className="app-layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className={`main-area ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <ChatWindow
          key={activeChatId}
          chat={activeChat}
          suggestions={INITIAL_SUGGESTIONS}
          updateChat={updateChat}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />
      </main>
    </div>
  )
}