import { useEffect, useState } from "react";
import { Plus, Minus, X, Package, Loader2, FilePlus2, User, ShoppingBag, Settings2 } from "lucide-react";
import API from "../api/axios";
import { ORDER_STATUSES } from "./constants";

/* ─────────────────────────────────────────────
   CREATE ORDER TAB
   Admin manually builds an order for any customer:
   picks products/sizes/quantities, enters customer
   details as a guest, and sets the order + payment
   status directly at creation time.

   Expects a backend endpoint:
   POST /api/v1/orders/admin/create
   Body: {
     customerName, mobileNumber, email,
     deliveryAddress, city, pincode,
     orderItems: [{ product, size, quantity, price }],
     totalAmount, orderStatus, paymentMethod, paymentStatus
   }
───────────────────────────────────────────── */
const CreateOrder = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [customer, setCustomer] = useState({
    customerName: "", mobileNumber: "", email: "",
    deliveryAddress: "", city: "", pincode: "",
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState("placed");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/v1/products");
      setProducts(res.data.data || []);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setLoadingProducts(false); }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);
  const availableSizes = selectedProduct?.sizes || [];
  const selectedSizeObj = availableSizes.find(s => s.size === selectedSize);
  const isMobileValid = /^[0-9]{10}$/.test(customer.mobileNumber);

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize) {
      showToast("Select a product and size", "error");
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      showToast("Quantity must be at least 1", "error");
      return;
    }

    setOrderItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === selectedProduct._id && i.size === selectedSize
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + qty };
        return updated;
      }
      return [...prev, {
        productId: selectedProduct._id,
        name: selectedProduct.name,
        image: selectedProduct.images?.[0],
        size: selectedSize,
        price: selectedSizeObj?.price || 0,
        quantity: qty,
        stock: selectedSizeObj?.stock ?? 0,
      }];
    });

    setSelectedProductId("");
    setSelectedSize("");
    setQuantity(1);
  };

  const updateItemQty = (index, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setOrderItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: q } : it));
  };

  const removeItem = (index) => setOrderItems(prev => prev.filter((_, i) => i !== index));

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const resetForm = () => {
    setCustomer({ customerName: "", mobileNumber: "", email: "", deliveryAddress: "", city: "", pincode: "" });
    setOrderItems([]);
    setOrderStatus("placed");
    setPaymentMethod("cod");
    setPaymentStatus("pending");
    setSelectedProductId("");
    setSelectedSize("");
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (!customer.customerName || !customer.mobileNumber || !customer.deliveryAddress || !customer.city) {
      showToast("Name, mobile number, address and city are required", "error");
      return;
    }
    if (!isMobileValid) {
      showToast("Enter a valid 10-digit mobile number", "error");
      return;
    }
    if (orderItems.length === 0) {
      showToast("Add at least one product to the order", "error");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/api/v1/orders/admin/create", {
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber,
        email: customer.email,
        deliveryAddress: customer.deliveryAddress,
        city: customer.city,
        pincode: customer.pincode,
        orderItems: orderItems.map(i => ({
          product: i.productId,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount,
        orderStatus,
        paymentMethod,
        paymentStatus,
      });
      showToast("Order created successfully", "success");
      resetForm();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="space-y-3" style={{ "--brand": "37,99,235" }}>
        {[1, 2, 3].map(i => <div key={i} className="glass-skeleton h-16 rounded-2xl" />)}
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
  }

  return (
    <div className="space-y-5 relative overflow-x-hidden" style={{ "--brand": "37,99,235" }}>

      {/* Ambient blobs */}
      <div className="glass-blob absolute -top-24 -left-20 w-72 h-72 rounded-full pointer-events-none -z-10" />
      <div className="glass-blob glass-blob-2 absolute top-1/3 -right-24 w-72 h-72 rounded-full pointer-events-none -z-10" />

      {/* Customer details */}
      <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <span className="glass-icon-chip"><User size={15} className="text-blue-700" /></span>
          <span className="glass-pill inline-flex items-center gap-1.5 text-blue-700">
            <span className="glass-dot" /> Step 1
          </span>
          <h3 className="text-sm font-black text-gray-900">Customer Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Customer Name *</label>
            <input value={customer.customerName}
              onChange={e => setCustomer({ ...customer, customerName: e.target.value })}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mobile Number *</label>
            <input value={customer.mobileNumber} maxLength={10}
              onChange={e => setCustomer({ ...customer, mobileNumber: e.target.value.replace(/\D/g, "") })}
              className={`glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none
                ${customer.mobileNumber && !isMobileValid ? "glass-input-error" : ""}`} />
            {customer.mobileNumber && (
              <p className={`text-xs pl-0.5 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                {customer.mobileNumber.length}/10 {isMobileValid && "✓"}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="email" value={customer.email}
              onChange={e => setCustomer({ ...customer, email: e.target.value })}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">City *</label>
            <input value={customer.city}
              onChange={e => setCustomer({ ...customer, city: e.target.value })}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Delivery Address *</label>
            <textarea rows={2} value={customer.deliveryAddress}
              onChange={e => setCustomer({ ...customer, deliveryAddress: e.target.value })}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm resize-none bg-transparent focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Pincode <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={customer.pincode} maxLength={6}
              onChange={e => setCustomer({ ...customer, pincode: e.target.value.replace(/\D/g, "") })}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Add products */}
      <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <span className="glass-icon-chip"><ShoppingBag size={15} className="text-blue-700" /></span>
          <span className="glass-pill inline-flex items-center gap-1.5 text-blue-700">
            <span className="glass-dot" /> Step 2
          </span>
          <h3 className="text-sm font-black text-gray-900">Add Products</h3>
        </div>

        {products.length === 0 ? (
          <p className="text-xs text-gray-400">No products available. Add products first.</p>
        ) : (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-600">Product</label>
              <select value={selectedProductId}
                onChange={e => { setSelectedProductId(e.target.value); setSelectedSize(""); }}
                className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none">
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}{!p.isAvailable ? " (hidden)" : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-600">Size</label>
              {!selectedProduct ? (
                <div className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm text-gray-400">
                  Select a product first
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {availableSizes.map(s => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setSelectedSize(s.size)}
                      className={`glass-pill-option ${selectedSize === s.size ? "glass-pill-option-active" : ""}`}
                    >
                      {s.size} <span className="opacity-60">· ₹{s.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1 w-24">
              <label className="text-xs font-semibold text-gray-600">Qty</label>
              <input type="number" min={1} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none" />
            </div>
            <button onClick={handleAddItem}
              className="glass-shine glass-btn-primary flex items-center gap-1.5 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Plus size={15} /> Add
            </button>
          </div>
        )}

        {/* Selected items list */}
        {orderItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/50">
            {orderItems.map((item, i) => (
              <div key={`${item.productId}-${item.size}`} className="glass-inset-panel flex items-center gap-3 rounded-xl px-3 py-2 flex-wrap">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/60 shrink-0 border border-white/70">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Size {item.size} · ₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateItemQty(i, item.quantity - 1)}
                    className="glass-icon-btn-sm p-1 rounded-lg"><Minus size={12} /></button>
                  <input type="number" value={item.quantity} min={1}
                    onChange={e => updateItemQty(i, e.target.value)}
                    className="glass-input-wrap-sm w-12 text-center text-xs rounded-lg py-1 bg-transparent focus:outline-none" />
                  <button onClick={() => updateItemQty(i, item.quantity + 1)}
                    className="glass-icon-btn-sm p-1 rounded-lg"><Plus size={12} /></button>
                </div>
                <p className="text-xs font-black text-blue-600 w-16 text-right">₹{item.price * item.quantity}</p>
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order settings */}
      <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <span className="glass-icon-chip"><Settings2 size={15} className="text-blue-700" /></span>
          <span className="glass-pill inline-flex items-center gap-1.5 text-blue-700">
            <span className="glass-dot" /> Step 3
          </span>
          <h3 className="text-sm font-black text-gray-900">Order Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Order Status</label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {ORDER_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOrderStatus(s)}
                  className={`glass-pill-option capitalize ${orderStatus === s ? "glass-pill-option-active" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Payment Status</label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {[
                { v: "pending", l: "Pending" },
                { v: "paid", l: "Paid" },
                { v: "failed", l: "Failed" },
                { v: "refund_initiated", l: "Refund Initiated" },
                { v: "refund_completed", l: "Refund Completed" },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPaymentStatus(opt.v)}
                  className={`glass-pill-option ${paymentStatus === opt.v ? "glass-pill-option-active" : ""}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Payment Method</label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {["cod", "online"].map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                  className={`glass-pill-option ${paymentMethod === m ? "glass-pill-option-active" : ""}`}>
                  {m === "cod" ? "Cash on Delivery" : "Online Payment"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-inset-panel flex items-center justify-between px-4 py-3 rounded-xl">
          <span className="text-sm font-semibold text-gray-600">Total Amount</span>
          <span className="text-lg font-black text-blue-600">₹{totalAmount}</span>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
          {submitting
            ? <><Loader2 size={15} className="animate-spin" /> Creating Order...</>
            : <><FilePlus2 size={15} /> Create Order</>}
        </button>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px -14px rgba(var(--brand),0.3),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }

        .glass-pill {
          padding: 3px 10px; border-radius: 999px;
          font-weight: 700; font-size: 10px; letter-spacing: 0.03em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.85);
        }
        .glass-dot { width: 5px; height: 5px; border-radius: 999px; background: rgb(var(--brand)); display: inline-block; }

        .glass-icon-chip {
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }

        .glass-icon-btn-sm {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-icon-btn-sm:hover { background: rgba(255,255,255,0.9); }

        .glass-input-wrap {
          background: rgba(255,255,255,0.92);
          border: 1.5px solid rgba(255,255,255,1);
          box-shadow: 0 0 0 1px rgba(15,23,42,0.06),
                      inset 0 1px 0 rgba(255,255,255,1),
                      0 6px 14px -8px rgba(15,23,42,0.18);
          transition: box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }
        .glass-input-wrap:hover {
          background: rgba(255,255,255,0.97);
          box-shadow: 0 0 0 1px rgba(15,23,42,0.08),
                      inset 0 1px 0 rgba(255,255,255,1),
                      0 8px 16px -8px rgba(15,23,42,0.2);
        }
        .glass-input-wrap:focus-within, .glass-input-wrap:focus {
          background: #fff;
          border-color: rgba(var(--brand),0.65);
          box-shadow: 0 0 0 3.5px rgba(var(--brand),0.16),
                      inset 0 1px 0 rgba(255,255,255,1),
                      0 8px 18px -8px rgba(var(--brand),0.3);
        }
        .glass-input-error {
          border-color: rgba(239,68,68,0.55) !important;
        }
        .glass-input-error:focus {
          box-shadow: 0 0 0 3.5px rgba(239,68,68,0.16),
                      inset 0 1px 0 rgba(255,255,255,1),
                      0 8px 18px -8px rgba(239,68,68,0.3) !important;
        }
        .glass-input-wrap-sm {
          background: rgba(255,255,255,0.94);
          border: 1.5px solid rgba(255,255,255,1);
          box-shadow: 0 0 0 1px rgba(15,23,42,0.06),
                      inset 0 1px 0 rgba(255,255,255,1),
                      0 4px 10px -6px rgba(15,23,42,0.16);
        }

        .glass-inset-panel {
          background: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.65);
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
        .glass-pill-option-active:hover { transform: translateY(-1px); }
        .glass-pill-option-active::before {
          content: "✓";
          font-size: 10px; font-weight: 900;
          margin-right: 1px;
        }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.5);
        }
        .glass-btn-primary:hover:not(:disabled) { box-shadow: 0 14px 26px -12px rgba(var(--brand),0.6); }

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

export default CreateOrder;