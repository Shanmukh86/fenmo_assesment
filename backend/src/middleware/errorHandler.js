/**
 * Centralized error handler middleware
 * Converts errors into appropriate HTTP responses
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    status: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(400).json({
      error: `Duplicate value for ${field}`,
      code: 'DUPLICATE_KEY',
      timestamp: new Date().toISOString(),
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Resource not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      timestamp: err.timestamp,
    });
  }

  // Default 500 error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  AppError,
  errorHandler,
};
