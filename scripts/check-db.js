// Quick script to check database connection and users
// Run with: node scripts/check-db.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  let connection;
  
  try {
    // Get connection config
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'schoolyard',
    };

    console.log('Connecting to database...');
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!\n');

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables found:', tables.length);
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));
    console.log('');

    // Check users table
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const userCount = users[0].count;
    console.log(`Users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  No users found! You need to run the migration.');
      console.log('Run: POST http://localhost:3000/api/migrate');
      console.log('Or use: curl -X POST http://localhost:3000/api/migrate');
    } else {
      // Show users
      const [userList] = await connection.execute(
        'SELECT id, username, role, name FROM users LIMIT 10'
      );
      console.log('\nUsers:');
      userList.forEach(u => {
        console.log(`  - ${u.username} (${u.role}): ${u.name}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nMake sure MySQL server is running!');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nDatabase does not exist. Create it first:');
      console.error('CREATE DATABASE schoolyard;');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Check your DB_USER and DB_PASSWORD in .env.local');
    }
    process.exit(1);
  }
}

checkDatabase();

