import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const threadsGrid = document.getElementById('threads-grid');
const newThreadBtn = document.getElementById('new-thread-btn');
const createThreadForm = document.getElementById('create-thread-form');
const newThreadTitle = document.getElementById('new-thread-title');
const submitThread = document.getElementById('submit-thread');
const cancelThread = document.getElementById('cancel-thread');

// ==================== THREADS ====================
async function loadThreads() {
    try {
        const response = await fetch(`${API_BASE}/api/threads`, 
            { credentials: "include" }
        );

        if (!response.ok) throw new Error('Failed to load threads');
        const data = await response.json();
        const threads = data.threads;
        renderThreads(threads);
    } catch (error) {
        console.error('Load threads error:', error);
    }
}
loadThreads();

function renderThreads(threads) {
    threadsGrid.innerHTML = '';

    threads.forEach(thread => {
        const card = document.createElement('div');
        card.className = 'thread-card';

        card.innerHTML = `
            <h3>
                ${escapeHtml(thread.name)}
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary edit-btn" data-id="${thread.id}">✏️ Sửa</button>
                    <button class="btn btn-secondary delete-btn" data-id="${thread.id}">🗑 Xóa</button>
                </div>
            </h3>
        `;

        // Go to thread page when clicking card
        card.addEventListener('click', () => {
            window.location.href = `thread.html?id=${thread.id}`;
        });

        threadsGrid.appendChild(card);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editThread);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteThread);
    });
}


async function editThread(e) {
    e.stopPropagation(); 
    const threadId = e.target.dataset.id;
    const newName = prompt("Nhập tên mới:");
    if (!newName || !newName.trim()) return;

    try {
        const res = await fetch(`${API_BASE}/api/edit-thread/${threadId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ name: newName.trim() })
        });

        const data = await res.json();

        if (res.ok) {
            loadThreads(); 
        } else {
            alert(data.error || "Lỗi khi sửa thread");
        }

    } catch (err) {
        alert("Lỗi kết nối server");
    }
}

async function deleteThread(e) {
    e.stopPropagation(); 

    const threadId = e.target.dataset.id;

    const confirmDelete = confirm("Bạn có chắc muốn xóa thread này?");
    if (!confirmDelete) return;

    try {
        const res = await fetch(`${API_BASE}/api/delete-thread/${threadId}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {
            loadThreads(); 
        } else {
            alert(data.error || "Lỗi khi xóa thread");
        }

    } catch (err) {
        alert("Lỗi kết nối server");
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

newThreadBtn.addEventListener('click', () => {
    createThreadForm.style.display = 'block';
});
cancelThread.addEventListener('click', () => {
    createThreadForm.style.display = 'none';
    newThreadTitle.value = '';
});
submitThread.addEventListener('click', async () => {
    const name = newThreadTitle.value.trim();
    if (!name) return alert('Vui lòng nhập tiêu đề');
    try {
        const response = await fetch(`${API_BASE}/api/create-thread`, {
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
        if (response.ok && data.thread_id) {
            createThreadForm.style.display = 'none';
            newThreadTitle.value = '';
            loadThreads();
        } else {
            alert('Lỗi: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
});