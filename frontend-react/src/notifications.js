export const notificationEvent = 'project-gym:notification'

let notificationSequence = 0

export function publishNotification(detail) {
  window.dispatchEvent(new CustomEvent(notificationEvent, { detail }))
}

export function notify(message, type = 'error', { duration = 6000, actionLabel, onAction } = {}) {
  if (!message) return

  publishNotification({
    id: `notification-${++notificationSequence}`,
    message,
    type,
    duration,
    actionLabel,
    onAction
  })
}
