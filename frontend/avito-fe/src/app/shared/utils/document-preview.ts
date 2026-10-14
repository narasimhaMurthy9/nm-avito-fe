/**
 * Preview helpers for generated PDFs.
 *
 * The backend ships previews as base64 inside JSON. A generated MBL is a full-page scan, so
 * that payload is over a megabyte, and binding it to `<object data="data:application/pdf;
 * base64,...">` leaves the browser showing an empty frame: the built-in PDF viewer will not
 * load a PDF from a `data:` URL, and those URLs are also length-capped. Decoding the same
 * bytes into a blob and using an object URL avoids both problems.
 */

/** Decode a base64 PDF payload into a `blob:` URL the browser can render. */
export function base64PdfToObjectUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

/** Release an object URL created by `base64PdfToObjectUrl`; a no-op for any other URL. */
export function revokeObjectUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
