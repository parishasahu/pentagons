import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MessageBubble.css'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function AttachmentPreview({ file }) {
  const isImage = file.type?.startsWith('image/')

  if (isImage && file.dataUrl) {
    return (
      <img
        src={file.dataUrl}
        alt={file.name}
        className="attachment-image"
      />
    )
  }

  return (
    <div className="attachment-chip">
      <div className="attachment-icon">
        <FileIcon />
      </div>
      <div className="attachment-info">
        <span className="attachment-name">{file.name}</span>
        <span className="attachment-size">{formatBytes(file.size)}</span>
      </div>
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const hasAttachments = isUser && message.attachments?.length > 0

  return (
    <div className={`bubble-row ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="avatar assistant-avatar">A</div>
      )}
      <div className="bubble-content">
        {hasAttachments && (
          <div className="bubble-attachments">
            {message.attachments.map((file, i) => (
              <AttachmentPreview key={i} file={file} />
            ))}
          </div>
        )}
        <div className={`bubble ${isUser ? 'user-bubble' : 'assistant-bubble'} ${message.isError ? 'error-bubble' : ''}`}>
          {isUser ? (
            <p className="user-text">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="md-p">{children}</p>,
                strong: ({ children }) => <strong className="md-strong">{children}</strong>,
                ul: ({ children }) => <ul className="md-ul">{children}</ul>,
                ol: ({ children }) => <ol className="md-ol">{children}</ol>,
                li: ({ children }) => <li className="md-li">{children}</li>,
                h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
                h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
                h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
                code: ({ inline, children }) =>
                  inline
                    ? <code className="md-code-inline">{children}</code>
                    : <pre className="md-pre"><code>{children}</code></pre>,
                blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
                a: ({ href, children }) => (
                  <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">{children}</a>
                ),
                hr: () => <hr className="md-hr" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <span className="bubble-time">{formatTime(message.ts)}</span>
      </div>
      {isUser && (
        <div className="avatar user-avatar">U</div>
      )}
    </div>
  )
}