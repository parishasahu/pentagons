import './TypingIndicator.css'

export default function TypingIndicator() {
  return (
    <div className="bubble-row assistant typing-row">
      <div className="avatar assistant-avatar">A</div>
      <div className="bubble assistant-bubble typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}
