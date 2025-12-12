import Link from 'next/link';
import { useRouter } from 'next/router';
import type { PropsWithChildren } from 'react';

export default function DesktopLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-white/10 px-10 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide">SWT Job Picker</h1>
          <nav className="flex gap-6 text-sm uppercase text-slate-300">
            <Link
              href="/"
              className={`hover:text-white transition-colors ${
                pathname === '/' ? 'text-white font-semibold' : ''
              }`}
            >
              选岗模拟对比
            </Link>
            <Link
              href="/docs"
              className={`hover:text-white transition-colors ${
                pathname.startsWith('/docs') ? 'text-white font-semibold' : ''
              }`}
            >
              SWT文档
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-10 py-12">{children}</main>
    </div>
  );
}

