import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { notificationEvent, publishNotification } from './notifications'

export function FeedbackMessageHost() {
  const { t } = useTranslation('common')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    function receiveNotification(event) {
      const message = event.detail
      setMessages(current => [
        ...current.filter(item => item.id !== message.id),
        ...(message.message ? [{ ...message, expiresAt: message.type === 'error' || message.duration <= 0 ? null : Date.now() + message.duration }] : [])
      ])
    }

    window.addEventListener(notificationEvent, receiveNotification)
    return () => window.removeEventListener(notificationEvent, receiveNotification)
  }, [])

  useEffect(() => {
    const timers = messages
      .filter(message => message.expiresAt)
      .map(message => window.setTimeout(
        () => setMessages(current => current.filter(item => item.id !== message.id)),
        Math.max(0, message.expiresAt - Date.now())
      ))

    return () => timers.forEach(window.clearTimeout)
  }, [messages])

  if (!messages.length) return null

  return createPortal(
    <div className="feedback-message-portal-root">
      {messages.map(message => {
        const isError = message.type === 'error'

        return (
          <div
            key={message.id}
            className={`feedback-message feedback-message--${message.type}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <span>{message.message}</span>
            {message.actionLabel && (
              <button type="button" className="feedback-message-action" onClick={message.onAction}>
                {message.actionLabel}
              </button>
            )}
            <button
              type="button"
              className="feedback-message-dismiss"
              onClick={() => setMessages(current => current.filter(item => item.id !== message.id))}
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}

export default function FeedbackMessage({ message, type = 'error', duration = 6000, actionLabel, onAction }) {
  const id = useId()

  useEffect(() => {
    publishNotification({ id, message, type, duration, actionLabel, onAction })
  }, [id, message, type, duration, actionLabel, onAction])

  return null
}
