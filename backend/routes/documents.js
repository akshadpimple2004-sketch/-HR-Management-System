const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { pool } = require('../config/db');
const s3Client = require('../config/s3');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');

const S3_BUCKET = process.env.S3_DOCUMENTS_BUCKET;

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
        cb(null, 'documents/' + uniqueSuffix + '-' + file.originalname);
      }
    })
  });
} else {
  const path = require('path');
  const fs = require('fs');
  const tempDir = path.join(__dirname, '../uploads/documents');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  upload = multer({ storage: localStorage });
}

// GET /api/documents
router.get('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    let query = '';
    let params = [];

    if (['Admin', 'HR Manager'].includes(req.user.role)) {
      query = `
        SELECT d.*, e.first_name, e.last_name, u.email as uploader_email 
        FROM documents d
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN users u ON d.uploader_id = u.id
        ORDER BY d.uploaded_at DESC
      `;
    } else {
      query = `
        SELECT d.*, e.first_name, e.last_name, u.email as uploader_email 
        FROM documents d
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN users u ON d.uploader_id = u.id
        WHERE d.employee_id = ?
        ORDER BY d.uploaded_at DESC
      `;
      params = [req.user.employee_id];
    }

    const [documents] = await connection.query(query, params);
    res.json(documents);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/documents (Upload document)
router.post('/', authenticateToken, upload.single('document_file'), async (req, res) => {
  const { title, document_type, employee_id } = req.body;

  if (!title || !document_type || !req.file) {
    return res.status(400).json({ message: 'Title, document type, and file are required.' });
  }

  // Check roles: Only Admin/HR can upload for other employees, regular Employee can only upload for themselves
  const targetEmployeeId = parseInt(employee_id);
  const isElevated = ['Admin', 'HR Manager'].includes(req.user.role);
  const isSelf = req.user.employee_id === targetEmployeeId;

  if (!isElevated && !isSelf) {
    return res.status(403).json({ message: 'Access denied. You can only upload documents for yourself.' });
  }

  const documentUrl = S3_BUCKET ? req.file.location : `/uploads/documents/${req.file.filename}`;

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO documents (uploader_id, employee_id, title, document_type, document_url) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, targetEmployeeId || null, title, document_type, documentUrl]
    );

    logger.info(`Uploaded document ID ${result.insertId}: "${title}" of type ${document_type}`);
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: result.insertId,
        title,
        document_type,
        document_url: documentUrl
      }
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/documents/:id (Admin/HR only)
router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), async (req, res) => {
  const docId = parseInt(req.params.id);

  let connection;
  try {
    connection = await pool.getConnection();
    const [docs] = await connection.query('SELECT * FROM documents WHERE id = ?', [docId]);

    if (docs.length === 0) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    await connection.query('DELETE FROM documents WHERE id = ?', [docId]);
    logger.info(`Deleted document ID ${docId}`);
    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
