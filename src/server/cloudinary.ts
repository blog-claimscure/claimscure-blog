import { v2 as cloudinary } from 'cloudinary';

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return { cloudName, apiKey, apiSecret, isConfigured };
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  isCloudinary: boolean;
}

export async function uploadToCloudinaryService(
  base64OrPath: string,
  options?: { folder?: string; publicId?: string; alt?: string }
): Promise<CloudinaryUploadResult> {
  const { isConfigured } = getCloudinaryConfig();

  if (!isConfigured) {
    throw new Error(
      'Cloudinary credentials are missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in AI Studio Secrets.'
    );
  }

  const folder = options?.folder || 'claimscure_cms';

  const res = await cloudinary.uploader.upload(base64OrPath, {
    folder,
    public_id: options?.publicId,
    resource_type: 'auto',
    overwrite: true,
  });

  // Construct auto-format and auto-quality CDN URL
  const optimizedUrl = cloudinary.url(res.public_id, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
  });

  return {
    url: optimizedUrl || res.secure_url,
    publicId: res.public_id,
    width: res.width,
    height: res.height,
    format: res.format,
    bytes: res.bytes,
    isCloudinary: true,
  };
}

export async function deleteFromCloudinaryService(publicId: string): Promise<boolean> {
  const { isConfigured } = getCloudinaryConfig();
  if (!isConfigured || !publicId) return false;

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (err) {
    console.error('Error deleting Cloudinary asset:', err);
    return false;
  }
}
