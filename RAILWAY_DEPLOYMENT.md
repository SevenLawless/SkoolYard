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

## Step 4: Environment Variables (if needed)

### 4.1 Check for Required Variables

Currently, SchoolYard uses in-memory data storage, so no database connection strings are needed. However, if you add features later that require environment variables:

1. Go to your service in Railway
2. Click **"Variables"** tab
3. Add any required environment variables
4. Click **"Add"** for each variable

### 4.2 Common Next.js Variables

If you need to configure Next.js:

- `NODE_ENV=production` (automatically set by Railway)
- `PORT` (automatically set by Railway)
- `NEXT_PUBLIC_*` (for client-side variables)

**Note**: Railway automatically sets `PORT` and `NODE_ENV`, so you don't need to configure these.

## Step 5: Deploy

### 5.1 Automatic Deployment

Railway will automatically:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run the build command (`npm run build`)
4. Start the application (`npm start`)

You can watch the deployment progress in the **"Deployments"** tab.

### 5.2 Monitor Build Logs

1. Click on the active deployment
2. View the build logs in real-time
3. Watch for any errors or warnings

**Common Issues**:
- **Build fails**: Check build logs for missing dependencies or TypeScript errors
- **Port binding error**: Railway handles this automatically
- **Memory issues**: Railway provides adequate memory for Next.js apps

## Step 6: Configure Domain

### 6.1 Get Your Railway Domain

1. Go to your service **"Settings"**
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will provide a domain like: `your-app-name.up.railway.app`

### 6.2 Custom Domain (Optional)

To use your own domain:

1. In **"Networking"**, click **"Custom Domain"**
2. Enter your domain name
3. Follow Railway's DNS configuration instructions
4. Add the required DNS records to your domain provider
5. Wait for DNS propagation (can take up to 24 hours)

## Step 7: Verify Deployment

### 7.1 Test Your Application

1. Click on the generated domain or use the **"Open"** button
2. Verify the application loads correctly
3. Test key features:
   - Login page loads
   - Can log in with default credentials
   - Dashboard displays
   - Navigation works

### 7.2 Check Logs

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. View **"Logs"** to see runtime logs
4. Monitor for any errors or warnings

## Step 8: Post-Deployment Configuration

### 8.1 Update Default Credentials (Recommended)

⚠️ **Security**: Change default credentials before going live:

1. Deploy the application
2. Log in as admin
3. Go to User Management
4. Edit the admin user
5. Change the password
6. Consider creating new admin accounts and deleting the default one

### 8.2 Set Up Monitoring (Optional)

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Alerts**: Configure alerts for deployment failures

Access these in your project dashboard.

## Step 9: Continuous Deployment

### 9.1 Automatic Deployments

Railway automatically deploys when you push to your main branch:
1. Push changes to GitHub
2. Railway detects the push
3. Automatically starts a new deployment
4. Builds and deploys the new version

### 9.2 Manual Deployments

To deploy a specific branch or commit:

1. Go to **"Settings"**
2. Find **"Source"** section
3. Change the branch if needed
4. Or use **"Redeploy"** button to redeploy the current version

### 9.3 Deployment History

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

Currently, SchoolYard uses in-memory storage. If you plan to add a database:

1. Railway offers PostgreSQL, MySQL, MongoDB, and Redis
2. Add a database service in your Railway project
3. Get the connection string from the database service
4. Add it as an environment variable
5. Update your code to use the database

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

**Note**: This guide assumes you're deploying the current version of SchoolYard with in-memory data storage. If you add a database or other services later, you'll need to configure those separately in Railway.

