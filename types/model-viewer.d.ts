// types/model-viewer.d.ts

import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'auto-rotate-delay'?: string | number;
        'shadow-intensity'?: string | number;
        exposure?: string | number;
        'environment-image'?: string;
        'ios-src'?: string;
      };
    }
  }
}

export {};
