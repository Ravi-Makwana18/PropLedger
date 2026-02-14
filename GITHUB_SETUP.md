# GitHub Setup Instructions

## 🚀 Push Your Code to GitHub

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `DholeraSIR` (or your preferred name)
   - **Description**: "Land Deal Management System - MERN Stack"
   - **Visibility**: Choose **Private** (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub

Copy the repository URL from GitHub (looks like: `https://github.com/yourusername/DholeraSIR.git`)

Then run these commands in your terminal:

```bash
# Add GitHub remote
git remote add origin https://github.com/yourusername/DholeraSIR.git

# Verify remote was added
git remote -v

# Push code to GitHub
git push -u origin main
```

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your code files
3. **IMPORTANT**: Verify that `.env` file is **NOT** visible (it should be ignored)
4. You should see `.env.example` files instead

---

## ✅ Security Checklist

Before pushing, verify:
- [ ] `.env` file is in `.gitignore`
- [ ] No sensitive credentials in code
- [ ] `.env.example` files are present for documentation
- [ ] All passwords/secrets are stored in environment variables

---

## 🔄 Future Updates

After making changes to your code:

```bash
# Check what changed
git status

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

---

## 🎯 What's Next?

After pushing to GitHub:
1. Deploy backend to Render (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))
2. Deploy frontend to Vercel
3. Test your live application

---

## 🆘 Troubleshooting

### "Repository not found" error
- Verify the remote URL is correct: `git remote -v`
- Update remote URL: `git remote set-url origin https://github.com/yourusername/DholeraSIR.git`

### Authentication issues
- Use Personal Access Token instead of password
- Create token at: Settings → Developer settings → Personal access tokens
- Use token as password when pushing

### Files not showing up
- Check if files are staged: `git status`
- Make sure files aren't in `.gitignore`

---

## 📚 Useful Git Commands

```bash
# View commit history
git log --oneline

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout branch-name
```
