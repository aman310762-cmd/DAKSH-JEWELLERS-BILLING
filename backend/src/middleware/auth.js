const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "daksh-jewellers-secret-key-2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Auth middleware — verifies JWT token from Authorization header.
 * Attaches decoded user to req.user if valid.
 * If no token is provided, request still passes (for backward compatibility).
 * Use `requireAuth` for routes that MUST be authenticated.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // Invalid token — continue without user (backward compat)
    }
  }
  next();
};

/**
 * Strict auth middleware — requires valid JWT.
 * Returns 401 if no token or invalid token.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Generate JWT token for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = { optionalAuth, requireAuth, generateToken, JWT_SECRET };
