import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, Shield, ChevronRight, Search, Loader2, ShoppingBag, Shirt, Backpack, PenLine, Footprints } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

// Same logo asset used across the auth pages / footer / invoice
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // ── Search state (shared logic, two UIs: desktop dropdown + mobile panel) ──
  const [searchOpen, setSearchOpen] = useState(false);       // desktop expandable bar
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // mobile overlay
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu or mobile search overlay is open
  useEffect(() => {
    document.body.style.overflow = (menuOpen || mobileSearchOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, mobileSearchOpen]);

  // Close desktop search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search — hits the /products/filter?name= endpoint
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/api/v1/products/filter?name=${encodeURIComponent(query.trim())}&limit=6`);
        setResults(res.data?.data?.products || []);
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350); // debounce so we're not firing a request on every keystroke

    return () => clearTimeout(timer);
  }, [query]);

  const goToResults = () => {
    if (!query.trim()) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  const goToProduct = (id) => {
    navigate(`/products/${id}`);
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { label: "Uniforms", to: "/products?category=uniform", icon: Shirt },
    { label: "Bags",     to: "/products?category=bag",     icon: Backpack },
    { label: "Socks",    to: "/products?category=socks",   icon: Footprints },
  ];

  // Shared results dropdown, reused for both desktop and mobile
  const ResultsList = ({ compact }) => (
    <div className={compact ? "" : "border-t border-white/40 mt-2 pt-2"}>
      {searching ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Searching...
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((p) => {
            const minPrice = p.sizes?.length ? Math.min(...p.sizes.map(s => s.price)) : null;
            return (
              <button
                key={p._id}
                onClick={() => goToProduct(p._id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/60 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg glass-icon-chip overflow-hidden shrink-0 flex items-center justify-center">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={14} className="text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                </div>
                {minPrice !== null && (
                  <span className="text-sm font-bold text-blue-700 shrink-0">₹{minPrice}</span>
                )}
              </button>
            );
          })}
          <button
            onClick={goToResults}
            className="w-full text-center text-xs font-semibold text-blue-600 hover:underline py-2.5 mt-1 border-t border-white/40"
          >
            See all results for "{query}"
          </button>
        </>
      ) : query.trim() ? (
        <p className="px-3 py-4 text-sm text-gray-400 text-center">No products found for "{query}"</p>
      ) : null}
    </div>
  );

  return (
    <div className="contents" style={{ "--brand": "37,99,235" /* blue-600 */, "--brand-2": "245,158,11" /* amber-500 */ }}>
      <nav
        className={`glass-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav--scrolled" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-[4.25rem] gap-2">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
              <div className="logo-ring w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg p-[2px] shrink-0 transition-transform duration-200 group-hover:scale-105">
                <div className="w-full h-full bg-blue-600 rounded-[6px] flex items-center justify-center overflow-hidden">
                  <img
                    src={logo}
                    alt="Skool Box logo"
                    className="w-full h-full object-contain p-1 bg-white rounded-[6px]"
                  />
                </div>
              </div>
              <div className="leading-none">
                <span className="block font-black text-gray-900 text-sm sm:text-base lg:text-lg tracking-tight">
                  Skool Box
                </span>
                <span className="block font-medium text-blue-500 text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.2em] uppercase mt-0.5">
                  Gumla
                </span>
              </div>
            </Link>

            {/* ── Desktop / Tablet Nav Links ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="nav-link-glass px-3 lg:px-4 py-2 text-sm font-medium text-gray-500 rounded-lg transition-all duration-200"
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="nav-link-glass px-3 lg:px-4 py-2 text-sm font-medium text-gray-500 rounded-lg transition-all duration-200"
              >
                Stationery
              </button>
            </div>

            {/* ── Desktop / Tablet Right ── */}
            <div className="hidden md:flex items-center gap-1.5">

              {/* Search */}
              <div ref={searchBoxRef} className="relative">
                <div
                  className={`search-glass flex items-center rounded-lg transition-all duration-200 overflow-hidden ${
                    searchOpen ? "w-56 lg:w-72 px-3" : "w-9 px-0 justify-center"
                  }`}
                >
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 shrink-0"
                    aria-label="Search products"
                  >
                    <Search size={17} />
                  </button>
                  {searchOpen && (
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goToResults()}
                      placeholder="Search products..."
                      className="w-full bg-transparent text-sm py-2 focus:outline-none text-gray-700 placeholder:text-gray-400"
                    />
                  )}
                </div>

                {/* Dropdown results */}
                {searchOpen && query.trim() && (
                  <div className="glass-card absolute top-full right-0 mt-2 w-80 rounded-xl p-2 max-h-96 overflow-y-auto">
                    <ResultsList compact />
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="nav-link-glass relative p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all duration-200"
              >
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <span className="cart-badge absolute -top-0.5 -right-0.5 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-1">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="admin-pill flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                    >
                      <Shield size={12} />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="nav-link-glass flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-blue-100 group-hover:border-blue-300 transition-colors shrink-0">
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors capitalize">
                      {user.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    <LogOut size={14} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    to="/login"
                    className="px-3 lg:px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="glass-shine glass-btn-primary px-3.5 lg:px-4 py-1.5 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile Right ── */}
            <div className="md:hidden flex items-center gap-0.5">
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="nav-link-glass p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
                aria-label="Search products"
              >
                <Search size={20} />
              </button>
              <Link to="/cart" className="nav-link-glass relative p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="cart-badge absolute -top-0.5 -right-0.5 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="nav-link-glass p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Search Overlay ── */}
      <div
        className={`md:hidden fixed inset-0 z-50 glass-overlay-panel transition-all duration-200 flex flex-col ${
          mobileSearchOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-white/40 shrink-0">
          <div className="search-glass flex items-center gap-2 rounded-lg px-3 flex-1">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              autoFocus={mobileSearchOpen}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToResults()}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm py-2.5 focus:outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults([]); }}
            className="p-2 text-gray-500 shrink-0"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <ResultsList compact />
        </div>
      </div>

      {/* ── Mobile Slide-over Menu — redesigned as a liquid glass panel ── */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-gray-900/35 backdrop-blur-[3px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel — frosted glass, ambient blobs, rounded leading edge */}
        <div
          className={`glass-sheet absolute top-0 right-0 h-full w-[84%] max-w-sm transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Ambient blobs inside the panel */}
          <div className="glass-blob glass-blob--1 absolute -top-20 -right-16 w-64 h-64 rounded-full pointer-events-none" />
          <div className="glass-blob glass-blob--2 absolute bottom-0 -left-16 w-56 h-56 rounded-full pointer-events-none" />

          {/* Panel header */}
          <div className="relative flex items-center justify-between px-5 h-14 border-b border-white/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="logo-ring w-8 h-8 rounded-lg p-[2px] shrink-0">
                <div className="w-full h-full bg-blue-600 rounded-[6px] flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1 bg-white rounded-[6px]" />
                </div>
              </div>
              <span className="font-black text-gray-900 text-sm">Skool Box</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="nav-link-glass p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="relative flex-1 overflow-y-auto px-4 py-4">
            {user && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="glass-card glass-shine flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 capitalize truncate">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span className="glass-icon-chip flex items-center justify-center w-7 h-7 rounded-full shrink-0">
                  <ChevronRight size={14} className="text-blue-600" />
                </span>
              </Link>
            )}

            <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Shop
            </p>
            <div className="space-y-2">
              {navLinks.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="menu-row-glass flex items-center gap-3 w-full px-3.5 py-3 text-[15px] font-semibold text-gray-700 rounded-xl transition-all"
                >
                  <span className="glass-icon-chip flex items-center justify-center w-9 h-9 rounded-xl shrink-0">
                    <Icon size={16} className="text-blue-600" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="menu-row-glass flex items-center gap-3 w-full text-left px-3.5 py-3 text-[15px] font-semibold text-gray-700 rounded-xl transition-all"
              >
                <span className="glass-icon-chip flex items-center justify-center w-9 h-9 rounded-xl shrink-0">
                  <PenLine size={16} className="text-blue-600" />
                </span>
                <span className="flex-1">Stationery</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            </div>

            {user?.role === "admin" && (
              <div className="mt-5">
                <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Manage
                </p>
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="admin-row-glass flex items-center gap-3 px-3.5 py-3 text-[15px] font-semibold rounded-xl transition-all"
                >
                  <span className="admin-icon-chip flex items-center justify-center w-9 h-9 rounded-xl shrink-0">
                    <Shield size={16} />
                  </span>
                  Admin Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Bottom action area */}
          <div className="relative border-t border-white/40 p-4 shrink-0">
            {user ? (
              <button
                onClick={handleLogout}
                className="logout-glass flex items-center justify-center gap-2 w-full px-4 py-3 text-[15px] font-semibold rounded-xl transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="glass-btn-secondary block w-full text-center px-4 py-3 text-[15px] font-semibold text-blue-700 rounded-xl transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="glass-shine glass-btn-primary block w-full text-center px-4 py-3 text-[15px] font-semibold text-white rounded-xl transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed navbar */}
      <div className="h-14 sm:h-16 lg:h-[4.25rem]" />

      <style>{`
        /* ── Nav bar shell ── */
        .glass-nav {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.5);
        }
        .glass-nav--scrolled {
          background: rgba(255,255,255,0.82);
          box-shadow: 0 10px 26px -18px rgba(var(--brand),0.35);
          border-bottom-color: rgba(255,255,255,0.7);
        }

        .logo-ring {
          background: linear-gradient(155deg, rgba(255,255,255,0.9), rgba(var(--brand),0.4) 50%, rgba(var(--brand-2),0.45));
        }

        .nav-link-glass:hover {
          background: rgba(255,255,255,0.6);
          color: rgb(37,99,235);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .search-glass {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .cart-badge {
          background: rgba(239,68,68,0.95);
          border: 1.5px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 6px -2px rgba(0,0,0,0.3);
        }

        .admin-pill {
          background: rgba(147,51,234,0.12);
          border: 1px solid rgba(147,51,234,0.2);
          color: rgb(126,34,206);
        }
        .admin-pill:hover {
          background: rgba(147,51,234,0.2);
        }

        /* ── Shared glass surfaces (card, icon chip, buttons, shine) ── */
        .glass-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px -14px rgba(var(--brand),0.3),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }
        .glass-icon-chip {
          background: linear-gradient(150deg, rgba(var(--brand),0.2), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }
        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(37,99,235,0.92), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.35);
          box-shadow: 0 12px 24px -14px rgba(var(--brand),0.55),
                      inset 0 1px 0 rgba(255,255,255,0.4);
        }
        .glass-btn-primary:hover {
          box-shadow: 0 16px 28px -14px rgba(var(--brand),0.6),
                      inset 0 1px 0 rgba(255,255,255,0.45);
        }
        .glass-btn-secondary {
          background: rgba(255,255,255,0.55);
          border: 2px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glass-btn-secondary:hover {
          background: rgba(239,246,255,0.75);
          border-color: rgba(147,197,253,0.9);
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

        /* ── Mobile search overlay ── */
        .glass-overlay-panel {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        /* ── Mobile slide-over panel ── */
        .glass-sheet {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-left: 1px solid rgba(255,255,255,0.6);
          box-shadow: -20px 0 50px -24px rgba(var(--brand),0.4);
        }
        .menu-row-glass {
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.6);
        }
        .menu-row-glass:hover {
          background: rgba(255,255,255,0.7);
          color: rgb(37,99,235);
        }
        .admin-row-glass {
          background: rgba(147,51,234,0.1);
          border: 1px solid rgba(147,51,234,0.22);
          color: rgb(126,34,206);
        }
        .admin-row-glass:hover {
          background: rgba(147,51,234,0.16);
        }
        .admin-icon-chip {
          background: rgba(147,51,234,0.16);
          border: 1px solid rgba(147,51,234,0.25);
          color: rgb(126,34,206);
        }
        .logout-glass {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.22);
          color: rgb(239,68,68);
        }
        .logout-glass:hover {
          background: rgba(239,68,68,0.9);
          color: #fff;
        }

        /* ── Ambient blobs (reused inside the mobile panel) ── */
        .glass-blob { filter: blur(50px); opacity: 0.4; }
        .glass-blob--1 {
          background: radial-gradient(circle at 30% 30%, rgba(var(--brand),0.32), rgba(var(--brand),0));
          animation: drift1 15s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 40%, rgba(var(--brand-2),0.24), rgba(var(--brand-2),0));
          animation: drift2 13s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-14px, 16px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(12px, -14px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob--1, .glass-blob--2 { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Navbar;