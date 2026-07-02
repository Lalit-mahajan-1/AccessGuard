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
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Visual Issue Exploration",
    description: "See exactly where issues live. Our interactive DOM viewer highlights affected areas in context, showing precisely how they impact user experience.",
    icon: <Layers size={28} strokeWidth={1.5} />,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200"
  },
  {
    title: "AI-Powered Remediation",
    description: "Powered by advanced LLMs. Get context-aware code snippets, optimized ARIA labels, and semantic HTML structures to resolve issues instantly.",
    icon: <Wand2 size={28} strokeWidth={1.5} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200"
  },
  {
    title: "Insights & Benchmarking",
    description: "Track accessibility scores over time. Compare projects, visualize growth, and prove compliance with comprehensive, easy-to-read reports.",
    icon: <LineChart size={28} strokeWidth={1.5} />,
    color: "bg-purple-50 text-purple-600 border-purple-200"
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
    <section ref={containerRef} className="h-screen bg-[#fafafa] flex items-center justify-center overflow-hidden relative" id="features">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-6xl px-6 flex flex-col md:flex-row gap-12 items-center z-10">
        
        {/* Left Side text */}
        <div className="w-full md:w-1/3 text-slate-900">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200/60 text-slate-500 font-medium text-xs tracking-widest uppercase mb-6 shadow-sm backdrop-blur-md">
            Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">Powerful tools for </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-slate-500">inclusive design.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed font-light">
            Stop digging through raw audit reports. Our platform translates complex WCAG guidelines into actionable, visual, and intelligent workflows.
          </p>
        </div>

        {/* Right Side Stacking Cards - Masking container (Outer Shell) */}
        <div className="w-full md:w-2/3 h-[500px] relative overflow-hidden rounded-[2.5rem] p-2 bg-white/60 border border-slate-200/60 backdrop-blur-xl shadow-xl">
          {features.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="absolute top-2 left-2 right-2 bottom-2 p-8 md:p-12 bg-white border border-slate-200 shadow-sm flex flex-col justify-center rounded-[calc(2.5rem-0.5rem)]"
              style={{ 
                zIndex: index, 
                boxShadow: index > 0 ? "0 -30px 60px -10px rgba(0,0,0,0.05)" : "none" 
              }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border shadow-sm ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-3xl font-medium text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-lg text-slate-500 leading-relaxed font-light">
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