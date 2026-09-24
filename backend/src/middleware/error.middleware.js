import mongoose from 'mongoose';

import AppError from '../utils/AppError.js';

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Translates known error types into { statusCode, message, errors? }. Anything unrecognised
// is treated as an unexpected failure so internal details never reach the client.
function normaliseError(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: 'Invalid ID' };
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    const errors = fields.length
      ? Object.fromEntries(fields.map((field) => [field, `${field} already exists`]))
      : undefined;
    return { statusCode: 409, message: 'Duplicate value', errors };
  }

  // express.json() (body-parser) flags JSON parse failures with type 'entity.parse.failed'.
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON' };
  }

  // Raised when a body exceeds the express.json() size limit.
  if (err?.type === 'entity.too.large') {
    return { statusCode: 413, message: 'Request body too large' };
  }

  return { statusCode: 500, message: 'Internal server error' };
}

// Express recognises error handlers by their four arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const { statusCode, message, errors } = normaliseError(err);

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
