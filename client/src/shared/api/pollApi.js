const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:4000/api' : 'https://swiftpoll-api.onrender.com/api';

export const pollApi = {
    createPoll: async (question, options, duration) => {
        const response = await fetch(`${API_URL}/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, options, duration })
        });
        return response.json();
    },

    getPoll: async (id) => {
        const response = await fetch(`${API_URL}/poll/${id}`);
        return response.json();
    },

    getActivePolls: async () => {
        const response = await fetch(`${API_URL}/polls/active`);
        return response.json();
    },

    getResults: async (id) => {
        const response = await fetch(`${API_URL}/results/${id}`);
        return response.json();
    },

    submitVote: async (pollId, optionId) => {
        const response = await fetch(`${API_URL}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pollId, optionId })
        });
        return response.json();
    },

    terminatePoll: async (id) => {
        const response = await fetch(`${API_URL}/poll/${id}/terminate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }
};
