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
const imageInput = document.getElementById("image-input");
const imageBtn = document.getElementById("image-btn");
const previewContainer = document.getElementById("image-preview-container");


// ==================== THREAD DETAIL ====================
let lastMessageCount = 0;

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
        lastMessageCount = chatsData.chats.length;

        // If only user messages exist, show typing indicator and start polling
        const hasAssistantMessage = chatsData.chats.some(msg => msg.role === 'assistant');
        if (!hasAssistantMessage && chatsData.chats.length > 0) {
            showTypingIndicator();
            startPolling();
        }

    } catch (error) {
        console.error('Load thread error:', error);
    }
}

loadThread();

let pollingInterval = null;

async function pollForNewMessages() {
    try {
        const chatsRes = await fetch(`${API_BASE}/api/thread/${threadId}/chats`, 
            {
                method: "GET",
                credentials: "include"
            });
        const chatsData = await chatsRes.json();

        if (chatsData.chats.length > lastMessageCount) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            renderChats(chatsData.chats);
            lastMessageCount = chatsData.chats.length;
        }
    } catch (error) {
        console.error('Polling error:', error);
    }
}

function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(pollForNewMessages, 1000); // Poll every 1 second
}

function showTypingIndicator() {
    const typingMsg = document.createElement('div');
    typingMsg.classList.add('message', 'assistant');
    typingMsg.id = 'typing-indicator';
    typingMsg.innerHTML = `
        <div class="avatar">🌿</div>
        <div class="bubble">⏳ Analyzing...</div>
    `;
    messagesContainer.appendChild(typingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderChats(messages) {
    messagesContainer.innerHTML = '';

    messages.forEach(msg => {

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', msg.role);

        const bubble = document.createElement("div");
        bubble.classList.add("bubble");

        if (msg.content) {
            const textDiv = document.createElement("div");
            // Use markdown rendering for assistant messages, plain text for user
            if (msg.role === 'assistant') {
                textDiv.innerHTML = renderMarkdown(msg.content);
            } else {
                textDiv.innerHTML = escapeHtml(msg.content);
            }
            bubble.appendChild(textDiv);
        }

        // If backend returns image_path
        if (msg.image_path) {
            try {
                const images = JSON.parse(msg.image_path);

                images.forEach(path => {
                    const img = document.createElement("img");
                    img.src = `${API_BASE}/${path}`;
                    img.style.width = "150px";
                    img.style.borderRadius = "12px";
                    img.style.marginTop = "8px";
                    bubble.appendChild(img);
                });
            } catch (err) {
                console.error("Image parse error", err);
            }
        }

        msgDiv.innerHTML = `
            <div class="avatar">${msg.role === 'user' ? '👤' : '🌿'}</div>
        `;

        msgDiv.appendChild(bubble);
        messagesContainer.appendChild(msgDiv);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderMarkdown(text) {
    // Use marked to render markdown, then sanitize
    const html = marked.parse(text);
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerHTML;
}

imageBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    previewContainer.innerHTML = "";

    let files = Array.from(imageInput.files || []);
    if (files.length === 0) return;

    if (files.length > 3) {
        alert('Bạn chỉ có thể tải lên tối đa 3 ảnh.');
        files = files.slice(0, 3);
        const dt = new DataTransfer();
        files.forEach(f => dt.items.add(f));
        imageInput.files = dt.files;
    }

    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-image");
            previewContainer.appendChild(img);
        };

        reader.readAsDataURL(file);
    });
});


sendBtn.addEventListener('click', async () => {

    const content = messageInput.value.trim();
    const files = Array.from(imageInput.files).slice(0, 3); // limit to 3 images

    if (!content && files.length === 0) return;

    messageInput.value = '';

    // Show user message immediately
    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user');

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    if (content) {
        bubble.innerHTML = escapeHtml(content);
    }

    // Show image previews inside message
    files.forEach(file => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.width = "120px";
        img.style.borderRadius = "12px";
        img.style.marginTop = "8px";
        bubble.appendChild(img);
    });

    userMsg.innerHTML = `<div class="avatar">👤</div>`;
    userMsg.appendChild(bubble);

    messagesContainer.appendChild(userMsg);

    // Clear preview UI
    previewContainer.innerHTML = "";
    imageInput.value = "";

    const typingMsg = document.createElement('div');
    typingMsg.classList.add('message', 'assistant');
    typingMsg.innerHTML = `
        <div class="avatar">🌿</div>
        <div class="bubble">Analyzing...</div>
    `;
    messagesContainer.appendChild(typingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {

        const formData = new FormData();
        formData.append("content", content);

        files.forEach(file => {
            formData.append("images", file);
        });

        const response = await fetch(
            `${API_BASE}/api/thread/${threadId}/send-chat`,
            {
                method: 'POST',
                body: formData,
                credentials: "include"
            }
        );

        const data = await response.json();

        if (response.ok) {
            typingMsg.querySelector('.bubble').innerHTML =
                renderMarkdown(data.ai_response);
        } else {
            typingMsg.querySelector('.bubble').innerHTML =
                "AI error.";
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