import crypto from 'node:crypto';

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
};

function sha1(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function buildSignature(params: Record<string, string>, apiSecret: string): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join('&');
  return sha1(toSign + apiSecret);
}

export async function uploadImageToCloudinary(
  cfg: CloudinaryConfig,
  file: { data: Buffer; mime: string; publicId?: string }
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = cfg.folder || 'avatars';

  // When using a stable public_id (e.g. user_<uuid>) to overwrite avatars, Cloudinary's CDN
  // may briefly serve cached content. We explicitly enable overwrite + invalidation and
  // treat any post-upload reachability checks as best-effort (never fatal).
  const overwrite = 'true';
  const invalidate = 'true';

  const paramsToSign: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
    overwrite,
    invalidate,
  };
  if (file.publicId) paramsToSign.public_id = file.publicId;

  const signature = buildSignature(paramsToSign, cfg.apiSecret);

  const b64 = file.data.toString('base64');
  const body = new URLSearchParams({
    file: `data:${file.mime};base64,${b64}`,
    api_key: cfg.apiKey,
    timestamp: String(timestamp),
    folder,
    overwrite,
    invalidate,
    signature,
    ...(file.publicId ? { public_id: file.publicId } : {}),
  });

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  type CloudinaryResponse = {
    secure_url?: string;
    url?: string;
    public_id?: string;
    bytes?: number;
    width?: number;
    height?: number;
    format?: string;
    error?: { message?: string };
  };

  const json = (await res.json()) as CloudinaryResponse;
  if (!res.ok) {
    const msg = typeof json?.error?.message === 'string' ? json.error.message : 'Cloudinary upload failed';
    throw new Error(msg);
  }

  const secureUrl = json.secure_url ?? json.url;
  if (!secureUrl || !json.public_id || typeof json.bytes !== 'number') {
    throw new Error('Cloudinary response missing required fields');
  }

  // Best-effort "ping" to reduce the chance the caller immediately hits a stale/404 cached URL.
  // Never throw here: a transient CDN delay should not turn a successful upload into HTTP 500.
  // We add a cache-busting query param for the ping only.
  try {
    const pingUrl = `${secureUrl}${secureUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    for (let i = 0; i < 6; i++) {
      const ok = await fetch(pingUrl, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  } catch {
    // ignore
  }

  return {
    url: secureUrl,
    publicId: json.public_id,
    bytes: json.bytes,
    width: json.width,
    height: json.height,
    format: json.format,
  };
}
