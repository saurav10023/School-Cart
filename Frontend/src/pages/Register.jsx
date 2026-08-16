import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Phone, User, Lock,
  ArrowRight, Camera, Loader2, CheckCircle2, MapPin, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth } from "../firebase";

import logo from "../assets/logo.png";

export default function Register() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]                         = useState("mobile");
  const [mobileNumber, setMobileNumber]         = useState("");
  const [otp, setOtp]                           = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formData, setFormData]                 = useState({ username: "", password: "" });
  const [address, setAddress]                   = useState({ street: "", city: "", state: "", pincode: "" });
  const [avatar, setAvatar]                     = useState(null);
  const [avatarPreview, setAvatarPreview]       = useState(null);
  const [showPassword, setShowPassword]         = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const recaptchaRef                            = useRef(null);

  const isMobileValid = /^[0-9]{10}$/.test(mobileNumber);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const stepIndex = { mobile: 0, otp: 1, details: 2 }[step];
  const steps     = ["Mobile", "OTP", "Details"];

  const handleSendOTP = async () => {
    if (!isMobileValid) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true);
    setError("");

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaRef.current,
          { size: "invisible" }
        );
      }

      const phoneNumber = `+91${mobileNumber}`;
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      console.error(err);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setError(err.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true);
    setError("");

    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();

      await API.post(
        "/api/v1/users/verify-mobile",
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );

      sessionStorage.setItem("firebaseToken", firebaseToken);
      setStep("details");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Mobile number already registered") {
        setError("This mobile number is already registered.");
        setIsDuplicateError(true);
      } else {
        setError(message || "Invalid OTP. Try again.");
      }
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Username and password are required");
      return;
    }
    setLoading(true);
    setError("");
    setIsDuplicateError(false);

    try {
      const firebaseToken = sessionStorage.getItem("firebaseToken");

      if (!firebaseToken) {
        setError("Session expired. Please verify your mobile number again.");
        setStep("mobile");
        return;
      }

      const data = new FormData();
      data.append("username", formData.username);
      data.append("password", formData.password);
      if (address.street) data.append("address", JSON.stringify(address));
      if (avatar) data.append("avatar", avatar);

      const res = await API.post(
        "/api/v1/users/register",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${firebaseToken}`
          }
        }
      );

      sessionStorage.removeItem("firebaseToken");
      login(res.data.data);
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Username already exists") {
        setError("This username is already taken.");
        setIsDuplicateError(true);
      } else if (message === "Mobile number already exists") {
        setError("This mobile number is already registered.");
        setIsDuplicateError(true);
      } else {
        setError(message || "Registration failed. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleResendOTP = async () => {
    setOtp("");
    setError("");
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    await handleSendOTP();
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all
            ${i < stepIndex  ? "bg-blue-600 text-white"
            : i === stepIndex ? "glass-step-active text-blue-700"
            : "glass-step-idle text-gray-400"}`}>
            {i < stepIndex ? "✓" : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === stepIndex ? "text-blue-600" : "text-gray-400"}`}>
            {s}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 ${i < stepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="min-h-screen flex relative overflow-hidden bg-gray-50"
      style={{ "--brand": "37,99,235" }}
    >
      {/* Ambient drifting blobs across the whole page */}
      <div className="glass-blob glass-blob--1 absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--2 absolute bottom-0 left-1/3 w-96 h-96 rounded-full pointer-events-none" />

      <div ref={recaptchaRef} />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
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

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="glass-icon-chip-light w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-base tracking-tight">Skool Box</span>
              <span className="font-light text-blue-200 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>
          <div className="space-y-4">
            <span className="glass-pill-light inline-flex items-center gap-2 text-white">
              <Sparkles size={13} />
              Join in under a minute
            </span>
            <h1 className="text-4xl font-black leading-tight">
              Join the Happy Parents Club<br />
              <span className="text-blue-200">happy parents.</span>
            </h1>
            <p className="text-blue-100 text-base font-light max-w-xs">
              Create an account and start shopping for your school essentials today.
            </p>
          </div>
          <p className="text-blue-200 text-sm">© {new Date().getFullYear()} Skool Box Store. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex justify-center items-center px-6 py-12 relative z-10">
        <div className="glass-card w-full max-w-md rounded-2xl p-7 sm:p-8 space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-1">
            <div className="glass-icon-chip w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1 bg-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-gray-900 text-base tracking-tight">Skool Box</span>
              <span className="font-light text-blue-600 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="glass-pill inline-flex items-center gap-2 text-blue-700">
              <span className="glass-dot" />
              Create account
            </span>
            <h2 className="text-3xl font-black text-gray-900">Let's get you set up</h2>
            <p className="text-gray-500 text-sm">
              {step === "mobile"  && "Enter your mobile number to get started"}
              {step === "otp"     && `OTP sent to +91 ${mobileNumber}`}
              {step === "details" && "Almost done — fill in your details"}
            </p>
          </div>

          <StepIndicator />

          {/* Error */}
          {error && (
            <div className="glass-alert-error flex flex-col gap-1 px-4 py-3 rounded-xl text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                {error}
              </div>
              {isDuplicateError && (
                <p className="text-xs text-red-500 pl-3 mt-0.5">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold underline hover:text-red-700">Sign in here</Link>
                </p>
              )}
            </div>
          )}

          {/* ── Step 1: Mobile ── */}
          {step === "mobile" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="glass-input-wrap flex items-center overflow-hidden rounded-xl">
                  <span className="px-3 py-3 bg-white/40 text-sm text-gray-500 border-r border-white/60 font-medium">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/, ""))}
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                    className="flex-1 px-3 py-3 text-sm outline-none text-gray-800 bg-transparent"
                  />
                </div>
                {mobileNumber && (
                  <p className={`text-xs pl-1 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                    {mobileNumber.length}/10 digits {isMobileValid && "✓"}
                  </p>
                )}
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading || !isMobileValid}
                className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Sending OTP...</>
                  : <>Send OTP <ArrowRight size={15} /></>}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Enter OTP</label>
                <input
                  type="tel"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/, ""))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                  className="glass-input-wrap w-full px-4 py-3 rounded-xl text-xl focus:outline-none tracking-[0.5em] text-center font-bold text-gray-800 bg-transparent"
                />
                <p className="text-xs text-gray-400 text-center">
                  OTP sent to +91 {mobileNumber} — expires in 10 minutes
                </p>
              </div>
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Verifying...</>
                  : <>Verify OTP <ArrowRight size={15} /></>}
              </button>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("mobile"); setOtp(""); setError(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Change number
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="glass-alert-success flex items-center gap-2 px-3 py-2.5 rounded-xl">
                <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-semibold">+91 {mobileNumber}</span>
                <span className="text-xs text-green-500 ml-auto">Verified</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="glass-avatar w-16 h-16 rounded-full overflow-hidden flex items-center justify-center">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      : <User size={24} className="text-gray-400" />}
                  </div>
                  <label className="glass-shine absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                    <Camera size={12} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Profile Photo</p>
                  <p className="text-xs text-gray-400">Optional — click the camera icon to upload</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="glass-input-wrap w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="glass-input-wrap w-full pl-10 pr-11 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-blue-500" />
                  <label className="text-sm font-semibold text-gray-700">Delivery Address</label>
                  <span className="text-xs text-gray-400">(Optional)</span>
                </div>
                <div className="glass-card-inset space-y-3 rounded-xl p-4">
                  <input
                    type="text"
                    placeholder="House / Flat / Street address"
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                    className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  <input
                    type="tel"
                    maxLength={6}
                    placeholder="Pincode"
                    value={address.pincode}
                    onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/, "") })}
                    className="glass-input-wrap w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all mt-2"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Creating account...</>
                  : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 20px 44px -20px rgba(var(--brand),0.28),
                      inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .glass-card-inset {
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glass-input-wrap {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .glass-input-wrap:focus-within {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.15);
        }

        .glass-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          font-weight: 600; font-size: 12px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 18px -10px rgba(var(--brand),0.35),
                      inset 0 1px 0 rgba(255,255,255,0.9);
          width: fit-content;
        }
        .glass-dot { width:6px; height:6px; border-radius:999px; background: rgb(var(--brand)); }

        .glass-pill-light {
          padding: 6px 14px; border-radius: 999px;
          font-weight: 600; font-size: 12px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(10px);
          width: fit-content;
        }

        .glass-icon-chip {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
        }
        .glass-icon-chip-light {
          background: rgba(255,255,255,0.9);
        }

        .glass-avatar {
          background: rgba(255,255,255,0.5);
          border: 2px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
        }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(var(--brand),0.95), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 12px 26px -12px rgba(var(--brand),0.55),
                      inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .glass-btn-primary:hover:not(:disabled) {
          box-shadow: 0 16px 30px -12px rgba(var(--brand),0.65),
                      inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .glass-step-active {
          background: rgba(255,255,255,0.7);
          border: 2px solid rgba(var(--brand),0.5);
          box-shadow: 0 0 0 4px rgba(var(--brand),0.12);
        }
        .glass-step-idle {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.7);
        }

        .glass-alert-error {
          background: rgba(254,242,242,0.7);
          border: 1px solid rgba(252,165,165,0.6);
          backdrop-filter: blur(10px);
          color: rgb(185,28,28);
        }
        .glass-alert-success {
          background: rgba(240,253,244,0.7);
          border: 1px solid rgba(134,239,172,0.6);
          backdrop-filter: blur(10px);
        }

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

        .glass-blob { filter: blur(80px); opacity: 0.18; }
        .glass-blob--1 {
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 17s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 50%, rgba(var(--brand),0.35), rgba(var(--brand),0));
          animation: drift2 15s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-24px, 20px) scale(1.06); }
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