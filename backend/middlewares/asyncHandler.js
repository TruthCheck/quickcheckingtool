// Async handler to wrap route handlers for automatic error handling

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        error.requestInfo = {
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          query: req.query,
          body: Object.keys(req.body).length > 0 ? req.body : undefined,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        };
  
        if (!error.statusCode) {
          error.statusCode = 500;
        }
  
        if (process.env.NODE_ENV === 'development') {
          error.stackTrace = error.stack;
        }
  
        next(error);
      });
  };
  
  module.exports = asyncHandler;