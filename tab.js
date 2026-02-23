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
const setMainTabBtn = document.getElementById('set-main-tab-btn');

// ==================== TAB DETAIL ====================
let currentBlocks = [];
let mainTabId = null;

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadMainTabStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/main-tab`, { credentials: "include" });
        const data = await res.json();
        mainTabId = data.main_tab_id;
        
        // Show set main tab button if this tab has blocks
        if (currentBlocks.length > 0) {
            setMainTabBtn.style.display = 'inline-block';
            
            if (mainTabId === parseInt(tabId)) {
                setMainTabBtn.textContent = '⭐ Tab chính';
                setMainTabBtn.disabled = false;
            } else {
                setMainTabBtn.textContent = '☆ Đặt làm tab chính';
                setMainTabBtn.disabled = false;
            }
        } else {
            setMainTabBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Load main tab status error:', error);
    }
}

async function setMainTab() {
    try {
        // Toggle: if it's already the main tab, unset it; otherwise, set it
        const newTabId = mainTabId === parseInt(tabId) ? null : parseInt(tabId);
        
        const res = await fetch(`${API_BASE}/api/main-tab/set`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tabId: newTabId }),
            credentials: "include"
        });
        
        if (res.ok) {
            if (newTabId === null) {
                alert('✅ Đã bỏ chọn tab chính!');
            } else {
                alert('✅ Đặt tab chính thành công!');
            }
            loadMainTabStatus();
        } else {
            alert('Lỗi cập nhật tab chính');
        }
    } catch (error) {
        console.error('Set main tab error:', error);
        alert('Lỗi kết nối');
    }
}

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
        loadMainTabStatus();

    } 
    catch (error) {
        console.error('Load tab error:', error);
        document.URL = 'handbook.html';
    }
}
loadTab();

async function renderBlocks(blocks) {
    blocksList.innerHTML = '';
    const todayDate = getTodayDate();
    let todayBlockIndex = -1;

    for (let idx = 0; idx < blocks.length; idx++) {
        const block = blocks[idx];
        const card = document.createElement('div');
        card.className = 'block-card';
        card.dataset.blockId = block.id;

        // Check if this is today's block (matching date pattern or day name)
        const isToday = block.day_name.toLowerCase().includes('hôm nay') || 
                       block.day_name.toLowerCase().includes('today') ||
                       idx === 0; // Simple heuristic: first block might be today
        
        if (isToday) {
            card.classList.add('today-block');
            todayBlockIndex = idx;
        }

        // Load meal tracking data for this block
        let mealTracking = { breakfast_done: 0, lunch_done: 0, dinner_done: 0 };
        if (isToday) {
            try {
                const trackRes = await fetch(`${API_BASE}/api/meal-tracking/${todayDate}`, 
                    { credentials: "include" });
                if (trackRes.ok) {
                    mealTracking = await trackRes.json();
                }
            } catch (error) {
                console.error('Load meal tracking error:', error);
            }
        }

        const breakfastMealClass = mealTracking.breakfast_done ? 'meal-completed' : '';
        const lunchMealClass = mealTracking.lunch_done ? 'meal-completed' : '';
        const dinnerMealClass = mealTracking.dinner_done ? 'meal-completed' : '';

        let mealCheckboxesHTML = '';
        if (isToday && mainTabId === parseInt(tabId)) {
            // Only show checkboxes for today's block of the main tab
            mealCheckboxesHTML = `
                <div class="meal-tracking">
                    <strong>Theo dõi hôm nay:</strong><br>
                    <label style="margin-right: 1rem;">
                        <input type="checkbox" class="meal-checkbox" data-meal="breakfast" ${mealTracking.breakfast_done ? 'checked' : ''}>
                        Sáng ✓
                    </label>
                    <label style="margin-right: 1rem;">
                        <input type="checkbox" class="meal-checkbox" data-meal="lunch" ${mealTracking.lunch_done ? 'checked' : ''}>
                        Trưa ✓
                    </label>
                    <label>
                        <input type="checkbox" class="meal-checkbox" data-meal="dinner" ${mealTracking.dinner_done ? 'checked' : ''}>
                        Tối ✓
                    </label>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="block-day" style="display:flex; justify-content:space-between; align-items:center;">
                <div class="day-name"><span>${escapeHtml(block.day_name)}</span></div>

                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary edit-btn">✏️ Sửa</button>
                    <button class="btn btn-secondary delete-btn">🗑 Xóa</button>
                </div>
            </div>

            <div class="meal-item ${breakfastMealClass}">
                <span class="meal-label">Sáng:</span>
                <div class="ingredient-list">${formatIngredients(block.breakfast)}</div>
            </div>

            <div class="meal-item ${lunchMealClass}">
                <span class="meal-label">Trưa:</span>
                <div class="ingredient-list">${formatIngredients(block.lunch)}</div>
            </div>

            <div class="meal-item ${dinnerMealClass}">
                <span class="meal-label">Tối:</span>
                <div class="ingredient-list">${formatIngredients(block.dinner)}</div>
            </div>

            ${mealCheckboxesHTML}
        `;

        blocksList.appendChild(card);
    }

    // Add event listeners for meal checkboxes
    document.querySelectorAll('.meal-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', saveMealTracking);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editBlock);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteBlock);
    });
}

async function saveMealTracking(e) {
    const todayDate = getTodayDate();
    const mealCheckboxes = document.querySelectorAll('.meal-checkbox');
    
    const breakfastDone = document.querySelector('[data-meal="breakfast"]')?.checked ? 1 : 0;
    const lunchDone = document.querySelector('[data-meal="lunch"]')?.checked ? 1 : 0;
    const dinnerDone = document.querySelector('[data-meal="dinner"]')?.checked ? 1 : 0;

    try {
        const res = await fetch(`${API_BASE}/api/meal-tracking/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: todayDate,
                breakfast_done: breakfastDone,
                lunch_done: lunchDone,
                dinner_done: dinnerDone
            }),
            credentials: "include"
        });

        if (res.ok) {
            // Update visual state
            const breakfastItem = document.querySelector('.meal-item:has([data-meal="breakfast"])');
            const lunchItem = document.querySelector('.meal-item:has([data-meal="lunch"])');
            const dinnerItem = document.querySelector('.meal-item:has([data-meal="dinner"])');

            if (breakfastDone) breakfastItem?.classList.add('meal-completed');
            else breakfastItem?.classList.remove('meal-completed');

            if (lunchDone) lunchItem?.classList.add('meal-completed');
            else lunchItem?.classList.remove('meal-completed');

            if (dinnerDone) dinnerItem?.classList.add('meal-completed');
            else dinnerItem?.classList.remove('meal-completed');
        }
    } catch (error) {
        console.error('Save meal tracking error:', error);
    }
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

// Set main tab button
setMainTabBtn.addEventListener('click', setMainTab);

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