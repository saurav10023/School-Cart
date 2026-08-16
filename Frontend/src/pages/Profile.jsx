import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  User, Phone, Mail, Package, ChevronRight,
  ShoppingBag, Clock, CheckCircle, Truck, XCircle,
  AlertCircle, Pencil, X, Check, Camera, Loader2,
  Lock, Eye, EyeOff, MapPin, Plus, Trash2, Star
} from "lucide-react";
import API from "../api/axios";

/* ─────────────────────────────────────────────────────────
   Liquid Glass tokens — brand kept as the site's existing blue
   (blue-600 #2563EB / blue-500 #3B82F6), everything else follows
   the standard liquid-glass recipe.
   Add once, globally, alongside your other font links:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
   ───────────────────────────────────────────────────────── */
const GlassStyles = () => (
  <style>{`
    .lg-root {
      --brand: 37, 99, 235;      /* blue-600 */
      --brand-2: 59, 130, 246;   /* blue-500 */
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .lg-display { font-family: 'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif; }

    .lg-blobs { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
    .lg-blob {
      position: absolute; border-radius: 9999px; filter: blur(64px);
      opacity: 0.35; will-change: transform;
    }
    .lg-blob-1 { width: 480px; height: 480px; top: -160px; left: -140px;
      background: radial-gradient(circle, rgba(var(--brand),0.55), transparent 70%);
      animation: lg-drift-1 16s ease-in-out infinite; }
    .lg-blob-2 { width: 420px; height: 420px; bottom: -140px; right: -120px;
      background: radial-gradient(circle, rgba(var(--brand-2),0.5), transparent 70%);
      animation: lg-drift-2 14s ease-in-out infinite; }
    .lg-blob-3 { width: 320px; height: 320px; top: 40%; right: 10%;
      background: radial-gradient(circle, rgba(var(--brand),0.35), transparent 70%);
      animation: lg-drift-3 17s ease-in-out infinite; }

    @keyframes lg-drift-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.08); } }
    @keyframes lg-drift-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-35px) scale(1.1); } }
    @keyframes lg-drift-3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,25px) scale(0.94); } }

    .glass-card {
      position: relative;
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 26px -14px rgba(var(--brand),0.3),
                  inset 0 1px 0 rgba(255,255,255,0.85);
    }
    .glass-tile {
      background: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .glass-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 7px 14px; border-radius: 999px;
      font-weight: 600; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.35),
                  inset 0 1px 0 rgba(255,255,255,0.9);
      color: rgb(30,64,175);
    }
    .glass-dot { width: 6px; height: 6px; border-radius: 999px; background: rgb(var(--brand)); box-shadow: 0 0 8px rgba(var(--brand),0.8); }

    .glass-icon-chip {
      background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand-2),0.08));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
    }

    .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
    .glass-shine::after {
      content: ""; position: absolute; top: 0; left: -60%;
      width: 40%; height: 100%;
      background: linear-gradient(115deg, transparent, rgba(255,255,255,0.65), transparent);
      transform: skewX(-18deg);
      transition: left 0.75s ease;
      pointer-events: none;
    }
    .glass-shine:hover::after { left: 130%; }

    .glass-btn-primary {
      background: linear-gradient(135deg, rgba(var(--brand),0.92), rgba(var(--brand-2),0.92));
      border: 1px solid rgba(255,255,255,0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.55), inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .glass-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 26px -10px rgba(var(--brand),0.6), inset 0 1px 0 rgba(255,255,255,0.4); }
    .glass-btn-secondary {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .glass-btn-secondary:hover { background: rgba(255,255,255,0.8); transform: translateY(-1px); }

    .lg-reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .lg-reveal.lg-in-view { opacity: 1; transform: translateY(0); }

    @media (prefers-reduced-motion: reduce) {
      .lg-blob, .lg-reveal { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
    }
  `}</style>
);

/* Lightweight scroll-reveal wrapper (fade + rise, one-time, respects reduced motion) */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lg-reveal ${inView ? "lg-in-view" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

const STATUS_STYLES = {
  placed:     { color: "bg-blue-100 text-blue-700",    icon: <Clock size={13} />,        label: "Placed" },
  processing: { color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle size={13} />, label: "Processing" },
  shipped:    { color: "bg-purple-100 text-purple-700", icon: <Truck size={13} />,       label: "Shipped" },
  delivered:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle size={13} />, label: "Delivered" },
  cancelled:  { color: "bg-red-100 text-red-700",      icon: <XCircle size={13} />,     label: "Cancelled" },
};

const PAYMENT_STATUS = {
  pending:          { color: "bg-yellow-100 text-yellow-600", label: "Payment Pending" },
  paid:             { color: "bg-green-100 text-green-600",   label: "Paid" },
  failed:           { color: "bg-red-100 text-red-600",       label: "Payment Failed" },
  refund_initiated: { color: "bg-orange-100 text-orange-600", label: "Refund Initiated" },
};

