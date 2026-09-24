import { useEffect, useState } from 'react'
import { getRequests } from '../api/requests.api.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FilterSelect from '../components/FilterSelect.jsx'
import Loader from '../components/Loader.jsx'
import Pagination from '../components/Pagination.jsx'
import RequestList from '../components/RequestList.jsx'
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const PAGE_SIZE = 10

// Each sort option maps to the backend's sortBy and order query parameters.
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first', sortBy: 'createdAt', order: 'desc' },
  { value: 'oldest', label: 'Oldest first', sortBy: 'createdAt', order: 'asc' },
  { value: 'updated', label: 'Recently updated', sortBy: 'updatedAt', order: 'desc' },
]

// '' means "All": the API client leaves empty values out of the query string.
const DEFAULT_FILTERS = { search: '', status: '', category: '', priority: '', sort: 'newest' }

function AdminRequestsPage() {
  useDocumentTitle('All Requests')

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  // What is typed in the search box; it only becomes filters.search when the search is submitted.
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.category || filters.priority)

  async function loadRequests() {
    const sort = SORT_OPTIONS.find((option) => option.value === filters.sort)

    setLoading(true)
    setError(null)
    try {
      const response = await getRequests({
        page,
        limit: PAGE_SIZE,
        search: filters.search,
        status: filters.status,
        category: filters.category,
        priority: filters.priority,
        sortBy: sort.sortBy,
        order: sort.order,
      })
      setRequests(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [page, filters])

  // Any change to the filters, sort or search starts again from page 1.
  function updateFilter(name, value) {
    setFilters({ ...filters, [name]: value })
    setPage(1)
  }

  function handleSearch(event) {
    event.preventDefault()
    updateFilter('search', searchInput.trim())
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setSearchInput('')
    setPage(1)
  }

  function renderContent() {
    if (loading) {
      return <Loader />
    }

    if (error) {
      return <ErrorMessage message={error.message} onRetry={loadRequests} />
    }

    if (requests.length === 0) {
      return hasActiveFilters ? (
        <EmptyState
          message="No requests match your filters"
          action={
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : (
        <EmptyState message="No requests yet" />
      )
    }

    return (
      <>
        <RequestList requests={requests} showOwner />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">All Requests</h1>

      <div className="mb-6 space-y-4 rounded-lg border bg-bg-card p-4">
        <form role="search" onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="form-label">
              Search
            </label>
            <input
              id="search"
              type="search"
              className="form-input"
              placeholder="Title or description"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="status-filter"
            label="Status"
            value={filters.status}
            options={STATUSES}
            onChange={(value) => updateFilter('status', value)}
          />
          <FilterSelect
            id="category-filter"
            label="Category"
            value={filters.category}
            options={CATEGORIES}
            onChange={(value) => updateFilter('category', value)}
          />
          <FilterSelect
            id="priority-filter"
            label="Priority"
            value={filters.priority}
            options={PRIORITIES}
            onChange={(value) => updateFilter('priority', value)}
          />
          <div>
            <label htmlFor="sort" className="form-label">
              Sort by
            </label>
            <select
              id="sort"
              className="form-input"
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {renderContent()}
    </div>
  )
}

export default AdminRequestsPage
