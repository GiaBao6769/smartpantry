import { API_BASE } from "./main.js";
const urlParams = new URLSearchParams(window.location.search);
const tabId = urlParams.get('id');

if (!tabId) {
    window.location.href = 'handbook.html';
}

// ==================== DOM Elements ====================
const tabNameEl = document.getElementById('tab-name');
const blocksList = document.getElementById('blocks-list');
const showAddBlockBtn = document.getElementById('show-add-block');
const addBlockForm = document.getElementById('add-block-form');
const blockDay = document.getElementById('block-day');
const blockBreakfast = document.getElementById('block-breakfast');
const blockLunch = document.getElementById('block-lunch');
const blockDinner = document.getElementById('block-dinner');
const submitBlock = document.getElementById('submit-block');
const cancelBlock = document.getElementById('cancel-block');
const aiRecommendationBtn = document.getElementById('ai-recommendation-btn');

// ==================== TAB DETAIL ====================
let currentBlocks = [];

async function loadTab() {
    try {
        const response = await fetch(`${API_BASE}/api/tab/${tabId}`, 
            { credentials: "include" });
        if (!response.ok) throw new Error('Failed to load tab');
        const data = await response.json();
        const tab = data.tab;
        tabNameEl.textContent = tab.name;

        const blocksRes = await fetch(`${API_BASE}/api/tab/${tab.id}/blocks`, 
            {
                method: "GET",
                credentials: "include"
            });
        const blocksData = await blocksRes.json();
        const blocks = blocksData.blocks;
        currentBlocks = blocks;
        renderBlocks(blocks);

    } 
    catch (error) {
        console.error('Load tab error:', error);
        document.URL = 'handbook.html';
    }
}
loadTab();

function renderBlocks(blocks) {
    blocksList.innerHTML = '';

    blocks.forEach(block => {
        const card = document.createElement('div');
        card.className = 'block-card';
        card.dataset.blockId = block.id;

    card.innerHTML = `
        <div class="block-day" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="day-name"><span>${escapeHtml(block.day_name)}</span></div>

            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary edit-btn">✏️ Sửa</button>
                <button class="btn btn-secondary delete-btn">🗑 Xóa</button>
            </div>
        </div>

        <div class="meal-item">
            <span class="meal-label">Sáng:</span>
            <div class="ingredient-list">${formatIngredients(block.breakfast)}</div>
        </div>

        <div class="meal-item">
            <span class="meal-label">Trưa:</span>
            <div class="ingredient-list">${formatIngredients(block.lunch)}</div>
        </div>

        <div class="meal-item">
            <span class="meal-label">Tối:</span>
            <div class="ingredient-list">${formatIngredients(block.dinner)}</div>
        </div>
    `;

        blocksList.appendChild(card);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editBlock);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteBlock);
    });
}

async function editBlock(e) {
    const card = e.target.closest('.block-card');
    const blockId = card.dataset.blockId;

    const dayName = card.querySelector('.day-name').textContent;
    const meals = card.querySelectorAll('.ingredient-list');

    function reformatIngredients(mealElement) {
        const items = mealElement.querySelectorAll('span');
        return Array.from(items)
            .map(span => span.textContent.trim())
            .join(', ');
    }

    const breakfast = reformatIngredients(meals[0]);
    const lunch = reformatIngredients(meals[1]);
    const dinner = reformatIngredients(meals[2]);
    card.innerHTML = `
        <div class="form-group">
            <label>Ngày</label>
            <input class="edit-day" value="${dayName}">
        </div>

        <div class="form-group">
            <label>Sáng</label>
            <textarea class="edit-breakfast">${breakfast}</textarea>
        </div>

        <div class="form-group">
            <label>Trưa</label>
            <textarea class="edit-lunch">${lunch}</textarea>
        </div>

        <div class="form-group">
            <label>Tối</label>
            <textarea class="edit-dinner">${dinner}</textarea>
        </div>

        <div style="display:flex; gap:0.5rem;">
            <button class="btn save-btn">💾 Lưu</button>
            <button class="btn btn-secondary cancel-edit-btn">Hủy</button>
        </div>
    `;

    card.querySelector('.save-btn')
        .addEventListener('click', () => saveEdit(card, blockId));

    card.querySelector('.cancel-edit-btn')
        .addEventListener('click', loadTab);
}

