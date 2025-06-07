import React, { useState, useEffect, useRef, useCallback } from 'react';
import wrapperFetch from '../Middleware/wrapperFetch';
import ImageCropper from './ImageCropper'; // Import the new cropper
import debounce from 'lodash.debounce'; // npm install lodash.debounce

const EditProfileModal = ({ profile, onClose, onProfileUpdated, showNotification }) => {
  const [dpFile, setDpFile] = useState(null);
  const [dpPreview, setDpPreview] = useState(profile.dp || null);
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [socialLinks, setSocialLinks] = useState(
    Array.isArray(profile.social_links) ? profile.social_links.join(', ') : (profile.social_links || '')
  );
  const [newUsername, setNewUsername] = useState(profile.username || '');
  const [usernameAvailability, setUsernameAvailability] = useState(null); // true, false, null (checking)
  const [usernameChangeAllowed, setUsernameChangeAllowed] = useState(false);
  const [nextUsernameChangeDate, setNextUsernameChangeDate] = useState(null);
  const [nextUsernameChangeDateRaw, setNextUsernameChangeDateRaw] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [originalUsername, setOriginalUsername] = useState(profile.username); // Store original username
  // New state for hover effect
  const [isHoveringDp, setIsHoveringDp] = useState(false);

  // Constants for validation
  const BIO_MAX_CHARS = 200; // Changed to character limit
  const MAX_SOCIAL_LINKS = 5;

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const loggedInUserId = localStorage.getItem('userId');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Fetch username change status on mount
  useEffect(() => {
    const fetchUsernameStatus = async () => {
      try {
        const response = await wrapperFetch(`${backendUrl}/api/fetch/username-change-status/${loggedInUserId}`);
        if (response) {
          setUsernameChangeAllowed(response.canChange);
          if (!response.canChange && response.nextChangeAvailableAt) {
            // Store the raw date string as backup
            setNextUsernameChangeDateRaw(response.nextChangeAvailableAt);
            
            // Try to parse the ISO string properly
            const dateStr = response.nextChangeAvailableAt;
            const parsedDate = new Date(dateStr);
            
            // Check if the date is valid
            if (!isNaN(parsedDate.getTime())) {
              setNextUsernameChangeDate(parsedDate);
            } else {
              console.error('Invalid date format:', dateStr);
              setNextUsernameChangeDate(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching username change status:', error);
      }
    };

    fetchUsernameStatus();
  }, [loggedInUserId, backendUrl]);

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
        setUsernameAvailability(response?.isAvailable);
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability(false); // Assume not available on error
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [originalUsername, backendUrl] // Recreate debounce if originalUsername or backendUrl changes
  );

  const handleUsernameChangeInput = (e) => {
    const value = e.target.value;
    setNewUsername(value);
    if (value !== originalUsername) {
      checkUsernameAvailability(value);
    } else {
      setUsernameAvailability(null); // Reset if back to original
      setIsCheckingUsername(false);
    }
  };

  const handleDpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result); // Set image for cropper
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    setDpFile(croppedBlob); // Store the cropped blob
    setDpPreview(URL.createObjectURL(croppedBlob)); // Set preview URL
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    // Optionally reset file input value if needed
  };

  const handleRemoveDp = () => {
    setDpFile('remove'); // Indicate removal with the 'remove' string
    setDpPreview(null);
    showNotification('Profile picture marked for removal!', 'success');
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    // Check character length directly
    if (value.length <= BIO_MAX_CHARS) {
      setBio(value);
    } else {
      // Truncate to the maximum allowed characters
      const truncatedBio = value.substring(0, BIO_MAX_CHARS);
      setBio(truncatedBio);
      showNotification(`Bio cannot exceed ${BIO_MAX_CHARS} characters.`, 'warning');
    }
  };

  const handleSocialLinksChange = (e) => {
    const value = e.target.value;
    const linksArray = value.split(',').map(link => link.trim()).filter(link => link !== '');

    if (linksArray.length <= MAX_SOCIAL_LINKS) {
      setSocialLinks(value);
    } else {
      // Truncate to the maximum allowed links
      const truncatedLinks = linksArray.slice(0, MAX_SOCIAL_LINKS).join(', ');
      setSocialLinks(truncatedLinks);
      showNotification(`You can add a maximum of ${MAX_SOCIAL_LINKS} social links.`, 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('user_id', loggedInUserId);

    // Only append DP if it has changed
    if (dpFile instanceof Blob) { // If a new file (Blob) is selected after cropping
      formData.append('dp', dpFile, 'profile.jpg');
    } else if (dpFile === 'remove') { // If the 'Remove' button was clicked
      formData.append('dp', 'remove');
    }
    // If dpFile is null, it means no change to DP, so we don't append 'dp' at all.

    // Only append name if it has changed
    if (name !== profile.name) {
      formData.append('name', name);
    }

    // Only append bio if it has changed and is within character limit
    if (bio.length <= BIO_MAX_CHARS && bio !== profile.bio) {
      formData.append('bio', bio);
    } else if (bio.length > BIO_MAX_CHARS) {
      showNotification(`Bio exceeds the maximum of ${BIO_MAX_CHARS} characters. Please shorten it.`, 'error');
      setIsSaving(false);
      return;
    }


    // --- UPDATED SOCIAL LINKS HANDLING LOGIC ---
    let currentSocialLinksArray = [];
    try {
        const trimmedLinks = socialLinks.split(',')
                                        .map(link => link.trim())
                                        .filter(link => link !== '');
        currentSocialLinksArray = [...new Set(trimmedLinks)]; // Ensure unique links
    } catch (error) {
        console.error("Error parsing social links:", error);
    }

    if (currentSocialLinksArray.length > MAX_SOCIAL_LINKS) {
      showNotification(`You can add a maximum of ${MAX_SOCIAL_LINKS} social links.`, 'error');
      setIsSaving(false);
      return;
    }

    const originalSocialLinksArray = Array.isArray(profile.social_links) ? profile.social_links : [];

    // Compare with the original social_links (ensure profile.social_links is an array)
    // and only send if there's a difference.
    // Use .sort() for reliable array comparison if order doesn't strictly matter
    if (JSON.stringify(currentSocialLinksArray.sort()) !== JSON.stringify(originalSocialLinksArray.sort())) {
        // Here, we join the array back into a comma-separated string directly
        formData.append('social_links', currentSocialLinksArray.join(','));
    }
    // --- END UPDATED SOCIAL LINKS HANDLING LOGIC ---

    try {
      const updateProfileResponse = await wrapperFetch(`${backendUrl}/api/profile/update`, {
        method: 'PUT',
        body: formData, // No Content-Type header needed for FormData; browser sets it.
      });

      if (updateProfileResponse.message) {
        showNotification(updateProfileResponse.message, 'success');
        // Update local state or re-fetch profile to reflect changes
        if (onProfileUpdated) onProfileUpdated();
        onClose(); // Close modal on success
      } else {
        showNotification('Failed to update profile.', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Error updating profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!usernameChangeAllowed) {
      showNotification('Username change not allowed yet.', 'error');
      return;
    }
    if (!newUsername || newUsername === originalUsername) {
        showNotification('Please enter a new username.', 'error');
        return;
    }
    if (usernameAvailability !== true) {
        showNotification('New username is not available.', 'error');
        return;
    }

    setIsSaving(true); // Re-use isSaving for this operation
    try {
      const response = await wrapperFetch(`${backendUrl}/api/profile/username-change`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: loggedInUserId,
          new_username: newUsername
        })
      });
      if (response && response.message === 'Username changed successfully.') {
        showNotification('Username updated successfully!', 'success');
        setOriginalUsername(newUsername); // Update original username
        // Update local storage username immediately
        localStorage.setItem('username', newUsername);
        if (onProfileUpdated) onProfileUpdated(); // Re-fetch profile data or update parent state
      } else {
        showNotification(response?.message || 'Failed to change username.', 'error');
      }
    } catch (error) {
      console.error('Error changing username:', error);
      showNotification('Error changing username. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate character count for bio
  const bioCharCount = bio.length;

  // Calculate number of social links
  const currentSocialLinkCount = socialLinks.split(',').filter(link => link.trim() !== '').length;


  return (
    <>
      {showCropper && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {!showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                Edit Profile
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {/* Profile Picture */}
              <div className="mb-6 text-center">
                <div
                  className="relative w-32 h-32 mx-auto mb-4 group"
                  onMouseEnter={() => setIsHoveringDp(true)}
                  onMouseLeave={() => setIsHoveringDp(false)}
                >
                  {/* DP Image or Placeholder */}
                  {dpPreview ? (
                    <img
                      src={dpPreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover rounded-full border-4 border-gray-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center border-4 border-gray-200 shadow-lg">
                      <i className="fas fa-user text-gray-600 text-4xl"></i>
                    </div>
                  )}

                  {/* Overlay for Camera Icon and Remove Button */}
                  <div
                    className={`absolute inset-0 rounded-full flex flex-col items-center justify-center transition-all duration-300
                      ${isHoveringDp ? 'bg-black bg-opacity-40' : 'bg-opacity-0'}
                      ${dpPreview ? 'text-white' : 'text-gray-600'}
                      ${dpPreview ? 'cursor-default' : 'cursor-pointer'}
                    `}
                  >
                    {/* Camera Icon - always visible on hover */}
                    <label htmlFor="dp-upload" className="cursor-pointer">
                      <i className={`fas fa-camera text-2xl transition-opacity duration-300 ${isHoveringDp ? 'opacity-100' : 'opacity-0'}`}></i>
                      <input
                        id="dp-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleDpChange}
                        className="hidden"
                      />
                    </label>

                    {/* Remove Button - appears below camera, on hover */}
                    {dpPreview && ( // Only show remove if there's a DP
                      <button
                        type="button"
                        onClick={handleRemoveDp}
                        className={`mt-2 px-3 py-1 bg-transparent text-white text-sm rounded-full border border-white
                          hover:bg-white hover:text-black transition-all duration-300 font-medium
                          ${isHoveringDp ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                        `}
                        style={customTextStyle}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm" style={customTextStyle}>Click on your profile picture to change it.</p>
              </div>

              {/* Username Field (handled by separate update button) */}
              <div className="mb-6">
                <label htmlFor="newUsername" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Username
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    id="newUsername"
                    className="flex-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={newUsername}
                    onChange={handleUsernameChangeInput}
                    disabled={isSaving || !usernameChangeAllowed}
                    style={customTextStyle}
                  />
                  {newUsername !== originalUsername && (
                    <button
                      type="button"
                      onClick={handleUsernameUpdate}
                      disabled={isSaving || isCheckingUsername || usernameAvailability !== true || !usernameChangeAllowed}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={customTextStyle}
                    >
                      {isSaving ? <i className="fas fa-spinner fa-spin"></i> : 'Update'}
                    </button>
                  )}
                </div>
                {isCheckingUsername && (
                  <p className="text-sm text-blue-500 mt-1" style={customTextStyle}>
                    Checking availability...
                  </p>
                )}
                {newUsername !== originalUsername && usernameAvailability === true && !isCheckingUsername && (
                  <p className="text-sm text-green-600 mt-1" style={customTextStyle}>
                    Username available!
                  </p>
                )}
                {newUsername !== originalUsername && usernameAvailability === false && !isCheckingUsername && (
                  <p className="text-sm text-red-600 mt-1" style={customTextStyle}>
                    Username not available.
                  </p>
                )}
                {!usernameChangeAllowed && (nextUsernameChangeDate || nextUsernameChangeDateRaw) && (
                  <p className="text-sm text-orange-600 mt-1" style={customTextStyle}>
                    Unable to change username until: {
                      nextUsernameChangeDate 
                        ? new Date(nextUsernameChangeDate).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })
                        : String(nextUsernameChangeDateRaw || '')
                    }
                  </p>
                )}
                {!usernameChangeAllowed && !nextUsernameChangeDate && !nextUsernameChangeDateRaw && (
                  <p className="text-sm text-orange-600 mt-1" style={customTextStyle}>
                    Username change is currently not allowed.
                  </p>
                )}
              </div>


              {/* Name Field */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={customTextStyle}
                />
              </div>

              {/* Bio Field with Character Count */}
              <div className="mb-4">
                <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
                  value={bio}
                  onChange={handleBioChange}
                  style={customTextStyle}
                ></textarea>
                <p className="text-gray-500 text-xs mt-1" style={customTextStyle}>
                  {bioCharCount} / {BIO_MAX_CHARS} characters
                </p>
              </div>

              {/* Social Links Field with Count */}
              <div className="mb-6">
                <label htmlFor="socialLinks" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Social Links (comma-separated URLs)
                </label>
                <input
                  type="text"
                  id="socialLinks"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., twitter.com/user, github.com/user"
                  value={socialLinks}
                  onChange={handleSocialLinksChange}
                  style={customTextStyle}
                />
                <p className="text-gray-500 text-xs mt-1" style={customTextStyle}>
                  {currentSocialLinkCount} / {MAX_SOCIAL_LINKS} links. Separate multiple links with commas.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={customTextStyle}
                >
                  {isSaving ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfileModal;