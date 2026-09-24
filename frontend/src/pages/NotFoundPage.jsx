import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-text-secondary">The page you are looking for does not exist.</p>
      {/* "/" sends logged-in users to their home page and everyone else to /login. */}
      <Link to="/" className="btn btn-primary">
        Go to home page
      </Link>
    </main>
  )
}

export default NotFoundPage
