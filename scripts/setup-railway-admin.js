// Setup script to create initial admin user in Railway MySQL
// Run this after Railway deployment if migration wasn't run
// Usage: node scripts/setup-railway-admin.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupAdmin() {
  let connection;
  
  try {
    // Get connection from DATABASE_URL or individual variables
    let config;
    
    if (process.env.DATABASE_URL) {
      // Parse Railway MySQL connection string
      const url = new URL(process.env.DATABASE_URL);
      config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
      };
    } else {
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'schoolyard',
      };
    }

    console.log('Connecting to database...');
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`Database: ${config.database}`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Check if admin user exists
    const [existing] = await connection.execute(
      "SELECT id, username FROM users WHERE username = 'admin'"
    );

    if (existing.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   User ID: ${existing[0].id}`);
      console.log(`   Username: ${existing[0].username}`);
      console.log('\nIf you want to reset the admin password, use the password reset feature.');
      await connection.end();
      return;
    }

    // Get admin password from environment or prompt
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    
    if (adminPassword === 'password') {
      console.log('⚠️  WARNING: Using default password "password"');
      console.log('   Set ADMIN_PASSWORD environment variable for production!\n');
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const userId = 'usr-admin-' + require('crypto').randomBytes(8).toString('hex');
    
    console.log('Creating admin user...');
    await connection.execute(
      `INSERT INTO users 
       (id, username, password_hash, role, name, email, phone, staff_id, permissions, student_ids, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 'Admin User', 'admin@schoolyard.com', NULL, NULL, NULL, NULL, NOW(), NOW())`,
      [userId, 'admin', passwordHash]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('\nLogin credentials:');
    console.log(`   Username: admin`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('   Go to: User Management → Edit Admin User → Change Password\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nMake sure MySQL server is running and accessible!');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nDatabase does not exist. Run migration first:');
      console.error('   POST https://your-app.railway.app/api/migrate');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Check your database credentials.');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\nUsers table does not exist. Run migration first:');
      console.error('   POST https://your-app.railway.app/api/migrate');
    }
    process.exit(1);
  }
}

setupAdmin();

