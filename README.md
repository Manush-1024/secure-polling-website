# 🗳️ SwiftPoll - Secure Online Polling Website

A modern, anonymous polling platform built with the MERN stack. Create instant polls, gather opinions, and view real-time results—no signup required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

## ✨ Features

- 🔒 **Anonymous & Secure** - No authentication required, privacy-first design
- 🚫 **Duplicate Prevention** - IP-based + LocalStorage protection
- 📊 **Real-time Results** - Instant vote counting with animated progress bars
- 📱 **Fully Responsive** - Beautiful UI on mobile, tablet, and desktop
- ⚡ **Lightning Fast** - Built with Vite for optimal performance
- 🎨 **Modern Design** - Clean, bright theme with smooth animations

## 🛠️ Tech Stack

### Frontend
- **Vite** - Next-generation frontend tooling
- **Vanilla JavaScript** - No framework overhead
- **CSS3** - Modern styling with CSS variables

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling

## 📁 Project Structure

```
polling-website/
│
├── client/                 # Frontend (Vite)
│   ├── src/
│   │   ├── main.js        # Application logic
│   │   └── style.css      # Styles
│   ├── public/            # Static assets
│   ├── index.html         # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend (Express)
│   ├── models/
│   │   └── Poll.js        # Mongoose schema
│   ├── index.js           # Server entry point
│   ├── package.json
│   ├── .env               # Environment variables (gitignored)
│   └── .env.example       # Template for .env
│
├── .gitignore
├── README.md
└── render_guide.md        # Deployment instructions
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polling-website.git
   cd polling-website
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your MongoDB Atlas connection string:
   ```env
   PORT=4000
   MONGO_URI=your_mongodb_connection_string

   ```

4. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

5. **Run the Application**
   
   In one terminal (backend):
   ```bash
   cd server
   node index.js
   ```
   
   In another terminal (frontend):
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Deployment

See [render_guide.md](./render_guide.md) for detailed instructions on deploying to Render.

### Quick Deploy Steps:
1. Push code to GitHub
2. Deploy backend to Render (Web Service)
3. Update `API_URL` in `client/src/main.js`
4. Deploy frontend to Render (Static Site)

## 🔐 Security Features

### Duplicate Vote Prevention
- **Backend**: IP address logging in MongoDB
- **Frontend**: LocalStorage tracking
- **Combined**: Multi-layer protection against vote manipulation

### Privacy
- No user accounts or personal data collection
- Anonymous voting
- IP addresses used only for duplicate prevention

## 📖 API Documentation

### Endpoints

#### `POST /api/poll`
Create a new poll
```json
{
  "question": "What's your favorite color?",
  "options": ["Red", "Blue", "Green"]
}
```

#### `GET /api/poll/:id`
Retrieve poll details for voting

#### `POST /api/vote`
Submit a vote
```json
{
  "pollId": "507f1f77bcf86cd799439011",
  "optionId": "507f191e810c19729de860ea"
}
```

#### `GET /api/results/:id`
Get poll results with vote counts

### Limitations & Future Improvements
- **Current**: IP-based prevention can be bypassed with VPN
- **Future**: Add optional email verification, CAPTCHA, or OAuth

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**
- GitHub: [Manush](https://github.com/Manush-1024)
- Email: kit28.24bam040@gmail.com

## 🙏 Acknowledgments

- Built as a college project for AIML course
- Inspired by modern polling platforms like Strawpoll and Polly
