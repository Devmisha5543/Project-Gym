export default function FeedbackMessage({ message, type = 'error' }) {
  if (!message) return null

  const isError = type === 'error'

  return (
    <div
      className={`feedback-message feedback-message--${type}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}
