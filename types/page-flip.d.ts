/**
 * StPageFlip, said in types.
 *
 * The package ships no declarations of its own, so this is the part of it we
 * actually use rather than the whole surface — a wrong guess about a method
 * nobody calls is worse than no guess at all.
 *
 * See https://github.com/Nodlik/StPageFlip.
 */
declare module "page-flip" {
  export type FlipSettings = {
    width: number;
    height: number;
    /** "fixed" keeps the page's size; "stretch" fills what it is given. */
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    /** One page at a time where the window is narrower than it is tall. */
    usePortrait?: boolean;
    /** Is the first page a cover, standing alone rather than beside another? */
    showCover?: boolean;
    drawShadow?: boolean;
    /** Milliseconds one turn takes. */
    flippingTime?: number;
    maxShadowOpacity?: number;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    useMouseEvents?: boolean;
    disableFlipByClick?: boolean;
    clickEventForward?: boolean;
    autoSize?: boolean;
    startPage?: number;
    startZIndex?: number;
    showPageCorners?: boolean;
  };

  export type FlipEvent = { data: number | string; object: PageFlip };

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<Element> | HTMLElement[]): void;
    on(event: "flip" | "changeState" | "changeOrientation" | "init" | "update", cb: (event: FlipEvent) => void): void;
    flipNext(): void;
    flipPrev(): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    destroy(): void;
  }
}
