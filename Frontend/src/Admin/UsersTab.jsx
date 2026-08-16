import { useEffect, useState } from "react";
import {
  Users, ShieldCheck, UserPlus, X, Loader2, AlertCircle,
  Eye, EyeOff, Ban, ShieldOff, RefreshCw, Trash2, Receipt,
  Search, SearchX, ChevronDown,
} from "lucide-react";
import API from "../api/axios";
import ConfirmModal from "./ConfirmModal ";
import UserOrdersModal from "./UserOrdersModal";

/* ─────────────────────────────────────────────
   USERS TAB
───────────────────────────────────────────── */
const UsersTab = ({ showToast }) => {
  const [regularUsers, setRegularUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("users");
  const [actionId, setActionId] = useState(null);
  const [toggleAdminId, setToggleAdminId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [ordersModalUser, setOrdersModalUser] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createData, setCreateData] = useState({
    username: "", password: "", mobileNumber: "", email: "", role: "user"
  });
  const [createError, setCreateError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  // Per-row action menu (mobile) — which row's overflow menu is open
  const [openMenuId, setOpenMenuId] = useState(null);

  const isMobileValid = /^[0-9]{10}$/.test(createData.mobileNumber);
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await API.get("/api/v1/admin/usersearch", {
          params: { query: trimmed, role: view === "users" ? "user" : "admin", limit: 30 },
        });
        setSearchResults(res.data.data.users || []);
        setSearchTotal(res.data.data.pagination?.total ?? 0);
      } catch {
        showToast("Search failed", "error");
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, view]);

  const fetchAll = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        API.get("/api/v1/users/admin/users"),
        API.get("/api/v1/users/admin/admins"),
      ]);
      setRegularUsers(usersRes.data.data || []);
      setAdmins(adminsRes.data.data || []);
    } catch { showToast("Failed to fetch users", "error"); }
    finally { setLoading(false); }
  };

  const updateBoth = (userId, patch) => {
    setRegularUsers(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
    setAdmins(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
    setSearchResults(prev => prev ? prev.map(u => u._id === userId ? { ...u, ...patch } : u) : prev);
  };

  const handleToggleBlock = async (userId) => {
    setActionId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/block`);
      updateBoth(userId, { isBlocked: res.data.data.isBlocked });
      showToast(`User ${res.data.data.isBlocked ? "blocked" : "unblocked"}`, "success");
    } catch { showToast("Failed to update user", "error"); }
    finally { setActionId(null); }
  };

  const handleToggleAdmin = async (userId) => {
    setToggleAdminId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/toggle-admin`);
      const newRole = res.data.data.role;

      if (searchResults) {
        setSearchResults(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      } else if (newRole === "admin") {
        setRegularUsers(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setAdmins(a => [{ ...user, role: "admin" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      } else {
        setAdmins(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setRegularUsers(a => [{ ...user, role: "user" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      }

      showToast(`User ${newRole === "admin" ? "promoted to admin" : "demoted to user"}`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    } finally { setToggleAdminId(null); }
  };

  const handleDelete = async (userId) => {
    try {
      await API.delete(`/api/v1/users/admin/users/${userId}`);
      setRegularUsers(prev => prev.filter(u => u._id !== userId));
      setAdmins(prev => prev.filter(u => u._id !== userId));
      setSearchResults(prev => prev ? prev.filter(u => u._id !== userId) : prev);
      showToast("User deleted", "success");
    } catch { showToast("Failed to delete user", "error"); }
    finally { setConfirm(null); }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { showToast("Enter a new password", "error"); return; }
    try {
      await API.patch(`/api/v1/users/admin/users/${resetModal}/reset-password`, { newPassword });
      showToast("Password reset successfully", "success");
      setResetModal(null);
      setNewPassword("");
    } catch { showToast("Failed to reset password", "error"); }
  };

  const handleCreateUser = async () => {
    if (!createData.username || !createData.password || !createData.mobileNumber) {
      setCreateError("Username, password and mobile number are required");
      return;
    }
    if (!isMobileValid) { setCreateError("Enter a valid 10-digit mobile number"); return; }
    if (createData.password.length < 6) { setCreateError("Password must be at least 6 characters"); return; }

    setCreating(true);
    setCreateError("");
    try {
      const res = await API.post("/api/v1/users/admin/create-user", createData);
      const newUser = res.data.data;
      if (newUser.role === "admin") setAdmins(prev => [newUser, ...prev]);
      else setRegularUsers(prev => [newUser, ...prev]);
      showToast("User created successfully", "success");
      setShowCreateForm(false);
      setCreateData({ username: "", password: "", mobileNumber: "", email: "", role: "user" });
      setView(newUser.role === "admin" ? "admins" : "users");
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create user");
    } finally { setCreating(false); }
  };

  /* ── Shared action list — used by desktop table row menu AND mobile card ── */
  const RowActions = ({ user, dense }) => (
    <div className={dense ? "flex flex-col" : "flex flex-wrap gap-2"}>
      <ActionBtn
        dense={dense}
        icon={<Receipt size={13} />}
        label="View orders"
        tone="teal"
        onClick={() => { setOrdersModalUser(user); setOpenMenuId(null); }}
      />
      <ActionBtn
        dense={dense}
        icon={actionId === user._id ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
        label={user.isBlocked ? "Unblock" : "Block"}
        tone={user.isBlocked ? "green" : "orange"}
        disabled={actionId === user._id}
        onClick={() => { handleToggleBlock(user._id); setOpenMenuId(null); }}
      />
      <ActionBtn
        dense={dense}
        icon={toggleAdminId === user._id
          ? <Loader2 size={13} className="animate-spin" />
          : user.role === "admin" ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
        label={user.role === "admin" ? "Revoke admin" : "Make admin"}
        tone={user.role === "admin" ? "purple" : "indigo"}
        disabled={toggleAdminId === user._id}
        onClick={() => { handleToggleAdmin(user._id); setOpenMenuId(null); }}
      />
      <ActionBtn
        dense={dense}
        icon={<RefreshCw size={13} />}
        label="Reset password"
        tone="blue"
        onClick={() => { setResetModal(user._id); setOpenMenuId(null); }}
      />
      <ActionBtn
        dense={dense}
        icon={<Trash2 size={13} />}
        label="Delete"
        tone="red"
        onClick={() => { setConfirm(user._id); setOpenMenuId(null); }}
      />
    </div>
  );

  if (loading) return (
    <div
      className="space-y-3"
      style={{ "--brand": "37,99,235" }}
    >
      {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton-glass rounded-2xl" />)}
    </div>
  );

  const currentList = view === "users" ? regularUsers : admins;
  const displayList = isSearching ? (searchResults || []) : currentList;

  return (
    <div className="space-y-5" style={{ "--brand": "37,99,235" /* blue-600 */ }}>

      {/* Header row — toggle + create button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 p-1 glass-tabbar rounded-xl w-fit">
          <button
            onClick={() => setView("users")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "users" ? "glass-tab-active text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Users size={14} />
            <span className="hidden xs:inline sm:inline">Users</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "users" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
              {regularUsers.length}
            </span>
          </button>
          <button
            onClick={() => setView("admins")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "admins" ? "glass-tab-active text-purple-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <ShieldCheck size={14} />
            <span className="hidden xs:inline sm:inline">Admins</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "admins" ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"}`}>
              {admins.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(""); }}
          className={`glass-shine flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${showCreateForm ? "glass-btn-neutral text-gray-600" : "glass-btn-primary text-white"}`}
        >
          {showCreateForm ? <><X size={14} /> Cancel</> : <><UserPlus size={14} /> Create user</>}
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <div
          className={`glass-input-wrap flex items-center gap-2 rounded-2xl px-4 py-3 transition-all
            ${isSearching ? "glass-input-wrap--active" : ""}`}
        >
          {searching
            ? <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
            : <Search size={16} className="text-gray-400 shrink-0" />}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${view === "users" ? "users" : "admins"} by name, email, or mobile...`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {isSearching && !searching && (
          <p className="text-xs text-gray-400 mt-2 pl-1">
            {searchTotal === 0 ? "No matches found" : `${searchTotal} match${searchTotal === 1 ? "" : "es"} found`}
          </p>
        )}
      </div>

      {/* ── Create User Form ── */}
      {showCreateForm && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="glass-icon-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <UserPlus size={15} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Create new user</h3>
              <p className="text-xs text-gray-400">No OTP required — admin creates directly</p>
            </div>
          </div>

          {createError && (
            <div className="glass-alert-error flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium">
              <AlertCircle size={13} /> {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={createData.username}
                onChange={e => setCreateData({ ...createData, username: e.target.value })}
                className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Mobile number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                value={createData.mobileNumber}
                onChange={e => setCreateData({ ...createData, mobileNumber: e.target.value.replace(/\D/, "") })}
                className={`glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none transition-all
                  ${createData.mobileNumber && !isMobileValid ? "glass-input-error" : ""}`}
              />
              {createData.mobileNumber && (
                <p className={`text-xs pl-0.5 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                  {createData.mobileNumber.length}/10 {isMobileValid && "✓"}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={createData.password}
                  onChange={e => setCreateData({ ...createData, password: e.target.value })}
                  className="glass-input-wrap w-full px-3 py-2.5 pr-9 rounded-xl text-sm bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePass(!showCreatePass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCreatePass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {createData.password && (
                <p className={`text-xs pl-0.5 ${createData.password.length >= 6 ? "text-green-500" : "text-gray-400"}`}>
                  {createData.password.length >= 6 ? "Strong enough ✓" : `${createData.password.length}/6 minimum`}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Email <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="user@email.com"
                value={createData.email}
                onChange={e => setCreateData({ ...createData, email: e.target.value })}
                className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Role</label>
            <div className="flex gap-3">
              {["user", "admin"].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateData({ ...createData, role: r })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize border-2
                    ${createData.role === r
                      ? r === "admin"
                        ? "border-purple-400 bg-purple-50 text-purple-700"
                        : "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {r === "admin" ? <ShieldCheck size={13} /> : <Users size={13} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateUser}
            disabled={creating}
            className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {creating
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : <><UserPlus size={14} /> Create user</>}
          </button>
        </div>
      )}

      {/* ── List: empty / loading-search / desktop table / mobile cards ── */}
      {isSearching && searching ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 skeleton-glass rounded-2xl" />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16 gap-2 rounded-2xl">
          {isSearching
            ? <SearchX size={28} className="text-gray-300" />
            : view === "admins"
              ? <ShieldCheck size={28} className="text-gray-300" />
              : <Users size={28} className="text-gray-300" />}
          <p className="text-gray-400 text-sm">
            {isSearching ? "No matches for your search" : view === "admins" ? "No admins yet" : "No users yet"}
          </p>
        </div>
      ) : (
        <>
          {/* ── Desktop / tablet: glass data table (md and up) ── */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="glass-thead text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3.5 font-bold">User</th>
                    <th className="px-4 py-3.5 font-bold">Role</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map(user => (
                    <tr key={user._id} className="glass-row-divider hover:bg-white/50 transition-colors align-top">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/70 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 capitalize truncate">{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.mobileNumber} · {user.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                          ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                          ${user.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-gray-400 text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <RowActions user={user} dense={false} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile / small tablet: glass cards with a compact overflow menu (below md) ── */}
          <div className="md:hidden space-y-3">
            {displayList.map(user => (
              <div key={user._id} className="glass-card rounded-2xl p-4 relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 capitalize truncate">{user.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user.mobileNumber}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email || "No email"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                    className="glass-icon-btn shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500"
                    aria-label="Actions"
                  >
                    <ChevronDown size={16} className={`transition-transform ${openMenuId === user._id ? "rotate-180" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                    {user.role === "admin" ? "Admin" : "User"}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${user.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>

                {/* Expandable action list */}
                {openMenuId === user._id && (
                  <div className="mt-3 pt-3 border-t border-white/50">
                    <RowActions user={user} dense />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-black text-gray-900">Reset password</h3>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="glass-input-wrap w-full px-3 py-2.5 pr-10 rounded-xl text-sm bg-transparent focus:outline-none"
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResetModal(null); setNewPassword(""); }}
                className="glass-btn-neutral flex-1 py-2 rounded-xl text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="glass-shine glass-btn-primary flex-1 py-2 text-white rounded-xl text-sm font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message="Delete this user permanently?"
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {ordersModalUser && (
        <UserOrdersModal user={ordersModalUser} onClose={() => setOrdersModalUser(null)} />
      )}

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px -16px rgba(var(--brand),0.28),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }
        .glass-modal {
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 30px 60px -24px rgba(var(--brand),0.4);
        }
        .glass-tabbar {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glass-tab-active {
          background: rgba(255,255,255,0.95);
          box-shadow: 0 4px 12px -6px rgba(var(--brand),0.35);
        }
        .glass-input-wrap {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .glass-input-wrap:focus-within {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.14);
        }
        .glass-input-wrap--active {
          border-color: rgba(var(--brand),0.55);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.14);
        }
        .glass-input-error { border-color: rgba(248,113,113,0.7) !important; }

        .glass-icon-chip {
          background: linear-gradient(150deg, rgba(var(--brand),0.2), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-icon-btn {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-icon-btn:hover { background: rgba(255,255,255,0.85); color: rgb(37,99,235); }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.5);
        }
        .glass-btn-primary:hover:not(:disabled) {
          box-shadow: 0 14px 26px -12px rgba(var(--brand),0.6);
        }
        .glass-btn-neutral {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.85);
        }
        .glass-btn-neutral:hover { background: rgba(255,255,255,0.85); }

        .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
        .glass-shine::after {
          content: ""; position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent);
          transform: skewX(-18deg);
          transition: left 0.75s ease;
          pointer-events: none;
        }
        .glass-shine:hover::after { left: 130%; }

        .glass-alert-error {
          background: rgba(254,242,242,0.75);
          border: 1px solid rgba(252,165,165,0.6);
          color: rgb(185,28,28);
        }

        .glass-thead { background: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.7); }
        .glass-row-divider { border-bottom: 1px solid rgba(255,255,255,0.5); }
        .glass-row-divider:last-child { border-bottom: none; }

        .skeleton-glass {
          background: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.6);
          position: relative;
          overflow: hidden;
        }
        .skeleton-glass::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

/* ── Small pill/menu-row action button, reused in dense (mobile menu) and inline (desktop table) modes ── */
const toneClasses = {
  teal:   "border-teal-200 text-teal-600 hover:bg-teal-50",
  orange: "border-orange-200 text-orange-600 hover:bg-orange-50",
  green:  "border-green-200 text-green-600 hover:bg-green-50",
  purple: "border-purple-200 text-purple-600 hover:bg-purple-50",
  indigo: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
  blue:   "border-blue-200 text-blue-600 hover:bg-blue-50",
  red:    "border-red-200 text-red-500 hover:bg-red-50",
};

const ActionBtn = ({ icon, label, tone, onClick, disabled, dense }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 border rounded-lg font-medium transition-all disabled:opacity-50
      ${dense ? "w-full px-3 py-2.5 text-sm justify-start mb-1.5 last:mb-0" : "text-xs px-2.5 py-1.5"}
      ${toneClasses[tone]}`}
  >
    {icon}
    {label}
  </button>
);

export default UsersTab;