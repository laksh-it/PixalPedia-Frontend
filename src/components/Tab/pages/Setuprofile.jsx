import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { setCanvasPreview } from '../../utils/canvasPreview';
import debounce from 'lodash.debounce';
import logobr from "../../Web Image/logo.png"; // Import your logo image

const ProfileSetup = () => {
  const [dpFile, setDpFile] = useState(null);
  const [dpPreview, setDpPreview] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username') || ''); // Initialize from localStorage
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHoveringDp, setIsHoveringDp] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true); // New state for initial profile check
  const [originalUsername, setOriginalUsername] = useState(localStorage.getItem('username') || ''); // Store original username

  // Crop states
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null); // This state is not directly used for rendering, consider if needed.
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');

  // Constants
  const BIO_MAX_CHARS = 200;
  const MAX_SOCIAL_LINKS = 5;
  const ASPECT_RATIO = 1; // Square aspect ratio for profile pictures

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- Initial Profile Check and Loading Screen ---
  useEffect(() => {
    const checkProfileExists = async () => {
      if (!userId) {
        setError('User not logged in. Please log in first.');
        setCheckingProfile(false); // Stop loading, show login prompt
        return;
      }

      try {
        const response = await wrapperFetch(`${backendUrl}/api/profile/exists/${userId}`);
        if (response && response.exists) {
          // Profile exists, redirect to home
          navigate('/');
        } else {
          // Profile does not exist, show setup form
          setCheckingProfile(false);
        }
      } catch (error) {
        console.error('Error checking profile existence:', error);
        setError('Failed to check profile existence. Please try again.');
        setCheckingProfile(false); // Stop loading, show error and setup page
      }
    };

    checkProfileExists();
  }, [userId, backendUrl, navigate]);

  // Debounced username availability check
// Debounced username availability check
  const checkUsernameAvailability = useCallback(
    debounce(async (username) => {
      // Only check availability if the username is different from the original one
      if (!username || username === originalUsername) {
        setUsernameAvailability(null); // Reset availability if empty or same as original
        setIsCheckingUsername(false);
        return;
      }
      setIsCheckingUsername(true);
      try {
        const response = await wrapperFetch(`${backendUrl}/check-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });

        // --- MODIFICATION START ---
        // Ensure usernameAvailability is set to a clear boolean.
        // If response.isAvailable is strictly true, then it's true.
        // Otherwise (if it's false, null, undefined, or any other value),
        // we'll consider the username not available or the response ambiguous, thus false.
        if (response && typeof response.isAvailable === 'boolean') {
          setUsernameAvailability(response.isAvailable);
        } else {
          // If the response structure is not as expected, or isAvailable is missing/not boolean,
          // default to false to be safe and indicate unavailability or an issue.
          console.warn('Unexpected response or missing isAvailable boolean for username check:', response);
          setUsernameAvailability(false);
        }
        // --- MODIFICATION END ---

      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability(false); // Assume not available on error
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [backendUrl, originalUsername] // Add originalUsername to dependencies
  );

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    // Only trigger availability check if the username has changed from the original
    if (value !== originalUsername) {
      checkUsernameAvailability(value);
    } else {
      setUsernameAvailability(true); // If it's the original username, it's considered available
      setIsCheckingUsername(false);
    }
  };

  // Image handling
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowCropModal(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setShowCropModal(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Effect to create and revoke object URL for image preview
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

  // Cropping logic
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
        setDpFile(blob);
        setDpPreview(URL.createObjectURL(blob));
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

  const handleRemoveDp = () => {
    setDpFile(null);
    setDpPreview('');
    setCroppedImageBlob(null);
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= BIO_MAX_CHARS) {
      setBio(value);
    }
  };

  const handleSocialLinksChange = (e) => {
    const value = e.target.value;
    const linksArray = value.split(',').map(link => link.trim()).filter(link => link !== '');

    if (linksArray.length <= MAX_SOCIAL_LINKS) {
      setSocialLinks(value);
    } else {
      const truncatedLinks = linksArray.slice(0, MAX_SOCIAL_LINKS).join(', ');
      setSocialLinks(truncatedLinks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!userId) {
      setError('User not logged in. Please log in first.');
      return;
    }

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!username.trim()) {
      setError('Please provide a username.');
      return;
    }

    // Check username availability unless it's the original username
    if (username.trim() !== originalUsername && usernameAvailability !== true) {
      setError('Please choose an available username.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', name.trim());
      formData.append('username', username.trim()); // Send current username value

      if (bio.trim()) {
        formData.append('bio', bio.trim());
      }

      if (socialLinks.trim()) {
        formData.append('social_links', socialLinks.trim());
      }

      if (dpFile) {
        formData.append('dp', dpFile, 'profile.jpg');
      }

      const response = await wrapperFetch(`${backendUrl}/api/profile/add`, {
        method: 'POST',
        body: formData,
      });

      if (response && response.message) {
        setSuccessMessage('Profile created successfully!');
        // Update localStorage with the potentially new username
        localStorage.setItem('username', username.trim());
        // Redirect to home after successful creation
        setTimeout(() => {
          navigate('/tablet/Home');
        }, 2000);
      } else {
        setError(response?.message || 'Failed to create profile. Please try again.');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentSocialLinkCount = socialLinks.split(',').filter(link => link.trim() !== '').length;

   if (checkingProfile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="mb-8">
          <img src={logobr} alt="Laksh Logo" className="w-40 h-40 rounded-full object-cover" />
        </div>

        <div className="mb-8">
          <p className="text-white text-lg font-medium text-center">
            Checking profile...
          </p>
        </div>

        <div className="relative w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
          <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white to-transparent sliding-bar">
            <style>{`
              @keyframes slide {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
              }
              .sliding-bar {
                animation: slide 1.5s infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view your saved wallpapers</p>
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-gray-900 text-4xl font-extrabold mb-3" style={customTextStyle}>
            Welcome! Let's Set Up Your Profile
          </h1>
          <p className="text-gray-600 text-lg" style={customTextStyle}>
            Tell us a bit about yourself to get started
          </p>
        </div>

        {/* Main Content Area - Split into two sections */}
        <div className="flex flex-col md:flex-row gap-10">
          {/* Section 1: Profile Picture - Wider and more prominent */}
          <div className="md:w-2/5 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={customTextStyle}>
              Your Avatar
            </h2>
            {dpPreview ? (
              <div className="text-center">
                <div
                  className="relative w-64 h-64 mx-auto mb-6 group rounded-full overflow-hidden shadow-lg border-4 border-blue-200 transition-all duration-300 transform hover:scale-105"
                  onMouseEnter={() => setIsHoveringDp(true)}
                  onMouseLeave={() => setIsHoveringDp(false)}
                >
                  <img
                    src={dpPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 rounded-full flex flex-col items-center justify-center transition-all duration-300
                      ${isHoveringDp ? 'bg-black bg-opacity-60' : 'bg-opacity-0'}
                      text-white cursor-default
                    `}
                  >
                    <label htmlFor="dp-upload" className="cursor-pointer mb-2">
                      <i className={`fas fa-camera text-3xl transition-opacity duration-300 ${isHoveringDp ? 'opacity-100' : 'opacity-0'}`}></i>
                      <input
                        id="dp-upload"
                        type="file"
                        accept="image/*"
                        onChange={onSelectFile}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveDp}
                      className={`px-4 py-2 bg-transparent text-white text-sm rounded-full border border-white
                        hover:bg-white hover:text-black transition-all duration-300 font-medium
                        ${isHoveringDp ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                      `}
                      style={customTextStyle}
                    >
                      Remove Picture
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 text-sm" style={customTextStyle}>
                  Hover to change or remove
                </p>
              </div>
            ) : (
              <div
                className={`w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 min-h-[300px] transition-all duration-200
                           ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label htmlFor="file-upload" className="cursor-pointer text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <i className="fas fa-image text-4xl"></i>
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2" style={customTextStyle}>
                    Add Profile Picture
                  </p>
                  <p className="text-sm text-gray-500 mb-2" style={customTextStyle}>
                    Drag & Drop or <span className="text-blue-600 font-medium">Click to Upload</span>
                  </p>
                  <p className="text-xs text-gray-400" style={customTextStyle}>
                    JPG, PNG, GIF up to 10MB (Optional)
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

          {/* Section 2: Profile Details - Slightly narrower but still prominent */}
          <div className="md:w-3/5 p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6" style={customTextStyle}>
                Your Details
              </h2>

              {/* Full Name Field */}
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John Doe"
                  style={customTextStyle}
                />
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="e.g., john_doe"
                  style={customTextStyle}
                />
                {isCheckingUsername && (
                  <p className="text-sm text-blue-500 mt-2" style={customTextStyle}>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Checking availability...
                  </p>
                )}
                {username && username !== originalUsername && usernameAvailability === true && !isCheckingUsername && (
                  <p className="text-sm text-green-600 mt-2" style={customTextStyle}>
                    <i className="fas fa-check-circle mr-1"></i>
                    Username available!
                  </p>
                )}
                {username && username !== originalUsername && usernameAvailability === false && !isCheckingUsername && (
                  <p className="text-sm text-red-600 mt-2" style={customTextStyle}>
                    <i className="fas fa-times-circle mr-1"></i>
                    Username not available
                  </p>
                )}
                {username === originalUsername && (
                  <p className="text-sm text-gray-500 mt-2" style={customTextStyle}>
                    <i className="fas fa-info-circle mr-1"></i>
                    Using your current username.
                  </p>
                )}
              </div>

              {/* Bio Field */}
              <div>
                <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  rows="3"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  value={bio}
                  onChange={handleBioChange}
                  maxLength={BIO_MAX_CHARS}
                  placeholder="Tell us a bit about yourself (e.g., your hobbies, interests)"
                  style={customTextStyle}
                ></textarea>
                <div className="flex justify-end text-gray-400 text-xs mt-1" style={customTextStyle}>
                  {bio.length} / {BIO_MAX_CHARS} characters
                </div>
              </div>

              {/* Social Links Field */}
              <div>
                <label htmlFor="socialLinks" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Social Links (Optional)
                </label>
                <input
                  type="text"
                  id="socialLinks"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., twitter.com/yourhandle, linkedin.com/in/yourprofile"
                  value={socialLinks}
                  onChange={handleSocialLinksChange}
                  style={customTextStyle}
                />
                <div className="flex justify-end text-gray-400 text-xs mt-1" style={customTextStyle}>
                  {currentSocialLinkCount} / {MAX_SOCIAL_LINKS} links
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center">
                  <i className="fas fa-exclamation-circle mr-3"></i>
                  <p className="text-sm" style={customTextStyle}>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center">
                  <i className="fas fa-check-circle mr-3"></i>
                  <p className="text-sm" style={customTextStyle}>{successMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all duration-200 transform
                          ${loading || !name.trim() || !username.trim() || (username !== originalUsername && usernameAvailability !== true)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-black hover:bg-gray-800 hover:scale-105 shadow-lg'}`}
                disabled={loading || !name.trim() || !username.trim() || (username !== originalUsername && usernameAvailability !== true)}
                style={customTextStyle}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-3"></i>
                    Creating Profile...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-user-check mr-3"></i>
                    Create My Profile
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Cropping Modal */}
        {showCropModal && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <i className="fas fa-crop-alt text-gray-600 text-xl mr-3"></i>
                  <h2 className="text-2xl font-bold text-gray-900" style={customTextStyle}>
                    Crop Your Profile Picture
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
              <div className="flex-grow p-6 overflow-y-auto">
                <p className="text-gray-600 text-center mb-6" style={customTextStyle}>
                  Adjust the crop area to create a perfect square profile picture.
                </p>
                <div className="flex justify-center items-center bg-gray-50 rounded-xl p-4 min-h-[300px]">
                  <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={ASPECT_RATIO}
                    minWidth={100}
                    minHeight={100}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Source"
                      onLoad={onImageLoad}
                      style={{ maxHeight: '70vh', maxWidth: '100%', objectFit: 'contain' }}
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
              <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCropCancel}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  style={customTextStyle}
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCropConfirm}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
        )}
      </div>

      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default ProfileSetup;