// src/utils/setCanvasPreview.js
import { Crop } from 'react-image-crop';

// This function is adapted from react-image-crop examples.
// It draws the cropped portion of the image onto a canvas.
export function setCanvasPreview(
  image, // HTMLImageElement
  canvas, // HTMLCanvasElement
  crop // Crop object
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelRatio = window.devicePixelRatio;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Set the canvas dimensions to match the cropped area's pixel size,
  // accounting for device pixel ratio for sharper images.
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  // Scale the context to account for device pixel ratio
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high'; // Ensure high quality for the drawn image

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  // Translate the canvas to the top-left corner of the cropped area
  ctx.translate(-cropX, -cropY);

  // Draw the image
  ctx.drawImage(
    image,
    0, // sx (source x)
    0, // sy (source y)
    image.naturalWidth, // sWidth (source width)
    image.naturalHeight, // sHeight (source height)
    0, // dx (destination x)
    0, // dy (destination y)
    image.naturalWidth, // dWidth (destination width)
    image.naturalHeight // dHeight (destination height)
  );
}