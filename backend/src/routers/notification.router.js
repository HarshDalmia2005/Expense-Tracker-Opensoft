import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from '../controllers/notification.controller.js';
import { checkForUserAuthentication } from '../middleware/auth.middleware.js';

const notificationRouter = express.Router();

// Get all notifications for a user
notificationRouter.get('/notifications/:userId', checkForUserAuthentication, getNotifications);

// Mark a single notification as read
notificationRouter.put('/notifications/:id/read', checkForUserAuthentication, markAsRead);

// Mark all notifications as read
notificationRouter.put('/notifications/:userId/read-all', checkForUserAuthentication, markAllAsRead);

// Delete a single notification
notificationRouter.delete('/notifications/:id', checkForUserAuthentication, deleteNotification);

// Clear all notifications for a user
notificationRouter.delete('/notifications/:userId/clear', checkForUserAuthentication, clearAllNotifications);

export default notificationRouter;
