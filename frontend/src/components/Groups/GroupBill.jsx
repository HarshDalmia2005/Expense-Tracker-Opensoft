import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Plus,
  X,
  Clipboard,
  Check,
  Users,
  KeyRound,
  UserPlus,
  RefreshCw,
  Loader,
  Trash2,
  ArrowRight
} from "lucide-react";
import Toast from "../Message/Toast";
import { ConfirmModal } from "../Message/ConfirmModal";

const GroupBill = () => {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });

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
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/getGroups/${user?._id}`);
      setGroups(res.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"))._id;
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/createGroup/${user}`, { name: groupName });
      setGroups([...groups, res.data.group]);
      setGroupName("");
      setIsModalOpen(false);
      showToast("Group created successfully!", "success");
    } catch (error) {
      showToast("Error creating group. Please try again.", "error");
      console.error("Error creating group:", error);
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) return;

    try {
      const userId = JSON.parse(localStorage.getItem("user"))._id;
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/joinGroup`, { inviteCode, userId });
      setGroups([...groups, res.data.group]);
      setInviteCode("");
      setIsJoinModalOpen(false);
      showToast("Joined group successfully!", "success");
    } catch (error) {
      showToast("Error joining group. Please check the invite code.", "error");
      console.error("Error joining group:", error);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteGroup = async (groupId) => {
    openConfirmModal("Are you sure you want to delete this group?", async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/deleteGroup/${groupId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          setGroups(groups.filter(group => group._id !== groupId));
          showToast("Group deleted successfully!", "success");
        } else {
          showToast("Error deleting group. Please try again.", "error");
        }
      } catch (error) {
        showToast("Error deleting group. Please try again.", "error");
        console.error("Error deleting group:", error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading Split Expenses...</p>
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-6 h-6 mr-2 text-indigo-600" />
              Split Expenses
            </h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchGroups}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
                title="Refresh Groups"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Groups</h2>
            <p className="text-gray-500 text-sm mt-1">Manage shared expenses with friends and family</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join Group</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Group</span>
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mt-8">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No groups yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Create a new group or join an existing one to start splitting bills and tracking shared expenses easily.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-all"
              >
                Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 p-2 rounded-full" 
                      onClick={() => deleteGroup(group._id)}
                      title="Delete group"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {group.name}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Invite Code</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-gray-700 bg-gray-100 py-1.5 px-3 rounded-md flex-1 text-center tracking-widest">
                        {group.inviteCode}
                      </code>
                      <button
                        onClick={() => copyInviteCode(group.inviteCode)}
                        className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors border border-gray-200"
                        title="Copy code"
                      >
                        {copiedCode === group.inviteCode ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clipboard className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
                  <Link
                    to={`/groups/${group._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center transition-colors"
                  >
                    View Expenses <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create New Group</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
                <input
                  id="groupName"
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Roommates"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim()}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors shadow-sm ${groupName.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Join a Group</h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="inviteCode" className="block text-sm font-semibold text-gray-700 mb-2">Invite Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter 6-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono tracking-widest uppercase"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={joinGroup}
                  disabled={!inviteCode.trim()}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors shadow-sm ${inviteCode.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupBill;