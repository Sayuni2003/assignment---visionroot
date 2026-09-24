// Operational error with an HTTP status. `errors` carries optional per-field details,
// e.g. { email: 'Email is already registered' }.
export default class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (errors) {
      this.errors = errors;
    }
  }
}
