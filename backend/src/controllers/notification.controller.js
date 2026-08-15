import { Notification } from '../models/Notification.js';

/**
 * Internal helper – creates a notification document.
 * Not exposed via HTTP; called from other controllers.
 */
export const createNotification = async (userId, type, message, link = '') => {
    try {
        await Notification.create({ user: userId, type, message, link });
    } catch (error) {
        console.error('Error creating notification:', error.message);
    }
};

/**
 * GET /notifications/:userId
 * Returns all notifications for the user, newest first.
 */
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * PUT /notifications/:id/read
 * Marks a single notification as read.
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Mark as read error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * PUT /notifications/:userId/read-all
 * Marks all of a user's notifications as read.
 */
export const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * DELETE /notifications/:id
 * Deletes a single notification.
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Notification.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * DELETE /notifications/:userId/clear
 * Deletes all notifications for a user.
 */
export const clearAllNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        await Notification.deleteMany({ user: userId });

        return res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Clear notifications error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
