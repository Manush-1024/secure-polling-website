# 🚀 GitHub Push Guide

Follow these steps to push your Secure Online Polling Website to GitHub.

## Prerequisites
- Git installed on your computer ([Download Git](https://git-scm.com/downloads))
- GitHub account ([Sign up at github.com](https://github.com))

---

## Step 1: Create a New Repository on GitHub

1. Go to [github.com](https://github.com) and log in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in the details:
   - **Repository name**: `polling-website` (or any name you prefer)
   - **Description**: "Secure Online Polling Website - MERN Stack Project"
   - **Visibility**: Choose **Public** or **Private**
   - ⚠️ **DO NOT** check "Initialize with README" (we already have one)
4. Click **"Create repository"**

---

## Step 2: Initialize Git in Your Project

Open your terminal/command prompt in the project folder (`k:\polling Wesite`) and run:

```bash
git init
```

This creates a `.git` folder (hidden) that tracks your changes.

---

## Step 3: Add All Files to Git

```bash
git add .
```

This stages all your files for commit. The `.gitignore` file ensures `node_modules/` and `.env` are **not** added.

---

## Step 4: Create Your First Commit

```bash
git commit -m "Initial commit: Secure Online Polling Website"
```

This saves a snapshot of your project with a descriptive message.

---

## Step 5: Connect to GitHub

Copy the commands from your GitHub repository page (they look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/polling-website.git
git branch -M main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 6: Push to GitHub

```bash
git push -u origin main
```

You may be asked to log in to GitHub. Use your credentials or a personal access token.

---

## ✅ Verification

After pushing, refresh your GitHub repository page. You should see:
- ✅ All your files (client/, server/, README.md, etc.)
- ❌ **No** `node_modules/` folders
- ❌ **No** `.env` file (only `.env.example`)

---

## 🔐 Important Security Note

**Never commit your `.env` file!** It contains sensitive information like your MongoDB password. The `.gitignore` file prevents this automatically.

---

## 📝 Future Updates

When you make changes to your project:

```bash
git add .
git commit -m "Description of changes"
git push
```

---

## 🆘 Troubleshooting

### "git is not recognized"
- Install Git from [git-scm.com](https://git-scm.com/downloads)
- Restart your terminal after installation

### Authentication failed
- Use a **Personal Access Token** instead of password
- Generate one at: GitHub → Settings → Developer settings → Personal access tokens

### Files not showing up
- Check `.gitignore` - make sure you're not accidentally ignoring important files
- Run `git status` to see what's being tracked
