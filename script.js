import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const ingredientInput = document.getElementById('ingredient-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');
const goalBtns = document.querySelectorAll('.goal-btn');
const currentGoal = document.getElementById('current-goal');
const leftoverChip = document.querySelector('.chip');
const scanBtn = document.getElementById('scan-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const clearImageBtn = document.getElementById('clear-image-btn');
const detectedIngredientsP = document.getElementById('detected-ingredients');


// ==================== STATE ====================
let currentImageBase64 = null;

// ==================== INIT ====================
document.querySelector('[data-goal="weight-loss"]').classList.add('active');
currentGoal.value = 'weight-loss';



// ==================== CHỌN MỤC TIÊU ====================
goalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        goalBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentGoal.value = this.dataset.goal;
    });
});

// ==================== GỬI YÊU CẦU ====================
async function sendMessage() {
    const ingredients = ingredientInput.value.trim();
    const goal = currentGoal.value;
    
    let userMessage = `Tôi có: ${ingredients || "không có nguyên liệu"}\nMục tiêu: ${getGoalName(goal)}`;
    if (currentImageBase64) {
        userMessage += `\n[Kèm ảnh]`;
    }
    addMessage('user', userMessage, currentImageBase64);

    const typingId = showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/api/recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ingredients, 
                goal,
                image: currentImageBase64
            }),
            credentials: "include"
        });
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        removeTypingIndicator(typingId);
        displayAssistantResponse(data);

        if (currentImageBase64) {
            clearImagePreview();
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('assistant', '❌ Lỗi kết nối, vui lòng thử lại.');
    }
}
sendBtn.addEventListener('click', sendMessage);
ingredientInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

// ==================== SCAN ẢNH ====================
scanBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64Full = event.target.result;
        const base64Data = base64Full.split(',')[1];
        currentImageBase64 = base64Data;

        imagePreview.src = base64Full;
        imagePreviewContainer.style.display = 'flex';
        detectedIngredientsP.textContent = '⏳ Đang nhận diện...';

        try {
            const response = await fetch(`${API_BASE}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data }),
                credentials: "include"
            });
            const data = await response.json();
            if (data.ingredients) {
                detectedIngredientsP.textContent = `🍎 Phát hiện: ${data.ingredients}`;
                ingredientInput.value = data.ingredients;
            } else {
                detectedIngredientsP.textContent = '❌ Không nhận diện được';
            }
        } catch (err) {
            detectedIngredientsP.textContent = '❌ Lỗi kết nối';
        }
    };
    reader.readAsDataURL(file);
});

clearImageBtn.addEventListener('click', clearImagePreview);

function clearImagePreview() {
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '#';
    imageInput.value = '';
    detectedIngredientsP.textContent = '';
    currentImageBase64 = null;
}

// ==================== CHIP GỢI Ý ====================
leftoverChip.addEventListener('click', () => {
    ingredientInput.value = 'trứng, cà chua, hành tây, cơm nguội';
    sendMessage();
});

// ==================== HÀM PHỤ TRỢ ====================
function getGoalName(goal) {
    const map = {
        'weight-loss': 'Giảm cân (Low Carb)',
        'muscle-gain': 'Tăng cơ (High Protein)',
        'maintenance': 'Duy trì năng lượng',
        'vitamin-c': 'Bổ sung vitamin C'
    };
    return map[goal] || goal;
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