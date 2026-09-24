import { useEffect, useState } from 'react'
import { getUsers } from '../api/users.api.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import RoleBadge from '../components/RoleBadge.jsx'

function formatDate(value) {
  return new Date(value).toLocaleDateString()
}

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const response = await getUsers()
      setUsers(response.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function renderContent() {
    if (loading) {
      return <Loader />
    }

    if (error) {
      return <ErrorMessage message={error.message} onRetry={loadUsers} />
    }

    if (users.length === 0) {
      return <EmptyState message="No users yet" />
    }

    return (
      <>
        {/* Cards on small screens */}
        <ul className="space-y-3 md:hidden">
          {users.map((user) => (
            <li key={user.id} className="rounded-lg border bg-bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium break-words">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
              <p className="mt-1 text-sm break-all text-text-secondary">{user.email}</p>
              <p className="mt-2 text-sm text-text-secondary">Joined {formatDate(user.createdAt)}</p>
            </li>
          ))}
        </ul>

        {/* Table from md upwards */}
        <div className="hidden overflow-x-auto rounded-lg border bg-bg-card md:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Users</caption>
            <thead className="bg-bg-soft text-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-divider">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 break-all">{user.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
      {renderContent()}
    </div>
  )
}

export default AdminUsersPage
