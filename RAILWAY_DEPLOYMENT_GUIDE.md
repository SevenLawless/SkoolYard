# Railway Deployment Guide: Complete Setup

This comprehensive guide will walk you through deploying SchoolYard to Railway with a fully functional admin account and all production security features enabled.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Project Setup](#railway-project-setup)
3. [MySQL Database Setup](#mysql-database-setup)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Deploy Application](#deploy-application)
6. [Initialize Database and Create Admin](#initialize-database-and-create-admin)
7. [Verify Deployment](#verify-deployment)
8. [Create Additional Admin Accounts](#create-additional-admin-accounts)
9. [Password Reset Guide](#password-reset-guide)
10. [Security Features Overview](#security-features-overview)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Railway Account**: Sign up at [railway.app](https://railway.app) (free tier available)
- ✅ **GitHub Account**: Your code should be in a GitHub repository
- ✅ **Node.js 18+**: Installed locally (for testing)
- ✅ **Git**: Installed on your local machine
- ✅ **Code Committed**: All changes committed and pushed to GitHub

---

## Railway Project Setup

### Step 1: Create Railway Account and Project

1. **Sign In to Railway**
   - Go to [railway.app](https://railway.app)
   - Click **"Login"** or **"Start a New Project"**
   - Sign in with GitHub (recommended for easy repository access)

2. **Create New Project**
   - Click **"New Project"** button
   - Select **"Deploy from GitHub repo"**
   - If this is your first time, authorize Railway to access your GitHub repositories
   - Select your SchoolYard repository from the list
   - Click **"Deploy Now"**

Railway will automatically:
- Detect that it's a Next.js application
- Set up the build and start commands
- Begin the initial deployment

### Step 2: Verify Build Configuration

Railway should auto-detect Next.js, but verify:

1. Go to your project dashboard
2. Click on your **Next.js service**
3. Go to **"Settings"** tab
4. Scroll to **"Build Command"**
5. Ensure it shows: `npm run build` or `next build`
6. Verify **"Start Command"** shows: `npm start` or `next start`

**If needed, adjust manually**:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: Leave empty (unless your Next.js app is in a subdirectory)

---

## MySQL Database Setup

### Step 1: Add MySQL Service

1. In your Railway project dashboard, click **"New"** button
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision a MySQL database
4. Wait for the database to be created (takes a few moments)

### Step 2: Get Database Connection String

1. Click on the **MySQL service** you just created
2. Go to the **"Variables"** tab
3. Find the `MYSQL_URL` or `DATABASE_URL` variable
4. Copy the connection string (format: `mysql://user:password@host:port/database`)
'mysql://root:VBghUkJHTYugaPFRSXWDcromhNdoGNcF@hopper.proxy.rlwy.net:35080/railway'

**Important**: Railway automatically creates a `DATABASE_URL` environment variable. You'll need this in the next step.

---

## Environment Variables Configuration

### Step 1: Configure Database Connection

1. Go to your **Next.js service** in Railway (not the MySQL service)
2. Click **"Variables"** tab
3. Add the following variables:

#### Database Configuration

**Option A: Use Railway's DATABASE_URL (Recommended)**

Railway should automatically link the MySQL service to your Next.js service. If `DATABASE_URL` is not automatically available:

1. Go to MySQL service → Variables tab
2. Copy the `DATABASE_URL` value
3. Go to Next.js service → Variables tab
4. Add variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the connection string (format: `mysql://user:password@host:port/database`)

**Option B: Use Individual Variables (Alternative)**

If you prefer individual variables:
- `DB_HOST` - MySQL host (from Railway MySQL service)
- `DB_PORT` - MySQL port (usually 3306)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name

### Step 2: Generate and Set Security Secrets

Generate strong random strings for production. You can use:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret (different from above)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CSRF Secret (different from above)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add these to Railway Variables**:

1. In your Next.js service → Variables tab
2. Add each variable:

   - **Name**: `JWT_SECRET`
     - **Value**: Your generated JWT secret (paste the hex string)
   
   - **Name**: `JWT_REFRESH_SECRET`
     - **Value**: Your generated refresh secret (different from JWT_SECRET)
   
   - **Name**: `CSRF_SECRET`
     - **Value**: Your generated CSRF secret (different from both above)

### Step 3: Set Environment

Add the environment variable:

- **Name**: `NODE_ENV`
- **Value**: `production`

**Note**: Railway may set this automatically, but verify it's set to `production`.

### Step 4: Complete Environment Variables Checklist

Your Railway Next.js service should have these variables:

✅ `DATABASE_URL` - MySQL connection string (from MySQL service)  
✅ `JWT_SECRET` - Strong random string for JWT signing  
✅ `JWT_REFRESH_SECRET` - Strong random string for refresh tokens  
✅ `CSRF_SECRET` - Strong random string for CSRF protection  
✅ `NODE_ENV` - Set to `production`

**Important**: 
- Never commit these secrets to your repository
- Railway handles them securely
- Each secret should be unique and different from others

---

## Deploy Application

### Step 1: Automatic Deployment

Railway will automatically:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run the build command (`npm run build`)
4. Start the application (`npm start`)

You can watch the deployment progress in the **"Deployments"** tab.

### Step 2: Monitor Build Logs

1. Click on the active deployment
2. View the build logs in real-time
3. Watch for any errors or warnings

**Common Issues**:
- **Build fails**: Check build logs for missing dependencies or TypeScript errors
- **Port binding error**: Railway handles this automatically
- **Memory issues**: Railway provides adequate memory for Next.js apps

### Step 3: Get Your Railway Domain

1. Go to your Next.js service **"Settings"**
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will provide a domain like: `your-app-name.up.railway.app`

**Note**: You can also set up a custom domain later if needed.

---

## Initialize Database and Create Admin

⚠️ **CRITICAL**: After deployment, the database is empty. You must initialize it and create the admin user before you can log in.

### Option 1: Run Migration Endpoint (Recommended - Easiest)

This creates all database tables and the default admin user:

1. **After your app is deployed**, your app will be running at `https://your-app.railway.app`

2. **Trigger the migration** using one of these methods:

   **Method A: Using curl (Terminal)**
   ```bash
   curl -X POST https://your-app.railway.app/api/migrate
   ```

   **Method B: Using Browser Console**
   - Open your Railway app URL in browser
   - Open Developer Tools (F12)
   - Go to Console tab
   - Run:
     ```javascript
     fetch('/api/migrate', {method: 'POST'}).then(r => r.json()).then(console.log)
     ```

   **Method C: Using Postman/Insomnia**
   - Method: POST
   - URL: `https://your-app.railway.app/api/migrate`
   - Send request

3. **What the migration does**:
   - ✅ Creates all database tables:
     - `users` - User accounts
     - `sessions` - Active sessions
     - `password_reset_tokens` - Password reset tokens
     - `audit_logs` - Security audit logs
   - ✅ Creates 3 default users:
     - `admin` (password: `password`) - **Main admin account**
     - `staff1` (password: `password`) - Staff account
     - `parent1` (password: `password`) - Parent account
   - ✅ All passwords are automatically hashed with bcrypt

4. **Verify migration**:
   - Check Railway logs for: "Migration completed successfully"
   - Response should show: `{"success": true, "message": "Migration completed successfully"}`

5. **Login immediately**:
   - Go to: `https://your-app.railway.app`
   - Username: `admin`
   - Password: `password`
   - **⚠️ CRITICAL: Change this password immediately after login!**

### Option 2: Setup Admin Only Script (If You Only Want Admin)

If you only want to create the admin user (not the other demo users):

1. **Set environment variable** in Railway:
   - Go to Next.js service → Variables tab
   - Add variable:
     - **Name**: `ADMIN_PASSWORD`
     - **Value**: Your desired admin password (must meet complexity requirements)

2. **Get Railway MySQL connection details**:
   - Go to MySQL service → Variables tab
   - Copy the `DATABASE_URL` value

3. **Run setup script locally** (connects to Railway MySQL):
   ```bash
   # Create .env file with Railway connection
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Run setup
   npm run setup-admin
   ```

4. **Script will**:
   - Connect to Railway MySQL
   - Check if admin already exists
   - Create admin user with your `ADMIN_PASSWORD`
   - Display login credentials

### Option 3: Manual SQL Setup (Full Control)

If you prefer complete manual control:

1. **Connect to Railway MySQL**:
   - Use MySQL Workbench or any MySQL client
   - Get connection details from Railway MySQL service → Variables tab
   - Connection format: `mysql://user:password@host:port/database`

2. **Run the schema**:
   - Copy contents of `lib/db/schema.sql`
   - Execute in MySQL client
   - This creates all required tables

3. **Generate password hash**:
   ```bash
   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('YourSecurePassword123!',12).then(console.log)"
   ```
   Copy the hash (starts with `$2a$` or `$2b$`)

4. **Create admin user**:
   ```sql
   INSERT INTO users 
   (id, username, password_hash, role, name, email, created_at, updated_at)
   VALUES 
   ('usr-admin-1', 'admin', 'YOUR_BCRYPT_HASH_HERE', 'admin', 'Admin User', 'admin@schoolyard.com', NOW(), NOW());
   ```

5. **Verify**:
   ```sql
   SELECT id, username, role FROM users WHERE username = 'admin';
   ```

6. **Login**:
   - Username: `admin`
   - Password: The password you hashed in step 3

---

## Verify Deployment

### Step 1: Test Your Application

1. **Open your Railway domain**: `https://your-app.railway.app`

2. **Verify the application loads**:
   - Login page should display
   - No errors in browser console
   - Page loads without issues

3. **Test Login**:
   - Username: `admin`
   - Password: `password` (or your custom password if using Option 2/3)
   - Click "Sign in"
   - Should redirect to `/dashboard`

4. **Verify Admin Access**:
   - Should see all menu items in sidebar
   - Should see "User Management" option
   - Should be able to navigate to all pages

### Step 2: Check Railway Logs

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. View **"Logs"** to see runtime logs
4. Monitor for any errors or warnings

**Look for**:
- ✅ "Database pool created" messages
- ✅ "Migration completed successfully" (if you ran migration)
- ❌ Any error messages (address these immediately)

### Step 3: Verify Database

1. **Connect to Railway MySQL** (using MySQL Workbench or client)
2. **Check tables exist**:
   ```sql
   SHOW TABLES;
   ```
   Should show: `users`, `sessions`, `password_reset_tokens`, `audit_logs`

3. **Check admin user exists**:
   ```sql
   SELECT id, username, role, name, email FROM users WHERE username = 'admin';
   ```
   Should return the admin user

4. **Verify password is hashed**:
   ```sql
   SELECT username, LEFT(password_hash, 20) as hash_preview FROM users WHERE username = 'admin';
   ```
   Should show a hash starting with `$2a$` or `$2b$` (not plain text)

---

## Create Additional Admin Accounts

Once you're logged in as the main admin, you can create additional admin accounts:

### Step-by-Step: Create a New Admin Account

1. **Login as Admin**:
   - Use your admin credentials
   - You'll be redirected to the dashboard

2. **Navigate to User Management**:
   - Click **"User Management"** in the sidebar
   - Or go directly to `/admin/users`

3. **Click "Add New User"**:
   - Button is located at the top right of the User Management page

4. **Fill in Account Information**:
   - **Username**: Choose a unique username
     - Examples: `admin2`, `superadmin`, `director`, `manager`
     - Must be at least 3 characters
     - Must be unique (not already in use)
   - **Password**: Enter a strong password
     - Must meet complexity requirements (see below)

5. **Fill in Personal Information**:
   - **Full Name**: Admin's full name
   - **Email**: Admin's email address (must be valid format)
   - **Phone**: (Optional) Admin's phone number
   - **Role**: Select **"Admin - Full system access"** from the dropdown

6. **Create the User**:
   - Click **"Create User"** button
   - You'll see a success message
   - The new admin appears in the user list immediately

7. **Verify the New Admin**:
   - The new admin can login immediately
   - They have the same full access as the original admin
   - They can create additional admins if needed

### Password Requirements

When creating any user (including admins), the password must:
- ✅ Be at least 8 characters long
- ✅ Contain at least one uppercase letter (A-Z)
- ✅ Contain at least one lowercase letter (a-z)
- ✅ Contain at least one number (0-9)
- ✅ Contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Examples of Valid Passwords**:
- `Admin123!`
- `SecurePass2024#`
- `MyP@ssw0rd`

**Examples of Invalid Passwords**:
- `password` (no uppercase, no number, no special char)
- `PASSWORD123` (no lowercase, no special char)
- `Pass123` (too short, less than 8 characters)

---

## Password Reset Guide

Password reset allows admins to generate reset tokens for any user. This is useful if you forget a password or need to reset a user's password.

### Complete Password Reset Process

#### Step 1: Get CSRF Token

```bash
curl https://your-app.railway.app/api/auth/csrf
```

Response:
```json
{
  "token": "abc123def456..."
}
```

Copy this token - you'll need it for the next steps.

#### Step 2: Request Password Reset Token

For a specific user by username:
```bash
curl -X POST https://your-app.railway.app/api/auth/reset-password/request \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_FROM_STEP_1" \
  -d '{"username": "admin"}'
```

Or by user ID:
```bash
curl -X POST https://your-app.railway.app/api/auth/reset-password/request \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_FROM_STEP_1" \
  -d '{"userId": "usr-1"}'
```

Response:
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "message": "Password reset token generated. Use this token to reset your password."
}
```

**⚠️ Important**: Copy the token immediately - it's only shown once and expires in 1 hour!

#### Step 3: Confirm Password Reset

Use the token from Step 2 to set a new password:
```bash
curl -X POST https://your-app.railway.app/api/auth/reset-password/confirm \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_FROM_STEP_1" \
  -d '{
    "token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "newPassword": "NewSecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Step 4: Login with New Password

The user can now login with:
- Username: Their original username
- Password: The new password you set

### Password Reset Rules

1. **Token Expiration**: Tokens expire after **1 hour**
2. **One-Time Use**: Each token can only be used **once**
3. **Password Requirements**: New password must meet complexity requirements
4. **Admin Only**: Only admins can generate reset tokens
5. **Audit Logging**: All password reset actions are logged

---

## Security Features Overview

SchoolYard includes the following production-ready security features:

### ✅ Implemented Features

1. **Password Hashing**
   - All passwords hashed with bcrypt (12 rounds)
   - Passwords never stored in plain text
   - Automatic hashing on user creation/update

2. **JWT Token Authentication**
   - Access tokens: 15 minutes expiry
   - Refresh tokens: 7 days expiry
   - Stored in httpOnly cookies (secure)
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
   - In-memory storage (works for single instance)

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
   - Tracks: login, logout, password changes, user creation, etc.
   - Includes IP address and user agent
   - Stored in `audit_logs` table

9. **HTTPS**
   - Automatically provided by Railway
   - Required for production

---

## Troubleshooting

### Database Connection Issues

**Problem**: "Cannot connect to database" or database errors in logs

**Solutions**:
1. Verify MySQL service is running in Railway
2. Check `DATABASE_URL` is set correctly in Next.js service variables
3. Verify the MySQL service is linked to your Next.js service
4. Check Railway logs for specific database connection errors
5. Ensure database credentials are correct

### Migration Fails

**Problem**: Migration endpoint returns error or doesn't create users

**Solutions**:
1. Check Railway logs for detailed error messages
2. Verify `DATABASE_URL` is set correctly
3. Check that MySQL service is accessible
4. Try Option 2 or 3 from the "Initialize Database" section
5. Manually run SQL schema if needed

### Cannot Login After Migration

**Problem**: "Invalid credentials" even after running migration

**Solutions**:
1. Verify migration actually ran successfully (check logs)
2. Check that users exist in database:
   ```sql
   SELECT username, role FROM users;
   ```
3. Verify password hash exists:
   ```sql
   SELECT username, LEFT(password_hash, 20) FROM users WHERE username = 'admin';
   ```
   Should show hash starting with `$2a$` or `$2b$`
4. Try using password reset if admin exists but password doesn't work
5. Check that JWT_SECRET is set correctly

### Application Won't Start

**Problem**: Build succeeds but application doesn't start

**Solutions**:
1. Check runtime logs in Railway
2. Verify all environment variables are set
3. Check for database connection errors
4. Verify `start` command is correct: `npm start`
5. Check for port binding issues (Railway handles this automatically)

### Rate Limiting Issues

**Problem**: Getting rate limited too quickly

**Solutions**:
1. Wait 15 minutes for reset
2. Rate limit is per IP - try from different network
3. For production, consider implementing Redis for distributed rate limiting

### CSRF Token Errors

**Problem**: "Invalid CSRF token" errors

**Solutions**:
1. Verify `CSRF_SECRET` is set in Railway variables
2. Check that CSRF token is being fetched before making requests
3. Verify token is sent in `X-CSRF-Token` header
4. Check cookie settings (should work automatically on Railway)

---

## Post-Deployment Checklist

After successful deployment, complete these steps:

- [ ] ✅ Application deployed to Railway
- [ ] ✅ MySQL database created and linked
- [ ] ✅ All environment variables set
- [ ] ✅ Database migration run successfully
- [ ] ✅ Can login with admin account
- [ ] ✅ Changed default admin password
- [ ] ✅ Verified admin has full access
- [ ] ✅ Created additional admin accounts (if needed)
- [ ] ✅ Tested password reset functionality
- [ ] ✅ Verified all security features working
- [ ] ✅ Set up custom domain (optional)
- [ ] ✅ Configured monitoring/alerts (optional)

---

## Continuous Deployment

Railway automatically deploys when you push to your main branch:

1. Push changes to GitHub
2. Railway detects the push
3. Automatically starts a new deployment
4. Builds and deploys the new version

**Manual Deployments**:
- Go to **"Settings"** → **"Source"** section
- Change the branch if needed
- Or use **"Redeploy"** button to redeploy the current version

---

## Cost Considerations

### Free Tier

Railway offers a free tier with:
- $5 credit per month
- Sufficient for small to medium applications
- Automatic sleep after inactivity (wakes on request)

### Paid Plans

If you need:
- Always-on service (no sleep)
- More resources
- Custom domains with SSL
- Team collaboration

Consider upgrading to a paid plan.

---

## Security Best Practices

1. **Change Default Passwords**: Immediately after first deployment
2. **Use Environment Variables**: For all secrets (already configured)
3. **Enable HTTPS**: Railway provides SSL automatically ✅
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Logs**: Regularly check for suspicious activity
6. **Regular Backups**: Backup MySQL database regularly
7. **Limit Admin Accounts**: Only create admins for people who need full access
8. **Review Audit Logs**: Check `audit_logs` table regularly

---

## Quick Reference

### Default Admin Credentials (After Migration)
- **Username**: `admin`
- **Password**: `password`
- **⚠️ MUST be changed immediately after first login**

### Railway Setup Commands
```bash
# Run migration (after deployment)
curl -X POST https://your-app.railway.app/api/migrate

# Check database (local script)
npm run check-db

# Setup admin only (local script with Railway DB)
npm run setup-admin
```

### API Endpoints
- `POST /api/migrate` - Initialize database and create default users
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify current session
- `GET /api/auth/csrf` - Get CSRF token
- `POST /api/auth/reset-password/request` - Request password reset token
- `POST /api/auth/reset-password/confirm` - Confirm password reset
- `POST /api/admin/users` - Create new user (admin only)

---

## Support and Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Community support
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **User Management Guide**: See `USER_MANAGEMENT.md`

---

**Last Updated**: After production security implementation  
**Version**: 2.0.0

