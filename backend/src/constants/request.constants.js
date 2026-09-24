export const CATEGORIES = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER'];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

// Single source of truth for which status changes are allowed.
export const ALLOWED_TRANSITIONS = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: [],
  CANCELLED: [],
};

// Object.hasOwn keeps inherited keys such as "constructor" or "__proto__" from being treated
// as statuses, so any unknown `from` returns false instead of throwing.
export function canTransition(from, to) {
  return Object.hasOwn(ALLOWED_TRANSITIONS, from) && ALLOWED_TRANSITIONS[from].includes(to);
}
