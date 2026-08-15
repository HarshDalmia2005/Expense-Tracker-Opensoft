import { Target, TrendingDown, Calendar, Pencil, Trash2, PiggyBank, ArrowUpCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const GoalCard = ({ goal, onEdit, onDelete, onContribute }) => {
    const progress = goal.progress || 0;
    const isOverBudget = goal.type === 'spending_limit' && progress > 100;
    const isCompleted = goal.status === 'completed';
    const isFailed = goal.status === 'failed';

    const getStatusColor = () => {
        if (isCompleted) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: '#22c55e' };
        if (isFailed || isOverBudget) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: '#ef4444' };
        if (progress > 75 && goal.type === 'spending_limit') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: '#f59e0b' };
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', ring: '#6366f1' };
    };

    const colors = getStatusColor();

    const getDaysRemaining = () => {
        if (!goal.deadline) return null;
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = getDaysRemaining();

    // SVG circular progress
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progressClamp = Math.min(progress, 100);
    const strokeDashoffset = circumference - (progressClamp / 100) * circumference;

    return (
        <div className={`bg-white rounded-2xl border ${colors.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group`}>
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                            {goal.type === 'savings' ? (
                                <PiggyBank size={20} className={colors.text} />
                            ) : (
                                <TrendingDown size={20} className={colors.text} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{goal.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${colors.bg} ${colors.text}`}>
                                {goal.type === 'savings' ? 'Savings Goal' : 'Spending Limit'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {goal.type === 'savings' && goal.status === 'active' && (
                            <button
                                onClick={() => onContribute(goal)}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title="Add contribution"
                            >
                                <ArrowUpCircle size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => onEdit(goal)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(goal._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Category tag */}
                {goal.category && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">{goal.category}</span>
                    </div>
                )}
            </div>

            {/* Progress Section */}
            <div className="px-5 pb-4">
                <div className="flex items-center gap-4">
                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0">
                        <svg width="96" height="96" className="transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                fill="none"
                                stroke="#f3f4f6"
                                strokeWidth="6"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                fill="none"
                                stroke={colors.ring}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-gray-900">
                                {Math.round(progress)}%
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {isCompleted ? 'Done!' : isOverBudget ? 'Over!' : 'Progress'}
                            </span>
                        </div>
                    </div>

                    {/* Amount Info */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-2">
                            <p className="text-sm text-gray-500 mb-0.5">
                                {goal.type === 'savings' ? 'Saved' : 'Spent'}
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                ₹{Number(goal.currentAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-0.5">
                                {goal.type === 'savings' ? 'Target' : 'Limit'}
                            </p>
                            <p className="text-base font-semibold text-gray-700">
                                ₹{Number(goal.targetAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={`px-5 py-3 border-t ${colors.border} ${colors.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-1.5">
                    {isCompleted && <span className="text-xs font-semibold text-emerald-700">✅ Goal Completed!</span>}
                    {isFailed && <span className="text-xs font-semibold text-red-700">❌ {goal.type === 'spending_limit' ? 'Budget Exceeded' : 'Deadline Passed'}</span>}
                    {!isCompleted && !isFailed && daysRemaining !== null && (
                        <>
                            <Calendar size={12} className="text-gray-400" />
                            <span className={`text-xs font-medium ${daysRemaining <= 7 ? 'text-amber-600' : 'text-gray-500'}`}>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Due today'}
                            </span>
                        </>
                    )}
                    {!isCompleted && !isFailed && daysRemaining === null && (
                        <span className="text-xs text-gray-400">No deadline set</span>
                    )}
                </div>

                {goal.type === 'savings' && goal.status === 'active' && (
                    <button
                        onClick={() => onContribute(goal)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        + Add Funds
                    </button>
                )}

                {goal.type === 'spending_limit' && goal.status === 'active' && (
                    <span className="text-xs font-medium text-gray-500">
                        ₹{Math.max(0, (goal.targetAmount - (goal.currentAmount || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })} remaining
                    </span>
                )}
            </div>
        </div>
    );
};


GoalCard.propTypes = {
  goal: PropTypes.shape({
    _id: PropTypes.any,
    deadline: PropTypes.any,
    title: PropTypes.any,
    category: PropTypes.any,
    progress: PropTypes.any,
    currentAmount: PropTypes.any,
    type: PropTypes.any,
    status: PropTypes.any,
    targetAmount: PropTypes.any,
  }),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onContribute: PropTypes.func.isRequired,
};

export default GoalCard;