async function saveEdit(card, blockId) {
    const day_name = card.querySelector('.edit-day').value.trim();
    const breakfast = card.querySelector('.edit-breakfast').value.trim();
    const lunch = card.querySelector('.edit-lunch').value.trim();
    const dinner = card.querySelector('.edit-dinner').value.trim();

    try {
        const res = await fetch(
            `${API_BASE}/api/edit-block/tab/${tabId}/block/${blockId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    day_name,
                    breakfast,
                    lunch,
                    dinner
                }),
                credentials: "include"
            }
        );

        if (!res.ok) {
            alert("Cập nhật thất bại");
            return;
        }

        loadTab();

    } catch (err) {
        alert("Lỗi kết nối");
    }
}

async function deleteBlock(e) {
    const card = e.target.closest('.block-card');
    const blockId = card.dataset.blockId;

    if (!confirm("Bạn chắc chắn muốn xóa?")) return;

    try {
        const res = await fetch(
            `${API_BASE}/api/delete-block/tab/${tabId}/block/${blockId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        if (!res.ok) {
            alert("Không thể xóa");
            return;
        }

        card.remove();

    } catch (err) {
        alert("Lỗi kết nối");
    }
}




function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



function formatIngredients(mealStr) {
    if (!mealStr) return '';
    const items = mealStr.split(',').map(item => item.trim()).filter(item => item);
    return items.map(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
            return `<span>${escapeHtml(parts[0].trim())}: ${escapeHtml(parts[1].trim())}</span>`;
        } else {
            return `<span>${escapeHtml(item)}</span>`;
        }
    }).join(' ');
}

showAddBlockBtn.addEventListener('click', () => {
    addBlockForm.style.display = 'block';
});
cancelBlock.addEventListener('click', () => {
    addBlockForm.style.display = 'none';
    blockDay.value = '';
    blockBreakfast.value = '';
    blockLunch.value = '';
    blockDinner.value = '';
});

submitBlock.addEventListener('click', async () => {
    const day = blockDay.value.trim();
    if (!day) return alert('Vui lòng nhập tên ngày');
    const breakfast = blockBreakfast.value.trim();
    const lunch = blockLunch.value.trim();
    const dinner = blockDinner.value.trim();

    try {
        const response = await fetch(`${API_BASE}/api/tab/${tabId}/create-block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tab_id: tabId, day_name: day, breakfast, lunch, dinner }),
            credentials: "include"
        });
        if (response.status === 403) {
            alert('Unauthorized');
            return;
        }
        const data = await response.json();
        if (response.ok && data.block_id) {
            addBlockForm.style.display = 'none';
            blockDay.value = '';
            blockBreakfast.value = '';
            blockLunch.value = '';
            blockDinner.value = '';
            loadTab();
        } else {
            alert('Lỗi: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
});

/////////////// AI RECOMMENDATION ///////////////
aiRecommendationBtn.addEventListener('click', async () => {
    if (currentBlocks.length === 0) {
        alert('Vui lòng thêm ít nhất một bữa ăn trước');
        return;
    }

    // Format the content
    let formattedContent = `Tab: ${tabNameEl.textContent}\n\n`;
    currentBlocks.forEach(block => {
        formattedContent += `${block.day_name}:\n`;
        if (block.breakfast) formattedContent += `- Sáng: ${block.breakfast}\n`;
        if (block.lunch) formattedContent += `- Trưa: ${block.lunch}\n`;
        if (block.dinner) formattedContent += `- Chiều: ${block.dinner}\n`;
        formattedContent += '\n';
    });

    formattedContent += `\nHãy đánh giá thực đơn này và đưa ra đề xuất cải thiện nếu cần thiết.`;

    try {
        const createThreadRes = await fetch(`${API_BASE}/api/create-thread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `AI Recommendation - ${tabNameEl.textContent}` }),
            credentials: "include"
        });

        if (createThreadRes.status === 401) {
            alert('Bạn cần đăng nhập trước');
            return;
        }

        const threadData = await createThreadRes.json();
        const threadId = threadData.thread_id;

        if (!threadId) {
            alert('Lỗi tạo thread');
            return;
        }

        // Redirect immediately
        window.location.href = `thread.html?id=${threadId}`;

        // Send chat in background (no await)
        const formData = new FormData();
        formData.append('content', formattedContent);

        fetch(`${API_BASE}/api/thread/${threadId}/send-chat`, {
            method: 'POST',
            body: formData,
            credentials: "include"
        }).catch(err => console.error('Chat send error:', err));
    } 
    catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối server');
    }
});