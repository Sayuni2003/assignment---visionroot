import { LABELS } from '../constants.js'

// Same pill as StatusBadge, using the priority colours.
const PRIORITY_CLASSES = {
  LOW: { pill: 'bg-priority-low-soft', dot: 'bg-priority-low' },
  MEDIUM: { pill: 'bg-priority-medium-soft', dot: 'bg-priority-medium' },
  HIGH: { pill: 'bg-priority-high-soft', dot: 'bg-priority-high' },
}

function PriorityBadge({ priority }) {
  const classes = PRIORITY_CLASSES[priority] ?? { pill: 'bg-bg-soft', dot: 'bg-text-muted' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-text-primary ${classes.pill}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${classes.dot}`} />
      {LABELS[priority] ?? priority}
    </span>
  )
}

export default PriorityBadge
