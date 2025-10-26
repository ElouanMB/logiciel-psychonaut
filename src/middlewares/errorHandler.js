/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error response
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    ok: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
