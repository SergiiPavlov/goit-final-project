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

  const paramsToSign: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };
  if (file.publicId) paramsToSign.public_id = file.publicId;

  const signature = buildSignature(paramsToSign, cfg.apiSecret);

  const b64 = file.data.toString('base64');
  const body = new URLSearchParams({
    file: `data:${file.mime};base64,${b64}`,
    api_key: cfg.apiKey,
    timestamp: String(timestamp),
    folder,
    signature,
    ...(file.publicId ? { public_id: file.publicId } : {}),
  });

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    const msg = typeof json?.error?.message === 'string' ? json.error.message : 'Cloudinary upload failed';
    throw new Error(msg);
  }

  return {
    url: json.secure_url || json.url,
    publicId: json.public_id,
    bytes: json.bytes,
    width: json.width,
    height: json.height,
    format: json.format,
  };
}
