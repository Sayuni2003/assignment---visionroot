// The strong colour is only used for the border: as text on the soft background it is too low in contrast.
const TYPE_CLASSES = {
  success: 'border-l-success bg-success-soft',
  error: 'border-l-danger bg-danger-soft',
}

// Toasts sit at the bottom of the screen so they never cover the navbar.
// The container is always rendered, so screen readers are already watching it when a toast appears.
function ToastList({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-80"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 rounded-md border border-l-4 px-4 py-3 text-sm text-text-primary ${TYPE_CLASSES[toast.type]}`}
        >
          <p className="min-w-0 break-words">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="cursor-pointer rounded-sm px-1 leading-none text-text-secondary hover:text-text-primary"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastList
