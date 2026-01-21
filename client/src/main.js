import { io } from "socket.io-client";

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// Detect if running in a container/GitPod/Codespace if needed, but localhost is good for now.
// Note: If accessing from another device on network, use local IP.

const API_URL = isLocal ? 'http://localhost:4000/api' : 'https://swiftpoll-api.onrender.com/api';
const SOCKET_URL = isLocal ? 'http://localhost:4000' : 'https://swiftpoll-api.onrender.com';

const socket = io(SOCKET_URL);
// const socket = io('http://localhost:5000'); // Toggle for local dev

// --- State Management ---
let currentPollId = null;
let selectedOptionId = null;

// --- DOM Elements ---
const views = {
  landing: document.getElementById('landing-section'),
  home: document.getElementById('home-section'),
  vote: document.getElementById('vote-section'),
  results: document.getElementById('results-section')
};

const elements = {
  getStartedBtn: document.getElementById('get-started-btn'),
  questionInput: document.getElementById('poll-question'),
  optionsContainer: document.getElementById('options-container'),
  addOptionBtn: document.getElementById('add-option-btn'),
  createPollBtn: document.getElementById('create-poll-btn'),
  voteQuestion: document.getElementById('vote-question'),
  voteOptionsList: document.getElementById('vote-options-list'),
  submitVoteBtn: document.getElementById('submit-vote-btn'),
  resultsQuestion: document.getElementById('results-question'),
  resultsContainer: document.getElementById('results-container'),
  totalVotesText: document.getElementById('total-votes-text'),
  backHomeBtn: document.getElementById('back-home-btn'),
  statusMsg: document.getElementById('status-message'),
  logoLink: document.getElementById('logo-link'),
  pollDuration: document.getElementById('poll-duration'),
  sharePollBtn: document.getElementById('share-poll-btn'),
  expiredBadge: document.getElementById('expired-badge'),
  recentPollsContainer: document.getElementById('recent-polls-container'),
  recentPollsList: document.getElementById('recent-polls-list')
};

// --- View Switching ---
function showView(viewName) {
  Object.keys(views).forEach(key => {
    if (views[key]) views[key].classList.add('hidden');
  });
  if (views[viewName]) views[viewName].classList.remove('hidden');
  elements.statusMsg.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStatus(msg, type = 'success') {
  elements.statusMsg.textContent = msg;
  elements.statusMsg.className = `status-message ${type}`;
  elements.statusMsg.classList.remove('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    elements.statusMsg.classList.add('hidden');
  }, 3000);
}

// --- Navigation Logic ---
elements.logoLink.addEventListener('click', (e) => {
  e.preventDefault();
  showView('landing');
  renderRecentPolls();
});

elements.getStartedBtn.addEventListener('click', () => {
  window.history.pushState({ view: 'create' }, '', '?view=create');
  showView('home');
});

// --- Recent Polls Logic ---
function getRecentPolls() {
  return JSON.parse(localStorage.getItem('my_polls') || '[]');
}

function saveToRecent(id, question) {
  let polls = getRecentPolls();
  // Remove if exists to re-add at top
  polls = polls.filter(p => p.id !== id);
  polls.unshift({ id, question, timestamp: Date.now() });
  // Keep max 10
  if (polls.length > 10) polls.pop();
  localStorage.setItem('my_polls', JSON.stringify(polls));
}

function renderRecentPolls() {
  const polls = getRecentPolls();
  if (polls.length === 0) {
    elements.recentPollsContainer.classList.add('hidden');
    return;
  }

  elements.recentPollsContainer.classList.remove('hidden');
  elements.recentPollsList.innerHTML = '';

  polls.forEach(poll => {
    const div = document.createElement('div');
    div.className = 'recent-poll-item';
    div.style.padding = '0.75rem';
    div.style.background = 'white';
    div.style.borderRadius = '0.5rem';
    div.style.cursor = 'pointer';
    div.style.border = '1px solid var(--border)';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';

    const timeAgo = Math.round((Date.now() - poll.timestamp) / (1000 * 60)); // minutes
    let timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;
    if (timeAgo > 1440) timeStr = `${Math.floor(timeAgo / 1440)}d ago`;

    div.innerHTML = `
            <span style="font-weight: 600; color: var(--text-main);">${poll.question}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</span>
        `;

    div.addEventListener('click', () => {
      const newUrl = window.location.origin + window.location.pathname + '?poll=' + poll.id;
      window.history.pushState({ path: newUrl }, '', newUrl);
      loadPoll(poll.id);
    });

    elements.recentPollsList.appendChild(div);
  });
}

document.querySelectorAll('.back-to-home-btn').forEach(btn => {
  btn.addEventListener('click', () => showView('landing'));
});

