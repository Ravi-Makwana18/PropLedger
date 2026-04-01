/**
 * ============================================
 * PropLedger - JWT Token Generator
 * ============================================
 * Generates JSON Web Tokens for user authentication
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for user authentication
 * Token expires in 1 hour for security
 * 
 * @param {string} id - User ID to encode in token
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

module.exports = generateToken;
