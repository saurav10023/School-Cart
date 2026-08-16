import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) =>
  createPortal(
    <div
      className="fixed inset-0 bg-gray-900/45 backdrop-blur-sm flex items-center justify-center px-4"
      style={{ "--brand": "239,68,68", zIndex: 2147483000 }}
    >
      <div className="glass-modal w-full max-w-sm rounded-2xl relative overflow-hidden">

        {/* Ambient blob */}
        <div className="glass-blob absolute -top-16 -right-14 w-56 h-56 rounded-full pointer-events-none" />

        <div className="relative p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="glass-icon-chip shrink-0">
              <AlertTriangle size={18} className="text-red-600" />
            </span>
            <p className="text-sm font-semibold text-gray-800 pt-1.5 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="glass-btn-neutral flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="glass-shine glass-btn-danger flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Confirm
            </button>
          </div>
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

        .glass-icon-chip {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }

        .glass-btn-neutral {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .glass-btn-neutral:hover { background: rgba(255,255,255,0.8); }

        .glass-btn-danger {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(185,28,28,0.95));
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.5);
        }
        .glass-btn-danger:hover { box-shadow: 0 14px 26px -12px rgba(var(--brand),0.6); }

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

export default ConfirmModal;