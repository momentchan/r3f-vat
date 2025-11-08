import { createContext, useContext, useRef, ReactNode } from 'react';
import * as THREE from 'three';

interface IntersectionContextType {
  intersectionUV: React.MutableRefObject<THREE.Vector2 | null>;
}

const IntersectionContext = createContext<IntersectionContextType | null>(null);

export function IntersectionProvider({ children }: { children: ReactNode }) {
  const intersectionUV = useRef<THREE.Vector2 | null>(null);

  return (
    <IntersectionContext.Provider value={{ intersectionUV }}>
      {children}
    </IntersectionContext.Provider>
  );
}

export function useIntersectionUV() {
  const context = useContext(IntersectionContext);
  if (!context) {
    throw new Error('useIntersectionUV must be used within IntersectionProvider');
  }
  return context.intersectionUV;
}

