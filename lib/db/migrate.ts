import { initDatabase, getPool, query } from './connection';
import { hashPassword } from '@/lib/auth/password';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Initialize database schema
 */
export async function initializeSchema(): Promise<void> {
  const pool = getPool();
  
  // Try to read schema file, if not available, use inline schema
  let schema: string;
  const schemaPath = join(process.cwd(), 'lib/db/schema.sql');
  
  if (existsSync(schemaPath)) {
    schema = readFileSync(schemaPath, 'utf-8');
  } else {
    // Fallback: inline schema
    schema = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'parent') NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  staff_id VARCHAR(255),
  permissions JSON,
  student_ids JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  status ENUM('success', 'failure', 'error') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  }
  
  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error: any) {
      // Ignore "table already exists" errors
      if (!error.message?.includes('already exists') && !error.message?.includes('Duplicate')) {
        console.error('Schema initialization error:', error.message);
        throw error;
      }
    }
  }

  console.log('Database schema initialized');
}

/**
 * Migrate default users to MySQL (only if database is empty)
 * This creates the initial admin, staff, and parent users for authentication
 */
export async function migrateUsersFromLocalStorage(): Promise<void> {
  const pool = getPool();
  
  // Check if users table has any data
  const existingUsers = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  
  if (existingUsers[0]?.count > 0) {
    console.log('Users already exist in database, skipping migration');
    return;
  }

  // Default users for initial setup (only authentication users, no demo data)
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
      role: "admin" as const,
      name: "Admin User",
      email: "admin@schoolyard.com",
      phone: "+212 6 00 00 00 00",
      staffId: undefined,
      permissions: undefined,
      studentIds: undefined,
    },
    {
      id: "usr-2",
      username: "staff1",
      password: "password",
      role: "staff" as const,
      name: "Rachid El Mansouri",
      email: "rachid.mansouri@schoolyard.com",
      phone: "+212 6 99 88 77 66",
      staffId: undefined,
      permissions: defaultStaffPermissions,
      studentIds: undefined,
    },
    {
      id: "usr-3",
      username: "parent1",
      password: "password",
      role: "parent" as const,
      name: "Fatima Benali",
      email: "fatima.benali@gmail.com",
      phone: "+212 6 11 22 33 44",
      staffId: undefined,
      permissions: undefined,
      studentIds: [], // Empty - no students linked yet
    },
  ];

  console.log(`Migrating ${users.length} default users to MySQL...`);

  // Migrate each user
  for (const user of users) {
    try {
      // Hash the password
      const passwordHash = await hashPassword(user.password);

      // Prepare permissions and student_ids as JSON
      const permissionsJson = user.permissions
        ? JSON.stringify(user.permissions)
        : null;
      const studentIdsJson = user.studentIds && user.studentIds.length > 0
        ? JSON.stringify(user.studentIds)
        : null;

      // Insert user
      await pool.execute(
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

      console.log(`Migrated user: ${user.username}`);
    } catch (error: any) {
      // Skip if user already exists
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`User ${user.username} already exists, skipping`);
        continue;
      }
      console.error(`Error migrating user ${user.username}:`, error.message);
      throw error;
    }
  }

  console.log('User migration completed');
}

/**
 * Run full migration (schema + users)
 */
export async function runMigration(): Promise<void> {
  try {
    console.log('Starting database migration...');
    
    // Initialize database connection
    initDatabase();
    
    // Initialize schema
    await initializeSchema();
    
    // Migrate users
    await migrateUsersFromLocalStorage();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

