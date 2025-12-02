# Railway Deployment Guide

This guide will walk you through deploying SchoolYard to Railway, a modern cloud platform that makes deployment simple and straightforward.

## Prerequisites

Before you begin, ensure you have:

1. **Railway Account**: Sign up at [railway.app](https://railway.app) (free tier available)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Node.js**: Version 18 or higher (for local testing)
4. **Git**: Installed on your local machine

## Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is Ready

Make sure your codebase is:
- ✅ Committed to Git
- ✅ Pushed to GitHub
- ✅ All dependencies are in `package.json`
- ✅ No sensitive data in the repository (use environment variables)

### 1.2 Verify Build Scripts

Check your `package.json` has these scripts:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint"
  }
}
```

**Note**: Railway will automatically detect Next.js and use the correct build command. The `--turbopack` flag is optional and may not be needed in production.

## Step 2: Create a Railway Project

### 2.1 Sign In to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with GitHub (recommended for easy repository access)

### 2.2 Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. If this is your first time, authorize Railway to access your GitHub repositories
4. Select your SchoolYard repository from the list
5. Click **"Deploy Now"**

Railway will automatically:
- Detect that it's a Next.js application
- Set up the build and start commands
- Begin the initial deployment

## Step 3: Configure Build Settings

### 3.1 Verify Build Configuration

Railway should auto-detect Next.js, but you can verify:

1. Go to your project dashboard
2. Click on your service
3. Go to **"Settings"** tab
4. Scroll to **"Build Command"**
5. Ensure it shows: `npm run build` or `next build`
6. Verify **"Start Command"** shows: `npm start` or `next start`

### 3.2 Adjust Build Settings (if needed)

If Railway didn't auto-detect correctly:

1. In **Settings**, find **"Build Command"**
2. Set to: `npm run build`
3. Find **"Start Command"**
4. Set to: `npm start`
5. **Root Directory**: Leave empty (unless your Next.js app is in a subdirectory)

## Step 4: Set Up MySQL Database

### 4.1 Add MySQL Service

1. In your Railway project dashboard, click **"New"** button
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision a MySQL database
4. Wait for the database to be created (takes a few moments)

### 4.2 Get Database Connection String

1. Click on the MySQL service you just created
2. Go to the **"Variables"** tab
3. Find the `MYSQL_URL` or `DATABASE_URL` variable
4. Copy the connection string (format: `mysql://user:password@host:port/database`)

**Note**: Railway automatically creates a `DATABASE_URL` environment variable that your application can use.

## Step 5: Environment Variables

### 5.1 Required Environment Variables

SchoolYard now requires the following environment variables. Add them to your **Next.js service** (not the database service):

1. Go to your Next.js service in Railway
2. Click **"Variables"** tab
3. Add the following variables:

#### Database Configuration

**Option A: Use Railway's DATABASE_URL (Recommended)**
- Railway automatically provides `DATABASE_URL` from the MySQL service
- If not automatically linked, add it manually:
  - Variable: `DATABASE_URL`
  - Value: Copy from MySQL service variables (format: `mysql://user:password@host:port/database`)

**Option B: Use Individual Variables (Alternative)**
- `DB_HOST` - MySQL host (from Railway MySQL service)
- `DB_PORT` - MySQL port (usually 3306)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name

#### Security Secrets

Generate strong random strings for production. You can use:
```bash
# Generate random secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `JWT_SECRET` - Secret for signing JWT access tokens (generate a strong random string)
- `JWT_REFRESH_SECRET` - Secret for signing JWT refresh tokens (generate a different strong random string)
- `CSRF_SECRET` - Secret for CSRF token generation (generate a strong random string)

#### Environment

- `NODE_ENV=production` (automatically set by Railway, but you can verify)

### 5.2 Example Environment Variables

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
CSRF_SECRET=your-generated-csrf-secret-here
NODE_ENV=production
```

**Important**: Never commit these secrets to your repository. Railway handles them securely.

### 5.3 Link Database to Application

Railway should automatically link the MySQL service to your Next.js service, but if not:

