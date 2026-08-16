import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle, Clock, Loader2, ShoppingBag, UserCog,
  Phone, MapPin, CalendarDays, Package, IndianRupee, Trash2, Pencil, X,
  Search, SlidersHorizontal, ChevronDown, PackageSearch, Filter,
} from "lucide-react";
import API from "../api/axios";
import { ORDER_STATUSES, STATUS_COLORS, PAYMENT_COLORS } from "./constants";

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refund_initiated", "refund_completed"];
const label = (str) => str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Mirrors the backend's isOrderSettled rule exactly, so the list here never
// disagrees with what the server considers "completed":
//  - delivered orders only count as done once payment is actually paid
//    (or refunded) — a delivered COD order still pending collection isn't done.
//  - cancelled orders count as done unless a refund is actively in progress.
const isOrderSettled = (order) => {
  if (order.orderStatus === "delivered") {
    return ["paid", "refund_completed"].includes(order.paymentStatus);
  }
  if (order.orderStatus === "cancelled") {
    return order.paymentStatus !== "refund_initiated";
  }
  return false;
};

// First available product image across an order's line items — used for the
// live search suggestion thumbnail and the item chips in the expanded card.
const firstOrderImage = (order) =>
  order.orderItems?.find((it) => it.product?.images?.[0])?.product?.images?.[0] || null;

/* Small glass pill used in the collapsed row — compact version of the full badges */
const Pill = ({ children, className }) => (
  <span className={`glass-badge inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${className}`}>
    {children}
  </span>
);

