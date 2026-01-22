import { io } from "socket.io-client";
import confetti from 'canvas-confetti';
import { pollApi } from './shared/api/pollApi';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = isLocal ? 'http://localhost:4000' : 'https://swiftpoll-api.onrender.com';

const socket = io(SOCKET_URL);

// --- State Management ---
let currentPollId = null;
let selectedOptionId = null;

let timerInterval = null;

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
  recentPollsList: document.getElementById('recent-polls-list'),
  customDurationWrapper: document.getElementById('custom-duration-wrapper'),
  customDurationValue: document.getElementById('custom-duration-value'),
  customDurationUnit: document.getElementById('custom-duration-unit'),
  timerContainer: document.getElementById('poll-timer-container'),
  pollTimer: document.getElementById('poll-timer'),
  activePollsContainer: document.getElementById('active-polls-container'),
  activePollsList: document.getElementById('active-polls-list'),
  viewActiveBtn: document.getElementById('view-active-btn'),
  viewResultsDirectBtn: document.getElementById('view-results-direct-btn'),
  closeActiveBtn: document.getElementById('close-active-btn'),
  terminatePollBtn: document.getElementById('terminate-poll-btn')
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

elements.viewActiveBtn.addEventListener('click', () => {
  renderActivePolls();
  elements.activePollsContainer.scrollIntoView({ behavior: 'smooth' });
});

elements.viewResultsDirectBtn.addEventListener('click', () => {
  if (currentPollId) loadResults(currentPollId);
});

