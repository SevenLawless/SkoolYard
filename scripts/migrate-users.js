// Direct migration script - runs without needing the server
// Run with: node scripts/migrate-users.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

  // Default users for authentication only (no demo data)
  const defaultStaffPermissions = {
    viewStudents: true,
    editStudents: true,
    deleteStudents: false,
    viewTeachers: true,
    editTeachers: false,
    deleteTeachers: false,
    viewClasses: true,
    editClasses: true,
    deleteClasses: false,
    viewPayments: true,
    editPayments: true,
    deletePayments: false,
    viewStaff: true,
    editStaff: false,
    deleteStaff: false,
    viewMarketing: true,
    editMarketing: false,
    deleteMarketing: false,
    viewDashboard: true,
  };

  const users = [
    {
      id: "usr-1",
      username: "admin",
      password: "password",
      role: "admin",
      name: "Admin User",
      email: "admin@schoolyard.com",
      phone: "+212 6 00 00 00 00",
      staffId: null,
      permissions: null,
      studentIds: null,
    },
    {
      id: "usr-2",
      username: "staff1",
      password: "password",
      role: "staff",
      name: "Rachid El Mansouri",
      email: "rachid.mansouri@schoolyard.com",
      phone: "+212 6 99 88 77 66",
      staffId: null,
      permissions: defaultStaffPermissions,
      studentIds: null,
    },
    {
      id: "usr-3",
      username: "parent1",
      password: "password",
      role: "parent",
      name: "Fatima Benali",
      email: "fatima.benali@gmail.com",
      phone: "+212 6 11 22 33 44",
      staffId: null,
      permissions: null,
      studentIds: null, // Empty - no students linked yet
    },
  ];

async function migrateUsers() {
  let connection;
  
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'schoolyard',
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Check if users already exist
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (existing[0].count > 0) {
      console.log(`⚠️  ${existing[0].count} users already exist. Skipping migration.`);
      console.log('If you want to re-migrate, delete users first.');
      await connection.end();
      return;
    }

    console.log(`Migrating ${users.length} users...\n`);

    for (const user of users) {
      try {
        // Hash password
        const passwordHash = await bcrypt.hash(user.password, 12);

        // Prepare JSON fields
        const permissionsJson = user.permissions ? JSON.stringify(user.permissions) : null;
        const studentIdsJson = user.studentIds && user.studentIds.length > 0 ? JSON.stringify(user.studentIds) : null;

        // Insert user
        await connection.execute(
          `INSERT INTO users 
           (id, username, password_hash, role, name, email, phone, staff_id, permissions, student_ids, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            user.id,
            user.username,
            passwordHash,
            user.role,
            user.name,
            user.email,
            user.phone || null,
            user.staffId || null,
            permissionsJson,
            studentIdsJson,
          ]
        );

        console.log(`✅ Migrated: ${user.username} (${user.role})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  ${user.username} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nYou can now login with:');
    console.log('  Username: admin');
    console.log('  Password: password');

    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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

migrateUsers();

