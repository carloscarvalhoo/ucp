'use client';
import { useEffect } from 'react';
export function SiteRuntime({ scripts }: { scripts: { src?: string; text: string }[] }) {
  useEffect(() => {
    let cancelled = false;
    const added: HTMLScriptElement[] = [];
    async function start() {
      for (const item of scripts) {
        if (cancelled) break;
        await new Promise<void>((resolve) => {
          const element = document.createElement('script');
          added.push(element);
          if (item.src) {
            element.src = item.src;
            element.onload = () => resolve();
            element.onerror = () => resolve();
          } else {
            element.textContent = item.text;
          }
          document.body.append(element);
          if (!item.src) resolve();
        });
      }
    }
    const timer = setTimeout(() => void start(), 0);
    return () => {
      clearTimeout(timer);
      cancelled = true;
      for (const element of added) element.remove();
    };
  }, [scripts]);
  return null;
}
