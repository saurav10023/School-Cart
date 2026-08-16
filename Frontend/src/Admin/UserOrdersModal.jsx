import { useEffect, useState } from "react";
import {
  X, Loader2, PackageOpen, ChevronLeft, ChevronRight,
  Calendar, CreditCard, AlertCircle, MapPin, Phone,
  Mail, Hash, Truck, Wallet, ShieldCheck, User as UserIcon,
} from "lucide-react";
import API from "../api/axios";

const STATUS_STYLES = {
  placed:     "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-600",
};

const PAYMENT_STYLES = {
  paid:              "bg-green-100 text-green-700",
  pending:           "bg-amber-100 text-amber-700",
  failed:            "bg-red-100 text-red-600",
  refund_initiated:  "bg-orange-100 text-orange-700",
  refund_completed:  "bg-gray-100 text-gray-500",
};

const LIMIT = 10;

const UserOrdersModal = ({ user, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchOrders = async (pageNum) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(
        `/api/v1/admin/users/${user._id}/orders?page=${pageNum}&limit=${LIMIT}`
      );
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const formatAmount = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(amt || 0);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      style={{ "--brand": "37,99,235" }}
    >
      <div
        className="glass-modal w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl
                   max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden relative"
      >
        {/* Ambient blobs inside the modal (subtle, desktop-visible mostly) */}
        <div className="glass-blob glass-blob--1 absolute -top-16 -right-10 w-56 h-56 rounded-full pointer-events-none" />
        <div className="glass-blob glass-blob--2 absolute -bottom-20 -left-10 w-56 h-56 rounded-full pointer-events-none" />

        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 relative">
          <div className="w-10 h-1 rounded-full bg-gray-300/70" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 px-5 py-4 border-b border-white/50">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatar}
              alt=""
              className="w-10 h-10 rounded-xl object-cover border border-white/70 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-gray-900 capitalize truncate">
                {user.username}'s Orders
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {pagination ? `${pagination.total} total order${pagination.total !== 1 ? "s" : ""}` : "Loading…"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass-icon-btn p-2 rounded-lg text-gray-500 hover:text-gray-700 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 skeleton-glass rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-2 text-center">
              <AlertCircle size={26} className="text-red-300" />
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={() => fetchOrders(page)}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2 text-center">
              <PackageOpen size={30} className="text-gray-300" />
              <p className="text-sm text-gray-400">No orders placed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isOpen = expandedId === order._id;
                return (
                  <div
                    key={order._id}
                    className="glass-order-card rounded-2xl overflow-hidden transition-colors"
                  >
                    {/* Summary row — always visible, click to expand */}
                    <button
                      onClick={() => toggleExpand(order._id)}
                      className="w-full text-left p-4 flex items-start justify-between gap-3 flex-wrap"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                          <Hash size={11} />
                          Order #{order.orderNumber}
                          {order.createdByAdmin && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-sans font-semibold text-[10px]">
                              Added by admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                            ${STATUS_STYLES[order.orderStatus] || "bg-gray-100 text-gray-500"}`}
                        >
                          {order.orderStatus}
                        </span>
                        <p className="text-sm font-black text-gray-900">
                          {formatAmount(order.totalAmount)}
                        </p>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/50 pt-3">

                        {/* Payment info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <CreditCard size={13} className="text-gray-400 shrink-0" />
                            <span className="text-gray-500">Payment status:</span>
                            <span
                              className={`font-semibold capitalize px-1.5 py-0.5 rounded-full text-[11px]
                                ${PAYMENT_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-500"}`}
                            >
                              {order.paymentStatus?.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Wallet size={13} className="text-gray-400 shrink-0" />
                            <span className="text-gray-500">Method:</span>
                            <span className="font-semibold text-gray-700 uppercase">
                              {order.paymentMethod}
                            </span>
                          </div>
                          {order.transactionId && (
                            <div className="flex items-center gap-2 text-xs sm:col-span-2">
                              <ShieldCheck size={13} className="text-gray-400 shrink-0" />
                              <span className="text-gray-500">Transaction ID:</span>
                              <span className="font-mono text-gray-700 truncate">{order.transactionId}</span>
                            </div>
                          )}
                          {order.razorpayPaymentId && (
                            <div className="flex items-center gap-2 text-xs sm:col-span-2">
                              <ShieldCheck size={13} className="text-gray-400 shrink-0" />
                              <span className="text-gray-500">Razorpay Payment ID:</span>
                              <span className="font-mono text-gray-700 truncate">{order.razorpayPaymentId}</span>
                            </div>
                          )}
                        </div>

                        {/* Delivery info */}
                        <div className="glass-inset-panel rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                            <Truck size={13} /> Delivery Details
                          </div>
                          {order.customerName && (
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <UserIcon size={12} className="mt-0.5 text-gray-400 shrink-0" />
                              {order.customerName}
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-xs text-gray-600">
                            <MapPin size={12} className="mt-0.5 text-gray-400 shrink-0" />
                            <span>
                              {order.deliveryAddress}, {order.city}
                              {order.pincode ? ` – ${order.pincode}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            {order.phoneNumber}
                          </div>
                          {order.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail size={12} className="text-gray-400 shrink-0" />
                              {order.email}
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">
                            Items ({order.orderItems?.length || 0})
                          </p>
                          {order.orderItems?.map((item, idx) => (
                            <div
                              key={idx}
                              className="glass-item-row flex items-center gap-3 rounded-xl p-2.5"
                            >
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover border border-white/70 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                                  <PackageOpen size={16} className="text-gray-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {item.product?.name || "Product unavailable"}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  Size: {item.size} · Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="text-xs font-bold text-gray-900 shrink-0">
                                {formatAmount(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="relative flex items-center justify-between px-5 py-3 border-t border-white/50 glass-footer">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 disabled:opacity-30 hover:text-blue-600 transition-all px-2 py-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-gray-400 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages || loading}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 disabled:opacity-30 hover:text-blue-600 transition-all px-2 py-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .glass-modal {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 30px 60px -24px rgba(var(--brand),0.4);
        }
        .glass-icon-btn {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-icon-btn:hover { background: rgba(255,255,255,0.85); }

        .glass-order-card {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.7);
        }
        .glass-order-card:hover {
          border-color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.62);
        }

        .glass-inset-panel {
          background: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.6);
        }
        .glass-item-row {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.75);
        }

        .glass-footer {
          background: rgba(255,255,255,0.35);
        }

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

        .glass-blob { filter: blur(50px); opacity: 0.18; pointer-events: none; }
        .glass-blob--1 {
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 16s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 50%, rgba(var(--brand),0.35), rgba(var(--brand),0));
          animation: drift2 14s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-16px, 14px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(14px, -12px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob--1, .glass-blob--2 { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default UserOrdersModal;