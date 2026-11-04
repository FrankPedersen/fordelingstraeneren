import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Venstre spalte i det brede layout fra 1000 px (SPEC-bred-layout.md, bud A): bordet eller opgaven. Den står kun fast,
 * når skærmen har to spalter (reglen i styles.css), og kun når den er lavere end vinduet minus 32 px; ellers ruller
 * den med (SPEC-design-som-forsiden.md, Del 2). Under 1000 px er den usynlig (display: contents), så indholdet står
 * som før.
 */
export function BoardColumn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fast, setFast] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    // scrollHeight, fordi spalten er højst vinduet minus 32 px, mens den står fast; indholdet kan være højere.
    const check = () => setFast(el.scrollHeight + 32 <= window.innerHeight);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    // Står spalten ved sin højeste højde, ændrer den sig ikke, når indholdet vokser, så indholdet følges også.
    for (const child of Array.from(el.children)) {
      observer.observe(child);
      for (const inner of Array.from(child.children)) observer.observe(inner);
    }
    window.addEventListener('resize', check);
    check();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [children]);
  return (
    <div ref={ref} className={`wide-left${fast ? ' wide-fast' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
