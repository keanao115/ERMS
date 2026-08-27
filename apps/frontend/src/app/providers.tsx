'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { purgeLegacyLocalStorageAuth } from '@/lib/api';
import { LocaleProvider } from '@/contexts/LocaleContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  useEffect(() => {
    purgeLegacyLocalStorageAuth();
  }, []);

  return (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LocaleProvider>
  );
}