1. In your Next.js service, go to **"Settings"**
2. Find **"Service Dependencies"** or **"Connections"**
3. Link the MySQL service
4. The `DATABASE_URL` should now be available

## Step 6: Initialize Database

### 6.1 Run Database Migration

After your application is deployed, you need to initialize the database schema and migrate users:

1. Once your application is running, visit: `https://your-app.railway.app/api/migrate`
2. Or use Railway's CLI or API to trigger the migration endpoint
3. The migration will:
   - Create all required tables (users, sessions, password_reset_tokens, audit_logs)
   - Migrate existing users from localStorage (if any) to MySQL
   - Hash all passwords

**Alternative**: You can also run the migration manually by executing the SQL schema:
1. Connect to your Railway MySQL database using MySQL Workbench or any MySQL client
2. Copy the contents of `lib/db/schema.sql`
3. Execute it in your MySQL client

### 6.2 Verify Database Setup

After migration, verify the database:
1. Connect to your MySQL database
2. Check that tables exist: `SHOW TABLES;`
3. Verify users table has data: `SELECT COUNT(*) FROM users;`

## Step 7: Deploy

### 7.1 Automatic Deployment

Railway will automatically:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run the build command (`npm run build`)
4. Start the application (`npm start`)

You can watch the deployment progress in the **"Deployments"** tab.

### 7.2 Monitor Build Logs

1. Click on the active deployment
2. View the build logs in real-time
3. Watch for any errors or warnings

**Common Issues**:
- **Build fails**: Check build logs for missing dependencies or TypeScript errors
- **Port binding error**: Railway handles this automatically
- **Memory issues**: Railway provides adequate memory for Next.js apps

## Step 8: Configure Domain

### 8.1 Get Your Railway Domain

1. Go to your service **"Settings"**
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will provide a domain like: `your-app-name.up.railway.app`

### 8.2 Custom Domain (Optional)

To use your own domain:

1. In **"Networking"**, click **"Custom Domain"**
2. Enter your domain name
3. Follow Railway's DNS configuration instructions
4. Add the required DNS records to your domain provider
5. Wait for DNS propagation (can take up to 24 hours)

## Step 9: Verify Deployment

### 9.1 Test Your Application

1. Click on the generated domain or use the **"Open"** button
2. Verify the application loads correctly
3. Test key features:
   - Login page loads
   - Can log in with default credentials
   - Dashboard displays
   - Navigation works

### 9.2 Check Logs

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. View **"Logs"** to see runtime logs
4. Monitor for any errors or warnings

## Step 10: Post-Deployment Configuration

### 10.1 Update Default Credentials (Recommended)

⚠️ **Security**: Change default credentials before going live:

1. Deploy the application
2. Log in as admin
3. Go to User Management
4. Edit the admin user
5. Change the password
6. Consider creating new admin accounts and deleting the default one

### 10.2 Set Up Monitoring (Optional)

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Alerts**: Configure alerts for deployment failures

Access these in your project dashboard.

## Step 11: Continuous Deployment

### 11.1 Automatic Deployments

Railway automatically deploys when you push to your main branch:
1. Push changes to GitHub
2. Railway detects the push
3. Automatically starts a new deployment
4. Builds and deploys the new version

### 11.2 Manual Deployments

To deploy a specific branch or commit:

1. Go to **"Settings"**
2. Find **"Source"** section
3. Change the branch if needed
4. Or use **"Redeploy"** button to redeploy the current version

### 11.3 Deployment History

View all deployments in the **"Deployments"** tab:
- See deployment status (Success/Failed)
- View build logs
- Rollback to previous deployments if needed

## Troubleshooting

### Build Fails

**Problem**: Deployment fails during build

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is compatible (Railway uses Node 18+ by default)
4. Check for TypeScript errors: `npm run build` locally first
5. Verify `next.config.ts` is properly configured

### Application Won't Start

**Problem**: Build succeeds but application doesn't start

**Solutions**:
1. Check runtime logs in Railway
2. Verify `start` command is correct: `npm start`
3. Ensure `package.json` has the `start` script
4. Check for port binding issues (Railway handles this automatically)

