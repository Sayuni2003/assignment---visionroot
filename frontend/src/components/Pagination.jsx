// Previous / Next controls for a paginated list. Hidden when everything fits on one page.
function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null
  }

  const { page, totalPages } = pagination

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>

      <p className="text-sm text-text-secondary">
        Page {page} of {totalPages}
      </p>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  )
}

export default Pagination
