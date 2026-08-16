import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Check, PackageSearch } from "lucide-react";
import API from "../api/axios";

/* ─────────────────────────────────────────────
   STOCK DRAWER (slide-in from the right)
───────────────────────────────────────────── */
const StockModal = ({ product, onClose, showToast, onSave }) => {
  const [stocks, setStocks] = useState(
    product.sizes.map(s => ({ size: s.size, stock: s.stock }))
  );
  const [loadingSize, setLoadingSize] = useState(null);
  const [savedSize, setSavedSize] = useState(null);
  const [mounted, setMounted] = useState(false);

  // trigger enter animation on mount, lock body scroll while open
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 220);
  };

  const handleUpdate = async (size, stock) => {
    setLoadingSize(size);
    try {
      await API.patch(`/api/v1/products/${product._id}/stock`, { size, stock: Number(stock) });
      showToast(`Stock updated for size ${size}`, "success");
      setSavedSize(size);
      setTimeout(() => setSavedSize(null), 1500);
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "error");
    } finally { setLoadingSize(null); }
  };

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ "--brand": "37,99,235", zIndex: 2147483000 }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: mounted ? 1 : 0 }}
      />

      {/* Drawer panel */}
      <div
        className="glass-drawer absolute top-0 right-0 h-full w-full sm:w-[26rem] flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: mounted ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Ambient blob */}
        <div className="glass-blob absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 sm:px-6 pt-6 pb-4 border-b border-white/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="glass-icon-chip shrink-0">
              <PackageSearch size={16} className="text-blue-700" />
            </span>
            <div className="min-w-0">
              <span className="glass-pill inline-flex items-center gap-1.5 text-blue-700 mb-1">
                <span className="glass-dot" />
                Stock
              </span>
              <h3 className="text-sm sm:text-base font-black text-gray-900 truncate leading-tight">
                {product.name}
              </h3>
            </div>
          </div>
          <button onClick={handleClose} className="glass-icon-btn p-2 rounded-lg transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="relative px-5 sm:px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-[3.25rem_1fr_4.5rem] gap-2.5 px-1 pb-2">
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Size</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Stock</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold text-center">Action</span>
          </div>

          <div className="space-y-2.5">
            {stocks.map((s, i) => (
              <div
                key={s.size}
                className="glass-inset-panel rounded-xl p-2.5 grid grid-cols-[3.25rem_1fr_4.5rem] gap-2.5 items-center"
              >
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide truncate">
                  {s.size}
                </span>
                <input
                  type="number"
                  value={s.stock}
                  min={0}
                  onChange={e => {
                    const updated = [...stocks];
                    updated[i].stock = e.target.value;
                    setStocks(updated);
                  }}
                  className="glass-input-wrap-sm w-full h-9 px-3 rounded-lg text-sm bg-transparent focus:outline-none"
                />
                <button
                  onClick={() => handleUpdate(s.size, s.stock)}
                  disabled={loadingSize === s.size}
                  className="glass-shine glass-btn-primary h-9 w-full text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60 flex items-center justify-center"
                >
                  {loadingSize === s.size ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : savedSize === s.size ? (
                    <Check size={14} />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-5 sm:px-6 py-4 border-t border-white/50 shrink-0 glass-footer">
          <button
            onClick={handleClose}
            className="glass-btn-neutral w-full py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        .glass-drawer {
          background: rgba(255,255,255,0.9);
          border-left: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: -30px 0 60px -24px rgba(var(--brand),0.35);
          overflow: hidden;
        }
        .glass-footer { background: rgba(255,255,255,0.5); }

        .glass-pill {
          padding: 3px 10px; border-radius: 999px;
          font-weight: 700; font-size: 10px; letter-spacing: 0.03em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.85);
        }
        .glass-dot { width: 5px; height: 5px; border-radius: 999px; background: rgb(var(--brand)); display: inline-block; }

        .glass-icon-chip {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }

        .glass-icon-btn {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-icon-btn:hover { background: rgba(255,255,255,0.85); }

        .glass-input-wrap-sm {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .glass-input-wrap-sm:focus {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.14);
        }

        .glass-inset-panel {
          background: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.65);
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
          filter: blur(60px); opacity: 0.16;
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 16s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-16px, 14px) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob { animation: none !important; }
          .glass-drawer, .absolute.inset-0 { transition: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default StockModal;