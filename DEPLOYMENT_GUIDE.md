# DholeraSIR Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
1. ✅ Code pushed to GitHub
2. ✅ Environment variables documented in `.env.example`
3. ✅ Sensitive data excluded from repository

---

## 📦 Backend Deployment (Render)

### Step 1: Prepare for Render
Your backend is ready to deploy with the included `render.yaml` configuration.

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` file
5. Set the following environment variables in Render dashboard:
   - `MONGO_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Your secure JWT secret key
   - `JWT_EXPIRE` = 30d
   - `NODE_ENV` = production
   - `PORT` = 5001

6. Click **"Create Web Service"**
7. Wait for deployment (usually 2-3 minutes)
8. Copy your backend URL (e.g., `https://dholera-sir-backend.onrender.com`)

### Important Notes:
- Free tier: Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for production use

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Backend URL
Before deploying, update the frontend environment file:

Edit `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-actual-backend-url.onrender.com/api
```
Replace with your actual Render backend URL.

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# For production
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Add Environment Variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com/api`

6. Click **"Deploy"**
7. Wait for deployment (usually 1-2 minutes)
8. Your app will be live at `https://your-project.vercel.app`

### Step 3: Configure Custom Domain (Optional)
1. Go to your Vercel project settings
2. Navigate to **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed by Vercel

---

## 🔐 Update Backend CORS

After deploying frontend, update backend CORS to allow your Vercel domain:

Edit `backend/server.js` and add your Vercel URL to `allowedOrigins`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'https://your-project.vercel.app',  // Add this
  process.env.FRONTEND_URL || 'http://localhost:3000'
];
```

Then redeploy your backend on Render.

---

## 🧪 Testing Your Deployment

### Test Backend
```bash
curl https://your-backend-url.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "API is running...",
  "timestamp": "2026-02-14T...",
  "environment": "production"
}
```

### Test Frontend
1. Visit your Vercel URL
2. Try to register a new user
3. Login with credentials
4. Create a test deal
5. Add a payment to the deal

---

## 📝 Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=5001
MONGO_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-secure-random-string>
JWT_EXPIRE=30d
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:
- **Push to GitHub** → Automatically deploys to both platforms
- Configure branch-specific deployments in platform settings

---

## 📊 Monitoring

### Render
- View logs in Render dashboard
- Monitor uptime and performance
- Set up alerts for errors

### Vercel
- Real-time deployment logs
- Analytics dashboard
- Performance insights

---

## 🆘 Troubleshooting

### Backend Issues
- **502 Bad Gateway**: Check Render logs, service might be starting
- **MongoDB Connection Failed**: Verify MONGO_URI and whitelist Render's IP (0.0.0.0/0)
- **CORS Errors**: Ensure frontend URL is in allowedOrigins

### Frontend Issues
- **API calls failing**: Verify REACT_APP_API_URL is correct
- **Blank page**: Check browser console for errors
- **Environment variables not working**: Rebuild on Vercel after changes

---

## 🎉 You're Done!

Your DholeraSIR application is now live:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.onrender.com`

Share the frontend URL with your users!
