import crypto from "crypto";

/**
 * Generates and attaches a CSRF token per session cookie.
 * Expects a session cookie to exist after login.
 * Verifies CSRF on state-changing methods (POST/PUT/PATCH/DELETE).
 */
export function attachCsrf(req, res, next) {
  // Expose token via GET /auth/csrf and in login response
  req.csrf = {
    issue: () => {
      const token = crypto.randomBytes(16).toString("hex");
      // Bind token to request-scoped memory; real impl should bind to session store keyed by session id
      req.csrfToken = token;
      return token;
    },
    verify: () => {
      const method = req.method.toUpperCase();
      const needsCheck = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
      if (!needsCheck) return true;

      const headerToken = req.headers["x-csrf-token"];
      const cookieSession = req.cookies?.session;

      if (!cookieSession) {
        const err = new Error("Missing session");
        err.status = 401;
        err.code = "NO_SESSION";
        throw err;
      }
      if (!headerToken) {
        const err = new Error("Missing CSRF token");
        err.status = 403;
        err.code = "MISSING_CSRF";
        throw err;
      }
      // Basic validation: in production tie token to session in a store
      if (String(headerToken).length < 10) {
        const err = new Error("Invalid CSRF token");
        err.status = 403;
        err.code = "INVALID_CSRF";
        throw err;
      }
      return true;
    },
  };

  next();
}

// Middleware helper to enforce CSRF on state-changing routes
export function requireCsrf(req, res, next) {
  try {
    req.csrf.verify();
    next();
  } catch (err) {
    next(err);
  }
}