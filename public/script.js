let currentUser = null;
let sessionId = null;

const authBtn = document.getElementById('authBtn');
const authSection = document.getElementById('authSection');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const showSignUp = document.getElementById('showSignUp');
const showSignIn = document.getElementById('showSignIn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const contactForm = document.getElementById('contactForm');

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    setupEventListeners();
});

function setupEventListeners() {
    authBtn.addEventListener('click', handleAuthClick);
    closeModal.addEventListener('click', () => authModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.style.display = 'none';
    });

    showSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
    });

    showSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    contactForm.addEventListener('submit', handleContactSubmit);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function checkUserSession() {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('userData');

    if (storedSessionId && storedUser) {
        sessionId = storedSessionId;
        currentUser = JSON.parse(storedUser);
        updateAuthUI();
    }
}

function handleAuthClick(e) {
    e.preventDefault();
    if (currentUser) {
        logout();
    } else {
        authModal.style.display = 'block';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';

    const formData = new FormData(loginForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            sessionId = result.sessionId;
            currentUser = result.user;

            // Store in localStorage
            localStorage.setItem('sessionId', sessionId);
            localStorage.setItem('userData', JSON.stringify(currentUser));

            showMessage('✅ Login successful! Welcome back!', 'success');
            updateAuthUI();
            authModal.style.display = 'none';
            loginForm.reset();
        } else {
            showMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('❌ Network error. Please try again.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Signing Up...';

    const formData = new FormData(registerForm);
    const data = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('✅ Registration successful! Please sign in.', 'success');
            registerForm.reset();
            // Switch to sign in form
            signUpForm.style.display = 'none';
            signInForm.style.display = 'block';
        } else {
            showMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('❌ Network error. Please try again.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Sign Up';
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '📤 Sending...';

    const formData = new FormData(contactForm);
    const data = {
        fullName: formData.get('fullName'),
        street: formData.get('street'),
        city: formData.get('city'),
        postcode: formData.get('postcode'),
        phoneNo: formData.get('phoneNo'),
        email: formData.get('email'),
        message: formData.get('message')
    };

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('✅ Message sent successfully! We will contact you soon.', 'success');
            contactForm.reset();
        } else {
            showMessage('❌ ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('❌ Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📧 Send Message';
    }
}

function updateAuthUI() {
    if (currentUser) {
        const userInitial = currentUser.fullName.charAt(0).toUpperCase();
        authSection.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar">${userInitial}</div>
                        <div class="user-info">
                            <div class="user-name">${currentUser.fullName}</div>
                            <div class="user-email">${currentUser.email}</div>
                        </div>
                        <button class="logout-btn" onclick="logout()">Logout</button>
                    </div>
                `;

        if (currentUser.email === 'admin@f2computers.com') {
            const adminLink = document.createElement('li');
            adminLink.innerHTML = '<a href="/admin" class="auth-btn">Admin Panel</a>';
            authSection.parentElement.appendChild(adminLink);
        }
    } else {
        authSection.innerHTML = '<a href="#" id="authBtn" class="auth-btn">Sign In</a>';
        document.getElementById('authBtn').addEventListener('click', handleAuthClick);
    }
}

async function logout() {
    try {
        if (sessionId) {
            await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('sessionId');
    localStorage.removeItem('userData');
    currentUser = null;
    sessionId = null;

    updateAuthUI();
    showMessage('👋 Logged out successfully!', 'success');
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

console.log('🚀 F2 Computers website loaded!');
console.log('🔐 Auth system ready');
console.log('📧 Contact form ready');