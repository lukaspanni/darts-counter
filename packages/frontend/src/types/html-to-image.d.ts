declare module "html-to-image" {
  export type ToImageOptions = {
    pixelRatio?: number;
  };

  export function toPng(
    node: HTMLElement,
    options?: ToImageOptions,
  ): Promise<string>;
}
