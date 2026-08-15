import { Goal } from '../models/Goal.js';
import { Expense } from '../models/expenseModel.js';
import { logActivity } from './activity.controller.js';
import { createNotification } from './notification.controller.js';

export const createGoal = async (req, res) => {
    try {
        const { title, type, targetAmount, category, deadline } = req.body;
        const { id } = req.params;

        if (!title || !type || !targetAmount) {
            return res.status(400).json({ message: 'Title, type, and target amount are required' });
        }

        if (type === 'spending_limit' && !category) {
            return res.status(400).json({ message: 'Category is required for spending limit goals' });
        }

        const newGoal = await Goal.create({
            title,
            type,
            targetAmount: Number(targetAmount),
            category: category || '',
            deadline: deadline || null,
            createdBy: id,
        });

        await logActivity(id, 'Goal creation');
        await createNotification(
            id,
            'general',
            `New goal created: "${title}"`,
            '/budget'
        );

        return res.status(201).json(newGoal);
    } catch (error) {
        console.error('Create goal error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const getGoals = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const goals = await Goal.find({ createdBy: userId }).sort({ createdAt: -1 });

        // For spending limit goals, compute current spending from expenses
        const enrichedGoals = await Promise.all(
            goals.map(async (goal) => {
                const goalObj = goal.toObject();

                if (goal.type === 'spending_limit' && goal.category) {
                    // Get current month's expenses in this category
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                    const categoryExpenses = await Expense.find({
                        createdBy: userId,
                        category: goal.category,
                        date: { $gte: startOfMonth, $lte: endOfMonth },
                    });

                    const totalSpent = categoryExpenses.reduce(
                        (sum, e) => sum + Number(e.amount || 0),
                        0
                    );

                    goalObj.currentAmount = totalSpent;
                    goalObj.progress = goal.targetAmount > 0 ? Math.min((totalSpent / goal.targetAmount) * 100, 150) : 0;

                    // Auto-update status
                    if (totalSpent > goal.targetAmount && goal.status === 'active') {
                        goalObj.status = 'failed';
                    }
                } else {
                    // Savings goal progress
                    goalObj.progress = goal.targetAmount > 0
                        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                        : 0;
                }

                // Check deadline
                if (goal.deadline && new Date(goal.deadline) < new Date() && goal.status === 'active') {
                    if (goal.type === 'savings' && goal.currentAmount < goal.targetAmount) {
                        goalObj.status = 'failed';
                    }
                }

                return goalObj;
            })
        );

        return res.status(200).json(enrichedGoals);
    } catch (error) {
        console.error('Get goals error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateGoal = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { title, targetAmount, category, deadline, status } = req.body;

        const goal = await Goal.findById(id);
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        if (title) goal.title = title;
        if (targetAmount) goal.targetAmount = Number(targetAmount);
        if (category !== undefined) goal.category = category;
        if (deadline !== undefined) goal.deadline = deadline;
        if (status) goal.status = status;

        await goal.save();
        await logActivity(userId, 'Goal update');

        return res.status(200).json({ message: 'Goal updated successfully', goal });
    } catch (error) {
        console.error('Update goal error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const result = await Goal.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        await logActivity(userId, 'Goal deletion');

        return res.status(200).json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const addContribution = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { amount, note } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'A positive contribution amount is required' });
        }

        const goal = await Goal.findById(id);
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        if (goal.type !== 'savings') {
            return res.status(400).json({ message: 'Contributions can only be added to savings goals' });
        }

        const contributionAmount = Number(amount);

        goal.contributions.push({
            amount: contributionAmount,
            date: new Date(),
            note: note || '',
        });

        goal.currentAmount += contributionAmount;

        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = 'completed';
        }

        await goal.save();
        await logActivity(userId, 'Goal contribution');

        if (goal.status === 'completed') {
            await createNotification(
                userId,
                'goal_completed',
                `🎉 Goal "${goal.title}" has been completed!`,
                '/budget'
            );
        }

        return res.status(200).json({
            message: 'Contribution added successfully',
            goal,
        });
    } catch (error) {
        console.error('Add contribution error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};
