const successResponse = (res, status, data) => {
  return res.status(status).json({
    success: true,
    ...data,
  });
};

const errorResponse = (res, status, message, errors = null) => {
  return res.status(status).json({
    success: false,
    error: message,
    ...(errors && { errors }),
  });
};

module.exports = { successResponse, errorResponse };
