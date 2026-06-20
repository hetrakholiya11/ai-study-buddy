import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware validating active JWT tokens and injecting users context into request scope.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header payload string
      token = req.headers.authorization.split(' ')[1];

      // Decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user matching token, exclude password hash from return context
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User not found in system' });
      }

      next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error);
      return res.status(401).json({ success: false, error: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, token key is missing' });
  }
};
