import { useEffect, forwardRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = forwardRef<HTMLDivElement>((_, ref) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) {
      root.scrollTo({ top: 0, left: 0 });
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
});

ScrollToTop.displayName = "ScrollToTop";

export default ScrollToTop;
