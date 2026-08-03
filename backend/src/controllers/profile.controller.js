const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const uploadPhoto = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Please provide an image file to upload.'
      });
    }

    // 1. Query existing user record to find previous profile image
    const userRes = await db.query('SELECT profile_image FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        status: 'error',
        message: 'User profile not found.'
      });
    }

    const previousImagePath = userRes.rows[0].profile_image;

    // 2. Delete old image file from server filesystem if it exists
    if (previousImagePath && previousImagePath.startsWith('/uploads/profile/')) {
      const fullOldPath = path.join(__dirname, '../../', previousImagePath);
      fs.unlink(fullOldPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('⚠️ Could not delete previous profile image:', err.message);
        } else {
          console.log('🗑️ Successfully deleted previous profile image:', previousImagePath);
        }
      });
    }

    // 3. Save relative path of new uploaded image to PostgreSQL
    const newRelativePath = `/uploads/profile/${req.file.filename}`;
    
    const updateRes = await db.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, profile_image AS "profileImage"',
      [newRelativePath, userId]
    );

    const updatedUser = updateRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      imageUrl: newRelativePath,
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Profile photo upload error:', error);
    next(error);
  }
};

module.exports = {
  uploadPhoto
};
