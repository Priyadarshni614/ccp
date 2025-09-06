// server.js

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
require('dotenv').config();

// --- NEW IMPORTS ---
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ex4.html'));
});

app.use(express.static(__dirname));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ Connection error', err));


// --- API Routes ---

// SIGNUP LOGIC
app.post('/signup', async (req, res) => {
    // ... (Your existing signup code remains the same)
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists."});
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "Account created successfully!" });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user: ' + error.message });
    }
});

// LOGIN LOGIC
app.post('/login', async (req, res) => {
    // ... (Your existing login code remains the same)
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        res.json({ success: true, userId: user._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// --- NEW: REQUEST PASSWORD RESET ROUTE ---
app.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Send a generic message to prevent exposing whether an email exists
            return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
        }

        // 1. Generate a token
        const token = crypto.randomBytes(20).toString('hex');
        
        // 2. Set token and expiration on the user model
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // Expires in 1 hour
        await user.save();

        // 3. Send the email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetURL = `http://localhost:${PORT}/reset-password.html?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'GREANIX Password Reset Request',
            html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste it into your browser to complete the process:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>This link will expire in one hour.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});


// --- NEW: RESET PASSWORD ROUTE ---
app.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find user by token AND check if it's not expired
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }, // $gt means "greater than"
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // Set the new password
        user.password = password;
        user.passwordResetToken = undefined; // Clear the token
        user.passwordResetExpires = undefined; // Clear the expiration
        
        await user.save(); // This will trigger the .pre('save') hook to hash the new password

        res.status(200).json({ message: 'Password has been successfully reset.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error while resetting password.' });
    }
});

// SAVE FOOTPRINT DATA - CORRECTED VERSION
app.post('/api/save-footprint', async (req, res) => {
    try {
        const { userId, totalEmissions, breakdown } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        
        // Step 1: Find the user by their ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Step 2: Create the new history entry
        const newFootprintEntry = {
            totalEmissions: totalEmissions,
            breakdown: breakdown,
            date: new Date()
        };

        // Step 3: Add the new entry to the user's history array
        await User.findByIdAndUpdate(userId, { $push: { footprintHistory: newFootprintEntry } });
        res.status(200).json({ message: 'Footprint saved successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// GET USER DATA
app.get('/api/user-data/:userId', async (req, res) => {
    // ... (Your existing user-data code remains the same)
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.username,
            history: user.footprintHistory
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});