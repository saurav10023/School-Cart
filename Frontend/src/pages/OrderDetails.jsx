import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, MapPin, Phone, CreditCard,
  Clock, CheckCircle, Truck, XCircle, AlertCircle,
  ShoppingBag, Loader2, Ban, Trash2, FileDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { generateInvoice } from "../utils/generateInvoice.js";

const STATUS_STEPS = ["placed", "processing", "shipped", "delivered"];

const STATUS_STYLES = {
  placed:     { color: "bg-blue-100 text-blue-700",    icon: <Clock size={14} />,        label: "Placed" },
  processing: { color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle size={14} />, label: "Processing" },
  shipped:    { color: "bg-purple-100 text-purple-700", icon: <Truck size={14} />,       label: "Shipped" },
  delivered:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle size={14} />, label: "Delivered" },
  cancelled:  { color: "bg-red-100 text-red-700",      icon: <XCircle size={14} />,     label: "Cancelled" },
};

const PAYMENT_STATUS_STYLES = {
  pending:          "bg-yellow-100 text-yellow-700",
  paid:             "bg-green-100 text-green-700",
  failed:           "bg-red-100 text-red-700",
  refund_initiated: "bg-orange-100 text-orange-700",
};

/* ─────────────────────────────────────────────────────────
   Liquid Glass tokens — same recipe/brand blue as Profile.jsx
   and Products.jsx. Move to a shared stylesheet if you haven't
   already, so it isn't duplicated per file.
   ───────────────────────────────────────────────────────── */
