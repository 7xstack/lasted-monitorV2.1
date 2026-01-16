"use client";

import { Monitor, Rows, AlertTriangle, ArrowRight, Columns } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React from "react";

const monitorConfigs = [
  {
    key: "single",
    title: "Single Monitor",
    description: "จอคอลัมน์เดียว เหมาะสำหรับการติดตั้งจุดบริการแบบ Standalone",
    href: "/single/1",
    icon: <Monitor className="h-8 w-8 text-sky-400" />,
  },
  {
    key: "duo",
    title: "Duo Monitor",
    description: "แยกข้อมูลเป็นสองฝั่ง เหมาะกับพื้นที่กลางห้องรอ",
    href: "/duo/1",
    icon: <Rows className="h-8 w-8 text-sky-400" />,
  },
  {
    key: "er",
    title: "ER Monitor",
    description: "รองรับสถานี ER-A ถึง ER-E พร้อมแจ้งเตือนพิเศษ",
    href: "/er/1",
    icon: <AlertTriangle className="h-8 w-8 text-sky-400" />,
  },
  {
    key: "triple",
    title: "Triple Monitor",
    description: "แสดงข้อมูลสามคอลัมน์ แยกตามประเภทผู้รับบริการ",
    href: "/triple/1",
    icon: <Columns className="h-8 w-8 text-sky-400" />,
  },
];

const MonitorSelection = React.forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            เลือกประเภทหน้าจอ
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            เลือกระบบแสดงผลให้เหมาะกับพื้นที่และการใช้งานของคุณ
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {monitorConfigs.map((monitor) => (
            <motion.div
              key={monitor.key}
              className="monitor-card opacity-0" // GSAP will animate this
              whileHover={{ y: -8, scale: 1.03 }}
            >
              <Link
                href={monitor.href}
                className="group block h-full rounded-2xl border border-slate-700 bg-slate-800/30 p-8 shadow-lg shadow-black/30 transition-all duration-300 hover:border-sky-500 hover:shadow-2xl hover:shadow-sky-500/20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                    {monitor.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{monitor.title}</h3>
                </div>
                <p className="mt-4 text-slate-300">{monitor.description}</p>
                <div className="mt-6 flex items-center gap-2 font-semibold text-sky-400">
                  <span>เปิด Monitor</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

MonitorSelection.displayName = "MonitorSelection";

export default MonitorSelection;
