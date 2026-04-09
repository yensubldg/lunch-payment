import { createError } from "h3";

export interface NormalizedImageInput {
  base64: string;
  mimeType: string;
}

export const MAX_IMAGE_COUNT = 6;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB per image
export const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per request

function estimateBase64Bytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.ceil((base64.length * 3) / 4) - padding;
}

function invalidImageError(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: message,
  });
}

export function normalizeAndValidateImages(rawImages: unknown): NormalizedImageInput[] {
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    throw invalidImageError("Images array required");
  }

  if (rawImages.length > MAX_IMAGE_COUNT) {
    throw invalidImageError(`Maximum ${MAX_IMAGE_COUNT} images are allowed`);
  }

  let totalBytes = 0;

  return rawImages.map((rawImage, index) => {
    if (!rawImage || typeof rawImage !== "object") {
      throw invalidImageError(`Invalid image payload at index ${index}`);
    }

    const image = rawImage as { base64?: unknown; mimeType?: unknown };

    if (typeof image.base64 !== "string" || !image.base64.trim()) {
      throw invalidImageError(`Invalid base64 image at index ${index}`);
    }

    const base64 = image.base64.trim().replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      throw invalidImageError(`Invalid base64 characters at index ${index}`);
    }

    const imageBytes = estimateBase64Bytes(base64);
    if (imageBytes > MAX_IMAGE_BYTES) {
      throw invalidImageError(
        `Image ${index + 1} is too large. Max ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)}MB per image`
      );
    }

    totalBytes += imageBytes;
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      throw invalidImageError(
        `Total upload is too large. Max ${Math.floor(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB per request`
      );
    }

    const mimeType =
      typeof image.mimeType === "string" && image.mimeType.startsWith("image/")
        ? image.mimeType
        : "image/jpeg";

    return { base64, mimeType };
  });
}
