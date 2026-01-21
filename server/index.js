/**
 * SwiftPoll Backend Server
 * 
 * A secure, anonymous polling API built with Express.js and MongoDB.
 * Implements IP-based duplicate vote prevention.
 * 
 * @author Your Name
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (update for production if needed)
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-poll', (pollId) => {
        socket.join(pollId);
        console.log(`Socket ${socket.id} joined poll ${pollId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// API ROUTES
// ============================================

/**
 * POST /api/poll
 * Create a new poll with a question and multiple options
 * 
 * @body {string} question - The poll question
 * @body {string[]} options - Array of option texts
 * @body {number} [duration] - Duration in minutes (optional)
 * @returns {object} { id: pollId, message: success message }
 */
app.post('/api/poll', async (req, res) => {
    try {
        const { question, options, duration } = req.body;

        // Validate input
        if (!question || !options || options.length < 2) {
            return res.status(400).json({ error: 'Question and at least 2 options required' });
        }

        // Calculate expiration if duration is provided
        let expiresAt = null;
        if (duration && duration > 0) {
            expiresAt = new Date(Date.now() + duration * 60 * 1000);
        }

        // Format options for the schema
        const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));

        const newPoll = new Poll({
            question,
            options: formattedOptions,
            expiresAt
        });

        await newPoll.save();
        res.status(201).json({ id: newPoll._id, message: 'Poll created successfully!' });
    } catch (err) {
        console.error('Error creating poll:', err);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});

/**
 * GET /api/poll/:id
 * Retrieve poll details for voting
 * 
 * @param {string} id - Poll ID
 * @returns {object} Poll document with question and options
 */
app.get('/api/poll/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        // Check if poll is expired
        const isExpired = poll.expiresAt && new Date() > new Date(poll.expiresAt);

        res.json({
            ...poll.toObject(),
            isExpired
        });
    } catch (err) {
        console.error('Error fetching poll:', err);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

/**
 * POST /api/vote
 * Submit a vote for a poll option
 * Implements IP-based duplicate prevention
 * 
 * @body {string} pollId - The poll ID
 * @body {string} optionId - The selected option ID
 * @returns {object} { message: success message }
 */
app.post('/api/vote', async (req, res) => {
    try {
        const { pollId, optionId } = req.body;

        // Extract user IP (works with proxies like Render)
        // Taking the first IP in the list is safer for x-forwarded-for
        const userIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        // Check for expiration
        if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
            return res.status(400).json({ error: 'This poll has expired and is no longer accepting votes.' });
        }

        // Check if IP has already voted (duplicate prevention)
        if (poll.votedIPs.includes(userIP)) {
            return res.status(400).json({ error: 'You have already voted from this IP!' });
        }

        // Find and increment the selected option's vote count
        const option = poll.options.id(optionId);
        if (!option) return res.status(404).json({ error: 'Option not found' });

        option.votes += 1;
        poll.votedIPs.push(userIP);

        await poll.save();
        
        // Notify all clients in the poll room about the update
        io.to(pollId).emit('poll-updated', {
            pollId,
            options: poll.options,
            totalVotes: poll.votedIPs.length
        });

        res.json({ message: 'Vote recorded!' });
    } catch (err) {
        console.error('Error recording vote:', err);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

/**
 * GET /api/results/:id
 * Retrieve poll results with vote counts
 * 
 * @param {string} id - Poll ID
 * @returns {object} { question, options, totalVotes }
 */
app.get('/api/results/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        res.json({
            question: poll.question,
            options: poll.options,
            totalVotes: poll.votedIPs.length
        });
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// ============================================
// SERVER START
// ============================================
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
