import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { HOME_PATHS } from '../constants.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const LINKS_BY_ROLE = {
  USER: [
    { to: '/requests', label: 'My Requests' },
    { to: '/requests/new', label: 'New Request' },
  ],
  ADMIN: [
    { to: '/admin/requests', label: 'Requests' },
    { to: '/admin/users', label: 'Users' },
  ],
}

function navLinkClass({ isActive }) {
  const base = 'block rounded-md px-3 py-2 text-sm font-medium'
  return isActive
    ? `${base} bg-primary-soft text-text-primary hover:text-text-primary`
    : `${base} text-text-secondary hover:bg-bg-soft hover:text-text-primary`
}

function Navbar() {
  const { user, logout } = useAuth()
  const { showSuccess } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = LINKS_BY_ROLE[user.role] ?? []

  async function handleLogout() {
    await logout()
    showSuccess('You have been logged out')
    navigate('/login')
  }

  return (
    <header className="border-b bg-bg-nav">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          to={HOME_PATHS[user.role]}
          className="text-lg font-bold text-primary hover:text-primary-hover"
        >
          RequestHub
        </Link>

        {/* Only visible below md; the menu below is always shown on larger screens. */}
        <button
          type="button"
          className="btn btn-secondary md:hidden"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <div
          id="main-menu"
          className={`${menuOpen ? 'flex' : 'hidden'} mt-3 w-full flex-col gap-3 border-t pt-3 md:mt-0 md:flex md:w-auto md:flex-1 md:flex-row md:items-center md:justify-between md:border-t-0 md:pt-0`}
        >
          <ul className="flex flex-col gap-1 md:flex-row">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-4">
            <span className="min-w-0 text-sm break-words text-text-secondary">{user.name}</span>
            <button
              type="button"
              className="btn bg-danger text-bg-card hover:bg-danger/90 hover:text-bg-card"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
