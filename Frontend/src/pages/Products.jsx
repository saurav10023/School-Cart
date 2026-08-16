import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, AlertCircle, Tag, SlidersHorizontal, X, PackageX, Layers } from "lucide-react";
import API from "../api/axios";

const CATEGORIES = ["all", "uniform", "bag", "stationery", "socks"];

/* ─────────────────────────────────────────────────────────
   Liquid Glass tokens — same recipe/brand blue as the rest of
   the app (see Profile.jsx). If these classes already live in
   a shared stylesheet, drop this block and just keep the JSX.
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
    .lg-blob-2 { width: 400px; height: 400px; top: 30%; right: -140px;
      background: radial-gradient(circle, rgba(var(--brand-2),0.5), transparent 70%);
      animation: lg-drift-2 14s ease-in-out infinite; }
    .lg-blob-3 { width: 360px; height: 360px; bottom: -140px; left: 20%;
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

    .glass-chip-filter {
      background: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .glass-chip-filter:hover { transform: translateY(-1px); background: rgba(255,255,255,0.8); }
    .glass-chip-active {
      background: linear-gradient(135deg, rgba(var(--brand),0.92), rgba(var(--brand-2),0.92));
      border: 1px solid rgba(255,255,255,0.4); color: white;
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.55), inset 0 1px 0 rgba(255,255,255,0.35);
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
      border: 1px solid rgba(255,255,255,0.4);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 20px -10px rgba(var(--brand),0.55), inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .glass-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }

    .glass-product-card {
      background: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.75);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 20px -14px rgba(var(--brand),0.25), inset 0 1px 0 rgba(255,255,255,0.8);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .glass-product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 34px -16px rgba(var(--brand),0.4), inset 0 1px 0 rgba(255,255,255,0.9);
      border-color: rgba(255,255,255,0.95);
    }

    .glass-badge {
      background: rgba(255,255,255,0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.6);
    }

    .lg-reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .lg-reveal.lg-in-view { opacity: 1; transform: translateY(0); }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all"
  );

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const fetchProducts = async (category) => {
    setLoading(true);
    setError("");
    try {
      const url = category === "all"
        ? "/api/v1/products"
        : `/api/v1/products?category=${category}`;
      const res = await API.get(url);
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const SkeletonCard = () => (
    <div className="glass-product-card rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/40" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/50 rounded w-4/5" />
        <div className="h-3 bg-white/50 rounded w-2/5" />
        <div className="h-8 bg-white/50 rounded-xl mt-3" />
      </div>
    </div>
  );

  return (
    <div className="lg-root min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">
      <GlassStyles />
      <div className="lg-blobs">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Header ── */}
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <div className="glass-pill mb-3">
            <span className="glass-dot" />
            Browse
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="lg-display text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              All Products
            </h1>
            <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
              {loading ? "Loading…" : `${products.length} item${products.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* ── Sticky glass filter bar ── */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 pb-3">
          <div className="glass-card rounded-2xl px-3 sm:px-4 py-3 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 shrink-0">
              <SlidersHorizontal size={13} />
              Filter
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 w-max pr-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`glass-shine shrink-0 px-4 py-2 sm:py-1.5 rounded-full text-xs font-bold capitalize active:scale-95
                      ${activeCategory === cat ? "glass-chip-active" : "glass-chip-filter text-gray-600"}`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
                {activeCategory !== "all" && (
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="glass-chip-filter shrink-0 flex items-center gap-1 px-3 py-2 sm:py-1.5 text-xs font-bold text-red-500 hover:text-red-600 rounded-full active:scale-95"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-8 space-y-5">

          {/* Error */}
          {error && (
            <div className="glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-full">
                <div className="glass-card flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl">
                  <div className="glass-tile w-14 h-14 rounded-2xl flex items-center justify-center">
                    <PackageX size={26} className="text-blue-300" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    No products found {activeCategory !== "all" && `in "${activeCategory}"`}
                  </p>
                  {activeCategory !== "all" && (
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      View all products
                    </button>
                  )}
                </div>
              </div>
            ) : (
              products.map((product, i) => {
                const minPrice = product.sizes?.length
                  ? Math.min(...product.sizes.map(s => s.price))
                  : null;
                const isOutOfStock = product.sizes?.every(s => s.stock === 0);
                const totalStock = product.sizes?.reduce((sum, s) => sum + s.stock, 0) ?? null;
                const isLowStock = !isOutOfStock && totalStock !== null && totalStock <= 5;

                return (
                  <Reveal key={product._id} delay={(i % 10) * 40}>
                    <div
                      onClick={() => !isOutOfStock && navigate(`/products/${product._id}`)}
                      className={`glass-product-card rounded-2xl overflow-hidden group
                        ${isOutOfStock ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-white/40">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={26} className="text-blue-200" />
                          </div>
                        )}

                        {/* Out of stock overlay */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="glass-badge text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                              OUT OF STOCK
                            </span>
                          </div>
                        )}

                        {/* Category badge */}
                        <div className="glass-badge absolute top-2 left-2 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize">
                          {product.category}
                        </div>

                        {/* Low stock badge */}
                        {isLowStock && (
                          <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            Only {totalStock} left
                          </div>
                        )}

                        {/* Sizes badge */}
                        {!isOutOfStock && product.sizes?.length > 0 && (
                          <div className="glass-badge absolute bottom-2 right-2 flex items-center gap-1 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <Layers size={10} />
                            {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.2em]">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-1 text-blue-700">
                          <Tag size={11} className="shrink-0" />
                          <span className="text-sm font-black">
                            {minPrice !== null ? `₹${minPrice}` : "—"}
                          </span>
                          {product.sizes?.length > 1 && (
                            <span className="text-[10px] text-gray-400 font-normal">onwards</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) navigate(`/products/${product._id}`);
                          }}
                          disabled={isOutOfStock}
                          className="glass-shine w-full flex items-center justify-center gap-1 glass-btn-primary text-white text-xs font-bold py-2 sm:py-1.5 rounded-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag size={11} />
                          View
                        </button>
                      </div>
                    </div>
                  </Reveal>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;