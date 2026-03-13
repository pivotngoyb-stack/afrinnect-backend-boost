import { useEffect } from "react";

const MAX_BREADCRUMBS = 20;
let breadcrumbs: Array<{
  timestamp: string;
  category: string;
  message: string;
  data: unknown;
}> = [];

export const addBreadcrumb = (category: string, message: string, data: unknown = null) => {
  const crumb = {
    timestamp: new Date().toISOString(),
    category,
    message,
    data,
  };

  breadcrumbs.push(crumb);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
};

export const getBreadcrumbs = () => [...breadcrumbs];

export function useBreadcrumbs() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      try {
        let target = e.target as HTMLElement | null;
        while (target && target !== document.body) {
          if (target.tagName === "BUTTON" || target.tagName === "A" || (target as any).onclick) {
            const label = target.innerText || target.ariaLabel || target.className;
            addBreadcrumb("ui.click", `Clicked ${target.tagName.toLowerCase()}`, {
              label: label.substring(0, 50),
              classes: target.className,
            });
            break;
          }
          target = target.parentElement;
        }
      } catch {
        // Silent fail
      }
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);
}