const EMPTY_ADDRESS = { name: "", phone: "", fullAddress: "", isDefault: false };

export default function Profile() {
  const { user, setUser } = useAuth();

  const [orders, setOrders]               = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError]     = useState("");

  const [isEditing, setIsEditing]         = useState(false);
  const [editData, setEditData]           = useState({ username: "", email: "", mobileNumber: "" });
  const [editLoading, setEditLoading]     = useState(false);
  const [editError, setEditError]         = useState("");
  const [editSuccess, setEditSuccess]     = useState("");

  const [avatarLoading, setAvatarLoading] = useState(false);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData]   = useState({ oldPassword: "", newPassword: "" });
  const [showOld, setShowOld]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Address state
  const [addresses, setAddresses]         = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [newAddress, setNewAddress]       = useState(EMPTY_ADDRESS);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressError, setAddressError]   = useState("");
  const [deletingId, setDeletingId]       = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get("/api/v1/orders/my-orders");
        setOrders(res.data.data || []);
      } catch (err) {
        setOrdersError(err.response?.data?.message || "Failed to fetch orders");
      } finally {
        setLoadingOrders(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await API.get("/api/v1/users/addresses");
        setAddresses(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch addresses", err);
      } finally {
        setAddressLoading(false);
      }
    };
    if (user) fetchAddresses();
  }, [user]);

  const handleEditStart = () => {
    setEditData({
      username: user.username || "",
      email: user.email || "",
      mobileNumber: user.mobileNumber || ""
    });
    setEditError("");
    setEditSuccess("");
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError("");
    setEditSuccess("");
  };

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) setEditData({ ...editData, mobileNumber: val });
  };

  const isMobileValid = editData.mobileNumber.length === 10 && /^[0-9]{10}$/.test(editData.mobileNumber);

  const handleEditSave = async () => {
    if (!isMobileValid) {
      setEditError("Please enter a valid 10-digit mobile number");
      return;
    }
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const res = await API.patch("/api/v1/users/update-account", {
        username: editData.username,
        email: editData.email,
        mobileNumber: editData.mobileNumber
      });
      setUser(res.data.data);
      setEditSuccess("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Mobile number or email already in use") {
        setEditError("This mobile number or email is already linked to another account.");
      } else {
        setEditError(message || "Update failed. Please try again.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await API.patch("/api/v1/users/update-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(res.data.data);
    } catch (err) {
      console.error("Avatar update failed", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordError("Both fields are required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordError("New password cannot be same as old password");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await API.post("/api/v1/users/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess("Password changed successfully");
      setPasswordData({ oldPassword: "", newPassword: "" });
      setShowPasswordSection(false);
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Invalid old password") {
        setPasswordError("Your current password is incorrect.");
      } else {
        setPasswordError(message || "Failed to change password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.fullAddress) {
      setAddressError("Name, phone and address are required");
      return;
    }
    if (!/^[0-9]{10}$/.test(newAddress.phone)) {
      setAddressError("Enter a valid 10-digit phone number");
      return;
    }
    setAddingAddress(true);
    setAddressError("");
    try {
      const res = await API.post("/api/v1/users/addresses", newAddress);
      setAddresses(res.data.data);
      setNewAddress(EMPTY_ADDRESS);
      setShowAddForm(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to add address");
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setDeletingId(addressId);
    try {
      const res = await API.delete(`/api/v1/users/addresses/${addressId}`);
      setAddresses(res.data.data);
    } catch (err) {
      console.error("Failed to delete address", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="lg-root min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
        <GlassStyles />
        <div className="lg-blobs"><div className="lg-blob lg-blob-1" /><div className="lg-blob lg-blob-2" /></div>
        <div className="glass-card relative z-10 flex flex-col items-center gap-4 px-10 py-12 rounded-3xl">
          <ShoppingBag size={40} className="text-blue-400" />
          <p className="text-gray-600 text-base font-medium">Please log in to view your profile.</p>
          <Link to="/login" className="glass-shine glass-btn-primary px-5 py-2 text-white text-sm font-semibold rounded-xl">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-8 px-4 relative overflow-hidden">
      <GlassStyles />
      <div className="lg-blobs">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">

        {/* Profile Card */}
        <Reveal>
          <div className="glass-card rounded-3xl overflow-hidden">

            {/* Banner */}
            <div className="h-24 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-500/90" />
              <div className="absolute inset-0 backdrop-blur-sm" />
            </div>

            <div className="px-6 pb-6">

              {/* Avatar + Edit Button */}
              <div className="flex items-end justify-between -mt-12 mb-5">
                <div className="relative">
                  <div className="glass-card w-20 h-20 rounded-2xl overflow-hidden !border-4 !border-white/80 flex items-center justify-center">
                    {avatarLoading ? (
                      <Loader2 size={24} className="text-blue-500 animate-spin" />
                    ) : user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-blue-300" />
                    )}
                  </div>
                  <label className="glass-btn-primary absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer">
                    <Camera size={12} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>

                {!isEditing ? (
                  <button onClick={handleEditStart}
                    className="glass-shine glass-btn-secondary flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-blue-700 rounded-lg">
                    <Pencil size={13} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleEditCancel}
                      className="glass-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 rounded-lg">
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={handleEditSave} disabled={editLoading}
                      className="glass-shine glass-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60">
                      {editLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      {editLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* Eyebrow + Name + Role */}
              <div className="mb-5">
                <div className="glass-pill mb-3">
                  <span className="glass-dot" />
                  Account
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="lg-display text-xl font-semibold text-gray-900 capitalize">{user.username}</h2>
                  {user.role === "admin" && (
                    <span className="glass-tile px-2 py-0.5 text-purple-700 text-xs font-semibold rounded-full">Admin</span>
                  )}
                </div>
              </div>

              {/* Feedback messages */}
              {editError && (
                <div className="glass-tile flex items-center gap-2 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                  <AlertCircle size={15} /> {editError}
                </div>
              )}
              {editSuccess && (
                <div className="glass-tile flex items-center gap-2 text-green-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                  <CheckCircle size={15} /> {editSuccess}
                </div>
              )}
              {passwordSuccess && (
                <div className="glass-tile flex items-center gap-2 text-green-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                  <CheckCircle size={15} /> {passwordSuccess}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Mobile */}
                <div className="glass-tile rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="glass-icon-chip w-6 h-6 rounded-lg flex items-center justify-center">
                      <Phone size={12} className="text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Mobile</p>
                  </div>
                  {isEditing ? (
                    <div>
                      <input type="text" value={editData.mobileNumber} onChange={handleMobileChange}
                        className={`w-full text-sm font-semibold text-gray-800 bg-white/70 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all
                          ${editData.mobileNumber && !isMobileValid ? "border-red-300 focus:ring-red-400" : "border-white/70 focus:ring-blue-500"}`} />
                      {editData.mobileNumber && (
                        <p className={`text-xs mt-1 ${isMobileValid ? "text-green-600" : "text-gray-400"}`}>
                          {editData.mobileNumber.length}/10 {isMobileValid && "✓"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">{user.mobileNumber}</p>
                  )}
                </div>

                {/* Email */}
                <div className="glass-tile rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="glass-icon-chip w-6 h-6 rounded-lg flex items-center justify-center">
                      <Mail size={12} className="text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                  </div>
                  {isEditing ? (
                    <input type="email" value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-800 bg-white/70 border border-white/70 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.email || "Not set"}</p>
                  )}
                </div>

                {/* Username — only in edit mode */}
                {isEditing && (
                  <div className="glass-tile rounded-xl px-4 py-3 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="glass-icon-chip w-6 h-6 rounded-lg flex items-center justify-center">
                        <User size={12} className="text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Username</p>
                    </div>
                    <input type="text" value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-800 bg-white/70 border border-white/70 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection);
                    setPasswordError("");
                    setPasswordSuccess("");
                    setPasswordData({ oldPassword: "", newPassword: "" });
                  }}
                  className="glass-btn-secondary flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-blue-700 px-4 py-2 rounded-xl"
                >
                  <Lock size={13} />
                  {showPasswordSection ? "Cancel Password Change" : "Change Password"}
                </button>

                {showPasswordSection && (
                  <div className="glass-tile mt-3 rounded-xl px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Lock size={13} className="text-blue-600" /> Change Password
                    </p>

                    {passwordError && (
                      <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                        <AlertCircle size={13} /> {passwordError}
                      </div>
                    )}

                    <div className="relative">
                      <input type={showOld ? "text" : "password"} placeholder="Current password"
                        value={passwordData.oldPassword}
                        onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        className="w-full pr-10 pl-3 py-2.5 border border-white/70 rounded-xl text-sm text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      <button type="button" onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="relative">
                      <input type={showNew ? "text" : "password"} placeholder="New password (min. 6 characters)"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full pr-10 pl-3 py-2.5 border border-white/70 rounded-xl text-sm text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {passwordData.newPassword && (
                      <p className={`text-xs pl-1 ${passwordData.newPassword.length >= 6 ? "text-green-600" : "text-gray-400"}`}>
                        {passwordData.newPassword.length >= 6 ? "Strong enough ✓" : `${passwordData.newPassword.length}/6 minimum`}
                      </p>
                    )}

                    <button onClick={handleChangePassword}
                      disabled={passwordLoading || passwordData.newPassword.length < 6}
                      className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                      {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </Reveal>

        {/* ── Saved Addresses ── */}
        <Reveal delay={100}>
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/60">
              <div>
                <div className="glass-pill mb-2">
                  <span className="glass-dot" />
                  Addresses
                </div>
                <div className="flex items-center gap-2">
                  <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <h3 className="lg-display text-base font-semibold text-gray-900">Saved Addresses</h3>
                </div>
              </div>
              {addresses.length < 5 && (
                <button
                  onClick={() => { setShowAddForm(!showAddForm); setAddressError(""); setNewAddress(EMPTY_ADDRESS); }}
                  className="glass-shine glass-btn-secondary flex items-center gap-1.5 text-xs font-semibold text-blue-700 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={13} />
                  {showAddForm ? "Cancel" : "Add New"}
                </button>
              )}
            </div>

            <div className="px-6 py-4 space-y-3">

              {/* Add Address Form */}
              {showAddForm && (
                <div className="glass-tile rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-600" /> New Address
                  </p>

                  {addressError && (
                    <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                      <AlertCircle size={13} /> {addressError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={newAddress.name}
                      onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-white/70 rounded-xl text-sm text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Phone number"
                      value={newAddress.phone}
                      onChange={e => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/, "") })}
                      className="w-full px-3 py-2.5 border border-white/70 rounded-xl text-sm text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <textarea
                    placeholder="House / Flat no., Street, Area, City, State, Pincode"
                    value={newAddress.fullAddress}
                    onChange={e => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-white/70 rounded-xl text-sm text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />

                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-xs font-semibold text-gray-600">Set as default address</span>
                  </label>

                  <button
                    onClick={handleAddAddress}
                    disabled={addingAddress}
                    className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    {addingAddress
                      ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                      : <><Check size={14} /> Save Address</>}
                  </button>
                </div>
              )}

              {/* Address List */}
              {addressLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="glass-tile h-20 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 && !showAddForm ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <MapPin size={32} className="text-blue-200" />
                  <p className="text-gray-400 text-sm font-medium">No saved addresses</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    Add your first address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr._id}
                      className={`glass-tile relative flex items-start justify-between gap-3 p-4 rounded-xl
                        ${addr.isDefault ? "!bg-blue-50/60" : ""}`}
                    >
                      <div className="flex gap-3 min-w-0">
                        <div className="glass-icon-chip mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin size={15} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-800">{addr.name}</p>
                            {addr.isDefault && (
                              <span className="glass-pill !py-0.5 !px-2 !text-[10px]">
                                <Star size={10} fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{addr.fullAddress}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        disabled={deletingId === addr._id}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50/70 transition-colors disabled:opacity-50"
                      >
                        {deletingId === addr._id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  ))}

                  {addresses.length >= 5 && (
                    <p className="text-xs text-center text-gray-400">
                      Maximum 5 addresses reached
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Orders Section */}
        <Reveal delay={200}>
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/60">
              <div>
                <div className="glass-pill mb-2">
                  <span className="glass-dot" />
                  Orders
                </div>
                <div className="flex items-center gap-2">
                  <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                    <Package size={14} className="text-blue-600" />
                  </div>
                  <h3 className="lg-display text-base font-semibold text-gray-900">My Orders</h3>
                </div>
              </div>
              {orders.length > 0 && (
                <span className="text-xs font-semibold text-gray-400">
                  {orders.length} order{orders.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="px-6 py-4">
              {loadingOrders ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="glass-tile h-20 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : ordersError ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50/80 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={16} /> {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <ShoppingBag size={36} className="text-blue-200" />
                  <p className="text-gray-400 text-sm font-medium">No orders yet</p>
                  <Link to="/" className="glass-shine glass-btn-primary px-4 py-1.5 text-white text-xs font-semibold rounded-lg">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.placed;
                    const payment = PAYMENT_STATUS[order.paymentStatus];
                    const showPaymentBadge = order.paymentMethod === "online" && order.paymentStatus !== "paid";

                    return (
                      <Link to={`/orders/${order._id}`} key={order._id}
                        className="glass-tile glass-shine flex items-center justify-between p-4 rounded-xl transition-all duration-200 group hover:!bg-blue-50/60">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-800">
                              Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            </p>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                            {showPaymentBadge && payment && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${payment.color}`}>
                                {payment.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </span>
                            <span>·</span>
                            <span>{order.orderItems?.length} item{order.orderItems?.length > 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span className="capitalize">{order.paymentMethod === "cod" ? "COD" : "Online"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-gray-900">₹{order.totalAmount}</p>
                          <ChevronRight size={16} className="text-blue-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}