'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function PreviewSwapPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ไปที่ preview swap ด้วย id = 1
    router.push('/preview/swap/1');
  }, [router]);

  return <LoadingSpinner text="กำลังโหลด Preview Swap..." />;
}






