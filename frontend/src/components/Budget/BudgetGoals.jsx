import React, { useState, useEffect } from 'react';
import {
    Target, Plus, Loader, PiggyBank, TrendingDown, CheckCircle,
    AlertCircle, X, Calendar, Tag, IndianRupeeIcon, FileText, Wallet
} from 'lucide-react';
import GoalCard from './GoalCard';
import { ConfirmModal } from '../Message/ConfirmModal';
import Toast from '../Message/Toast';
import './BudgetGoals.css';

const categories = [
    "Food", "Shopping", "Housing", "Transport", "Entertainment",
    "Utilities", "Healthcare", "Education", "Travel", "Other"
];

const BudgetGoals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    const [newGoal, setNewGoal] = useState({
        title: '',
        type: 'savings',
        targetAmount: '',
        category: '',
        deadline: '',
    });

    const [contribution, setContribution] = useState({
        amount: '',
        note: '',
    });

    const showToast = (message, type) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    };

    const getUserId = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?._id;
    };

    // Fetch goals
    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const userId = getUserId();
                if (!userId) return;

                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/goals/get/${userId}`,
                    { headers: getAuthHeaders() }
                );

                if (!response.ok) throw new Error('Failed to fetch goals');
                const data = await response.json();
                setGoals(data);
            } catch (error) {
                console.error('Fetch goals error:', error);
                showToast('Failed to load goals', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, []);

    // Stats
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalSaved = goals
        .filter(g => g.type === 'savings')
        .reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    // Filtered goals
    const filteredGoals = goals.filter(g => {
        if (activeTab === 'savings') return g.type === 'savings';
        if (activeTab === 'spending') return g.type === 'spending_limit';
        return true;
    });

    // Create goal
    const handleCreateGoal = async () => {
        if (!newGoal.title || !newGoal.targetAmount) {
            showToast('Please fill in title and target amount', 'error');
            return;
        }

        if (newGoal.type === 'spending_limit' && !newGoal.category) {
            showToast('Please select a category for spending limit', 'error');
            return;
        }

        try {
            const userId = getUserId();
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/goals/create/${userId}`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newGoal),
                }
            );

            if (!response.ok) throw new Error('Failed to create goal');
            const created = await response.json();

            // Enrich with progress field
            created.progress = 0;

            setGoals(prev => [created, ...prev]);
            setShowCreateModal(false);
            setNewGoal({ title: '', type: 'savings', targetAmount: '', category: '', deadline: '' });
            showToast('Goal created successfully!', 'success');
        } catch (error) {
            showToast('Failed to create goal', 'error');
        }
    };

    // Delete goal
    const handleDeleteGoal = (goalId) => {
        setConfirmModal({
            isOpen: true,
            message: 'Are you sure you want to delete this goal?',
            onConfirm: async () => {
                try {
                    const userId = getUserId();
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/goals/delete/${goalId}/${userId}`,
                        {
                            method: 'DELETE',
                            headers: getAuthHeaders(),
                        }
                    );

                    if (!response.ok) throw new Error('Failed to delete goal');
                    setGoals(prev => prev.filter(g => g._id !== goalId));
                    showToast('Goal deleted successfully!', 'success');
                } catch (error) {
                    showToast('Failed to delete goal', 'error');
                }
                setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
            },
        });
    };

    // Edit goal
    const handleEditGoal = (goal) => {
        setSelectedGoal(goal);
        setNewGoal({
            title: goal.title,
            type: goal.type,
            targetAmount: String(goal.targetAmount),
            category: goal.category || '',
            deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            const userId = getUserId();
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/goals/update/${selectedGoal._id}/${userId}`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newGoal),
                }
            );

            if (!response.ok) throw new Error('Failed to update goal');

            setGoals(prev =>
                prev.map(g =>
                    g._id === selectedGoal._id
                        ? { ...g, ...newGoal, targetAmount: Number(newGoal.targetAmount) }
                        : g
                )
            );
            setShowEditModal(false);
            setSelectedGoal(null);
            setNewGoal({ title: '', type: 'savings', targetAmount: '', category: '', deadline: '' });
            showToast('Goal updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update goal', 'error');
        }
    };

    // Contribute
    const handleOpenContribute = (goal) => {
        setSelectedGoal(goal);
        setContribution({ amount: '', note: '' });
        setShowContributeModal(true);
    };

    const handleAddContribution = async () => {
        if (!contribution.amount || Number(contribution.amount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            const userId = getUserId();
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/goals/contribute/${selectedGoal._id}/${userId}`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(contribution),
                }
            );

            if (!response.ok) throw new Error('Failed to add contribution');
            const data = await response.json();

            setGoals(prev =>
                prev.map(g => {
                    if (g._id === selectedGoal._id) {
                        const updated = { ...g };
                        updated.currentAmount = data.goal.currentAmount;
                        updated.contributions = data.goal.contributions;
                        updated.status = data.goal.status;
                        updated.progress = updated.targetAmount > 0
                            ? Math.min((updated.currentAmount / updated.targetAmount) * 100, 100)
                            : 0;
                        return updated;
                    }
                    return g;
                })
            );
            setShowContributeModal(false);
            setSelectedGoal(null);
            showToast('Contribution added!', 'success');
        } catch (error) {
            showToast('Failed to add contribution', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-lg text-gray-700">Loading your goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
            />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                            <Target className="w-6 h-6 mr-2 text-indigo-600" />
                            Budgets & Goals
                        </h1>
                        <button
                            onClick={() => {
                                setNewGoal({ title: '', type: 'savings', targetAmount: '', category: '', deadline: '' });
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200 font-medium text-sm"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Create Goal</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <Target className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Goals</p>
                                <p className="text-2xl font-bold text-gray-900">{totalGoals}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-gray-900">{activeGoals}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{completedGoals}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl">
                                <PiggyBank className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Saved</p>
                                <p className="text-2xl font-bold text-gray-900">₹{totalSaved.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8 space-x-8">
                    {[
                        { key: 'all', label: 'All Goals' },
                        { key: 'savings', label: 'Savings' },
                        { key: 'spending', label: 'Spending Limits' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-4 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Goals Grid */}
                {filteredGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGoals.map(goal => (
                            <GoalCard
                                key={goal._id}
                                goal={goal}
                                onEdit={handleEditGoal}
                                onDelete={handleDeleteGoal}
                                onContribute={handleOpenContribute}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
                            <Wallet className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No goals yet</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Set your first financial goal to start tracking your savings and spending limits. Stay on top of your finances!
                        </p>
                        <button
                            onClick={() => {
                                setNewGoal({ title: '', type: 'savings', targetAmount: '', category: '', deadline: '' });
                                setShowCreateModal(true);
                            }}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-all font-medium"
                        >
                            <Plus size={18} />
                            Create Your First Goal
                        </button>
                    </div>
                )}
            </div>

            {/* ===== Create / Edit Goal Modal ===== */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden goals-modal-enter">
                        <div className="flex justify-between items-center bg-indigo-600 text-white px-6 py-4">
                            <h2 className="text-xl font-bold">
                                {showEditModal ? 'Edit Goal' : 'Create New Goal'}
                            </h2>
                            <button
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedGoal(null); }}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Goal Type Toggle */}
                            {!showEditModal && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setNewGoal({ ...newGoal, type: 'savings', category: '' })}
                                        className={`flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${newGoal.type === 'savings'
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <PiggyBank size={20} className={newGoal.type === 'savings' ? 'text-indigo-600' : 'text-gray-400'} />
                                        <div className="text-left">
                                            <p className={`text-sm font-semibold ${newGoal.type === 'savings' ? 'text-indigo-700' : 'text-gray-700'}`}>Savings Goal</p>
                                            <p className="text-xs text-gray-400">Save towards a target</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setNewGoal({ ...newGoal, type: 'spending_limit' })}
                                        className={`flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${newGoal.type === 'spending_limit'
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <TrendingDown size={20} className={newGoal.type === 'spending_limit' ? 'text-amber-600' : 'text-gray-400'} />
                                        <div className="text-left">
                                            <p className={`text-sm font-semibold ${newGoal.type === 'spending_limit' ? 'text-amber-700' : 'text-gray-700'}`}>Spending Limit</p>
                                            <p className="text-xs text-gray-400">Cap monthly spending</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Goal Title</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                        placeholder={newGoal.type === 'savings' ? 'e.g., Emergency Fund' : 'e.g., Monthly Food Budget'}
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Target Amount */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">
                                    {newGoal.type === 'savings' ? 'Target Amount' : 'Spending Limit'}
                                </label>
                                <div className="relative">
                                    <IndianRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                        placeholder="Amount"
                                        min="1"
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Category (for spending limits) */}
                            {newGoal.type === 'spending_limit' && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            value={newGoal.category}
                                            onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Deadline */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Deadline (Optional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedGoal(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showEditModal ? handleSaveEdit : handleCreateGoal}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md font-medium"
                            >
                                {showEditModal ? 'Save Changes' : 'Create Goal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Contribute Modal ===== */}
            {showContributeModal && selectedGoal && (
                <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden goals-modal-enter">
                        <div className="flex justify-between items-center bg-emerald-600 text-white px-6 py-4">
                            <h2 className="text-xl font-bold">Add Contribution</h2>
                            <button
                                onClick={() => { setShowContributeModal(false); setSelectedGoal(null); }}
                                className="text-white hover:text-gray-200"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Goal info */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-5">
                                <p className="text-sm text-gray-500 mb-1">Contributing to</p>
                                <p className="font-bold text-gray-900">{selectedGoal.title}</p>
                                <div className="flex justify-between mt-2 text-sm">
                                    <span className="text-gray-500">
                                        Current: ₹{Number(selectedGoal.currentAmount || 0).toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-gray-500">
                                        Target: ₹{Number(selectedGoal.targetAmount || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {/* Mini progress bar */}
                                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(selectedGoal.progress || 0, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5 mb-4">
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <div className="relative">
                                    <IndianRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        value={contribution.amount}
                                        onChange={(e) => setContribution({ ...contribution, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        min="1"
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Note (Optional)</label>
                                <textarea
                                    value={contribution.note}
                                    onChange={(e) => setContribution({ ...contribution, note: e.target.value })}
                                    placeholder="e.g., Monthly savings deposit"
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowContributeModal(false); setSelectedGoal(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddContribution}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md font-medium"
                            >
                                Add Contribution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetGoals;