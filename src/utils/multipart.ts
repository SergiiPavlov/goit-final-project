type ParsedMultipartFile = {
  fieldName: string;
  filename: string | null;
  contentType: string | null;
  data: Buffer;
};

function findBoundary(contentType: string): string | null {
  // Example: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
  const match = /boundary=([^;]+)/i.exec(contentType);
  if (!match) return null;
  return match[1].trim().replace(/^"|"$/g, '');
}

function trimCrlf(buf: Buffer): Buffer {
  // Remove leading CRLF and trailing CRLF if present
  let start = 0;
  let end = buf.length;
  if (buf.slice(0, 2).toString('latin1') === '\r\n') start = 2;
  if (buf.slice(end - 2, end).toString('latin1') === '\r\n') end -= 2;
  return buf.slice(start, end);
}

export function parseMultipartSingleFile(opts: {
  contentType: string;
  body: Buffer;
  fieldName: string;
}): ParsedMultipartFile | null {
  const boundaryToken = findBoundary(opts.contentType);
  if (!boundaryToken) return null;
  const boundary = Buffer.from(`--${boundaryToken}`, 'latin1');
  const endBoundary = Buffer.from(`--${boundaryToken}--`, 'latin1');

  const body = opts.body;
  if (!body || body.length === 0) return null;

  // Split by boundary markers.
  const parts: Buffer[] = [];
  let cursor = 0;
  while (cursor < body.length) {
    let idx = body.indexOf(boundary, cursor);
    if (idx === -1) break;
    idx += boundary.length;
    // After boundary there may be -- (end) or CRLF
    let next = body.indexOf(boundary, idx);
    let nextEnd = body.indexOf(endBoundary, idx);
    if (nextEnd !== -1 && (next === -1 || nextEnd < next)) {
      next = nextEnd;
    }
    if (next === -1) break;
    const part = body.slice(idx, next);
    parts.push(part);
    cursor = next;
  }

  for (const rawPart of parts) {
    const part = trimCrlf(rawPart);
    if (part.length === 0) continue;

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n', 'latin1'));
    if (headerEnd === -1) continue;
    const headerBuf = part.slice(0, headerEnd);
    const contentBuf = part.slice(headerEnd + 4);

    const headerText = headerBuf.toString('latin1');
    const disp = /content-disposition:\s*form-data;([^\r\n]+)/i.exec(headerText);
    if (!disp) continue;
    const nameMatch = /name="([^"]+)"/i.exec(disp[1]);
    const filenameMatch = /filename="([^"]*)"/i.exec(disp[1]);
    const fieldName = nameMatch?.[1];
    if (!fieldName || fieldName !== opts.fieldName) continue;

    const ctMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    const contentType = ctMatch ? ctMatch[1].trim() : null;
    const filename = filenameMatch ? filenameMatch[1] : null;

    // Content may end with CRLF, trim it.
    const data = trimCrlf(contentBuf);
    return { fieldName, filename, contentType, data };
  }

  return null;
}
