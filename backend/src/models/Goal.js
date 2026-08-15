import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    note: {
        type: String,
        default: '',
    },
});

const goalSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['savings', 'spending_limit'],
            required: true,
        },
        targetAmount: {
            type: Number,
            required: true,
        },
        currentAmount: {
            type: Number,
            default: 0,
        },
        category: {
            type: String,
            default: '',
        },
        deadline: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'failed'],
            default: 'active',
        },
        contributions: [contributionSchema],
    },
    {
        timestamps: true,
    }
);

export const Goal = mongoose.model('Goal', goalSchema);
