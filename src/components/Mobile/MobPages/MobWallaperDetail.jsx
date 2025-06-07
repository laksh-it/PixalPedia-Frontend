import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob';
import WallpaperCard from '../Mobelements/MobWallpaperCard'; // Used for the main detail and the related wallpaper expansion
import WallpaperSkeleton from '../../elements/SkeletonCard';
import wrapperFetch from '../../Middleware/wrapperFetch';
import UserCard from '../Mobelements/MobUserCard';
import ReportModal from '../../elements/ReportModal';
import SimpleWallpaperGridItem from '../Mobelements/SimpleWallpaperGridItem'; // <--- NEW IMPORT: For displaying recommended wallpapers in the grid

// Simple Notification Component (Assuming it's a shared component or local)
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white flex items-center space-x-2 z-50 ${bgColor}`}>
      <i className={`${icon} text-xl`}></i>
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-white opacity-75 hover:opacity-100">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

const WallpaperDetail = () => {
  const { wallpaperId } = useParams();
  const navigate = useNavigate();

  const [wallpaper, setWallpaper] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Home'); // Default for mobile layout

  // States for main wallpaper actions
  const [isLiking, setIsLiking] = useState(false);
  const [hasViewBeenTracked, setHasViewBeenTracked] = useState(false);

  // States for Modals and Likes Display
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [wallpaperLikes, setWallpaperLikes] = useState([]);
  const [filteredLikes, setFilteredLikes] = useState([]);
  const [likesSearchTerm, setLikesSearchTerm] = useState('');
  const [isFetchingLikes, setIsFetchingLikes] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // For the 3-dot menu on the detail page

  // --- NEW STATE AND REF FOR RELATED WALLPAPER EXPANSION MODAL ---
  const [selectedRelatedWallpaper, setSelectedRelatedWallpaper] = useState(null);
  const relatedWallpaperModalRef = useRef(null);
  // ---------------------------------------------------------------

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const loggedInUserId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const wallpaperPageBaseUrl = `${window.location.origin}/wallpaper`;

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

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
    if (num === null || num === undefined) return '0';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  // Update metrics API call using wrapperFetch
  const updateMetrics = async (metric, action = null) => {
    try {
      if (!wallpaper) {
        console.warn('Cannot update metrics: wallpaper data is not available.');
        return;
      }
      const body = {
        wallpaper_id: wallpaper.id,
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

  useEffect(() => {
    fetchWallpaperDetails();
  }, [wallpaperId, loggedInUserId]);

  // Track view when component mounts and wallpaper data is available
  useEffect(() => {
    if (wallpaper && !hasViewBeenTracked) {
      const timer = setTimeout(() => {
        handleView();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wallpaper, hasViewBeenTracked]);

  // Effect for filtering likes based on search term (only for the modal now)
  useEffect(() => {
    if (likesSearchTerm === '') {
      setFilteredLikes(wallpaperLikes);
    } else {
      setFilteredLikes(
        wallpaperLikes.filter(user =>
          user.username.toLowerCase().includes(likesSearchTerm.toLowerCase())
        )
      );
    }
  }, [wallpaperLikes, likesSearchTerm]);

  // --- NEW / MODIFIED: Handle clicks outside dropdowns and the related wallpaper modal ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown menu
      if (showDropdown && event.target.closest('.relative') !== document.querySelector('.relative')) {
        setShowDropdown(false);
      }
      // Close selected related wallpaper modal if click outside its boundaries
      if (selectedRelatedWallpaper && relatedWallpaperModalRef.current && !relatedWallpaperModalRef.current.contains(event.target)) {
        setSelectedRelatedWallpaper(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, selectedRelatedWallpaper]); // Add selectedRelatedWallpaper to dependencies
  // ---------------------------------------------------------------------------------------

  const fetchWallpaperDetails = async () => {
    if (!loggedInUserId || !wallpaperId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const endpoint = `${backendUrl}/api/wallpapers/${wallpaperId}/${loggedInUserId}`;
      console.log('Fetching wallpaper details from:', endpoint);

      const response = await wrapperFetch(endpoint);

      if (response && response.wallpaper) {
        setWallpaper(response.wallpaper);
        setRecommendations(response.recommendations || []);
        setHasViewBeenTracked(false); // Reset view tracking for new wallpaper
        // Immediately fetch likes when wallpaper details are loaded
        fetchWallpaperLikes(response.wallpaper.id);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Error fetching wallpaper details:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle like action
  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking || !wallpaper) return;

    setIsLiking(true);
    const action = wallpaper.isLiked ? 'remove' : 'add';

    try {
      await updateMetrics('like', action);

      setWallpaper(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        like_count: prev.isLiked ? prev.like_count - 1 : prev.like_count + 1
      }));
      // Re-fetch likes after like/unlike to update the list
      fetchWallpaperLikes(wallpaper.id);
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle save/unsave
  const handleSave = async () => {
    if (!wallpaper) return;
    try {
      const url = wallpaper.isSaved
        ? `${backendUrl}/api/fetch/saved/delete`
        : `${backendUrl}/api/fetch/saved`;

      const method = wallpaper.isSaved ? 'DELETE' : 'POST';

      const response = await wrapperFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: loggedInUserId,
          wallpaper_id: wallpaper.id
        })
      });

      if (!response) {
        throw new Error('Failed to update save status - no response');
      }

      if (response.error) {
        throw new Error(response.error || 'Failed to update save status');
      }

      setWallpaper(prev => ({
        ...prev,
        isSaved: !prev.isSaved
      }));

      setShowDropdown(false);
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  // Handle view increment
  const handleView = async () => {
    if (!hasViewBeenTracked && wallpaper) {
      try {
        await updateMetrics('view');
        setWallpaper(prev => ({
          ...prev,
          view_count: prev.view_count + 1
        }));
        setHasViewBeenTracked(true);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
  };

  // Handle download
  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!wallpaper) return;

    try {
      await updateMetrics('download');
      setWallpaper(prev => ({
        ...prev,
        download_count: prev.download_count + 1
      }));
    } catch (error) {
      console.error('Error tracking download:', error);
    }

    const imageUrlToDownload = transformImageUrl(wallpaper.image_url);

    try {
      const response = await fetch(imageUrlToDownload);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${wallpaper.title || 'wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error initiating download:', downloadError);
      console.warn('Falling back to direct link download due to error:', downloadError);
      const link = document.createElement('a');
      link.href = imageUrlToDownload;
      link.download = `${wallpaper.title || 'wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle share
  const handleShare = async (e) => {
    e.stopPropagation();
    if (!wallpaper) return;

    try {
      await updateMetrics('share');
      setWallpaper(prev => ({
        ...prev,
        share_count: prev.share_count + 1
      }));
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    const shareUrl = `${wallpaperPageBaseUrl}/${wallpaper.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: wallpaper.title || 'Wallpaper',
          text: wallpaper.description || 'Check out this awesome wallpaper!',
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

  // Function to fetch wallpaper likes
  const fetchWallpaperLikes = async (idToFetch = wallpaperId) => {
    if (isFetchingLikes || !idToFetch) return;
    setIsFetchingLikes(true);
    if (!loggedInUserId) {
      console.warn("Logged-in user ID not found. Cannot fetch wallpaper likes with follow status.");
      setIsFetchingLikes(false);
      return;
    }

    try {
      const response = await wrapperFetch(`${backendUrl}/api/fetch/wallpaper/${idToFetch}/likes/${loggedInUserId}`);
      if (response && response.likes) {
        setWallpaperLikes(response.likes);
        setFilteredLikes(response.likes); // Initialize filtered likes
      } else {
        console.error('Failed to fetch wallpaper likes:', response?.error);
      }
    } catch (error) {
      console.error('Error fetching wallpaper likes:', error);
    } finally {
      setIsFetchingLikes(false);
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
    console.log("Report submitted successfully for wallpaper:", wallpaper.id);
  };

  // Disable right click on the image
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }
    navigate(path);
  };

  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    // When navigating to profile from here, make sure to close the modal if open
    setShowLikesModal(false);
    setLikesSearchTerm(''); // Clear search term
    setSelectedRelatedWallpaper(null); // Also close related wallpaper modal if open
    navigate(`/mobile/profile/${profileId}`); // Changed path for mobile
  };

  // --- NEW: Handle click on a recommended wallpaper to expand it in a modal ---
  const handleRelatedWallpaperClick = (wallpaperData) => {
    console.log('Expanding related wallpaper:', wallpaperData.id);
    setSelectedRelatedWallpaper(wallpaperData);
  };
  // -------------------------------------------------------------------------

  // --- MODIFIED: Original handleWallpaperClick to navigate directly when not in a modal context ---
  const handleWallpaperClick = (id) => {
    console.log('Navigate to wallpaper:', id);
    // If a related wallpaper is expanded, clicking on it should navigate to its detail page.
    // Otherwise, this function is likely called from elsewhere and should navigate.
    if (selectedRelatedWallpaper && selectedRelatedWallpaper.id === id) {
      setSelectedRelatedWallpaper(null); // Close the modal before navigating
    }
    navigate(`/mobile/wallpaper/${id}`); // Changed path for mobile
  };
  // -------------------------------------------------------------------------------------------------

  const handleHashtagClick = (hashtag) => {
    // Navigate to the Home page and pass the hashtag in the state
    console.log('Navigating to home with hashtag:', hashtag);
    setSelectedRelatedWallpaper(null); // Close related wallpaper modal if open
    navigate('/mobile/home', { state: { hashtag: hashtag } }); // Changed path for mobile
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 9 }, (_, index) => (
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (!loggedInUserId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view wallpapers</p>
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

  if (error) {
    return (
      <MainLayout
        activeSidebarItem={activeSidebarItem}
        onSidebarItemClick={handleSidebarItemClick}
        username={username}
      >
        <div className="flex flex-col items-center justify-center min-h-64 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4" style={customTextStyle}>
              Wallpaper not found
            </h2>
            <p className="text-gray-600 mb-6 text-sm" style={customTextStyle}>
              The wallpaper you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/mobile/home')}
              className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
              style={customTextStyle}
            >
              Back to Home
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
    >
      <Notification message={null} />

      {/* --- INSERT THIS DIV HERE --- */}
      <div className="bg-gray-200 min-h-screen">

      {loading ? (
        <div className="space-y-6 px-4 py-4">
          {/* Main wallpaper skeleton */}
          <div className="animate-pulse bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col gap-4">
              {/* Image Skeleton */}
              <div className="relative w-full aspect-[9/15] bg-gray-200 rounded-lg shadow-md flex-shrink-0 mx-auto"></div>
              {/* Details Section Skeleton */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-14 mt-1"></div>
                      </div>
                    </div>
                    <div className="h-7 bg-gray-200 rounded-full w-7"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                  </div>
                  {/* Action Buttons Skeleton */}
                  <div className="flex space-x-3 pt-3 border-t border-gray-100 mb-4">
                    <div className="h-9 bg-gray-200 rounded w-16"></div>
                    <div className="h-9 bg-gray-200 rounded w-16"></div>
                    <div className="h-9 bg-gray-200 rounded w-16"></div>
                  </div>
                  {/* Liked Profiles Skeleton */}
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="h-9 bg-gray-200 rounded w-full mt-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations skeleton */}
          <div>
            <div className="h-7 bg-gray-200 rounded w-40 mb-5"></div>
            <div className="grid grid-cols-2 gap-4">
              {renderSkeletonCards().slice(0, 4)}
            </div>
          </div>
        </div>
      ) : wallpaper ? (
        <div className="space-y-6 px-4 py-4">
          {/* Main Wallpaper Section */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg p-4">
            <div className="flex flex-col gap-4">
              {/* Image Section (top) */}
              <div className="relative w-full aspect-[9/15] overflow-hidden rounded-lg shadow-md flex-shrink-0 mx-auto">
                <img
                  src={transformImageUrl(wallpaper.image_url)}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                    e.target.alt = 'Image not available';
                  }}
                  draggable={false}
                  onContextMenu={handleContextMenu}
                />
                {/* View count overlay on image */}
                <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-0.5 rounded-full text-xs" style={customTextStyle}>
                  <i className="fas fa-eye mr-1"></i> {formatNumber(wallpaper.view_count)}
                </div>
              </div>

              {/* Details Section (bottom) */}
              <div className="flex-1 flex flex-col h-full min-h-[auto]">
                {/* Title and Description */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold mb-2 text-black leading-tight" style={customTextStyle}>
                    {wallpaper.title}
                  </h1>
                  {wallpaper.description && (
                    <p className="text-gray-600 mb-3 leading-relaxed text-sm" style={customTextStyle}>
                      {wallpaper.description}
                    </p>
                  )}
                </div>

                {/* Uploader Info and Three dots menu */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => handleProfileClick(wallpaper.uploader_profile?.id)}
                  >
                    <img
                      src={wallpaper.uploader_profile?.dp || '/default-avatar.png'}
                      alt={wallpaper.uploader_profile?.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                    />
                    <div>
                      <p className="font-semibold text-black hover:underline text-base" style={customTextStyle}>
                        {wallpaper.uploader_profile?.username}
                      </p>
                      <p className="text-xs text-gray-500" style={customTextStyle}>
                        Uploaded on {new Date(wallpaper.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Three dots menu */}
                  <div className="relative">
                    <button
                      className="text-gray-500 p-2 hover:bg-gray-200 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                      }}
                    >
                      <i className="fas fa-ellipsis-v text-base"></i>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[120px] z-10">
                        <button
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                        >
                          <i className={`fas fa-bookmark text-base ${wallpaper.isSaved ? 'text-black' : 'text-gray-400'}`}></i>
                          <span className="text-black text-sm" style={customTextStyle}>
                            {wallpaper.isSaved ? 'Saved' : 'Save'}
                          </span>
                        </button>
                        <button
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                          onClick={handleReportClick}
                        >
                          <i className="fas fa-flag text-gray-400 text-base"></i>
                          <span className="text-black text-sm" style={customTextStyle}>Report</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hashtags */}
                {wallpaper.hashtags && wallpaper.hashtags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide" style={customTextStyle}>
                      Hashtags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {wallpaper.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          onClick={() => handleHashtagClick(hashtag)}
                          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-blue-200 transition-colors font-medium"
                          style={customTextStyle}
                        >
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styles */}
                {wallpaper.styles && wallpaper.styles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide" style={customTextStyle}>
                      Styles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {wallpaper.styles.map((style) => (
                        <span
                          key={style.id}
                          className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium"
                          style={customTextStyle}
                        >
                          {style.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide" style={customTextStyle}>
                    Actions
                  </h4>
                  <div className="flex items-center space-x-6 justify-around">
                    {/* Like Button */}
                    <button
                      className={`flex flex-col items-center space-y-1 transition-all duration-300 p-2 rounded-lg hover:bg-white ${isLiking ? 'scale-110' : ''}`}
                      onClick={handleLike}
                      disabled={isLiking}
                    >
                      <div className="relative">
                        <i className={`fas fa-heart text-xl transition-all duration-500 ${
                          wallpaper.isLiked
                            ? 'text-red-500 animate-pulse'
                            : 'text-gray-500 hover:text-red-400'
                        }`}></i>
                        {isLiking && wallpaper.isLiked && (
                          <div className="absolute inset-0 animate-ping">
                            <i className="fas fa-heart text-xl text-red-500"></i>
                          </div>
                        )}
                      </div>
                      <span className="text-black text-xs font-medium" style={customTextStyle}>
                        {formatNumber(wallpaper.like_count)} Likes
                      </span>
                    </button>

                    {/* Download Button */}
                    <button
                      className="flex flex-col items-center space-y-1 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-white"
                      onClick={handleDownload}
                    >
                      <i className="fas fa-download text-xl"></i>
                      <span className="text-xs font-medium" style={customTextStyle}>
                        {formatNumber(wallpaper.download_count)} Downloads
                      </span>
                    </button>

                    {/* Share Button */}
                    <button
                      className="flex flex-col items-center space-y-1 text-gray-700 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-white"
                      onClick={handleShare}
                    >
                      <i className="fas fa-share text-xl"></i>
                      <span className="text-xs font-medium" style={customTextStyle}>
                        {formatNumber(wallpaper.share_count)} Shares
                      </span>
                    </button>
                  </div>
                </div>

                {/* Liked Profiles Section */}
                <div className="flex-grow p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <h3 className="text-base font-bold mb-3 text-black flex items-center" style={customTextStyle}>
                    <i className="fas fa-heart text-red-500 mr-2"></i>
                    Liked by {formatNumber(wallpaper.like_count)} people
                  </h3>
                  {isFetchingLikes ? (
                    <div className="flex justify-center items-center h-24">
                      <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
                    </div>
                  ) : wallpaperLikes.length > 0 ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {wallpaperLikes.slice(0, 8).map(user => (
                          <div key={user.id || user.user_id} className="text-center">
                            <img
                              src={user.dp || '/default-avatar.png'}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover mx-auto cursor-pointer border-2 border-white shadow-sm hover:shadow-md transition-all hover:scale-105"
                              onClick={() => handleProfileClick(user.id || user.user_id)}
                            />
                            <p className="text-xs text-gray-700 mt-1 truncate" style={customTextStyle}>
                              {user.username}
                            </p>
                          </div>
                        ))}
                      </div>
                      {wallpaperLikes.length > 8 && (
                        <button
                          onClick={() => {
                            setShowLikesModal(true);
                            setLikesSearchTerm('');
                          }}
                          className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1 text-sm shadow-sm border border-gray-200"
                          style={customTextStyle}
                        >
                          <span>View All {formatNumber(wallpaper.like_count)} Likes</span>
                          <i className="fas fa-arrow-right"></i>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <i className="fas fa-heart-broken text-3xl text-gray-300 mb-2"></i>
                      <p className="text-gray-500 text-sm" style={customTextStyle}>
                        No one has liked this wallpaper yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-black" style={customTextStyle}>
                Related Wallpapers
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((recommendedWallpaper) => (
                  // --- MODIFIED: Use SimpleWallpaperGridItem for recommendations ---
                  <SimpleWallpaperGridItem
                    key={recommendedWallpaper.id || recommendedWallpaper._id}
                    wallpaper={recommendedWallpaper}
                    onClick={() => handleRelatedWallpaperClick(recommendedWallpaper)} // Click to expand
                  />
                  // ---------------------------------------------------------------
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
          </div>

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-sm w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-black" style={customTextStyle}>
                Likes ({formatNumber(wallpaper?.like_count || 0)})
              </h3>
              <button
                onClick={() => { setShowLikesModal(false); setLikesSearchTerm(''); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Likes Search Bar in Modal */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                style={customTextStyle}
                value={likesSearchTerm}
                onChange={(e) => setLikesSearchTerm(e.target.value)}
              />
            </div>

            {/* Modal Body - User Cards (using UserCard component) */}
            <div className="flex-grow overflow-y-auto p-3">
              {isFetchingLikes ? (
                <div className="flex justify-center items-center h-full py-6">
                  <i className="fas fa-spinner fa-spin text-3xl text-gray-500"></i>
                </div>
              ) : filteredLikes.length > 0 ? (
                filteredLikes.map(user => (
                  <UserCard
                    key={user.id || user.user_id}
                    user={user}
                    loggedInUserId={loggedInUserId}
                    onProfileClick={handleProfileClick}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-6 text-sm" style={customTextStyle}>
                  {likesSearchTerm ? "No users found matching your search." : "No one has liked this wallpaper yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        elementType="wallpaper"
        elementId={wallpaper?.id}
        onReportSuccess={handleReportSuccess}
      />

      {/* --- NEW: Related Wallpaper Expansion Modal --- */}
      {selectedRelatedWallpaper && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fadeIn">
          <div
            ref={relatedWallpaperModalRef}
            className="relative bg-white rounded-lg shadow-2xl max-w-sm w-full max-h-[95vh] overflow-y-auto flex flex-col animate-scaleIn"
          >
            {/* The WallpaperCard component itself will contain the image and details */}
            <WallpaperCard
              wallpaper={selectedRelatedWallpaper}
              userId={loggedInUserId}
              onProfileClick={handleProfileClick}
              onWallpaperClick={handleWallpaperClick} // This will navigate to the new wallpaper's detail page
              onHashtagClick={handleHashtagClick}
              isInModal={true} // A prop to WallpaperCard if you want to adjust its behavior/style when in modal
            />
          </div>
        </div>
      )}
      {/* ------------------------------------------- */}
    </MainLayout>
  );
};

export default WallpaperDetail;