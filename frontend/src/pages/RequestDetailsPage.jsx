import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRequest } from '../api/requests.api.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import RequestActions from '../components/RequestActions.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusUpdateForm from '../components/StatusUpdateForm.jsx'
import { HOME_PATHS, LABELS } from '../constants.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatDateTime(value) {
  return new Date(value).toLocaleString()
}

// Shared by USER (their own requests) and ADMIN (any request); the actions depend on the role.
function RequestDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isAdmin = user.role === 'ADMIN'
  const backPath = HOME_PATHS[user.role]

  async function loadRequest() {
    setLoading(true)
    setError(null)
    try {
      const response = await getRequest(id)
      setRequest(response.data.request)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequest()
  }, [id])

  // The cancel and status endpoints return createdBy as a plain id, so keep the owner we already loaded.
  function handleUpdated(updatedRequest) {
    setRequest({ ...updatedRequest, createdBy: request.createdBy })
  }

  function renderContent() {
    if (loading) {
      return <Loader />
    }

    // 404: missing or someone else's request. 400: the id in the URL is not a valid id.
    if (error && (error.status === 404 || error.status === 400)) {
      return (
        <EmptyState
          message="Request not found"
          action={
            <Link to={backPath} className="btn btn-secondary">
              Back to requests
            </Link>
          }
        />
      )
    }

    if (error) {
      return <ErrorMessage message={error.message} onRetry={loadRequest} />
    }

    return (
      <article className="space-y-6 rounded-lg border bg-bg-card p-4 sm:p-6">
        <h1 className="text-2xl font-semibold break-words">{request.title}</h1>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-text-secondary">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={request.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Priority</dt>
            <dd className="mt-1">
              <PriorityBadge priority={request.priority} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Category</dt>
            <dd className="mt-1">{LABELS[request.category]}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Created</dt>
            <dd className="mt-1">{formatDateTime(request.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Last updated</dt>
            <dd className="mt-1">{formatDateTime(request.updatedAt)}</dd>
          </div>
          {isAdmin && (
            <div>
              <dt className="text-sm text-text-secondary">Owner</dt>
              <dd className="mt-1 break-words">
                {request.createdBy?.name ?? 'Unknown'}
                <span className="block text-sm text-text-secondary">{request.createdBy?.email}</span>
              </dd>
            </div>
          )}
        </dl>

        <section className="border-t border-divider pt-6">
          <h2 className="text-sm text-text-secondary">Description</h2>
          {/* pre-wrap keeps the line breaks the user typed */}
          <p className="mt-1 whitespace-pre-wrap break-words">{request.description}</p>
        </section>

        <section className="border-t border-divider pt-6">
          {isAdmin ? (
            <StatusUpdateForm request={request} onUpdated={handleUpdated} />
          ) : (
            <RequestActions request={request} onUpdated={handleUpdated} />
          )}
        </section>
      </article>
    )
  }

  return (
    <div className="space-y-6">
      <Link to={backPath} className="text-sm">
        ← Back to requests
      </Link>
      {renderContent()}
    </div>
  )
}

export default RequestDetailsPage
