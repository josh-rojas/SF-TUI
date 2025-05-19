import { useState, useRef, useLayoutEffect } from 'react';

type Dimensions = {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  x: number;
  y: number;
};

const defaultDims: Dimensions = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  x: 0,
  y: 0,
};

/**
 * A hook to measure the dimensions of a DOM element
 * @param deps Dependencies that should trigger a re-measure
 * @returns An array containing a ref to attach to the element and its dimensions
 */
const useMeasure = <T extends HTMLElement = HTMLDivElement>(
  deps: React.DependencyList = []
): [React.RefObject<T>, Dimensions] => {
  const [dimensions, setDimensions] = useState<Dimensions>(defaultDims);
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const measure = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      
      setDimensions({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        x: rect.x,
        y: rect.y,
      });
    };

    // Initial measurement
    measure();

    // Set up resize observer for responsive elements
    // Polyfill for ResizeObserver might be needed in some environments
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(measure);
      if (ref.current) {
        resizeObserver.observe(ref.current);
      }

      // Clean up
      return () => {
        if (ref.current) {
          resizeObserver.unobserve(ref.current);
        }
        resizeObserver.disconnect();
      };
    }
    
    // Return empty cleanup function if ResizeObserver is not available
    return () => {};
  }, [ref, ...deps]);

  return [ref, dimensions];
};

export { useMeasure };
