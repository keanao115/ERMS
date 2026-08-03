'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getAuthToken, getAuthUser, verifyServerInstance } from '@/lib/api';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function checkAuthSession() {
      const token = getAuthToken();
      const user = getAuthUser();

      if (!token || !user) {
        if (isSubscribed) {
          setAuthorized(false);
          router.replace('/login');
        }
        return;
      }

      // Verify that backend server instance has not restarted
      const isInstanceValid = await verifyServerInstance();
      if (!isInstanceValid) {
        if (isSubscribed) {
          setAuthorized(false);
          router.replace('/login');
        }
        return;
      }

      if (isSubscribed) {
        setAuthorized(true);
      }
    }

    checkAuthSession();

    return () => {
      isSubscribed = false;
    };
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 text-xs gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verifying Enterprise RBAC Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 ml-64 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
