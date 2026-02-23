import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const tabsGrid = document.getElementById('tabs-grid');
const heatmapSection = document.getElementById('heatmap-section');
const heatmapGrid = document.getElementById('heatmap-grid');
const newTabBtn = document.getElementById('new-tab-btn');
const createTabForm = document.getElementById('create-tab-form');
const newTabName = document.getElementById('new-tab-name');
const submitTab = document.getElementById('submit-tab');
const cancelTab = document.getElementById('cancel-tab');

// ==================== STATE ====================
let mainTabId = null;

// ==================== HEATMAP ====================
function generateDateRange() {
    const dates = [];
    const start = new Date(2026, 0, 1); // Jan 1, 2026
    const end = new Date(2026, 11, 31); // Dec 31, 2026
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    
    return dates;
}

async function loadAndDisplayHeatmap() {
    try {
        const res = await fetch(`${API_BASE}/api/meal-tracking/heatmap`, { 
            credentials: "include" 
        });
        if (!res.ok) throw new Error('Failed to load heatmap');
        
        const data = await res.json();
        const heatmap = data.heatmap;
        
        // Generate all dates in 2026
        const dates = generateDateRange();
        
        // Render heatmap cells
        heatmapGrid.innerHTML = '';
        dates.forEach(date => {
            const value = heatmap[date] || 0; // 0-3 meals completed
            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${Math.min(value, 3)}`;
            cell.title = `${date}: ${value}/3 bữa`;
            cell.textContent = value > 0 ? value : '';
            heatmapGrid.appendChild(cell);
        });
        
        // Show heatmap section if there's any data
        const hasData = Object.values(heatmap).some(v => v > 0);
        heatmapSection.style.display = hasData ? 'block' : 'none';
        
    } catch (error) {
        console.error('Load heatmap error:', error);
        heatmapSection.style.display = 'none';
    }
}

async function loadMainTabId() {
    try {
        const res = await fetch(`${API_BASE}/api/main-tab`, { 
            credentials: "include" 
        });
        if (res.ok) {
            const data = await res.json();
            mainTabId = data.main_tab_id;
        }
    } catch (error) {
        console.error('Load main tab error:', error);
    }
}

// ==================== TABS ====================
async function loadTabs() {
    try {
        await loadMainTabId();
        
        const response = await fetch(`${API_BASE}/api/tabs`, { credentials: "include" });
        if (!response.ok) throw new Error('Failed to load tabs');
        const data = await response.json();
        const tabs = data.tabs;
        
        // Load heatmap
        await loadAndDisplayHeatmap();
        
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
        
        // Add main-tab class if this is the main tab
        if (mainTabId === tab.id) {
            card.classList.add('main-tab');
        }

        const blocksRes = await fetch(
            `${API_BASE}/api/tab/${tab.id}/blocks`,
            { credentials: "include" }
        );

        const blocksData = await blocksRes.json();
        const blocks = blocksData.blocks || [];

        let mainBadge = '';
        if (mainTabId === tab.id) {
            mainBadge = '<span class="main-badge">⭐ Tab chính</span>';
        }

        card.innerHTML = `
            <h3>${escapeHtml(tab.name)}</h3>
            <div class="tab-actions">
                <button class="icon-btn star-btn" title="${mainTabId === tab.id ? 'Bỏ chọn tab chính' : 'Đặt làm tab chính'}">${mainTabId === tab.id ? '⭐' : '☆'}</button>
                <button class="icon-btn rename-btn" title="Sửa tên">✏️</button>
                <button class="icon-btn delete-btn" title="Xóa">🗑️</button>
            </div>
            ${mainBadge}
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-btn')) {
                window.location.href = `tab.html?id=${tab.id}`;
            }
        });

        card.querySelector('.star-btn')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                setMainTab(tab.id);
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

async function setMainTab(tabId) {
    try {
        // Toggle: if it's already the main tab, unset it; otherwise, set it
        const newTabId = mainTabId === tabId ? null : tabId;
        
        const res = await fetch(`${API_BASE}/api/main-tab/set`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tabId: newTabId }),
            credentials: "include"
        });
        
        if (res.ok) {
            mainTabId = newTabId;
            loadTabs();
        } else {
            alert('Lỗi đặt tab chính');
        }
    } catch (error) {
        console.error('Set main tab error:', error);
        alert('Lỗi kết nối');
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