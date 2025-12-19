"use client";

import React from "react";

const features = [
    {
      name: 'Real-time Data Updates',
      description: 'อัปเดตข้อมูลคิวและสถานะผู้ป่วยแบบเรียลไทม์ ลดความหน่วงช้า',
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'TTS Voice Announcements',
      description: 'ระบบเสียงประกาศเรียกคิวอัตโนมัติ (Text-to-Speech) ที่ชัดเจนและเป็นธรรมชาติ',
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C13.18 7.061 14.1 7.5 15 7.5c.825 0 1.573-.26 2.25-.685m-3 3.585l.75-.75m-.75.75l-.75-.75m3 .75l.75-.75m-.75.75l-.75-.75M3 11.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 11.25V9m3.334 2.364C13.18 13.061 14.1 13.5 15 13.5c.825 0 1.573-.26 2.25-.685m-3 3.585l.75-.75m-.75.75l-.75-.75m3 .75l.75-.75m-.75.75l-.75-.75" />
        </svg>
      ),
    },
    {
      name: 'Multi-Screen Support',
      description: 'รองรับการแสดงผลหลากหลายรูปแบบ ทั้งแบบจอเดี่ยว, สองจอ, และจอสำหรับห้องฉุกเฉิน',
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 21h16.5M16.5 3.75h.008v.008h-.008V3.75z" />
        </svg>
      ),
    },
    {
      name: 'Easy Configuration',
      description: 'หน้าจอตั้งค่าที่ใช้งานง่าย สามารถปรับแต่งการแสดงผลและเสียงได้ตามต้องการ',
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m-3.182 0l-3.182-3.182a8.25 8.25 0 00-11.667 0l-3.182 3.182" />
        </svg>
      ),
    },
];

const Features = React.forwardRef<HTMLDivElement>((props, ref) => {
    return (
        <div ref={ref} className="bg-slate-950 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <p className="text-base font-semibold leading-7 text-sky-400">System Capabilities</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        ความสามารถของระบบ
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-slate-300">
                        ระบบ Qfit Monitor ถูกออกแบบมาเพื่อตอบสนองความต้องการของโรงพยาบาลและสถานพยาบาลสมัยใหม่
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16 feature-item opacity-0">
                                <dt className="text-base font-semibold leading-7 text-white">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600">
                                        {feature.icon}
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-300">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
});

Features.displayName = "Features";

export default Features;
