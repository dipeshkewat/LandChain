/**
 * Central error-handling middleware.
 * Catches both operational errors and unexpected exceptions.
 */
function errorHandler(err, req, res, _next) {
  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", err);
  }

  // Multer file-size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }

  // Multer unexpected field
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Unexpected file field" });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Internal server error";

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
