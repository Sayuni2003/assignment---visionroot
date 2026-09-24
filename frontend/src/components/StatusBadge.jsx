import { LABELS } from '../constants.js'

// Soft background and dot in the status colour; the text stays dark so it is readable.
const STATUS_CLASSES = {
  PENDING: { pill: 'bg-status-pending-soft', dot: 'bg-status-pending' },
  IN_PROGRESS: { pill: 'bg-status-in-progress-soft', dot: 'bg-status-in-progress' },
  RESOLVED: { pill: 'bg-status-resolved-soft', dot: 'bg-status-resolved' },
  CANCELLED: { pill: 'bg-status-cancelled-soft', dot: 'bg-status-cancelled' },
}

function StatusBadge({ status }) {
  const classes = STATUS_CLASSES[status] ?? { pill: 'bg-bg-soft', dot: 'bg-text-muted' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-text-primary ${classes.pill}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${classes.dot}`} />
      {LABELS[status] ?? status}
    </span>
  )
}

export default StatusBadge
