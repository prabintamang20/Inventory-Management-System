// ===== Global State =====
let inventory = [];
let editingId = null;
let deleteItemId = null;
let currentUser = null;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication();
    const pictureInput = document.getElementById('profilePicture');
    if (pictureInput) {
        pictureInput.addEventListener('change', previewSelectedProfilePicture);
    }
});

// ===== Authentication Functions =====
function checkUserAuthentication() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showMainApp();
    } else {
        showAuthPage();
    }
}

function toggleAuthForms(e) {
    e.preventDefault();
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginForm.classList.toggle('active-form');
    signupForm.classList.toggle('active-form');
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showAuthNotification('Please fill in all fields', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            name: user.name,
            email: user.email,
            position: user.position || '',
            profilePicture: user.profilePicture || ''
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        showAuthNotification('Login successful!', 'success');
        setTimeout(() => showMainApp(), 1000);
    } else {
        showAuthNotification('Invalid email or password', 'error');
    }
}

function showAuthSection(sectionId, event) {
    if (event) event.preventDefault();

    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => form.classList.remove('active-form'));

    const targetForm = document.getElementById(sectionId);
    if (targetForm) {
        targetForm.classList.add('active-form');
    }

    if (sectionId === 'forgotForm') {
        const loginEmail = document.getElementById('loginEmail').value.trim();
        const resetEmail = document.getElementById('resetEmail');
        if (resetEmail) {
            resetEmail.value = loginEmail;
        }
    }
}

function handleForgotPasswordSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetConfirm').value;

    if (!email || !newPassword || !confirmPassword) {
        showAuthNotification('Please fill in all fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAuthNotification('Password must be at least 6 characters.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAuthNotification('Passwords do not match.', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
        showAuthNotification('No account found with that email.', 'error');
        return;
    }

    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('loginEmail').value = email;
    showAuthNotification('Password reset successful! Please login.', 'success');
    setTimeout(() => showAuthSection('loginForm'), 1200);
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const position = document.getElementById('signupPosition').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showAuthNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        showAuthNotification('Email already registered', 'error');
        return;
    }
    
    users.push({ name, email, position, password, profilePicture: '' });
    localStorage.setItem('users', JSON.stringify(users));
    
    showAuthNotification('Account created! Please login.', 'success');
    setTimeout(() => {
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPosition').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupConfirm').value = '';
        toggleAuthForms({preventDefault: () => {}});
    }, 1500);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        inventory = [];
        showAuthPage();
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    }
}

function openProfileModal() {
    if (!currentUser) return;
    document.getElementById('profileModal').style.display = 'block';
    showProfileTab('profileTab');
    populateProfileModal();
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function showProfileTab(tabId, event) {
    if (event) event.preventDefault();
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.profile-tab-content');

    tabs.forEach(tab => tab.classList.remove('active-tab'));
    contents.forEach(content => content.classList.remove('active-tab-content'));

    const activeTab = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active-tab');

    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active-tab-content');

    if (tabId === 'settingsTab') {
        loadProfileSettings();
    }
}

function populateProfileModal() {
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePosition').value = currentUser.position || '';
    const avatar = document.getElementById('profileAvatarPreview');
    if (avatar) {
        if (currentUser.profilePicture) {
            avatar.src = currentUser.profilePicture;
        } else {
            avatar.src = '';
            avatar.style.backgroundColor = '#f3f5ff';
        }
    }
    const profileFileInput = document.getElementById('profilePicture');
    if (profileFileInput) {
        profileFileInput.value = '';
    }
    loadProfileSettings();
}

function saveProfileChanges(event) {
    event.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const position = document.getElementById('profilePosition').value.trim();
    const pictureInput = document.getElementById('profilePicture');

    if (!name) {
        showAuthNotification('Please enter a name.', 'error');
        return;
    }

    const saveProfile = () => {
        currentUser.name = name;
        currentUser.position = position;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].name = name;
            users[userIndex].position = position;
            users[userIndex].profilePicture = currentUser.profilePicture || '';
            localStorage.setItem('users', JSON.stringify(users));
        }
        updateUserInfoDisplay();
        showAuthNotification('Profile updated successfully!', 'success');
    };

    if (pictureInput && pictureInput.files && pictureInput.files[0]) {
        const file = pictureInput.files[0];
        readFileAsDataURL(file).then(dataUrl => {
            currentUser.profilePicture = dataUrl;
            const avatar = document.getElementById('profileAvatarPreview');
            if (avatar) {
                avatar.src = dataUrl;
                avatar.style.backgroundColor = 'transparent';
            }
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar) {
                headerAvatar.src = dataUrl;
                headerAvatar.style.display = 'inline-block';
            }
            saveProfile();
        }).catch(() => {
            showAuthNotification('Unable to upload profile picture.', 'error');
        });
    } else {
        saveProfile();
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].position = position;
        localStorage.setItem('users', JSON.stringify(users));
    }

    updateUserInfoDisplay();
    showAuthNotification('Profile updated successfully!', 'success');
}

function changePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showAuthNotification('Please fill in all fields.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAuthNotification('New password must be at least 6 characters.', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showAuthNotification('Passwords do not match.', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === currentUser.email);
    if (!user || user.password !== currentPassword) {
        showAuthNotification('Current password is incorrect.', 'error');
        return;
    }

    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    showAuthNotification('Password changed successfully!', 'success');
}

function saveProfileSettings(event) {
    event.preventDefault();
    const darkMode = document.getElementById('settingDarkMode').checked;
    const rememberMe = document.getElementById('settingRememberMe').checked;
    const lowStockAlerts = document.getElementById('settingLowStockAlerts').checked;

    if (darkMode !== document.body.classList.contains('dark-mode')) {
        toggleDarkMode();
    }

    if (rememberMe) {
        localStorage.setItem('rememberedEmail', currentUser.email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    localStorage.setItem(`settings_${currentUser.email}`, JSON.stringify({
        rememberMe,
        lowStockAlerts
    }));

    showAuthNotification('Settings saved successfully!', 'success');
}

function loadProfileSettings() {
    const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.email}`) || '{}');
    document.getElementById('settingDarkMode').checked = document.body.classList.contains('dark-mode');
    document.getElementById('settingRememberMe').checked = !!localStorage.getItem('rememberedEmail');
    document.getElementById('settingLowStockAlerts').checked = !!settings.lowStockAlerts;
}

function updateUserInfoDisplay() {
    const userEmail = currentUser.email.split('@')[0];
    const userPosition = currentUser.position ? ` - ${currentUser.position}` : '';
    document.getElementById('userInfo').textContent = `👤 ${currentUser.name}${userPosition} (${userEmail})`;
    updateHeaderAvatar();
}

function updateHeaderAvatar() {
    const avatar = document.getElementById('headerAvatar');
    if (!avatar) return;
    if (currentUser.profilePicture) {
        avatar.src = currentUser.profilePicture;
        avatar.style.display = 'inline-block';
    } else {
        avatar.style.display = 'none';
    }
}

function previewSelectedProfilePicture() {
    const pictureInput = document.getElementById('profilePicture');
    const avatar = document.getElementById('profileAvatarPreview');
    if (!pictureInput || !avatar || !pictureInput.files || !pictureInput.files[0]) return;
    readFileAsDataURL(pictureInput.files[0]).then(dataUrl => {
        avatar.src = dataUrl;
        avatar.style.backgroundColor = 'transparent';
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showAuthPage() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    populateRememberMe();
    showAuthSection('loginForm');
}

function populateRememberMe() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const loginEmailInput = document.getElementById('loginEmail');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    if (loginEmailInput) {
        loginEmailInput.value = rememberedEmail || '';
    }
    if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = !!rememberedEmail;
    }
}

function showMainApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    
    // Update user info in header
    const userEmail = currentUser.email.split('@')[0];
    const userPosition = currentUser.position ? ` - ${currentUser.position}` : '';
    document.getElementById('userInfo').textContent = `👤 ${currentUser.name}${userPosition} (${userEmail})`;
    updateHeaderAvatar();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Load inventory data for this user
    loadFromLocalStorage();
    setupEventListeners();
    renderTable();
    updateStatistics();
}

function showAuthNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideAuthNotif 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutNotif 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Initialization Functions =====
function initializeApp() {
    loadFromLocalStorage();
    setupEventListeners();
    renderTable();
    updateStatistics();
    initializeDarkMode();
}

// ===== Notification Functions =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function clearAllInventory() {
    if (confirm('Are you sure you want to clear all inventory data? This action cannot be undone.')) {
        inventory = [];
        saveToLocalStorage();
        renderTable();
        updateStatistics();
        showNotification('All inventory data cleared!', 'success');
    }
}

// ===== Dark Mode Functions =====
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeButton();
}

function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
    }
    updateThemeButton();
}

function updateThemeButton() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const themeToggle = document.getElementById('themeToggle');
    const themeStatus = document.getElementById('themeStatus');
    
    if (themeToggle) {
        themeToggle.textContent = isDarkMode ? '☀️ Light' : '🌙 Dark';
    }
    if (themeStatus) {
        themeStatus.textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleFilter);
    document.getElementById('sortSelect').addEventListener('change', handleSort);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const itemModal = document.getElementById('itemModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (event.target === itemModal) {
            closeAddModal();
        }
        if (event.target === deleteModal) {
            cancelDelete();
        }
    });
}

// ===== Modal Functions =====
function openAddModal() {
    editingId = null;
    document.getElementById('itemForm').reset();
    document.getElementById('modalTitle').textContent = 'Add New Item';
    document.getElementById('itemModal').style.display = 'block';
    document.getElementById('itemName').focus();
}

function closeAddModal() {
    document.getElementById('itemModal').style.display = 'none';
    editingId = null;
}

function openEditModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Item';
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemSKU').value = item.sku;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemMinStock').value = item.minStock;
    document.getElementById('itemDescription').value = item.description;
    
    document.getElementById('itemModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteItemId = null;
}

function cancelDelete() {
    closeDeleteModal();
}

// ===== Form Submission =====
function saveItem(event) {
    event.preventDefault();

    const itemData = {
        name: document.getElementById('itemName').value.trim(),
        sku: document.getElementById('itemSKU').value.trim().toUpperCase(),
        category: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        price: parseFloat(document.getElementById('itemPrice').value),
        minStock: parseInt(document.getElementById('itemMinStock').value),
        description: document.getElementById('itemDescription').value.trim()
    };

    // Validation
    if (!itemData.name || !itemData.sku || !itemData.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (itemData.quantity < 0 || itemData.price < 0) {
        showNotification('Quantity and Price cannot be negative', 'error');
        return;
    }

    // Check for duplicate SKU (excluding current item if editing)
    const skuExists = inventory.some(item => 
        item.sku === itemData.sku && item.id !== editingId
    );

    if (skuExists) {
        showNotification('SKU already exists. Please use a unique SKU.', 'error');
        return;
    }

    if (editingId) {
        // Update existing item
        const itemIndex = inventory.findIndex(i => i.id === editingId);
        if (itemIndex !== -1) {
            inventory[itemIndex] = {
                ...inventory[itemIndex],
                ...itemData,
                updatedAt: new Date().toISOString()
            };
        }
        showNotification('Item updated successfully!', 'success');
    } else {
        // Add new item
        const newItem = {
            id: generateId(),
            ...itemData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        inventory.push(newItem);
        showNotification('Item added successfully!', 'success');
    }

    saveToLocalStorage();
    renderTable();
    updateStatistics();
    closeAddModal();
}

// ===== Delete Functions =====
function openDeleteModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    deleteItemId = id;
    document.getElementById('deleteItemName').textContent = item.name;
    document.getElementById('deleteModal').style.display = 'block';
}

function handleEditButtonClick(event, id) {
    event.stopPropagation();
    openEditModal(id);
}

function handleDeleteButtonClick(event, id) {
    event.stopPropagation();
    openDeleteModal(id);
}

function confirmDelete() {
    if (deleteItemId) {
        inventory = inventory.filter(item => item.id !== deleteItemId);
        saveToLocalStorage();
        renderTable();
        updateStatistics();
        closeDeleteModal();
        showNotification('Item deleted successfully!', 'success');
    }
}

// ===== Search and Filter =====
function handleSearch() {
    renderTable();
}

function handleFilter() {
    renderTable();
}

function handleSort() {
    renderTable();
}

function getFilteredAndSortedItems() {
    let filtered = [...inventory];

    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    const categoryFilter = document.getElementById('categoryFilter').value;
    if (categoryFilter) {
        filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply sorting
    const sortBy = document.getElementById('sortSelect').value;
    switch(sortBy) {
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'quantity':
            filtered.sort((a, b) => b.quantity - a.quantity);
            break;
        case 'price':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'date':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    return filtered;
}

// ===== Table Rendering =====
function renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const items = getFilteredAndSortedItems();

    if (items.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="8">No items found. Try adjusting your search or filters.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr onclick="openEditModal('${item.id}')" class="inventory-row">
            <td><strong>${escapeHtml(item.name)}</strong></td>
            <td><code>${escapeHtml(item.sku)}</code></td>
            <td><span class="category-badge">${formatCategory(item.category)}</span></td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
            <td>${getStatusBadge(item)}</td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn btn-edit" onclick="handleEditButtonClick(event, '${item.id}')" title="Edit">✎ Edit</button>
                    <button type="button" class="btn btn-delete" onclick="handleDeleteButtonClick(event, '${item.id}')" title="Delete">🗑 Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(item) {
    if (item.quantity === 0) {
        return '<span class="status-badge status-out-of-stock">Out of Stock</span>';
    } else if (item.quantity <= item.minStock) {
        return '<span class="status-badge status-low-stock">Low Stock</span>';
    } else {
        return '<span class="status-badge status-in-stock">In Stock</span>';
    }
}

// ===== Statistics =====
function updateStatistics() {
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    const inStockItems = totalItems - lowStockItems - outOfStockItems;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Update main statistics
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity.toLocaleString();
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('totalValue').textContent = '$' + totalValue.toFixed(2);

    // Update progress overview
    updateProgressOverview(inStockItems, lowStockItems, outOfStockItems, totalItems);
}

function updateProgressOverview(inStock, lowStock, outStock, total) {
    // Stock Status Progress
    const stockPercentage = total > 0 ? Math.round((inStock / total) * 100) : 0;
    const stockLabel = document.getElementById('stockStatusLabel');
    const stockFill = document.getElementById('stockStatusFill');
    
    if (stockLabel) stockLabel.textContent = stockPercentage + '%';
    if (stockFill) stockFill.style.width = stockPercentage + '%';

    // Category Distribution
    updateCategoryDistribution();

    // Inventory Health
    const healthPercent = total > 0 ? Math.round((inStock / total) * 100) : 0;
    const healthLabel = document.getElementById('healthPercent');
    const healthRing = document.getElementById('healthRing');
    
    if (healthLabel) healthLabel.textContent = healthPercent + '%';
    
    // Update health ring gradient based on percentage
    if (healthRing) {
        const inStockDeg = (inStock / total) * 360;
        const lowStockDeg = (lowStock / total) * 360;
        healthRing.style.background = `conic-gradient(
            #10b981 0deg, #10b981 ${inStockDeg}deg,
            #fbbf24 ${inStockDeg}deg, #fbbf24 ${inStockDeg + lowStockDeg}deg,
            #ef4444 ${inStockDeg + lowStockDeg}deg
        )`;
    }

    // Update health status
    let statusLabel = 'Excellent';
    if (healthPercent < 50) statusLabel = 'Critical';
    else if (healthPercent < 70) statusLabel = 'Warning';
    else if (healthPercent < 85) statusLabel = 'Good';
    
    const healthStatusLabel = document.getElementById('healthLabel');
    if (healthStatusLabel) healthStatusLabel.textContent = statusLabel;

    // Update health breakdown
    document.getElementById('healthInStock').textContent = inStock;
    document.getElementById('healthLow').textContent = lowStock;
    document.getElementById('healthOut').textContent = outStock;
}

function updateCategoryDistribution() {
    const categories = {};
    const maxItems = Math.max(...inventory.map(item => 
        inventory.filter(i => i.category === item.category).length
    ), 1);

    inventory.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });

    const categoryNames = ['electronics', 'furniture', 'other'];
    
    categoryNames.forEach(cat => {
        const count = categories[cat] || 0;
        const percentage = maxItems > 0 ? (count / maxItems) * 100 : 0;
        
        const fill = document.getElementById(`cat-${cat}`);
        const countElem = document.getElementById(`cat-${cat}-count`);
        
        if (fill) fill.style.width = percentage + '%';
        if (countElem) countElem.textContent = count;
    });
}

// ===== Local Storage =====
function saveToLocalStorage() {
    if (currentUser) {
        const key = `inventory_${currentUser.email}`;
        localStorage.setItem(key, JSON.stringify(inventory));
    }
}

function loadFromLocalStorage() {
    if (currentUser) {
        const key = `inventory_${currentUser.email}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                inventory = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading inventory data:', e);
                inventory = [];
            }
        }
    }
}

