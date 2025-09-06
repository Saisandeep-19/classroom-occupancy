require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
console.log(`Environment PORT: ${process.env.PORT}, Using port: ${port}`); // Debug log
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_123'; // Replace with env variable in production

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: [
        'https://occupancy-tracker-02.vercel.app',
        'http://localhost:3000',
        'https://classroom-occupancy-production.up.railway.app'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static frontend files (now relative to root)
app.use(express.static(path.join(__dirname, 'frontend')));

mongoose.connect(process.env.MONGODB_URI, {})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Room Schema
const roomSchema = new mongoose.Schema({
    room: { type: String, required: true, unique: true },
    status: { type: Boolean, default: false }
});

const Room = mongoose.model('Room', roomSchema);

// Lab Schema
const labSchema = new mongoose.Schema({
    lab: { type: String, required: true, unique: true },
    status: { type: Boolean, default: false }
});

const Lab = mongoose.model('Lab', labSchema);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Invalid token:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
};

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log(`Attempting to register user: ${username}`);
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log(`Username ${username} already exists`);
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log(`User ${username} registered successfully`);
        res.json({ message: 'Account created successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error creating account' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log(`Attempting login for user: ${username}`);
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User ${username} not found`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log(`Invalid password for user ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`User ${username} logged in successfully`);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Request password reset
app.post('/api/reset-password-request', async (req, res) => {
    const { username } = req.body;
    try {
        console.log(`Attempting password reset request for user: ${username}`);
        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User ${username} not found`);
            return res.status(404).json({ error: 'Username not found' });
        }

        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
        await User.updateOne(
            { username },
            { resetToken, resetTokenExpiry }
        );

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `https://classroom-occupancy-production.up.railway.app/reset-password?token=${resetToken}&username=${username}`;

        const mailOptions = {
            to: `${username}@example.com`, // Replace with real email in production
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset for Classroom Occupancy Tracker.</p>
                <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
                <p>This link expires in 1 hour.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent for user ${username}`);
        res.json({ message: 'Reset instructions sent to your email' });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ error: 'Error processing password reset' });
    }
});

// Reset password with token
app.post('/api/reset-password', async (req, res) => {
    const { username, token, newPassword } = req.body;
    try {
        console.log(`Attempting password reset for user: ${username}`);
        const user = await User.findOne({
            username,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`Invalid or expired token for user ${username}`);
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne(
            { username },
            { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
        );

        console.log(`Password reset successfully for user ${username}`);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

// Welcome route
app.get('/', (req, res) => res.send('Welcome to Classroom Occupancy Tracker API'));

// Get room status (protected)
app.get('/api/room-status', authenticateToken, async (req, res) => {
    try {
        const rooms = await Room.find();
        const roomStatus = {};
        rooms.forEach(room => {
            roomStatus[room.room] = room.status;
        });
        console.log('Responding with room statuses:', roomStatus);
        res.json(roomStatus);
    } catch (error) {
        console.error('Error fetching room status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update room status (protected)
app.post('/api/room-status', authenticateToken, async (req, res) => {
    const { room, status } = req.body;
    try {
        console.log(`Updating room ${room} status to ${status}`);
        const result = await Room.findOneAndUpdate(
            { room }, 
            { status }, 
            { upsert: true, new: true }
        );
        console.log('Update result:', result);
        res.json({ message: 'Room status updated successfully', data: result });
    } catch (error) {
        console.error('Error updating room status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get lab status (protected)
app.get('/api/lab-status', authenticateToken, async (req, res) => {
    try {
        const labs = await Lab.find();
        const labStatus = {};
        labs.forEach(lab => {
            labStatus[lab.lab] = lab.status;
        });
        console.log('Responding with lab statuses:', labStatus);
        res.json(labStatus);
    } catch (error) {
        console.error('Error fetching lab status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update lab status (protected)
app.post('/api/lab-status', authenticateToken, async (req, res) => {
    const { lab, status } = req.body;
    try {
        console.log(`Updating lab ${lab} status to ${status}`);
        const result = await Lab.findOneAndUpdate(
            { lab }, 
            { status }, 
            { upsert: true, new: true }
        );
        console.log('Update result:', result);
        res.json({ message: 'Lab status updated successfully', data: result });
    } catch (error) {
        console.error('Error updating lab status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Initialize default rooms and labs if empty
async function initializeData() {
    try {
        const roomCount = await Room.countDocuments();
        if (roomCount === 0) {
            const defaultRooms = [
                'A11', 'A12', 'A13', 'A14',
                'B21', 'B22', 'B23', 'B24',
                'C31', 'C32', 'C33', 'C34',
                'D41', 'D42', 'D43', 'D44'
            ].map(room => ({ room, status: false }));
            await Room.insertMany(defaultRooms);
            console.log('Initialized default rooms');
        }

        const labCount = await Lab.countDocuments();
        if (labCount === 0) {
            const defaultLabs = [
                'Lab 1', 'Lab 2', 'Lab 3',
                'Lab 4', 'Lab 5', 'Lab 6'
            ].map(lab => ({ lab, status: false }));
            await Lab.insertMany(defaultLabs);
            console.log('Initialized default labs');
        }

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash('1234', 10);
            await User.create({ username: 'faculty', password: hashedPassword });
            console.log('Initialized default user: faculty');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Run initialization after MongoDB connection
mongoose.connection.once('open', () => {
    initializeData();
});

app.get('/api/test', (req, res) => {
    res.send('Backend is running!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try a different port or close the application using this port.`);
    } else {
        console.error('Error starting server:', err);
    }
    process.exit(1);
});