'use client';

import { useEffect, useState } from 'react';
import { getPreviewPanelMode, isTouchFirstViewport, type PreviewPanelMode } from '@/lib/mobile-viewport';

type MobileViewportState = {
  touchFirst: boolean;
  previewPanelMode: PreviewPanelMode;
};

function readViewportState(): MobileViewportState {
  if (typeof window === 'undefined') {
    return {
      touchFirst: false,
      previewPanelMode: 'sidebar',
    };
  }

  const mediaQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: hover) and (pointer: fine)')
    : null;
  const canHover = mediaQuery ? mediaQuery.matches : true;
  const viewportWidth = window.innerWidth;

  return {
    touchFirst: isTouchFirstViewport(viewportWidth, canHover),
    previewPanelMode: getPreviewPanelMode(viewportWidth, canHover),
  };
}

export function useMobileViewportState() {
  const [state, setState] = useState<MobileViewportState>(() => readViewportState());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: hover) and (pointer: fine)')
      : null;

    const sync = () => {
      setState(readViewportState());
    };

    sync();
    window.addEventListener('resize', sync);

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', sync);
      } else {
        mediaQuery.addListener(sync);
      }
    }

    return () => {
      window.removeEventListener('resize', sync);

      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', sync);
        } else {
          mediaQuery.removeListener(sync);
        }
      }
    };
  }, []);

  return state;
}
