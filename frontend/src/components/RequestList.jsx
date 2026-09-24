import { Link } from 'react-router-dom'
import { LABELS } from '../constants.js'
import PriorityBadge from './PriorityBadge.jsx'
import StatusBadge from './StatusBadge.jsx'

function formatDate(value) {
  return new Date(value).toLocaleDateString()
}

// Cards on small screens, a table from md upwards. Both show the same requests.
function RequestList({ requests, showOwner = false }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {requests.map((request) => (
          <li key={request._id}>
            <Link
              to={`/requests/${request._id}`}
              className="block rounded-lg border bg-bg-card p-4 text-text-primary hover:border-primary hover:text-text-primary"
            >
              <p className="font-medium break-words">{request.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {LABELS[request.category]} · {formatDate(request.createdAt)}
                {showOwner && ` · ${request.createdBy?.name ?? 'Unknown'}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border bg-bg-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Service requests</caption>
          <thead className="bg-bg-soft text-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Title</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Priority</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              {showOwner && <th scope="col" className="px-4 py-3 font-medium">Owner</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id} className="border-t border-divider hover:bg-bg-main">
                <td className="max-w-xs px-4 py-3">
                  <Link to={`/requests/${request._id}`} className="font-medium break-words">
                    {request.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{LABELS[request.category]}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={request.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(request.createdAt)}</td>
                {showOwner && <td className="px-4 py-3">{request.createdBy?.name ?? 'Unknown'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default RequestList
