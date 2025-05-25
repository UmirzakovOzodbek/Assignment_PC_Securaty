let messages = [];
let users = [];
let stats = {};

const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');
const refreshBtn = document.getElementById('refreshBtn');
const statusFilter = document.getElementById('statusFilter');

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadDashboardData();

    setInterval(loadDashboardData, 30000);
});

function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    switchSection(section);
                }
            }
        });
    });

    refreshBtn.addEventListener('click', () => {
        loadDashboardData();
        showNotification('Data refreshed successfully!', 'success');
    });

    statusFilter.addEventListener('change', () => {
        displayMessages();
    });
}

function switchSection(sectionName) {
    // Update navigation
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    contentSections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        messages: 'Contact Messages',
        users: 'Registered Users'
    };
    pageTitle.textContent = titles[sectionName] || 'Admin Panel';

    switch(sectionName) {
        case 'messages':
            loadMessages();
            break;
        case 'users':
            loadUsers();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadMessages(false),
            loadUsers(false)
        ]);

        updateDashboardStats();
        loadRecentMessages();
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        stats = await response.json();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadMessages(showNotification = true) {
    try {
        const response = await fetch('/api/admin/messages');
        messages = await response.json();

        if (showNotification) {
            showNotification('Messages loaded successfully!', 'success');
        }

        displayMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messagesContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>❌ Error loading messages</h3>
                        <p>Please check your connection and try again.</p>
                    </div>
                `;
    }
}

async function loadUsers(showNotification = true) {
    try {
        const response = await fetch('/api/admin/users');
        users = await response.json();

        if (showNotification) {
            showNotification('Users loaded successfully!', 'success');
        }

        displayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>❌ Error loading users</h3>
                        <p>Please check your connection and try again.</p>
                    </div>
                `;
    }
}

function updateDashboardStats() {
    document.getElementById('totalMessages').textContent = stats.totalMessages || messages.length;
    document.getElementById('newMessages').textContent = stats.newMessages || messages.filter(m => m.status === 'new').length;
    document.getElementById('totalUsers').textContent = stats.totalUsers || users.length;
    document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
}

function loadRecentMessages() {
    const recentContainer = document.getElementById('recentMessages');
    const recentMessages = messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentMessages.length === 0) {
        recentContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>📭 No messages yet</h3>
                        <p>Messages from the contact form will appear here.</p>
                    </div>
                `;
        return;
    }

    recentContainer.innerHTML = recentMessages.map(message => `
                <div class="message-card" onclick="viewMessage('${message.id}')">
                    <div class="message-header">
                        <span class="message-sender">${message.fullName}</span>
                        <span class="message-status status-${message.status}">${message.status.toUpperCase()}</span>
                    </div>
                    <div class="message-preview">
                        ${message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message}
                    </div>
                    <div class="message-meta">
                        <span>📧 ${message.email}</span>
                        <span>📅 ${formatDate(message.createdAt)}</span>
                    </div>
                </div>
            `).join('');
}

function displayMessages() {
    const container = document.getElementById('messagesContainer');
    const filterValue = statusFilter.value;

    let filteredMessages = messages;
    if (filterValue !== 'all') {
        filteredMessages = messages.filter(m => m.status === filterValue);
    }

    if (filteredMessages.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <h3>📭 No messages found</h3>
                        <p>No messages match the current filter.</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = filteredMessages.map(message => `
                <div class="message-card" onclick="viewMessage('${message.id}')">
                    <div class="message-header">
                        <span class="message-sender">${message.fullName}</span>
                        <span class="message-status status-${message.status}">${message.status.toUpperCase()}</span>
                    </div>
                    <div class="message-preview">
                        ${message.message.length > 150 ? message.message.substring(0, 150) + '...' : message.message}
                    </div>
                    <div class="message-meta">
                        <span>📧 ${message.email}</span>
                        <span>📞 ${message.phoneNo}</span>
                        <span>📅 ${formatDate(message.createdAt)}</span>
                    </div>
                    <div class="message-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-primary" onclick="viewMessage('${message.id}')">View Full</button>
                        <button class="btn btn-sm btn-secondary" onclick="updateStatus('${message.id}', 'read')">Mark Read</button>
                        <button class="btn btn-sm btn-success" onclick="updateStatus('${message.id}', 'replied')">Mark Replied</button>
                    </div>
                </div>
            `).join('');
}

function displayUsers() {
    const container = document.getElementById('usersContainer');
    const userCount = document.getElementById('userCount');

    if (users.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <h3>👥 No users registered yet</h3>
                        <p>Registered users will appear here.</p>
                    </div>
                `;
        userCount.textContent = '0 users';
        return;
    }

    userCount.textContent = `${users.length} users`;

    container.innerHTML = `
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Registration Date</th>
                            <th>Last Login</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <div style="width: 30px; height: 30px; background: #e91e63; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
                                            ${user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        ${user.fullName}
                                    </div>
                                </td>
                                <td>${user.email}</td>
                                <td>${formatDate(user.createdAt)}</td>
                                <td>${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                                <td>
                                    <span class="user-status status-${user.isOnline ? 'online' : 'offline'}">
                                        ${user.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
}

function viewMessage(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    alert(`
📧 FULL MESSAGE DETAILS

👤 Name: ${message.fullName}
📧 Email: ${message.email}
📞 Phone: ${message.phoneNo}
📍 Address: ${message.street}, ${message.city}, ${message.postcode}
📅 Date: ${formatDate(message.createdAt)}
📊 Status: ${message.status.toUpperCase()}

💬 Message:
${message.message}
            `);
}

async function updateStatus(messageId, status) {
    try {
        const response = await fetch(`/api/admin/messages/${messageId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.status = status;
            }

            showNotification(`Message marked as ${status}!`, 'success');
            displayMessages();
            updateDashboardStats();
            loadRecentMessages();
        } else {
            showNotification('Error updating message status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent =
        `Last updated: ${now.toLocaleTimeString()}`;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 2rem;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 2000;
                animation: slideIn 0.3s ease;
                ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
            `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

console.log('🚀 F2 Computers Admin Panel loaded!');
console.log('📊 Dashboard ready');
console.log('📧 Messages management ready');
console.log('👥 Users management ready');