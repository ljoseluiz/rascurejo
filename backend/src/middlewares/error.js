export function errorHandler(logger) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const status = err.status || 500;
    const payload = {
      error: err.message || "Internal Server Error",
      code: err.code || "INTERNAL_ERROR",
      requestId: req.id,
    };
    if (status >= 500) logger.error({ err, requestId: req.id }, "Unhandled error");
    res.status(status).json(payload);
  };
}