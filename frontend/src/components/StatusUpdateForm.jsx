import { useState } from 'react'
import { updateRequestStatus } from '../api/requests.api.js'
import { ALLOWED_TRANSITIONS, LABELS } from '../constants.js'
import { useToast } from '../context/ToastContext.jsx'

// The admin's control for moving a request to its next status. Only allowed next statuses are offered.
function StatusUpdateForm({ request, onUpdated }) {
  const { showSuccess, showError } = useToast()
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nextStatuses = ALLOWED_TRANSITIONS[request.status] ?? []

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    try {
      const response = await updateRequestStatus(request._id, newStatus)
      onUpdated(response.data.request)
      setNewStatus('')
      showSuccess('Status updated')
    } catch (error) {
      showError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-text-secondary">This request is closed.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="sm:w-64">
        <label htmlFor="new-status" className="form-label">
          Change status
        </label>
        <select
          id="new-status"
          className="form-input"
          value={newStatus}
          onChange={(event) => setNewStatus(event.target.value)}
        >
          <option value="">Choose a new status</option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary" disabled={!newStatus || submitting}>
        {submitting ? 'Updating...' : 'Update'}
      </button>
    </form>
  )
}

export default StatusUpdateForm
