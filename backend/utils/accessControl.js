/**
 * ============================================
 * PropLedger - Access Control Utility
 * ============================================
 * Shared helper to resolve accessible user IDs
 * based on the requesting user's role.
 *
 * @author Ravi Makwana
 * @version 1.0.0
 */

const User = require('../models/User');

/**
 * Returns an array of user IDs that the given user is allowed to access.
 *
 * - manager : themselves + the admin who created them
 * - admin   : themselves + all users they created
 * - others  : only themselves
 *
 * @param {Object} user - The authenticated user document (req.user)
 * @returns {Promise<Array>} Array of accessible ObjectId values
 */
const getAccessibleUserIds = async (user) => {
  if (user.role === 'manager' && user.createdByAdmin) {
    return [user._id, user.createdByAdmin];
  }

  if (user.role === 'admin') {
    const managedUsers = await User.find({ createdByAdmin: user._id }).select('_id').lean();
    return [user._id, ...managedUsers.map((u) => u._id)];
  }

  return [user._id];
};

module.exports = { getAccessibleUserIds };
