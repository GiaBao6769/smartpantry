// ==================== CONFIG ====================
export const API_BASE = location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://smartpantry-backend-2.onrender.com";


/////////////// LOAD TEMPLATES ///////////////

let templateRoot = null;

export async function preloadTemplates() {
    if (templateRoot) return templateRoot;

    const res = await fetch("templates.html");
    const html = await res.text();

    const div = document.createElement("div");
    div.innerHTML = html;

    templateRoot = div;
    return templateRoot;
}

export async function getComponent(templateId) {
    const root = await preloadTemplates();
    const template = root.querySelector(`#${templateId}`);

    if (!template) {
        console.error("Template not found:", templateId);
        return;
    }
    return template.content.cloneNode(true);
}

export async function addComponent(templateId, targetSrc) {
    const template = await getComponent(templateId);
    const target = document.querySelector(targetSrc);

    if (!target) {
        console.error("Target not found:", targetSrc);
        return;
    }

    target.appendChild(template);
}

document.addEventListener("DOMContentLoaded", async () => {
    await addComponent("NAVBAR-TEMP", ".navbar");
    await addComponent("LOGIN-MODAL-TEMP", "#login-modal");
    await addComponent("REGISTER-MODAL-TEMP", "#register-modal");

    initAuth();
});


function initAuth() {

// Auth elements
const userGreeting = document.getElementById('user-greeting');
const usernameDisplay = document.getElementById('username-display');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const closeButtons = document.querySelectorAll('.close');

// ==================== AUTH ====================
    async function checkAuth() {
        try {
            const response = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    userGreeting.style.display = 'inline';
                    usernameDisplay.textContent = data.user.username;
                    loginBtn.style.display = 'none';
                    registerBtn.style.display = 'none';
                    logoutBtn.style.display = 'inline-block';
                    return;
                }
            }
            userGreeting.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            registerBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    registerBtn.addEventListener('click', () => registerModal.style.display = 'flex');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const username = formData.get('username');
        const password = formData.get('password');
        registerError.textContent = '';
        try {
            const response = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });
            const data = await response.json();
            if (response.ok && data.success) {
                registerModal.style.display = 'none';
                checkAuth();
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    alert(data.errors.join("\n"));
                } else {
                    alert('Đăng ký thất bại');
                }
            }
        } catch (error) {
            alert('Lỗi kết nối máy chủ');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        loginError.textContent = '';
        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });
            const data = await response.json();
            if (response.ok && data.success) {
                loginModal.style.display = 'none';
                checkAuth();
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    alert(data.errors.join("\n"));
                } else {
                    alert('Sai tên đăng nhập hoặc mật khẩu');
                }
            }
        } catch (error) {
            alert('Lỗi kết nối máy chủ');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: "include" });
        checkAuth();
    });

    checkAuth();
}