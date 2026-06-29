import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link2, ScanSearch, Map, Bot, FileCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    id: 1,
    title: "Input Analysis",
    description: "User enters URL. System initiates a deep-link connection to the DOM tree.",
    icon: Link2
  },
  {
    id: 2,
    title: "Component Scanning",
    description: "AI crawls every button, input, and image to check against WCAG 2.2 standards.",
    icon: ScanSearch
  },
  {
    id: 3,
    title: "Violation Mapping",
    description: "Specific accessibility flaws (Contrast, ARIA, Keyboard Traps) are identified and categorized.",
    icon: Map
  },
  {
    id: 4,
    title: "AI Remediation",
    description: "Our neural engine generates the exact React/HTML code fixes needed to solve the flaws.",
    icon: Bot
  },
  {
    id: 5,
    title: "Compliance Report",
    description: "A final accessibility score and a 'One-Click Fix' export are provided.",
    icon: FileCheck
  }
];

const HowItWorks = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const lineRef = useRef(null);
  const panelsRef = useRef([]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      const panels = panelsRef.current;
      
      let scrollTween = gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          end: "+=4000",
        }
      });

      gsap.fromTo(lineRef.current, 
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=4000",
            scrub: 1,
          }
        }
      );

      panels.forEach((panel, i) => {
        const card = panel.querySelector('.step-card');
        const bubble = panel.querySelector('.step-bubble');

        if (i !== 0) {
          gsap.fromTo(card, 
            { scale: 0.8, opacity: 0.2, y: 50 },
            {
              scale: 1, opacity: 1, y: 0,
              duration: 1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scrollTween,
                start: "left center",
                toggleActions: "play none none reverse"
              }
            }
          );

          gsap.fromTo(bubble,
            { scale: 0.5, backgroundColor: "#f8fafc", color: "#6366f1", borderColor: "#e2e8f0" },
            {
              scale: 1, backgroundColor: "#6366f1", color: "#ffffff", borderColor: "#6366f1",
              duration: 0.5,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scrollTween,
                start: "left center",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-screen bg-white text-slate-900 overflow-hidden flex flex-col"
      id="how-it-works"
    >
      
      {/* Background Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-[0.2]"
        style={{ 
          backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)', 
          backgroundSize: '4vw 4vw' 
        }} 
      />

      {/* Fixed Header Content inside the pinned section */}
      <div className="absolute top-12 md:top-24 left-0 w-full px-6 md:px-16 z-20 pointer-events-none flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 font-medium text-[10px] tracking-widest uppercase mb-4 shadow-sm">
          The Process
        </div>
        <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900">
          Mechanism
        </h2>
      </div>

      {/* The Horizontal Track Wrapper */}
      <div 
        ref={trackRef} 
        className="relative h-full flex items-center pt-20"
        style={{ width: `${steps.length * 100}vw` }}
      >
        
        {/* The Continuous SVG Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 z-0 px-[50vw]">
           <svg className="w-full h-full" preserveAspectRatio="none">
             <line x1="0" y1="50%" x2="100%" y2="50%" className="stroke-slate-200" strokeWidth="2" />
             <line 
                ref={lineRef}
                x1="0" y1="50%" x2="100%" y2="50%" 
                className="stroke-indigo-500" 
                strokeWidth="2" 
                strokeLinecap="round"
                pathLength="1" 
                strokeDasharray="1" 
                strokeDashoffset="1" 
                style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.4))" }}
             />
           </svg>
        </div>

        {/* The Individual Panels */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isFirst = index === 0;

          return (
            <div 
              key={step.id} 
              ref={(el) => (panelsRef.current[index] = el)}
              className="relative w-[100vw] h-full flex flex-col items-center justify-center px-6 md:px-20"
            >
              
              {/* Outer Shell Wrapper (Double Bezel) */}
              <div className={`step-card relative w-full max-w-lg p-2 rounded-[2.5rem] bg-white/60 border border-slate-200/60 backdrop-blur-xl z-10 shadow-xl ${isFirst ? '' : 'scale-90 opacity-20 translate-y-12'}`}>
                
                {/* Connecting Node/Bubble */}
                <div className={`step-bubble absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg z-20 transition-colors ${isFirst ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 text-indigo-500 border-slate-200'}`}>
                  <Icon size={24} strokeWidth={2} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-slate-700">
                    {step.id}
                  </div>
                </div>

                {/* Inner Core */}
                <div className="bg-white rounded-[calc(2.5rem-0.5rem)] border border-slate-200 p-8 md:p-12 text-center shadow-sm">
                  <h3 className="text-2xl md:text-3xl font-medium text-slate-900 mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-lg text-slate-500 leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
};

export default HowItWorks;