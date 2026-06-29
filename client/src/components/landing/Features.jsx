import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, Wand2, LineChart, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Multi-Page Analysis",
    description: "Scan entire domains automatically. Discover routes and ensure your entire web ecosystem meets WCAG 2.2 standards without manual page-by-page checking.",
    icon: <Globe size={28} strokeWidth={1.5} />,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    title: "Visual Issue Exploration",
    description: "See exactly where issues live. Our interactive DOM viewer highlights affected areas in context, showing precisely how they impact user experience.",
    icon: <Layers size={28} strokeWidth={1.5} />,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    title: "AI-Powered Remediation",
    description: "Powered by advanced LLMs. Get context-aware code snippets, optimized ARIA labels, and semantic HTML structures to resolve issues instantly.",
    icon: <Wand2 size={28} strokeWidth={1.5} />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    title: "Insights & Benchmarking",
    description: "Track accessibility scores over time. Compare projects, visualize growth, and prove compliance with comprehensive, easy-to-read reports.",
    icon: <LineChart size={28} strokeWidth={1.5} />,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  }
];

const Features = () => {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.set(cardsRef.current.slice(1), { yPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: 1,
        }
      });

      cardsRef.current.forEach((card, index) => {
        if (index === cardsRef.current.length - 1) return;
        const tiltAngle = index % 2 === 0 ? -3 : 3;

        tl.to(card, {
          scale: 0.92,
          rotation: tiltAngle,
          opacity: 0.5,
          transformOrigin: "center center",
          ease: "power1.inOut",
          duration: 0.5
        });

        tl.to(cardsRef.current[index + 1], {
          yPercent: 0,
          ease: "power2.out",
          duration: 1
        }, "-=0.2");
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="h-screen bg-[#050505] flex items-center justify-center overflow-hidden relative" id="features">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-6xl px-6 flex flex-col md:flex-row gap-12 items-center z-10">
        
        {/* Left Side text */}
        <div className="w-full md:w-1/3 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 font-medium text-xs tracking-widest uppercase mb-6 backdrop-blur-md">
            Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-normal tracking-tight mb-6 leading-tight">
            Powerful tools for <span className="text-white/40">inclusive design.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed font-light">
            Stop digging through raw audit reports. Our platform translates complex WCAG guidelines into actionable, visual, and intelligent workflows.
          </p>
        </div>

        {/* Right Side Stacking Cards - Masking container (Outer Shell) */}
        <div className="w-full md:w-2/3 h-[500px] relative overflow-hidden rounded-[2.5rem] p-2 bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-2xl">
          {features.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="absolute top-2 left-2 right-2 bottom-2 p-8 md:p-12 bg-[#0a0a0a] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-center rounded-[calc(2.5rem-0.5rem)]"
              style={{ 
                zIndex: index, 
                boxShadow: index > 0 ? "0 -30px 60px -10px rgba(0,0,0,0.8)" : "none" 
              }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-3xl font-medium text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-lg text-white/50 leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;