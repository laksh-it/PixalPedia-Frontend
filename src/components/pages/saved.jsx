import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainLayout'; // Adjust path as needed
import WallpaperCard from '../elements/Wallpapercard';
import WallpaperSkeleton from '../elements/SkeletonCard'; // Re-use for loading state
import wrapperFetch from '../Middleware/wrapperFetch'; // Re-use for API calls

const Saved = () => {
  const [savedWallpapers, setSavedWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Saved'); // Highlight "Saved" in sidebar

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username'); // Get username for MainLayout

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Function to fetch saved wallpapers
  const fetchSavedWallpapers = useCallback(async () => {
    if (!userId) {
      console.log('No userId found, cannot fetch saved wallpapers');
      // Optionally navigate to login or show a message
      return;
    }

    setLoading(true);
    try {
      const endpoint = `${backendUrl}/api/fetch/saved/${userId}`;
      console.log('Fetching saved wallpapers from:', endpoint);

      const response = await wrapperFetch(endpoint);

      if (response && response.saved) {
        setSavedWallpapers(response.saved);
      } else {
        setSavedWallpapers([]);
        console.log('No saved wallpapers found or invalid response.');
      }
    } catch (error) {
      console.error('Error fetching saved wallpapers:', error);
      setSavedWallpapers([]);
    } finally {
      setLoading(false);
    }
  }, [userId, backendUrl]); // Depend on userId and backendUrl

  // Fetch saved wallpapers on component mount
  useEffect(() => {
    fetchSavedWallpapers();
  }, [fetchSavedWallpapers]); // Re-run when fetchSavedWallpapers changes

  // Handle sidebar item click for navigation (re-using MainLayout's prop)
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }
    navigate(path);
  };

  // Handle profile click (can be same as in Home)
  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    // You might want to navigate to a specific user's profile page: navigate(`/profile/${profileId}`);
  };

  // Handle wallpaper click (can be same as in Home)
  const handleWallpaperClick = (wallpaperId) => {
    console.log('Navigate to wallpaper:', wallpaperId);
    // navigate(`/wallpaper/${wallpaperId}`);
  };

  // Handle hashtag click (similar to Home, can initiate a search)
  const handleHashtagClick = (hashtag) => {
    console.log('Search for hashtag:', hashtag);
    // You might navigate to the Home page with a pre-filled search query
    navigate(`/desktop/?search=${encodeURIComponent(hashtag)}`);
  };

  // Handle user profile click from header (re-using MainLayout's prop)
  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/desktop/profile');
    }
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

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
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
      onUserProfileClick={handleUserProfileClick}
    >
      {/* Page Title Section */}
      <div className="pb-6 border-b border-gray-300">
        <h1 className="text-black text-4xl font-semibold" style={customTextStyle}>
          Saved Wallpapers
        </h1>
      </div>

      {loading && savedWallpapers.length === 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletonCards()}
          </div>
        </div>
      )}

      {!loading && savedWallpapers.length === 0 && (
        <div className="pt-6 flex justify-center">
          <div className="text-gray-600 text-lg" style={customTextStyle}>
            No saved wallpapers found. Start saving some!
          </div>
        </div>
      )}

      {savedWallpapers.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedWallpapers.map((wallpaper) => (
              <WallpaperCard
                key={wallpaper.id || wallpaper._id}
                wallpaper={wallpaper}
                userId={userId} // Pass current user ID to WallpaperCard
                onProfileClick={handleProfileClick}
                onWallpaperClick={handleWallpaperClick}
                onHashtagClick={handleHashtagClick}
              />
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Saved;