(() => {
  'use strict';

  // ---------- Element refs ----------
  const fab      = document.getElementById('aiFab');
  const panel    = document.getElementById('aiPanel');
  const body     = document.getElementById('aiBody');
  const input    = document.getElementById('aiInput');
  const sendBtn  = document.getElementById('aiSend');
  const closeBtn = panel ? panel.querySelector('.close') : null;
  const chips    = document.querySelectorAll('.ai-chip');

  if (!fab || !panel || !body || !input || !sendBtn) {
    console.warn('Chatbot: missing DOM elements, aborting.');
    return;
  }

  // ---------- State ----------
  const MAX_HISTORY = 12;          // keep last N turns to limit tokens
  const STORAGE_KEY = 'campus_ai_chat';
  let history = loadHistory();     // [{role, content}, ...]
  let isBusy  = false;
  let greeted = history.length > 0;

  // ---------- Helpers ----------
  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveHistory() {
    try {
      // only persist last 20 messages to keep storage small
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
    } catch { /* ignore quota errors */ }
  }

  function trimHistory() {
    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }
  }

  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  // ---------- Minimal Markdown renderer (bold + bullets + line breaks) ----------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderMarkdown(text) {
    let html = escapeHtml(text);
    // **bold**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // *italic*
    html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    // bullet lines starting with - or •
    html = html.split('\n').map(line => {
      const m = line.match(/^\s*[-•]\s+(.*)$/);
      return m ? `<span style="display:block;padding-left:14px;text-indent:-14px;">• ${m[1]}</span>` : line;
    }).join('\n');
    // line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  // ---------- UI: messages ----------
  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    if (role.startsWith('bot')) {
      div.innerHTML = renderMarkdown(text);
    } else {
      div.textContent = text;
    }
    body.appendChild(div);
    scrollBottom();
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg bot typing';
    div.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>';
    body.appendChild(div);
    scrollBottom();
    return div;
  }

  function clearChat() {
    history = [];
    body.innerHTML = '';
    greeted = false;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    greet();
  }

  function greet() {
    if (greeted) return;
    addMessage('bot',
      "👋 Hi! I'm your **Campus Portal Assistant**.\n\n" +
      "Ask me about:\n" +
      "- Your attendance & grades\n" +
      "- Pending leaves or tasks\n" +
      "- Upcoming holidays / today's timetable\n" +
      "- How to use any feature\n\n" +
      "Type a question or tap a quick chip below. ✨");
    greeted = true;
  }

  // ---------- Core send logic ----------
  async function sendMessage() {
    const q = input.value.trim();
    if (!q || isBusy) return;

    isBusy = true;
    sendBtn.disabled = true;
    input.value = '';

    addMessage('user', q);
    history.push({ role: 'user', content: q });
    trimHistory();

    const typing = showTyping();

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      let data;
      try { data = await res.json(); }
      catch { throw new Error('Invalid server response'); }

      typing.remove();

      if (res.ok && data.success && data.reply) {
        addMessage('bot', data.reply);
        history.push({ role: 'assistant', content: data.reply });
        trimHistory();
        saveHistory();
      } else {
        addMessage('bot', '⚠️ ' + (data.message || 'Something went wrong. Please try again.'));
      }
    } catch (err) {
      typing.remove();
      console.error('Chatbot error:', err);
      addMessage('bot', '⚠️ Network error. Check your connection and try again.');
    } finally {
      isBusy = false;
      sendBtn.disabled = false;
      input.focus();
      scrollBottom();
    }
  }

  // ---------- Event bindings ----------
  fab.addEventListener('click', () => {
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    if (willOpen) {
      greet();
      setTimeout(() => input.focus(), 150);
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      sendMessage();
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
      fab.focus();
    }
  });

  // Restore previous chat on load (so refresh doesn't lose context)
  if (history.length) {
    history.forEach(m => addMessage(m.role === 'user' ? 'user' : 'bot', m.content));
    greeted = true;
  }
})();