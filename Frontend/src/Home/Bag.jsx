import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle, ChevronRight, Tag } from "lucide-react";
import API from "../api/axios";

/*
  Liquid Glass — Bags section
  Brand: blue (kept from the original palette)
    #2563EB — blue-600 (primary)
    #1D4ED8 — blue-700 (deep / pressed)
    #3B82F6 — blue-500 (bright / highlights)
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
    .blob-a { animation: drift-a 15s ease-in-out infinite; }
    .blob-b { animation: drift-b 13s ease-in-out infinite; }

    .glass-card {
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(255,255,255,0.9);
      backdrop-filter: blur(16px) saturate(140%);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      box-shadow: 0 14px 32px -14px rgba(37,99,235,0.32),
                  inset 0 1px 0 rgba(255,255,255,0.9);
    }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .glass-card { background: rgba(255,255,255,0.95); }
    }

    .glass-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 11px; border-radius: 999px;
      font-weight: 700; font-size: 10.5px;
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 6px 16px -8px rgba(37,99,235,0.35),
                  inset 0 1px 0 rgba(255,255,255,0.9);
      color: #1D4ED8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .glass-dot { width:5px; height:5px; border-radius:999px; background: #2563EB; flex-shrink: 0; }

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

    .btn-secondary-glass {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 6px 14px -10px rgba(37,99,235,0.25),
                  inset 0 1px 0 rgba(255,255,255,0.85);
      transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
    }
    .btn-secondary-glass:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(37,99,235,0.92), rgba(29,78,216,0.92));
      color: white;
    }

    .badge-oos {
      background: rgba(239,68,68,0.85);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .fade-up {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .fade-up.in-view {
      opacity: 1;
      transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .blob-a, .blob-b, .fade-up { animation: none !important; transition: none !important; }
      .fade-up { opacity: 1; transform: none; }
    }
  `}</style>
);

// Persistent-observer fade-in hook: observes an element the instant it
// mounts (via the ref callback itself), so it works correctly even for
// elements that only appear after async data — e.g. once products load.
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

  const addRef = (el) => {
    if (el) observerRef.current.observe(el);
  };

  return addRef;
};

const Bag = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const addFadeRef = useFadeIn();

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const res = await API.get("/api/v1/products?category=bag");
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load bags");
      } finally {
        setLoading(false);
      }
    };
    fetchBags();
  }, []);

  const SkeletonCard = () => (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 sm:h-44 bg-white/40" />
      <div className="p-3 space-y-1.5">
        <div className="h-3 bg-white/50 rounded w-3/4" />
        <div className="h-3 bg-white/40 rounded w-1/3" />
        <div className="h-7 bg-white/40 rounded-xl mt-2" />
      </div>
    </div>
  );

  return (
    <section id="bags" className="relative max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
      <GlassStyles />

      {/* Ambient blobs, scoped to this section */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0 rounded-3xl">
        <div className="blob-a absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-25 blur-3xl" style={{ background: "#3B82F6" }} />
        <div className="blob-b absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "#2563EB" }} />
      </div>

      <div className="relative z-10">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div className="space-y-1">
            <span className="glass-pill">
              <span className="glass-dot" />
              Collection
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 pt-1">
              School Bags
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Durable and spacious bags for every student
            </p>
          </div>

          <button
            onClick={() => navigate("/products?category=bag")}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 glass-card glass-shine rounded-xl px-3 py-1.5 transition-colors"
          >
            View All
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 px-3 py-2.5 rounded-xl text-sm mb-5 glass-card">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2.5 glass-card rounded-2xl">
              <ShoppingBag size={32} className="text-blue-200" />
              <p className="text-gray-400 text-sm font-medium">No bags available right now</p>
            </div>
          ) : (
            products.map((product, idx) => {
              const minPrice = product.sizes?.length
                ? Math.min(...product.sizes.map(s => s.price))
                : null;

              const isOutOfStock = product.sizes?.every(s => s.stock === 0);

              return (
                <div
                  key={product._id}
                  ref={addFadeRef}
                  style={{ transitionDelay: `${Math.min(idx, 8) * 60}ms` }}
                  onClick={() => !isOutOfStock && navigate(`/products/${product._id}`)}
                  className={`fade-up glass-card glass-shine rounded-2xl overflow-hidden transition-all duration-200 group
                    ${isOutOfStock ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5 cursor-pointer"}`}
                >
                  {/* Image */}
                  <div className="relative h-36 sm:h-44 overflow-hidden bg-white/40">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={28} className="text-blue-200" />
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="badge-oos text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Sizes count badge */}
                    {!isOutOfStock && product.sizes?.length > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 glass-pill py-1 px-2 text-[9px]">
                        {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 sm:p-3 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 text-blue-700">
                      <Tag size={11} />
                      <span className="text-xs sm:text-sm font-black">
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
                      className="btn-secondary-glass w-full flex items-center justify-center gap-1 text-blue-700 text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag size={11} />
                      View Product
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile view all */}
        {!loading && products.length > 0 && (
          <div className="sm:hidden mt-5 text-center">
            <button
              onClick={() => navigate("/products?category=bag")}
              className="glass-card glass-shine inline-flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-700 rounded-xl px-4 py-2 transition-colors"
            >
              View All Bags
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Bag;