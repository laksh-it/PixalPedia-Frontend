// src/components/WallpaperCard.js (Updated)
import React, { useState, useRef, useEffect } from 'react';
import wrapperFetch from '../../Middleware/wrapperFetch';
import { useNavigate } from 'react-router-dom';
import UserCard from './MobUserCard';
import ReportModal from '../../elements/ReportModal';

const WallpaperCard = ({
  wallpaper,
  userId
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState(wallpaper);
  const [isLiking, setIsLiking] = useState(false);
  const [hasViewBeenTracked, setHasViewBeenTracked] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const longPressTimeoutRef = useRef(null); // New ref for long press timer

  // States for Modals
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [wallpaperLikes, setWallpaperLikes] = useState([]);
  const [isFetchingLikes, setIsFetchingLikes] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const navigate = useNavigate();
  const cardRef = useRef(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const wallpaperPageBaseUrl = `${window.location.origin}/mobile/wallpaper`;

  const loggedInUserId = localStorage.getItem('userId');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const transformImageUrl = (url) => {
    if (url && url.includes('https://yourdomain.com/proxy-image')) {
      return url.replace(
        'https://yourdomain.com/proxy-image',
        'https://aoycxyazroftyzqlrvpo.supabase.co'
      );
    }
    return url;
  };

  const formatNumber = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

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

  const handleSave = async (e) => {
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

  const handleView = async () => {
    if (!hasViewBeenTracked) {
      try {
        await updateMetrics('view');
        setCurrentWallpaper(prev => ({
          ...prev,
          view_count: prev.view_count + 1
        }));
        setHasViewBeenTracked(true);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
  };

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

  const handleProfileNavigation = (e) => {
    e.stopPropagation();
    const profileId = currentWallpaper.profile_id || currentWallpaper.uploader_profile?.id;
    if (profileId) {
      navigate(`/mobile/profile/${profileId}`);
    } else {
      console.warn("Profile ID not found for navigation.");
    }
  };

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

  const handleLikesCountClick = async (e) => {
    e.stopPropagation();
    await fetchWallpaperLikes();
    setShowLikesModal(true);
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    console.log("Report submitted successfully for wallpaper:", currentWallpaper.id);
  };

  const handleCardWallpaperClick = (e) => {
    // If on a touch device or tapped, first click reveals overlay, second navigates
    // On desktop, regular hover behavior (or direct click if not hovering)
    if (isTapped) {
      e.stopPropagation();
      navigate(`/mobile/wallpaper/${currentWallpaper.id}`);
    } else {
      e.stopPropagation();
      setIsTapped(true);
      handleView();
    }
  };

  const handleCardHashtagClick = (hashtag, e) => {
    e.stopPropagation();
    navigate('/mobile/home', { state: { hashtag: hashtag } });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // --- New long-press handling ---
  const handleTouchStart = (e) => {
    // Prevent default touch start behavior (like text selection)
    e.stopPropagation();
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    // Start a timer for a long press
    longPressTimeoutRef.current = setTimeout(() => {
      // If the timer completes, it's a long press. Prevent default.
      e.preventDefault(); // This is crucial for preventing the context menu
    }, 500); // Adjust this value (in milliseconds) for desired long-press duration
  };

  const handleTouchEnd = () => {
    // Clear the timeout if the touch is released before the long press duration
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleTouchMove = () => {
    // If there's significant movement, clear the timeout to prevent accidental long presses
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };
  // --- End new long-press handling ---


  // Effect to close dropdown and untap if clicked outside (only for touch-like interactions)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setIsTapped(false);
        setShowDropdown(false);
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={cardRef}
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
      onClick={handleCardWallpaperClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart} // Add touch start listener
      onTouchEnd={handleTouchEnd}     // Add touch end listener
      onTouchMove={handleTouchMove}   // Add touch move listener
    >
      {/* Main Image - Updated to smartphone aspect ratio (9:16) for 1080x1920 dimensions */}
      <div className="aspect-[9/15] overflow-hidden relative">
        <img
          src={transformImageUrl(currentWallpaper.image_url)}
          alt={currentWallpaper.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />

        {/* Hover/Tap Overlay - Now visible if isHovered OR isTapped */}
        {(isHovered || isTapped) && (
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
                      onClick={handleSave}
                    >
                      <i className={`fas fa-bookmark text-lg ${currentWallpaper.isSaved ? 'text-black' : 'text-gray-400'}`}></i>
                      <span className="text-black text-base" style={customTextStyle}>
                        {currentWallpaper.isSaved ? 'Saved' : 'Save'}
                      </span>
                    </button>
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
                    e.stopPropagation();
                    navigate(`/mobile/wallpaper/${currentWallpaper.id}`);
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
                        e.stopPropagation();
                        navigate(`/mobile/wallpaper/${currentWallpaper.id}`);
                      }}
                    >
                      {currentWallpaper.description}
                    </p>
                    {currentWallpaper.description.length > 100 && (
                      <span
                        className="text-blue-300 text-sm cursor-pointer hover:text-blue-100 transition-colors"
                        style={customTextStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mobile/wallpaper/${currentWallpaper.id}`);
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
                      onClick={(e) => handleCardHashtagClick(hashtag, e)}
                    >
                      #{hashtag}
                    </span>
                  ))}
                  {currentWallpaper.hashtags.length > 3 && (
                    <span
                      className="text-blue-300 text-sm cursor-pointer hover:text-blue-100 transition-colors bg-black bg-opacity-20 px-2 py-1 rounded-md"
                      style={customTextStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mobile/wallpaper/${currentWallpaper.id}`);
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
      </div>

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
                 onClick={(e) => {
                  e.stopPropagation();
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
                      navigate(`/mobile/profile/${profileId}`);
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
        onClose={(e) => {
          if (e) e.stopPropagation();
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