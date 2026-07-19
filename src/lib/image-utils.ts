/**
 * Kept — Client-Side Image Handling Utilities (§6, §8)
 *
 * Why this module exists: two real-world gotchas that will bite on day one
 * if not handled before upload.
 *   1. iPhones default to HEIC — most browsers won't render it inline.
 *   2. Raw phone photos are 4–8 MB; the free Storage tier is 1 GB.
 *      Compressing to ~200–400 KB gives a 15–20x runway extension.
 *
 * The full pipeline (prepareImageForUpload) runs HEIC conversion first,
 * then compression — since compression needs a standard format to work with.
 */

import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

/**
 * Convert HEIC to JPEG if needed.
 * iPhones default to HEIC which most browsers won't render inline.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!file.type.includes("heic")) return file;

  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return new File(
    [blob instanceof Blob ? blob : (blob as Blob[])[0]],
    file.name.replace(/\.heic$/i, ".jpg"),
    { type: "image/jpeg" },
  );
}

/**
 * Compress image for upload. Keeps the 1GB free storage tier viable.
 * Raw phone photo: 4–8MB → Compressed: 200–400KB (15–20x runway).
 */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: "image/jpeg",
  });
}

/**
 * Full pipeline: HEIC conversion → compression.
 * Use this before uploading any user-provided image.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const converted = await convertHeicToJpeg(file);
  const compressed = await compressImage(converted);
  return compressed;
}

/**
 * Get user's IANA timezone.
 * Used to default the profile timezone at signup (§9.7, §10).
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}