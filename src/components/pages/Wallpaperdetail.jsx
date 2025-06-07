import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainLayout';
import WallpaperCard from '../elements/Wallpapercard';
import WallpaperSkeleton from '../elements/SkeletonCard';
import wrapperFetch from '../Middleware/wrapperFetch';
import UserCard from '../elements/UserCard'; // Assuming UserCard is in elements
import ReportModal from '../elements/ReportModal'; // Assuming ReportModal is in elements

const WallpaperDetail = () => {
  const { wallpaperId } = useParams();
  const navigate = useNavigate();

  const [wallpaper, setWallpaper] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Home');

  // States for main wallpaper actions
  const [isLiking, setIsLiking] = useState(false);
  const [hasViewBeenTracked, setHasViewBeenTracked] = useState(false);

  // States for Modals and Likes Display
  const [showLikesModal, setShowLikesModal] = useState(false); // <--- Make sure this is declared
  const [wallpaperLikes, setWallpaperLikes] = useState([]);
  const [filteredLikes, setFilteredLikes] = useState([]); // New state for filtered likes
  const [likesSearchTerm, setLikesSearchTerm] = useState(''); // New state for likes search bar
  const [isFetchingLikes, setIsFetchingLikes] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // For the 3-dot menu on the detail page

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
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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
    navigate(`/desktop/profile/${profileId}`);
  };

  const handleWallpaperClick = (id) => {
    console.log('Navigate to wallpaper:', id);
    navigate(`/desktop/wallpaper/${id}`);
  };

  const handleHashtagClick = (hashtag) => {
    // Navigate to the Home page and pass the hashtag in the state
    console.log('Navigating to home with hashtag:', hashtag);
    navigate('/desktop/home', { state: { hashtag: hashtag } });
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
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4" style={customTextStyle}>
              Wallpaper not found
            </h2>
            <p className="text-gray-600 mb-6" style={customTextStyle}>
              The wallpaper you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
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
      {loading ? (
        <div className="space-y-8">
          {/* Main wallpaper skeleton */}
          <div className="animate-pulse bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Image Skeleton */}
              <div className="relative w-full md:w-1/2 aspect-[9/15] bg-gray-200 rounded-lg shadow-md flex-shrink-0 mx-auto"></div>
              {/* Details Section Skeleton */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-full w-8"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  {/* Action Buttons Skeleton */}
                  <div className="flex space-x-4 pt-4 border-t border-gray-100 mb-6">
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                  {/* Liked Profiles Skeleton */}
                  <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                      <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                      <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations skeleton */}
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletonCards()}
            </div>
          </div>
        </div>
      ) : wallpaper ? (
        <div className="space-y-8">
          {/* Main Wallpaper Section */}
<div className="bg-white rounded-lg overflow-hidden shadow-lg p-6">
  <div className="flex flex-col md:flex-row gap-8">
    {/* Image Section (left/top) - Takes half width on md screens */}
    <div className="relative w-full md:w-1/2 aspect-[9/15] overflow-hidden rounded-lg shadow-md flex-shrink-0 mx-auto">
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
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm" style={customTextStyle}>
        <i className="fas fa-eye mr-1"></i> {formatNumber(wallpaper.view_count)}
      </div>
    </div>

    {/* Details Section (right/bottom) - Enhanced to fill space better */}
    <div className="flex-1 flex flex-col h-full min-h-[600px]"> {/* Added min-height to match image */}
      {/* Title and Description - More prominent */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4 text-black leading-tight" style={customTextStyle}>
          {wallpaper.title}
        </h1>
        {wallpaper.description && (
          <p className="text-gray-600 mb-4 leading-relaxed text-lg" style={customTextStyle}>
            {wallpaper.description}
          </p>
        )}
      </div>

      {/* Uploader Info and Three dots menu - Enhanced */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div
          className="flex items-center space-x-4 cursor-pointer"
          onClick={() => handleProfileClick(wallpaper.uploader_profile?.id)}
        >
          <img
            src={wallpaper.uploader_profile?.dp || '/default-avatar.png'}
            alt={wallpaper.uploader_profile?.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
          />
          <div>
            <p className="font-semibold text-black hover:underline text-lg" style={customTextStyle}>
              {wallpaper.uploader_profile?.username}
            </p>
            <p className="text-sm text-gray-500" style={customTextStyle}>
              Uploaded on {new Date(wallpaper.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Three dots menu */}
        <div className="relative">
          <button
            className="text-gray-500 p-3 hover:bg-gray-200 rounded-full transition-colors"
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                <i className={`fas fa-bookmark text-lg ${wallpaper.isSaved ? 'text-black' : 'text-gray-400'}`}></i>
                <span className="text-black text-base" style={customTextStyle}>
                  {wallpaper.isSaved ? 'Saved' : 'Save'}
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

      {/* Hashtags - Enhanced with better spacing */}
      {wallpaper.hashtags && wallpaper.hashtags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide" style={customTextStyle}>
            Hashtags
          </h4>
          <div className="flex flex-wrap gap-3">
            {wallpaper.hashtags.map((hashtag, index) => (
              <span
                key={index}
                onClick={() => handleHashtagClick(hashtag)}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors font-medium"
                style={customTextStyle}
              >
                #{hashtag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Styles - Enhanced */}
      {wallpaper.styles && wallpaper.styles.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide" style={customTextStyle}>
            Styles
          </h4>
          <div className="flex flex-wrap gap-3">
            {wallpaper.styles.map((style) => (
              <span
                key={style.id}
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium"
                style={customTextStyle}
              >
                {style.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Enhanced with better design */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide" style={customTextStyle}>
          Actions
        </h4>
        <div className="flex items-center space-x-8">
          {/* Like Button */}
          <button
            className={`flex flex-col items-center space-y-2 transition-all duration-300 p-3 rounded-lg hover:bg-white ${isLiking ? 'scale-110' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <div className="relative">
              <i className={`fas fa-heart text-2xl transition-all duration-500 ${
                wallpaper.isLiked
                  ? 'text-red-500 animate-pulse'
                  : 'text-gray-500 hover:text-red-400'
              }`}></i>
              {isLiking && wallpaper.isLiked && (
                <div className="absolute inset-0 animate-ping">
                  <i className="fas fa-heart text-2xl text-red-500"></i>
                </div>
              )}
            </div>
            <span className="text-black text-sm font-medium" style={customTextStyle}>
              {formatNumber(wallpaper.like_count)} Likes
            </span>
          </button>

          {/* Download Button */}
          <button
            className="flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-white"
            onClick={handleDownload}
          >
            <i className="fas fa-download text-2xl"></i>
            <span className="text-sm font-medium" style={customTextStyle}>
              {formatNumber(wallpaper.download_count)} Downloads
            </span>
          </button>

          {/* Share Button */}
          <button
            className="flex flex-col items-center space-y-2 text-gray-700 hover:text-green-600 transition-colors p-3 rounded-lg hover:bg-white"
            onClick={handleShare}
          >
            <i className="fas fa-share text-2xl"></i>
            <span className="text-sm font-medium" style={customTextStyle}>
              {formatNumber(wallpaper.share_count)} Shares
            </span>
          </button>
        </div>
      </div>

      {/* Liked Profiles Section - Now at the bottom to fill remaining space */}
      <div className="flex-grow p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-black flex items-center" style={customTextStyle}>
          <i className="fas fa-heart text-red-500 mr-2"></i> 
          Liked by {formatNumber(wallpaper.like_count)} people
        </h3>
        {isFetchingLikes ? (
          <div className="flex justify-center items-center h-32">
            <i className="fas fa-spinner fa-spin text-3xl text-gray-500"></i>
          </div>
        ) : wallpaperLikes.length > 0 ? (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-4">
              {wallpaperLikes.slice(0, 12).map(user => (
                <div key={user.id || user.user_id} className="text-center">
                  <img
                    src={user.dp || '/default-avatar.png'}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover mx-auto cursor-pointer border-2 border-white shadow-sm hover:shadow-md transition-all hover:scale-105"
                    onClick={() => handleProfileClick(user.id || user.user_id)}
                  />
                  <p className="text-xs text-gray-700 mt-1 truncate" style={customTextStyle}>
                    {user.username}
                  </p>
                </div>
              ))}
            </div>
            {wallpaperLikes.length > 12 && (
              <button
                onClick={() => {
                  setShowLikesModal(true);
                  setLikesSearchTerm('');
                }}
                className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm shadow-sm border border-gray-200"
                style={customTextStyle}
              >
                <span>View All {formatNumber(wallpaper.like_count)} Likes</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-heart-broken text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500" style={customTextStyle}>
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
              <h2 className="text-2xl font-bold mb-6 text-black" style={customTextStyle}>
                Related Wallpapers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.slice(0, 9).map((recommendedWallpaper) => (
                  <WallpaperCard
                    key={recommendedWallpaper.id || recommendedWallpaper._id}
                    wallpaper={recommendedWallpaper}
                    userId={loggedInUserId}
                    onProfileClick={handleProfileClick}
                    onWallpaperClick={handleWallpaperClick}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                Likes ({formatNumber(wallpaper?.like_count || 0)})
              </h3>
              <button
                onClick={() => { setShowLikesModal(false); setLikesSearchTerm(''); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Likes Search Bar in Modal */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={customTextStyle}
                value={likesSearchTerm}
                onChange={(e) => setLikesSearchTerm(e.target.value)}
              />
            </div>

            {/* Modal Body - User Cards (using UserCard component) */}
            <div className="flex-grow overflow-y-auto p-4">
              {isFetchingLikes ? (
                <div className="flex justify-center items-center h-full py-8">
                  <i className="fas fa-spinner fa-spin text-4xl text-gray-500"></i>
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
                <p className="text-center text-gray-500 py-8" style={customTextStyle}>
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
    </MainLayout>
  );
};

export default WallpaperDetail;