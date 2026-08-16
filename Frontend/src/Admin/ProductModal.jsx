import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Upload, Loader2, Trash2 } from "lucide-react";
import API from "../api/axios";

/* ─────────────────────────────────────────────
   PRODUCT FORM MODAL
───────────────────────────────────────────── */
const ProductModal = ({ product, onClose, onSave, showToast }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    sizes: product?.sizes?.map(s => ({
      size: s.size ?? "",
      price: s.price ?? "",
      stock: s.stock ?? "",
    })) || [{ size: "", price: "", stock: "" }],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState(product?.images || []);
  const [loading, setLoading] = useState(false);

  const handleSizeChange = (i, field, val) => {
    const updated = [...form.sizes];
    updated[i][field] = val;
    setForm({ ...form, sizes: updated });
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { size: "", price: "", stock: "" }] });
  const removeSize = (i) => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) });

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || form.sizes.length === 0) {
      showToast("Name, category and at least one size are required", "error");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("category", form.category.toLowerCase().trim());
      data.append("sizes", JSON.stringify(form.sizes));
      images.forEach(img => data.append("images", img));

      if (isEdit) {
        await API.patch(`/api/v1/products/${product._id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product updated", "success");
      } else {
        await API.post("/api/v1/products", data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product created", "success");
      }
      onSave();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save product", "error");
    } finally { setLoading(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-gray-900/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 sm:py-6"
      style={{ "--brand": "37,99,235", zIndex: 2147483000 }}
    >
      <div className="glass-modal w-full sm:max-w-lg flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl relative overflow-hidden">

        {/* Ambient blob */}
        <div className="glass-blob absolute -top-20 -right-16 w-64 h-64 rounded-full pointer-events-none" />

        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 relative shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300/70" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="glass-pill inline-flex items-center gap-1.5 text-blue-700">
              <span className="glass-dot" />
              {isEdit ? "Editing" : "New"}
            </span>
            <h3 className="text-base sm:text-lg font-black text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h3>
          </div>
          <button onClick={onClose} className="glass-icon-btn p-2 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="relative px-4 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Product Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="glass-input-wrap w-full px-3 py-3 sm:py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Category *</label>
            <input
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. uniform, bag, stationery"
              className="glass-input-wrap w-full px-3 py-3 sm:py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm resize-none bg-transparent focus:outline-none"
            />
          </div>

          {/* Sizes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Sizes *</label>
              <button onClick={addSize} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Size
              </button>
            </div>

            <div className="space-y-3">
              {form.sizes.map((s, i) => (
                <div key={i} className="glass-inset-panel rounded-xl p-3 relative">
                  {form.sizes.length > 1 && (
                    <button
                      onClick={() => removeSize(i)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-2 pr-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Size</label>
                      <input
                        value={s.size}
                        onChange={e => handleSizeChange(i, "size", e.target.value)}
                        placeholder="M / 10"
                        className="glass-input-wrap-sm w-full px-2.5 py-2 rounded-lg text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Price ₹</label>
                      <input
                        value={s.price}
                        onChange={e => handleSizeChange(i, "price", e.target.value)}
                        type="number"
                        placeholder="0"
                        className="glass-input-wrap-sm w-full px-2.5 py-2 rounded-lg text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Stock</label>
                      <input
                        value={s.stock}
                        onChange={e => handleSizeChange(i, "stock", e.target.value)}
                        type="number"
                        placeholder="0"
                        className="glass-input-wrap-sm w-full px-2.5 py-2 rounded-lg text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Images (max 5)</label>
            <label className="glass-dropzone flex items-center justify-center gap-2 cursor-pointer rounded-xl px-4 py-4 transition-colors">
              <Upload size={16} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-400 text-center">Click to upload images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={p} alt="" className="w-full h-full rounded-xl object-cover border border-white/70" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-4 sm:px-6 py-4 border-t border-white/50 flex gap-3 shrink-0 glass-footer">
          <button
            onClick={onClose}
            className="glass-btn-neutral flex-1 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="glass-shine glass-btn-primary flex-1 py-3 sm:py-2.5 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>

      <style>{`
        .glass-modal {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 30px 60px -24px rgba(var(--brand),0.4);
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

        .glass-icon-btn {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.75);
        }
        .glass-icon-btn:hover { background: rgba(255,255,255,0.85); }

        .glass-input-wrap {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .glass-input-wrap:focus-within {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.14);
        }
        .glass-input-wrap-sm {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-input-wrap-sm:focus {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.14);
        }

        .glass-inset-panel {
          background: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.65);
        }

        .glass-dropzone {
          border: 2px dashed rgba(148,163,184,0.5);
          background: rgba(255,255,255,0.35);
        }
        .glass-dropzone:hover {
          border-color: rgba(var(--brand),0.55);
          background: rgba(239,246,255,0.5);
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
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ProductModal;