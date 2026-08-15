import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Trash2 } from 'lucide-react';
import './ChatBot.css';

const SUGGESTED_PROMPTS = [
    "How much did I spend this month?",
    "What's my top spending category?",
    "Give me a savings tip",
    "Analyze my spending patterns",
];

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hey there! 👋 I'm SpendSense AI, your personal finance assistant. I can analyze your spending, answer questions about your expenses, and give you budgeting tips. What would you like to know?",
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const conversationHistory = messages
                .filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0)
                .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chatbot/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: text,
                    conversationHistory,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply,
                    timestamp: data.timestamp,
                },
            ]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "I'm sorry, I couldn't process that request right now. Please make sure the backend is running and GEMINI_API_KEY is configured. 🔧",
                    timestamp: new Date().toISOString(),
                    isError: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Chat cleared! 🧹 How can I help you with your finances?",
                timestamp: new Date().toISOString(),
            },
        ]);
    };

    const formatMessage = (text) => {
        // Simple markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
                aria-label="Toggle chat"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <>
                        <MessageCircle size={24} />
                        <span className="chatbot-fab__pulse" />
                    </>
                )}
            </button>

            {/* Chat Panel */}
            <div className={`chatbot-panel ${isOpen ? 'chatbot-panel--open' : ''}`}>
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header__info">
                        <div className="chatbot-header__avatar">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="chatbot-header__title">SpendSense AI</h3>
                            <p className="chatbot-header__status">
                                {isLoading ? 'Thinking...' : 'Online'}
                            </p>
                        </div>
                    </div>
                    <div className="chatbot-header__actions">
                        <button onClick={clearChat} className="chatbot-header__btn" title="Clear chat">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="chatbot-header__btn" title="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chatbot-messages">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`chatbot-message ${msg.role === 'user' ? 'chatbot-message--user' : 'chatbot-message--assistant'} ${msg.isError ? 'chatbot-message--error' : ''}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="chatbot-message__avatar">
                                    <Bot size={16} />
                                </div>
                            )}
                            <div className="chatbot-message__bubble">
                                <div
                                    className="chatbot-message__text"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                />
                                <span className="chatbot-message__time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {msg.role === 'user' && (
                                <div className="chatbot-message__avatar chatbot-message__avatar--user">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="chatbot-message chatbot-message--assistant">
                            <div className="chatbot-message__avatar">
                                <Bot size={16} />
                            </div>
                            <div className="chatbot-message__bubble chatbot-message__bubble--typing">
                                <div className="chatbot-typing">
                                    <span className="chatbot-typing__dot" />
                                    <span className="chatbot-typing__dot" />
                                    <span className="chatbot-typing__dot" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Prompts */}
                {messages.length <= 1 && (
                    <div className="chatbot-suggestions">
                        {SUGGESTED_PROMPTS.map((prompt, idx) => (
                            <button
                                key={idx}
                                className="chatbot-suggestion"
                                onClick={() => sendMessage(prompt)}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="chatbot-input">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask about your finances..."
                        className="chatbot-input__field"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="chatbot-input__send"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatBot;