// server/middleware/errorHandler.js

// 1. Define the custom ErrorHandler class
class CustomErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 2. Define the Express error handling middleware function
const expressErrorHandlerMiddleware = (err, req, res, next) => {
  // Ensure err has statusCode and message properties
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log the error for debugging
  console.error(`Error ${err.statusCode}: ${err.message}`, err.stack);

  // Send the error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : {} // Optional: send stack in dev
  });
};

// 3. Export both the class and the middleware function
module.exports = {
  ErrorHandler: CustomErrorHandler,        // Export the class under the name ErrorHandler
  errorHandler: expressErrorHandlerMiddleware // Export the middleware function under the name errorHandler
};