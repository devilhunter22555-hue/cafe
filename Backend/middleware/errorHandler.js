function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message,
    statusCode
  });
}

module.exports = errorHandler;
