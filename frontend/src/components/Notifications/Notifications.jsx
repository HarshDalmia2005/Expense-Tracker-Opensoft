import React, { useEffect, useState, useCallback } from 'react';
import {
    Bell,
    CheckCheck,
    Trash2,
    ExternalLink,
    CircleDollarSign,
    Target,
    Receipt,
    HandCoins,
    Info,
    Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const TYPE_META = {
    expense_added: { icon: <HandCoins className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
    goal_completed: { icon: <Target className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
    goal_failed: { icon: <Target className="w-4 h-4" />, color: 'bg-red-100 text-red-600' },
    bill_created: { icon: <Receipt className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-600' },
    bill_settled: { icon: <CircleDollarSign className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
    group_added: { icon: <Info className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600' },
    general: { icon: <Info className="w-4 h-4" />, color: 'bg-gray-100 text-gray-600' },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
    const navigate = useNavigate();
    const meta = TYPE_META[notification.type] || TYPE_META.general;

    const handleClick = async () => {
        if (!notification.isRead) await onMarkRead(notification._id);
        if (notification.link) navigate(notification.link);
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm group ${
                notification.isRead
                    ? 'bg-white border-gray-100'
                    : 'bg-purple-50 border-purple-100'
            }`}
            onClick={handleClick}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.color}`}>
                {meta.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.isRead && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMarkRead(notification._id); }}
                        className="p-1.5 rounded-full hover:bg-purple-100 text-purple-500 hover:text-purple-700 transition-colors"
                        title="Mark as read"
                    >
                        <CheckCheck className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
                    className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                {notification.link && (
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                )}
            </div>

            {/* Unread dot */}
            {!notification.isRead && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600 mt-2" />
            )}
        </div>
    );
};

const Notifications = () => {
    const { user, showToast } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    const token = localStorage.getItem('token');

    const fetchNotifications = useCallback(async () => {
        if (!user?._id) return;
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND}/notifications/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error(err);
            showToast('Could not load notifications', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkRead = async (id) => {
        try {
            await fetch(`${BACKEND}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            showToast('Failed to mark as read', 'error');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch(`${BACKEND}/notifications/${user._id}/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            showToast('All notifications marked as read', 'success');
        } catch {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const handleDelete = async (id) => {
        const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
        try {
            await fetch(`${BACKEND}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            showToast('Failed to delete notification', 'error');
        }
    };

    const handleClearAll = async () => {
        try {
            await fetch(`${BACKEND}/notifications/${user._id}/clear`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications([]);
            setUnreadCount(0);
            showToast('All notifications cleared', 'success');
        } catch {
            showToast('Failed to clear notifications', 'error');
        }
    };

    const displayed = filter === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-xl shadow-sm">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-xs text-purple-600 font-medium">
                                    {unreadCount} unread
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 w-fit">
                    {['all', 'unread'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filter === tab
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Bell className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-base font-medium">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                        <p className="text-sm mt-1 opacity-70">
                            {filter === 'unread'
                                ? "You're all caught up!"
                                : 'Notifications will appear here when events occur.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayed.map((notification) => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onMarkRead={handleMarkRead}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
