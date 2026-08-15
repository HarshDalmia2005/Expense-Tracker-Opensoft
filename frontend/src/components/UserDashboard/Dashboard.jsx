import { useEffect, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart
} from "recharts";
import PropTypes from 'prop-types';
import {
  TrendingUp, TrendingDown, PieChartIcon, CreditCard, Calendar, Loader, Menu, X, IndianRupeeIcon, Activity, AlertCircle, ShoppingBag, List
} from "lucide-react";

const SpendingAnalyticsDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchExpenses = async (userId, token) => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expenses/get/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch expenses");
        }
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    };

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (user?._id && token) {
      fetchExpenses(user._id, token);
    } else {
      setLoading(false);
    }
  }, []);

  // Safe parsing function to prevent NaN values
  const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Data processing
  const totalSpending = expenses.reduce((sum, exp) => sum + safeNumber(exp.amount), 0);
  const transactionCount = expenses.length;
  
  const largestExpense = expenses.length > 0 
    ? [...expenses].sort((a, b) => safeNumber(b.amount) - safeNumber(a.amount))[0] 
    : { amount: 0, description: "N/A", date: new Date().toISOString() };

  const monthlyExpensesMap = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const month = date.toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + safeNumber(expense.amount);
    return acc;
  }, {});

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyExpenses = monthNames.map(month => ({
    month,
    amount: monthlyExpensesMap[month] || 0,
  }));

  const activeMonthsCount = monthlyExpenses.filter(m => m.amount > 0).length;
  const averageMonthlySpending = activeMonthsCount > 0 ? totalSpending / activeMonthsCount : 0;

  // Month-over-Month calculation
  const currentDate = new Date();
  const currentMonthIdx = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + safeNumber(e.amount), 0);

  const lastMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
  const lastMonthYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonthIdx && d.getFullYear() === lastMonthYear;
  }).reduce((sum, e) => sum + safeNumber(e.amount), 0);

  let momChange = 0;
  if (lastMonthExpenses === 0) {
    momChange = currentMonthExpenses > 0 ? 100 : 0;
  } else {
    momChange = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
  }

  // Categories
  const categoriesMap = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + safeNumber(expense.amount);
    return acc;
  }, {});

  const categoryColors = {
    Food: "#FF6384",
    Shopping: "#36A2EB",
    Housing: "#FFCE56",
    Transport: "#4BC0C0",
    Entertainment: "#9966FF",
    Utilities: "#FF9F40",
    Healthcare: "#8ED1FC",
    Education: "#FFD166",
    Travel: "#06D6A0",
    Other: "#EF476F"
  };

  const topCategories = Object.keys(categoriesMap)
    .map(category => ({
      name: category,
      value: categoriesMap[category],
      color: categoryColors[category] || "#CCCCCC"
    }))
    .sort((a, b) => b.value - a.value);
    
  const highestCategory = topCategories.length > 0 ? topCategories[0] : { name: "N/A", value: 0 };
  const highestMonth = [...monthlyExpenses].sort((a, b) => b.amount - a.amount)[0];

  // Payment Methods
  const paymentMethodsMap = expenses.reduce((acc, expense) => {
    acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + safeNumber(expense.amount);
    return acc;
  }, {});

  const paymentMethodColors = {
    "Credit Card": "#36A2EB",
    "Debit Card": "#FF6384",
    "Cash": "#FFCE56",
    "Online Transfer": "#4BC0C0",
    "Mobile Wallet": "#9966FF"
  };

  const paymentMethods = Object.keys(paymentMethodsMap)
    .map(method => ({
      method,
      amount: paymentMethodsMap[method],
      color: paymentMethodColors[method] || "#CCCCCC"
    }))
    .sort((a, b) => b.amount - a.amount);

  const getFinancialProfile = (average) => {
    if (average === 0) return { label: "New User", color: "text-gray-600", bgColor: "bg-gray-100" };
    if (average < 5000) return { label: "Saver", color: "text-emerald-600", bgColor: "bg-emerald-100" };
    if (average < 15000) return { label: "Balanced", color: "text-blue-600", bgColor: "bg-blue-100" };
    return { label: "Spender", color: "text-rose-600", bgColor: "bg-rose-100" };
  };

  const profile = getFinancialProfile(averageMonthlySpending);
  
  // Recent 5 transactions
  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg">
          <p className="font-semibold text-gray-700 mb-1">{label}</p>
          <p className="text-lg font-bold text-indigo-600">₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your financial insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-indigo-600" />
              Financial Dashboard
            </h1>

            <div className="flex md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 pt-2 space-y-1">
              <button onClick={() => {setActiveTab("overview"); setMobileMenuOpen(false);}} className={`block w-full text-left px-4 py-2 rounded ${activeTab === "overview" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600"}`}>Overview</button>
              <button onClick={() => {setActiveTab("categories"); setMobileMenuOpen(false);}} className={`block w-full text-left px-4 py-2 rounded ${activeTab === "categories" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600"}`}>Categories</button>
              <button onClick={() => {setActiveTab("payments"); setMobileMenuOpen(false);}} className={`block w-full text-left px-4 py-2 rounded ${activeTab === "payments" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600"}`}>Payment Methods</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs - Desktop */}
        <div className="hidden md:flex border-b border-gray-200 mb-8 space-x-8">
          <button onClick={() => setActiveTab("overview")} className={`pb-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Overview</button>
          <button onClick={() => setActiveTab("categories")} className={`pb-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "categories" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Categories</button>
          <button onClick={() => setActiveTab("payments")} className={`pb-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "payments" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Payment Methods</button>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No expenses found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven&apos;t logged any expenses yet. Start tracking your spending to unlock powerful financial insights and analytics here.</p>
          </div>
        ) : (
          <>
            {/* 6-Grid Stats - Top Notch Observability */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Stat 1: Total Spent */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-gray-900">₹{totalSpending.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <IndianRupeeIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  {momChange > 0 ? (
                    <span className="text-rose-600 flex items-center font-medium"><TrendingUp className="w-4 h-4 mr-1" /> +{momChange.toFixed(1)}%</span>
                  ) : momChange < 0 ? (
                    <span className="text-emerald-600 flex items-center font-medium"><TrendingDown className="w-4 h-4 mr-1" /> {momChange.toFixed(1)}%</span>
                  ) : (
                    <span className="text-gray-500 flex items-center font-medium"> 0.0%</span>
                  )}
                  <span className="text-gray-500 ml-2">vs last month</span>
                </div>
              </div>

              {/* Stat 2: Monthly Average */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Monthly Average</p>
                    <p className="text-3xl font-bold text-gray-900">₹{averageMonthlySpending.toFixed(2)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${profile.bgColor}`}>
                    <Activity className={`w-6 h-6 ${profile.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${profile.bgColor} ${profile.color}`}>
                    {profile.label} Profile
                  </span>
                  <span className="text-sm text-gray-500">Based on history</span>
                </div>
              </div>

              {/* Stat 3: Transaction Count */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900">{transactionCount}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <List className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500">Across {activeMonthsCount} active {activeMonthsCount === 1 ? 'month' : 'months'}</span>
                </div>
              </div>

              {/* Stat 4: Largest Single Expense */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Largest Single Expense</p>
                    <p className="text-2xl font-bold text-gray-900 truncate max-w-[180px]">₹{safeNumber(largestExpense.amount).toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 flex flex-col text-sm">
                  <span className="font-medium text-gray-800 truncate">{largestExpense.description}</span>
                  <span className="text-gray-500">{new Date(largestExpense.date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stat 5: Top Category */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Top Category</p>
                    <p className="text-2xl font-bold text-gray-900">{highestCategory.name}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <PieChartIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-medium text-gray-800">₹{highestCategory.value.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">
                    {totalSpending > 0 ? ((highestCategory.value / totalSpending) * 100).toFixed(1) : 0}% of total
                  </span>
                </div>
              </div>

              {/* Stat 6: Highest Spend Month */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Highest Spend Month</p>
                    <p className="text-2xl font-bold text-gray-900">{highestMonth?.month || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="font-medium text-gray-800">₹{(highestMonth?.amount || 0).toFixed(2)}</span>
                  <span className="text-gray-500 ml-2">Total for month</span>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Annual Spending Trend</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, dy: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} width={60} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColors[tx.category] || '#CCC'}20` }}>
                            <ShoppingBag className="w-5 h-5" style={{ color: categoryColors[tx.category] || '#CCC' }} />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-gray-900">₹{safeNumber(tx.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {recentTransactions.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent transactions.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8">Category Breakdown</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="h-80 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategories}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={130}
                          paddingAngle={2}
                        >
                          {topCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm text-gray-500 font-medium">Total</span>
                      <span className="text-2xl font-bold text-gray-900">₹{totalSpending.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribution Overview</h3>
                    <ul className="space-y-4">
                      {topCategories.map((category, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-4 h-4 rounded-full mr-4" style={{ backgroundColor: category.color }}></div>
                          <div className="flex-1 flex justify-between items-center">
                            <span className="font-medium text-gray-700">{category.name}</span>
                            <div className="text-right">
                              <span className="block font-bold text-gray-900">₹{category.value.toFixed(2)}</span>
                              <span className="text-sm text-gray-500">
                                {totalSpending > 0 ? ((category.value / totalSpending) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8">Payment Methods</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentMethods} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} />
                        <YAxis type="category" dataKey="method" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 14, fontWeight: 500 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={32}>
                          {paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Method Insights</h3>
                      <p className="text-gray-600 mb-6">
                        {paymentMethods.length > 0 ?
                          `You rely primarily on ${paymentMethods[0].method}, which accounts for ${totalSpending > 0 ? ((paymentMethods[0].amount / totalSpending) * 100).toFixed(1) : 0}% of all your transactions.` :
                          "No payment data available."
                        }
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500 mb-1">Active Methods</p>
                          <p className="text-2xl font-bold text-gray-900">{paymentMethods.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500 mb-1">Top Method</p>
                          <p className="text-2xl font-bold text-gray-900 truncate">{paymentMethods.length > 0 ? paymentMethods[0].method : "N/A"}</p>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {paymentMethods.map((method, index) => (
                        <li key={index} className="flex items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="p-3 rounded-xl mr-4" style={{ backgroundColor: `${method.color}15` }}>
                            <CreditCard style={{ color: method.color }} className="w-6 h-6" />
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <span className="font-bold text-gray-800">{method.method}</span>
                            <div className="text-right">
                              <span className="block font-bold text-gray-900 text-lg">₹{method.amount.toFixed(2)}</span>
                              <span className="text-sm text-gray-500">
                                {totalSpending > 0 ? ((method.amount / totalSpending) * 100).toFixed(1) : 0}% of total
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


SpendingAnalyticsDashboard.propTypes = {
  active: PropTypes.any,
  payload: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any,
  })),
  label: PropTypes.any,
};

export default SpendingAnalyticsDashboard;