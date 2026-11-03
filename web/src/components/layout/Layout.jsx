import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PageLoader } from '@/components/ui/PageLoader';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg shadow focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
