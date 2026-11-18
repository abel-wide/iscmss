'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ተጠቃሚው ሎጊን ካደረገ ወደ ሮሉ እንዲሄድ፣ ካልሆነ ወደ ሎጊን ገጽ
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'TEACHER') router.push('/teacher');
        else if (user.role === 'PARENT') router.push('/parent');
        else if (user.role === 'ADMIN') router.push('/admin');
        else router.push('/login');
      } catch {
        // JSON መበላሸት ካጋጠመ ወደ ሎጊን መላክ
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500 animate-pulse">Redirecting to login...</p>
    </div>
  );
}