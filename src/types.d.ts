declare module 'draco3d';
declare module '@react-three/fiber';
declare module '@react-spring/three';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    AudioContext: typeof AudioContext;
  }
  class OffscreenCanvas {
    constructor(width: number, height: number);
    getContext(contextType: string, options?: unknown): RenderingContext | null;
    transferToImageBitmap(): ImageBitmap;
  }
}