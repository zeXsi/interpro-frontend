/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare namespace React {
  declare namespace JSX {
    interface IntrinsicElements {
      'vite-streaming-end': any;
    }
  }
}

interface Window {
  __INITIAL_STATE__?: {
    projects: Project[];
    faqs: State['faqs'];
    feedbacks: State['feedbacks'];
  };
}

function ym(counterId: number, goalName: string, type?:string): void;
