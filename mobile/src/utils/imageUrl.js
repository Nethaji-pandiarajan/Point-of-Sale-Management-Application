import { BASE_URL } from '../api/apiClient';

/**
 * Checks if a string is an emoji or short symbol rather than a file path or URL
 */
export function isEmoji(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  // If it looks like a path or URL, it's definitely not an emoji
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('.') || trimmed.startsWith('http')) {
    return false;
  }
  // Standard Unicode emoji range regex
  return /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(trimmed);
}

/**
 * Resolves a product image from backend to an absolute, normalized image URL.
 * Supports:
 * - Full URLs (http://... or https://...)
 * - Relative upload paths (/uploads/... or uploads/...)
 * - Relative product filenames (products/... or filename.jpg)
 * - Safe handling of Windows backslashes, duplicate slashes, null/undefined
 */
export function getProductImageUrl(rawImage) {
  if (!rawImage || typeof rawImage !== 'string') return null;

  const trimmed = rawImage.trim();
  if (!trimmed) return null;

  // If emoji or text icon, it is not a remote URL
  if (isEmoji(trimmed)) {
    return null;
  }

  // If already absolute URL, return directly
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Normalize Windows backslashes to forward slashes
  let cleanPath = trimmed.replace(/\\/g, '/');

  // Strip leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');

  // If path doesn't start with uploads/, prepend uploads/
  if (!cleanPath.startsWith('uploads/')) {
    if (cleanPath.startsWith('products/')) {
      cleanPath = `uploads/${cleanPath}`;
    } else {
      cleanPath = `uploads/products/${cleanPath}`;
    }
  }

  // Remove duplicate slashes (e.g. // or ///)
  cleanPath = cleanPath.replace(/\/{2,}/g, '/');

  // Avoid duplicated /uploads/uploads/
  cleanPath = cleanPath.replace(/^uploads\/uploads\//i, 'uploads/');

  // Strip trailing slash from BASE_URL
  const base = (BASE_URL || 'http://192.168.1.45:5000').replace(/\/+$/, '');

  return `${base}/${cleanPath}`;
}

export default getProductImageUrl;

