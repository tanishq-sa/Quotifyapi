# Deployment Guide

This guide explains how to deploy the QuoteAPI using GitHub Actions and Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account
- Node.js 16+ installed locally

## Setup Steps

### 1. GitHub Repository Setup

1. Push your code to GitHub
2. Ensure your main branch is named `main` or `master`

### 2. Vercel Setup

1. Go to [vercel.com](https://vercel.com) and sign in
2. Create a new project and import your GitHub repository
3. Configure the project settings:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.`
   - **Install Command**: `npm install`

### 3. GitHub Secrets Configuration

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:

#### `VERCEL_TOKEN`
- Go to [Vercel Account Settings](https://vercel.com/account/tokens)
- Create a new token
- Copy the token value
- Add it as `VERCEL_TOKEN` in GitHub secrets

#### `ORG_ID`
- In your Vercel dashboard, go to Settings → General
- Copy the "Team ID" (this is your ORG_ID)
- Add it as `ORG_ID` in GitHub secrets

#### `PROJECT_ID`
- In your Vercel project dashboard, go to Settings → General
- Copy the "Project ID"
- Add it as `PROJECT_ID` in GitHub secrets

### 4. GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` is already configured and will:

- **Test Job**: Run on all pushes and pull requests
  - Test multiple Node.js versions (16.x, 18.x, 20.x)
  - Install dependencies
  - Run linting
  - Run tests
  - Build the project

- **Deploy Job**: Run only on main/master branch pushes
  - Deploy to Vercel production environment
  - Only runs after tests pass

### 5. Environment Variables (Optional)

If you need environment variables in production:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add any required environment variables

## Deployment Process

### 🚀 Automatic Staging Deployment
1. **Push to main/master branch**: Automatically deploys to staging environment
2. **Create pull request**: Runs tests but doesn't deploy
3. **Merge pull request**: Automatically deploys to staging

### 🔒 Manual Production Deployment
1. **Go to Actions tab** in your GitHub repository
2. **Click "Deploy to Vercel"** workflow
3. **Click "Run workflow"** button
4. **Select "production"** from the environment dropdown
5. **Click "Run workflow"** to start deployment
6. **Review and approve** the deployment when prompted

**Note**: Production deployments require manual approval and only happen when you explicitly trigger them!

## Monitoring

- **GitHub Actions**: Check the Actions tab in your repository
- **Vercel**: Monitor deployments in your Vercel dashboard
- **Logs**: View deployment logs in both GitHub Actions and Vercel

## Troubleshooting

### Common Issues

1. **Build failures**: Check the build logs in GitHub Actions
2. **Deployment failures**: Verify your Vercel secrets are correct
3. **Node version issues**: Ensure your code is compatible with Node 16+

### Debugging

1. Check GitHub Actions logs for detailed error messages
2. Verify all required secrets are set correctly
3. Test your build command locally: `npm run build`

## Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Security Notes

- Never commit sensitive information like API keys
- Use GitHub secrets for all sensitive configuration
- Regularly rotate your Vercel token
- Review deployment logs for any security concerns

## Support

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support) 