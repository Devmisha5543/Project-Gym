import { useEffect, useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function MemberPhoto({ member, photoUrl, alt }) {
  const [privateImageUrl, setPrivateImageUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  const isProtectedUpload = photoUrl?.startsWith(`${API_URL}/uploads/`)

  useEffect(() => {
    if (!isProtectedUpload) return undefined

    let cancelled = false
    let objectUrl = null

    authFetch(photoUrl)
      .then(response => {
        if (!response.ok) throw new Error('Could not load member photo')
        return response.blob()
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setPrivateImageUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isProtectedUpload, photoUrl])

  if (!photoUrl || failed || (isProtectedUpload && !privateImageUrl)) {
    return <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
  }

  return (
    <img
      src={isProtectedUpload ? privateImageUrl : photoUrl}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}

export default MemberPhoto
