const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to parse cookies from header
const parseCookies = (req) => {
  const cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return cookies;
};

const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else {
      const parsedCookies = parseCookies(req);
      if (parsedCookies.token) {
        token = parsedCookies.token;
      }
    }

    // 2. Fallback to Authorization Header (Bearer token)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: No authentication token found. Please sign in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'csestudyplanner_super_secret_jwt_key_2026'
    );

    // Attach authenticated user to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid or expired token.',
    });
  }
};

module.exports = { protect, parseCookies };
