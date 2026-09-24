// The request values below mirror backend/src/constants/request.constants.js.
// The frontend uses these only to decide which options and actions to show.
// The backend enforces every rule, so a hidden button is never the only protection.

export const CATEGORIES = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER']

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']

export const ALLOWED_TRANSITIONS = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: [],
  CANCELLED: [],
}

// Object.hasOwn keeps keys such as "constructor" from being treated as statuses.
export function canTransition(from, to) {
  return Object.hasOwn(ALLOWED_TRANSITIONS, from) && ALLOWED_TRANSITIONS[from].includes(to)
}

// Display text for every category, priority and status value.
export const LABELS = {
  TECHNICAL: 'Technical',
  BILLING: 'Billing',
  ACCOUNT: 'Account',
  OTHER: 'Other',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
}

// Where each role lands after logging in, or when it opens a page meant for the other role.
export const HOME_PATHS = {
  USER: '/requests',
  ADMIN: '/admin/requests',
}
