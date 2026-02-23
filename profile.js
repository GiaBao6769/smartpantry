import { API_BASE } from "./main.js";

// ==================== DOM Elements ====================
const usernameDisplay = document.getElementById('username-display');
const newUsernameInput = document.getElementById('new-username');
const renamePasswordInput = document.getElementById('rename-password');
const renameBtn = document.getElementById('rename-btn');
const renameMessage = document.getElementById('rename-message');

const oldPasswordInput = document.getElementById('old-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordMessage = document.getElementById('change-password-message');

const deletePasswordInput = document.getElementById('delete-password');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const deleteAccountMessage = document.getElementById('delete-account-message');

//////////////////// LOAD USER INFO ////////////////////
async function loadUserInfo() {
    try {
        const res = await fetch(`${API_BASE}/api/me`, {
            credentials: "include"
        });
        
        if (res.ok) {
            const data = await res.json();
            console.log('User data:', data);
            usernameDisplay.textContent = data.user.username;
        } 
        else {
            window.location.href = 'index.html';
        }
    } 
    catch (error) {
        console.error('Error loading user info:', error);
        window.location.href = 'index.html';
    }
}

loadUserInfo();

//////////////////// RENAME USERNAME ////////////////////
renameBtn.addEventListener('click', async () => {
    document.getElementById('rename-error').textContent = '';
    document.getElementById('rename-password-error').textContent = '';
    renameMessage.textContent = '';
    renameMessage.className = '';
    
    const newName = newUsernameInput.value.trim();
    const password = renamePasswordInput.value.trim();
    
    if (!newName) {
        document.getElementById('rename-error').textContent = 'Vui lòng nhập tên đăng nhập mới';
        return;
    }
    
    if (!password) {
        document.getElementById('rename-password-error').textContent = 'Vui lòng nhập mật khẩu để xác nhận';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/rename`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },    
            body: JSON.stringify({ name: newName, password }),
            credentials: "include"
        });
        const data = await res.json();  
        if (res.ok) {
            renameMessage.textContent = '✅ Đổi tên đăng nhập thành công!';
            renameMessage.className = 'success';
            usernameDisplay.textContent = newName;
            newUsernameInput.value = '';
            renamePasswordInput.value = '';
        } else {
            if (data.error === 'Password is incorrect') {
                document.getElementById('rename-password-error').textContent = 'Mật khẩu không chính xác';
            } else {
                renameMessage.textContent = '❌ ' + (data.error || 'Lỗi đổi tên đăng nhập');
                renameMessage.className = 'error';
            }
        }   
    } 
    catch (error) {
        console.error('Error:', error);
        renameMessage.textContent = '❌ Lỗi kết nối server';
        renameMessage.className = 'error';
    }
});

//////////////////// CHANGE PASSWORD ////////////////////
function clearPasswordErrors() {
    document.getElementById('old-password-error').textContent = '';
    document.getElementById('new-password-error').textContent = '';
    document.getElementById('confirm-password-error').textContent = '';
}

changePasswordBtn.addEventListener('click', async () => {
    clearPasswordErrors();
    changePasswordMessage.textContent = '';
    changePasswordMessage.className = '';

    const oldPassword = oldPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (!oldPassword) {
        document.getElementById('old-password-error').textContent = 'Vui lòng nhập mật khẩu hiện tại';
        return;
    }

    if (!newPassword) {
        document.getElementById('new-password-error').textContent = 'Vui lòng nhập mật khẩu mới';
        return;
    }

    if (newPassword.length < 8) {
        document.getElementById('new-password-error').textContent = 'Mật khẩu phải có ít nhất 8 ký tự';
        return;
    }

    if (newPassword.length > 50) {
        document.getElementById('new-password-error').textContent = 'Mật khẩu không được vượt quá 50 ký tự';
        return;
    }

    if (newPassword !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Mật khẩu xác nhận không khớp';
        return;
    }

    if (oldPassword === newPassword) {
        document.getElementById('new-password-error').textContent = 'Mật khẩu mới phải khác mật khẩu cũ';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword }),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            changePasswordMessage.textContent = '✅ Đổi mật khẩu thành công!';
            changePasswordMessage.className = 'success';
            oldPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            if (data.error === 'Old password is incorrect') {
                document.getElementById('old-password-error').textContent = 'Mật khẩu hiện tại không chính xác';
            } else {
                changePasswordMessage.textContent = '❌ ' + (data.error || 'Lỗi đổi mật khẩu');
                changePasswordMessage.className = 'error';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        changePasswordMessage.textContent = '❌ Lỗi kết nối server';
        changePasswordMessage.className = 'error';
    }
});

// ==================== DELETE ACCOUNT ====================
deleteAccountBtn.addEventListener('click', async () => {
    document.getElementById('delete-password-error').textContent = '';
    deleteAccountMessage.textContent = '';
    deleteAccountMessage.className = '';

    const password = deletePasswordInput.value.trim();

    if (!password) {
        document.getElementById('delete-password-error').textContent = 'Vui lòng nhập mật khẩu để xác nhận';
        return;
    }

    // Confirm deletion
    const confirmed = confirm(
        '⚠️ Bạn chắc chắn muốn xóa tài khoản và TẤT CẢ dữ liệu của mình?\n\nHành động này không thể hoàn tác!'
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/delete-account`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            deleteAccountMessage.textContent = '✅ Tài khoản đã được xóa. Đang chuyển hướng...';
            deleteAccountMessage.className = 'success';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            if (data.error === 'Password is incorrect') {
                document.getElementById('delete-password-error').textContent = 'Mật khẩu không chính xác';
            } else {
                deleteAccountMessage.textContent = '❌ ' + (data.error || 'Lỗi xóa tài khoản');
                deleteAccountMessage.className = 'error';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        deleteAccountMessage.textContent = '❌ Lỗi kết nối server';
        deleteAccountMessage.className = 'error';
    }
});
