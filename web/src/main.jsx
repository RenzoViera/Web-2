import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { GlobalErrorListener } from '@/components/errors/GlobalErrorListener';
import { AppRouter } from '@/routes/AppRouter';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontró el elemento #root');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <GlobalErrorListener />
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
);
