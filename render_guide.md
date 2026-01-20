# ☁️ Render Hosting Guide

This guide explains how to host your **Secure Online Polling Website** on Render for free.

## 1. Prepare your GitHub Repository
Render connects directly to your GitHub. Make sure your project is pushed to a repository with the following structure:
```text
/client  <-- Frontend (Vite)
/server  <-- Backend (Node.js)
```

---

## 2. Deploy the Backend (Server)
1.  Log in to [Render](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Configure the Service**:
    - **Name**: `swiftpoll-api`
    - **Root Directory**: `server`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
5.  **Environment Variables**:
    - Click the **Environment** tab.
    - Add `MONGO_URI`: (Your MongoDB Atlas connection string).
    - Add `PORT`: `10000` (Render's default).

---

## 3. Update the Frontend
Before deploying the frontend, you must tell it where your new backend is hosted.

1.  Copy the URL of your deployed backend (e.g., `https://swiftpoll-api.onrender.com`).
2.  Open `client/main.js`.
3.  Update the `API_URL`:
    ```javascript
    const API_URL = 'https://swiftpoll-api.onrender.com/api';
    ```
4.  Commit and push this change to GitHub.

---

## 4. Deploy the Frontend (Client)
1.  On Render, click **New +** -> **Static Site**.
2.  Connect the same GitHub repository.
3.  **Configure the Site**:
    - **Name**: `swiftpoll`
    - **Root Directory**: `client`
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist`
4.  Click **Deploy**.

---

## 💡 Important Tips for Viva
- **CORS**: Our Express server uses the `cors()` middleware. This is essential because the frontend (`swiftpoll.render.com`) is on a different domain than the backend (`swiftpoll-api.render.com`).
- **Cold Starts**: Render's free tier "sleeps" after 15 minutes of inactivity. When you first visit the site, it might take 30-50 seconds to wake up (this is normal for free hosting).
