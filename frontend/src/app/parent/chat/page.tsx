'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
      <div className="animate-pulse">Opening School Communication Center...</div>
    </div>
  );
}