const GlassStyles = () => (
  <style>{`
    .lg-root { --brand: 37, 99, 235; --brand-2: 59, 130, 246; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .lg-display { font-family: 'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif; }

    .lg-blobs { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
    .lg-blob { position: absolute; border-radius: 9999px; filter: blur(64px); opacity: 0.3; will-change: transform; }
    .lg-blob-1 { width: 460px; height: 460px; top: -160px; left: -140px;
      background: radial-gradient(circle, rgba(var(--brand),0.55), transparent 70%);
      animation: lg-drift-1 16s ease-in-out infinite; }
    .lg-blob-2 { width: 400px; height: 400px; top: 35%; right: -140px;
      background: radial-gradient(circle, rgba(var(--brand-2),0.5), transparent 70%);
      animation: lg-drift-2 14s ease-in-out infinite; }
    .lg-blob-3 { width: 340px; height: 340px; bottom: -140px; left: 15%;
      background: radial-gradient(circle, rgba(var(--brand),0.35), transparent 70%);
      animation: lg-drift-3 17s ease-in-out infinite; }
    @keyframes lg-drift-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.08); } }
    @keyframes lg-drift-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-35px) scale(1.1); } }
    @keyframes lg-drift-3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,25px) scale(0.94); } }

    .glass-card {
      background: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 26px -14px rgba(var(--brand),0.3), inset 0 1px 0 rgba(255,255,255,0.85);
    }
    .glass-tile {
      background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.7);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .glass-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px;
      font-weight: 600; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      background: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.35), inset 0 1px 0 rgba(255,255,255,0.9);
      color: rgb(30,64,175);
    }
    .glass-dot { width: 6px; height: 6px; border-radius: 999px; background: rgb(var(--brand)); box-shadow: 0 0 8px rgba(var(--brand),0.8); }

    .glass-icon-chip {
      background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand-2),0.08));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
    }

    .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
    .glass-shine::after {
      content: ""; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
      background: linear-gradient(115deg, transparent, rgba(255,255,255,0.65), transparent);
      transform: skewX(-18deg); transition: left 0.75s ease; pointer-events: none;
    }
    .glass-shine:hover::after { left: 130%; }

    .glass-btn-primary {
      background: linear-gradient(135deg, rgba(var(--brand),0.92), rgba(var(--brand-2),0.92));
      border: 1px solid rgba(255,255,255,0.4); color: white;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.55), inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .glass-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
    .glass-btn-secondary {
      background: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .glass-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.8); transform: translateY(-1px); }
    .glass-btn-danger {
      background: rgba(254,242,242,0.75); border: 1px solid rgba(252,165,165,0.7);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .glass-btn-danger:hover:not(:disabled) { background: rgba(254,226,226,0.9); transform: translateY(-1px); }

    .glass-btn-danger-solid {
      background: linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92));
      border: 1px solid rgba(255,255,255,0.4); color: white;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 20px -10px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
      transition: transform 0.2s ease;
    }
    .glass-btn-danger-solid:hover:not(:disabled) { transform: translateY(-1px); }

    .lg-reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .lg-reveal.lg-in-view { opacity: 1; transform: translateY(0); }

    @media (prefers-reduced-motion: reduce) {
      .lg-blob, .lg-reveal { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
    }
  `}</style>
);

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
    <div ref={ref} className={`lg-reveal ${inView ? "lg-in-view" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}>
      {children}
    </div>
  );
}

// Small reusable confirm dialog — used for both Cancel and Delete so the
// two destructive actions look and behave consistently.
const ConfirmDialog = ({ icon, title, message, confirmLabel, confirmColorClass, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-4">
    <div className="glass-card rounded-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 !bg-white/85">
      <div className="flex items-center gap-3">
        <div className="glass-icon-chip w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="glass-btn-secondary flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`glass-shine flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 ${confirmColorClass}`}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError]     = useState("");

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/api/v1/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError("");
    setShowConfirmCancel(false);
    try {
      const res = await API.patch(`/api/v1/orders/${id}/cancel`);
      setOrder(res.data.data);
      setCancelSuccess("Order cancelled successfully.");
    } catch (err) {
      setCancelError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  // Permanently deletes THIS order, then returns to the order list —
  // there's nothing left here to show once it's gone.
  const handleDeleteOrder = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await API.delete(`/api/v1/orders/${id}`);
      navigate("/profile", { state: { orderDeleted: true } });
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete order.");
      setShowConfirmDelete(false);
      setDeleting(false);
    }
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      const res = await API.post("/api/v1/payment/create-order", {
        orderId: order._id
      });

      const { razorpayOrderId, amount, currency, key } = res.data.data;

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "Your School Store",
        description: `Order #${order.orderNumber}`,
        handler: async function (response) {
          try {
            const verifyRes = await API.post("/api/v1/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            setOrder(verifyRes.data.data);
          } catch (err) {
            setPaymentError("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              const failRes = await API.post("/api/v1/payment/failure", {
                razorpay_order_id: razorpayOrderId
              });
              setOrder(failRes.data.data);
              setPaymentError("Payment cancelled. Order has been cancelled.");
            } catch (err) {
              setPaymentError("Something went wrong. Please contact support.");
            }
          }
        },
        prefill: {
          contact: order.phoneNumber,
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setPaymentError(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.indexOf(order?.orderStatus);
  const isCancelled = order?.orderStatus === "cancelled";
  const canCancel   = order?.orderStatus === "placed" || order?.orderStatus === "processing";
  const canPay      = order?.paymentMethod === "online" && order?.paymentStatus === "pending" && order?.orderStatus === "placed";
  // Mirrors the backend rule: only delivered/cancelled orders (and no refund
  // in progress) can be permanently deleted.
  const canDelete   = order &&
    ["delivered", "cancelled"].includes(order.orderStatus) &&
    order.paymentStatus !== "refund_initiated";

  if (loading) {
    return (
      <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 sm:py-8 px-4 relative overflow-hidden">
        <GlassStyles />
        <div className="lg-blobs"><div className="lg-blob lg-blob-1" /><div className="lg-blob lg-blob-2" /></div>
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse relative z-10">
          <div className="h-8 glass-tile rounded-lg w-32" />
          <div className="h-24 glass-card rounded-2xl" />
          <div className="h-40 glass-card rounded-2xl" />
          <div className="h-48 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col items-center justify-center gap-4 px-4 text-center relative overflow-hidden">
        <GlassStyles />
        <div className="lg-blobs"><div className="lg-blob lg-blob-1" /><div className="lg-blob lg-blob-2" /></div>
        <div className="glass-card relative z-10 flex flex-col items-center gap-4 px-10 py-12 rounded-3xl">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-gray-600 text-base">{error || "Order not found"}</p>
          <button onClick={() => navigate("/profile")}
            className="glass-shine glass-btn-primary px-4 py-2 text-sm font-semibold rounded-xl">
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.placed;

  return (
    <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 sm:py-8 px-4 relative overflow-hidden">
      <GlassStyles />
      <div className="lg-blobs">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">

        <button onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors">
          <ArrowLeft size={16} /> Back to Profile
        </button>

        {/* Header */}
        <Reveal>
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="glass-pill mb-3">
              <span className="glass-dot" />
              Order
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 min-w-0">
                <h1 className="lg-display text-lg sm:text-xl font-semibold text-gray-900 break-all">
                  #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                </h1>
                <p className="text-xs text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                  {status.icon} {status.label}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Feedback messages */}
        {cancelError && (
          <div className="glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {cancelError}
          </div>
        )}
        {cancelSuccess && (
          <div className="glass-card flex items-center gap-2 text-green-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle size={15} className="shrink-0" /> {cancelSuccess}
          </div>
        )}
        {paymentError && (
          <div className="glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {paymentError}
          </div>
        )}
        {deleteError && (
          <div className="glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {deleteError}
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelled && (
          <Reveal delay={60}>
            <div className="glass-card rounded-2xl p-4 sm:p-5 overflow-x-auto">
              <div className="glass-pill mb-4">
                <span className="glass-dot" />
                Progress
              </div>
              <div className="flex items-center justify-between relative min-w-[320px]">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/70 z-0" />
                <div
                  className="absolute top-4 left-0 h-0.5 z-0 transition-all duration-500"
                  style={{
                    width: currentStepIndex >= 0 ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` : "0%",
                    background: "linear-gradient(90deg, rgba(37,99,235,0.9), rgba(59,130,246,0.9))"
                  }}
                />
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStepIndex;
                  const isActive = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                          ${isDone ? "border-transparent" : "glass-tile !border-white/70"}
                          ${isActive ? "ring-4 ring-blue-200/60" : ""}`}
                        style={isDone ? { background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.95))" } : {}}
                      >
                        {isDone
                          ? <CheckCircle size={15} className="text-white" />
                          : <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        }
                      </div>
                      <p className={`text-xs font-semibold capitalize text-center ${isDone ? "text-blue-700" : "text-gray-400"}`}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <Reveal delay={60}>
            <div className="glass-card flex items-center gap-3 px-4 sm:px-5 py-4 rounded-2xl !bg-red-50/50">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/75"
                style={{ background: "linear-gradient(150deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))" }}
              >
                <XCircle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">Order Cancelled</p>
                <p className="text-xs text-red-500">This order has been cancelled.</p>
              </div>
            </div>
          </Reveal>
        )}

        {/* Order Items */}
        <Reveal delay={120}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-4 border-b border-white/60">
              <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                <Package size={14} className="text-blue-600" />
              </div>
              <h2 className="lg-display text-sm font-semibold text-gray-900">Items ({order.orderItems?.length})</h2>
            </div>
            <div className="divide-y divide-white/50">
              {order.orderItems?.map((item, i) => {
                const name  = item.product?.name || "Product";
                const image = item.product?.images?.[0];
                return (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                    <div
                      className="glass-tile w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer"
                      onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                    >
                      {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={18} className="text-blue-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-700 transition-colors"
                        onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                      >
                        {name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="glass-tile text-xs text-blue-700 font-semibold px-2 py-0.5 rounded-lg">
                          Size: {item.size}
                        </span>
                        <span className="text-xs text-gray-400">× {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                      <p className="text-xs text-gray-400">₹{item.price} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="glass-tile px-4 sm:px-5 py-4 flex justify-between items-center !rounded-none">
              <span className="text-sm font-bold text-gray-700">Order Total</span>
              <span className="text-lg font-black text-blue-700">₹{order.totalAmount}</span>
            </div>
          </div>
        </Reveal>

        {/* Delivery + Payment Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Reveal delay={160}>
            <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3 h-full">
              <div className="flex items-center gap-2">
                <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                  <MapPin size={14} className="text-blue-600" />
                </div>
                <h3 className="lg-display text-sm font-semibold text-gray-900">Delivery Address</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">{order.deliveryAddress}</p>
                <p className="text-xs text-gray-500">{order.city}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Phone size={11} /> {order.phoneNumber}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3 h-full">
              <div className="flex items-center gap-2">
                <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                  <CreditCard size={14} className="text-blue-600" />
                </div>
                <h3 className="lg-display text-sm font-semibold text-gray-900">Payment Info</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Method</span>
                  <span className="font-bold text-gray-700 uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-gray-400 shrink-0">Transaction ID</span>
                    <span className="font-mono text-gray-600 text-xs truncate">{order.transactionId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-gray-400 shrink-0">Payment ID</span>
                    <span className="font-mono text-gray-600 text-xs truncate">{order.razorpayPaymentId}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs pt-1 border-t border-white/60">
                  <span className="text-gray-400">Total Paid</span>
                  <span className="font-black text-blue-700">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Pay Now card */}
        {canPay && (
          <Reveal delay={240}>
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-gray-800">Complete your payment</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your order is reserved. Pay ₹{order.totalAmount} to confirm it.
                  </p>
                </div>
                <button
                  onClick={handlePayNow}
                  disabled={paymentLoading}
                  className="glass-shine glass-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {paymentLoading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <CreditCard size={14} />
                  }
                  {paymentLoading ? "Loading..." : `Pay ₹${order.totalAmount}`}
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* Cancel Order */}
        {canCancel && (
          <Reveal delay={240}>
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-gray-800">Need to cancel?</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You can cancel this order as it hasn't been shipped yet.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmCancel(true)}
                  disabled={cancelling}
                  className="glass-btn-danger flex items-center gap-1.5 px-4 py-2 text-red-600 rounded-xl text-sm font-semibold disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* Invoice + Delete row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={() => generateInvoice(order)}
            className="glass-btn-secondary flex items-center justify-center gap-1.5 text-xs px-3 py-2 text-blue-700 rounded-lg font-medium w-full sm:w-auto"
          >
            <FileDown size={12} />
            Download Invoice
          </button>

          {/* Permanently delete this order — only once it's in a final
              state, mirroring the backend's own guard. */}
          {canDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="glass-btn-danger flex items-center justify-center gap-1.5 text-xs px-3 py-2 text-red-600 rounded-lg font-medium disabled:opacity-50 w-full sm:w-auto"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? "Deleting..." : "Delete Order"}
            </button>
          )}
        </div>

        {/* Confirm Cancel Modal */}
        {showConfirmCancel && (
          <ConfirmDialog
            icon={<XCircle size={20} className="text-red-500" />}
            title="Cancel Order?"
            message="This action cannot be undone."
            confirmLabel="Yes, Cancel"
            confirmColorClass="glass-btn-danger-solid"
            onCancel={() => setShowConfirmCancel(false)}
            onConfirm={handleCancelOrder}
            loading={cancelling}
          />
        )}

        {/* Confirm Delete Modal */}
        {showConfirmDelete && (
          <ConfirmDialog
            icon={<Trash2 size={20} className="text-red-500" />}
            title="Permanently Delete Order?"
            message="This will remove the order from your history forever. This cannot be undone."
            confirmLabel="Yes, Delete"
            confirmColorClass="glass-btn-danger-solid"
            onCancel={() => setShowConfirmDelete(false)}
            onConfirm={handleDeleteOrder}
            loading={deleting}
          />
        )}

      </div>
    </div>
  );
}