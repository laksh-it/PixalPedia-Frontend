import React, { useState, useRef } from 'react';
import wrapperFetch from '../Middleware/wrapperFetch';
import { useNavigate } from 'react-router-dom';
import UserCard from './UserCard'; // Import the UserCard component
import ReportModal from '../elements/ReportModal'; // Import the ReportModal

const WallpaperCard = ({
  wallpaper,
  onDeleteSuccess // New prop to notify parent of successful deletion
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState(wallpaper);
  const [isLiking, setIsLiking] = useState(false);
  const [hasViewBeenTracked, setHasViewBeenTracked] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // States for Modals
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [wallpaperLikes, setWallpaperLikes] = useState([]);
  const [isFetchingLikes, setIsFetchingLikes] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // New state for Report Modal

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const wallpaperPageBaseUrl = `${window.location.origin}/desktop/wallpaper`; // Corrected base URL

  // Get the logged-in user's ID from localStorage
  const loggedInUserId = localStorage.getItem('userId');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Determine if the wallpaper is in a pending/manual approval state
  const isPendingApproval = currentWallpaper.status === 'manual_approval' || currentWallpaper.status === 'pending';

  // Determine if the logged-in user is the uploader
  const isUploader = loggedInUserId === currentWallpaper.user_id;

  // Transform proxy URLs for wallpaper images
  const transformImageUrl = (url) => {
    if (url && url.includes('https://yourdomain.com/proxy-image')) {
      return url.replace(
        'https://yourdomain.com/proxy-image',
        'https://aoycxyazroftyzqlrvpo.supabase.co'
      );
    }
    return url;
  };

  // Format numbers (999 -> 1K -> 1M -> 1B)
  const formatNumber = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Update metrics API call using wrapperFetch
  const updateMetrics = async (metric, action = null) => {
    try {
      const body = {
        wallpaper_id: currentWallpaper.id,
        metric,
        user_id: loggedInUserId
      };

      if (action) {
        body.action = action;
      }

      const response = await wrapperFetch(`${backendUrl}/api/wallpaper/update-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response) {
        throw new Error('Failed to update metrics - no response');
      }

      if (response.error) {
        throw new Error(response.error || 'Failed to update metrics');
      }

      return response;
    } catch (error) {
      console.error(`Error updating ${metric}:`, error);
      throw error;
    }
  };

  // Handle like action
  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const action = currentWallpaper.isLiked ? 'remove' : 'add';

    try {
      await updateMetrics('like', action);

      setCurrentWallpaper(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        like_count: prev.isLiked ? prev.like_count - 1 : prev.like_count + 1
      }));
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle save/unsave using wrapperFetch
  const handleSave = async (e) => { // Added 'e' to stop propagation
    e.stopPropagation();
    try {
      const url = currentWallpaper.isSaved
        ? `${backendUrl}/api/fetch/saved/delete`
        : `${backendUrl}/api/fetch/saved`;

      const method = currentWallpaper.isSaved ? 'DELETE' : 'POST';

      const response = await wrapperFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: loggedInUserId,
          wallpaper_id: currentWallpaper.id
        })
      });

      if (!response) {
        throw new Error('Failed to update save status - no response');
      }

      if (response.error) {
        throw new Error(response.error || 'Failed to update save status');
      }

      setCurrentWallpaper(prev => ({
        ...prev,
        isSaved: !prev.isSaved
      }));

      setShowDropdown(false);
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  // Handle view increment - now only triggers if not already tracked for this instance
  const handleView = async () => {
    if (!hasViewBeenTracked) {
      try {
        await updateMetrics('view');
        setCurrentWallpaper(prev => ({
          ...prev,
          view_count: prev.view_count + 1
        }));
        setHasViewBeenTracked(true); // Mark as tracked
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
  };

  // Handle download - Now using Blob-based download for direct download
const handleDownload = async (e) => {
  e.stopPropagation();

  try {
    await updateMetrics('download');
    setCurrentWallpaper(prev => ({
      ...prev,
      download_count: prev.download_count + 1
    }));
  } catch (error) {
    console.error('Error tracking download:', error);
  }

  const imageUrlToDownload = transformImageUrl(currentWallpaper.image_url);

  // Try blob method for all browsers first
  try {
    const response = await fetch(imageUrlToDownload, {
      method: 'GET',
      headers: {
        'Accept': 'image/jpeg,image/jpg,image/png,image/webp,image/*,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const properBlob = new Blob([blob], { type: 'image/jpeg' });
    const url = window.URL.createObjectURL(properBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentWallpaper.title || 'wallpaper'}.jpg`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
  } catch (downloadError) {
    console.error('Blob download failed:', downloadError);
    
    // Safari-specific fallback
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // Last resort for Safari - open in new tab
      window.open(imageUrlToDownload, '_blank');
    } else {
      // Direct link fallback for other browsers
      const link = document.createElement('a');
      link.href = imageUrlToDownload;
      link.download = `${currentWallpaper.title || 'wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

  // Handle share - use Web Share API or fallback to copy to clipboard
  const handleShare = async (e) => {
    e.stopPropagation();

    try {
      await updateMetrics('share');
      setCurrentWallpaper(prev => ({
        ...prev,
        share_count: prev.share_count + 1
      }));
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    const shareUrl = `${wallpaperPageBaseUrl}/${currentWallpaper.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentWallpaper.title || 'Wallpaper',
          text: currentWallpaper.description || 'Check out this awesome wallpaper!',
          url: shareUrl,
        });
      } catch (shareError) {
        console.error('Error sharing:', shareError);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  // Handle navigation to profile page
  const handleProfileNavigation = (e) => {
    e.stopPropagation();
    const profileId = currentWallpaper.profile_id || currentWallpaper.uploader_profile?.id;
    if (profileId) {
      navigate(`/desktop/profile/${profileId}`);
    } else {
      console.warn("Profile ID not found for navigation.");
    }
  };

  // Function to fetch wallpaper likes
  const fetchWallpaperLikes = async () => {
    if (isFetchingLikes) return;
    setIsFetchingLikes(true);
    if (!loggedInUserId) {
      console.warn("Logged-in user ID not found. Cannot fetch wallpaper likes with follow status.");
      setIsFetchingLikes(false);
      return;
    }

    try {
      const response = await wrapperFetch(`${backendUrl}/api/fetch/wallpaper/${currentWallpaper.id}/likes/${loggedInUserId}`);
      if (response && response.likes) {
        setWallpaperLikes(response.likes);
      } else {
        console.error('Failed to fetch wallpaper likes:', response?.error);
      }
    } catch (error) {
      console.error('Error fetching wallpaper likes:', error);
    } finally {
      setIsFetchingLikes(false);
    }
  };

  // Handle click on likes count to show modal
  const handleLikesCountClick = async (e) => {
    e.stopPropagation();
    await fetchWallpaperLikes();
    setShowLikesModal(true);
  };

  // Handle wallpaper deletion
  const handleDeleteWallpaper = async (e) => {
    e.stopPropagation();

    try {
      let endpoint;
      let body = {}; // Initialize body as an empty object

      if (isPendingApproval) {
        endpoint = `${backendUrl}/api/wallpaper/pending/${currentWallpaper.id}`;
        body = { user_id: loggedInUserId }; // Body is only needed for non-pending deletion
      } else {
        endpoint = `${backendUrl}/api/wallpaper/delete/${currentWallpaper.id}`;
        body = { user_id: loggedInUserId }; // Body is only needed for non-pending deletion
      }

      const response = await wrapperFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // Conditionally include body if it's not empty (for regular deletion)
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      if (response && response.message) {
        console.log(response.message);
        // Notify parent component to remove this card
        if (onDeleteSuccess) {
          onDeleteSuccess(currentWallpaper.id);
        }
      } else {
        console.error('Failed to delete wallpaper:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
    }
  };

  // Handler for opening the report modal
  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowDropdown(false); // Close the action dropdown
    setShowReportModal(true); // Open the report modal
  };

  // Handler for when a report is successfully submitted
  const handleReportSuccess = () => {
    console.log("Report submitted successfully for wallpaper:", currentWallpaper.id);
  };

  // --- NEW HANDLERS ---
  const handleCardWallpaperClick = () => {
    // Navigate directly to the wallpaper detail page
    console.log('Navigating to wallpaper:', currentWallpaper.id);
    navigate(`/desktop/wallpaper/${currentWallpaper.id}`);
  };

  const handleCardHashtagClick = (hashtag) => {
    // Navigate to the Home page and pass the hashtag in the state
    console.log('Navigating to home with hashtag:', hashtag);
    navigate('/desktop/home', { state: { hashtag: hashtag } });
  };
  // --- END NEW HANDLERS ---

  // Prevent right click
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => {
        setIsHovered(true);
        hoverTimeoutRef.current = setTimeout(() => {
          handleView();
        }, 3000);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDropdown(false);
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      }}
      onClick={!isPendingApproval ? handleCardWallpaperClick : undefined} // Only navigate if NOT pending approval
      onContextMenu={handleContextMenu}
    >
      {/* Main Image - Updated to smartphone aspect ratio (9:16) for 1080x1920 dimensions */}
      <div className="aspect-[9/15] overflow-hidden relative">
        <img
          src={transformImageUrl(currentWallpaper.image_url)}
          alt={currentWallpaper.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isPendingApproval ? 'filter blur-sm' : ''}`}
          draggable={false}
        />

        {/* Pending Approval Overlay */}
        {isPendingApproval && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-70 text-white text-center p-4">
            <i className="fas fa-clock text-5xl mb-4 animate-pulse"></i>
            <h4 className="text-xl font-bold mb-2" style={customTextStyle}>
              {currentWallpaper.status === 'manual_approval' ? 'Manual Approval Needed' : 'Pending Review'}
            </h4>
            <p className="text-sm">This wallpaper is awaiting review. It will be public once approved.</p>

            {/* Bin Icon for pending/manual approval cards, only if uploader */}
            {isUploader && (
              <button
                className="text-red-500 p-2 mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                onClick={handleDeleteWallpaper}
                title="Delete pending wallpaper"
              >
                <i className="fas fa-trash text-lg"></i>
              </button>
            )}
          </div>
        )}

        {/* Hover Overlay - Only show if NOT pending approval */}
        {isHovered && !isPendingApproval && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-between p-6 transition-opacity duration-300">
            {/* Top Section - Profile and Menu */}
            <div className="flex justify-between items-start">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={handleProfileNavigation}
              >
                <img
                  src={currentWallpaper.uploader_dp || currentWallpaper.uploader_profile?.dp}
                  alt={currentWallpaper.uploader_username || currentWallpaper.uploader_profile?.username}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-white text-base font-medium" style={customTextStyle}>
                  {currentWallpaper.uploader_username || currentWallpaper.uploader_profile?.username}
                </span>
              </div>

              <div className="flex items-center space-x-2"> {/* Container for bin and three dots */}
                {/* Bin Icon - Show if current user uploaded it */}
                {isUploader && ( // Only show if uploader (pending has its own bin now)
                  <button
                    className="text-red-500 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    onClick={handleDeleteWallpaper}
                    title="Delete wallpaper"
                  >
                    <i className="fas fa-trash text-lg"></i>
                  </button>
                )}

                {/* Three dots menu */}
                <div className="relative">
                  <button
                    className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                  >
                    <i className="fas fa-ellipsis-v text-lg"></i>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg py-3 min-w-[140px] z-10">
                      <button
                        className="w-full px-5 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                        onClick={handleSave} // Calls the internal handleSave
                      >
                        <i className={`fas fa-bookmark text-lg ${currentWallpaper.isSaved ? 'text-black' : 'text-gray-400'}`}></i>
                        <span className="text-black text-base" style={customTextStyle}>
                          {currentWallpaper.isSaved ? 'Saved' : 'Save'}
                        </span>
                      </button>
                      {/* Report Button */}
                      <button
                        className="w-full px-5 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                        onClick={handleReportClick}
                      >
                        <i className="fas fa-flag text-gray-400 text-lg"></i>
                        <span className="text-black text-base" style={customTextStyle}>Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section - Actions and Info */}
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-6">
                  {/* Like Button */}
                  <button
                    className={`flex items-center space-x-2 transition-all duration-300 ${isLiking ? 'scale-110' : ''}`}
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <div className="relative">
                      <i className={`fas fa-heart text-xl transition-all duration-500 ${
                        currentWallpaper.isLiked
                          ? 'text-red-500 animate-pulse'
                          : 'text-white hover:text-red-400'
                      }`}></i>
                      {isLiking && currentWallpaper.isLiked && (
                        <div className="absolute inset-0 animate-ping">
                          <i className="fas fa-heart text-xl text-red-500"></i>
                        </div>
                      )}
                    </div>
                    {/* Clickable Likes Count */}
                    <span
                      className="text-white text-base font-medium cursor-pointer hover:underline"
                      style={customTextStyle}
                      onClick={handleLikesCountClick}
                    >
                      {formatNumber(currentWallpaper.like_count)}
                    </span>
                  </button>

                  {/* Download Button */}
                  <button
                    className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
                    onClick={handleDownload}
                  >
                    <i className="fas fa-download text-xl"></i>
                    <span className="text-base font-medium" style={customTextStyle}>
                      {formatNumber(currentWallpaper.download_count)}
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    className="flex items-center space-x-2 text-white hover:text-green-400 transition-colors"
                    onClick={handleShare}
                  >
                    <i className="fas fa-share text-xl"></i>
                    <span className="text-base font-medium" style={customTextStyle}>
                      {formatNumber(currentWallpaper.share_count)}
                    </span>
                  </button>
                </div>

                {/* View Count */}
                <div className="flex items-center space-x-2 text-white">
                  <i className="fas fa-eye text-base"></i>
                  <span className="text-base font-medium" style={customTextStyle}>
                    {formatNumber(currentWallpaper.view_count)}
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <h3
                  className="text-amber-300 font-semibold text-xl cursor-pointer hover:text-white transition-colors leading-tight"
                  style={customTextStyle}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent main card click
                    handleCardWallpaperClick(); // Call internal handler
                  }}
                >
                  {currentWallpaper.title}
                </h3>
                {currentWallpaper.description && (
                  <>
                    <p
                      className="text-gray-200 text-base cursor-pointer hover:text-blue-300 transition-colors line-clamp-3 leading-relaxed"
                      style={customTextStyle}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent main card click
                        handleCardWallpaperClick(); // Call internal handler
                      }}
                    >
                      {currentWallpaper.description}
                    </p>
                    {currentWallpaper.description.length > 100 && (
                      <span
                        className="text-blue-300 text-sm cursor-pointer hover:text-blue-100 transition-colors"
                        style={customTextStyle}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent main card click
                          handleCardWallpaperClick(); // Call internal handler
                        }}
                      >
                        More...
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Hashtags */}
              {currentWallpaper.hashtags && currentWallpaper.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentWallpaper.hashtags.slice(0, 3).map((hashtag, index) => (
                    <span
                      key={index}
                      className="text-blue-300 text-sm cursor-pointer hover:text-blue-100 transition-colors bg-black bg-opacity-20 px-2 py-1 rounded-md"
                      style={customTextStyle}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent main card click
                        handleCardHashtagClick(hashtag); // Call new internal handler
                      }}
                    >
                      #{hashtag}
                    </span>
                  ))}
                  {currentWallpaper.hashtags.length > 3 && (
                    <span
                      className="text-blue-300 text-sm cursor-pointer hover:text-blue-100 transition-colors bg-black bg-opacity-20 px-2 py-1 rounded-md"
                      style={customTextStyle}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent main card click
                        handleCardWallpaperClick(); // Still navigate to wallpaper detail for 'More...'
                      }}
                    >
                      More...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* For pending/manual approval cards, show title, description, hashtags below image (not on hover) */}
        {isPendingApproval && (
          <div className="p-4 pt-0"> {/* Adjusted padding to bring it closer to the image */}
            <h3
              className="text-black font-semibold text-xl leading-tight mt-2" // Added mt-2
              style={customTextStyle}
            >
              {currentWallpaper.title}
            </h3>
            {currentWallpaper.description && (
              <p
                className="text-gray-600 text-base line-clamp-3 leading-relaxed mt-1" // Added mt-1
                style={customTextStyle}
              >
                {currentWallpaper.description}
              </p>
            )}
            {currentWallpaper.hashtags && currentWallpaper.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentWallpaper.hashtags.slice(0, 3).map((hashtag, index) => (
                  <span
                    key={index}
                    className="text-blue-600 text-sm cursor-pointer hover:text-blue-800 transition-colors bg-blue-100 px-2 py-1 rounded-md"
                    style={customTextStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardHashtagClick(hashtag);
                    }}
                  >
                    #{hashtag}
                  </span>
                ))}
                {currentWallpaper.hashtags.length > 3 && (
                  <span
                    className="text-blue-600 text-sm cursor-pointer hover:text-blue-800 transition-colors bg-blue-100 px-2 py-1 rounded-md"
                    style={customTextStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      // For "More..." on pending cards, you might still want to navigate to the wallpaper detail page
                      handleCardWallpaperClick();
                    }}
                  >
                    More...
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Font Awesome CDN (ensure this is only loaded once per app, not per card) */}
      {/* This link should ideally be in your public/index.html or a central CSS file, not here */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                Likes
              </h3>
              <button
                 onClick={(e) => { // <--- Add 'e' here
                  e.stopPropagation(); // <--- STOP THE PROPAGATION!
                  setShowLikesModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body - User Cards */}
            <div className="flex-grow overflow-y-auto p-4">
              {isFetchingLikes ? (
                <div className="flex justify-center items-center h-full py-8">
                  <i className="fas fa-spinner fa-spin text-4xl text-gray-500"></i>
                </div>
              ) : wallpaperLikes.length > 0 ? (
                wallpaperLikes.map(user => (
                  <UserCard
                    key={user.id || user.user_id}
                    user={user}
                    loggedInUserId={loggedInUserId}
                    onProfileClick={(profileId) => {
                      setShowLikesModal(false);
                      navigate(`/desktop/profile/${profileId}`);
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8" style={customTextStyle}>
                  No one has liked this wallpaper yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={(e) => { // This assumes ReportModal passes the event object to onClose
          if (e) e.stopPropagation(); // Only stop if an event object is passed
          setShowReportModal(false);
        }}
        elementType="wallpaper"
        elementId={currentWallpaper.id}
        onReportSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default WallpaperCard;