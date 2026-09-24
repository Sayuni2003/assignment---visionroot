import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelRequest } from '../api/requests.api.js'
import { canTransition } from '../constants.js'
import { useToast } from '../context/ToastContext.jsx'

// The owner's actions on a request: edit while pending, cancel while the request is still open.
function RequestActions({ request, onUpdated }) {
  const { showSuccess, showError } = useToast()
  const [cancelling, setCancelling] = useState(false)

  const canEdit = request.status === 'PENDING'
  const canCancel = canTransition(request.status, 'CANCELLED')

  async function handleCancel() {
    if (!window.confirm('Cancel this request? This cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await cancelRequest(request._id)
      onUpdated(response.data.request)
      showSuccess('Request cancelled')
    } catch (error) {
      showError(error.message)
    } finally {
      setCancelling(false)
    }
  }

  if (!canEdit && !canCancel) {
    return <p className="text-sm text-text-secondary">This request is closed.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canEdit && (
        <Link to={`/requests/${request._id}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      )}
      {canCancel && (
        <button
          type="button"
          className="btn btn-secondary text-danger hover:text-danger"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling...' : 'Cancel request'}
        </button>
      )}
    </div>
  )
}

export default RequestActions
