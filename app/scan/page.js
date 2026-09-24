'use client';

import dynamic from 'next/dynamic';

const ScanClient = dynamic(() => import('./ScanClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#07120C] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-[#00A651]/20 border-t-[#00A651] animate-spin mb-4" />
      <p className="text-sm font-semibold text-gray-300">Loading AR Camera Engine...</p>
    </div>
  ),
});

export default function ScanPage() {
  return <ScanClient />;
}
