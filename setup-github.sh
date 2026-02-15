#!/bin/bash

# GitHub Repository Setup Script
# Run this script after creating your repository on GitHub

echo "🚀 GitHub Setup for DholeraSIR"
echo "================================"
echo ""
echo "Please provide your GitHub username:"
read GITHUB_USERNAME
echo ""
echo "Repository name (press Enter for 'DholeraSIR'):"
read REPO_NAME
REPO_NAME=${REPO_NAME:-DholeraSIR}
echo ""

# Construct the repository URL
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo "Setting up remote: $REPO_URL"
echo ""

# Add remote
git remote add origin "$REPO_URL"

# Verify remote
echo "✅ Remote configured:"
git remote -v
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub"
echo "🌐 View at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
