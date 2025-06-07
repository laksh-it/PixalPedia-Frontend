// src/utils/cropImage.js
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Smart compression function that reduces file size while maintaining quality
 * @param {HTMLCanvasElement} canvas - The canvas with the image
 * @param {number} maxSizeBytes - Maximum file size in bytes (default: 2MB)
 * @param {number} initialQuality - Starting quality (default: 0.9)
 * @returns {Promise<Blob>} - Compressed image blob
 */
async function compressCanvasToBlob(canvas, maxSizeBytes = 2 * 1024 * 1024, initialQuality = 0.9) {
  return new Promise((resolve, reject) => {
    let quality = initialQuality;
    
    const tryCompress = () => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        
        // If size is acceptable or quality is too low, return the blob
        if (blob.size <= maxSizeBytes || quality <= 0.1) {
          resolve(blob);
          return;
        }
        
        // Reduce quality and try again
        quality -= 0.1;
        tryCompress();
      }, 'image/jpeg', quality);
    };
    
    tryCompress();
  });
}

/**
 * Smart resize function that reduces dimensions if compression alone isn't enough
 * @param {HTMLCanvasElement} originalCanvas - Original canvas
 * @param {number} maxSizeBytes - Maximum file size in bytes
 * @returns {Promise<Blob>} - Resized and compressed image blob
 */
async function smartResize(originalCanvas, maxSizeBytes = 2 * 1024 * 1024) {
  const ctx = originalCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Try original size first
  let blob = await compressCanvasToBlob(originalCanvas, maxSizeBytes, 0.95);
  if (blob.size <= maxSizeBytes) {
    return blob;
  }
  
  // If still too large, progressively reduce dimensions
  const reductionFactors = [0.9, 0.8, 0.7, 0.6, 0.5];
  
  for (const factor of reductionFactors) {
    const newWidth = Math.floor(originalCanvas.width * factor);
    const newHeight = Math.floor(originalCanvas.height * factor);
    
    // Create new canvas with reduced size
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    
    if (!resizedCtx) continue;
    
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    
    // Use high-quality scaling
    resizedCtx.imageSmoothingEnabled = true;
    resizedCtx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    resizedCtx.drawImage(originalCanvas, 0, 0, newWidth, newHeight);
    
    // Try to compress the resized image
    blob = await compressCanvasToBlob(resizedCanvas, maxSizeBytes, 0.95);
    
    if (blob.size <= maxSizeBytes) {
      return blob;
    }
  }
  
  // If still too large, return the smallest version with lowest quality
  return blob;
}

/**
 * Returns the cropped image as a Blob under 2MB.
 * @param {string} imageSrc - URL of the image to crop.
 * @param {Object} pixelCrop - Object with x, y, width, height of the crop in pixels.
 * @param {number} rotation - Rotation angle in degrees (default: 0).
 * @param {number} maxSizeMB - Maximum file size in MB (default: 2).
 * @returns {Promise<Blob>} - Resolves with the cropped and compressed image as a Blob.
 */
export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, maxSizeMB = 2) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to the crop area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If there's rotation, handle it
  if (rotation !== 0) {
    const rotRad = (rotation * Math.PI) / 180;
    const { width: rotatedWidth, height: rotatedHeight } = calculateRotatedDimensions(
      pixelCrop.width,
      pixelCrop.height,
      rotation
    );

    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;

    ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-pixelCrop.width / 2, -pixelCrop.height / 2);
  }

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Smart compression to keep under specified size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return await smartResize(canvas, maxSizeBytes);
}

/**
 * Calculate dimensions after rotation
 */
function calculateRotatedDimensions(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));
    
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos
  };
}