import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRequests } from '../api/requests.api.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import Pagination from '../components/Pagination.jsx'
import RequestList from '../components/RequestList.jsx'

const PAGE_SIZE = 10

function MyRequestsPage() {
  const [page, setPage] = useState(1)
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadRequests() {
    setLoading(true)
    setError(null)
    try {
      const response = await getRequests({ page, limit: PAGE_SIZE })
      setRequests(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reload whenever the page number changes.
  useEffect(() => {
    loadRequests()
  }, [page])

  function renderContent() {
    if (loading) {
      return <Loader />
    }

    if (error) {
      return <ErrorMessage message={error.message} onRetry={loadRequests} />
    }

    if (requests.length === 0) {
      return (
        <EmptyState
          message="You haven't created any requests yet."
          action={
            <Link to="/requests/new" className="btn btn-primary">
              Create a request
            </Link>
          }
        />
      )
    }

    return (
      <>
        <RequestList requests={requests} showOwner={false} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <Link to="/requests/new" className="btn btn-primary">
          New request
        </Link>
      </div>

      {renderContent()}
    </div>
  )
}

export default MyRequestsPage
