# Deployment Guide for Destination Dholera

## Prerequisites
- GitHub account
- Domain name purchased (.com)
- MongoDB Atlas account (already set up)

---

## Option 1: Deploy with Vercel (Frontend) + Render (Backend)

### **Backend Deployment (Render.com)**

1. **Push code to GitHub**
   ```bash
   cd /Users/ravimakwana/DholeraSIR
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/dholera-sir.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: dholera-backend
     - **Root Directory**: (leave empty or use `backend`)
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && node server.js`
     - **Environment**: Node
   - Add Environment Variables:
     ```
     MONGO_URI=mongodb+srv://dbuser-ddpl:alpeshr%403614@dholera-cluster.6wo0otp.mongodb.net/dholera-sir
     JWT_SECRET=your-secure-random-string-here
     PORT=5001
     NODE_ENV=production
     ```
   - Click "Create Web Service"
   - Note the URL: `https://dholera-backend.onrender.com`

### **Frontend Deployment (Vercel)**

1. **Update Frontend API URL**
   - Create `frontend/.env.production`:
     ```
     REACT_APP_API_URL=https://dholera-backend.onrender.com/api
     ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
   - Add Environment Variable:
     ```
     REACT_APP_API_URL=https://dholera-backend.onrender.com/api
     ```
   - Click "Deploy"
   - Your site will be live at: `https://your-project.vercel.app`

3. **Connect Custom Domain**
   - In Vercel Dashboard → Settings → Domains
   - Add your domain: `www.destinationdholera.com`
   - Follow DNS configuration instructions
   - Update your domain's DNS records:
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

---

## Option 2: Deploy with Railway (All-in-One)

1. **Push to GitHub** (same as above)

2. **Deploy Backend on Railway**
   - Go to https://railway.app
   - Sign up/Login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add Environment Variables (same as Render)
   - Railway will auto-detect Node.js and deploy

3. **Deploy Frontend on Railway**
   - Add another service to the same project
   - Point to `frontend` directory
   - Add environment variable with backend URL
   - Connect your custom domain

---

## Option 3: DigitalOcean/AWS (Full Control)

### **DigitalOcean Droplet ($6/month)**

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Basic plan: $6/month
   - Add SSH key

2. **SSH into server and setup**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 (Process Manager)
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   
   # Clone your repository
   git clone https://github.com/yourusername/dholera-sir.git
   cd dholera-sir
   
   # Setup Backend
   cd backend
   npm install
   pm2 start server.js --name dholera-backend
   pm2 save
   pm2 startup
   
   # Build Frontend
   cd ../frontend
   npm install
   npm run build
   ```

3. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/destinationdholera
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name destinationdholera.com www.destinationdholera.com;
       
       # Frontend
       location / {
           root /root/dholera-sir/frontend/build;
           try_files $uri /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/destinationdholera /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL Certificate (Free with Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d destinationdholera.com -d www.destinationdholera.com
   ```

5. **Update DNS Records**
   - Point your domain to droplet IP:
     ```
     Type: A
     Name: @
     Value: [Your Droplet IP]
     
     Type: A
     Name: www
     Value: [Your Droplet IP]
     ```

---

## Domain Configuration

### **After purchasing domain (e.g., destinationdholera.com):**

1. **Login to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Update DNS settings** based on your hosting:
   
   **For Vercel:**
   ```
   Type: CNAME, Name: www, Value: cname.vercel-dns.com
   Type: A, Name: @, Value: 76.76.21.21 (Vercel IP)
   ```
   
   **For Render:**
   ```
   Type: CNAME, Name: www, Value: your-app.onrender.com
   ```
   
   **For DigitalOcean:**
   ```
   Type: A, Name: @, Value: [Your Droplet IP]
   Type: A, Name: www, Value: [Your Droplet IP]
   ```

---

## Required Code Updates for Production

### **Update backend CORS:**
```javascript
// backend/server.js - Update CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://destinationdholera.com',
  'https://www.destinationdholera.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### **Update frontend API configuration:**
```javascript
// frontend/src/api/axios.js
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api'
});
```

---

## Cost Breakdown

### **Budget Option (~ $15-20/month):**
- Domain: $12/year (~$1/month)
- Vercel: Free
- Render: Free tier (sleeps after inactivity) or $7/month
- MongoDB Atlas: Free tier (512MB)

### **Professional Option (~ $30-40/month):**
- Domain: $12/year (~$1/month)
- DigitalOcean Droplet: $6-12/month
- MongoDB Atlas: $9/month (2GB)
- Cloudflare CDN: Free

---

## Post-Deployment Checklist

- [ ] Test all features on production
- [ ] Setup monitoring (UptimeRobot, Better Stack)
- [ ] Configure automated backups for MongoDB
- [ ] Setup error logging (Sentry)
- [ ] Enable HTTPS/SSL
- [ ] Test on mobile devices
- [ ] Update environment variables
- [ ] Remove console.log statements
- [ ] Setup CI/CD with GitHub Actions (optional)

---

## Recommended: Vercel + Render (Easiest)

**Why this combination:**
- ✅ Free to start
- ✅ Automatic HTTPS
- ✅ Git-based deployments (auto-deploy on push)
- ✅ Easy domain configuration
- ✅ Good for beginners
- ✅ Scales automatically

Let me know which option you'd like to proceed with, and I can help you with the specific setup!
