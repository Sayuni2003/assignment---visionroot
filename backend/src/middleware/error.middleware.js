export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Express recognises error handlers by their four arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
