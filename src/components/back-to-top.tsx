'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Floating "Back to top" button that appears after scrolling 400px.
 * Uses passive scroll listener for performance.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!show) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-md h-10 w-10"
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}