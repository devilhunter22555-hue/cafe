function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    console.error(`Request error: ${err.message}`);
  }

  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      data: null,
      message: 'An unexpected error occurred',
      statusCode
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message,
    statusCode
  });
}

module.exports = errorHandler;
