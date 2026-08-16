import { Mail, Phone, MapPin, ArrowRight, Instagram, Facebook, Clock, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

// Point this at your actual logo file (same one used in the Navbar)
import logo from "../assets/logo.png";

const WHATSAPP_NUMBER = "7004335880";
const WHATSAPP_DEFAULT_MSG = encodeURIComponent("Hi! I have a question about Skool Box Store.");

const storeHours = [
  { day: "Mon", open: true },
  { day: "Tue", open: true },
  { day: "Wed", open: true },
  { day: "Thu", open: true },
  { day: "Fri", open: true },
  { day: "Sat", open: true },
  { day: "Sun", open: false },
];

const quickLinks = [
  { label: "Home",       to: "/" },
  { label: "Uniforms",   to: "/#uniform" },
  { label: "Bags",       to: "/#bags" },
  { label: "Stationery", to: "/#stationery" },
  { label: "Cart",       to: "/cart" },
  { label: "My Orders",  to: "/profile" },
];

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const Footer = () => {
  const now = new Date();
  // 0=Sun,1=Mon...6=Sat
  const dayIndex = now.getDay();
  const isOpenNow =
    dayIndex !== 0 &&
    now.getHours() >= 9 &&
    now.getHours() < 18;

  return (
    <footer
      className="relative bg-[#0b1220] text-gray-400 overflow-hidden"
      style={{ "--brand": "37,99,235" /* blue-600 */, "--brand-2": "245,158,11" /* amber-500 */ }}
    >
      {/* Ambient glass blobs — very quiet on dark, blue + amber, brand colors unchanged */}
      <div className="glass-blob-dark glass-blob-dark--1 absolute -top-24 right-0 w-96 h-96 rounded-full pointer-events-none" />
      <div className="glass-blob-dark glass-blob-dark--2 absolute bottom-0 -left-20 w-80 h-80 rounded-full pointer-events-none" />

      {/* Gradient accent bar — matches navbar's blue */}
      <div className="relative h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />

      {/* WhatsApp Banner → dark glass strip */}
      <div className="relative glass-strip-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="glass-icon-chip-green w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-4 h-4 fill-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs sm:text-sm leading-tight">Chat with us on WhatsApp</p>
              <p className="text-gray-500 text-[11px] leading-tight">Quick replies · Uniforms, sizes, orders & more</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`}
            target="_blank"
            rel="noreferrer"
            className="glass-shine glass-btn-green flex items-center gap-1.5 active:scale-95 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <MessageCircle size={14} />
            Start Chat
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8 lg:gap-10">

        {/* ── Brand & Contact ── */}
        <div className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="logo-ring-dark w-10 h-10 sm:w-11 sm:h-11 rounded-lg p-[2px] shrink-0">
              <div className="w-full h-full bg-blue-600 rounded-[6px] flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt="Skool Box logo"
                  className="w-full h-full object-contain p-1 bg-white rounded-[6px]"
                />
              </div>
            </div>
            <div className="leading-tight">
              <span className="block font-black text-white text-base sm:text-lg tracking-tight">Skool Box</span>
              <span className="block font-medium text-blue-400 text-[10px] tracking-[0.2em] uppercase">Store</span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-gray-500 max-w-xs">
            Your one-stop shop for school essentials — uniforms, bags, socks and
            stationery for primary school students across the Gumla district.
          </p>

          {/* Contact */}
          <div className="space-y-1.5">
            <a href="tel:+9170043 35880"
              className="flex items-center gap-2.5 text-[13px] text-gray-400 hover:text-white transition-colors group">
              <div className="glass-icon-chip-dark group-hover:glass-icon-chip-dark--active w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 shrink-0">
                <Phone size={12} />
              </div>
              +91 70043 35880
            </a>
            <a href="mailto:skoolboxgumla@gmail.com"
              className="flex items-center gap-2.5 text-[13px] text-gray-400 hover:text-white transition-colors group">
              <div className="glass-icon-chip-dark group-hover:glass-icon-chip-dark--active w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 shrink-0">
                <Mail size={12} />
              </div>
              skoolboxgumla@gmail.com
            </a>
            <div className="flex items-center gap-2.5 text-[13px] text-gray-500">
              <div className="glass-icon-chip-dark w-7 h-7 rounded-md flex items-center justify-center shrink-0">
                <MapPin size={12} />
              </div>
              Gumla, Jharkhand, India
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2 pt-0.5">
            <a href="#" aria-label="Instagram"
              className="glass-icon-chip-dark hover:glass-icon-chip-dark--active w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200">
              <Instagram size={13} />
            </a>
            <a href="#" aria-label="Facebook"
              className="glass-icon-chip-dark hover:glass-icon-chip-dark--active w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200">
              <Facebook size={13} />
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
              className="glass-icon-chip-dark hover:glass-icon-chip-dark--active w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200">
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            </a>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Quick Links</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link to={to}
                  className="menu-row-glass-dark flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-white transition-colors group w-fit px-2 py-1 -mx-2 rounded-md">
                  <ArrowRight size={12}
                    className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-400 hidden sm:inline-block" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Store Hours (highlighted) ── */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-blue-400" />
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Store Hours</h3>
            </div>
            {/* Open / Closed pill → glass pill, semantic colors unchanged */}
            <div className={`glass-status-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isOpenNow ? "glass-status-pill--open" : "glass-status-pill--closed"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
              {isOpenNow ? "Open" : "Closed"}
            </div>
          </div>

          {/* Day grid → glass cells */}
          <div className="grid grid-cols-7 gap-1 max-w-[260px] sm:max-w-none">
            {storeHours.map(({ day, open }) => {
              const todayDayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              const isToday = todayDayNames[dayIndex] === day;
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-semibold ${isToday ? "text-blue-400" : "text-gray-600"}`}>
                    {day}
                  </span>
                  <div className={`day-cell-glass w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[9px] font-bold transition-all
                    ${isToday
                      ? open ? "day-cell-glass--today-open" : "day-cell-glass--today-closed"
                      : open ? "day-cell-glass--open" : "day-cell-glass--closed"
                    }`}>
                    {open ? "✓" : "✕"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time range → glass card */}
          <div className="glass-card-dark rounded-lg px-3.5 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Mon – Sat</span>
              <span className="text-white font-semibold">9:00 AM – 6:00 PM</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Sunday</span>
              <span className="text-red-400 font-semibold">Closed</span>
            </div>
          </div>

          {/* WhatsApp shortcut inside hours section → green glass */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`}
            target="_blank"
            rel="noreferrer"
            className="glass-shine glass-whatsapp-shortcut flex items-center gap-2 w-full justify-center text-xs font-semibold py-2 rounded-lg transition-all duration-200"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current shrink-0" />
            Message us on WhatsApp
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-gray-600 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Skool Box Store. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a
              href="https://github.com/saurav10023"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Kumar Saurav
            </a>
          </p>
        </div>
      </div>

      <style>{`
        /* ── Dark liquid glass core surfaces ── */
        .glass-card-dark {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .glass-strip-dark {
          background: rgba(255,255,255,0.035);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .logo-ring-dark {
          background: linear-gradient(155deg, rgba(255,255,255,0.25), rgba(var(--brand),0.55) 50%, rgba(var(--brand-2),0.5));
          box-shadow: 0 8px 20px -12px rgba(var(--brand),0.5);
        }

        .glass-icon-chip-dark {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glass-icon-chip-dark--active,
        .glass-icon-chip-dark:hover {
          background: linear-gradient(150deg, rgba(var(--brand),0.9), rgba(var(--brand),0.7));
          border-color: rgba(var(--brand),0.9);
        }

        .glass-icon-chip-green {
          background: linear-gradient(150deg, rgba(34,197,94,0.9), rgba(21,128,61,0.85));
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 14px -8px rgba(21,128,61,0.6);
        }

        .glass-btn-green {
          background: linear-gradient(135deg, rgba(34,197,94,0.92), rgba(21,128,61,0.95));
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 10px 22px -12px rgba(21,128,61,0.55),
                      inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .glass-btn-green:hover {
          box-shadow: 0 14px 26px -12px rgba(21,128,61,0.65),
                      inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .glass-whatsapp-shortcut {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.25);
          color: rgb(74,222,128);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glass-whatsapp-shortcut:hover {
          background: rgba(34,197,94,0.85);
          color: #fff;
          border-color: rgba(34,197,94,0.9);
        }

        .menu-row-glass-dark:hover {
          background: rgba(255,255,255,0.05);
        }

        .glass-status-pill {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glass-status-pill--open {
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.3);
          color: rgb(74,222,128);
        }
        .glass-status-pill--closed {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: rgb(248,113,113);
        }

        .day-cell-glass {
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .day-cell-glass--open { background: rgba(255,255,255,0.045); color: rgb(156,163,175); }
        .day-cell-glass--closed { background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05); color: rgb(75,85,99); }
        .day-cell-glass--today-open {
          background: linear-gradient(150deg, rgba(var(--brand),0.95), rgba(29,78,216,0.9));
          border-color: rgba(var(--brand),0.9);
          color: #fff;
          box-shadow: 0 6px 14px -8px rgba(var(--brand),0.6);
        }
        .day-cell-glass--today-closed {
          background: rgba(239,68,68,0.16);
          border-color: rgba(239,68,68,0.4);
          color: rgb(248,113,113);
        }

        /* ── Shine sweep (shared) ── */
        .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
        .glass-shine::after {
          content: ""; position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-18deg);
          transition: left 0.75s ease;
          pointer-events: none;
        }
        .glass-shine:hover::after { left: 130%; }

        /* ── Ambient background blobs — subtle on dark ── */
        .glass-blob-dark { filter: blur(70px); opacity: 0.22; }
        .glass-blob-dark--1 {
          background: radial-gradient(circle at 40% 30%, rgba(var(--brand),0.5), rgba(var(--brand),0));
          animation: drift1 18s ease-in-out infinite;
        }
        .glass-blob-dark--2 {
          background: radial-gradient(circle at 60% 50%, rgba(var(--brand-2),0.4), rgba(var(--brand-2),0));
          animation: drift2 16s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px, 18px) scale(1.06); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(18px, -16px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-blob-dark--1, .glass-blob-dark--2 { animation: none !important; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;