import { useSyncExternalStore } from 'react'

// Live boolean for a CSS media query. Used instead of react-slick's `responsive`
// option, whose listeners do not survive React StrictMode's double mount.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
