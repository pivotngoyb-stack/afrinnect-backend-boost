import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // #root is the scroll container (html/body are position:fixed via NativeStyles)
    const root = document.getElementById("root");
    if (root) {
      root.scrollTo({ top: 0, left: 0 });
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
