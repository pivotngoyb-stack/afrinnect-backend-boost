
export interface ImageSizes {
  thumbnail: File; // 200px wide, for lists/grids
  card: File;      // 600px wide, for swipe cards
  full: File;      // 1080px wide, for full-screen view
}

export interface ImageQualityReport {
  isLowQuality: boolean;
  width: number;
  height: number;
  fileSize: number;
  suggestions: string[];
}

/**
 * Compress a single image to a target max width and quality
 */
export function compressImage(file: File, maxWidth = 1080, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        // Apply slight sharpening for downscaled images
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate multiple image sizes for optimal delivery
 */
export async function generateImageSizes(file: File): Promise<ImageSizes> {
  const [thumbnail, card, full] = await Promise.all([
    compressImage(file, 200, 0.7),
    compressImage(file, 600, 0.8),
    compressImage(file, 1080, 0.85),
  ]);
  return { thumbnail, card, full };
}

/**
 * Generate a tiny blur placeholder (32px wide, very low quality)
 */
export async function generateBlurPlaceholder(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = img.height / img.width;
        canvas.width = 32;
        canvas.height = Math.round(32 * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.3));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze image quality and return suggestions (non-blocking)
 */
export function analyzeImageQuality(file: File): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const suggestions: string[] = [];
        const minDimension = 600;

        if (img.width < minDimension || img.height < minDimension) {
          suggestions.push('Higher resolution photos get more matches');
        }

        if (file.size < 30 * 1024) {
          suggestions.push('This photo may appear blurry — try a clearer one');
        }

        const ratio = img.height / img.width;
        if (ratio < 0.8 || ratio > 2.0) {
          suggestions.push('Portrait photos (4:5 ratio) look best on profile cards');
        }

        resolve({
          isLowQuality: suggestions.length > 0,
          width: img.width,
          height: img.height,
          fileSize: file.size,
          suggestions,
        });
      };
      img.onerror = () =>
        resolve({ isLowQuality: false, width: 0, height: 0, fileSize: file.size, suggestions: [] });
      img.src = e.target?.result as string;
    };
    reader.onerror = () =>
      resolve({ isLowQuality: false, width: 0, height: 0, fileSize: file.size, suggestions: [] });
    reader.readAsDataURL(file);
  });
}

/**
 * Validate an image file (type + size)
 */
export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = 15 * 1024 * 1024;
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP image');
  }
  if (file.size > maxSize) {
    throw new Error('Image must be less than 15MB');
  }
  return true;
}
