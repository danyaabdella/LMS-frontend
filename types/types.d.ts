declare global {
  interface Window {
    shaka?: {
      Player: new (video: HTMLVideoElement) => any;
      [key: string]: any;
    };
  }
}


export {};