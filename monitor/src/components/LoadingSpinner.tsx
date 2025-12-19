"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner = ({ text }: LoadingSpinnerProps) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center"
      style={{
        background: 'linear-gradient(0deg, rgba(217, 247, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)'
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative mb-4 flex items-center justify-center">
          <motion.div
            className="absolute h-48 w-48 rounded-full border-2 border-dashed border-sky-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute h-40 w-40 rounded-full border-2 border-dashed border-sky-500/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          >
            <Image
              src="/images/logo/logo-qfit.png"
              alt="Loading..."
              width={100}
              height={100}
              priority
            />
          </motion.div>
        </div>
        {text && (
          <p className="mt-12 text-xl text-sky-700 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
