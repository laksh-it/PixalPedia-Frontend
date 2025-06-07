import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob'; // Changed path for mobile layout
import wrapperFetch from '../../Middleware/wrapperFetch';

// Import react-image-crop components and styles
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { setCanvasPreview } from '../../utils/canvasPreview';

const TITLE_MAX_CHARS = 100;
const DESCRIPTION_MAX_CHARS = 500;
const MAX_HASHTAGS = 15;
const ASPECT_RATIO = 9 / 16; // Smartphone aspect ratio

const Create = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Crop states
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- Image Handling ---

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Clear previous error messages related to file selection
      setError('');
      setSelectedFile(e.target.files[0]);
      setShowCropModal(true); // Open crop modal immediately
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Clear previous error messages related to file selection
      setError('');
      setSelectedFile(e.dataTransfer.files[0]);
      setShowCropModal(true); // Open crop modal immediately
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  useEffect(() => {
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(fileUrl);
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    } else {
      setPreviewUrl('');
    }
  }, [selectedFile]);

  // --- Cropping Logic ---

  function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  }, []);

  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      setCanvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop
      );
    }
  }, [completedCrop]);

  const onCropConfirm = () => {
    if (!completedCrop || !previewCanvasRef.current) {
      setError('Please select a crop area.');
      return;
    }

    previewCanvasRef.current.toBlob((blob) => {
      if (blob) {
        setCroppedImageBlob(blob);
        setShowCropModal(false);
        setError('');
      } else {
        setError('Failed to create cropped image.');
      }
    }, 'image/jpeg', 0.95);
  };

  const onCropCancel = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedImageBlob(null);
    setShowCropModal(false);
    setError('');
  };

  // --- Form Field Handlers ---

  const handleTitleChange = (e) => {
    const text = e.target.value;
    if (text.length <= TITLE_MAX_CHARS) {
      setTitle(text);
    }
  };

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= DESCRIPTION_MAX_CHARS) {
      setDescription(text);
    }
  };

  const handleHashtagsChange = (e) => {
    setHashtagsInput(e.target.value);
  };

  const getHashtagsArray = () => {
    return hashtagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
      .slice(0, MAX_HASHTAGS);
  };

  // --- Submission Logic ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!userId) {
      setError('User not logged in. Please log in to upload.');
      return;
    }

    if (!croppedImageBlob) {
      setError('Please select and crop an image first.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for your wallpaper.');
      return;
    }

    const hashtags = getHashtagsArray();

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', croppedImageBlob, selectedFile.name);
      formData.append('user_id', userId);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      hashtags.forEach(tag => {
        formData.append('hashtags[]', tag);
      });

      const response = await wrapperFetch(`${backendUrl}/api/wallpaper/add`, {
        method: 'POST',
        body: formData,
      });

      if (response && response.wallpaper) {
        setSuccessMessage('Wallpaper uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl('');
        setTitle('');
        setDescription('');
        setHashtagsInput('');
        setCroppedImageBlob(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
      } else {
        setError(response?.message || 'Failed to upload wallpaper. Please try again.');
      }
    } catch (err) {
      console.error('Error uploading wallpaper:', err);
      setError('An unexpected error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  // Handle sidebar item click for navigation (now bottom nav for mobile)
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }
    navigate(path);
  };

  // Handle user profile click from header (now from MainLayoutMob internal handling)
  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/mobile/profile'); // Updated path for mobile
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to create wallpapers</p>
          <a
            href="/"
            className="bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
            style={customTextStyle}
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username} // Still pass username if MainLayout uses it for display
      onUserProfileClick={handleUserProfileClick} // Still pass if MainLayout can use it
    >
      {/* This main wrapper div makes the entire content area a grayish background */}
      <div className="bg-gray-200 min-h-screen">
        {/* Header Section - Already covered by the gray background */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold md:text-4xl" style={customTextStyle}>
            Create New Wallpaper
          </h1>
        </div>

        {/* Main Content - This flex container and its children will sit on the gray background */}
        <div className="flex flex-col gap-6 px-4 pb-4">
          {/* Left Column: Image Upload & Preview - This remains white */}
          <div className="w-full bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <i className="fas fa-image text-gray-600 text-xl mr-3"></i>
              <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                Upload Image
              </h2>
            </div>

            {croppedImageBlob ? (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="relative bg-gray-50 rounded-xl shadow-md p-2 mb-4">
                  <img
                    src={URL.createObjectURL(croppedImageBlob)}
                    alt="Cropped Preview"
                    className="max-w-full max-h-[350px] object-contain rounded-lg"
                    onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  style={customTextStyle}
                >
                  <i className="fas fa-crop-alt mr-2"></i>
                  Re-crop Image
                </button>
              </div>
            ) : (
              <div
                className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 min-h-[300px] transition-all duration-200
                           ${isDragOver ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label htmlFor="file-upload" className="cursor-pointer text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-cloud-upload-alt text-gray-500 text-3xl"></i>
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2" style={customTextStyle}>
                    Drag & Drop or Tap to Upload
                  </p>
                  <p className="text-sm text-gray-500 mb-2" style={customTextStyle}>
                    Image will be cropped to 9:16 aspect ratio
                  </p>
                  <p className="text-xs text-gray-400" style={customTextStyle}>
                    Supports JPG, PNG, GIF up to 10MB
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Form Fields - This remains white */}
          <div className="w-full bg-white rounded-2xl shadow-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center mb-6">
                <i className="fas fa-edit text-gray-600 text-xl mr-3"></i>
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                  Wallpaper Details
                </h2>
              </div>

              {/* Title Field */}
              <div className="mb-6">
                <label htmlFor="title" className="flex items-center text-gray-700 text-sm font-bold mb-3" style={customTextStyle}>
                  <i className="fas fa-heading text-gray-500 mr-2"></i>
                  Wallpaper Title <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={title}
                  onChange={handleTitleChange}
                  maxLength={TITLE_MAX_CHARS}
                  placeholder="Give your wallpaper an awesome title..."
                  style={customTextStyle}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500 text-xs" style={customTextStyle}>
                    Make it catchy and descriptive
                  </p>
                  <p className="text-gray-400 text-xs" style={customTextStyle}>
                    {title.length} / {TITLE_MAX_CHARS}
                  </p>
                </div>
              </div>

              {/* Description Field */}
              <div className="mb-6">
                <label htmlFor="description" className="flex items-center text-gray-700 text-sm font-bold mb-3" style={customTextStyle}>
                  <i className="fas fa-align-left text-gray-500 mr-2"></i>
                  Description
                </label>
                <textarea
                  id="description"
                  rows="4"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={DESCRIPTION_MAX_CHARS}
                  placeholder="Tell us about your wallpaper... What inspired you to create it?"
                  style={customTextStyle}
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500 text-xs" style={customTextStyle}>
                    Optional but recommended
                  </p>
                  <p className="text-gray-400 text-xs" style={customTextStyle}>
                    {description.length} / {DESCRIPTION_MAX_CHARS}
                  </p>
                </div>
              </div>

              {/* Hashtags Field */}
              <div className="mb-8">
                <label htmlFor="hashtags" className="flex items-center text-gray-700 text-sm font-bold mb-3" style={customTextStyle}>
                  <i className="fas fa-hashtag text-gray-500 mr-2"></i>
                  Hashtags
                </label>
                <input
                  type="text"
                  id="hashtags"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="abstract, nature, minimalist, dark, neon..."
                  value={hashtagsInput}
                  onChange={handleHashtagsChange}
                  style={customTextStyle}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500 text-xs" style={customTextStyle}>
                    Separate with commas to help others find your wallpaper
                  </p>
                  <p className="text-gray-400 text-xs" style={customTextStyle}>
                    {getHashtagsArray().length} / {MAX_HASHTAGS}
                  </p>
                </div>
                {getHashtagsArray().length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {getHashtagsArray().map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        style={customTextStyle}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Error and Success Messages */}
              {(error || successMessage) && (
                <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center">
                    <i className={`${error ? 'fas fa-exclamation-circle text-red-500' : 'fas fa-check-circle text-green-500'} mr-3`}></i>
                    <p className={`${error ? 'text-red-700' : 'text-green-700'}`} style={customTextStyle}>{error || successMessage}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all duration-200 transform
                          ${loading || !croppedImageBlob || !title.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-black hover:bg-gray-800 hover:scale-105 shadow-lg'}`}
                disabled={loading || !croppedImageBlob || !title.trim()}
                style={customTextStyle}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-3"></i>
                    Uploading Your Masterpiece...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-rocket mr-3"></i>
                    Share Your Wallpaper
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div> {/* End of bg-gray-200 wrapper */}

      {/* Cropping Modal - This remains outside the gray wrapper as it's an overlay */}
      {showCropModal && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden sm:max-w-md md:max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center">
                <i className="fas fa-crop-alt text-gray-600 text-xl mr-3"></i>
                <h2 className="text-xl sm:text-2xl font-bold text-black" style={customTextStyle}>
                  Crop Your Image
                </h2>
              </div>
              <button
                onClick={onCropCancel}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-gray-600 text-center text-sm sm:text-base mb-3 sm:mb-4" style={customTextStyle}>
                  Adjust the crop area to fit the 9:16 aspect ratio (perfect for mobile wallpapers)
                </p>
                <div className="flex justify-center items-center">
                  <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={ASPECT_RATIO}
                    minWidth={100}
                    minHeight={100 * (16 / 9)}
                    className="max-h-[60vh] sm:max-h-[70vh]"
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Source"
                      onLoad={onImageLoad}
                      style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
                      className="rounded-lg"
                    />
                  </ReactCrop>
                </div>
              </div>

              <canvas
                ref={previewCanvasRef}
                style={{
                  display: 'none',
                  border: '1px solid black',
                  objectFit: 'contain',
                  width: completedCrop?.width,
                  height: completedCrop?.height,
                }}
              />

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onCropCancel}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  style={customTextStyle}
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCropConfirm}
                  className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    !completedCrop?.width || !completedCrop?.height
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  disabled={!completedCrop?.width || !completedCrop?.height}
                  style={customTextStyle}
                >
                  <i className="fas fa-check mr-2"></i>
                  Confirm Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font Awesome (best practice: include in public/index.html to avoid duplication) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default Create;