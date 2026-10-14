import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route changes start at the top — except in-page anchors (#fresh-picks),
 * which scroll to their section instead of being swallowed.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Let the new page paint first, then jump to the anchor.
      const t = setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
