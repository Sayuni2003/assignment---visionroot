import { LABELS } from '../constants.js'

// Admins get the primary tint so they stand out in the users list.
function RoleBadge({ role }) {
  const colour = role === 'ADMIN' ? 'bg-primary-soft' : 'bg-bg-soft'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-text-primary ${colour}`}>
      {LABELS[role] ?? role}
    </span>
  )
}

export default RoleBadge
