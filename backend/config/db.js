const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'hr_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  let connection;
  try {
    connection = await pool.getConnection();
    logger.info('Database connection established. Starting table initialization...');

    // Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'HR Manager', 'Employee') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Create Employees Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        position VARCHAR(100),
        joining_date DATE,
        salary DECIMAL(10,2),
        profile_picture_url VARCHAR(512),
        resume_url VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Create Documents Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uploader_id INT,
        employee_id INT,
        title VARCHAR(255) NOT NULL,
        document_type ENUM('Offer Letter', 'Resume', 'Contract', 'Other') NOT NULL,
        document_url VARCHAR(512) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Seed Default Admin User if none exists
    const [rows] = await connection.query('SELECT * FROM users WHERE role = "Admin" LIMIT 1');
    if (rows.length === 0) {
      const adminEmail = 'admin@hrsystem.com';
      const adminPassword = 'AdminSecurePass123!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const [result] = await connection.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, 'Admin']
      );

      const adminUserId = result.insertId;

      await connection.query(
        'INSERT INTO employees (user_id, first_name, last_name, department, position) VALUES (?, ?, ?, ?, ?)',
        [adminUserId, 'System', 'Admin', 'IT', 'Administrator']
      );

      logger.info(`Seeded default admin user: ${adminEmail}`);
    }

    logger.info('Database tables verified/initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize database tables:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  initDb
};
