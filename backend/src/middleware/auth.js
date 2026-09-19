const jwt = require('jsonwebtoken');

// Middleware: Verify JWT token (the security guard)
const authenticate = (req, res, next) => {
  // Step 1: Get the token from the request header
  const authHeader = req.headers['authorization'];
  // Token comes as: "Bearer eyJhbGciOi..."
  // We split by space and take the second part
  const token = authHeader && authHeader.split(' ');

  // Step 2: No token? Not allowed.
  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.'
    });
  }

  // Step 3: Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Token is valid — attach user info to the request
    // Now every route handler can access req.user
    req.user = decoded;
    next(); // Let the request proceed to the route
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token.'
    });
  }
};

// Middleware: Check user role (the floor access card)
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user was set by authenticate middleware above
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
