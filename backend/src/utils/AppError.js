// Operational error with an HTTP status. `errors` carries optional per-field details,
// e.g. new AppError(400, 'Validation failed', { email: 'Email is required' }).
export default class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (errors) {
      this.errors = errors;
    }
  }
}