/* ─────────────────────────────────────────────
   ORDERS TAB
───────────────────────────────────────────── */
const Orders = ({ showToast }) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [view, setView] = useState("active");
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "admin" | "customer"
  // Completed orders are read-only by default — an admin has to explicitly
  // opt into editing one, so a status/payment correction is a deliberate
  // action rather than something that can happen by accident.
  const [editingIds, setEditingIds] = useState(new Set());
  // Cards render collapsed by default — tapping the summary row reveals
  // full details (address, items, payment method, controls).
  const [expandedIds, setExpandedIds] = useState(new Set());

  // ── Search & filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  // ── Live suggestion dropdown (mirrors the navbar's search-as-you-type UI) ──
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [justPicked, setJustPicked] = useState(null); // brief highlight pulse after picking a suggestion
  const searchBoxRef = useRef(null);

  const activeFilterCount = [statusFilter, paymentFilter, startDate, endDate].filter(Boolean).length;
  const isSearchMode = searchQuery.trim().length > 0 || activeFilterCount > 0;

  useEffect(() => { fetchOrders(); }, []);

  // Animate the filter sheet in on next frame after mount, so the
  // translate-y transition actually has something to animate from.
  useEffect(() => {
    if (showFilters) {
      const raf = requestAnimationFrame(() => setFilterSheetVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setFilterSheetVisible(false);
  }, [showFilters]);

  // Debounced search — refires on query, filters, or page changes
  useEffect(() => {
    if (!isSearchMode) {
      setSearchResults([]);
      setSearching(false);
      setSuggestOpen(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(runSearch, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, paymentFilter, startDate, endDate, searchPage]);

  // Close the suggestion dropdown on outside click — same pattern as the navbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/grouped");
      setActiveOrders(res.data.data.active || []);
      setCompletedOrders(res.data.data.completed || []);
    } catch { showToast("Failed to fetch orders", "error"); }
    finally { setLoading(false); }
  };

  const runSearch = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/search", {
        params: {
          query: searchQuery.trim(),
          status: statusFilter || undefined,
          paymentStatus: paymentFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: searchPage,
          limit: 15,
        },
      });
      setSearchResults(res.data.data.orders || []);
      setSearchTotal(res.data.data.pagination?.total ?? 0);
      setSearchTotalPages(res.data.data.pagination?.totalPages ?? 1);
    } catch {
      showToast("Search failed", "error");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFilterChange = (setter) => (val) => { setter(val); setSearchPage(1); };
  const clearFilters = () => {
    setStatusFilter(""); setPaymentFilter(""); setStartDate(""); setEndDate("");
    setSearchPage(1);
  };
  const clearSearch = () => { setSearchQuery(""); clearFilters(); setSuggestOpen(false); };

  // Jump from a suggestion straight to the matching card: make sure it's
  // expanded, briefly highlight it, and scroll it into view.
  const jumpToOrder = (orderId) => {
    setSuggestOpen(false);
    setExpandedIds((prev) => new Set(prev).add(orderId));
    setJustPicked(orderId);
    requestAnimationFrame(() => {
      document.getElementById(`order-${orderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    setTimeout(() => setJustPicked((cur) => (cur === orderId ? null : cur)), 1600);
  };

  const toggleEditing = (orderId) => {
    setEditingIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleExpanded = (orderId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // Applies a partial update to an order wherever it currently lives — in
  // Active, Completed, or the flat search results — then re-buckets it into
  // Active or Completed based on whether it's actually settled now, and
  // patches it in place within search results too so the search view never
  // shows stale status/payment info after an edit.
  const applyOrderUpdate = (orderId, updates) => {
    const existing =
      activeOrders.find(o => o._id === orderId) ||
      completedOrders.find(o => o._id === orderId) ||
      searchResults.find(o => o._id === orderId);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const settled = isOrderSettled(updated);

    setActiveOrders(prev => {
      const withoutOrder = prev.filter(o => o._id !== orderId);
      return settled ? withoutOrder : [updated, ...withoutOrder];
    });

    setCompletedOrders(prev => {
      const withoutOrder = prev.filter(o => o._id !== orderId);
      return settled ? [updated, ...withoutOrder] : withoutOrder;
    });

    setSearchResults(prev => prev.map(o => o._id === orderId ? updated : o));
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/status`, { status });
      applyOrderUpdate(orderId, { orderStatus: status });
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally { setUpdatingId(null); }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    setUpdatingPaymentId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/payment-status`, { paymentStatus });
      applyOrderUpdate(orderId, { paymentStatus });
      showToast("Payment status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payment status", "error");
    } finally { setUpdatingPaymentId(null); }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setUpdatingId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/cancel`);

      const order =
        activeOrders.find((o) => o._id === orderId) ||
        searchResults.find((o) => o._id === orderId);
      const nextPaymentStatus = order?.paymentStatus === "paid"
        ? "refund_initiated"
        : order?.paymentStatus;

      applyOrderUpdate(orderId, {
        orderStatus: "cancelled",
        paymentStatus: nextPaymentStatus,
      });

      showToast("Order cancelled successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Permanently removes a completed order (delivered/cancelled) — used to
  // sanitize the list of test orders after QA. Backend re-validates the
  // status guard, but we mirror it here too so the button only ever shows
  // where it's actually allowed to succeed.
  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("Permanently delete this order? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await API.delete(`/api/v1/orders/admin/${orderId}`);
      setCompletedOrders((prev) => prev.filter((o) => o._id !== orderId));
      setSearchResults((prev) => prev.filter((o) => o._id !== orderId));
      showToast("Order permanently deleted", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete order", "error");
    } finally {
      setDeletingId(null);
    }
  };

  /* ─────────────────────────────────────────────
     ORDER CARD — collapsed summary + expandable detail
  ───────────────────────────────────────────── */
  const OrderCard = ({ order, editable, isEditing, onToggleEdit, isExpanded, onToggleExpand, highlighted }) => {
    const isManual = !!order.createdByAdmin;
    const customerName = order.user?.username || order.customerName || "Unknown";
    const customerPhone = order.user?.mobileNumber || order.phoneNumber || "—";
    const canDelete = ["delivered", "cancelled"].includes(order.orderStatus)
      && order.paymentStatus !== "refund_initiated";
    const showControls = editable || isEditing;
    const shortDate = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const thumb = firstOrderImage(order);

    return (
      <div
        id={`order-${order._id}`}
        className={`glass-card rounded-2xl overflow-hidden transition-all duration-500 h-fit relative
        ${isEditing ? "glass-card-editing" : ""}
        ${highlighted ? "glass-card-highlighted" : ""}`}
      >

        {/* ── Collapsed summary row — always visible, tap to expand ── */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center gap-3 p-3.5 text-left active:bg-white/40 transition-colors relative"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/70">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center glass-icon-chip !w-full !h-full !rounded-xl
                ${isManual ? "text-purple-600" : "text-blue-600"}`}>
                {isManual ? <UserCog size={17} /> : <ShoppingBag size={17} />}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-sm font-black text-gray-900 shrink-0">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 capitalize truncate">{customerName}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Pill className={STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"}>
                {order.orderStatus}
              </Pill>
              <Pill className={PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}>
                {label(order.paymentStatus)}
              </Pill>
              <span className="text-[11px] text-gray-400 font-medium">{shortDate}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="flex items-center text-sm font-black text-gray-900">
              <IndianRupee size={13} />{order.totalAmount}
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* ── Expandable detail — CSS-grid accordion, no JS height math ── */}
        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="border-t border-white/50 p-4 space-y-4 relative">

              {/* Source + edit toggle + full date */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-white
                  ${isManual ? "bg-purple-600" : "bg-blue-600"}`}>
                  {isManual ? <UserCog size={11} /> : <ShoppingBag size={11} />}
                  {isManual ? "Admin Created" : "Customer Order"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <CalendarDays size={11} />
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                  {!editable && (
                    <button
                      onClick={onToggleEdit}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full transition-colors
                        ${isEditing
                          ? "bg-amber-500 text-white"
                          : "glass-icon-btn-sm text-gray-500 hover:text-amber-600"}`}
                    >
                      {isEditing ? <X size={11} /> : <Pencil size={11} />}
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="glass-notice-amber flex items-center gap-1.5 px-3 py-2 rounded-xl text-amber-700 text-xs font-semibold">
                  <Pencil size={11} className="shrink-0" /> Correcting status or payment here will move this order between Active and Completed automatically.
                </div>
              )}

              {/* Contact + address */}
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone size={12} className="shrink-0 text-gray-400" /> {customerPhone}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-gray-600">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-gray-400" />
                  <span>{order.deliveryAddress}, {order.city}</span>
                </p>
                <span className={`glass-badge inline-block text-xs font-semibold px-2 py-0.5 rounded-full
                  ${order.paymentMethod === "cod" ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                </span>
                {order.razorpayPaymentId && (
                  <p className="text-[10px] text-gray-400 font-mono pt-1">{order.razorpayPaymentId}</p>
                )}
              </div>

              {/* Items — now with product thumbnails */}
              {order.orderItems?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/50">
                  {order.orderItems.map((item, i) => (
                    <span key={i} className="glass-inset-panel flex items-center gap-1.5 text-xs text-gray-600 pl-1 pr-2 py-1 rounded-lg">
                      <span className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-white/70 flex items-center justify-center">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={10} className="text-gray-400" />
                        )}
                      </span>
                      {item.product?.name || "Product"} ({item.size}) × {item.quantity}
                    </span>
                  ))}
                </div>
              )}

              {/* Order status control */}
              {showControls && (
                <div className="pt-3 border-t border-white/50 space-y-2">
                  <span className="text-xs text-gray-400 font-medium">Update status</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {ORDER_STATUSES.filter(s => s !== order.orderStatus).map(s => (
                      <button key={s}
                        onClick={() => handleStatusChange(order._id, s)}
                        disabled={updatingId === order._id}
                        className="glass-pill-option !py-1.5 !px-2.5 disabled:opacity-50"
                      >
                        {updatingId === order._id
                          ? <Loader2 size={11} className="animate-spin" />
                          : `→ ${s}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment status control */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/50">
                <span className="text-xs text-gray-400 font-medium">Payment</span>
                {showControls ? (
                  <div className="relative">
                    <select
                      value={order.paymentStatus}
                      disabled={updatingPaymentId === order._id}
                      onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                      className="glass-input-wrap-sm text-xs pl-2 pr-6 py-1.5 rounded-lg focus:outline-none bg-transparent text-gray-700 font-medium appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refund_initiated">Refund Initiated</option>
                      <option value="refund_completed">Refund Completed</option>
                    </select>
                    {updatingPaymentId === order._id && (
                      <Loader2 size={11} className="animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    )}
                  </div>
                ) : (
                  <span className={`glass-badge text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                    {order.paymentStatus}
                  </span>
                )}
              </div>

              {/* Cancel Order */}
              {showControls && !["cancelled", "shipped", "delivered"].includes(order.orderStatus) && (
                <div className="pt-3 border-t border-white/50 flex justify-end">
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={updatingId === order._id}
                    className="glass-shine glass-btn-danger-soft w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
                  >
                    {updatingId === order._id ? (
                      <><Loader2 size={15} className="animate-spin" /> Cancelling...</>
                    ) : (
                      <><Package size={15} /> Cancel Order</>
                    )}
                  </button>
                </div>
              )}

              {/* Delete Order — settled orders only */}
              {!showControls && canDelete && (
                <div className="pt-3 border-t border-white/50 flex justify-end">
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    disabled={deletingId === order._id}
                    className="glass-shine glass-btn-danger-soft w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
                  >
                    {deletingId === order._id ? (
                      <><Loader2 size={15} className="animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 size={15} /> Delete Order</>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" style={{ "--brand": "37,99,235" }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="glass-skeleton h-[72px] rounded-2xl" />
      ))}
      <style>{`
        .glass-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.65) 37%, rgba(255,255,255,0.4) 63%);
          background-size: 400% 100%;
          border: 1px solid rgba(255,255,255,0.7);
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        @media (prefers-reduced-motion: reduce) { .glass-skeleton { animation: none !important; } }
      `}</style>
    </div>
  );

  const baseOrders = view === "active" ? activeOrders : completedOrders;

  const currentOrders = baseOrders.filter(order => {
    if (sourceFilter === "admin") return !!order.createdByAdmin;
    if (sourceFilter === "customer") return !order.createdByAdmin;
    return true;
  });

  const sourceCounts = {
    all: baseOrders.length,
    admin: baseOrders.filter(o => !!o.createdByAdmin).length,
    customer: baseOrders.filter(o => !o.createdByAdmin).length,
  };

  // Top 5 quick-preview suggestions for the live dropdown — same source as
  // the full search results, just capped for a fast glanceable list.
  const suggestions = searchQuery.trim() ? searchResults.slice(0, 5) : [];

  return (
    <div className="space-y-4 pb-4 relative overflow-x-hidden" style={{ "--brand": "37,99,235" }}>

      {/* Ambient blobs */}
      <div className="glass-blob absolute -top-24 -left-16 w-72 h-72 rounded-full pointer-events-none -z-10" />
      <div className="glass-blob glass-blob-2 absolute top-1/2 -right-20 w-72 h-72 rounded-full pointer-events-none -z-10" />

      {/* ── Search bar with live image-preview suggestions ── */}
      <div ref={searchBoxRef} className="relative flex gap-2">
        <div className="glass-input-wrap flex-1 flex items-center gap-2 rounded-full px-4 py-3 min-w-0">
          {searching
            ? <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
            : <Search size={16} className="text-gray-400 shrink-0" />}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchPage(1); setSuggestOpen(true); }}
            onFocus={() => { if (searchQuery.trim()) setSuggestOpen(true); }}
            onKeyDown={(e) => e.key === "Escape" && setSuggestOpen(false)}
            placeholder="Search by customer, phone, address or product..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="text-gray-300 hover:text-gray-500 shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className={`relative flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-all
            ${activeFilterCount > 0 ? "glass-btn-primary text-white" : "glass-icon-btn text-gray-500"}`}
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] bg-amber-500 text-white rounded-full font-bold ring-2 ring-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Live suggestion dropdown — mirrors the navbar's product search preview */}
        {suggestOpen && searchQuery.trim() && (
          <div className="glass-dropdown absolute top-full left-0 right-0 sm:right-14 mt-2 rounded-2xl p-2 max-h-96 overflow-y-auto z-30">
            {searching ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-400">
                <Loader2 size={15} className="animate-spin" />
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map((order) => {
                  const thumb = firstOrderImage(order);
                  const customerName = order.user?.username || order.customerName || "Unknown";
                  return (
                    <button
                      key={order._id}
                      onClick={() => jumpToOrder(order._id)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/60 rounded-xl transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/60 overflow-hidden shrink-0 border border-white/70">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={14} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          #{order.orderNumber || order._id.slice(-6).toUpperCase()} · <span className="capitalize font-medium text-gray-600">{customerName}</span>
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {order.orderItems?.[0]?.product?.name || "—"}
                          {order.orderItems?.length > 1 ? ` +${order.orderItems.length - 1} more` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="flex items-center text-sm font-bold text-blue-600">
                          <IndianRupee size={11} />{order.totalAmount}
                        </span>
                        <Pill className={STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"}>
                          {order.orderStatus}
                        </Pill>
                      </div>
                    </button>
                  );
                })}
                {searchTotal > suggestions.length && (
                  <button
                    onClick={() => setSuggestOpen(false)}
                    className="w-full text-center text-xs font-semibold text-blue-600 hover:underline py-2.5 mt-1 border-t border-white/50"
                  >
                    See all {searchTotal} results for "{searchQuery.trim()}"
                  </button>
                )}
              </>
            ) : (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No orders found for "{searchQuery.trim()}"</p>
            )}
          </div>
        )}
      </div>

      {isSearchMode && !searching && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            {searchTotal === 0 ? "No orders match your search" : `${searchTotal} order${searchTotal === 1 ? "" : "s"} found`}
          </p>
          <button onClick={clearSearch} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <X size={12} /> Clear search
          </button>
        </div>
      )}

      {/* ── Filter bottom sheet — portal + max z-index so it always escapes clipping ── */}
      {showFilters && createPortal(
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ "--brand": "37,99,235", zIndex: 2147483000 }}>
          <div
            onClick={() => setShowFilters(false)}
            className={`absolute inset-0 bg-gray-900/45 backdrop-blur-sm transition-opacity duration-300 ${filterSheetVisible ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`glass-modal relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out
              ${filterSheetVisible ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-6 opacity-0"}`}
          >
            <div className="glass-blob absolute -top-16 -right-14 w-56 h-56 rounded-full pointer-events-none -z-10" />

            <div className="w-10 h-1 bg-gray-300/70 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="glass-icon-chip"><Filter size={15} className="text-blue-700" /></span>
                <h3 className="text-sm font-black text-gray-900">Filter Orders</h3>
              </div>
              <button onClick={() => setShowFilters(false)} className="glass-icon-btn p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Order Status</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange(setStatusFilter)("")}
                  className={`glass-pill-option ${statusFilter === "" ? "glass-pill-option-active" : ""}`}
                >
                  All statuses
                </button>
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleFilterChange(setStatusFilter)(s)}
                    className={`glass-pill-option capitalize ${statusFilter === s ? "glass-pill-option-active" : ""}`}
                  >
                    {label(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange(setPaymentFilter)("")}
                  className={`glass-pill-option ${paymentFilter === "" ? "glass-pill-option-active" : ""}`}
                >
                  All payment statuses
                </button>
                {PAYMENT_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleFilterChange(setPaymentFilter)(s)}
                    className={`glass-pill-option ${paymentFilter === s ? "glass-pill-option-active" : ""}`}
                  >
                    {label(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">From</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => handleFilterChange(setStartDate)(e.target.value)}
                  className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => handleFilterChange(setEndDate)(e.target.value)}
                  className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="glass-btn-neutral flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="glass-shine glass-btn-primary flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Search results mode ── */}
      {isSearchMode ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {searching ? (
              [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass-skeleton h-[72px] rounded-2xl" />)
            ) : searchResults.length === 0 ? (
              <div className="glass-card col-span-full flex flex-col items-center py-16 gap-2 rounded-2xl">
                <PackageSearch size={28} className="text-gray-300" />
                <p className="text-gray-400 text-sm">No orders match your search</p>
              </div>
            ) : searchResults.map(order => {
              const settled = isOrderSettled(order);
              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  editable={!settled}
                  isEditing={editingIds.has(order._id)}
                  onToggleEdit={() => toggleEditing(order._id)}
                  isExpanded={expandedIds.has(order._id)}
                  onToggleExpand={() => toggleExpanded(order._id)}
                  highlighted={justPicked === order._id}
                />
              );
            })}
          </div>

          {searchTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                disabled={searchPage === 1}
                className="glass-btn-neutral px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-gray-400">Page {searchPage} of {searchTotalPages}</span>
              <button
                onClick={() => setSearchPage((p) => Math.min(searchTotalPages, p + 1))}
                disabled={searchPage === searchTotalPages}
                className="glass-btn-neutral px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Active / Completed — full-width segmented control on mobile ── */}
          <div className="glass-segmented flex gap-1 p-1 rounded-2xl">
            <button
              onClick={() => setView("active")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${view === "active" ? "glass-segment-active text-blue-600" : "text-gray-400"}`}
            >
              <Clock size={14} />
              Active
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${view === "active" ? "bg-blue-100 text-blue-600" : "bg-white/50 text-gray-500"}`}>
                {activeOrders.length}
              </span>
            </button>
            <button
              onClick={() => setView("completed")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${view === "completed" ? "glass-segment-active text-green-600" : "text-gray-400"}`}
            >
              <CheckCircle size={14} />
              Completed
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${view === "completed" ? "bg-green-100 text-green-600" : "bg-white/50 text-gray-500"}`}>
                {completedOrders.length}
              </span>
            </button>
          </div>

          {/* ── Source filter — horizontally scrollable chip row, no wrap ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { key: "all", icon: null, text: "All", count: sourceCounts.all, active: "bg-gray-900 text-white" },
              { key: "admin", icon: UserCog, text: "Admin", count: sourceCounts.admin, active: "bg-purple-600 text-white" },
              { key: "customer", icon: ShoppingBag, text: "Customer", count: sourceCounts.customer, active: "bg-blue-600 text-white" },
            ].map(({ key, icon: Icon, text, count, active }) => (
              <button
                key={key}
                onClick={() => setSourceFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                  ${sourceFilter === key ? `${active} shadow-sm` : "glass-pill-option"}`}
              >
                {Icon && <Icon size={12} />}
                {text}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${sourceFilter === key ? "bg-white/25" : "bg-white/60 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── List — responsive grid, collapsible cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {currentOrders.length === 0 ? (
              <div className="glass-card col-span-full flex flex-col items-center py-16 gap-2 rounded-2xl">
                <ShoppingBag size={28} className="text-gray-300" />
                <p className="text-gray-400 text-sm">
                  {sourceFilter === "all"
                    ? (view === "active" ? "No active orders" : "No completed orders yet")
                    : `No ${sourceFilter === "admin" ? "admin-created" : "customer"} orders in ${view === "active" ? "active" : "completed"}`}
                </p>
              </div>
            ) : currentOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                editable={view === "active"}
                isEditing={editingIds.has(order._id)}
                onToggleEdit={() => toggleEditing(order._id)}
                isExpanded={expandedIds.has(order._id)}
                onToggleExpand={() => toggleExpanded(order._id)}
                highlighted={justPicked === order._id}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 24px -16px rgba(var(--brand),0.25), inset 0 1px 0 rgba(255,255,255,0.85);
        }
        .glass-card-editing {
          border-color: rgba(245,158,11,0.5);
          box-shadow: 0 0 0 2px rgba(245,158,11,0.25), 0 10px 24px -16px rgba(245,158,11,0.3);
        }
        .glass-card-highlighted {
          border-color: rgba(var(--brand),0.55);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.28), 0 14px 28px -16px rgba(var(--brand),0.35);
        }

        .glass-badge {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.6);
        }

        .glass-modal {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 30px 60px -24px rgba(var(--brand),0.4);
          overflow: hidden;
        }

        .glass-dropdown {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 24px 48px -20px rgba(var(--brand),0.35);
        }

        .glass-notice-amber {
          background: rgba(255,251,235,0.75);
          border: 1px solid rgba(252,211,77,0.5);
        }

        .glass-icon-chip {
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }
        .glass-icon-btn {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-icon-btn:hover { background: rgba(255,255,255,0.85); }
        .glass-icon-btn-sm {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-icon-btn-sm:hover { background: rgba(255,255,255,0.85); }

        .glass-input-wrap {
          background: rgba(255,255,255,0.92);
          border: 1.5px solid rgba(255,255,255,1);
          box-shadow: 0 0 0 1px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1), 0 6px 14px -8px rgba(15,23,42,0.18);
          transition: box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .glass-input-wrap:hover {
          background: rgba(255,255,255,0.97);
        }
        .glass-input-wrap:focus-within, .glass-input-wrap:focus {
          background: #fff;
          border-color: rgba(var(--brand),0.65);
          box-shadow: 0 0 0 3.5px rgba(var(--brand),0.16), inset 0 1px 0 rgba(255,255,255,1);
        }
        .glass-input-wrap-sm {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.95);
        }

        .glass-inset-panel {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.7);
        }

        .glass-segmented {
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.6);
          backdrop-filter: blur(10px);
        }
        .glass-segment-active {
          background: rgba(255,255,255,0.95);
          box-shadow: 0 4px 10px -4px rgba(15,23,42,0.2);
        }

        .glass-pill-option {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          font-size: 12px; font-weight: 600;
          color: rgb(75,85,99);
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 10px -6px rgba(15,23,42,0.15);
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .glass-pill-option:hover {
          border-color: rgba(var(--brand),0.4);
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 16px -8px rgba(var(--brand),0.3);
        }
        .glass-pill-option-active {
          color: #fff;
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border-color: rgba(255,255,255,0.4);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 20px -10px rgba(var(--brand),0.55);
        }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.5);
        }
        .glass-btn-primary:hover:not(:disabled) { box-shadow: 0 14px 26px -12px rgba(var(--brand),0.6); }
        .glass-btn-neutral {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-btn-neutral:hover { background: rgba(255,255,255,0.8); }

        .glass-btn-danger-soft {
          background: rgba(254,242,242,0.85);
          border: 1px solid rgba(252,165,165,0.6);
          color: rgb(220,38,38);
        }
        .glass-btn-danger-soft:hover:not(:disabled) {
          background: rgba(254,226,226,0.95);
          border-color: rgba(248,113,113,0.7);
        }

        .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
        .glass-shine::after {
          content: ""; position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.5), transparent);
          transform: skewX(-18deg);
          transition: left 0.75s ease;
          pointer-events: none;
        }
        .glass-shine:hover::after { left: 130%; }

        .glass-blob {
          filter: blur(70px); opacity: 0.14;
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 17s ease-in-out infinite;
        }
        .glass-blob-2 { animation: drift2 14s ease-in-out infinite; opacity: 0.1; }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-18px, 16px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(16px, -14px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob, .glass-blob-2 { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Orders;