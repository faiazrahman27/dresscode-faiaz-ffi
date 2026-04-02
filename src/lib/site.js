export const SITE_URL =
  import.meta.env.VITE_SITE_URL || window.location.origin

export function getPublicProfileUrl(code) {
  return `${SITE_URL}/p/${code}`
}
