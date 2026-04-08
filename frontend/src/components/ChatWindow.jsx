import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import './ChatWindow.css'

// Mock MCP agent response
async function callAgent(messages, signal) {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? ''

  if (last.includes('scholarship') || last.includes('pm-yasasvi') || last.includes('nsp')) {
    return `I found **3 scholarships** matching your profile:\n\n**1. PM-YASASVI (₹75,000/year)**\n- Eligibility: OBC/EBC/DNT students, family income < ₹2.5L\n- Portal: [scholarships.gov.in](https://scholarships.gov.in)\n- Deadline: 31 October 2025\n\n**2. NSP Central Sector Scheme (₹12,000/year)**\n- Eligibility: Class 12 merit, income < ₹8L\n- Portal: [NSP Portal](https://scholarships.gov.in)\n- Deadline: 31 October 2025\n\n**3. Karnataka Rajyotsava Scholarship**\n- Eligibility: Karnataka domicile, 60%+ marks\n- Portal: [karepass.cgg.gov.in](https://karepass.cgg.gov.in)\n- Deadline: 30 November 2025\n\nWould you like me to **check your eligibility** for any of these, or generate the **document checklist**?`
  }

  if (last.includes('eligib')) {
    return `To check your eligibility, I need to build your student profile. Here's what I need:\n\n- **State of domicile**\n- **Category** (General / OBC / SC / ST / EBC)\n- **Annual family income**\n- **Current course & year**\n- **Institution type** (Govt / Private / Aided)\n\nYou can reply with these details in any format, like:\n*"I'm from Karnataka, OBC, income 1.8L, 2nd year B.Tech at a private college."*\n\nI'll instantly match you to eligible schemes.`
  }

  if (last.includes('document') || last.includes('checklist')) {
    return `Here's the **standard document bundle** for NSP scholarships:\n\n**Identity & Domicile**\n- Aadhaar card (mandatory)\n- Domicile certificate\n\n**Academic**\n- Class 10 & 12 marksheets\n- Current enrollment certificate (on college letterhead)\n- Fee receipt of current year\n\n**Income**\n- Income certificate from Tehsildar (not older than 1 year)\n- Bank passbook (first page)\n\n**Caste (if applicable)**\n- Caste certificate from competent authority\n\n**Bank Details**\n- IFSC code + account number (linked to Aadhaar)\n\n> 💡 Tip: All documents should be self-attested PDFs under 200KB for NSP portal upload.\n\nWant me to generate a **personalised checklist** based on specific schemes?`
  }

  if (last.includes('internship')) {
    return `Here are **active internships** for CSE students:\n\n**1. DRDO Summer Internship 2025**\n- Stipend: ₹10,000/month\n- Duration: 8 weeks (May–June)\n- Apply: [drdo.gov.in/internship](https://drdo.gov.in/internship)\n\n**2. ISRO Internship Programme**\n- Stipend: ₹8,000/month\n- Eligibility: 3rd/4th year B.Tech, 7.5+ CGPA\n- Deadline: 15 March 2025\n\n**3. Internshala Government Schemes**\n- Multiple openings across PSUs\n- Stipend: ₹5,000–₹15,000/month\n\nShall I filter by your CGPA, location preference, or stipend range?`
  }

  const hasAttachments = messages[messages.length - 1]?.attachments?.length > 0
  if (hasAttachments) {
    return `I've received your file(s). I can help you check if these documents meet the requirements for your scholarship application. Could you let me know which scheme you're applying for so I can verify the format and content?`
  }

  return `I'm Anyverse, your opportunity and document assistant for Indian students.\n\nI can help you:\n- 🎓 **Discover scholarships** (NSP, PM-YASASVI, state schemes, merit-based)\n- ✅ **Verify your eligibility** against 50+ portals using your profile\n- 📄 **Generate document checklists** ready for submission\n- 💼 **Find internships** from government and PSU portals\n\nTell me your course, state, and category — and I'll find opportunities tailored to you.`
}

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ChatWindow({ chat, suggestions, updateChat, onToggleSidebar, sidebarOpen }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [attachments, setAttachments] = useState([]) // [{ name, size, type, dataUrl }]
  const [fileError, setFileError] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const chatId = chat?.id

  const messages = chat?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [input])

  const handleFileChange = useCallback(async (e) => {
    setFileError('')
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (attachments.length + files.length > MAX_FILES) {
      setFileError(`Max ${MAX_FILES} files allowed.`)
      e.target.value = ''
      return
    }

    const oversized = files.find(f => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds 10MB limit.`)
      e.target.value = ''
      return
    }

    const processed = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: f.type.startsWith('image/') ? await readFileAsDataUrl(f) : null,
      }))
    )

    setAttachments(prev => [...prev, ...processed])
    e.target.value = ''
  }, [attachments])

  const removeAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    setFileError('')
  }, [])

  const sendMessage = useCallback(async (text) => {
    const content = text.trim()
    if ((!content && attachments.length === 0) || isTyping) return

    const userMsg = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: content || '📎 Sent attachment(s)',
      attachments: attachments.length > 0 ? attachments : undefined,
      ts: Date.now(),
    }

    updateChat(chatId, c => ({
      ...c,
      title: c.messages.length === 0 ? (content || 'Attachment').slice(0, 46) + ((content?.length > 46) ? '…' : '') : c.title,
      messages: [...c.messages, userMsg],
    }))

    setInput('')
    setAttachments([])
    setFileError('')
    setIsTyping(true)

    const ac = new AbortController()
    setAbortController(ac)

    try {
      const allMsgs = [...messages, userMsg]
      const reply = await callAgent(allMsgs, ac.signal)
      const assistantMsg = { id: Math.random().toString(36).slice(2), role: 'assistant', content: reply, ts: Date.now() }
      updateChat(chatId, c => ({ ...c, messages: [...c.messages, assistantMsg] }))
    } catch (e) {
      if (e.name !== 'AbortError') {
        const errMsg = { id: Math.random().toString(36).slice(2), role: 'assistant', content: 'Something went wrong connecting to the agent. Please try again.', ts: Date.now(), isError: true }
        updateChat(chatId, c => ({ ...c, messages: [...c.messages, errMsg] }))
      }
    } finally {
      setIsTyping(false)
      setAbortController(null)
    }
  }, [chatId, isTyping, messages, updateChat, attachments])

  const handleStop = () => {
    abortController?.abort()
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isTyping

  return (
    <div className="chat-window">
      <style>{`
        .messages-area a {
          color: #007bff;
          text-decoration: underline;
          font-weight: 500;
        }
        .messages-area a:hover {
          color: #0056b3;
        }
      `}</style>

      <header className="chat-header">
        {!sidebarOpen && (
          <button className="icon-btn header-toggle" onClick={onToggleSidebar} title="Open sidebar">
            <MenuIcon />
          </button>
        )}
        <div className="header-center">
          {!sidebarOpen && <span className="header-logo">Anyverse</span>}
        </div>
        <div className="header-right">
          <span className="status-dot" />
          <span className="status-label">MCP Agent</span>
        </div>
      </header>

      <div className="messages-area">
        {isEmpty ? (
          <div className="empty-state">
            <h1 className="empty-title">Anyverse</h1>
            <p className="empty-sub">Your AI assistant for scholarships, government schemes, and internships in India.</p>
            <div className="suggestions-grid">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="input-area">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="attachment-preview-bar">
            {attachments.map((file, i) => (
              <div key={i} className="attachment-preview-item">
                {file.type?.startsWith('image/') && file.dataUrl ? (
                  <img src={file.dataUrl} alt={file.name} className="preview-thumb" />
                ) : (
                  <div className="preview-file-icon">
                    <FileIcon />
                  </div>
                )}
                <span className="preview-name">{file.name}</span>
                <button className="preview-remove" onClick={() => removeAttachment(i)} title="Remove">
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {fileError && (
          <p className="file-error">{fileError}</p>
        )}

        <div className="input-box-wrapper">
          <textarea
            ref={textareaRef}
            className="input-box"
            placeholder="Ask about scholarships, schemes, or internships…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="input-actions">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              disabled={isTyping || attachments.length >= MAX_FILES}
            >
              <AttachIcon />
            </button>

            {isTyping ? (
              <button className="send-btn stop" onClick={handleStop} title="Stop">
                <StopIcon />
              </button>
            ) : (
              <button
                className={`send-btn ${canSend ? 'active' : ''}`}
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                title="Send"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
        <p className="input-hint">Anyverse can make mistakes. Verify important info from official portals.</p>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/>
      <path d="M22 2L15 22 11 13 2 9l20-7z"/>
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  )
}

function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}