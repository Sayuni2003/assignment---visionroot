import { STATUSES, canTransition } from '../src/constants/request.constants.js';

// Written out by hand (not read from ALLOWED_TRANSITIONS) so the test checks the business rules
// rather than repeating the code.
const ALLOWED = [
  ['PENDING', 'IN_PROGRESS'],
  ['PENDING', 'CANCELLED'],
  ['IN_PROGRESS', 'RESOLVED'],
  ['IN_PROGRESS', 'CANCELLED'],
];

// Every other (from, to) pair, including same-to-same and anything out of RESOLVED or CANCELLED.
const FORBIDDEN = STATUSES.flatMap((from) => STATUSES.map((to) => [from, to])).filter(
  ([from, to]) => !ALLOWED.some(([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to),
);

describe('canTransition', () => {
  test.each(ALLOWED)('%s -> %s is allowed', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  test.each(FORBIDDEN)('%s -> %s is forbidden', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  test.each(['UNKNOWN', undefined, 'constructor', '__proto__'])(
    'an unknown status (%s) returns false without throwing',
    (from) => {
      expect(() => canTransition(from, 'PENDING')).not.toThrow();
      expect(canTransition(from, 'PENDING')).toBe(false);
    },
  );
});
