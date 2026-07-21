'use client';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-[fadeInUp_0.3s_ease-out]">
      {children}
    </div>
  );
}