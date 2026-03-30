(function() {
  // 1. Get the API Key and load Markdown parser
  const scriptTag = document.currentScript;
  const apiKey = scriptTag.getAttribute('data-api-key');
  const backendUrl = "http://localhost:8000/api/public/chat/";
  const storageKey = `chat_agent_history_${apiKey}`;

  if (!apiKey) {
    console.error("ChatAgent: Missing data-api-key attribute in script tag.");
    return;
  }

  // Load Marked.js
  const markedScript = document.createElement('script');
  markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  document.head.appendChild(markedScript);

  // 2. Premium Styles
  const styles = `
    #chat-agent-bubble {
      position: fixed;
      bottom: 24px; right: 24px;
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      border-radius: 20px;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.3);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #chat-agent-bubble:hover { transform: translateY(-4px) scale(1.05); }
    #chat-agent-bubble svg { width: 32px; height: 32px; fill: white; }

    #chat-agent-window {
      position: fixed;
      bottom: 104px; right: 24px;
      width: 400px; height: 600px;
      background: white; border-radius: 24px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15);
      z-index: 999999;
      display: none; flex-direction: column;
      overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.8);
      font-family: 'Inter', system-ui, sans-serif;
      animation: chat-slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes chat-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    #chat-header { background: #fff; color: #0f172a; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    #chat-header .title { font-size: 16px; font-weight: 700; color: #0284c7; }
    #chat-messages { flex: 1; overflow-y: auto; padding: 24px; background: #fff; display: flex; flex-direction: column; gap: 16px; }
    .msg-wrapper { display: flex; gap: 12px; max-width: 85%; }
    .msg-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
    .avatar { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .avatar.agent { background: #f0f9ff; color: #0284c7; }
    .avatar.user { background: #0284c7; color: white; }
    .msg { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.6; color: #334155; }
    .agent .msg { background: #f8fafc; border: 1px solid #f1f5f9; border-top-left-radius: 4px; }
    .user .msg { background: #0284c7; color: white; border-top-right-radius: 4px; }
    .msg p { margin: 0 0 10px 0; }
    .msg p:last-child { margin-bottom: 0; }
    .loader-msg { display: none; padding-left: 44px; margin-bottom: 16px; }
    .dots { display: flex; gap: 4px; background: #f8fafc; padding: 12px; border-radius: 12px; width: fit-content; }
    .dot { width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
    @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    #chat-input-area { padding: 20px; background: white; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
    #chat-input { flex: 1; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 14px; outline: none; font-size: 14px; }
    #chat-input:focus { border-color: #0284c7; }
    #chat-send { background: #0284c7; color: white; border: none; width: 42px; height: 42px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    #chat-footer { padding: 8px; text-align: center; font-size: 10px; color: #94a3b8; background: #fff; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // 3. Elements
  const bubble = document.createElement('div');
  bubble.id = 'chat-agent-bubble';
  bubble.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  
  const window = document.createElement('div');
  window.id = 'chat-agent-window';
  window.innerHTML = `
    <div id="chat-header"><span class="title">Support Assistant</span><span id="chat-close" style="cursor:pointer; color:#94a3b8;">&times;</span></div>
    <div id="chat-messages"></div>
    <div id="loader" class="loader-msg"><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>
    <div id="chat-input-area"><input type="text" id="chat-input" placeholder="Ask me anything..."><button id="chat-send"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button></div>
    <div id="chat-footer">Powered by ChatAgent AI</div>
  `;
  document.body.appendChild(bubble);
  document.body.appendChild(window);

  const msgContainer = window.querySelector('#chat-messages');
  const loader = window.querySelector('#loader');
  const input = window.querySelector('#chat-input');
  const sendBtn = window.querySelector('#chat-send');

  // Persistence Logic
  let messages = JSON.parse(localStorage.getItem(storageKey)) || [
    { role: 'agent', text: "Hello! I'm your AI guide. How can I help you today?" }
  ];

  const renderMessages = () => {
    msgContainer.innerHTML = '';
    messages.forEach(m => addMessageToUI(m.role, m.text));
  };

  const addMessageToUI = (role, text) => {
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${role}`;
    wrapper.innerHTML = `
      <div class="avatar ${role}">${role === 'agent' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"/><path d="M12 12 2.1 12"/><path d="m7.6 15.9 5.8-9.4"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}</div>
      <div class="msg">${role === 'agent' && typeof marked !== 'undefined' ? marked.parse(text) : text}</div>
    `;
    msgContainer.appendChild(wrapper);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  };

  const handleSend = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    messages.push({ role: 'user', text });
    localStorage.setItem(storageKey, JSON.stringify(messages));
    addMessageToUI('user', text);
    loader.style.display = 'block';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_api_key: apiKey, question: text })
      });
      const data = await response.json();
      loader.style.display = 'none';
      const answer = data.answer || "Sorry, I couldn't process that.";
      messages.push({ role: 'agent', text: answer });
      localStorage.setItem(storageKey, JSON.stringify(messages));
      addMessageToUI('agent', answer);
    } catch (e) {
      loader.style.display = 'none';
      addMessageToUI('agent', "Connection error.");
    }
  };

  bubble.onclick = () => { window.style.display = window.style.display === 'flex' ? 'none' : 'flex'; renderMessages(); };
  window.querySelector('#chat-close').onclick = () => { window.style.display = 'none'; };
  sendBtn.onclick = handleSend;
  input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

  // Initial Render
  markedScript.onload = renderMessages;
  if (typeof marked !== 'undefined') renderMessages();

})();



