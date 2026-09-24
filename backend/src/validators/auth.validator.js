import AppError from '../utils/AppError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything after 72 bytes, so longer passwords would be silently truncated.
const PASSWORD_MAX_BYTES = 72;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function throwIfErrors(errors) {
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'Validation failed', errors);
  }
}

// Each validator reads only the fields it knows about (so `role` and other extras are dropped)
// and returns the cleaned values, or throws a 400 AppError listing every invalid field.
export function validateRegister(body) {
  const { name, email, password } = body ?? {};
  const errors = {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  const normalisedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(normalisedEmail)) {
    errors.email = 'A valid email is required';
  }

  if (
    typeof password !== 'string' ||
    password.length < PASSWORD_MIN_LENGTH ||
    Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES
  ) {
    errors.password = 'Password must be between 8 and 72 characters';
  }

  throwIfErrors(errors);

  return { name: trimmedName, email: normalisedEmail, password };
}

export function validateLogin(body) {
  const { email, password } = body ?? {};
  const errors = {};

  if (!isNonEmptyString(email)) {
    errors.email = 'Email is required';
  }

  if (!isNonEmptyString(password)) {
    errors.password = 'Password is required';
  }

  throwIfErrors(errors);

  return { email: email.trim().toLowerCase(), password };
}
