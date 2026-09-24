import { createContext, useContext, useRef, useState } from 'react'
import ToastList from '../components/ToastList.jsx'

const ToastContext = createContext(null)

const TOAST_DURATION_MS = 3000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  function dismiss(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  function showToast(type, message) {
    const id = nextId.current
    nextId.current += 1

    setToasts((current) => [...current, { id, type, message }])
    setTimeout(() => dismiss(id), TOAST_DURATION_MS)
  }

  const value = {
    showSuccess: (message) => showToast('success', message),
    showError: (message) => showToast('error', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
