const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    updatedIndexes: [Number],
    before: [String],
    after: [String]
});

module.exports = mongoose.model('SyncLog', syncLogSchema);