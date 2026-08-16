import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, Phone, Plus, CheckCircle, AlertCircle,
  ChevronRight, ShoppingBag, Loader2, Tag, X, ShieldCheck, Star, Zap, CreditCard
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

// COD has been intentionally removed — this app is online-payment-only now.
// Payment method is no longer a user choice, so there's nothing to render as a
// selectable list. See the bottom of this file / the chat response for the
// other places (backend + admin) that need the same change to make this
// change hold end-to-end rather than just hiding it in this one screen.
const PAYMENT_METHOD = "online";

const EMPTY_NEW = { name: "", phone: "", fullAddress: "", city: "" };

/* ─────────────────────────────────────────────────────────
   Liquid Glass tokens — same recipe/brand blue as Profile.jsx,
   Products.jsx and OrderDetail.jsx. Move to a shared stylesheet
   so it isn't duplicated per file.
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
    .lg-blob-2 { width: 400px; height: 400px; top: 40%; right: -140px;
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
    .glass-btn-primary:disabled { opacity: 0.55; }

    .glass-radio-tile {
      background: rgba(255,255,255,0.45); border: 2px solid rgba(255,255,255,0.7);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }
    .glass-radio-tile:hover { transform: translateY(-1px); }
    .glass-radio-selected {
      border-color: rgba(var(--brand),0.7);
      background: rgba(219,234,254,0.55);
      box-shadow: 0 8px 20px -12px rgba(var(--brand),0.35);
    }

    .glass-dashed {
      background: rgba(255,255,255,0.35); border: 2px dashed rgba(148,163,184,0.5);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .glass-dashed:hover { border-color: rgba(var(--brand),0.6); background: rgba(255,255,255,0.55); }

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

export default function Checkout() {
  const { user } = useAuth();
  const { cart, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Buy Now support ──
  // ProductView's "Buy Now" button navigates here with:
  // state: { buyNow: true, product: { _id, name, image, size, quantity, price } }
  const buyNowProduct = location.state?.buyNow ? location.state.product : null;
  const isBuyNow = !!buyNowProduct;

  // Normalize into a single shape so the rest of the component (summary, total,
  // order payload) doesn't need to branch on isBuyNow everywhere.
  const orderItems = isBuyNow
    ? [{
        productId: buyNowProduct._id,
        name: buyNowProduct.name,
        image: buyNowProduct.image,
        size: buyNowProduct.size,
        quantity: buyNowProduct.quantity,
        price: buyNowProduct.price,
      }]
    : (cart?.items || []).map(item => ({
        productId: item.product?._id,
        name: item.product?.name || "Product",
        image: item.product?.images?.[0],
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));

  const orderTotal = isBuyNow
    ? buyNowProduct.price * buyNowProduct.quantity
    : total;

  const [addresses, setAddresses]             = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm]         = useState(false);
  const [newAddress, setNewAddress]           = useState(EMPTY_NEW);
  const [saveNewAddress, setSaveNewAddress]   = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [placing, setPlacing]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [placedOrderId, setPlacedOrderId]     = useState(null);

  const isPhoneValid = /^[0-9]{10}$/.test(newAddress.phone);
  const hasAddresses = addresses.length > 0;

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
    // Only bounce to /cart when this ISN'T a Buy Now checkout and the cart is empty.
    if (!isBuyNow && (!cart || cart.items?.length === 0)) { navigate("/cart"); return; }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await API.get("/api/v1/users/addresses");
      const addrs = res.data.data || [];
      setAddresses(addrs);
      if (addrs.length > 0) {
        // auto-select default, else first
        const def = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedAddressId(def._id);
        setShowNewForm(false);
      } else {
        // no saved addresses — must fill form
        setShowNewForm(true);
      }
    } catch {
      setShowNewForm(true);
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  const isFormValid = () => {
    if (showNewForm) {
      return (
        newAddress.name.trim() &&
        isPhoneValid &&
        newAddress.fullAddress.trim() &&
        newAddress.city.trim()
      );
    }
    return !!selectedAddressId;
  };

  const getDeliveryDetails = () => {
    if (showNewForm) {
      return {
        phoneNumber: newAddress.phone,
        deliveryAddress: `${newAddress.fullAddress}, ${newAddress.city}`,
        city: newAddress.city
      };
    }
    if (selectedAddress) {
      return {
        phoneNumber: selectedAddress.phone,
        deliveryAddress: selectedAddress.fullAddress,
        city: selectedAddress.fullAddress.split(",").pop()?.trim() || "N/A"
      };
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    const details = getDeliveryDetails();
    if (!details) { setError("Please select or enter a delivery address"); return; }

    setPlacing(true);
    setError("");

    try {
      // Save new address if user opted in
      if (showNewForm && saveNewAddress && addresses.length < 5) {
        try {
          const res = await API.post("/api/v1/users/addresses", {
            name: newAddress.name,
            phone: newAddress.phone,
            fullAddress: `${newAddress.fullAddress}, ${newAddress.city}`,
            isDefault: addresses.length === 0 // default if first address
          });
          setAddresses(res.data.data);
        } catch {
          // non-blocking — order still goes through
        }
      }

      // Place order.
      // NOTE: for a Buy Now checkout we explicitly pass `items` + `buyNow: true`
      // so the backend creates an order for just this product/size/quantity
      // instead of pulling the user's full cart. Confirm your /api/v1/orders
      // route on the backend actually supports this — if it currently always
      // builds the order from the cart, it needs a small update to honor an
      // `items` override when present.
      //
      // paymentMethod is always "online" now — see note at top of file.
      // The backend must independently reject/ignore any "cod" value it
      // receives; don't rely on this screen alone to enforce that.
      const orderPayload = isBuyNow
        ? {
            ...details,
            paymentMethod: PAYMENT_METHOD,
            buyNow: true,
            items: orderItems.map(({ productId, size, quantity, price }) => ({
              product: productId, size, quantity, price
            })),
          }
        : {
            ...details,
            paymentMethod: PAYMENT_METHOD
          };

      const res = await API.post("/api/v1/orders", orderPayload);

      const order = res.data.data;
      const orderId = order._id;
      setPlacedOrderId(orderId);

      // Only the cart-based flow needs a cart refresh — a Buy Now purchase
      // never touched the cart, so there's nothing to re-fetch/clear there.
      if (!isBuyNow) await fetchCart();

      // Online — Razorpay (the only path now; no COD branch)
      const payRes = await API.post("/api/v1/payment/create-order", { orderId });
      const { razorpayOrderId, amount, currency, key } = payRes.data.data;

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "The Little Kingdom",
        description: "Order Payment",
        config: {
        display: {
          configuration: "config_TG72UyLMP5Jdf1"
        }
        },
        handler: async function (response) {
          try {
            await API.post("/api/v1/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            setSuccess(true);
            setTimeout(() => navigate(`/orders/${orderId}`), 2500);
          } catch {
            setError("Payment verification failed. Check your orders page.");
            navigate(`/orders/${orderId}`);
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              await API.post("/api/v1/payment/failure", { razorpay_order_id: razorpayOrderId });
            } catch {}
            setError("Payment cancelled. Your order has been cancelled.");
            setPlacing(false);
          }
        },
        prefill: { contact: details.phoneNumber },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 sm:py-8 px-3 sm:px-4 relative overflow-hidden">
        <GlassStyles />
        <div className="lg-blobs"><div className="lg-blob lg-blob-1" /><div className="lg-blob lg-blob-2" /></div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4 sm:gap-5 animate-pulse relative z-10">
          <div className="md:col-span-2 space-y-4">
            <div className="h-48 glass-card rounded-2xl" />
            <div className="h-32 glass-card rounded-2xl" />
          </div>
          <div className="h-64 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
        <GlassStyles />
        <div className="lg-blobs">
          <div className="lg-blob lg-blob-1" />
          <div className="lg-blob lg-blob-2" />
          <div className="lg-blob lg-blob-3" />
        </div>
        <div className="glass-card relative z-10 rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center space-y-4">
          <div className="glass-icon-chip w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-blue-600" />
          </div>
          <div className="space-y-1">
            <h2 className="lg-display text-xl font-semibold text-gray-900">Order Placed!</h2>
            <p className="text-sm text-gray-500">
              Payment successful! Redirecting to order details...
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "rgb(37,99,235)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <button onClick={() => navigate(`/orders/${placedOrderId}`)}
            className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold">
            View Order <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-5 sm:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      <GlassStyles />
      <div className="lg-blobs">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 relative z-10">

        <div>
          <div className="glass-pill mb-2">
            <span className="glass-dot" />
            {isBuyNow ? "Buy Now" : "Checkout"}
          </div>
          <h1 className="lg-display text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
            Checkout
            {isBuyNow && (
              <span className="glass-tile inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Zap size={11} className="fill-current" /> Buy Now
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Review your order and complete purchase</p>
        </div>

        {error && (
          <div className="glass-card flex items-start sm:items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={15} className="shrink-0 mt-0.5 sm:mt-0" /> <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          <div className="md:col-span-2 space-y-4">

            {/* ── Delivery Address ── */}
            <Reveal>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/60">
                  <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <h2 className="lg-display text-sm font-semibold text-gray-900">Delivery Address</h2>
                </div>

                <div className="p-4 sm:p-5 space-y-3">

                  {/* Saved addresses */}
                  {hasAddresses && !showNewForm && (
                    <>
                      {addresses.map(addr => (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddressId(addr._id)}
                          className={`glass-radio-tile flex items-start gap-3 p-3.5 sm:p-4 rounded-xl cursor-pointer
                            ${selectedAddressId === addr._id ? "glass-radio-selected" : ""}`}
                        >
                          {/* Radio dot */}
                          <div
                            className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all
                              ${selectedAddressId === addr._id ? "border-transparent" : "border-gray-300"}`}
                            style={selectedAddressId === addr._id
                              ? { background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.95))" }
                              : {}}
                          >
                            {selectedAddressId === addr._id && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-gray-800">{addr.name}</p>
                              {addr.isDefault && (
                                <span className="glass-pill !py-0.5 !px-2 !text-[10px]">
                                  <Star size={9} fill="currentColor" /> Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">{addr.fullAddress}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Phone size={11} className="shrink-0" /> {addr.phone}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Add different address toggle */}
                      {addresses.length < 5 && (
                        <button
                          onClick={() => { setShowNewForm(true); setNewAddress(EMPTY_NEW); }}
                          className="glass-dashed w-full flex items-center gap-2 p-3.5 sm:p-4 text-gray-500 rounded-xl text-sm font-semibold"
                        >
                          <Plus size={15} /> Use a different address
                        </button>
                      )}
                    </>
                  )}

                  {/* New address form */}
                  {(showNewForm || !hasAddresses) && (
                    <div className="space-y-3">

                      {/* Back to saved — only if they have saved addresses */}
                      {hasAddresses && (
                        <button
                          onClick={() => { setShowNewForm(false); setSaveNewAddress(false); setNewAddress(EMPTY_NEW); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 transition-colors"
                        >
                          <X size={13} /> Cancel — use saved address
                        </button>
                      )}

                      {!hasAddresses && (
                        <p className="text-xs text-gray-500 font-medium">
                          No saved addresses found. Please enter a delivery address.
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Full name *"
                          value={newAddress.name}
                          onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                          className="w-full px-3 py-2.5 border border-white/70 bg-white/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone number *"
                            maxLength={10}
                            value={newAddress.phone}
                            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, "") })}
                            className={`w-full px-3 py-2.5 border bg-white/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all
                              ${newAddress.phone && !isPhoneValid ? "border-red-300 focus:ring-red-400" : "border-white/70 focus:ring-blue-500"}`}
                          />
                          {newAddress.phone && (
                            <p className={`text-xs mt-1 pl-1 ${isPhoneValid ? "text-green-600" : "text-gray-400"}`}>
                              {newAddress.phone.length}/10 {isPhoneValid && "✓"}
                            </p>
                          )}
                        </div>
                      </div>

                      <textarea
                        placeholder="House / Flat no., Street, Area *"
                        rows={2}
                        value={newAddress.fullAddress}
                        onChange={e => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                        className="w-full px-3 py-2.5 border border-white/70 bg-white/70 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <input
                        type="text"
                        placeholder="City *"
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-3 py-2.5 border border-white/70 bg-white/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {/* Save for future */}
                      {addresses.length < 5 && (
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                          <input
                            type="checkbox"
                            checked={saveNewAddress}
                            onChange={e => setSaveNewAddress(e.target.checked)}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <span className="text-xs font-semibold text-gray-600">
                            Save this address for future orders
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

            {/* ── Payment ── */}
            {/* Single online-payment path — no method selector since there's no
                longer a choice to make. Shown as an info card instead of a
                fake radio-button list of one. */}
            <Reveal delay={80}>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/60">
                  <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                    <CreditCard size={14} className="text-blue-600" />
                  </div>
                  <h2 className="lg-display text-sm font-semibold text-gray-900">Payment</h2>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="glass-radio-tile glass-radio-selected flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl">
                    <div className="glass-icon-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldCheck size={17} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">Secure Online Payment</p>
                      <p className="text-xs text-gray-500">Pay via UPI, Card or Netbanking · powered by Razorpay</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Cash on Delivery is no longer available. All orders are paid online.
                  </p>
                </div>
              </div>
            </Reveal>

          </div>

          {/* ── Order Summary ── */}
          <div>
            <Reveal delay={140}>
              <div className="glass-card rounded-2xl md:sticky md:top-24">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/60">
                  <div className="glass-icon-chip w-7 h-7 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={14} className="text-blue-600" />
                  </div>
                  <h2 className="lg-display text-sm font-semibold text-gray-900">Order Summary</h2>
                </div>
                <div className="p-4 sm:p-5 space-y-4">

                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                        <div className="glass-tile w-10 h-10 rounded-xl overflow-hidden shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag size={14} className="text-blue-300" />
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">Size: {item.size} × {item.quantity}</p>
                        </div>
                        <p className="text-xs font-black text-gray-800 shrink-0">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/60 pt-3 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{orderTotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Delivery</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-white/60">
                      <span>Total</span>
                      <span className="text-blue-700 text-base">₹{orderTotal}</span>
                    </div>
                  </div>

                  {/* Selected address preview */}
                  {!showNewForm && selectedAddress && (
                    <div className="glass-tile rounded-xl px-3 py-2.5 space-y-0.5">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <MapPin size={11} className="text-blue-600 shrink-0" /> Delivering to
                      </p>
                      <p className="text-xs text-gray-600 break-words">{selectedAddress.name} · {selectedAddress.phone}</p>
                      <p className="text-xs text-gray-400 leading-relaxed break-words">{selectedAddress.fullAddress}</p>
                    </div>
                  )}

                  <div className="glass-tile flex items-center gap-2 rounded-xl px-3 py-2">
                    <Tag size={12} className="text-blue-600 shrink-0" />
                    <span className="text-xs text-gray-500">
                      Paying via <span className="font-bold text-gray-700">Online Payment</span>
                    </span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing || !isFormValid()}
                    className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
                  >
                    {placing
                      ? <><Loader2 size={16} className="animate-spin" /> Opening Payment...</>
                      : <><CheckCircle size={16} /> Pay Now</>
                    }
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    By placing order you agree to our terms
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </div>
  );
}