// --- Home Section Logic (Create Poll) ---
elements.addOptionBtn.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'option-input-wrapper';
  div.style.display = 'flex';
  div.style.gap = '0.5rem';
  div.style.marginBottom = '0.5rem';

  div.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="Another Choice">
      <button class="btn btn-secondary remove-btn" style="padding: 0.5rem 1rem; color: #ef4444; border-color: #fecaca;">✕</button>
    `;
  elements.optionsContainer.appendChild(div);

  div.querySelector('.remove-btn').addEventListener('click', () => {
    div.remove();
  });
});

elements.createPollBtn.addEventListener('click', async () => {
  const question = elements.questionInput.value.trim();
  const optionInputs = Array.from(document.querySelectorAll('.poll-option-input'));
  const options = optionInputs.map(input => input.value.trim()).filter(val => val !== '');
  const duration = parseInt(elements.pollDuration.value);

  if (!question || options.length < 2) {
    showStatus('Please provide a question and at least 2 choices.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, duration })
    });

    const data = await response.json();
    if (response.ok) {
      currentPollId = data.id;
      // Update URL for easy sharing
      const newUrl = window.location.origin + window.location.pathname + '?poll=' + currentPollId;
      window.history.pushState({ path: newUrl }, '', newUrl);

      showStatus('Poll created successfully! 🚀');
      saveToRecent(currentPollId, question);
      loadPoll(currentPollId);
    } else {
      showStatus(data.error || 'Failed to create poll', 'error');
    }
  } catch (err) {
    showStatus('Network error. Is the server running?', 'error');
  }
});

// --- Vote Section Logic ---
async function loadPoll(id) {
  try {
    const response = await fetch(`${API_URL}/poll/${id}`);
    const poll = await response.json();

    if (!response.ok) throw new Error(poll.error);

    // Save to history automatically when visiting
    saveToRecent(poll._id, poll.question);

    // Join Real-time Room
    socket.emit('join-poll', id);

    elements.voteQuestion.textContent = poll.question;
    elements.voteOptionsList.innerHTML = '';
    selectedOptionId = null;
    elements.submitVoteBtn.disabled = true;

    // Handle Expiry
    if (poll.isExpired) {
      elements.expiredBadge.classList.remove('hidden');
      elements.submitVoteBtn.textContent = "Voting Closed";
      elements.submitVoteBtn.disabled = true;
    } else {
      elements.expiredBadge.classList.add('hidden');
      elements.submitVoteBtn.textContent = "Cast Vote";
      elements.submitVoteBtn.disabled = true;
    }

    poll.options.forEach(option => {
      const div = document.createElement('div');
      div.className = 'poll-option';
      div.textContent = option.text;

      // Only allow clicking if NOT expired
      if (!poll.isExpired) {
        div.addEventListener('click', () => {
          document.querySelectorAll('.poll-option').forEach(el => el.classList.remove('selected'));
          div.classList.add('selected');
          selectedOptionId = option._id;
          elements.submitVoteBtn.disabled = false;
        });
      } else {
        div.style.opacity = '0.7';
        div.style.cursor = 'not-allowed';
      }

      elements.voteOptionsList.appendChild(div);
    });

    showView('vote');
  } catch (err) {
    showStatus(err.message || 'Failed to load poll', 'error');
    showView('landing');
  }
}

elements.submitVoteBtn.addEventListener('click', async () => {
  if (!selectedOptionId || !currentPollId) return;

  // LocalStorage Check (Frontend-side security)
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
  if (votedPolls.includes(currentPollId)) {
    showStatus('You have already voted in this poll!', 'error');
    loadResults(currentPollId);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: currentPollId, optionId: selectedOptionId })
    });

    const data = await response.json();
    if (response.ok) {
      // Mark as voted
      votedPolls.push(currentPollId);
      localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

      showStatus('Vote cast successfully! ✅');
      loadResults(currentPollId);
    } else {
      showStatus(data.error || 'Failed to submit vote', 'error');
    }
  } catch (err) {
    showStatus('Network error. Failed to submit vote.', 'error');
  }
});

elements.sharePollBtn.addEventListener('click', () => {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showStatus('Poll link copied to clipboard! 🔗');
  }).catch(() => {
    showStatus('Failed to copy link', 'error');
  });
});

// --- Results Section Logic ---
async function loadResults(id) {
  try {
    const response = await fetch(`${API_URL}/results/${id}`);
    const results = await response.json();

    if (!response.ok) throw new Error(results.error);

    elements.resultsQuestion.textContent = results.question;
    elements.totalVotesText.textContent = results.totalVotes;
    elements.resultsContainer.innerHTML = '';

    results.options.forEach(option => {
      const percentage = results.totalVotes > 0
        ? Math.round((option.votes / results.totalVotes) * 100)
        : 0;

      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      resultItem.innerHTML = `
                <div class="result-header">
                  <span>${option.text}</span>
                  <span>${option.votes} votes (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
      elements.resultsContainer.appendChild(resultItem);
    });

    showView('results');
  } catch (err) {
    showStatus(err.message || 'Failed to load results', 'error');
  }
}

elements.backHomeBtn.addEventListener('click', () => {
  // Reset form
  elements.questionInput.value = '';
  elements.optionsContainer.innerHTML = `
        <div class="option-input-wrapper">
            <input type="text" class="poll-option-input" placeholder="Option 1">
        </div>
        <div class="option-input-wrapper">
            <input type="text" class="poll-option-input" placeholder="Option 2">
        </div>
    `;

  // Reset Duration
  elements.pollDuration.value = "0";

  // Reset URL
  window.history.pushState({}, '', window.location.origin + window.location.pathname);
  showView('home');
});

// --- Real-time Updates ---
socket.on('poll-updated', (data) => {
  if (currentPollId === data.pollId) {
    // If we represent the voting page, we might want to show live stats? 
    // Usually voting pages don't show results to avoid bias, but we can verify it's working.
    // The user asked for "Vote live update".

    // If we are on the results page, update the chart
    if (!elements.resultsContainer.closest('.hidden')) {
      loadResults(data.pollId);
    }
  }
});

// Initial Load Handle (Deep Links)
const init = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pollIdFromUrl = urlParams.get('poll');
  if (pollIdFromUrl) {
    currentPollId = pollIdFromUrl;
    loadPoll(currentPollId);
  } else if (urlParams.get('view') === 'create') {
    showView('home');
  } else {
    showView('landing');
    renderRecentPolls();
  }
};

init();

// Handle Back Button
window.addEventListener('popstate', () => {
  init();
});
