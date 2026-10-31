import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Venstre spalte i det brede layout fra 1000 px (SPEC-bred-layout.md, bud A): bordet eller opgaven. Den står fast,
 * når der scrolles, men kun når den kan være i vinduet. Under 1000 px er den usynlig (display: contents), så
 * indholdet står som før.
 */
export function BoardColumn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fast, setFast] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => setFast(el.getBoundingClientRect().height + 32 <= window.innerHeight);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    window.addEventListener('resize', check);
    check();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);
  return (
    <div ref={ref} className={`wide-left${fast ? ' wide-fast' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
