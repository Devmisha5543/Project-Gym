export function authFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, { ...options, headers }).then(response => {
    if (response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('adminName')
      window.location.assign('/login')
    }

    return response
  })
}