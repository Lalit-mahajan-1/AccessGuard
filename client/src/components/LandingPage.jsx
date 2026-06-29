import React, { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import ImpactSection from '../components/landing/ImpactSection';
import Footer from '../components/landing/Footer';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = ({ onRunAudit }) => {
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="relative w-full">
      <Navbar />
      <Hero onRunAudit={onRunAudit} />
      <Features />
      <HowItWorks />
      <ImpactSection />
      <Footer />
    </main>
  );
};

export default LandingPage;