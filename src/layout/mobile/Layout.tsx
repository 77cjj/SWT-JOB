import type { PropsWithChildren } from 'react';

export default function MobileLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-semibold">SWT Job Picker · Mobile</h1>
        <button className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wider">
          Menu
        </button>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-white/10 px-4 py-3 text-xs text-neutral-400">
        © {new Date().getFullYear()} SWT · All rights reserved
      </footer>
    </div>
  );
}

