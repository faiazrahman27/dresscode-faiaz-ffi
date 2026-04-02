const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin

export function getPublicProfileUrl(code) {
  return `${APP_URL}/p/${code}`
}
