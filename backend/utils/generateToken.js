/**
 * ============================================
 * PropLedger - JWT Token Generator
 * ============================================
 * Generates JSON Web Tokens for user authentication.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for user authentication.
 * Expiry is driven by the JWT_EXPIRE environment variable (default: 7d).
 *
 * @param {string} id - User ID to encode in the token payload
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
