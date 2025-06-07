import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob'; // Changed path for mobile layout
import MobileWallpapercard from '../Mobelements/MobProWallpaperCard'; // Changed to mobile-specific wallpaper card
import WallpaperSkeleton from '../../elements/SkeletonCard';
import wrapperFetch from '../../Middleware/wrapperFetch';

const Saved = () => {
  const [savedWallpapers, setSavedWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Saved');

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const fetchSavedWallpapers = useCallback(async () => {
    if (!userId) {
      console.log('No userId found, cannot fetch saved wallpapers');
      setLoading(false); // Ensure loading is false if not logged in
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
  }, [userId, backendUrl]);

  useEffect(() => {
    fetchSavedWallpapers();
  }, [fetchSavedWallpapers]);

  // Handle sidebar item click for navigation (now bottom nav for mobile)
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked (if applicable on mobile)');
      return;
    }
    navigate(path);
  };

  // Handle profile click (for MobileWallpapercard)
  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    navigate(`/mobile/profile/${profileId}`); // Changed to /mobile/profile
  };

  // Handle wallpaper click (for MobileWallpapercard)
  const handleWallpaperClick = (wallpaperId) => {
    console.log('Navigate to wallpaper:', wallpaperId);
    navigate(`/mobile/wallpaper/${wallpaperId}`); // Changed to /mobile/wallpaper
  };

  // Handle hashtag click (for MobileWallpapercard)
  const handleHashtagClick = (hashtag) => {
    console.log('Search for hashtag:', hashtag);
    navigate(`/mobile/?search=${encodeURIComponent(hashtag)}`); // Changed to /mobile/
  };

  // Handle user profile click from header (now usually from mobile bottom nav)
  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/mobile/profile'); // Changed to /mobile/profile
    }
  };

  const renderSkeletonCards = () => {
    // For mobile, maybe 4 skeletons is enough for initial view
    return Array.from({ length: 4 }, (_, index) => (
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
      {/* This main wrapper div makes the entire content area a grayish background */}
      <div className="bg-gray-200 min-h-screen">
        {/* Page Title Section - Adjusted for mobile, more space up */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold md:text-4xl" style={customTextStyle}>
            Saved Wallpapers
          </h1>
        </div>

        {loading && savedWallpapers.length === 0 && (
          <div className="pt-4 px-4">
            <div className="grid grid-cols-1 gap-5">
              {renderSkeletonCards()}
            </div>
          </div>
        )}

        {!loading && savedWallpapers.length === 0 && (
          <div className="pt-4 flex justify-center px-4">
            <div className="text-gray-600 text-base md:text-lg" style={customTextStyle}>
              No saved wallpapers found. Start saving some!
            </div>
          </div>
        )}

        {savedWallpapers.length > 0 && (
          <div className="pt-4 px-4">
            <div className="grid grid-cols-1 gap-5">
              {savedWallpapers.map((wallpaper) => (
                <MobileWallpapercard // Changed component to MobileWallpapercard
                  key={wallpaper.id || wallpaper._id}
                  wallpaper={wallpaper}
                  userId={userId}
                  onProfileClick={handleProfileClick}
                  onWallpaperClick={handleWallpaperClick}
                  onHashtagClick={handleHashtagClick}
                />
              ))}
            </div>
          </div>
        )}
      </div> {/* End of bg-gray-200 wrapper */}

      {/* Font Awesome (best practice: include in public/index.html to avoid duplication) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default Saved;