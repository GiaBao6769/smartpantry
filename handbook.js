import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const tabsGrid = document.getElementById('tabs-grid');
const newTabBtn = document.getElementById('new-tab-btn');
const createTabForm = document.getElementById('create-tab-form');
const newTabName = document.getElementById('new-tab-name');
const submitTab = document.getElementById('submit-tab');
const cancelTab = document.getElementById('cancel-tab');


// ==================== TABS ====================
async function loadTabs() {
    try {
        const response = await fetch(`${API_BASE}/api/tabs`, { credentials: "include" });
        if (!response.ok) throw new Error('Failed to load tabs');
        const data = await response.json();
        const tabs = data.tabs;
        console.log(tabs)
        renderTabs(tabs);
    } catch (error) {
        console.error('Load tabs error:', error);
    }
}

loadTabs()

async function renderTabs(tabs) {
    tabsGrid.innerHTML = '';

    for (const tab of tabs) {

        const card = document.createElement('div');
        card.className = 'tab-card';
        card.dataset.id = tab.id;

        const blocksRes = await fetch(
            `${API_BASE}/api/tab/${tab.id}/blocks`,
            { credentials: "include" }
        );

        const blocksData = await blocksRes.json();
        const blocks = blocksData.blocks || [];

        card.innerHTML = `
            <div class="tab-header">
                <h3>${escapeHtml(tab.name)}</h3>
                <div class="tab-actions">
                    <button class="icon-btn rename-btn" title="Sửa tên">✏️</button>
                    <button class="icon-btn delete-btn" title="Xóa">🗑️</button>
                </div>
            </div>
            <p>${blocks.length} ngày</p>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-btn')) {
                window.location.href = `tab.html?id=${tab.id}`;
            }
        });

        card.querySelector('.rename-btn')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                renameTab(tab.id, tab.name);
            });

        card.querySelector('.delete-btn')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTab(tab.id);
            });

        tabsGrid.appendChild(card);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renameTab(tabId, currentName) {
    const newName = prompt('Nhập tên mới cho tab:', currentName);
    if (!newName || newName.trim() === '') return;
    if (newName === currentName) return;

    fetch(`${API_BASE}/api/edit-tab/${tabId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
        credentials: "include"
    })
    .then(async res => {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Lỗi đổi tên');
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            loadTabs();
        } else {
            alert('Đổi tên thất bại');
        }
    })
    .catch(err => alert(err.message));
}

function deleteTab(tabId) {
    if (!confirm('Bạn có chắc muốn xóa tab này? Toàn bộ dữ liệu bên trong sẽ bị mất.')) return;

    fetch(`${API_BASE}/api/delete-tab/${tabId}`, {
        method: 'DELETE',
        credentials: "include"
    })
    .then(async res => {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Lỗi xóa');
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            loadTabs();
        } else {
            alert('Xóa thất bại');
        }
    })
    .catch(err => alert(err.message));
}

newTabBtn.addEventListener('click', () => {
    createTabForm.style.display = 'block';
});
cancelTab.addEventListener('click', () => {
    createTabForm.style.display = 'none';
    newTabName.value = '';
});


submitTab.addEventListener('click', async () => {
    const name = newTabName.value.trim();
    if (!name) return alert('Vui lòng nhập tên tab');
    try {
        const response = await fetch(`${API_BASE}/api/create-tab`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
            credentials: "include"
        });
        if (response.status === 401) {
            alert('Bạn cần đăng nhập');
            return;
        }
        const data = await response.json();
        if (response.ok && data.success) {
            createTabForm.style.display = 'none';
            newTabName.value = '';
            loadTabs();
        } else {
            alert('Lỗi: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
});