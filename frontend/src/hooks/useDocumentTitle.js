import { useEffect } from 'react'

// Sets the browser tab title, e.g. "My Requests | Service Requests".
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} | Service Requests`
  }, [title])
}
