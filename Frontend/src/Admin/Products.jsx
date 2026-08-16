import { useEffect, useState } from "react";
import {
  Plus, Package, Tag, Pencil, RefreshCw, Eye, EyeOff, Trash2,
  ChevronDown, AlertTriangle, PackageX,
} from "lucide-react";
import API from "../api/axios";
import ProductModal from "./ProductModal";
import StockModal from "./StockModal";
import ConfirmModal from "./ConfirmModal ";

const SIZE_LOW_THRESHOLD = 3;
const TOTAL_LOW_THRESHOLD = 5;

const getStockStatus = (product) => {
  const sizes = product.sizes || [];
  const withStock = sizes.map(s => ({ ...s, stockNum: Number(s.stock) || 0 }));
  const total = withStock.reduce((a, s) => a + s.stockNum, 0);
  const outOfStock = sizes.length === 0 || withStock.every(s => s.stockNum === 0);
  const anySizeCriticallyLow = withStock.some(s => s.stockNum > 0 && s.stockNum < SIZE_LOW_THRESHOLD);
  const totalLow = total > 0 && total < TOTAL_LOW_THRESHOLD;
  const lowStock = !outOfStock && (anySizeCriticallyLow || totalLow);
  return { total, outOfStock, lowStock, sizes: withStock };
};

