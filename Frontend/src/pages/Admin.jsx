import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

import { TABS } from "../Admin/constants";

import Overview from "../Admin/Overview";
import Orders from "../Admin/Orders";
import CreateOrder from "../Admin/CreateOrder";
import Products from "../Admin/Products";
import UsersTab from "../Admin/UsersTab";
import Toast from "../Admin/Toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const tabRefs = useRef({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const [usersRes, ordersRes, productsRes, revenueRes, pendingRes] = await Promise.all([
        API.get("/api/v1/admin/get-total-users-count"),
        API.get("/api/v1/admin/get-all-orders-count"),
        API.get("/api/v1/admin/get-all-products-count"),
        API.get("/api/v1/admin/get-total-revenue"),
        API.get("/api/v1/admin/get-pending-orders-count"),
      ]);

      setStats({
        totalUsers:      usersRes.data.data,
        totalOrders:     ordersRes.data.data,
        totalProducts:   productsRes.data.data,
        totalRevenue:    revenueRes.data.data,
        pendingOrders:   pendingRes.data.data,
        cancelledOrders: "—",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pendingCount = Number(stats.pendingOrders) || 0;
  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div
      className="min-h-screen bg-gray-50 md:flex md:items-start relative"
      style={{ "--brand": "37,99,235" /* blue-600 */ }}
    >
      {/* Ambient page-level blobs — quiet, behind everything */}
      <div className="glass-blob glass-blob--1 fixed -top-32 -right-24 w-96 h-96 rounded-full pointer-events-none z-0" />
      <div className="glass-blob glass-blob--2 fixed bottom-0 left-1/4 w-80 h-80 rounded-full pointer-events-none z-0" />

      {/* Sidebar — glass panel, sticky, scoped to this page only */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen glass-sidebar relative z-10">
        <div className="px-5 py-5 border-b border-white/50">
          <span className="glass-pill inline-flex items-center gap-2 text-blue-700 mb-2">
            <span className="glass-dot" />
            Admin
          </span>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">Welcome back, {user?.username}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const showBadge = id === "orders" && pendingCount > 0;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                    ? "glass-nav-active text-blue-700"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {showBadge && (
                  <span
                    className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                               bg-red-500 text-white text-[11px] font-bold leading-none"
                    title={`${pendingCount} pending order${pendingCount > 1 ? "s" : ""}`}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/50">
          <button
            onClick={() => navigate("/")}
            className="glass-btn-secondary w-full text-xs font-semibold text-gray-600 hover:text-blue-700 px-3 py-2 rounded-xl transition-all"
          >
            ← Back to Store
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">

        {/* Top bar — glass */}
        <header className="glass-topbar px-4 sm:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="md:hidden">
              <h1 className="text-lg font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Welcome back, {user?.username}</p>
            </div>
            <div className="hidden md:block">
              <h2 className="text-base font-bold text-gray-900">{activeLabel}</h2>
            </div>
            <button
              onClick={() => navigate("/")}
              className="glass-btn-secondary md:hidden text-xs font-semibold text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-xl transition-all shrink-0"
            >
              ← Store
            </button>
            {statsLoading && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Refreshing…
              </span>
            )}
          </div>
        </header>

        {/* ── Mobile tab strip — glass segmented pill track with scroll-snap and edge fades ── */}
        <nav className="md:hidden sticky top-[65px] z-20 glass-tabstrip px-3 py-2.5">
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-white/70 to-transparent z-10 rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-white/70 to-transparent z-10 rounded-r-2xl" />

            <div
              className="flex gap-1 glass-tabtrack rounded-2xl p-1.5 overflow-x-auto scroll-smooth snap-x snap-proximity
                [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map(({ id, label, icon: Icon }) => {
                const showBadge = id === "orders" && pendingCount > 0;
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => (tabRefs.current[id] = el)}
                    onClick={() => setActiveTab(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 snap-start
                      transition-all duration-200 active:scale-95
                      ${isActive
                        ? "glass-tab-active text-blue-700"
                        : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Icon
                      size={15}
                      className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                    />
                    {label}
                    {showBadge && (
                      <span
                        className={`flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none shrink-0
                          ${isActive ? "bg-blue-600 text-white" : "bg-red-500 text-white"}`}
                      >
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
          {activeTab === "overview"     && <Overview stats={stats} />}
          {activeTab === "orders"       && <Orders showToast={showToast} />}
          {activeTab === "create-order" && <CreateOrder showToast={showToast} />}
          {activeTab === "products"     && <Products showToast={showToast} />}
          {activeTab === "users"        && <UsersTab showToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        .glass-sidebar {
          background: rgba(255,255,255,0.6);
          border-right: 1px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .glass-topbar {
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(255,255,255,0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .glass-tabstrip {
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(255,255,255,0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .glass-tabtrack {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.7);
        }
        .glass-tab-active {
          background: rgba(255,255,255,0.95);
          box-shadow: 0 4px 12px -6px rgba(var(--brand),0.35);
        }
        .glass-nav-active {
          background: rgba(255,255,255,0.75);
          box-shadow: inset 0 0 0 1px rgba(var(--brand),0.15), 0 4px 12px -8px rgba(var(--brand),0.3);
        }

        .glass-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 999px;
          font-weight: 700; font-size: 10px; letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glass-dot { width: 5px; height: 5px; border-radius: 999px; background: rgb(var(--brand)); }

        .glass-btn-secondary {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glass-btn-secondary:hover {
          background: rgba(239,246,255,0.75);
          border-color: rgba(147,197,253,0.9);
        }

        .glass-blob { filter: blur(80px); opacity: 0.15; }
        .glass-blob--1 {
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 20s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 50%, rgba(var(--brand),0.35), rgba(var(--brand),0));
          animation: drift2 17s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-24px, 22px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -18px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob--1, .glass-blob--2 { animation: none !important; }
        }
      `}</style>
    </div>
  );
}