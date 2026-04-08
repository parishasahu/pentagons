import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import './ChatWindow.css'


// ─── MCP helpers ──────────────────────────────────────────────────────────────

let _mcpReady = false
let _rpcId = 1

async function mcpPost(body) {
  const res = await fetch('/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MCP server returned ${res.status}. Is it running on :3000?`)
  const text = await res.text()
  if (!text.trim()) return null          // notifications return empty body
  const json = JSON.parse(text)
  if (json.error) throw new Error(`MCP error: ${json.error.message}`)
  return json.result
}

async function ensureMCPReady() {
  if (_mcpReady) return
  await mcpPost({
    jsonrpc: '2.0', id: _rpcId++, method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'anyverse-frontend', version: '1.0.0' },
    },
  })
  // Fire-and-forget notification (no id, no response expected)
  fetch('/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }).catch(() => {})
  _mcpReady = true
}

async function mcpCallTool(name, args = {}) {
  await ensureMCPReady()
  const result = await mcpPost({
    jsonrpc: '2.0', id: _rpcId++, method: 'tools/call',
    params: { name, arguments: args },
  })
  return (result?.content ?? [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n')
}

async function mcpListTools() {
  await ensureMCPReady()
  const result = await mcpPost({
    jsonrpc: '2.0', id: _rpcId++, method: 'tools/list', params: {},
  })
  return result?.tools ?? []
}

// ─── Django API helper ────────────────────────────────────────────────────────

async function djangoPost(path, data) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.detail ?? json.error ?? `Django API returned ${res.status}. Is it running on :8000?`)
  return json
}

// ─── Profile parser — extracts structured fields from natural language ─────────

function parseProfileFromText(text) {
  const t = text.toLowerCase()

  const stateMap = {
    karnataka: 'Karnataka', maharashtra: 'Maharashtra', 'tamil nadu': 'Tamil Nadu',
    delhi: 'Delhi', kerala: 'Kerala', 'uttar pradesh': 'Uttar Pradesh',
    'west bengal': 'West Bengal', gujarat: 'Gujarat', rajasthan: 'Rajasthan',
    bihar: 'Bihar', telangana: 'Telangana', 'andhra pradesh': 'Andhra Pradesh',
  }
  const state = Object.keys(stateMap).find(k => t.includes(k))

  const categoryMap = { obc: 'OBC', sc: 'SC', st: 'ST', ebc: 'EBC', general: 'General', gen: 'General' }
  const category = Object.keys(categoryMap).find(k => new RegExp(`\\b${k}\\b`).test(t))

  const incomeMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:l\b|lakh|lac)/i) ??
                      t.match(/income[^\d]*(\d{4,7})/i)
  const annualIncome = incomeMatch
    ? Math.round(parseFloat(incomeMatch[1]) * (/l\b|lakh|lac/i.test(incomeMatch[0]) ? 100000 : 1))
    : 250000

  const courseLevelMap = {
    phd: 'PhD', pg: 'PG', 'post grad': 'PG', ug: 'UG',
    'b.tech': 'UG', btech: 'UG', bsc: 'UG', ba: 'UG', '12th': '12th', '10th': '10th',
  }
  const courseLevel = Object.keys(courseLevelMap).find(k => t.includes(k))

  const percentMatch = t.match(/(\d{2,3})\s*%/) ?? t.match(/cgpa[^\d]*(\d+(?:\.\d+)?)/i)
  const percentage = percentMatch ? parseFloat(percentMatch[1]) : 75

  const gender = t.includes('female') || t.includes('girl') || t.includes('woman') ? 'female'
               : t.includes('male') || t.includes('boy') || t.includes('man') ? 'male'
               : 'male'

  const disability = t.includes('disab') || t.includes('pwd') || t.includes('handicap')

  return {
    name: 'Student',
    state: stateMap[state] ?? 'Karnataka',
    category: categoryMap[category] ?? 'General',
    annualIncome,
    courseLevel: courseLevelMap[courseLevel] ?? 'UG',
    percentage,
    gender,
    disability,
  }
}

// ─── Main agent router → real MCP + Django calls ──────────────────────────────

