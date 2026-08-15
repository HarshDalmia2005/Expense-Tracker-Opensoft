import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                'expense_added',
                'goal_completed',
                'goal_failed',
                'bill_created',
                'bill_settled',
                'group_added',
                'general',
            ],
            default: 'general',
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
