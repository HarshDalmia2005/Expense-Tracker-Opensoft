import { Loader, Info, ArrowRight, CheckCircle2, X } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import Toast from '../Message/Toast'

const SmartSettleModal = ({ billId, fetchBills, getBillBalances, ToggleSettleUpModal }) => {
    const [settleBill, setSettleBill] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        fetchSmartSettle()
    }, [billId])

    const settleUpBill = async (billId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/updateBill/${billId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "Paid"
                })
            });
            if(res.status !== 200) {
                showToast("Failed to settle bill", "error");
                return;
            }
            fetchBills();
            getBillBalances();
            showToast("Bill settled successfully!", "success");
            ToggleSettleUpModal();
            setSettleBill([]);
        } catch (error) {
            console.error("Error settling bill:", error);
            showToast("Failed to settle bill", "error");
        }
    };

    const fetchSmartSettle = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/getSmartBillSettle/${billId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            })
            const data = await response.json()
            if (response.ok) {
                setSettleBill(data.settlements || [])
            } else {
                setError(data.message || "Failed to fetch settlement data")
                console.error("Error fetching smart settle data:", data.message)
            }
        } catch (error) {
            setError("An unexpected error occurred")
            console.error("Error fetching smart settle data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn text-center">
                    <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-lg font-medium text-gray-900">Calculating optimal settlements...</p>
                    <p className="mt-1 text-sm text-gray-500">Minimizing total transactions</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="fixed top-4 right-4 left-4 flex flex-col items-end pointer-events-none">
                {toasts.map(toast => (
                    <div className="pointer-events-auto" key={toast.id}>
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
            
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <CheckCircle2 className="w-6 h-6 mr-2 text-indigo-600" />
                        Smart Settlement Plan
                    </h2>
                    <button
                        onClick={() => ToggleSettleUpModal()}
                        className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-1.5 rounded-full transition-colors border border-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-4 flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <X className="h-5 w-5 text-rose-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-rose-800">
                                    {error}
                                </p>
                            </div>
                        </div>
                    ) : settleBill.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                            <h3 className="text-lg font-bold text-gray-900">All Settled Up!</h3>
                            <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">No settlements needed for this bill. Everyone has paid their fair share.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Info className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-indigo-900">
                                        Our algorithm has calculated the most efficient way to settle this bill, minimizing the total number of transactions required.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Required Transactions</h3>
                                <div className="space-y-3">
                                    {settleBill?.map((settlement, index) => (
                                        <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-3 truncate flex-1 pr-4">
                                                <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-sm truncate max-w-[120px]">
                                                    {settlement?.from}
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-sm truncate max-w-[120px]">
                                                    {settlement?.to}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-lg font-bold text-gray-900 font-mono">₹{settlement?.amount}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
                    <button
                        onClick={() => ToggleSettleUpModal()}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                    {settleBill.length > 0 && (
                        <button
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
                            onClick={() => settleUpBill(billId)}
                        >
                            Mark as Settled
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SmartSettleModal