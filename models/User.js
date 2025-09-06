const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// A separate schema for footprint history entries for better organization
const FootprintSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    totalEmissions: { type: Number },
    breakdown: {
        homeEnergy: Number,
        transportation: Number,
        consumption: Number
    }
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // No two users can share the same email
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    // Use the separate schema for the history array
    footprintHistory: [FootprintSchema],

    // --- NEW FIELDS FOR PASSWORD RESET ---
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
});

// Hash the password before saving the user model
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', UserSchema);
module.exports = User;