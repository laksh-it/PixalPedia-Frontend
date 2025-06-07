// src/components/ImageCropper.jsx
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const ImageCropper = ({ image, onCropComplete, onCancel, maxSizeMB = 2 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea, _croppedAreaPixels) => {
    setCroppedAreaPixels(_croppedAreaPixels);
  }, []);

  const handleCrop = useCallback(async () => {
    try {
      if (!croppedAreaPixels) {
        console.error('No crop area selected');
        return;
      }
      
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, 0, maxSizeMB);
      
      // Log the final size for debugging
      console.log(`Final image size: ${(croppedImage.size / (1024 * 1024)).toFixed(2)}MB`);
      
      onCropComplete(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
      // Optionally show an error notification
    } finally {
      setIsProcessing(false);
    }
  }, [image, croppedAreaPixels, onCropComplete, maxSizeMB]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden w-11/12 max-w-lg">
        <div className="relative h-96 w-full">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1} // Square aspect ratio for profile picture
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape="round" // Make it a circle crop
            showGrid={true}
          />
        </div>
        <div className="p-4 flex flex-col items-center">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
          <div className="text-sm text-gray-600 mb-4">
            Max file size: {maxSizeMB}MB
          </div>
          <div className="flex space-x-4 w-full justify-center">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={!croppedAreaPixels || isProcessing}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Crop & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;