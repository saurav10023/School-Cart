import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Trash2, Plus, Minus, AlertCircle,
  ChevronRight, ShoppingCart, ArrowLeft, Tag
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

/*
  Liquid Glass — Cart
  Brand: blue (kept from the original palette)
    #2563EB  — blue-600 (primary)
    #1D4ED8  — blue-700 (deep / pressed)
    #3B82F6  — blue-500 (bright / highlights)
  BRAND_RGB = 37,99,235
*/

const GlassStyles = () => (
  <style>{`
    @keyframes drift-a {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -40px) scale(1.08); }
    }
    @keyframes drift-b {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-40px, 30px) scale(1.05); }
    }
    @keyframes drift-c {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(20px, 25px) scale(0.95); }
    }
    .blob-a { animation: drift-a 15s ease-in-out infinite; }
    .blob-b { animation: drift-b 13s ease-in-out infinite; }
    .blob-c { animation: drift-c 17s ease-in-out infinite; }

    .glass-card {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 26px -14px rgba(37,99,235,0.3),
                  inset 0 1px 0 rgba(255,255,255,0.85);
    }

    .glass-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 7px 15px; border-radius: 999px;
      font-weight: 600; font-size: 12px;
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 20px -10px rgba(37,99,235,0.35),
                  inset 0 1px 0 rgba(255,255,255,0.9);
      color: #1D4ED8;
    }
    .glass-dot { width:6px; height:6px; border-radius:999px; background: #2563EB; flex-shrink: 0; }

    .icon-chip {
      background: linear-gradient(150deg, rgba(37,99,235,0.20), rgba(37,99,235,0.08));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(37,99,235,0.35);
    }

    .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
    .glass-shine::after {
      content: ""; position: absolute; top: 0; left: -60%;
      width: 40%; height: 100%;
      background: linear-gradient(115deg, transparent, rgba(255,255,255,0.6), transparent);
      transform: skewX(-18deg);
      transition: left 0.75s ease;
      pointer-events: none;
    }
    .glass-shine:hover::after { left: 130%; }

    .btn-primary-glass {
      background: linear-gradient(135deg, rgba(37,99,235,0.92), rgba(29,78,216,0.92));
      border: 1px solid rgba(255,255,255,0.35);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 12px 28px -12px rgba(37,99,235,0.55),
                  inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-primary-glass:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 34px -12px rgba(37,99,235,0.6),
                  inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .btn-primary-glass:active { transform: translateY(0); }

    .btn-secondary-glass {
      background: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 6px 16px -10px rgba(37,99,235,0.25),
                  inset 0 1px 0 rgba(255,255,255,0.85);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .btn-secondary-glass:hover { background: rgba(255,255,255,0.75); transform: translateY(-1px); }

    .fade-up {
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .fade-up.in-view {
      opacity: 1;
      transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .blob-a, .blob-b, .blob-c, .fade-up { animation: none !important; transition: none !important; }
      .fade-up { opacity: 1; transform: none; }
    }
  `}</style>
);