// ===== Utility Functions =====
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function formatCategory(category) {
    const categories = {
        'electronics': '📱 Electronics',
        'furniture': '🪑 Furniture',
        'clothing': '👕 Clothing',
        'food': '🍔 Food & Beverages',
        'books': '📚 Books',
        'other': '📦 Other'
    };
    return categories[category] || category;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== CSS for Notifications =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes slideAuthNotif {
        from {
            transform: translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOutNotif {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100px);
            opacity: 0;
        }
    }

    .category-badge {
        display: inline-block;
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: 500;
    }

    @media (max-width: 768px) {
        .notification {
            right: 10px !important;
            left: 10px !important;
        }
    }
`;
document.head.appendChild(style);

// ===== Sample Data (Optional - Remove if not needed) =====
function loadSampleData() {
    inventory = [
        {
            id: generateId(),
            name: 'Laptop Computer',
            sku: 'LAPTOP-001',
            category: 'electronics',
            quantity: 15,
            price: 899.99,
            minStock: 5,
            description: 'High-performance laptop for business',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Office Chair',
            sku: 'CHAIR-001',
            category: 'furniture',
            quantity: 8,
            price: 249.99,
            minStock: 3,
            description: 'Ergonomic office chair with lumbar support',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Coffee Maker',
            sku: 'COFFEE-001',
            category: 'food',
            quantity: 2,
            price: 79.99,
            minStock: 5,
            description: 'Programmable coffee maker - 12 cup capacity',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Wireless Keyboard',
            sku: 'KEYBOARD-001',
            category: 'electronics',
            quantity: 22,
            price: 49.99,
            minStock: 10,
            description: 'Wireless mechanical keyboard with RGB lighting',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'JavaScript Book',
            sku: 'BOOK-JS-001',
            category: 'books',
            quantity: 0,
            price: 39.99,
            minStock: 5,
            description: 'The Complete JavaScript Guide - 2024 Edition',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    saveToLocalStorage();
    renderTable();
    updateStatistics();
    showNotification('Sample data loaded successfully!', 'success');
}

// Uncomment the line below to load sample data on first visit
// if (inventory.length === 0) loadSampleData();
