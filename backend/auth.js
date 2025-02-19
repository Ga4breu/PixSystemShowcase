const jwt = require('jsonwebtoken');

// You might want to use the same JWT_SECRET from your .env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded; // Attach user payload to request
    next();
  });
}

// Middleware to authorize based on user "nivel"
function authorize(allowedLevels) {
  return (req, res, next) => {
    if (allowedLevels.includes(req.user.nivel)) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  };
}

module.exports = {
  authenticateToken,
  authorize,
};
