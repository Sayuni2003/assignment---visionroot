import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRequest, updateRequest } from '../api/requests.api.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import RequestForm from '../components/RequestForm.jsx'
import { useToast } from '../context/ToastContext.jsx'

function EditRequestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // Errors are not caught here: RequestForm shows them next to the fields.
  async function handleSubmit(values) {
    await updateRequest(id, values)
    showSuccess('Request updated')
    navigate(`/requests/${id}`)
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
            <Link to="/requests" className="btn btn-secondary">
              Back to my requests
            </Link>
          }
        />
      )
    }

    if (error) {
      return <ErrorMessage message={error.message} onRetry={loadRequest} />
    }

    // Only pending requests can be edited; the backend would reject the update with a 409.
    if (request.status !== 'PENDING') {
      return (
        <EmptyState
          message="This request can no longer be edited."
          action={
            <Link to={`/requests/${id}`} className="btn btn-secondary">
              Back to request details
            </Link>
          }
        />
      )
    }

    return <RequestForm initialValues={request} onSubmit={handleSubmit} submitLabel="Save changes" />
  }

  return (
    <div className="space-y-6">
      <Link to={`/requests/${id}`} className="text-sm">
        ← Back to request
      </Link>
      <h1 className="text-2xl font-semibold">Edit request</h1>
      {renderContent()}
    </div>
  )
}

export default EditRequestPage
