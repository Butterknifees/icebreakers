'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoomClient } from '../../components/game/RoomClient';
import { Loader2 } from 'lucide-react';

function RoomPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  return <RoomClient roomCode={code} />;
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <RoomPageContent />
    </Suspense>
  );
}
