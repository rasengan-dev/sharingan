import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Sharingan's Web Components in JSX, with their attributes.
type InkFlowAttributes = {
  colors?: string;
  background?: string;
  swirl?: string;
  'ink-fade'?: string;
  'flow-fade'?: string;
  ambient?: string;
  pointer?: string;
  calm?: string;
  detail?: 'low' | 'medium' | 'high';
  poster?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sg-ink-flow': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & InkFlowAttributes;
    }
  }
}
