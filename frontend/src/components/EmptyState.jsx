// Shown when a list has nothing in it. `action` is optional, e.g. a link to create the first item.
function EmptyState({ message, action }) {
  return (
    <div className="rounded-lg border border-dashed bg-bg-card px-4 py-10 text-center">
      <p className="text-text-secondary">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