async function callAgent(messages, signal) {
  const last = messages[messages.length - 1]?.content?.trim() ?? ''
  const lower = last.toLowerCase()
  const checkAbort = () => { if (signal.aborted) throw new DOMException('Aborted', 'AbortError') }

  // help / start
  if (lower === 'help' || lower === 'start' || lower === '') {
    return [
      "I'm **Anyverse** — your MCP-powered assistant for Indian students 🎓",
      '',
      '**MCP Agent Commands**',
      '- `profile` — Open the student profile form (MCP App 1)',
      '- `discover <details>` — Find matching schemes for a profile',
      '- `check eligibility <schemeId> <details>` — Verify eligibility for a scheme',
      '- `tools` — List all available MCP tools',
      '',
      '**Django API Commands**',
      '- `recommend <email>` — Scored scholarships + schemes + internships',
      '- `generate bundle <email>` — SOP, cover letter & document checklist',
      '- `start workflow <email>` — Create a workflow session',
      '',
      'Or just describe your situation naturally:',
      '*"I\'m from Karnataka, OBC, income ₹1.8L, 2nd year B.Tech"*',
    ].join('\n')
  }

  // list tools
  if (lower === 'tools') {
    checkAbort()
    const tools = await mcpListTools()
    if (!tools.length) return '❌ MCP server returned no tools. Make sure it is running:\n```\ncd mcp-server && npm run dev\n```'
    return `## MCP Tools (${tools.length})\n\n` +
      tools.map(t => `**\`${t.name}\`**\n> ${t.description}`).join('\n\n')
  }

  // open profile form (MCP App 1)
  if (lower === 'profile' || lower.includes('open profile') || lower.includes('student profile')) {
    checkAbort()
    const reply = await mcpCallTool('build_student_profile')
    return `🪪 **Profile Form**\n\n${reply}\n\n> Open the interactive form in the MCP Inspector:\n> \`npx @modelcontextprotocol/inspector http://localhost:3000/mcp\``
  }

  // discover schemes
  if (lower.startsWith('discover')) {
    checkAbort()
    const profile = parseProfileFromText(last)
    const raw = await mcpCallTool('fetch_opportunities', { profile })
    checkAbort()
    let parsed
    try { parsed = JSON.parse(raw) } catch { return raw }
    const schemes = parsed.schemes ?? []
    if (!schemes.length) return 'No schemes found for that profile. Try a different state, category, or income range.'
    return `## Found ${schemes.length} scheme${schemes.length !== 1 ? 's' : ''}\n\n` +
      schemes.map(s => `**${s.name}** · ${s.type} · ${s.ministry}\n💰 ${s.amount}\n${s.description}`).join('\n\n---\n\n') +
      `\n\nTo verify: \`check eligibility ${schemes[0].id}\``
  }

  // check eligibility
  if (lower.startsWith('check eligibility') || lower.startsWith('eligibility')) {
    checkAbort()
    const words = last.split(/\s+/)
    const idx = words.findIndex(w => /eligib/i.test(w))
    const schemeId = words[idx + 1] ?? 'NSP_CENTRAL'
    const profile = parseProfileFromText(last)
    const raw = await mcpCallTool('check_eligibility', { schemeId, profile })
    checkAbort()
    let result
    try { result = JSON.parse(raw) } catch { return raw }
    if (result.eligible) return `✅ **Eligible for \`${schemeId}\`**\n\n${result.reason}`
    return `❌ **Not eligible for \`${schemeId}\`**\n\n**Reason:** ${result.reason}\n\n` +
      (result.failedRules?.length > 1 ? `**All failed rules:**\n${result.failedRules.map(r => `- ${r}`).join('\n')}` : '')
  }

  // Django: recommend
  if (lower.startsWith('recommend ')) {
    const email = last.slice(10).trim()
    if (!email) return '❌ Usage: `recommend student@example.com`'
    checkAbort()
    const data = await djangoPost('/recommend/', { email })
    return [
      `## Recommendations for ${data.student}`,
      '',
      `### 🎓 Scholarships (${data.matched_scholarships.length})`,
      data.matched_scholarships.length
        ? data.matched_scholarships.map(s => `- **${s.title}** — score: ${s.match_score}`).join('\n')
        : '_None found_',
      '',
      `### 🏛 Government Schemes (${data.eligible_schemes.length})`,
      data.eligible_schemes.length
        ? data.eligible_schemes.map(s => `- ${s}`).join('\n')
        : '_None found_',
      '',
      `### 💼 Internships (${data.recommended_internships.length})`,
      data.recommended_internships.length
        ? data.recommended_internships.map(i => `- **${i.title}** — score: ${i.match_score}`).join('\n')
        : '_None found_',
      '',
      `### 📄 Document Analysis`,
      data.document_analysis.length
        ? data.document_analysis.map(d =>
            `**${d.scheme}**: ${!d.missing_documents.length ? '✅ All docs present' : `Missing: ${d.missing_documents.join(', ')}`}`
          ).join('\n')
        : '_No analysis_',
    ].join('\n')
  }

  // Django: generate bundle
  if (lower.startsWith('generate bundle') || lower.startsWith('gen bundle')) {
    const parts = last.split(/\s+/)
    const email = parts[parts.length - 1]
    if (!email.includes('@')) return '❌ Usage: `generate bundle student@example.com`'
    checkAbort()
    const data = await djangoPost('/generate-bundle/', { email })
    return [
      `## Document Bundle (ID: \`${data.bundle_id}\`)`,
      '',
      '### Statement of Purpose',
      `> ${data.sop.trim()}`,
      '',
      '### Cover Letter',
      `> ${data.cover_letter.trim()}`,
      '',
      '### Document Checklist',
      data.checklist.split(',').map(d => `- [ ] ${d.trim()}`).join('\n'),
    ].join('\n')
  }

  // Django: start workflow
  if (lower.startsWith('start workflow') || (lower.startsWith('workflow') && last.includes('@'))) {
    const email = last.split(/\s+/).find(w => w.includes('@'))
    if (!email) return '❌ Usage: `start workflow student@example.com`'
    checkAbort()
    const data = await djangoPost('/workflow/start/', { email, workflow_type: 'full' })
    return [
      '## Workflow Session Started',
      `- **Session ID:** \`${data.session_id}\``,
      `- **Student:** ${data.student}`,
      `- **Status:** \`${data.status}\``,
      `- **Latest Bundle:** ${data.latest_bundle_id ? `\`${data.latest_bundle_id}\`` : '_none yet_'}`,
    ].join('\n')
  }

  // attachment fallback
  if (messages[messages.length - 1]?.attachments?.length > 0) {
    return "I've received your file(s). Which scheme are you applying for? I'll check if these documents meet its requirements."
  }

  // natural language fallback → MCP discover
  if (lower.includes('scholarship') || lower.includes('scheme') ||
      lower.includes('internship') || lower.includes('document') || lower.includes('checklist')) {
    checkAbort()
    const profile = parseProfileFromText(last)
    const raw = await mcpCallTool('fetch_opportunities', { profile })
    checkAbort()
    let parsed
    try { parsed = JSON.parse(raw) } catch { return raw }
    const schemes = parsed.schemes ?? []
    if (!schemes.length) {
      return "I couldn't find matching schemes for the details in your message. Try being specific:\n\n*\"I'm from Karnataka, OBC, income ₹1.8L, 2nd year B.Tech\"*\n\nOr use `recommend <email>` if your profile is already saved."
    }
    return `## ${schemes.length} scheme${schemes.length !== 1 ? 's' : ''} found\n\n` +
      schemes.slice(0, 5).map(s =>
        `**${s.name}** (${s.type})\n💰 ${s.amount} · ${s.ministry}\n${s.description}`
      ).join('\n\n---\n\n') +
      (schemes.length > 5 ? `\n\n_…and ${schemes.length - 5} more._` : '') +
      `\n\nType \`check eligibility ${schemes[0]?.id}\` to verify your eligibility.`
  }

  // default
  return [
    "I'm **Anyverse** 🎓 — your opportunity and document assistant for Indian students.",
    '',
    'Try: *"Find scholarships for OBC students in Karnataka"*',
    'Or: `help` for the full command list.',
  ].join('\n')
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