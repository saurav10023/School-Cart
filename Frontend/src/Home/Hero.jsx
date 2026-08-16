import { useEffect, useRef } from "react";
import { ArrowRight, ShoppingBag, Star, Shirt, Backpack, PenLine, Footprints, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import hero from "../images/hero.png";

const categories = [
  { label: "Uniforms",   icon: Shirt,      id: "uniform" },
  { label: "Bags",       icon: Backpack,   id: "bags" },
  { label: "Stationery", icon: PenLine,    id: "stationery" },
  { label: "Socks",      icon: Footprints, id: "socks" },
];

// Small product set for the bobbing wave strip above the location badge —
// each one links to its page, same destinations as the category rail below
const waveIcons = [
  { icon: Shirt,       id: "uniform",    label: "Uniforms",   to: "section" },
  { icon: Backpack,    id: "bags",       label: "Bags",       to: "section" },
  { icon: PenLine,     id: "stationery", label: "Stationery", to: "section" },
  { icon: Footprints,  id: "socks",      label: "Socks",      to: "section" },
  { icon: ShoppingBag, id: "shop",       label: "Shop all",   to: "/products" },
];

const Hero = () => {
  const rootRef = useRef(null);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // One-time, staggered fade-up entrance for the hero content (respects reduced motion)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll("[data-reveal]");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * 90}ms`;
    });
    const raf = requestAnimationFrame(() => {
      items.forEach((el) => el.classList.add("is-visible"));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative bg-white overflow-hidden"
      style={{ "--brand": "37,99,235" /* blue-600 */, "--brand-2": "245,158,11" /* amber-500 */ }}
    >
      {/* Dot-grid canvas */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: "radial-gradient(circle, #dbeafe 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)",
        }}
      />

      {/* Drifting liquid-glass blobs — blue + amber, brand colors unchanged */}
      <div className="glass-blob glass-blob--1 absolute -top-32 -right-20 w-[26rem] h-[26rem] rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--2 absolute -bottom-40 -left-24 w-[22rem] h-[22rem] rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--3 absolute top-1/3 left-1/2 w-72 h-72 rounded-full pointer-events-none" />

      {/* ── Main Hero ── */}
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-10 pb-11 md:pt-14 md:pb-14">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">

          {/* ── Left ── */}
          <div className="space-y-5 text-center md:text-left">

            {/* Wave strip — liquid glass product icons bobbing in sequence, each one is a real link to its page */}
            <div data-reveal className="reveal flex items-end justify-center md:justify-start gap-3 sm:gap-4">
              {waveIcons.map(({ icon: Icon, id, label, to }, i) => {
                const badgeInner = (
                  <>
                    <span className="wave-badge glass-shine flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl">
                      <Icon size={19} className="text-blue-700" strokeWidth={2.1} />
                    </span>
                    <span className="wave-badge-shadow" />
                  </>
                );
                const sharedProps = {
                  className: "wave-badge-wrap wave-badge-link",
                  style: { animationDelay: `${i * 0.18}s` },
                  "aria-label": label,
                  title: label,
                };
                return to === "/products" ? (
                  <Link key={id} {...sharedProps} to={to}>
                    {badgeInner}
                  </Link>
                ) : (
                  <button key={id} {...sharedProps} type="button" onClick={() => scrollToSection(id)}>
                    {badgeInner}
                  </button>
                );
              })}
            </div>

            {/* Badge → glass pill */}
            <div data-reveal className="reveal glass-pill inline-flex items-center gap-2 text-blue-700 text-xs font-bold px-4 py-2 rounded-full">
              <span className="glass-dot w-2 h-2 rounded-full animate-pulse" />
              Now serving Gumla district
            </div>

            {/* Heading — highlighter underline is the type signature */}
            <h1 data-reveal className="reveal text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-gray-900 leading-[1.05] tracking-tight">
              Everything your child needs{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">for school</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full h-3 z-0"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9C40 3 100 2 140 6C160 8 180 9 198 5"
                    stroke="#FBBF24"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtext */}
            <p data-reveal className="reveal text-[15px] md:text-base text-gray-500 leading-relaxed max-w-sm mx-auto md:mx-0">
              Uniforms, bags, stationery and more — sourced, checked and
              delivered with care, so parents don't have to run around town.
            </p>

            {/* Trust line */}
            <div data-reveal className="reveal flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
              <ShieldCheck size={16} className="text-blue-500" />
              <span>Quality-checked essentials, packed for the full school year</span>
            </div>

            {/* CTA Buttons → glass buttons with shine sweep */}
            <div data-reveal className="reveal flex flex-wrap gap-3 justify-center md:justify-start pt-1">
              <Link
                to="/products"
                className="glass-shine glass-btn-primary flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              >
                <ShoppingBag size={17} />
                Shop now
              </Link>
              <button
                onClick={() => scrollToSection("uniform")}
                className="glass-shine glass-btn-secondary flex items-center gap-2 text-gray-700 hover:text-blue-700 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Explore
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* ── Right — modern glass photo treatment ── */}
          <div data-reveal className="reveal relative mt-6 md:mt-0 max-w-md mx-auto md:max-w-none">

            {/* Ambient glow — soft blue/amber halo, replaces the old dot-grid backer */}
            <div className="glow-halo absolute -inset-6 -z-10 rounded-[2.5rem]" aria-hidden="true" />

            {/* Photo — gradient-glass ring frame, no rotation, subtle zoom on hover */}
            <div className="glass-ring rounded-[1.75rem] p-[3px]">
              <div className="glass-shine group/photo relative rounded-[1.6rem] overflow-hidden">
                <img
                  src={hero}
                  alt="School essentials"
                  className="w-full h-64 sm:h-72 md:h-[380px] object-cover transition-transform duration-700 ease-out group-hover/photo:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/35 via-transparent to-transparent" />

                {/* In-frame glass strip — trust line docked to the bottom edge, modern "card overlay" pattern */}
                <div className="glass-overlay-strip absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="glass-icon-chip flex items-center justify-center w-8 h-8 rounded-full shrink-0">
                      <ShieldCheck size={15} className="text-blue-700" />
                    </span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black text-white">New stock</p>
                      <p className="text-[10px] text-blue-50/85">Just arrived</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating trust card — clean, unrotated, sits just outside the frame */}
            <div className="glass-card glass-shine absolute -bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-5 rounded-2xl px-4 py-3 flex items-center gap-2.5 whitespace-nowrap">
              <span className="glass-icon-chip flex items-center justify-center w-8 h-8 rounded-full shrink-0">
                <ShoppingBag size={14} className="text-blue-700" />
              </span>
              <p className="text-[11px] font-bold text-gray-700 leading-tight">
                Trusted by<br />local parents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category rail — glass band, glass icon chips, hairline dividers, edge fade ── */}
      <div className="relative glass-rail [clip-path:polygon(0_10px,100%_0,100%_100%,0_100%)]">
        <div
          className="relative overflow-hidden py-3"
          style={{
            maskImage: "linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
          }}
        >
          <div className="marquee-track flex items-stretch w-max motion-safe:animate-marquee">
            {[...categories, ...categories, ...categories].map(({ label, icon: Icon, id }, i) => (
              <div key={`${label}-${i}`} className="flex items-stretch shrink-0">
                <button
                  onClick={() => scrollToSection(id)}
                  className="group flex items-center gap-3 px-7 text-white whitespace-nowrap"
                >
                  <span className="rail-icon-chip flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200">
                    <Icon size={15} strokeWidth={2.25} className="text-white group-hover:text-blue-900 transition-colors duration-200" />
                  </span>
                  <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-blue-50 group-hover:text-amber-300 transition-colors duration-200">
                    {label}
                  </span>
                </button>
                <span className="w-px my-2 bg-white/15" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* ── Liquid glass core surface ── */
        .glass-card {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px -14px rgba(var(--brand),0.32),
                      inset 0 1px 0 rgba(255,255,255,0.85);
        }

        .glass-pill {
          padding: 8px 16px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 20px -10px rgba(var(--brand),0.35),
                      inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .glass-dot { background: rgb(var(--brand)); }

        .glass-icon-chip {
          background: linear-gradient(150deg, rgba(var(--brand),0.20), rgba(var(--brand),0.08));
          border: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px -8px rgba(var(--brand),0.35);
        }

        /* ── Wave strip: liquid glass product icons bobbing in sequence, now clickable links ── */
        .wave-badge-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          animation: waveLift 2.6s ease-in-out infinite;
        }
        .wave-badge-link {
          cursor: pointer;
          text-decoration: none;
          background: transparent;
          border: none;
          padding: 0;
        }
        .wave-badge-link:focus-visible {
          outline: 2px solid rgb(var(--brand-2));
          outline-offset: 4px;
          border-radius: 1rem;
        }
        .wave-badge {
          background: linear-gradient(155deg, rgba(255,255,255,0.7), rgba(var(--brand),0.14));
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 10px 22px -12px rgba(var(--brand),0.4),
                      inset 0 1px 0 rgba(255,255,255,0.9);
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .wave-badge-shadow {
          display: block;
          width: 60%;
          height: 6px;
          margin-top: 6px;
          border-radius: 999px;
          background: radial-gradient(closest-side, rgba(var(--brand),0.28), transparent 75%);
          animation: waveShadow 2.6s ease-in-out infinite;
        }
        .wave-badge-wrap:hover { animation-play-state: paused; }
        .wave-badge-wrap:hover .wave-badge-shadow { animation-play-state: paused; }
        .wave-badge-wrap:hover .wave-badge {
          box-shadow: 0 14px 28px -12px rgba(var(--brand),0.5),
                      inset 0 1px 0 rgba(255,255,255,0.95);
          border-color: rgba(var(--brand-2),0.7);
        }
        @keyframes waveLift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-11px); }
        }
        @keyframes waveShadow {
          0%, 100% { transform: scaleX(1); opacity: 0.9; }
          50% { transform: scaleX(0.6); opacity: 0.45; }
        }

        /* ── Modern photo treatment ── */
        .glow-halo {
          background: radial-gradient(60% 60% at 30% 20%, rgba(var(--brand),0.22), transparent 70%),
                      radial-gradient(50% 50% at 80% 85%, rgba(var(--brand-2),0.18), transparent 70%);
          filter: blur(28px);
        }
        .glass-ring {
          background: linear-gradient(155deg, rgba(255,255,255,0.9), rgba(var(--brand),0.35) 45%, rgba(var(--brand-2),0.4));
          box-shadow: 0 24px 48px -20px rgba(var(--brand),0.45);
        }
        .glass-overlay-strip {
          background: rgba(15,23,42,0.32);
          border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .rail-icon-chip {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .group:hover .rail-icon-chip {
          background: rgba(var(--brand-2),0.9);
          border-color: rgba(var(--brand-2),0.9);
        }

        .glass-rail {
          background: linear-gradient(90deg, rgba(29,78,216,0.92), rgba(37,99,235,0.92), rgba(29,78,216,0.92));
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        /* ── Buttons ── */
        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(37,99,235,0.92), rgba(29,78,216,0.95));
          border: 1px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 14px 28px -14px rgba(var(--brand),0.55),
                      inset 0 1px 0 rgba(255,255,255,0.4);
        }
        .glass-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px -14px rgba(var(--brand),0.6),
                      inset 0 1px 0 rgba(255,255,255,0.45);
        }

        .glass-btn-secondary {
          background: rgba(255,255,255,0.55);
          border: 2px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 18px -12px rgba(15,23,42,0.18),
                      inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .glass-btn-secondary:hover {
          background: rgba(239,246,255,0.75);
          border-color: rgba(147,197,253,0.9);
          transform: translateY(-2px);
        }

        /* ── Shine sweep ── */
        .glass-shine { position: relative; overflow: hidden; isolation: isolate; }
        .glass-shine::after {
          content: ""; position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.65), transparent);
          transform: skewX(-18deg);
          transition: left 0.75s ease;
          pointer-events: none;
        }
        .glass-shine:hover::after { left: 130%; }

        /* ── Drifting background blobs ── */
        .glass-blob {
          filter: blur(64px);
          opacity: 0.55;
        }
        .glass-blob--1 {
          background: radial-gradient(circle at 30% 30%, rgba(var(--brand),0.35), rgba(var(--brand),0));
          animation: drift1 16s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 40%, rgba(var(--brand-2),0.28), rgba(var(--brand-2),0));
          animation: drift2 14s ease-in-out infinite;
        }
        .glass-blob--3 {
          background: radial-gradient(circle at 50% 50%, rgba(var(--brand),0.18), rgba(var(--brand),0));
          animation: drift3 18s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-24px, 26px) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(22px, -20px) scale(1.06); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-46%,-54%) scale(1.1); }
        }

        /* ── Scroll/entrance reveal ── */
        .reveal {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Marquee ── */
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .motion-safe\\:animate-marquee {
          animation: marquee 26s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-marquee,
          .glass-blob--1, .glass-blob--2, .glass-blob--3,
          .wave-badge-wrap, .wave-badge-shadow {
            animation: none !important;
          }
          .reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;