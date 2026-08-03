const bcrypt = require('bcrypt');
const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getProfile = async (req, res, next) => {
  try {
    // req.user has been attached by the protect middleware
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address' });
    }

    const phoneVal = phone !== undefined && phone !== null ? String(phone).trim() : '';

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, phone, role, profile_image AS "profileImage"',
      [name.trim(), email.trim(), phoneVal, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    createNotification({
      title: 'Profile Updated',
      message: `Administrator profile details updated for ${result.rows[0].name}.`,
      type: 'info',
      icon: 'user',
      reference_type: 'system',
      reference_id: req.user.id,
      created_by: req.user.id
    });

    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'All password fields are required' });
    }

    // 1. Fetch user password hash from DB
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, status: 'error', message: 'User not found' });
    }
    const currentHash = userResult.rows[0].password;

    // 2. Compare current password hash using bcrypt.compare()
    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // 3. New password validation rules
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password must be at least 8 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password must be different from current password' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password and confirm password do not match' });
    }

    // 4. Hash the new password using bcrypt.hash()
    const hashedNew = await bcrypt.hash(newPassword, 10);

    // 5. Update user password column in user table
    const updateResult = await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, req.user.id]);

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ success: false, status: 'error', message: 'Failed to update database record' });
    }

    createNotification({
      title: 'Security Alert',
      message: 'Admin account password changed successfully.',
      type: 'warning',
      icon: 'shield-alert',
      reference_type: 'system',
      reference_id: req.user.id,
      created_by: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
