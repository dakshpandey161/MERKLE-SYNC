const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: Number,
    name: String,
    email: String,
    password: String,

    dataset: String,   // "A" or "B"
    hash: String
});

module.exports = mongoose.model('User', userSchema);