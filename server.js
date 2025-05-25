import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let users = [
    {
        id: uuidv4(),
        fullName: 'Test User',
        email: 'test@example.com',
        password: '123456',
        createdAt: new Date(),
        lastLogin: null
    },
    {
        id: uuidv4(),
        fullName: 'Admin User',
        email: 'admin@f2computers.com',
        password: 'admin123',
        createdAt: new Date(),
        lastLogin: null
    }
];

let messages = [];
let sessions = {};

messages.push({
    id: uuidv4(),
    fullName: 'Mamanazarov Akbar',
    street: '123 Main Street',
    city: 'Tashkent',
    postcode: '100000',
    phoneNo: '+998901234567',
    email: 'john@example.com',
    message: "Salom! Mening laptopim ishlamayapti. Screen qora bo'lib qolgan. Yordam bera olasizmi?",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 soat oldin
    status: 'new'
});

app.get('/', (req, res) => {
    console.log('📄 Serving index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    console.log('📄 Serving admin.html');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/test', (req, res) => {
    console.log('🧪 Test endpoint called');
    res.json({
        message: 'Server ishlayapti!',
        port: PORT,
        timestamp: new Date(),
        stats: {
            users: users.length,
            messages: messages.length,
            sessions: Object.keys(sessions).length
        }
    });
});

app.post('/api/register', (req, res) => {
    console.log('📝 Register attempt:', req.body);

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
    }

    const newUser = {
        id: uuidv4(),
        fullName,
        email,
        password, // Production da hash qilish kerak
        createdAt: new Date(),
        lastLogin: null
    };

    users.push(newUser);

    console.log('✅ New user registered:', newUser.fullName);

    res.json({
        message: 'User registered successfully!',
        userId: newUser.id,
        user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email
        }
    });
});

app.post('/api/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body);

    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        user.lastLogin = new Date();

        const sessionId = uuidv4();
        sessions[sessionId] = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            loginTime: new Date()
        };

        console.log('✅ Login successful:', user.fullName);

        res.json({
            message: 'Login successful',
            sessionId,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } else {
        console.log('❌ Login failed for:', email);
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

app.post('/api/logout', (req, res) => {
    const { sessionId } = req.body;

    if (sessions[sessionId]) {
        console.log('👋 User logged out:', sessions[sessionId].fullName);
        delete sessions[sessionId];
    }

    res.json({ message: 'Logged out successfully' });
});

app.post('/api/contact', (req, res) => {
    console.log('📧 Contact endpoint called!');
    console.log('Request body:', req.body);

    const { fullName, street, city, postcode, phoneNo, email, message } = req.body;

    if (!fullName || !email || !message) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
            error: 'Missing required fields: fullName, email, message'
        });
    }

    const contactMessage = {
        id: uuidv4(),
        fullName,
        street: street || '',
        city: city || '',
        postcode: postcode || '',
        phoneNo: phoneNo || '',
        email,
        message,
        createdAt: new Date(),
        status: 'new'
    };

    messages.unshift(contactMessage);

    console.log('✅ Message saved successfully!');
    console.log('📊 Total messages:', messages.length);
    console.log('👤 From:', fullName);

    res.json({
        success: true,
        message: 'Message sent successfully! We will contact you soon.',
        messageId: contactMessage.id
    });
});

app.get('/api/admin/messages', (req, res) => {
    console.log('📊 Admin requesting messages. Total:', messages.length);
    const sortedMessages = messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedMessages);
});

app.get('/api/admin/users', (req, res) => {
    console.log('👥 Admin requesting users. Total:', users.length);

    const safeUsers = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isOnline: Object.values(sessions).some(session => session.userId === user.id)
    }));

    res.json(safeUsers);
});

app.get('/api/admin/stats', (req, res) => {
    const today = new Date().toDateString();
    const todayMessages = messages.filter(m =>
        new Date(m.createdAt).toDateString() === today
    ).length;

    const todayUsers = users.filter(u =>
        u.createdAt && new Date(u.createdAt).toDateString() === today
    ).length;

    res.json({
        totalMessages: messages.length,
        newMessages: messages.filter(m => m.status === 'new').length,
        todayMessages,
        totalUsers: users.length,
        todayUsers,
        onlineUsers: Object.keys(sessions).length
    });
});

app.put('/api/admin/messages/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating message status:', { id, status });

    const message = messages.find(m => m.id === id);
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    message.status = status;
    res.json({ message: 'Status updated successfully' });
});

app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log('🚀 ================================');
    console.log('📧 Contact form endpoint: POST /api/contact');
    console.log('🔐 Auth endpoints: POST /api/login, /api/register');
    console.log('👤 Test login: test@example.com / 123456');
    console.log('👨‍💼 Admin login: admin@f2computers.com / admin123');
    console.log('✅ Test message added. Total messages:', messages.length);
    console.log('👥 Total users:', users.length);
    console.log('🚀 ================================');
});