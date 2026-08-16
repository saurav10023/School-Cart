import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// Same logo asset used across Navbar / Footer / Invoice
import logo from "../assets/logo.png";

/*
  Liquid Glass — Login
  Brand: blue (kept from the original palette)
    #2563EB — blue-600 (primary)
    #1D4ED8 — blue-700 (deep / pressed)
    #3B82F6 — blue-500 (bright / highlights)
  BRAND_RGB = 37,99,235
  The left hero panel keeps its solid blue identity (already the site's
  brand surface); the form side becomes glass floating over soft blobs.
*/

const GlassStyles = () => (
  <style>{`
    @keyframes drift-a {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(25px, -35px) scale(1.08); }
    }
    @keyframes drift-b {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-30px, 25px) scale(1.05); }
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

    .glass-input {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px -8px rgba(37,99,235,0.2);
      transition: background 0.2s ease, box-shadow 0.2s ease;
    }
    .glass-input:focus {
      outline: none;
      background: rgba(255,255,255,0.85);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
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
      box-shadow: 0 12px 26px -12px rgba(37,99,235,0.55),
                  inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }
    .btn-primary-glass:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px -12px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .btn-primary-glass:active:not(:disabled) { transform: translateY(0); }
    .btn-primary-glass:disabled {
      background: linear-gradient(135deg, rgba(148,163,184,0.6), rgba(100,116,139,0.6));
      box-shadow: none;
    }

    .fade-up {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.55s ease, transform 0.55s ease;
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

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/api/v1/users/login", {
        loginId,
        password
      });

      login(res.data.data);
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Invalid Mobile number/username  does not  exists") {
        setError("Mobile Number / Username is invalid. To register click the Register Link below");
      }
      else setError("User Don't Exists")

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(180deg,#eff4ff,#f8fafc)" }}>
      <GlassStyles />

      {/* Left — Image Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
        {/* Decorative background flourishes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">

          {/* Left panel logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-black/10">
              <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-base tracking-tight">Skool Box</span>
              <span className="font-light text-blue-200 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-black leading-tight">
              Everything your child needs,<br />
              <span className="text-blue-200">all in one place.</span>
            </h1>
            <p className="text-blue-100 text-sm xl:text-base font-light max-w-xs">
              Uniforms, bags, stationery — sourced and delivered for your school.
            </p>

            {/* Trust strip */}
            <div className="inline-flex items-center gap-2 pt-1 text-blue-100 text-xs xl:text-sm bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <ShieldCheck size={15} className="text-blue-200 shrink-0" />
              Trusted by schools across Gumla district
            </div>
          </div>

          {/* Copyright line */}
          <p className="text-blue-200 text-xs">
            © {new Date().getFullYear()} Skool Box Store. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — Form Side */}
      <div className="flex-1 relative flex justify-center items-center px-4 sm:px-6 py-6 overflow-hidden">
        {/* Ambient blobs, scoped to this side of the page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="blob-a absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: "#3B82F6" }} />
          <div className="blob-b absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-25 blur-3xl" style={{ background: "#2563EB" }} />
        </div>

        <div className="fade-up in-view relative z-10 w-full max-w-md glass-card rounded-2xl p-5 sm:p-7 space-y-5">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1 bg-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-gray-900 text-base tracking-tight">Skool Box</span>
              <span className="font-light text-blue-600 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <span className="glass-pill">Welcome back</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 pt-1">Sign in to your account</h2>
            <p className="text-gray-500 text-xs sm:text-sm">Use your mobile number or username</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-700 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium glass-card">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Mobile / Username */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-semibold text-gray-700">
                Mobile Number or Username
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  type="text"
                  placeholder="9876543210 or username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgotpassword"
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="glass-shine w-full flex items-center justify-center gap-2 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm active:scale-[0.99] transition-all duration-200 btn-primary-glass"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}