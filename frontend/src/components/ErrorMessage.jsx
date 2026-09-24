// An error box with an optional Retry button. role="alert" makes screen readers announce it.
function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-l-4 border-l-danger bg-danger-soft px-4 py-3 text-sm text-text-primary sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary self-start sm:self-auto" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
