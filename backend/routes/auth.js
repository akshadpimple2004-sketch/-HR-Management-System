const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT u.*, e.id as employee_id, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      logger.warn(`Failed login attempt for email: ${email} (User not found)`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Failed login attempt for email: ${email} (Incorrect password)`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        role: user.role,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    logger.info(`Successful login for user: ${email} (Role: ${user.role})`);

    res.json({
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT u.id, u.email, u.role, e.id as employee_id, e.first_name, e.last_name, e.department, e.position, e.profile_picture_url FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
