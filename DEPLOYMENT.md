# Deployment Guide

Your Quote API can be easily deployed to both Vercel and Cloudflare. Here are the step-by-step instructions for both platforms.

## 🚀 Vercel Deployment (Recommended)

Vercel is the easiest option for deploying Node.js/Express applications.

### Method 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy your project:**
   ```bash
   vercel
   ```
   
4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N`
   - What's your project's name? `quote-api` (or any name you prefer)
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

5. **Your API will be live!** Vercel will provide you with a URL like:
   `https://quote-api-your-username.vercel.app`

### Method 2: Deploy via GitHub (Recommended)

1. **Create a GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/quote-api.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Automatic deployments:** Every push to main branch will auto-deploy!

### Vercel Environment Variables

If you need environment variables, add them in Vercel dashboard:
- Go to your project settings
- Navigate to "Environment Variables"
- Add: `NODE_ENV` = `production`

---

## ☁️ Cloudflare Pages Deployment

Cloudflare Pages is great for static sites, but for APIs we'll use Cloudflare Workers.

### Using Cloudflare Workers

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Create wrangler.toml:**
   ```toml
   name = "quote-api"
   main = "worker.js"
   compatibility_date = "2023-12-01"
   
   [env.production]
   name = "quote-api-production"
   ```

4. **Create a Cloudflare Worker version** (worker.js):
   ```javascript
   // This would need to be adapted for Cloudflare Workers
   // Cloudflare Workers don't support Express directly
   ```

**Note:** Cloudflare Workers require significant code changes as they don't support Express.js directly. Vercel is much easier for your current setup.

---

## 🌐 Testing Your Deployed API

Once deployed, your API endpoints will be:

```
https://your-app-name.vercel.app/api
https://your-app-name.vercel.app/api?type=sad
https://your-app-name.vercel.app/api?type=happy
https://your-app-name.vercel.app/api/types
https://your-app-name.vercel.app/api/stats
```

### Test with curl:
```bash
curl https://your-app-name.vercel.app/api
curl "https://your-app-name.vercel.app/api?type=love"
```

### Test in browser:
Just visit the URLs directly in your browser!

---

## 📝 Post-Deployment Tips

1. **Custom Domain:** Both platforms support custom domains
2. **HTTPS:** Automatic HTTPS is provided
3. **Global CDN:** Your API will be fast worldwide
4. **Monitoring:** Check logs in respective dashboards
5. **Analytics:** Both platforms provide usage analytics

---

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails:** Check your `package.json` dependencies
2. **Function timeout:** Increase timeout in `vercel.json`
3. **CORS errors:** Already handled in your code with `cors` middleware
4. **Environment variables:** Set them in platform dashboard

### Support:
- **Vercel:** Check [vercel.com/docs](https://vercel.com/docs)
- **Cloudflare:** Check [developers.cloudflare.com](https://developers.cloudflare.com)

---

## ✅ Recommended Choice

**For your Quote API, we recommend Vercel because:**
- ✅ Zero configuration needed
- ✅ Perfect for Express.js apps
- ✅ Automatic HTTPS and CDN
- ✅ Easy GitHub integration
- ✅ Generous free tier
- ✅ Excellent developer experience

Your API is ready to deploy! 🚀 