/* ─────────────────────────────────────────────
   SINGLE PRODUCT CARD — compact by default,
   expands in place to show full details
───────────────────────────────────────────── */
const ProductCard = ({ product, expanded, onToggle, onEdit, onStock, onToggleAvailability, onDelete }) => {
  const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => Number(s.price) || 0)) : null;
  const maxPrice = product.sizes?.length ? Math.max(...product.sizes.map(s => Number(s.price) || 0)) : null;
  const status = getStockStatus(product);

  return (
    <div
      id={`product-${product._id}`}
      className={`glass-card rounded-2xl transition-all duration-200 ${
        expanded ? "col-span-full glass-card--expanded" : ""
      }`}
    >
      {/* Collapsed header — always visible, click to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 sm:p-4 text-left"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/60 shrink-0 border border-white/70">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={18} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight line-clamp-1">{product.name}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-blue-600 font-bold">
              <Tag size={11} />
              {minPrice === null ? "—" : minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}–${maxPrice}`}
            </span>
            <span className={`text-xs font-semibold ${status.outOfStock ? "text-red-500" : "text-gray-400"}`}>
              {status.total} in stock
            </span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {product.isAvailable ? "Active" : "Hidden"}
            </span>
            {status.outOfStock ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                <PackageX size={10} /> Out of stock
              </span>
            ) : status.lowStock ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle size={10} /> Low stock
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-gray-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-white/50 pt-4">

          {/* Images */}
          {product.images?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-white/70" />
              ))}
            </div>
          )}

          {/* Category + description */}
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {product.category}
            </span>
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Size / price / stock breakdown */}
          {product.sizes?.length > 0 && (
            <div className="glass-inset-panel rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-white/40 text-[11px] font-bold text-gray-500 uppercase tracking-wide px-3 py-2">
                <span>Size</span>
                <span>Price</span>
                <span>Stock</span>
              </div>
              <div className="divide-y divide-white/50">
                {status.sizes.map((s, i) => {
                  const isOut = s.stockNum === 0;
                  const isLow = !isOut && s.stockNum < SIZE_LOW_THRESHOLD;
                  return (
                    <div key={i} className="grid grid-cols-3 px-3 py-2 text-sm">
                      <span className="font-semibold text-gray-700">{s.size}</span>
                      <span className="text-gray-600">₹{s.price}</span>
                      <span className={`font-semibold ${isOut ? "text-red-500" : isLow ? "text-amber-600" : "text-gray-700"}`}>
                        {isOut ? "Out of stock" : isLow ? `${s.stockNum} (low)` : s.stockNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200/80 bg-white/50 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all font-medium">
              <Pencil size={11} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onStock(product); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200/80 bg-white/50 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all font-medium">
              <RefreshCw size={11} /> Stock
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleAvailability(product); }}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium bg-white/50
                ${product.isAvailable
                  ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"}`}>
              {product.isAvailable ? <EyeOff size={11} /> : <Eye size={11} />}
              {product.isAvailable ? "Hide" : "Show"}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(product._id); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 bg-white/50 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PRODUCTS TAB — grouped by category
───────────────────────────────────────────── */
const Products = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/v1/products");
      setProducts(res.data.data || []);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/v1/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast("Product deleted", "success");
    } catch { showToast("Failed to delete product", "error"); }
    finally { setConfirm(null); }
  };

  const handleToggle = async (product) => {
    try {
      const res = await API.patch(`/api/v1/products/${product._id}/toggle-availability`);
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: res.data.data.isAvailable } : p));
      showToast(`Product ${res.data.data.isAvailable ? "enabled" : "disabled"}`, "success");
    } catch { showToast("Failed to toggle availability", "error"); }
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grouped = products.reduce((acc, p) => {
    const cat = p.category?.trim() || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (openCategory === null && categories.length > 0) {
      const uniformCat = categories.find(c => c.toLowerCase().includes("uniform"));
      setOpenCategory(uniformCat || categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const outOfStockProducts = [];
  const lowStockProducts = [];
  products.forEach(p => {
    const status = getStockStatus(p);
    if (status.outOfStock) outOfStockProducts.push(p);
    else if (status.lowStock) lowStockProducts.push(p);
  });

  const jumpToProduct = (product) => {
    setOpenCategory(product.category?.trim() || "Uncategorized");
    setExpandedIds(prev => new Set(prev).add(product._id));
    setTimeout(() => {
      document.getElementById(`product-${product._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  if (loading) return (
    <div className="space-y-3" style={{ "--brand": "37,99,235" }}>
      {[1,2,3].map(i => <div key={i} className="h-20 skeleton-glass rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-8" style={{ "--brand": "37,99,235" /* blue-600 */ }}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{products.length} products</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-shine glass-btn-primary flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Inventory alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-alert-amber flex items-center gap-3 rounded-2xl p-3.5 sm:p-4">
              <div className="glass-icon-chip-amber w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-amber-700" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-amber-700 leading-none">{lowStockProducts.length}</p>
                <p className="text-[11px] sm:text-xs text-amber-600 font-semibold mt-0.5">Low stock</p>
              </div>
            </div>
            <div className="glass-alert-red flex items-center gap-3 rounded-2xl p-3.5 sm:p-4">
              <div className="glass-icon-chip-red w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0">
                <PackageX size={16} className="text-red-700" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-red-700 leading-none">{outOfStockProducts.length}</p>
                <p className="text-[11px] sm:text-xs text-red-600 font-semibold mt-0.5">Out of stock</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl divide-y divide-white/50 max-h-56 overflow-y-auto">
            {[...outOfStockProducts, ...lowStockProducts].map(product => {
              const status = getStockStatus(product);
              return (
                <button
                  key={product._id}
                  onClick={() => jumpToProduct(product)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/60 border border-white/70 shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={14} className="text-gray-300 m-auto" />
                    )}
                  </div>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-700 truncate">{product.name}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    status.outOfStock ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                  }`}>
                    {status.outOfStock ? "Out of stock" : `${status.total} left`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16 gap-2 rounded-2xl">
          <Package size={32} className="text-gray-300" />
          <p className="text-gray-400 text-sm">No products yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Horizontal category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map(category => {
              const isActive = openCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setOpenCategory(category)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all
                    ${isActive
                      ? "glass-shine glass-btn-primary text-white"
                      : "glass-chip-idle text-gray-500 hover:text-gray-700"}`}
                >
                  {category}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25" : "bg-white/70 text-gray-400"}`}>
                    {grouped[category].length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active category's products */}
          {openCategory && grouped[openCategory] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
              {grouped[openCategory].map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  expanded={expandedIds.has(product._id)}
                  onToggle={() => toggleExpanded(product._id)}
                  onEdit={setEditProduct}
                  onStock={setStockProduct}
                  onToggleAvailability={handleToggle}
                  onDelete={setConfirm}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && <ProductModal onClose={() => setShowAddModal(false)} onSave={fetchProducts} showToast={showToast} />}
      {editProduct && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {stockProduct && <StockModal product={stockProduct} onClose={() => setStockProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {confirm && <ConfirmModal message="Delete this product? This cannot be undone." onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 22px -16px rgba(var(--brand),0.28),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }
        .glass-card--expanded {
          box-shadow: 0 0 0 1px rgba(var(--brand),0.2), 0 16px 32px -18px rgba(var(--brand),0.35);
        }
        .glass-inset-panel {
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.6);
        }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.5);
        }
        .glass-btn-primary:hover { box-shadow: 0 14px 26px -12px rgba(var(--brand),0.6); }

        .glass-chip-idle {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-chip-idle:hover { background: rgba(255,255,255,0.75); }

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

        .glass-alert-amber {
          background: rgba(255,251,235,0.7);
          border: 1px solid rgba(252,211,77,0.5);
          backdrop-filter: blur(10px);
        }
        .glass-alert-red {
          background: rgba(254,242,242,0.7);
          border: 1px solid rgba(252,165,165,0.5);
          backdrop-filter: blur(10px);
        }
        .glass-icon-chip-amber {
          background: linear-gradient(150deg, rgba(252,211,77,0.5), rgba(252,211,77,0.25));
          border: 1px solid rgba(255,255,255,0.6);
        }
        .glass-icon-chip-red {
          background: linear-gradient(150deg, rgba(252,165,165,0.5), rgba(252,165,165,0.25));
          border: 1px solid rgba(255,255,255,0.6);
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
      `}</style>
    </div>
  );
};

export default Products;