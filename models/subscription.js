const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema({
    subscriptionId: {
        type: String,
        required: true
    },
    planId: {
        type: mongoose.Schema.ObjectId,
        ref: 'plan'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    status: {
        type: String,
        default: 'active'
    },
    name: {
        type: String,
        default: 'premium'
    },
}, { timestamps: true });

const subscriptionModel = mongoose.model('subscription', subscriptionSchema);

// Drop the problematic index (run once)
subscriptionModel.collection.dropIndex('sessionId_1')
    .then(() => console.log('Dropped sessionId_1 index'))
    .catch(err => {
        if (err.code === 27 || err.codeName === 'IndexNotFound') {
            console.log('sessionId_1 index does not exist (already dropped)');
        } else {
            console.error('Error dropping index:', err.message);
        }
    });

module.exports = subscriptionModel;