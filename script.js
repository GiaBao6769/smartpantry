import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const ingredientInput = document.getElementById('ingredient-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');
const goalBtns = document.querySelectorAll('.goal-btn');
const currentGoal = document.getElementById('current-goal');
const scanBtn = document.getElementById('scan-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const clearImageBtn = document.getElementById('clear-image-btn');
const detectedIngredientsP = document.getElementById('detected-ingredients');


// ==================== STATE ====================
// (No state needed)

// ==================== INIT ====================
currentGoal.value = ''; // No default goal



// ==================== CHỌN MỤC TIÊU ====================
goalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        goalBtns.forEach(b => b.classList.remove('active'));
        
        // If clicking an already active button, deselect it
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            currentGoal.value = '';
        } else {
            this.classList.add('active');
            currentGoal.value = this.dataset.goal;
        }
    });
});

// ==================== GỬI YÊU CẦU ====================
async function sendMessage() {
    const ingredients = ingredientInput.value.trim();
    const goal = currentGoal.value;
    const images = Array.from(imageInput.files).slice(0, 3); // limit to 3 images
    
    if (!ingredients && images.length === 0) {
        alert('Vui lòng nhập nguyên liệu hoặc chọn ảnh');
        return;
    }
    
    let userMessage = '';
    if (ingredients) {
        userMessage += `${ingredients}\n Hãy gợi ý món ăn phù hợp.`;
    }
    if (goal) {
        userMessage += (userMessage ? '\n' : '') + `Mục tiêu: ${getGoalName(goal)}`;
    }
    
    try {
        // Create thread
        const res = await fetch(`${API_BASE}/api/create-thread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: ingredients || 'Image analysis' }),
            credentials: "include"
        });
        
        if (res.status === 401) {
            alert('Bạn cần đăng nhập trước');
            return;
        }
        
        const data = await res.json();
        const threadId = data.thread_id;

        if (!threadId) {
            alert('Lỗi tạo thread');
            return;
        }

        // Redirect to thread page immediately
        window.location.href = `thread.html?id=${threadId}`;

        // Send the message in background (with images if present)
        const formData = new FormData();
        formData.append("content", userMessage);
        
        images.forEach(file => {
            formData.append("images", file);
        });
        
        fetch(`${API_BASE}/api/thread/${threadId}/send-chat`, {
            method: 'POST',
            body: formData,
            credentials: "include"
        }).catch(err => console.error('Chat send error:', err));

    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối server');
    }
    // if (currentImageBase64) {
    //     userMessage += `\n[Kèm ảnh]`;
    // }
    // addMessage('user', userMessage, currentImageBase64);

    // const typingId = showTypingIndicator();

    // try {
    //     const response = await fetch(`${API_BASE}/api/recipe`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ 
    //             ingredients, 
    //             goal,
    //             image: currentImageBase64
    //         }),
    //         credentials: "include"
    //     });
    //     if (!response.ok) throw new Error('API error');
    //     const data = await response.json();
    //     removeTypingIndicator(typingId);
    //     displayAssistantResponse(data);

    //     if (currentImageBase64) {
    //         clearImagePreview();
    //     }
    // } catch (error) {
    //     removeTypingIndicator(typingId);
    //     addMessage('assistant', '❌ Lỗi kết nối, vui lòng thử lại.');
    // }
}
sendBtn.addEventListener('click', sendMessage);
ingredientInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

// ==================== SCAN ẢNH ====================
scanBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async function (e) {
    let files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 3) {
        alert('Bạn chỉ có thể tải lên tối đa 3 ảnh.');
        files = files.slice(0, 3);
        const dt = new DataTransfer();
        files.forEach(f => dt.items.add(f));
        imageInput.files = dt.files;
    }

    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64Full = event.target.result;
        imagePreview.src = base64Full;
        imagePreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
});

clearImageBtn.addEventListener('click', clearImagePreview);

function clearImagePreview() {
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '#';
    imageInput.value = '';
    detectedIngredientsP.textContent = '';
}

// ==================== HÀM PHỤ TRỢ ====================
function getGoalName(goal) {
    const map = {
        'weight-loss': 'Giảm cân',
        'muscle-gain': 'Tăng cơ',
        'maintenance': 'Duy trì năng lượng',
        'leftover': 'Nấu ăn từ các nguyên liệu thừa'
    };
    return map[goal] || goal;
}

function selectGoal(goalValue) {
    ingredientInput.value = '';
    currentGoal.value = goalValue;
    goalBtns.forEach(btn => {
        if (btn.dataset.goal === goalValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function addMessage(sender, text, imageBase64 = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = sender === 'user' ? '👤' : '🌿';
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    const textDiv = document.createElement('div');
    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.textContent = text;
    bubble.appendChild(textDiv);
    
    if (imageBase64 && sender === 'user') {
        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${imageBase64}`;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '8px';
        img.style.marginTop = '0.5rem';
        bubble.appendChild(img);
    }
    
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'assistant');
    msgDiv.id = id;
    msgDiv.innerHTML = '<div class="avatar">🌿</div><div class="bubble">⏳ Fit‑Chef đang suy nghĩ...</div>';
    chatContainer.appendChild(msgDiv);
    return id;
}

function removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
}

function displayAssistantResponse(data) {
    const { title, ingredients, instructions, nutrition, videoUrl } = data;
    let html = `<div class="avatar">🌿</div><div class="bubble"><strong>${title || 'Món ăn gợi ý'}</strong>`;
    if (ingredients) html += `<p><span style="font-weight:600;">🧾 Nguyên liệu:</span> ${ingredients}</p>`;
    if (instructions) html += `<p><span style="font-weight:600;">👩‍🍳 Cách làm:</span> ${instructions}</p>`;
    if (nutrition) {
        html += `<div class="nutrition-card">
            <div style="font-weight:600;">📊 Nutrition Tracker</div>
            <div class="nutrition-row">
                <span>🔥 ${nutrition.calories || 0} kcal</span>
                <span>💪 ${nutrition.protein || 0}g protein</span>
                <span>🍚 ${nutrition.carbs || 0}g carbs</span>
                <span>🥑 ${nutrition.fat || 0}g fat</span>
            </div>
            <div>🚶 Đi bộ ${nutrition.walk_minutes || 15} phút để tiêu hao.</div>
        </div>`;
    }
    if (videoUrl) html += `<a href="${videoUrl}" target="_blank" class="video-btn">🎥 Xem video</a>`;
    html += '</div>';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'assistant');
    msgDiv.innerHTML = html;
    chatContainer.appendChild(msgDiv);
}