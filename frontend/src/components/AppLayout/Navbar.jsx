import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CircleUserRound,
  Menu,
  Bell,
  CircleDollarSign,
  Settings,
  CheckCheck,
  Trash2,
  HandCoins,
  Target,
  Receipt,
  Info,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const TYPE_META = {
  expense_added: { icon: <HandCoins className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-600' },
  goal_completed: { icon: <Target className="w-3.5 h-3.5" />, color: 'bg-green-100 text-green-600' },
  goal_failed: { icon: <Target className="w-3.5 h-3.5" />, color: 'bg-red-100 text-red-600' },
  bill_created: { icon: <Receipt className="w-3.5 h-3.5" />, color: 'bg-yellow-100 text-yellow-600' },
  bill_settled: { icon: <CircleDollarSign className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-600' },
  group_added: { icon: <Info className="w-3.5 h-3.5" />, color: 'bg-indigo-100 text-indigo-600' },
  general: { icon: <Info className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
};

const Navbar = ({ isOpen, toggleSidebar }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const token = localStorage.getItem('token');

  // Fetch notifications from the API
  const fetchNotifications = useCallback(async () => {
    if (!user?._id || !token) return;
    try {
      setNotifLoading(true);
      const res = await fetch(`${BACKEND}/notifications/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setNotifLoading(false);
    }
  }, [user, token]);

  // Poll every 60 seconds while logged in
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((v) => !v);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((v) => {
      if (!v) fetchNotifications(); // refresh when opening
      return !v;
    });
    setShowProfileDropdown(false);
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${BACKEND}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
    try {
      await fetch(`${BACKEND}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notification) => {
    if (!notification.isRead) {
      await fetch(`${BACKEND}/notifications/${notification._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setShowNotifications(false);
    if (notification.link) navigate(notification.link);
  };

  // Show max 5 in the dropdown; full list on the notifications page
  const previewNotifications = notifications.slice(0, 5);

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 transition-all duration-300">
      {/* Left Section */}
      <div className="flex items-center space-x-3 md:space-x-5">
        <button
          onClick={toggleSidebar}
          className="hover:bg-gray-100 p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          aria-label="Toggle sidebar"
        >
          <Menu className={`w-5 h-5 text-gray-700 ${isOpen && 'hidden'}`} />
        </button>

        {!isOpen && (
          <Link to="/dashboard" className="flex items-center space-x-1 group">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-1.5 rounded-md shadow-sm">
              <CircleDollarSign className="text-white w-5 h-5" />
            </div>
            <div className="flex items-baseline">
              <p className="text-purple-800 text-xl font-bold group-hover:text-purple-900 transition-colors">$PEND</p>
              <p className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Sense</p>
            </div>
          </Link>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 md:space-x-6">

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            className="hover:bg-gray-100 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-xs font-bold text-white bg-red-500 rounded-full leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                ) : previewNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  previewNotifications.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.general;
                    return (
                      <div
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 group border-b border-gray-50 last:border-0 transition-colors ${
                          !n.isRead ? 'bg-purple-50 hover:bg-purple-100' : ''
                        }`}
                      >
                        {/* Type icon */}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${meta.color}`}>
                          {meta.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>

                        {/* Per-item actions */}
                        <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button
                              onClick={(e) => handleMarkRead(e, n._id)}
                              className="text-purple-400 hover:text-purple-700 transition-colors"
                              title="Mark read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, n._id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Unread indicator */}
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="text-center py-2.5 border-t border-gray-100 bg-gray-50">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-2 hover:bg-gray-100 p-1 pr-2 md:pr-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            aria-label="User menu"
          >
            <CircleUserRound className="w-6 h-6 text-gray-700" />
            <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CircleUserRound className="w-4 h-4 mr-3 text-gray-600" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-600" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
