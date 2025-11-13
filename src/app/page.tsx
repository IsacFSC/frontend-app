'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTruckLoading } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // The middleware should handle this, but this is a fallback.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <FaTruckLoading className="animate-spin text-4xl text-blue-600" />
    </div>
  );
}
