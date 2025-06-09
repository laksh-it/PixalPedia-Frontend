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
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHoveringDp, setIsHoveringDp] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [originalUsername, setOriginalUsername] = useState(localStorage.getItem('username') || '');

  // Crop states
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [showCropModal, setShowCropModal] = useState(false);
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
  const ASPECT_RATIO = 1;

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- Initial Profile Check and Loading Screen ---
  useEffect(() => {
    const checkProfileExists = async () => {
      if (!userId) {
        setError('User not logged in. Please log in first.');
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await wrapperFetch(`${backendUrl}/api/profile/exists/${userId}`);
        if (response && response.exists) {
          navigate('/'); // Assuming '/' is your desktop home page
        } else {
          setCheckingProfile(false);
        }
      } catch (error) {
        console.error('Error checking profile existence:', error);
        setError('Failed to check profile existence. Please try again.');
        setCheckingProfile(false);
      }
    };

    checkProfileExists();
  }, [userId, backendUrl, navigate]);

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(
    debounce(async (username) => {
      if (!username || username === originalUsername) {
        setUsernameAvailability(null);
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

        if (response && typeof response.isAvailable === 'boolean') {
          setUsernameAvailability(response.isAvailable);
        } else {
          console.warn('Unexpected response or missing isAvailable boolean for username check:', response);
          setUsernameAvailability(false);
        }
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [backendUrl, originalUsername]
  );

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (value.trim() !== originalUsername) {
      checkUsernameAvailability(value.trim());
    } else {
      setUsernameAvailability(true); // Original username is always considered available to the user
      setIsCheckingUsername(false);
    }
  };

  // Image handling
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowCropModal(true);
      // Reset file input value to allow re-selection of the same file
      e.target.value = '';
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
        setDpFile(blob);
        setDpPreview(URL.createObjectURL(blob));
        setShowCropModal(false);
        setError('');
      } else {
        setError('Failed to create cropped image.');
      }
    }, 'image/jpeg', 0.95); // Ensure JPEG for broader compatibility and smaller size
  };

  const onCropCancel = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setShowCropModal(false);
    setError('');
  };

  const handleRemoveDp = () => {
    setDpFile(null);
    setDpPreview('');
    setSelectedFile(null); // Clear selected file too
    setPreviewUrl(''); // Clear preview URL
    setCrop(undefined); // Reset crop state
    setCompletedCrop(undefined); // Reset completed crop state
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
      // If user types more, truncate to max allowed and set it
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

    // --- All fields required validation ---
    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    // Explicitly check username availability status
    if (username.trim() !== originalUsername && (usernameAvailability === null || usernameAvailability === false)) {
        if (isCheckingUsername) {
            setError('Please wait, checking username availability...');
        } else {
            setError('Please choose an available username.');
        }
        return;
    }
    // --- End all fields required validation ---

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', name.trim());
      formData.append('username', username.trim());

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
        localStorage.setItem('username', username.trim()); // Update localStorage with new username
        setTimeout(() => {
          navigate('/tablet/Home'); // Navigate to desktop home after setup
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
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center"> {/* Reverted to light background */}
        <div className="mb-8">
          <img src={logobr} alt="Laksh Logo" className="w-40 h-40 rounded-full object-cover" />
        </div>

        <div className="mb-8">
          <p className="text-gray-800 text-lg font-medium text-center"> {/* Adjusted text color for light bg */}
            Checking profile...
          </p>
        </div>

        <div className="relative w-64 h-1 bg-gray-300 rounded-full overflow-hidden mt-4"> {/* Adjusted progress bar color */}
          <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent sliding-bar"> {/* Adjusted gradient color */}
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
      <div className="min-h-screen bg-gray-100 text-gray-800 flex items-center justify-center px-4"> {/* Reverted to light background and text color */}
        <div className="text-center bg-white p-6 rounded-lg shadow-lg"> {/* Reverted to white container */}
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to set up your profile.</p>
          <a
            href="/mobile/login"
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors" // Adjusted button colors
            style={customTextStyle}
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center py-6 px-3 sm:px-4"> {/* Reverted to light background */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden p-5 sm:p-6"> {/* Reverted to white container */}
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-extrabold mb-2" style={customTextStyle}>
            Welcome! Set Up Your Profile
          </h1>
          <p className="text-gray-600 text-sm sm:text-base" style={customTextStyle}>
            Tell us a bit about yourself to get started
          </p>
        </div>

        {/* Section 1: Profile Picture - Now at the top */}
        <div className="flex flex-col items-center justify-center p-2 sm:p-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4" style={customTextStyle}>
            Your Avatar
          </h2>
          {dpPreview ? (
            <div className="text-center w-full">
              <div
                className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4 group rounded-full overflow-hidden shadow-lg border-2 sm:border-4 border-blue-200 transition-all duration-300 transform hover:scale-105"
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
                    <i className={`fas fa-camera text-2xl sm:text-3xl transition-opacity duration-300 ${isHoveringDp ? 'opacity-100' : 'opacity-0'}`}></i>
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
                    className={`px-3 py-1 bg-transparent text-white text-xs sm:text-sm rounded-full border border-white
                      hover:bg-white hover:text-black transition-all duration-300 font-medium
                      ${isHoveringDp ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                    `}
                    style={customTextStyle}
                  >
                    Remove Picture
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm" style={customTextStyle}>
                Hover to change or remove
              </p>
            </div>
          ) : (
            <div
              className={`w-full max-w-xs flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 min-h-[200px] transition-all duration-200
                         ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label htmlFor="file-upload" className="cursor-pointer text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600"> {/* Reverted bg and text colors */}
                  <i className="fas fa-image text-2xl sm:text-3xl"></i>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1" style={customTextStyle}>
                  Add Profile Picture
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-1" style={customTextStyle}>
                  Drag & Drop or <span className="text-blue-600 font-medium">Click to Upload</span> {/* Reverted text color */}
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

        {/* Section 2: Profile Details - Now below DP */}
        <div className="p-2 sm:p-3">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4" style={customTextStyle}>
              Your Details
            </h2>

            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>
                Full Name <span className="text-red-500">*</span> {/* Reverted text color */}
              </label>
              <input
                type="text"
                id="name"
                className="w-full py-2.5 px-3 border border-gray-300 rounded-md bg-white text-gray-700 placeholder-gray-500 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                style={customTextStyle}
              />
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>
                Username <span className="text-red-500">*</span> {/* Reverted text color */}
              </label>
              <input
                type="text"
                id="username"
                className="w-full py-2.5 px-3 border border-gray-300 rounded-md bg-white text-gray-700 placeholder-gray-500 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                value={username}
                onChange={handleUsernameChange}
                placeholder="e.g., john_doe"
                style={customTextStyle}
              />
              {isCheckingUsername && (
                <p className="text-xs text-blue-500 mt-1" style={customTextStyle}> {/* Reverted text color */}
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Checking availability...
                </p>
              )}
              {username.trim() && username.trim() !== originalUsername && usernameAvailability === true && !isCheckingUsername && (
                <p className="text-xs text-green-600 mt-1" style={customTextStyle}> {/* Reverted text color */}
                  <i className="fas fa-check-circle mr-1"></i>
                  Username available!
                </p>
              )}
              {username.trim() && username.trim() !== originalUsername && usernameAvailability === false && !isCheckingUsername && (
                <p className="text-xs text-red-600 mt-1" style={customTextStyle}> {/* Reverted text color */}
                  <i className="fas fa-times-circle mr-1"></i>
                  Username not available
                </p>
              )}
              {username.trim() === originalUsername && (
                <p className="text-xs text-gray-500 mt-1" style={customTextStyle}>
                  <i className="fas fa-info-circle mr-1"></i>
                  Using your current username.
                </p>
              )}
            </div>

            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                rows="2"
                className="w-full py-2.5 px-3 border border-gray-300 rounded-md bg-white text-gray-700 placeholder-gray-500 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm"
                value={bio}
                onChange={handleBioChange}
                maxLength={BIO_MAX_CHARS}
                placeholder="Tell us a bit about yourself"
                style={customTextStyle}
              ></textarea>
              <div className="flex justify-end text-gray-400 text-xs mt-1" style={customTextStyle}>
                {bio.length} / {BIO_MAX_CHARS} characters
              </div>
            </div>

            {/* Social Links Field */}
            <div>
              <label htmlFor="socialLinks" className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>
                Social Links (Optional)
              </label>
              <input
                type="text"
                id="socialLinks"
                className="w-full py-2.5 px-3 border border-gray-300 rounded-md bg-white text-gray-700 placeholder-gray-500 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="e.g., twitter.com/handle, linkedin.com/profile"
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
              <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex items-center text-sm"> {/* Reverted bg/border/text colors */}
                <i className="fas fa-exclamation-circle mr-2"></i>
                <p className="text-sm" style={customTextStyle}>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md flex items-center text-sm"> {/* Reverted bg/border/text colors */}
                <i className="fas fa-check-circle mr-2"></i>
                <p className="text-sm" style={customTextStyle}>{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-md font-bold text-white transition-all duration-200 transform text-base sm:text-lg
                        ${loading || !name.trim() || !username.trim() || (username.trim() !== originalUsername && (usernameAvailability === null || usernameAvailability === false))
                          ? 'bg-gray-400 cursor-not-allowed' // Reverted disabled color
                          : 'bg-black hover:bg-gray-800 shadow-md'}`} // Reverted enabled colors
              disabled={loading || !name.trim() || !username.trim() || (username.trim() !== originalUsername && (usernameAvailability === null || usernameAvailability === false))}
              style={customTextStyle}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating Profile...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-user-check mr-2"></i>
                  Create My Profile
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Cropping Modal */}
        {showCropModal && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col"> {/* Reverted to white container */}
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200"> {/* Reverted border color */}
                <div className="flex items-center">
                  <i className="fas fa-crop-alt text-gray-600 text-lg sm:text-xl mr-2"></i> {/* Reverted text color */}
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900" style={customTextStyle}>
                    Crop Your Profile Picture
                  </h2>
                </div>
                <button
                  onClick={onCropCancel}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                >
                  <i className="fas fa-times text-base sm:text-lg"></i>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-grow p-4 overflow-y-auto">
                <p className="text-gray-600 text-center text-sm mb-4" style={customTextStyle}>
                  Adjust the crop area to create a perfect square avatar.
                </p>
                <div className="flex justify-center items-center bg-gray-50 rounded-md p-3 min-h-[250px]"> {/* Reverted bg color */}
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
                      style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
                      className="rounded-md"
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
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200"> {/* Reverted border color */}
                <button
                  type="button"
                  onClick={onCropCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
                  style={customTextStyle}
                >
                  <i className="fas fa-times mr-1.5"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCropConfirm}
                  className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                    !completedCrop?.width || !completedCrop?.height
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Reverted disabled colors
                      : 'bg-black text-white hover:bg-gray-800' // Reverted enabled colors
                  }`}
                  disabled={!completedCrop?.width || !completedCrop?.height}
                  style={customTextStyle}
                >
                  <i className="fas fa-check mr-1.5"></i>
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