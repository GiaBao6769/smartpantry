import { API_BASE } from "./main.js";

const urlParams = new URLSearchParams(window.location.search);
const threadId = urlParams.get('id');
if (!threadId) {
    window.location.href = 'chatbot.html';
}

// ==================== DOM Elements ====================
const threadTitle = document.getElementById('thread-title');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-message-btn');


// ==================== THREAD DETAIL ====================
async function loadThread() {
    try {
        const response = await fetch(`${API_BASE}/api/thread/${threadId}`, 
            { credentials: "include" }
        );

        if (!response.ok) throw new Error('Failed to load thread');
        const data = await response.json();
        const thread = data.thread;
        threadTitle.textContent = thread.name;

        const chatsRes = await fetch(`${API_BASE}/api/thread/${threadId}/chats`, 
            {
                method: "GET",
                credentials: "include"
            });
        const chatsData = await chatsRes.json();
        renderChats(chatsData.chats);

    } catch (error) {
        console.error('Load thread error:', error);
    }
}

loadThread();

function renderChats(messages) {
    messagesContainer.innerHTML = '';

    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', msg.role);
        msgDiv.innerHTML = `
            <div class="avatar">${msg.role === 'user' ? '👤' : '🌿'}</div>
            <div class="bubble">${escapeHtml(msg.content)}</div>
        `;
        messagesContainer.appendChild(msgDiv);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

sendBtn.addEventListener('click', async () => {
    const content = messageInput.value.trim();
    if (!content) return;
    messageInput.value = '';

    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user');
    userMsg.innerHTML = `
        <div class="avatar">👤</div>
        <div class="bubble">${escapeHtml(content)}</div>
    `;
    messagesContainer.appendChild(userMsg);

    const typingMsg = document.createElement('div');
    typingMsg.classList.add('message', 'assistant');
    typingMsg.innerHTML = `
        <div class="avatar">🌿</div>
        <div class="bubble">Typing...</div>
    `;
    messagesContainer.appendChild(typingMsg);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/api/thread/${threadId}/send-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            typingMsg.querySelector('.bubble').innerHTML =
                escapeHtml(data.ai_response);
        } else {
            typingMsg.querySelector('.bubble').innerHTML =
                "AI failed. Please try again.";
        }

    } catch (error) {
        typingMsg.querySelector('.bubble').innerHTML =
            "Connection error.";
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});