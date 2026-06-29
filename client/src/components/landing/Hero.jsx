import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Terminal, Fingerprint, ScanSearch, ShieldAlert, AlertOctagon, Link2, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Hero = ({ onRunAudit }) => {
  const containerRef = useRef(null);
  const counterRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      // --- 1. INITIAL LOAD ANIMATION ---
      gsap.fromTo(".intro-item", 
        { y: 40, autoAlpha: 0, filter: "blur(10px)" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.2 }
      );

      const pulse = gsap.to(".portal-glow", {
        opacity: 0.6,
        scale: 1.05,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // --- 2. MASTER SCROLL TIMELINE (Pinned for 800vh) ---
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=800%",
          pin: true,
          scrub: 1.5,
        }
      });

      tl.to(".bg-mesh", { rotation: 45, scale: 1.2, duration: 8, ease: "none" }, 0);

      // ACT 1: The Greeting Fades Away
      tl.fromTo(".intro-wrapper", 
        { scale: 1, y: "0vh", autoAlpha: 1, filter: "blur(0px)" },
        { scale: 0.8, y: "-15vh", autoAlpha: 0, filter: "blur(20px)", duration: 1, ease: "power2.inOut" }, 
        0
      );

      // ACT 2: The Portal Arrives
      tl.fromTo(".input-portal",
        { autoAlpha: 0, y: "20vh", scale: 0.8, rotateX: 20, z: -100 },
        { autoAlpha: 1, y: "0vh", scale: 1, rotateX: 0, z: 0, duration: 1.5, ease: "expo.out" },
        1 
      );

      // ACT 3: Typing the URL
      tl.to(".placeholder-text", { opacity: 0, duration: 0.1 }, 2.5)
        .to(".typed-url", { width: "100%", duration: 1.2, ease: "steps(22)" }, 2.5)
        .to(".input-portal", { 
          scale: 0.95, 
          rotateX: 5, 
          y: "2vh",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 30px 60px rgba(0,0,0,0.08)",
          duration: 1.2, 
          ease: "power2.inOut" 
        }, 4);
      
      tl.add(() => pulse.kill(), 4);

      // ACT 4: The Deep Scan
      tl.fromTo(".scanner-laser",
        { top: "-10%", opacity: 0 },
        { top: "100%", opacity: 1, duration: 2, ease: "none" },
        4.5
      );

      tl.fromTo(".hud-1", { autoAlpha: 0, y: 50, z: 100 }, { autoAlpha: 1, y: -20, z: 100, duration: 1, ease: "back.out(1.2)" }, 4.5)
        .fromTo(".hud-2", { autoAlpha: 0, y: 50, z: 50 }, { autoAlpha: 1, y: -40, z: 50, duration: 1, ease: "back.out(1.2)" }, 4.8)
        .fromTo(".hud-3", { autoAlpha: 0, y: 50, z: 150 }, { autoAlpha: 1, y: 0, z: 150, duration: 1, ease: "back.out(1.2)" }, 5.1);

      // ACT 5: Flaw Detonation (Glitch)
      tl.to(".input-portal", { skewX: -1, x: 3, duration: 0.05, yoyo: true, repeat: 5 }, 6.5)
        .to(".input-portal", { skewX: 0, x: 0, duration: 0.05 }, 6.8);

      tl.fromTo(".flaw-card",
        { autoAlpha: 0, scale: 0, x: 0, y: 0, z: -200 },
        { 
          autoAlpha: 1, scale: 1, 
          x: (i) => [-320, 320, -220][i], 
          y: (i) => [-150, -100, 180][i], 
          z: (i) => [100, 200, 150][i], 
          rotateY: (i) => [-10, 15, -8][i],
          rotateZ: (i) => [-3, 3, -2][i],
          stagger: 0.15, duration: 1.2, ease: "expo.out" 
        },
        6.6 
      );

      // ACT 6: The Diagnosis
      tl.to(".flaw-card, .hud-element", { autoAlpha: 0, y: "+=50", filter: "blur(10px)", duration: 0.8, stagger: 0.05 }, 8)
        .to(".input-portal", { 
          borderColor: "rgba(225, 29, 72, 0.2)", 
          boxShadow: "0 0 40px rgba(225, 29, 72, 0.05), 0 0 0 1px rgba(225, 29, 72, 0.2)", 
          duration: 1 
        }, 8)
        .to(".status-indicator", { backgroundColor: "#e11d48", boxShadow: "0 0 10px rgba(225,29,72,0.4)", duration: 0.5 }, 8);

      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 18,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          if (counterRef.current) counterRef.current.innerText = Math.round(counterObj.val);
        }
      }, 8.2)
      .to(".flaws-label", { autoAlpha: 1, duration: 0.5 }, 8.5)
      .fromTo(".final-cta", 
        { autoAlpha: 0, y: 30, filter: "blur(10px)" }, 
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "expo.out" }, 
        9
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-white overflow-hidden perspective-[2000px] flex flex-col items-center justify-center font-sans text-slate-900"
    >
      {/* Background Layer: Soft Mesh Glows */}
      <div className="bg-mesh absolute inset-0 opacity-[0.8] pointer-events-none flex items-center justify-center">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[100px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>
      
      {/* 3D Container */}
      <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">

        {/* --- ACT 1: INITIAL GREETING --- */}
        <div className="intro-wrapper absolute z-50 flex flex-col items-center text-center w-[90vw] max-w-5xl will-change-transform">
          <div className="intro-item inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 font-medium text-xs tracking-[0.2em] uppercase mb-8 invisible shadow-sm">
            <Sparkles size={14} className="text-indigo-500" /> Advanced WCAG 2.2 Intelligence
          </div>
          <h1 className="intro-item text-5xl md:text-7xl lg:text-[7rem] font-medium tracking-tight text-slate-900 leading-[1.05] mb-8 invisible">
            Audit the web.<br />
            <span className="text-slate-400">Empower everyone.</span>
          </h1>
          <p className="intro-item text-lg md:text-xl text-slate-500 font-normal max-w-2xl mb-8 invisible">
            Instantly parse DOM structures, contrast matrices, and ARIA topologies to secure perfect accessibility compliance in milliseconds.
          </p>
        </div>

        {/* --- ACT 2-5: THE INPUT PORTAL (Double-Bezel Light) --- */}
        <div className="input-portal absolute w-[90vw] max-w-3xl z-30 [transform-style:preserve-3d] will-change-transform p-2 bg-white/60 backdrop-blur-2xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] invisible">
          
          <div className="portal-glow absolute inset-0 rounded-[2rem] pointer-events-none" />

          {/* Inner Core */}
          <div className="relative bg-slate-50/80 rounded-[calc(2rem-0.5rem)] border border-slate-200/50 shadow-sm p-6 md:p-10 flex flex-col gap-8 overflow-hidden">
            
            {/* Module Header */}
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] md:text-xs tracking-widest uppercase">
              <span className="flex items-center gap-3">
                <span className="status-indicator w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                Connection Established
              </span>
              <span className="font-semibold text-slate-500">AG_CORE_V2</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-normal text-slate-900 tracking-tight">Inject target URL</h2>

            {/* URL Bar */}
            <div className="relative w-full bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 text-lg md:text-xl font-mono shadow-sm overflow-hidden">
              <Link2 className="text-slate-300 shrink-0" strokeWidth={1.5} />
              <div className="relative flex-1 whitespace-nowrap overflow-hidden flex items-center">
                <span className="placeholder-text absolute text-slate-300">https://domain.com</span>
                <span className="typed-url inline-block overflow-hidden border-r-2 border-indigo-400 w-0 text-slate-800 font-light">
                  https://example.com/shop
                </span>
              </div>
            </div>

            {/* Final Counter Overlay */}
            <div className="flaws-label absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl invisible z-50 rounded-[calc(2rem-0.5rem)]">
              <ShieldAlert className="w-10 h-10 text-rose-500 mb-6" strokeWidth={1.5} />
              <div className="text-7xl md:text-9xl font-light text-slate-900 tracking-tighter drop-shadow-sm">
                <span ref={counterRef}>0</span>
              </div>
              <span className="text-rose-500 font-mono tracking-[0.2em] uppercase mt-6 text-xs font-semibold">Violations Detected</span>
            </div>

            {/* The Holographic Laser */}
            <div className="scanner-laser absolute left-[-2%] w-[104%] h-[1.5px] bg-indigo-500 z-40 pointer-events-none" 
                 style={{ boxShadow: "0 0 15px 2px rgba(99,102,241,0.4), 0 0 30px 5px rgba(99,102,241,0.1)" }}>
            </div>
          </div>
        </div>

        {/* --- FLOATING HUD ELEMENTS (Light Mode) --- */}
        <div className="hud-element hud-1 absolute top-[20%] left-[10%] bg-white/95 backdrop-blur-xl border border-slate-200 px-5 py-3 rounded-xl font-mono text-slate-500 text-xs flex items-center gap-3 z-20 invisible shadow-xl">
          <Terminal size={14} className="text-slate-400" /> [Parsing DOM tree]
        </div>
        <div className="hud-element hud-2 absolute bottom-[25%] right-[15%] bg-white/95 backdrop-blur-xl border border-slate-200 px-5 py-3 rounded-xl font-mono text-slate-500 text-xs flex items-center gap-3 z-20 invisible shadow-xl">
          <ScanSearch size={14} className="text-slate-400" /> [Evaluating Contrast Matrix]
        </div>
        <div className="hud-element hud-3 absolute top-[30%] right-[10%] bg-white/95 backdrop-blur-xl border border-slate-200 px-5 py-3 rounded-xl font-mono text-slate-500 text-xs flex items-center gap-3 z-20 invisible shadow-xl">
          <Fingerprint size={14} className="text-slate-400" /> [Verifying ARIA Roles]
        </div>

        {/* --- FLAW DETONATION CARDS (Light Mode) --- */}
        <div className="flaw-card absolute bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 z-40 invisible shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600"><AlertOctagon size={20} strokeWidth={1.5} /></div>
          <div>
            <p className="text-rose-500 text-[10px] font-mono tracking-widest uppercase mb-1 font-semibold">Critical</p>
            <p className="text-slate-800 text-sm font-medium">Low Contrast (3.1:1)</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 z-40 invisible shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600"><AlertOctagon size={20} strokeWidth={1.5} /></div>
          <div>
            <p className="text-rose-500 text-[10px] font-mono tracking-widest uppercase mb-1 font-semibold">High</p>
            <p className="text-slate-800 text-sm font-medium">Missing Alt Attribute</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 z-40 invisible shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><AlertOctagon size={20} strokeWidth={1.5} /></div>
          <div>
            <p className="text-amber-500 text-[10px] font-mono tracking-widest uppercase mb-1 font-semibold">Medium</p>
            <p className="text-slate-800 text-sm font-medium">Form Label Missing</p>
          </div>
        </div>

        {/* --- ACT 6: FINAL CTA --- */}
        <div className="final-cta absolute bottom-[8vh] z-50 flex flex-col items-center gap-6 invisible">
          <span className="text-slate-400 font-mono text-[10px] tracking-[0.2em] uppercase font-semibold">[ Scroll down to remediate ]</span>
          <button
            type="button"
            onClick={onRunAudit}
            className="group relative flex items-center gap-4 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full font-medium text-sm hover:bg-slate-800 transition-colors shadow-lg"
          >
            <span>Initiate Fix Sequence</span>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 group-active:translate-x-2 transition-transform duration-300" />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
};

export default Hero;