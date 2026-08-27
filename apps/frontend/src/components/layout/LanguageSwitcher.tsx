'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { LOCALE_LABELS, LOCALE_FLAGS, type SupportedLocale } from '@/locales';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = Object.entries(LOCALE_LABELS) as [SupportedLocale, string][];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch Language / 切換語言"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all
          ${open
            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
            : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
          }`}
      >
        <Languages className="w-3.5 h-3.5" />
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map(([code, label]) => (
            <button
              key={code}
              onClick={() => { setLocale(code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all text-left
                ${locale === code
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <span className="text-base">{LOCALE_FLAGS[code]}</span>
              <span>{label}</span>
              {locale === code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
