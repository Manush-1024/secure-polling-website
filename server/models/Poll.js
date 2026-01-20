/**
 * Poll Model
 * 
 * Mongoose schema for storing poll data in MongoDB.
 * Each poll contains a question, multiple options with vote counts,
 * and an array of IP addresses that have voted (for duplicate prevention).
 * 
 * @module models/Poll
 */

const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        votes: {
            type: Number,
            default: 0
        }
    }],
    votedIPs: {
        type: [String],
        default: [],
        // Stores IP addresses of users who have voted
        // Used for basic duplicate vote prevention
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Poll', pollSchema);
