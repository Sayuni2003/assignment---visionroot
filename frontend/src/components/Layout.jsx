import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

// Shared frame for every logged-in page: the navbar plus a centred content area.
function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