const useFadeIn = (count) => {
  const refs = useRef([]);
  refs.current = [];
  const addRef = (el) => { if (el && !refs.current.includes(el)) refs.current.push(el); };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  return addRef;
};

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    cart,
    total,
    loading,
    error,
    updateItem,
    removeItem,
    clearCart
  } = useCart();

  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  const handleUpdateQuantity = async (productId, size, quantity) => {
    const key = `${productId}-${size}`;
    setUpdatingItem(key);
    setActionError("");
    const result = await updateItem(productId, size, quantity);
    if (!result.success) setActionError(result.message);
    setUpdatingItem(null);
  };

  const handleRemoveItem = async (productId, size) => {
    const key = `${productId}-${size}`;
    setRemovingItem(key);
    setActionError("");
    const result = await removeItem(productId, size);
    if (!result.success) setActionError(result.message);
    setRemovingItem(null);
  };

  const handleClearCart = async () => {
    setClearingCart(true);
    setActionError("");
    const result = await clearCart();
    if (!result.success) setActionError(result.message);
    setClearingCart(false);
  };

  const isEmpty = !cart || cart.items?.length === 0;
  const addFadeRef = useFadeIn((cart?.items?.length || 0) + 2);

  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        className="blob-a absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-40 blur-3xl"
        style={{ background: "#3B82F6" }}
      />
      <div
        className="blob-b absolute top-1/3 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "#2563EB" }}
      />
      <div
        className="blob-c absolute -bottom-24 left-1/4 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "#1D4ED8" }}
      />
    </div>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
        <GlassStyles />
        <Background />
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 rounded-xl w-40 glass-card" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-2xl glass-card" />
              ))}
            </div>
            <div className="h-64 rounded-2xl glass-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
      <GlassStyles />
      <Background />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-up in-view">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl glass-card glass-shine transition-colors"
            >
              <ArrowLeft size={18} className="text-blue-700" />
            </button>
            <div>
              <div className="glass-pill mb-1.5">
                <span className="glass-dot" />
                My Cart
              </div>
              {!isEmpty && (
                <p className="text-xs text-gray-400 pl-1">
                  {cart.items.length} item{cart.items.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {!isEmpty && (
            <button
              onClick={handleClearCart}
              disabled={clearingCart}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 glass-card px-3 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
              {clearingCart ? "Clearing..." : "Clear Cart"}
            </button>
          )}
        </div>

        {/* Error */}
        {(error || actionError) && (
          <div className="flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm glass-card fade-up in-view">
            <AlertCircle size={15} />
            {actionError || error}
          </div>
        )}

        {/* Empty Cart */}
        {isEmpty ? (
          <div
            ref={addFadeRef}
            className="fade-up flex flex-col items-center justify-center py-24 gap-4 rounded-2xl glass-card"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center icon-chip">
              <ShoppingCart size={28} className="text-blue-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-black text-gray-800">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some products to get started</p>
            </div>
            <Link
              to="/"
              className="glass-shine flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary-glass"
            >
              <ShoppingBag size={15} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">

            {/* Cart Items */}
            <div className="md:col-span-2 space-y-3">
              {cart.items.map((item, idx) => {
                const key = `${item.product?._id || item.product}-${item.size}`;
                const isUpdating = updatingItem === key;
                const isRemoving = removingItem === key;
                const productId = item.product?._id || item.product;
                const productName = item.product?.name || "Product";
                const productImage = item.product?.images?.[0] || null;
                const maxStock = item.product?.sizes?.find(s => s.size === item.size)?.stock || 99;

                return (
                  <div
                    key={key}
                    ref={addFadeRef}
                    style={{ transitionDelay: `${Math.min(idx, 8) * 90}ms` }}
                    className={`fade-up glass-card glass-shine rounded-2xl p-4 flex gap-4 transition-all duration-200 ${
                      isRemoving ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    {/* Image */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white/60 shrink-0 cursor-pointer"
                      onClick={() => navigate(`/products/${productId}`)}
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-blue-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="text-sm font-bold text-gray-800 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/products/${productId}`)}
                          >
                            {productName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="glass-pill py-1 px-2.5 text-[11px]">
                              Size: {item.size}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveItem(productId, item.size)}
                          disabled={isRemoving}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50/70 rounded-lg transition-all shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-1 text-blue-700">
                          <Tag size={12} />
                          <span className="text-sm font-black">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400">
                              (₹{item.price} × {item.quantity})
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-xl overflow-hidden glass-card">
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.size, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-blue-700 hover:bg-white/50 disabled:opacity-30 transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-gray-900">
                            {isUpdating ? (
                              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.size, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= maxStock}
                            className="w-8 h-8 flex items-center justify-center text-blue-700 hover:bg-white/50 disabled:opacity-30 transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div
                ref={addFadeRef}
                className="fade-up glass-card rounded-2xl p-5 space-y-4 sticky top-24"
              >
                <div className="glass-pill">
                  <span className="glass-dot" />
                  Order Summary
                </div>

                <div className="space-y-2.5 text-sm pt-1">
                  {cart.items.map((item) => {
                    const productName = item.product?.name || "Product";
                    return (
                      <div
                        key={`${item.product?._id}-${item.size}`}
                        className="flex justify-between text-gray-500"
                      >
                        <span className="line-clamp-1 flex-1 pr-2">
                          {productName} ({item.size}) × {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-700 shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/70 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Total</span>
                  <span className="text-xl font-black text-blue-700">₹{total}</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="glass-shine w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold text-sm btn-primary-glass"
                >
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </button>

                <Link
                  to="/"
                  className="btn-secondary-glass flex items-center justify-center gap-1.5 text-sm text-blue-700 py-2.5 rounded-xl transition-colors"
                >
                  <ArrowLeft size={14} />
                  Continue Shopping
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;