import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle, ChevronRight, Tag, Footprints } from "lucide-react";
import API from "../api/axios";

const Socks = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSocks = async () => {
      try {
        const res = await API.get("/api/v1/products?category=socks");
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load socks");
      } finally {
        setLoading(false);
      }
    };
    fetchSocks();
  }, []);

  const SkeletonCard = () => (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 bg-white/40" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/50 rounded w-3/4" />
        <div className="h-4 bg-white/35 rounded w-1/3" />
        <div className="h-8 bg-white/35 rounded-xl mt-3" />
      </div>
    </div>
  );

  return (
    <section
      id="socks"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 overflow-hidden"
      style={{ "--brand": "37,99,235" /* blue-600 */, "--brand-2": "245,158,11" /* amber-500 */ }}
    >
      {/* Ambient glass blobs — quiet, brand colors unchanged */}
      <div className="glass-blob glass-blob--1 absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--2 absolute bottom-0 -right-16 w-80 h-80 rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="relative flex items-end justify-between mb-8">
        <div className="space-y-1">
          <div className="glass-pill inline-flex items-center gap-2 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-1">
            <span className="glass-dot w-1.5 h-1.5 rounded-full" />
            Collection
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Socks
          </h2>
          <p className="text-sm text-gray-400">
            School socks in all sizes and colors
          </p>
        </div>

        <button
          onClick={() => navigate("/products?category=socks")}
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Error → glass */}
      {error && (
        <div className="relative glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 border-red-200/70">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="relative grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
            <span className="glass-icon-chip flex items-center justify-center w-16 h-16 rounded-full">
              <Footprints size={28} className="text-blue-400" />
            </span>
            <p className="text-gray-400 text-sm font-medium">No socks available right now</p>
          </div>
        ) : (
          products.map((product) => {
            const minPrice = product.sizes?.length
              ? Math.min(...product.sizes.map(s => s.price))
              : null;

            const isOutOfStock = product.sizes?.every(s => s.stock === 0);

            return (
              <div
                key={product._id}
                onClick={() => !isOutOfStock && navigate(`/products/${product._id}`)}
                className={`glass-card glass-shine rounded-2xl overflow-hidden transition-all duration-200 group
                  ${isOutOfStock
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:-translate-y-1 cursor-pointer"
                  }`}
              >
                {/* Image */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-white/40">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Footprints size={32} className="text-blue-200" />
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {!isOutOfStock && product.sizes?.length > 0 && (
                    <div className="glass-pill-light absolute bottom-2 left-2 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 text-blue-700">
                    <Tag size={12} />
                    <span className="text-sm font-black">
                      {minPrice !== null ? `₹${minPrice}` : "—"}
                    </span>
                    {product.sizes?.length > 1 && (
                      <span className="text-xs text-gray-400 font-normal">onwards</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) navigate(`/products/${product._id}`);
                    }}
                    disabled={isOutOfStock}
                    className="glass-view-btn w-full flex items-center justify-center gap-1.5 text-blue-700 text-xs font-semibold py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={13} />
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
        <div className="relative sm:hidden mt-6 text-center">
          <button
            onClick={() => navigate("/products?category=socks")}
            className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Socks
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        /* ── Liquid glass core surface ── */
        .glass-card {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px -14px rgba(var(--brand),0.28),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }
        .glass-card.hover\\:-translate-y-1:hover {
          box-shadow: 0 18px 34px -16px rgba(var(--brand),0.38),
                      inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .glass-pill {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 18px -10px rgba(var(--brand),0.3),
                      inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .glass-dot { background: rgb(var(--brand)); }

        .glass-icon-chip {
          background: linear-gradient(150deg, rgba(var(--brand),0.18), rgba(var(--brand),0.06));
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.3);
        }

        .glass-pill-light {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 6px 14px -8px rgba(15,23,42,0.2);
        }

        /* View product button */
        .glass-view-btn {
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.18);
        }
        .glass-view-btn:hover:not(:disabled) {
          background: rgba(37,99,235,0.95);
          color: #fff;
          border-color: rgba(37,99,235,0.95);
        }

        /* ── Shine sweep ── */
        .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
        .glass-shine::after {
          content: ""; position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent);
          transform: skewX(-18deg);
          transition: left 0.75s ease;
          pointer-events: none;
        }
        .glass-shine:hover::after { left: 130%; }

        /* ── Ambient background blobs ── */
        .glass-blob { filter: blur(60px); opacity: 0.35; }
        .glass-blob--1 {
          background: radial-gradient(circle at 30% 30%, rgba(var(--brand),0.3), rgba(var(--brand),0));
          animation: drift1 16s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 40%, rgba(var(--brand-2),0.22), rgba(var(--brand-2),0));
          animation: drift2 14s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-18px, 20px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(16px, -16px) scale(1.05); }
        }

        @media (prefers-reduced-motion: reduce) {
          .glass-blob--1, .glass-blob--2 {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Socks;