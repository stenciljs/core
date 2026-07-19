declare module "*.css?stencil" {
  const src: () => string;
  export default src;
}

declare module "*.svg?stencil" {
  const src: string;
  export default src;
}

declare module "*.txt?stencil" {
  const src: string;
  export default src;
}

declare module "*.frag?stencil" {
  const src: string;
  export default src;
}

declare module "*.vert?stencil" {
  const src: string;
  export default src;
}

declare module "*?worker" {
  export const worker: Worker;
  export const workerMsgId: string;
  export const workerName: string;
  export const workerPath: string;
}

declare module "*?format=url" {
  const src: string;
  export default src;
}

declare module "*?format=text" {
  const content: string;
  export default content;
}
