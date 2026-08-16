import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, MessageCircle } from "lucide-react";
import API from "../api/axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

import logo from "../assets/logo.png";

const SUPPORT_WHATSAPP = "7004335880";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]                             = useState("mobile");
  const [mobileNumber, setMobileNumber]             = useState("");
  const [otp, setOtp]                               = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [newPassword, setNewPassword]               = useState("");
  const [confirmPass, setConfirmPass]               = useState("");
  const [showPass, setShowPass]                     = useState(false);
  const [showConfirm, setShowConfirm]               = useState(false);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState("");
  const recaptchaRef                                = useRef(null);

  const isMobileValid = /^[0-9]{10}$/.test(mobileNumber);

  const stepIndex = { mobile: 0, otp: 1, reset: 2, done: 3 }[step];
  const steps     = ["Mobile", "OTP", "Reset"];

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello, I need help resetting my password for my account registered with mobile number: +91 ${mobileNumber || "________"}. Please assist me.`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, "_blank");
  };

  const handleSendOTP = async () => {
    if (!isMobileValid) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError("");
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaRef.current,
          { size: "invisible" }
        );
      }
      const result = await signInWithPhoneNumber(
        auth,
        `+91${mobileNumber}`,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setError(err.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true); setError("");
    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      await API.post(
        "/api/v1/users/request-password-reset",
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );
      sessionStorage.setItem("resetFirebaseToken", firebaseToken);
      setStep("reset");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "User not found") {
        setError("No account found with this mobile number.");
      } else {
        setError(message || "Invalid OTP. Try again.");
      }
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPass) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const firebaseToken = sessionStorage.getItem("resetFirebaseToken");
      if (!firebaseToken) {
        setError("Session expired. Please verify your mobile number again.");
        setStep("mobile");
        return;
      }
      await API.post(
        "/api/v1/users/reset-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );
      sessionStorage.removeItem("resetFirebaseToken");
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Try again.");
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setOtp(""); setError("");
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
            ${i < stepIndex   ? "bg-blue-600 text-white"
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

  /* ── WhatsApp Help Banner ── */
  const WhatsAppHelp = ({ context = "default" }) => (
    <div className="glass-alert-green flex items-start gap-3 rounded-xl px-4 py-3">
      <div className="glass-icon-chip-green w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <MessageCircle size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-green-800">
          {context === "not-found"
            ? "Number not registered?"
            : context === "otp-issue"
            ? "Not receiving OTP?"
            : "Need help?"}
        </p>
        <p className="text-xs text-green-600 mt-0.5">
          {context === "not-found"
            ? "Contact support if you think this number should have an account."
            : context === "otp-issue"
            ? "Contact our support team and we'll help you reset your password manually."
            : "Our support team can help you reset your password via WhatsApp."}
        </p>
      </div>
      <button
        onClick={openWhatsApp}
        className="glass-shine shrink-0 flex items-center gap-1.5 glass-btn-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
      >
        <MessageCircle size={12} />
        Chat
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen flex relative overflow-hidden bg-gray-50"
      style={{ "--brand": "37,99,235" }}
    >
      {/* Ambient drifting blobs */}
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
            <h1 className="text-4xl font-black leading-tight">
              Forgot your<br />
              <span className="text-blue-200">password?</span>
            </h1>
            <p className="text-blue-100 text-base font-light max-w-xs">
              Verify your mobile number and we'll get you back in.
            </p>

            {/* WhatsApp support callout — glass strip on brand panel */}
            <div className="glass-pill-light-strip flex items-center gap-3 rounded-xl px-4 py-3 mt-4">
              <MessageCircle size={18} className="text-green-300 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Need help?</p>
                <p className="text-xs text-blue-200">Chat with us on WhatsApp for support</p>
              </div>
              <button
                onClick={openWhatsApp}
                className="glass-shine ml-auto shrink-0 glass-btn-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              >
                Chat
              </button>
            </div>
          </div>
          <p className="text-blue-200 text-sm">© {new Date().getFullYear()} Skool Box Store. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex justify-center items-center px-6 py-12 relative z-10">
        <div className="glass-card w-full max-w-md rounded-2xl p-7 sm:p-8 space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="glass-icon-chip w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1 bg-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-gray-900 text-base tracking-tight">Skool Box</span>
              <span className="font-light text-blue-600 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          {/* Done state */}
          {step === "done" ? (
            <div className="text-center space-y-5 py-8">
              <div className="glass-icon-chip-green w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Password Reset!</h2>
                <p className="text-sm text-gray-400 mt-1">You can now log in with your new password.</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                Go to Login <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <span className="glass-pill inline-flex items-center gap-2 text-blue-700">
                  <span className="glass-dot" />
                  Reset password
                </span>
                <h2 className="text-3xl font-black text-gray-900">Reset Password</h2>
                <p className="text-gray-500 text-sm">
                  {step === "mobile" && "Enter the mobile number linked to your account"}
                  {step === "otp"    && `OTP sent to +91 ${mobileNumber}`}
                  {step === "reset"  && "Choose a strong new password"}
                </p>
              </div>

              <StepIndicator />

              {/* Error */}
              {error && (
                <div className="glass-alert-error flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Step 1: Mobile ── */}
              {step === "mobile" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
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

                  {error && error.includes("account") ? (
                    <WhatsAppHelp context="not-found" />
                  ) : (
                    <WhatsAppHelp context="default" />
                  )}

                  <p className="text-center text-sm text-gray-500">
                    Remember your password?{" "}
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
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
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

                  {error && <WhatsAppHelp context="otp-issue" />}
                </div>
              )}

              {/* ── Step 3: New Password ── */}
              {step === "reset" && (
                <div className="space-y-4">

                  <div className="glass-alert-success flex items-center gap-2 px-3 py-2.5 rounded-xl">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                    <span className="text-sm text-green-700 font-semibold">+91 {mobileNumber}</span>
                    <span className="text-xs text-green-500 ml-auto">Verified</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="glass-input-wrap w-full pl-10 pr-11 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        className={`glass-input-wrap w-full pl-10 pr-11 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent transition-all
                          ${confirmPass && confirmPass !== newPassword ? "glass-input-error" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPass && confirmPass !== newPassword && (
                      <p className="text-xs text-red-500 pl-1">Passwords do not match</p>
                    )}
                    {confirmPass && confirmPass === newPassword && (
                      <p className="text-xs text-green-500 pl-1">✓ Passwords match</p>
                    )}
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="glass-shine glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all"
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Resetting...</>
                      : <>Reset Password <ArrowRight size={15} /></>}
                  </button>
                </div>
              )}
            </>
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
        .glass-input-wrap {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .glass-input-wrap:focus-within {
          border-color: rgba(var(--brand),0.6);
          box-shadow: 0 0 0 3px rgba(var(--brand),0.15);
        }
        .glass-input-error {
          border-color: rgba(248,113,113,0.7) !important;
        }
        .glass-input-error:focus-within {
          box-shadow: 0 0 0 3px rgba(248,113,113,0.15) !important;
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

        .glass-pill-light-strip {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
        }

        .glass-icon-chip {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
        }
        .glass-icon-chip-light {
          background: rgba(255,255,255,0.9);
        }
        .glass-icon-chip-green {
          background: linear-gradient(150deg, rgba(34,197,94,0.9), rgba(21,128,61,0.85));
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 14px -8px rgba(21,128,61,0.5);
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

        .glass-btn-green {
          background: linear-gradient(135deg, rgba(34,197,94,0.92), rgba(21,128,61,0.95));
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 8px 18px -10px rgba(21,128,61,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .glass-btn-green:hover {
          box-shadow: 0 12px 22px -10px rgba(21,128,61,0.6),
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
        .glass-alert-green {
          background: rgba(240,253,244,0.65);
          border: 1px solid rgba(134,239,172,0.5);
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