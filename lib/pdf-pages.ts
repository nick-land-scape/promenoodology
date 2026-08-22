/**
 * A PDF, drawn out as pictures, in the browser.
 *
 * Shared by the flyer's own reader on the site and by the box in the back of
 * the house that shows what is attached — the same file, drawn the same way, so
 * what an editor sees is what a reader gets.
 *
 * Nothing here is loaded until somebody asks for it: PDF.js is a large thing to
 * hand a reader who only wanted the download, so it is imported at the moment a
 * page is actually wanted and not before.
 */

/** The worker, made once per window rather than once per call. */
let started = false;

async function library() {
  const pdfjs = await import("pdfjs-dist");

  if (!started) {
    /*
     * The worker, handed over as a port rather than as an address.
     *
     * PDF.js ships its worker as an ES module and, given only a `workerSrc`,
     * starts it as a classic one — the request hangs for ever and the pages
     * never arrive, with nothing said in the console. Building the Worker here
     * is the only way to be sure it is started as the kind of thing it is.
     */
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(
      new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
    started = true;
  }

  return pdfjs;
}

/**
 * Every page of it as a JPEG, or just the first where that is all that is wanted.
 *
 * `scale` is how much bigger than the page's own size to draw: two for something
 * being read, less for a thumbnail. A flyer is mostly type, and type is the
 * first thing to go soft.
 */
export async function pagesOf(
  src: string,
  { scale = 2, only = 0 }: { scale?: number; only?: number } = {},
): Promise<string[]> {
  const pdfjs = await library();
  const file = await pdfjs.getDocument({ url: src }).promise;

  const last = only > 0 ? Math.min(only, file.numPages) : file.numPages;
  const out: string[] = [];

  for (let number = 1; number <= last; number += 1) {
    const page = await file.getPage(number);
    const view = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(view.width);
    canvas.height = Math.floor(view.height);
    // A canvas that cannot give a 2D context cannot be drawn on, and asking now
    // is a clearer failure than asking inside the renderer.
    if (!canvas.getContext("2d")) continue;
    await page.render({ canvas, viewport: view }).promise;
    out.push(canvas.toDataURL("image/jpeg", 0.88));
  }

  return out;
}
