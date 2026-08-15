import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense } from '../models/expenseModel.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildExpenseSummary = (expenses) => {
    if (!expenses || expenses.length === 0) {
        return 'The user has no recorded expenses yet.';
    }

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const categoryTotals = {};
    const monthlyTotals = {};
    const paymentMethodTotals = {};

    expenses.forEach(e => {
        const amount = Number(e.amount || 0);
        // Category breakdown
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amount;
        // Monthly breakdown
        const date = new Date(e.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
        // Payment method breakdown
        paymentMethodTotals[e.paymentMethod] = (paymentMethodTotals[e.paymentMethod] || 0) + amount;
    });

    const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(e => `  - ₹${e.amount} on ${e.category} (${e.description}) on ${new Date(e.date).toLocaleDateString('en-IN')} via ${e.paymentMethod}`)
        .join('\n');

    return `
User's Financial Summary:
- Total expenses recorded: ${expenses.length} transactions
- Total amount spent: ₹${totalSpent.toFixed(2)}

Category Breakdown:
${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`).join('\n')}

Monthly Breakdown:
${Object.entries(monthlyTotals).sort().map(([month, amt]) => `  - ${month}: ₹${amt.toFixed(2)}`).join('\n')}

Payment Method Breakdown:
${Object.entries(paymentMethodTotals).map(([method, amt]) => `  - ${method}: ₹${amt.toFixed(2)}`).join('\n')}

Recent 10 Transactions:
${recentExpenses}
`.trim();
};

const SYSTEM_PROMPT = `You are SpendSense AI, a friendly and insightful personal finance assistant built into the SpendSense expense tracking app. 

Your capabilities:
- Analyze the user's spending patterns and provide insights
- Answer questions about their expenses (amounts, categories, trends)
- Give personalized budgeting and saving tips
- Help users understand their financial habits
- Provide general financial literacy advice

Guidelines:
- Always be encouraging and non-judgmental about spending habits
- Use the Indian Rupee (₹) symbol for amounts
- Keep responses concise but helpful (2-4 sentences for simple questions, more for analysis)
- When the user asks about their data, reference specific numbers from their expense summary
- If the user has no expenses, encourage them to start tracking
- Use emojis sparingly for a friendly tone
- Format numbers with commas for readability (e.g., ₹1,00,000)
`;

export const sendMessage = async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;
        const userId = req.user._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch user's expenses for context
        const expenses = await Expense.find({ createdBy: userId });
        const expenseSummary = buildExpenseSummary(expenses);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build the conversation for Gemini
        const fullPrompt = `${SYSTEM_PROMPT}\n\nHere is the user's financial data:\n${expenseSummary}\n\n`;

        const chatHistory = (conversationHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'Hello, I need help with my finances.' }] },
                { role: 'model', parts: [{ text: fullPrompt + '\n\nHello! 👋 I\'m SpendSense AI, your personal finance assistant. I have access to your expense data and I\'m ready to help you understand your spending patterns, set budgets, and make smarter financial decisions. What would you like to know?' }] },
                ...chatHistory,
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({
            reply: text,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Chatbot error:', error.message);

        if (error.message?.includes('API_KEY')) {
            return res.status(500).json({ message: 'AI service is not configured. Please add GEMINI_API_KEY to your environment variables.' });
        }

        return res.status(500).json({ message: 'Failed to get AI response. Please try again.' });
    }
};