### Environment Variables Not Working

**Problem**: Environment variables aren't being read

**Solutions**:
1. Verify variables are set in Railway's **"Variables"** tab
2. Restart the service after adding variables
3. For client-side variables, use `NEXT_PUBLIC_` prefix
4. Check that variables are accessed correctly in code

### Slow Build Times

**Problem**: Builds take too long

**Solutions**:
1. Railway provides fast builds, but you can optimize:
   - Remove unnecessary dependencies
   - Use `.railwayignore` to exclude files from deployment
   - Consider using Railway's build cache

### Memory Issues

**Problem**: Application runs out of memory

**Solutions**:
1. Railway provides adequate memory, but for large apps:
   - Upgrade your Railway plan
   - Optimize your Next.js build
   - Reduce bundle size

## Railway-Specific Optimizations

### 1. Create `.railwayignore` (Optional)

Create a `.railwayignore` file in your root directory to exclude files from deployment:

```
node_modules
.git
.next
.env.local
*.log
.DS_Store
```

### 2. Optimize Build Time

Railway caches `node_modules` between builds, but you can:
- Use `npm ci` instead of `npm install` (Railway does this automatically)
- Minimize dependencies
- Use Next.js Image Optimization

### 3. Database Considerations

SchoolYard now uses MySQL for authentication and user management:

1. ✅ MySQL is already configured (see Step 4)
2. Database connection is handled via `DATABASE_URL` environment variable
3. Railway automatically provides connection pooling
4. Database migrations run automatically on first deployment via `/api/migrate` endpoint
5. For production scaling, consider:
   - Using Railway's MySQL service (already set up)
   - Monitoring database connections
   - Setting up database backups
   - Using connection pooling (already implemented)

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

## Security Best Practices

1. **Change Default Credentials**: Immediately after first deployment
2. **Use Environment Variables**: For any secrets or API keys
3. **Enable HTTPS**: Railway provides SSL automatically
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Logs**: Regularly check for suspicious activity

## Rollback Procedure

If a deployment causes issues:

1. Go to **"Deployments"** tab
2. Find the last working deployment
3. Click the **"..."** menu
4. Select **"Redeploy"**
5. Railway will redeploy that version

## Support and Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Community support
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

## Quick Reference Checklist

Before deploying:
- [ ] Code is committed and pushed to GitHub
- [ ] `package.json` has correct scripts
- [ ] No sensitive data in repository
- [ ] Application builds locally (`npm run build`)
- [ ] Application runs locally (`npm start`)

After deploying:
- [ ] Application loads at Railway domain
- [ ] Can log in successfully
- [ ] Key features work correctly
- [ ] Logs show no errors
- [ ] Changed default credentials
- [ ] Set up custom domain (if needed)
- [ ] Configured monitoring/alerts

## Summary

Deploying to Railway is straightforward:

1. **Connect Repository**: Link your GitHub repo
2. **Auto-Detection**: Railway detects Next.js automatically
3. **Deploy**: Railway builds and deploys automatically
4. **Access**: Get your domain and start using

Railway handles most of the complexity, making deployment as simple as connecting your repository. The platform automatically manages builds, deployments, and infrastructure, so you can focus on your application.

---

## Security Features

SchoolYard now includes production-ready security features:

- ✅ **Password Hashing**: All passwords are hashed using bcrypt
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **Session Management**: Server-side session storage
- ✅ **CSRF Protection**: Cross-site request forgery protection
- ✅ **Rate Limiting**: Login attempts limited to 5 per 15 minutes
- ✅ **Audit Logging**: All authentication events are logged
- ✅ **Password Complexity**: Enforced password requirements
- ✅ **Password Reset**: Token-based password reset functionality
- ✅ **HTTPS**: Automatically provided by Railway

**Note**: Make sure to:
1. Set strong secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CSRF_SECRET`
2. Run the database migration after first deployment
3. Change default passwords immediately after deployment
4. Review audit logs regularly for security monitoring