elements.closeActiveBtn.addEventListener('click', () => {
  elements.activePollsContainer.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

elements.terminatePollBtn.addEventListener('click', async () => {
  if (!currentPollId) return;
  if (!confirm('Are you sure you want to terminate this poll? No more votes will be accepted.')) return;

  try {
    const data = await pollApi.terminatePoll(currentPollId);
    if (data.message === 'Poll terminated') {
      showStatus('Poll terminated successfully 🛑');
      loadResults(currentPollId);
    } else {
      showStatus(data.error || 'Failed to terminate poll', 'error');
    }
  } catch (err) {
    showStatus('Network error. Failed to terminate poll.', 'error');
  }
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

async function renderActivePolls() {
  try {
    const polls = await pollApi.getActivePolls();
    if (polls.length === 0) {
      elements.activePollsContainer.classList.add('hidden');
      return;
    }

    elements.activePollsContainer.classList.remove('hidden');
    elements.activePollsList.innerHTML = '';

    polls.forEach(poll => {
      const div = document.createElement('div');
      div.className = 'recent-poll-item active-poll-item';
      div.style.padding = '0.75rem';
      div.style.background = 'white';
      div.style.borderRadius = '0.5rem';
      div.style.cursor = 'pointer';
      div.style.border = '1px solid var(--border)';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.transition = 'all 0.2s ease';

      div.innerHTML = `
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; color: var(--text-main);">${poll.question}</span>
                <span style="font-size: 0.75rem; color: var(--success); font-weight: 700;">● RUNNING</span>
              </div>
              <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Vote</button>
          `;

      div.addEventListener('click', () => {
        const newUrl = window.location.origin + window.location.pathname + '?poll=' + poll._id;
        window.history.pushState({ path: newUrl }, '', newUrl);
        loadPoll(poll._id);
      });

      elements.activePollsList.appendChild(div);
    });
  } catch (err) {
    console.error('Failed to load active polls', err);
  }
}

document.querySelectorAll('.back-to-home-btn').forEach(btn => {
  btn.addEventListener('click', () => showView('landing'));
});

// --- Home Section Logic (Create Poll) ---
elements.addOptionBtn.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'option-input-wrapper';
  div.className = 'option-input-wrapper';
  // div.style.marginBottom = '0.5rem'; // Handled by CSS now

  div.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="Another Choice">
      <button class="btn btn-secondary remove-btn" style="padding: 0.5rem 1rem; color: #ef4444; border-color: #fecaca;">✕</button>
    `;
  elements.optionsContainer.appendChild(div);

  div.querySelector('.remove-btn').addEventListener('click', () => {
    div.remove();
  });
});

// Toggle Custom Duration
elements.pollDuration.addEventListener('change', (e) => {
  if (e.target.value === 'custom') {
    elements.customDurationWrapper.classList.remove('hidden');
    elements.customDurationWrapper.style.display = 'flex'; // Force flex
  } else {
    elements.customDurationWrapper.classList.add('hidden');
    elements.customDurationWrapper.style.display = 'none';
  }
});

elements.createPollBtn.addEventListener('click', async () => {
  const question = elements.questionInput.value.trim();
  const optionInputs = Array.from(document.querySelectorAll('.poll-option-input')).filter(el => el.type === 'text');
  const options = optionInputs.map(input => input.value.trim()).filter(val => val !== '');

  let duration = parseInt(elements.pollDuration.value);

  // Handle Custom Duration
  if (elements.pollDuration.value === 'custom') {
    const val = parseInt(elements.customDurationValue.value);
    const unit = elements.customDurationUnit.value;

    if (!val || val <= 0) {
      showStatus('Please enter a valid custom duration.', 'error');
      return;
    }

    if (unit === 'm') duration = val;
    if (unit === 'h') duration = val * 60;
    if (unit === 'd') duration = val * 1440;
  }

  if (!question || options.length < 2) {
    showStatus('Please provide a question and at least 2 choices.', 'error');
    return;
  }

  try {
    const data = await pollApi.createPoll(question, options, duration);
    if (data.id) {
      currentPollId = data.id;
      // Update URL for easy sharing
      const newUrl = window.location.origin + window.location.pathname + '?poll=' + currentPollId;
      window.history.pushState({ path: newUrl }, '', newUrl);

      showStatus('Poll created successfully! 🚀');

      // Track ownership
      const myCreatedPolls = JSON.parse(localStorage.getItem('my_created_polls') || '[]');
      myCreatedPolls.push(currentPollId);
      localStorage.setItem('my_created_polls', JSON.stringify(myCreatedPolls));

      // Celebration
      startConfetti();

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
    const poll = await pollApi.getPoll(id);

    if (poll.error) throw new Error(poll.error);

    // Auto-redirect if already voted
    const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
    if (poll.hasVoted || votedPolls.includes(id)) {
      loadResults(id);
      return;
    }

    // Save to history automatically when visiting
    saveToRecent(poll._id, poll.question);

    // Join Real-time Room
    socket.emit('join-poll', id);

    elements.voteQuestion.textContent = poll.question;
    elements.voteOptionsList.innerHTML = '';
    selectedOptionId = null;
    elements.submitVoteBtn.disabled = true;

    // Handle Expiry & Timer
    if (timerInterval) clearInterval(timerInterval);

    if (poll.isExpired) {
      elements.expiredBadge.classList.remove('hidden');
      elements.timerContainer.classList.add('hidden');
      elements.submitVoteBtn.textContent = "Voting Closed";
      elements.submitVoteBtn.disabled = true;
    } else {
      elements.expiredBadge.classList.add('hidden');

      // Start Timer if expiresAt exists
      if (poll.expiresAt) {
        elements.timerContainer.classList.remove('hidden');
        startTimer(new Date(poll.expiresAt));
      } else {
        elements.timerContainer.classList.add('hidden');
      }

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
    const data = await pollApi.submitVote(currentPollId, selectedOptionId);
    if (data.message === 'Vote recorded!') {
      // Mark as voted
      votedPolls.push(currentPollId);
      localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

      showStatus('Vote cast successfully! ✅');

      // Celebration
      startConfetti();

      loadResults(currentPollId);
    } else {
      showStatus(data.error || 'Failed to submit vote', 'error');
    }
  } catch (err) {
    showStatus('Network error. Failed to submit vote.', 'error');
  }
});

function startTimer(endTime) {
  function update() {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(timerInterval);
      elements.pollTimer.textContent = "Expired";
      elements.timerContainer.classList.add('hidden');
      elements.expiredBadge.classList.remove('hidden');
      elements.submitVoteBtn.disabled = true;
      elements.submitVoteBtn.textContent = "Voting Closed";

      // Disable options
      document.querySelectorAll('.poll-option').forEach(el => {
        el.style.opacity = '0.7';
        el.style.cursor = 'not-allowed';
      });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeString = "";
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `;
    timeString += `${minutes}m ${seconds}s`;

    elements.pollTimer.textContent = timeString;

    // Heartbeat & Red Color if <= 15 seconds
    const diffSeconds = diff / 1000;
    if (diffSeconds <= 15) {
      elements.pollTimer.parentElement.classList.add('timer-critical');
    } else {
      elements.pollTimer.parentElement.classList.remove('timer-critical');
    }
  }

  update(); // Run immediately
  timerInterval = setInterval(update, 1000);
}

function startConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 }
  });
}

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
  currentPollId = id; // Ensure state is synced
  try {
    const results = await pollApi.getResults(id);

    if (results.error) throw new Error(results.error);

    // Check if host
    const myCreatedPolls = JSON.parse(localStorage.getItem('my_created_polls') || '[]');
    const isHost = myCreatedPolls.includes(id);

    // Is poll active? (Need to check results or fetch poll details)
    const pollDetails = await pollApi.getPoll(id);
    const isAlreadyExpired = pollDetails.isExpired;

    if (isHost && !isAlreadyExpired) {
      elements.terminatePollBtn.classList.remove('hidden');
    } else {
      elements.terminatePollBtn.classList.add('hidden');
    }

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
    renderActivePolls();
  }
};

init();

// Handle Back Button
window.addEventListener('popstate', () => {
  init();
});
