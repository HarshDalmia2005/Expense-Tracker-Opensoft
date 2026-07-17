import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  PlusCircle,
  FileText,
  X,
  Pencil,
  Trash,
  CreditCard,
  Calculator,
  IndianRupeeIcon,
  Users
} from "lucide-react";
import Toast from "../Message/Toast";
import { ConfirmModal } from "../Message/ConfirmModal";
import SmartSettleModal from "./SmartSettleModal";

const BillDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [billDescription, setBillDescription] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [payers, setPayers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [balances, setBalances] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [isSmartSettleModalOpen, setIsSmartSettleModalOpen] = useState(false);

  const openUpdateModal = (bill) => {
    setCurrentBill(bill);
    setIsUpdateModalOpen(true);
  };

  const openConfirmModal = (message, action) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => {
        action();
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
      }
    });
  };

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchBills();
    fetchGroupMembers();
    getBillBalances();
  }, [groupId]);

  const fetchBills = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/getBills/${groupId}`);
      setBills(res.data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setBills([]);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/getGroup/${groupId}`);
      setGroupMembers(res.data.users || []);
    } catch (error) {
      console.error("Error fetching group members:", error);
    }
  };

  const togglePayer = (memberId) => {
    const exists = payers.find((payer) => payer.userId === memberId);
    if (exists) {
      setPayers(payers.filter((payer) => payer.userId !== memberId));
    } else {
      setPayers([...payers, { userId: memberId, amountPaid: 0 }]);
    }
  };

  const updatePayerAmount = (memberId, amount) => {
    setPayers(
      payers.map((payer) =>
        payer.userId === memberId ? { ...payer, amountPaid: parseFloat(amount) || 0 } : payer
      )
    );
  };

  const getName = (id) => {
    const member = groupMembers.find((member) => member._id === id);
    return member ? member.name : "Unknown";
  };

  const addBill = async () => {
    if (!billDescription || !billAmount || payers.length === 0) {
      showToast("Please fill all fields, select at least one payer and participant.", "warning");
      return;
    }

    const totalPaid = payers.reduce((sum, payer) => sum + payer.amountPaid, 0);
    if (totalPaid !== parseFloat(billAmount)) {
      showToast("Total paid amount does not match the bill amount.", "warning");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/createBill`, {
        group: groupId,
        description: billDescription,
        amount: billAmount,
        payers,
        participants: groupMembers,
      });

      // Fetch the updated, populated list of bills from the server
      fetchBills();
      
      setBillDescription("");
      setBillAmount("");
      setPayers([]);
      setSelectedParticipants([]);
      setIsModalOpen(false);
      showToast(res.data.message, 'success');
      getBillBalances();
    } catch (error) {
      console.error("Error adding bill:", error);
      showToast(error.response?.data?.message || "Error adding bill", 'error');
    }
  };

  const deleteBill = async (billId) => {
    openConfirmModal("Are you sure you want to delete this bill?", async () => {
      try {
        let res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/deleteBill/${billId}`);
        fetchBills();
        showToast(res.data.message, 'success');
        getBillBalances();
      } catch (error) {
        console.error("Error deleting bill:", error);
      }
    });
  };

  const updateBill = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/updateBill/${currentBill._id}`, currentBill);
      setIsUpdateModalOpen(false);
      fetchBills();
      showToast("Bill updated successfully!", "success");
      getBillBalances();
    } catch (error) {
      console.error("Error updating bill:", error);
      showToast("Failed to update bill", "error");
    }
  };

  const getBillBalances = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/getBalances/${groupId}?userId=${user?._id}`);
      setBalances(res.data);
    } catch (error) {
      console.error("Error fetching bill balances:", error);
    }
  };

  const ToggleSettleUpModal = async (bill = null) => {
    if(bill) setCurrentBill(bill);
    setIsSmartSettleModalOpen(!isSmartSettleModalOpen);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
      />
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                Group Expenses
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> 
                <span className="hidden sm:inline">Add Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Balance Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Balance Summary</h2>
            {balances?.net !== undefined ? (
              <div className="flex items-center">
                <div className={`p-3 rounded-xl mr-4 ${balances.net >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <Calculator className={`w-6 h-6 ${balances.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <div>
                  <div className={`text-3xl font-bold ${balances.net >= 0 ? 'text-emerald-600' : 'text-rose-600'} tracking-tight`}>
                    {balances.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balances.net))}
                  </div>
                  <div className="text-gray-500 font-medium">
                    {balances.net >= 0 ? 'You are owed in total' : 'You owe in total'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading balance...</div>
            )}
          </div>
          
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center gap-3 self-stretch">
            <div className="bg-indigo-50 p-2 rounded-full">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Group Members</p>
              <p className="font-bold text-gray-900">{groupMembers.length}</p>
            </div>
          </div>
        </div>

        {/* Bill List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No bills yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">It looks quiet here. Add your first shared expense to start splitting the costs.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {bills.map((bill) => (
                <li key={bill._id} className="p-3 sm:p-4 hover:bg-gray-50/80 transition-colors duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-gray-900 truncate">{bill.description}</p>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                          {bill.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1 truncate">
                          <span className="font-medium text-gray-700 flex-shrink-0">Paid by:</span>
                          <span className="truncate" title={bill?.payers?.map((payer) => `${payer.userId?.name || 'Unknown'} (${formatCurrency(payer.amountPaid)})`).join(', ')}>
                            {bill?.payers?.map((payer) => `${payer.userId?.name || 'Unknown'} (${formatCurrency(payer.amountPaid)})`).join(', ')}
                          </span>
                        </div>
                        <div className="hidden sm:block text-gray-300">•</div>
                        <div className="flex items-center gap-1 truncate">
                          <span className="font-medium text-gray-700 flex-shrink-0">Split among:</span>
                          <span className="truncate" title={bill?.participants?.map((p) => p.name || 'Unknown').join(', ')}>
                            {bill?.participants?.map((p) => p.name || 'Unknown').join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex-shrink-0">
                      <p className="text-base font-bold text-indigo-600 sm:mr-1">{formatCurrency(bill.amount)}</p>
                      
                      <div className="flex items-center gap-1.5">
                        {bill.status !== 'Paid' && (
                          <button
                            onClick={() => ToggleSettleUpModal(bill)}
                            className="bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 py-1 px-2 text-xs rounded-md transition-colors font-medium flex items-center space-x-1 shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Settle</span>
                          </button>
                        )}
                        <button
                          onClick={() => openUpdateModal(bill)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBill(bill._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Add New Bill</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner at Joe's, Airbnb"
                  value={billDescription}
                  onChange={(e) => setBillDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Who Paid?</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 rounded-lg border border-gray-100 p-2">
                  {groupMembers.map((member) => (
                    <div key={member._id} className="flex items-center justify-between bg-white border border-gray-100 hover:border-indigo-100 p-3 rounded-lg shadow-sm transition-colors">
                      <label className="flex items-center space-x-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          onChange={() => togglePayer(member._id)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-800">{member.name}</span>
                      </label>
                      <input
                        type="number"
                        className={`w-28 p-2 border rounded-lg outline-none font-mono text-sm ${!payers.find((p) => p.userId === member._id) ? 'bg-gray-100 border-transparent text-gray-400' : 'bg-white border-indigo-300 focus:ring-1 focus:ring-indigo-500'}`}
                        placeholder="₹0.00"
                        disabled={!payers.find((p) => p.userId === member._id)}
                        onChange={(e) => updatePayerAmount(member._id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={addBill}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors font-bold shadow-sm"
            >
              Save Bill
            </button>
          </div>
        </div>
      )}

      {/* Update Bill Modal */}
      {isUpdateModalOpen && currentBill && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Update Bill</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="What was this expense for?"
                  value={currentBill.description}
                  onChange={(e) => setCurrentBill({ ...currentBill, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={currentBill.amount}
                  onChange={(e) => setCurrentBill({ ...currentBill, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Who Paid?</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 rounded-lg border border-gray-100 p-2">
                  {groupMembers.map((member) => {
                    const payerIndex = currentBill.payers.findIndex((p) => p.userId._id === member._id);
                    const payer = payerIndex !== -1 ? currentBill.payers[payerIndex] : null;

                    return (
                      <div key={member._id} className="flex items-center justify-between bg-white border border-gray-100 hover:border-indigo-100 p-3 rounded-lg shadow-sm transition-colors">
                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={!!payer}
                            onChange={() => {
                              let updatedPayers = [...currentBill.payers];
                              if (payer) {
                                updatedPayers.splice(payerIndex, 1);
                              } else {
                                updatedPayers.push({ userId: member, amountPaid: 0 });
                              }
                              setCurrentBill({ ...currentBill, payers: updatedPayers });
                            }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="font-medium text-gray-800">{member.name}</span>
                        </label>
                        <input
                          type="number"
                          className={`w-28 p-2 border rounded-lg outline-none font-mono text-sm ${!payer ? 'bg-gray-100 border-transparent text-gray-400' : 'bg-white border-indigo-300 focus:ring-1 focus:ring-indigo-500'}`}
                          placeholder="₹0.00"
                          value={payer?.amountPaid || ""}
                          disabled={!payer}
                          onChange={(e) => {
                            let updatedPayers = [...currentBill.payers];
                            updatedPayers[payerIndex] = { ...payer, amountPaid: parseFloat(e.target.value) || 0 };
                            setCurrentBill({ ...currentBill, payers: updatedPayers });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bill Status</label>
                <select
                  value={currentBill.status || "Unpaid"}
                  onChange={(e) => setCurrentBill({ ...currentBill, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-all font-medium"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <button
              onClick={updateBill}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors font-bold shadow-sm"
            >
              Update Details
            </button>
          </div>
        </div>
      )}

      {
        isSmartSettleModalOpen && <SmartSettleModal fetchBills={fetchBills} getBillBalances={getBillBalances} ToggleSettleUpModal={ToggleSettleUpModal} billId={currentBill._id} />
      }

    </div>
  );
};

export default BillDetails;