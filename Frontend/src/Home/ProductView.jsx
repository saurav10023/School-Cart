import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag, ChevronLeft, Plus, Minus,
  AlertCircle, CheckCircle, Tag, Package, ShoppingCart, Zap, X, MessageCircleQuestion
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

// TODO: replace with your business WhatsApp number — FULL international
// format, country code included, no "+", no spaces/dashes.
// e.g. India: "91XXXXXXXXXX" (91 + 10-digit number). A number without the
// country code will silently produce a broken wa.me link.
const WHATSAPP_NUMBER = "7004335880";

/*
  Liquid Glass — Product View
  Brand: blue (kept from the original palette)
    #2563EB — blue-600 (primary)
    #1D4ED8 — blue-700 (deep / pressed)
    #3B82F6 — blue-500 (bright / highlights)
  BRAND_RGB = 37,99,235
  WhatsApp green (#25D366) is kept as-is — it's WhatsApp's own brand mark,
  not part of the site's accent system, so it isn't re-tinted.
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
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(255,255,255,0.9);
      backdrop-filter: blur(16px) saturate(140%);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      box-shadow: 0 14px 32px -12px rgba(37,99,235,0.35),
                  inset 0 1px 0 rgba(255,255,255,0.9);
    }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .glass-card { background: rgba(255,255,255,0.95); }
    }

    .glass-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 13px; border-radius: 999px;
      font-weight: 700; font-size: 11px;
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 20px -10px rgba(37,99,235,0.35),
                  inset 0 1px 0 rgba(255,255,255,0.9);
      color: #1D4ED8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .glass-dot { width:6px; height:6px; border-radius:999px; background: #2563EB; flex-shrink: 0; }

    .icon-chip {
      background: linear-gradient(150deg, rgba(37,99,235,0.20), rgba(37,99,235,0.08));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(37,99,235,0.35);
    }

    .icon-chip-red {
      background: linear-gradient(150deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(239,68,68,0.3);
    }

    .icon-chip-green {
      background: linear-gradient(150deg, rgba(37,197,94,0.20), rgba(37,197,94,0.06));
      border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(37,197,94,0.3);
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
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }
    .btn-primary-glass:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 16px 34px -12px rgba(37,99,235,0.6),
                  inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .btn-primary-glass:active:not(:disabled) { transform: translateY(0); }
    .btn-primary-glass:disabled {
      background: linear-gradient(135deg, rgba(148,163,184,0.55), rgba(100,116,139,0.55));
      box-shadow: none;
    }

    .btn-secondary-glass {
      background: rgba(255,255,255,0.5);
      border: 1.5px solid rgba(37,99,235,0.45);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 6px 16px -10px rgba(37,99,235,0.25),
                  inset 0 1px 0 rgba(255,255,255,0.85);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .btn-secondary-glass:hover:not(:disabled) { background: rgba(255,255,255,0.8); transform: translateY(-1px); }
    .btn-secondary-glass:disabled { border-color: rgba(203,213,225,0.7); }

    .btn-whatsapp-glass {
      background: linear-gradient(135deg, rgba(37,197,94,0.9), rgba(22,163,74,0.9));
      border: 1px solid rgba(255,255,255,0.35);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 12px 24px -12px rgba(22,163,74,0.5),
                  inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-whatsapp-glass:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 30px -12px rgba(22,163,74,0.55), inset 0 1px 0 rgba(255,255,255,0.4);
    }

    .size-chip {
      border-radius: 12px;
      border: 1.5px solid rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.15s ease;
    }
    .size-chip-active {
      background: linear-gradient(135deg, rgba(37,99,235,0.92), rgba(29,78,216,0.92));
      border-color: rgba(255,255,255,0.4);
      box-shadow: 0 10px 20px -10px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.35);
      color: white;
    }
    .size-chip-oos {
      background: rgba(254,242,242,0.6);
      border-color: rgba(252,165,165,0.6);
    }

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

// Simple inline WhatsApp glyph (lucide has no brand icons)
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.454h.005c9.66 0 15.923-9.673 12.14-17.06a11.886 11.886 0 00-3.683-3.293zM12.063 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.004-5.451 4.437-9.884 9.891-9.884 2.641 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.452-4.436 9.884-9.888 9.884z" />
  </svg>
);

const Background = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div
      className="blob-a absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-50 blur-3xl"
      style={{ background: "#3B82F6" }}
    />
    <div
      className="blob-b absolute top-1/3 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
      style={{ background: "#2563EB" }}
    />
    <div
      className="blob-c absolute -bottom-24 left-1/4 w-72 h-72 rounded-full opacity-40 blur-3xl"
      style={{ background: "#1D4ED8" }}
    />
  </div>
);

const useFadeIn = () => {
  const observerRef = useRef(null);
  if (!observerRef.current) {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  useEffect(() => {
    const observer = observerRef.current;
    return () => observer?.disconnect();
  }, []);

  // Observes immediately when an element mounts, rather than waiting on an
  // effect tied to render count — fixes elements that first appear after
  // async data (e.g. product) finishes loading.
  const addRef = (el) => {
    if (el) observerRef.current.observe(el);
  };

  return addRef;
};

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [cartLoading, setCartLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState("");
  const [cartError, setCartError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const addFadeRef = useFadeIn();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/api/v1/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const selectedSizeData = product?.sizes?.find(s => s.size === selectedSize);
  const maxQuantity = Number(selectedSizeData?.stock) > 0 ? Number(selectedSizeData.stock) : 0;
  // True only once a size is actually selected and that size has no stock —
  // stays false while nothing is selected yet, so it doesn't block the
  // initial "select a size" prompt.
  const selectedSizeOutOfStock = !!selectedSize && maxQuantity === 0;

  const handleQuantityChange = (val) => {
    if (val < 1) return;
    if (val > maxQuantity) return;
    setQuantity(val);
  };

  // Builds a friendly, product-specific WhatsApp enquiry message
  const getWhatsAppMessage = () => {
    if (!product) return "";
    const sizeText = selectedSize ? ` (Size: ${selectedSize})` : "";
    let reason;
    if (product.isAvailable === false) {
      reason = "unavailable";
    } else if (selectedSizeOutOfStock) {
      reason = `out of stock in size ${selectedSize}`;
    } else {
      reason = "out of stock";
    }
    const link = typeof window !== "undefined" ? window.location.href : "";
    return `Hi! I'm interested in *${product.name}*${sizeText}, but it currently shows as ${reason} on the site.\n\nCould you let me know if/when it'll be back in stock, or if it's available another way?\n\n${link}`;
  };

  const getWhatsAppLink = () => {
    const sanitizedNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, "");
    if (sanitizedNumber.length < 11) {
      // wa.me needs the FULL international number (country code + number),
      // e.g. 91XXXXXXXXXX for India. A 10-digit local number will open
      // WhatsApp but fail to find a matching contact.
      console.warn(
        "WHATSAPP_NUMBER is missing its country code — wa.me links will not work correctly."
      );
    }
    return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(getWhatsAppMessage())}`;
  };

  const handleBuyNow = () => {
    if (!canTransact) {
      setShowWhatsAppModal(true);
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedSize) {
      setCartError("Please select a size first");
      return;
    }

    setBuyLoading(true);
    navigate("/checkout", {
      state: {
        buyNow: true,
        product: {
          _id: product._id,
          name: product.name,
          image: product.images?.[0],
          size: selectedSize,
          quantity,
          price: selectedSizeData.price,
        },
      },
    });
  };

  const handleAddToCart = async () => {
    if (!canTransact) {
      setShowWhatsAppModal(true);
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedSize) {
      setCartError("Please select a size first");
      return;
    }

    setCartLoading(true);
    setCartError("");
    setCartSuccess("");

    // use CartContext addToCart — also updates navbar badge automatically
    const result = await addToCart(product._id, selectedSize, quantity);

    if (result.success) {
      setCartSuccess("Added to cart successfully!");
      setTimeout(() => setCartSuccess(""), 3000);
    } else {
      setCartError(result.message);
    }

    setCartLoading(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="relative min-h-screen" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
        <GlassStyles />
        <Background />
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 py-6 animate-pulse">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 sm:h-96 glass-card rounded-2xl" />
            <div className="space-y-3">
              <div className="h-3 glass-card rounded w-1/4" />
              <div className="h-6 glass-card rounded w-3/4" />
              <div className="h-6 glass-card rounded w-1/3" />
              <div className="h-12 glass-card rounded" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-9 w-14 glass-card rounded-xl" />)}
              </div>
              <div className="h-10 glass-card rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative min-h-screen" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
        <GlassStyles />
        <Background />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center icon-chip-red">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <p className="text-gray-500 text-base">{error || "Product not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="glass-shine px-5 py-2.5 text-white text-sm font-semibold rounded-xl btn-primary-glass"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Coerce to Number — API/DB may return stock as a string ("0"), which made
  // `s.stock === 0` always false and let out-of-stock items through.
  const isOutOfStock =
    !product.sizes?.length || product.sizes.every(s => Number(s.stock) <= 0);
  // Only block on availability when the API explicitly says false — treat a
  // missing/undefined field as available rather than locking everything out.
  const isAvailable = product.isAvailable !== false;
  // Blocked either when the whole product has nothing in stock, OR when the
  // specific size the shopper picked has none — either case routes to the
  // WhatsApp enquiry flow below.
  const canTransact = isAvailable && !isOutOfStock && !selectedSizeOutOfStock;

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
      <GlassStyles />
      <Background />

      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 glass-card glass-shine rounded-xl px-2.5 py-1.5 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Main Card */}
        <div ref={addFadeRef} className="fade-up glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">

            {/* Images */}
            <div className="p-3 sm:p-5 space-y-2">
              {/* Main image */}
              <div className="group relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-xl sm:rounded-2xl overflow-hidden glass-card">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={40} className="text-blue-200" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  {!isAvailable ? (
                    <span className="glass-pill" style={{ color: "#dc2626", boxShadow: "0 8px 20px -10px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
                      Unavailable
                    </span>
                  ) : <span />}

                  {isOutOfStock && (
                    <span className="glass-pill" style={{ color: "#111827" }}>
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail strip */}
              {product.images?.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-150 size-chip ${
                        selectedImage === i ? "ring-2" : ""
                      }`}
                      style={selectedImage === i ? { borderColor: "#2563EB", boxShadow: "0 0 0 2px rgba(37,99,235,0.2)" } : {}}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 sm:p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">

                {/* Category + Name */}
                <div className="space-y-1.5">
                  <span className="glass-pill">
                    <span className="glass-dot" />
                    {product.category}
                  </span>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <Tag size={14} className="text-blue-600 shrink-0" />
                  <span className="text-xl sm:text-2xl font-black text-gray-900">
                    {selectedSizeData
                      ? `₹${selectedSizeData.price}`
                      : product.sizes?.length
                        ? `₹${Math.min(...product.sizes.map(s => s.price))}`
                        : "—"
                    }
                  </span>
                  {!selectedSizeData && product.sizes?.length > 1 && (
                    <span className="text-xs text-gray-400 font-medium">onwards</span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Size Selector */}
                {product.sizes?.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-xs sm:text-sm font-bold text-gray-700">
                      Select Size
                      {selectedSize && (
                        <span className={`ml-2 text-xs font-bold ${maxQuantity > 0 ? "text-green-600" : "text-red-600"}`}>
                          {maxQuantity > 0 ? "Available" : "Out of Stock"}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((s) => {
                        const outOfStock = Number(s.stock) <= 0;
                        const isSelected = selectedSize === s.size;
                        return (
                          <button
                            key={s.size}
                            onClick={() => {
                              setSelectedSize(s.size);
                              setQuantity(1);
                              setCartError("");
                            }}
                            className={`min-w-[2.5rem] px-3 py-1.5 text-xs sm:text-sm font-bold size-chip
                              ${outOfStock
                                ? `size-chip-oos ${isSelected ? "text-red-500 line-through" : "text-red-300 line-through"}`
                                : isSelected
                                  ? "size-chip-active"
                                  : "text-gray-700 hover:border-blue-300"
                              }`}
                          >
                            {s.size}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedSize && (
                      <p className="text-xs text-gray-400">Please select a size to continue</p>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                {selectedSize && maxQuantity > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Quantity</p>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center rounded-xl overflow-hidden glass-card">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-blue-700 hover:bg-white/50 active:bg-white/70 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 sm:w-9 text-center text-sm font-black text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= maxQuantity}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-blue-700 hover:bg-white/50 active:bg-white/70 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-green-600">
                        In Stock
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart feedback */}
              {cartError && (
                <div className="flex items-center gap-2 text-red-600 px-3 py-2 rounded-xl text-xs sm:text-sm glass-card">
                  <AlertCircle size={14} className="shrink-0" />
                  {cartError}
                </div>
              )}

              {cartSuccess && (
                <div className="flex items-center gap-2 text-green-700 px-3 py-2 rounded-xl text-xs sm:text-sm glass-card">
                  <CheckCircle size={14} className="shrink-0" />
                  {cartSuccess}
                </div>
              )}

              {/* Action Buttons — desktop / tablet inline */}
              <div className="hidden lg:flex items-stretch gap-2.5 pt-1">
                <button
                  onClick={handleBuyNow}
                  disabled={buyLoading}
                  className={`glass-shine flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150 text-white btn-primary-glass
                    ${buyLoading ? "opacity-70 cursor-wait" : ""}`}
                >
                  <Zap size={16} className="fill-current" />
                  {!canTransact ? "Out of Stock" : "Buy Now"}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150 btn-secondary-glass
                    ${canTransact ? "text-blue-700" : "text-gray-400"}
                    ${cartLoading ? "opacity-70 cursor-wait" : ""}`}
                >
                  {cartLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <ShoppingBag size={16} />
                  )}
                  {cartLoading ? "Adding..." : "Add to Cart"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="glass-card glass-shine flex items-center justify-center px-3.5 text-blue-700 rounded-xl transition-all duration-150"
                  aria-label="View cart"
                >
                  <ShoppingCart size={17} />
                </button>
              </div>

              {/* Static WhatsApp enquiry — desktop / tablet, only when unavailable */}
              {!canTransact && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-shine hidden lg:flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150 btn-whatsapp-glass"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Check Availability on WhatsApp
                </a>
              )}

              {/* Stock info */}
              <div className="hidden lg:flex items-center gap-2 text-xs pt-0.5">
                <Package size={13} className="text-gray-400" />
                <span className={`font-bold ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {isOutOfStock ? "Out of Stock" : "Available"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock info — mobile/tablet, shown under card */}
        <div className="flex lg:hidden items-center gap-2 text-xs px-1">
          <Package size={13} className="text-gray-400" />
          <span className={`font-bold ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
            {isOutOfStock ? "Out of Stock" : "Available"}
          </span>
        </div>

        {/* Static WhatsApp enquiry — mobile / tablet, only when unavailable */}
        {!canTransact && (
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-shine lg:hidden flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150 btn-whatsapp-glass"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Check Availability on WhatsApp
          </a>
        )}
      </div>

      {/* Sticky action bar — mobile / tablet */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 -10px 30px -10px rgba(37,99,235,0.15)"
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/cart")}
            className="glass-card flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0 text-blue-700 rounded-xl transition-colors"
            aria-label="View cart"
          >
            <ShoppingCart size={17} />
          </button>

          <button
            onClick={handleAddToCart}
            disabled={cartLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm active:scale-[0.98] transition-all duration-150 btn-secondary-glass
              ${canTransact ? "text-blue-700" : "text-gray-400"}
              ${cartLoading ? "opacity-70 cursor-wait" : ""}`}
          >
            {cartLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <ShoppingBag size={15} />
            )}
            <span className="hidden xs:inline sm:inline">{cartLoading ? "Adding..." : "Add to Cart"}</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={buyLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm active:scale-[0.98] transition-all duration-150 text-white btn-primary-glass
              ${buyLoading ? "opacity-70 cursor-wait" : ""}`}
          >
            <Zap size={15} className="fill-current" />
            {!canTransact ? "Out of Stock" : "Buy Now"}
          </button>
        </div>
      </div>

      {/* WhatsApp availability popup — shown when Buy Now / Add to Cart is
          clicked on an unavailable / out-of-stock item */}
      {showWhatsAppModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-4"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div
            className="glass-card rounded-2xl w-full sm:max-w-sm p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.85)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-chip-green">
                <WhatsAppIcon className="w-6 h-6 text-green-600" />
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <MessageCircleQuestion size={16} className="text-gray-400" />
                {!isAvailable
                  ? "This item is currently unavailable"
                  : selectedSizeOutOfStock
                    ? `Size ${selectedSize} is out of stock`
                    : "This item is out of stock"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We're sorry — <span className="font-semibold text-gray-700">{product.name}</span>
                {selectedSize ? ` (Size ${selectedSize})` : ""} isn't ready to ship right now.
                Message us on WhatsApp and we'll check availability or notify you when it's back.
              </p>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowWhatsAppModal(false)}
              className="glass-shine w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150 btn-whatsapp-glass"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Ask on WhatsApp
            </a>

            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;