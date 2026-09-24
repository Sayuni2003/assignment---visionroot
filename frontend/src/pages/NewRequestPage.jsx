import { Link, useNavigate } from 'react-router-dom'
import { createRequest } from '../api/requests.api.js'
import RequestForm from '../components/RequestForm.jsx'
import { useToast } from '../context/ToastContext.jsx'

function NewRequestPage() {
  const navigate = useNavigate()
  const { showSuccess } = useToast()

  // Errors are not caught here: RequestForm shows them next to the fields.
  async function handleSubmit(values) {
    const response = await createRequest(values)
    showSuccess('Request created')
    navigate(`/requests/${response.data.request._id}`)
  }

  return (
    <div className="space-y-6">
      <Link to="/requests" className="text-sm">
        ← Back to my requests
      </Link>
      <h1 className="text-2xl font-semibold">New request</h1>
      <RequestForm onSubmit={handleSubmit} submitLabel="Create request" />
    </div>
  )
}

export default NewRequestPage
