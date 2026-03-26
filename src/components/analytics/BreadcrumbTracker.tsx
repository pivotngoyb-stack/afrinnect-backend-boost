// @ts-nocheck
import { useEffect } from 'react';

const MAX_BREADCRUMBS = 20;
let breadcrumbs: any[] = [];

export const addBreadcrumb = (category: string, message: string, data: any = null) => {
  breadcrumbs.push({ timestamp: new Date().toISOString(), category, message, data });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
};

export const getBreadcrumbs = () => [...breadcrumbs];

export function useBreadcrumbs() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      try {
        let target = e.target as HTMLElement;
        while (target && target !== document.body) {
          if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            const label = target.innerText || target.getAttribute('aria-label') || target.className;
            addBreadcrumb('ui.click', `Clicked ${target.tagName.toLowerCase()}`, { label: label?.substring(0, 50) });
            break;
          }
          target = target.parentElement as HTMLElement;
        }
      } catch (err) { /* silent */ }
    };
    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, []);
}
