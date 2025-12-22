"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import Image from 'next/image';
import { motion, Variants } from "framer-motion";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const Aurora = dynamic(() => import("@/components/Aurora"));
const PulsingBorderShader = dynamic(() => import("@/components/PulsingBorderShader"));
const MonitorSelection = dynamic(() => import('@/components/home/MonitorSelection'));
const Features = dynamic(() => import('@/components/home/Features'));
const Footer = dynamic(() => import('@/components/home/Footer'));

export default function Home() {
  const router = useRouter();
  const monitorCardsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate monitor cards on scroll
    gsap.fromTo(
      ".monitor-card",
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: monitorCardsRef.current,
          start: "top 80%",
        },
      }
    );

    // Animate features list on scroll
    gsap.fromTo(
      ".feature-item",
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 75%",
        },
      }
    );

    // Parallax lines animation
    const lines = gsap.utils.toArray('.parallax-line');
    lines.forEach((line) => {
      gsap.to(line as gsap.TweenTarget, {
        yPercent: gsap.utils.random(-150, -50),
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  }, []);

  const FADE_UP_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } },
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-900 text-gray-300 overflow-hidden">
      <Aurora colorStops={["#0F172A", "#1E40AF", "#64748B"]} />

      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 z-0 opacity-5 pointer-events-none">
        <Image
          src="/images/logo/logo-qfit-mark.png"
          alt="Qfit background logo"
          width={1200}
          height={1200}
          priority
        />
      </div>
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-slate-700 bg-slate-900/80 backdrop-blur-lg"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Qfit Monitor
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/setting')}
                className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <Settings className="h-4 w-4" />
                <span>ตั้งค่า</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <div ref={heroRef} className="relative overflow-hidden bg-transparent pt-16 pb-16">
          {/* Parallax Lines */}
          <div className="parallax-line absolute -z-10 h-1 w-96 rounded-full bg-slate-700/40" style={{ top: '20%', left: '-10%', transform: 'rotate(-45deg)' }} />
          <div className="parallax-line absolute -z-10 h-0.5 w-80 rounded-full bg-sky-400/30" style={{ top: '30%', right: '-15%', transform: 'rotate(-45deg)' }} />
          <div className="parallax-line absolute -z-10 h-1 w-96 rounded-full bg-slate-700/40" style={{ bottom: '30%', left: '5%', transform: 'rotate(-45deg)' }} />
          <div className="parallax-line absolute -z-10 h-0.5 w-72 rounded-full bg-sky-400/30" style={{ bottom: '20%', right: '-5%', transform: 'rotate(-45deg)' }} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 lg:gap-8">
              <motion.div 
                initial="hidden"
                animate="show"
                viewport={{ once: true }}
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.15,
                    },
                  },
                }}
                className="relative z-10 self-center rounded-2xl border border-slate-700 bg-slate-800/30 p-8 shadow-lg shadow-black/30 backdrop-blur-xl"
              >
                <div className="sm:text-center lg:text-left">
                  <motion.p variants={FADE_UP_ANIMATION_VARIANTS} className="text-lg text-sky-400">ระบบแสดงผลหน้าจอ</motion.p>
                  <motion.h1 variants={FADE_UP_ANIMATION_VARIANTS} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                    <span className="block text-sky-400 xl:inline">
                      Qfit Monitor
                    </span>
                  </motion.h1>
                  <motion.p variants={FADE_UP_ANIMATION_VARIANTS} className="mt-3 text-base text-slate-300 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                    ระบบ Monitor หน้าจอเรียกคิวแบบเรียลไทม์ สำหรับ Aztec Service Group พร้อมการแจ้งเตือนด้วยเสียง TTS และการแสดงผลที่สวยงาม
                  </motion.p>
                  <motion.div
                    variants={FADE_UP_ANIMATION_VARIANTS}
                    className="mt-8 flex gap-4 sm:justify-center lg:justify-start"
                  >
                    <button
                      onClick={() => monitorCardsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="rounded-md bg-sky-600 px-6 py-3 text-base font-medium text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      เริ่มการสร้าง
                    </button>
                    <button
                      onClick={() => router.push('/setting')}
                      className="rounded-md border border-slate-600 px-6 py-3 text-base font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      ตั้งค่า
                    </button>
                  </motion.div>
                </div>
              </motion.div>
              <div className="relative grid place-items-center lg:py-16">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4, ease: "backOut" }} className="absolute inset-0 bg-slate-900 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }} className="col-start-1 row-start-1 z-10">
                    <PulsingBorderShader />
                  </motion.div>
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: "backOut" }} className="col-start-1 row-start-1 z-20">
                    <Image src="/images/logo/logo-qfit.png" alt="Monitor" width={300} height={300} />
                  </motion.div>
              </div>
            </div>
          </div>
        </div>

        <MonitorSelection ref={monitorCardsRef} />
        <Features ref={featuresRef} />
      </main>

      <Footer />
    </div>
  );
}
