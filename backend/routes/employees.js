const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { pool } = require('../config/db');
const s3Client = require('../config/s3');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');

const S3_BUCKET = process.env.S3_DOCUMENTS_BUCKET;

// Setup Multer storage (S3 if bucket name exists, otherwise local disk storage for dev/fallback)
let upload;
if (S3_BUCKET) {
  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: S3_BUCKET,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const folder = file.fieldname === 'profile_picture' ? 'avatars/' : 'resumes/';
        cb(null, folder + uniqueSuffix + '-' + file.originalname);
      }
    })
  });
  logger.info('Multer configured to upload files directly to S3.');
} else {
  // Local fallback storage
  const path = require('path');
  const fs = require('fs');
  const tempDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempDir);
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  upload = multer({ storage: localStorage });
  logger.warn('S3_DOCUMENTS_BUCKET not set. Multer configured to use local directory /uploads.');
}

const fileFields = upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// Helper to extract file url
const getFileUrl = (req, fieldName, fileObj) => {
  if (!fileObj) return null;
  if (S3_BUCKET) {
    return fileObj.location; // MulterS3 sets .location for S3 file URL
  }
  // Local server fallback URL path
  return `/uploads/${fileObj.filename}`;
};

// GET /api/employees
router.get('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Regular Employee can only view basic columns of others
    const isElevated = ['Admin', 'HR Manager'].includes(req.user.role);

    let query = '';
    if (isElevated) {
      query = `
        SELECT e.*, u.email, u.role 
        FROM employees e 
        JOIN users u ON e.user_id = u.id
      `;
    } else {
      query = `
        SELECT e.id, e.first_name, e.last_name, e.department, e.position, e.profile_picture_url, u.email 
        FROM employees e 
        JOIN users u ON e.user_id = u.id
      `;
    }

    const [employees] = await connection.query(query);
    res.json(employees);
  } catch (error) {
    logger.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/employees/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const isElevated = ['Admin', 'HR Manager'].includes(req.user.role);
  const isSelf = req.user.employee_id === employeeId;

  if (!isElevated && !isSelf) {
    return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [employees] = await connection.query(
      `SELECT e.*, u.email, u.role FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    res.json(employees[0]);
  } catch (error) {
    logger.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/employees (Create Employee - Admin / HR Manager only)
router.post('/', authenticateToken, authorizeRoles('Admin', 'HR Manager'), fileFields, async (req, res) => {
  const { email, password, first_name, last_name, phone, department, position, joining_date, salary, role } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'Email, password, first_name, and last_name are required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // Create credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'Employee';

    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, userRole]
    );
    const userId = userResult.insertId;

    // Handle files
    const profilePicFile = req.files && req.files['profile_picture'] ? req.files['profile_picture'][0] : null;
    const resumeFile = req.files && req.files['resume'] ? req.files['resume'][0] : null;

    const profilePicUrl = getFileUrl(req, 'profile_picture', profilePicFile);
    const resumeUrl = getFileUrl(req, 'resume', resumeFile);

    // Create Employee Profile
    const [empResult] = await connection.query(
      `INSERT INTO employees (user_id, first_name, last_name, phone, department, position, joining_date, salary, profile_picture_url, resume_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        first_name,
        last_name,
        phone || null,
        department || null,
        position || null,
        joining_date || null,
        salary ? parseFloat(salary) : null,
        profilePicUrl,
        resumeUrl
      ]
    );

    await connection.commit();
    logger.info(`Successfully created employee profile for ${email} with ID ${empResult.insertId}`);
    res.status(201).json({ message: 'Employee created successfully', employeeId: empResult.insertId });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Error creating employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/employees/:id (Update Profile - Admin, HR Manager, or matching Employee)
router.put('/:id', authenticateToken, fileFields, async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const isElevated = ['Admin', 'HR Manager'].includes(req.user.role);
  const isSelf = req.user.employee_id === employeeId;

  if (!isElevated && !isSelf) {
    return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
  }

  const { first_name, last_name, phone, department, position, joining_date, salary, role, email } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if employee profile exists
    const [employees] = await connection.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (employees.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Employee profile not found.' });
    }
    const currentEmployee = employees[0];

    // Gather update fields
    let updatedProfilePicUrl = currentEmployee.profile_picture_url;
    let updatedResumeUrl = currentEmployee.resume_url;

    if (req.files && req.files['profile_picture']) {
      updatedProfilePicUrl = getFileUrl(req, 'profile_picture', req.files['profile_picture'][0]);
    }
    if (req.files && req.files['resume']) {
      updatedResumeUrl = getFileUrl(req, 'resume', req.files['resume'][0]);
    }

    // Standard profile updates
    await connection.query(
      `UPDATE employees SET 
        first_name = ?, 
        last_name = ?, 
        phone = ?, 
        department = ?, 
        position = ?, 
        joining_date = ?, 
        salary = ?, 
        profile_picture_url = ?, 
        resume_url = ? 
       WHERE id = ?`,
      [
        first_name !== undefined ? first_name : currentEmployee.first_name,
        last_name !== undefined ? last_name : currentEmployee.last_name,
        phone !== undefined ? phone : currentEmployee.phone,
        isElevated && department !== undefined ? department : currentEmployee.department,
        isElevated && position !== undefined ? position : currentEmployee.position,
        isElevated && joining_date !== undefined ? joining_date : currentEmployee.joining_date,
        isElevated && salary !== undefined ? parseFloat(salary) : currentEmployee.salary,
        updatedProfilePicUrl,
        updatedResumeUrl,
        employeeId
      ]
    );

    // Elevated users can update role & email
    if (isElevated) {
      if (email || role) {
        const [users] = await connection.query('SELECT role, email FROM users WHERE id = ?', [currentEmployee.user_id]);
        if (users.length > 0) {
          await connection.query(
            'UPDATE users SET email = ?, role = ? WHERE id = ?',
            [
              email || users[0].email,
              role || users[0].role,
              currentEmployee.user_id
            ]
          );
        }
      }
    }

    await connection.commit();
    logger.info(`Successfully updated employee ID ${employeeId}`);
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Error updating employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/employees/:id (Delete Employee - Admin / HR Manager only)
router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), async (req, res) => {
  const employeeId = parseInt(req.params.id);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [employees] = await connection.query('SELECT user_id FROM employees WHERE id = ?', [employeeId]);
    if (employees.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const userId = employees[0].user_id;

    // Delete employee profile (will cascade from users if FK setup, but explicit is safer)
    await connection.query('DELETE FROM employees WHERE id = ?', [employeeId]);
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();
    logger.info(`Successfully deleted employee ID ${employeeId} and associated user credentials`);
    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
