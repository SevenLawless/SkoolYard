# Next Steps: Production Security Setup Guide

This guide provides detailed step-by-step instructions for setting up and using the production-ready security features that have been implemented in SchoolYard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running Migrations](#running-migrations)
6. [Testing Authentication](#testing-authentication)
7. [Production Deployment](#production-deployment)
8. [Security Features Overview](#security-features-overview)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MySQL Server installed (for local development)
- ✅ MySQL Workbench or another MySQL client
- ✅ Git repository set up
- ✅ Railway account (for production deployment)

---

## Local Development Setup

### Step 1: Install Dependencies

All required dependencies have been installed. Verify by running:

```bash
npm install
```

### Step 2: Set Up MySQL Database Locally

1. **Start MySQL Server**
   - On Windows: Start MySQL service from Services
   - On Mac/Linux: `sudo systemctl start mysql` or `brew services start mysql`

2. **Create Database**
   - Open MySQL Workbench
   - Connect to your local MySQL server
   - Run: `CREATE DATABASE schoolyard;`
   - Or use command line: `mysql -u root -p -e "CREATE DATABASE schoolyard;"`

3. **Verify Connection**
   - Test connection: `mysql -u root -p schoolyard`
   - Should connect successfully

---

## Database Setup

### Option A: Using MySQL Workbench (Recommended for Local)

1. **Open MySQL Workbench**
2. **Connect to your local MySQL server**
3. **Select the `schoolyard` database**
4. **Open the SQL schema file**: `lib/db/schema.sql`
5. **Execute the entire script** (all CREATE TABLE statements)
6. **Verify tables were created**:
   ```sql
   SHOW TABLES;
   ```
   Should show: `users`, `sessions`, `password_reset_tokens`, `audit_logs`

### Option B: Using Migration API (After App Starts)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Once the server is running, trigger the migration:
   ```bash
   curl -X POST http://localhost:3000/api/migrate
   ```
   
   Or visit in browser: `http://localhost:3000/api/migrate` (POST request)

3. Check the response - should show `{"success": true}`

---

## Environment Configuration

### Step 1: Create Environment File

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Open `.env.local`** and configure:

### Step 2: Database Configuration

**For Local MySQL (MySQL Workbench):**

```env
# Database Configuration (Local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=schoolyard

# OR use DATABASE_URL format:
# DATABASE_URL=mysql://root:your_password@localhost:3306/schoolyard
```

**For Railway MySQL (Production):**

```env
# Railway automatically provides DATABASE_URL
# Just ensure it's set in Railway's environment variables
DATABASE_URL=mysql://user:password@host:port/database
```

### Step 3: Generate Security Secrets

Generate strong random secrets for production:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
'111b31a1c00a4609bcb90273feddcd796c45f97273b7803f10c13b36155913bf'

# Generate JWT Refresh Secret (different from above)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
'6184f5ac0147fdfccbb02d46f591f46961258b8a225ae4edc8d51d07d26ad91d'

# Generate CSRF Secret (different from above)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
'19f88cab123e750e35d86bdf4e74d799f2f7510c257b0aea5f4def17bdf84e5d'
```

**Add to `.env.local`:**

```env
# Security Secrets (use the generated values)
JWT_SECRET=your-generated-jwt-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
CSRF_SECRET=your-generated-csrf-secret-here

# Environment
NODE_ENV=development
```

### Step 4: Complete `.env.local` File

Your complete `.env.local` should look like:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=schoolyard

# Security Secrets
JWT_SECRET=your-generated-jwt-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
CSRF_SECRET=your-generated-csrf-secret-here

# Environment
NODE_ENV=development
```

---

## Running Migrations

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Run Migration

**Option A: Using curl (Terminal)**
```bash
curl -X POST http://localhost:3000/api/migrate
```

**Option B: Using Browser**
- Open browser developer tools (F12)
- Go to Console tab
- Run: `fetch('/api/migrate', {method: 'POST'}).then(r => r.json()).then(console.log)`

**Option C: Using Postman/Insomnia**
- Method: POST
- URL: `http://localhost:3000/api/migrate`
- Send request

### Step 3: Verify Migration

1. **Check Database Tables**:
   ```sql
   USE schoolyard;
   SHOW TABLES;
   ```
   Should show 4 tables.

2. **Check Users Table**:
   ```sql
   SELECT COUNT(*) FROM users;
   ```
   Should show migrated users (default: 3 users - admin, staff1, parent1)

3. **Verify Password Hashing**:
   ```sql
   SELECT id, username, LEFT(password_hash, 20) as hash_preview FROM users;
   ```
   Passwords should be hashed (start with `$2a$` or `$2b$`)

---

## Testing Authentication

### Step 1: Test Login Flow

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Open browser**: `http://localhost:3000`

3. **Test Login**:
   - Username: `admin`
   - Password: `password`
   - Click "Sign in"

4. **Expected Behavior**:
   - Should redirect to `/dashboard`
   - Should see user info in sidebar
   - Should be able to navigate

### Step 2: Test Rate Limiting

1. **Try 5 failed login attempts**:
   - Use wrong password 5 times
   - Should get rate limit error after 5th attempt

2. **Wait 15 minutes** or clear rate limit (restart server)

### Step 3: Test Password Reset

1. **Request Password Reset Token** (as admin):
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password/request \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
     -d '{"username": "admin"}'
   ```

2. **Get CSRF Token First**:
   ```bash
   curl http://localhost:3000/api/auth/csrf
   ```

3. **Use the token** to reset password via `/api/auth/reset-password/confirm`

### Step 4: Test Session Management

1. **Login** and verify session cookie is set
2. **Check database**:
   ```sql
   SELECT * FROM sessions;
   ```
   Should see active session

3. **Logout** and verify session is deleted

### Step 5: Test Audit Logging

1. **Perform actions** (login, logout, etc.)
2. **Check audit logs**:
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```
   Should see logged events

---

## Production Deployment

### Step 1: Prepare for Railway

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Add production security features"
   git push
   ```

2. **Verify `.env.local` is in `.gitignore`** (should be already)

### Step 2: Deploy to Railway

Follow the detailed guide in `RAILWAY_DEPLOYMENT.md`:

1. **Create Railway project**
2. **Add MySQL service**
3. **Set environment variables**:
   - `DATABASE_URL` (from MySQL service)
   - `JWT_SECRET` (generate new one)
   - `JWT_REFRESH_SECRET` (generate new one)
   - `CSRF_SECRET` (generate new one)
   - `NODE_ENV=production`

4. **Deploy application**

### Step 3: Run Production Migration

1. **After deployment**, visit: `https://your-app.railway.app/api/migrate`
2. **Or use curl**:
   ```bash
   curl -X POST https://your-app.railway.app/api/migrate
   ```

3. **Verify migration**:
   - Check Railway logs for success message
   - Connect to Railway MySQL and verify tables exist

### Step 4: Change Default Passwords

⚠️ **CRITICAL**: Change default passwords immediately:

1. **Login** with default credentials
2. **Go to User Management** (`/admin/users`)
3. **Edit each user** and set strong passwords
4. **Verify** new passwords work

---

## Security Features Overview

### ✅ Implemented Features

1. **Password Hashing**
   - All passwords hashed with bcrypt (12 rounds)
   - Passwords never stored in plain text
   - Automatic hashing on user creation/update

2. **JWT Token Authentication**
   - Access tokens: 15 minutes expiry
   - Refresh tokens: 7 days expiry
   - Stored in httpOnly cookies
   - Automatic token refresh

3. **Session Management**
   - Server-side session storage in database
   - Session cleanup on logout
   - Automatic expired session cleanup

4. **CSRF Protection**
   - Signed CSRF tokens
   - Required for all POST/PUT/DELETE requests
   - Automatic token generation

5. **Rate Limiting**
   - 5 login attempts per 15 minutes per IP
   - Prevents brute force attacks
   - In-memory storage (Redis recommended for scaling)

6. **Password Complexity**
   - Minimum 8 characters
   - Requires uppercase, lowercase, number, special character
   - Enforced on password creation/change

7. **Password Reset**
   - Token-based reset (1-hour expiry)
   - One-time use tokens
   - Secure token generation

8. **Audit Logging**
   - All authentication events logged
   - Tracks: login, logout, password changes, etc.
   - Includes IP address and user agent
   - Stored in `audit_logs` table

9. **HTTPS**
   - Automatically provided by Railway
   - Required for production

---

## API Endpoints Reference

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify current session
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/csrf` - Get CSRF token

### Password Reset Endpoints

- `POST /api/auth/reset-password/request` - Request reset token
- `POST /api/auth/reset-password/confirm` - Confirm password reset

### Migration Endpoint

- `POST /api/migrate` - Run database migration

---

## Troubleshooting

### Database Connection Issues

**Problem**: "Cannot connect to database"

**Solutions**:
1. Verify MySQL server is running
2. Check database credentials in `.env.local`
3. Test connection: `mysql -u root -p -h localhost`
4. Verify database exists: `SHOW DATABASES;`

### Migration Fails

**Problem**: Migration endpoint returns error

**Solutions**:
1. Check database connection
2. Verify tables don't already exist (migration is idempotent)
3. Check Railway logs for detailed error
4. Manually run SQL schema if needed

### Login Not Working

**Problem**: "Invalid credentials" even with correct password

**Solutions**:
1. Verify users were migrated to database
2. Check password hash in database (should start with `$2a$`)
3. Verify JWT_SECRET is set correctly
4. Check browser console for errors
5. Verify CSRF token is being sent

### Rate Limiting Too Strict

**Problem**: Getting rate limited too quickly

**Solutions**:
1. Wait 15 minutes for reset
2. Restart development server (clears in-memory store)
3. Modify rate limit in `lib/middleware/rateLimit.ts` for development

### CSRF Token Errors

**Problem**: "Invalid CSRF token"

**Solutions**:
1. Verify CSRF_SECRET is set in environment
2. Check that CSRF token is being fetched before login
3. Verify token is sent in `X-CSRF-Token` header
4. Check cookie settings (sameSite, secure)

### Session Expires Too Quickly

**Problem**: Getting logged out frequently

**Solutions**:
1. Access tokens expire in 15 minutes (by design)
2. Refresh token should automatically refresh access token
3. Check browser allows cookies
4. Verify session exists in database

---

## Security Best Practices

### For Development

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong secrets** - Even for development
3. **Test rate limiting** - Ensure it works
4. **Review audit logs** - Check what's being logged

### For Production

1. **Generate unique secrets** - Don't reuse development secrets
2. **Change default passwords** - Immediately after deployment
3. **Monitor audit logs** - Regularly review for suspicious activity
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use HTTPS only** - Railway provides this automatically
6. **Regular backups** - Backup MySQL database regularly
7. **Review rate limiting** - Adjust if needed for your use case

---

## Next Steps After Setup

1. ✅ **Database Setup** - Complete
2. ✅ **Environment Configuration** - Complete
3. ✅ **Migration** - Run migration endpoint
4. ✅ **Test Authentication** - Verify login/logout works
5. ⏭️ **Change Default Passwords** - Critical security step
6. ⏭️ **Test All Features** - Verify everything works
7. ⏭️ **Deploy to Railway** - Follow RAILWAY_DEPLOYMENT.md
8. ⏭️ **Monitor Logs** - Set up monitoring
9. ⏭️ **Regular Backups** - Set up database backups

---

## Additional Resources

- **Railway Deployment**: See `RAILWAY_DEPLOYMENT.md`
- **User Management**: See `USER_MANAGEMENT.md`
- **Database Schema**: See `lib/db/schema.sql`
- **API Documentation**: See code comments in `app/api/auth/`

---

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Railway logs for deployment issues
3. Check database connection and tables
4. Verify all environment variables are set
5. Review audit logs for authentication issues

---

**Last Updated**: After production security implementation
**Version**: 1.0.0

