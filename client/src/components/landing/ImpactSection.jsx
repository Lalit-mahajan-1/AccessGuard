import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useInView, animate } from 'framer-motion';
import { Users, Eye, Wand2 } from 'lucide-react';

const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = "", isDecimal = false }) => {
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, duration, isInView, isDecimal]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
};

const TiltCard = ({ children, isCenter = false, variants }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      layout
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
      className={`relative w-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 flex flex-col shadow-2xl transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${
        isCenter ? 'md:scale-105 md:-translate-y-4 z-10' : 'z-0'
      }`}
    >
      <div className="bg-[#0a0a0a] rounded-[calc(2.5rem-0.5rem)] border border-white/5 p-8 flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden relative">
        <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const ImpactSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { rotateX: 45, y: 50, opacity: 0 },
    show: {
      rotateX: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section className="relative w-full py-32 bg-[#050505] overflow-hidden font-sans perspective-[2000px] flex items-center justify-center text-white" id="impact">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
        
        <div className="text-center mb-24 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            The Cost of an <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400 font-medium">Inaccessible Web</span>
          </h2>
          <p className="text-lg text-white/50 font-light leading-relaxed">
            Accessibility is unintentionally overlooked in modern dynamic applications. The gap between WCAG guidelines and real-world implementation has real consequences.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full [transform-style:preserve-3d]"
        >
          {/* CARD 1: The Human Gap */}
          <TiltCard variants={itemVariants}>
            <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              <Users className="text-blue-400 relative z-10" size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-5xl font-light tracking-tighter mb-4">
              <AnimatedCounter to={1.3} suffix="B" isDecimal={true} />
            </h3>
            <h4 className="text-lg font-medium text-white/90 mb-2 tracking-tight">People Excluded</h4>
            <p className="text-white/40 font-light leading-relaxed text-sm">
              16% of the global population lives with a significant disability. Don't let your dynamic web applications unintentionally lock them out of the digital world.
            </p>
          </TiltCard>

          {/* CARD 2: The Developer Struggle (Center / Larger) */}
          <TiltCard variants={itemVariants} isCenter={true}>
            <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Eye className="text-indigo-400 relative z-10" size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-6xl font-light text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 tracking-tighter mb-4">
              <AnimatedCounter to={100} suffix="%" />
            </h3>
            <h4 className="text-xl font-medium text-white/90 mb-2 tracking-tight">Visual Context</h4>
            <p className="text-white/40 font-light leading-relaxed text-sm">
              Developers lack intuitive tools. Stop digging through raw, confusing audit reports. We provide meaningful visual context so you know exactly where issues occur.
            </p>
          </TiltCard>

          {/* CARD 3: The AI Remediation */}
          <TiltCard variants={itemVariants}>
            <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <Wand2 className="text-emerald-400 relative z-10" size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-5xl font-light tracking-tighter mb-4">
              <AnimatedCounter to={10} suffix="x" />
            </h3>
            <h4 className="text-lg font-medium text-white/90 mb-2 tracking-tight">Faster Remediation</h4>
            <p className="text-white/40 font-light leading-relaxed text-sm">
              Bridge the gap between identification and resolution. Utilizing advanced LLMs, generate real-time, optimized code snippets instantly.
            </p>
          </TiltCard>

        </motion.div>
      </div>
    </section>
  );
};

export default ImpactSection;