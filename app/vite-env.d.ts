/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_CDN_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
  _tmr?: Array<Record<string, string | number>>;
}

function ym(counterId: number, goalName: string, type?: string): void;
