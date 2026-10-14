// DOM Elements
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const submitBtn = document.getElementById('chat-submit');
const chatWindow = document.getElementById('chatbot-window');
const quickChips = document.getElementById('quick-chips');

// Multi-turn conversation array adhering to Gemini API role format
const conversation = [];

// Toggle Chatbot Window
window.toggleChatbot = function () {
  if (!chatWindow) return;
  const isHidden = chatWindow.classList.contains('hidden');
  if (isHidden) {
    chatWindow.classList.remove('hidden');
    chatWindow.classList.add('flex');
    if (input) input.focus();
  } else {
    chatWindow.classList.add('hidden');
    chatWindow.classList.remove('flex');
  }
};

// Send Quick Suggestion Message
window.sendQuickMessage = function (text) {
  if (!text) return;
  // Make sure chatbot window is visible
  if (chatWindow && chatWindow.classList.contains('hidden')) {
    window.toggleChatbot();
  }
  if (input) {
    input.value = text;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }
};

// Filter Fleet by Category
window.filterFleet = function (category, btnElement) {
  const cards = document.querySelectorAll('.fleet-card');
  const buttons = document.querySelectorAll('.fleet-filter-btn');

  // Update button active styling
  buttons.forEach((btn) => {
    btn.classList.remove('active-filter', 'bg-black', 'text-white', 'shadow-sm');
    btn.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-200');
  });

  if (btnElement) {
    btnElement.classList.add('active-filter', 'bg-black', 'text-white', 'shadow-sm');
    btnElement.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-200');
  }

  // Filter cards
  cards.forEach((card) => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
};

// Form Submit Handler
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // 1. Hide quick chips after first message
    if (quickChips) {
      quickChips.style.display = 'none';
    }

    // 2. Render user message in chat
    appendUserBubble(userMessage);
    conversation.push({ role: 'user', text: userMessage });

    // Clear input & disable controls during network request
    input.value = '';
    input.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    // 3. Show temporary "Thinking..." bot bubble
    const { botBubbleContainer, botContentEl } = appendLoadingBotBubble();

    try {
      // 4. Send POST request to backend /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 5. Replace "Thinking..." with AI response
      if (data && data.result) {
        botContentEl.classList.remove('animate-pulse', 'text-gray-400');
        botContentEl.classList.add('text-gray-200');
        botContentEl.innerHTML = formatMarkdown(data.result);
        conversation.push({ role: 'model', text: data.result });
      } else {
        botContentEl.classList.remove('animate-pulse');
        botContentEl.textContent = 'Maaf, tidak ada respon yang diterima.';
        conversation.pop(); // Revert unanswered turn
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      botContentEl.classList.remove('animate-pulse');
      botContentEl.textContent = 'Gagal terhubung dengan server chatbot.';
      conversation.pop(); // Revert failed turn
    } finally {
      // Re-enable input and refocus
      input.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      input.focus();
      scrollToBottom();
    }
  });
}

/**
 * Appends a user message bubble
 * @param {string} text
 */
function appendUserBubble(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-start justify-end space-x-2';
  wrapper.innerHTML = `
    <div class="bg-brand-gold text-black rounded-2xl rounded-tr-none p-3 max-w-[85%] font-medium leading-relaxed">
      ${escapeHtml(text)}
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Appends a temporary loading bot bubble
 * @returns {{ botBubbleContainer: HTMLDivElement, botContentEl: HTMLDivElement }}
 */
function appendLoadingBotBubble() {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-start space-x-2';
  wrapper.innerHTML = `
    <div class="w-6 h-6 rounded-full bg-brand-gold text-black flex-shrink-0 flex items-center justify-center text-[10px] mt-1">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="bot-content bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-3 text-gray-400 max-w-[85%] leading-relaxed animate-pulse">
      <i class="fa-solid fa-circle-notch fa-spin text-xs mr-1.5"></i> Sedang berpikir...
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();

  const botContentEl = wrapper.querySelector('.bot-content');
  return { botBubbleContainer: wrapper, botContentEl };
}

/**
 * Scrolls the chat messages container to the bottom
 */
function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Escapes HTML characters for safety
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats Markdown elements (bold, italic, list items, newlines) safely into HTML
 * @param {string} text
 * @returns {string}
 */
function formatMarkdown(text) {
  if (!text) return '';
  let safe = escapeHtml(text);
  // **bold**
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // bullet points • or -
  safe = safe.replace(/^\s*[-•]\s+(.*)$/gm, '&bull; $1<br>');
  // newlines
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}