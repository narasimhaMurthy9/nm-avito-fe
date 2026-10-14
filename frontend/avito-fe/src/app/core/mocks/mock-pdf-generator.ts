/**
 * Lightweight in-memory PDF generator for demo previews.
 * Generates 100% compliant PDF-1.4 documents with exact xref tables
 * that render natively in any modern browser without external dependencies.
 */

export interface PdfField {
  label: string;
  value: string;
}

export function generateDemoPdf(
  title: string,
  metadata: PdfField[],
  items: string[] = []
): { base64: string; blob: Blob } {
  let stream = 'BT\n';
  stream += '/F1 18 Tf\n50 740 Td\n(' + sanitizePdfText(title) + ') Tj\n';
  stream += '/F1 10 Tf\n0 -22 Td\n(-------------------------------------------------------------------------------------------------------------------) Tj\n';

  metadata.forEach(m => {
    const val = m.value || '--';
    stream += '0 -18 Td\n(' + sanitizePdfText(`${m.label}: ${val}`) + ') Tj\n';
  });

  if (items.length > 0) {
    stream += '0 -22 Td\n(-------------------------------------------------------------------------------------------------------------------) Tj\n';
    stream += '0 -18 Td\n(ITEM / CARGO MANIFEST:) Tj\n';
    items.slice(0, 15).forEach(item => {
      stream += '0 -16 Td\n(' + sanitizePdfText(item) + ') Tj\n';
    });
  }

  stream += '0 -30 Td\n(/F1 9 Tf [AVITO INTELLIGENT LOGISTICS DEMO - SYSTEM VERIFIED DOCUMENT]) Tj\n';
  stream += 'ET\n';

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  let offset = header.length;
  const off1 = offset; offset += obj1.length;
  const off2 = offset; offset += obj2.length;
  const off3 = offset; offset += obj3.length;
  const off4 = offset; offset += obj4.length;
  const off5 = offset; offset += obj5.length;

  const xrefOffset = offset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  [off1, off2, off3, off4, off5].forEach(o => {
    xref += String(o).padStart(10, '0') + ' 00000 n \n';
  });
  const trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
  const pdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;

  const base64 = stringToBase64(pdfString);
  const bytes = new Uint8Array(pdfString.length);
  for (let i = 0; i < pdfString.length; i++) {
    bytes[i] = pdfString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });

  return { base64, blob };
}

function sanitizePdfText(text: string): string {
  return (text || '')
    .replace(/[()\\\\]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

