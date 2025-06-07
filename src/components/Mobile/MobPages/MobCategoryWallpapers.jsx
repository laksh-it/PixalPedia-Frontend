import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob';
import MobileWallpapercard from '../Mobelements/MobProWallpaperCard'; // Assuming a mobile-specific wallpaper card component
import WallpaperSkeleton from '../../elements/SkeletonCard';
import wrapperFetch from '../../Middleware/wrapperFetch';

const CategoryWallpapers = () => {
  const { categoryId, categoryName: urlCategoryName } = useParams();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryName, setCategoryName] = useState(urlCategoryName || 'Category');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Gallery');

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const fetchCategoryWallpapers = useCallback(async () => {
    if (!userId) {
      console.log('User not logged in, skipping category wallpaper fetch.');
      setLoading(false);
      setError('You must be logged in to view wallpapers for this category.');
      return;
    }

    if (!categoryId) {
      setError('Category ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const currentUserId = userId;
      const endpoint = `${backendUrl}/api/fetch/category-wallpapers/${categoryId}/${currentUserId}`;
      console.log('Fetching wallpapers for category from:', endpoint);

      const response = await wrapperFetch(endpoint);

      if (response && response.wallpapers) {
        setWallpapers(response.wallpapers);
      } else {
        setWallpapers([]);
        console.log('No wallpapers found for this category or invalid response.');
      }
    } catch (err) {
      console.error('Error fetching category wallpapers:', err);
      setError('Failed to load wallpapers for this category. Please try again later.');
      setWallpapers([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, userId, backendUrl]);

  useEffect(() => {
    fetchCategoryWallpapers();
  }, [fetchCategoryWallpapers]);

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked (if applicable on mobile)');
      return;
    }
    navigate(path);
  };

  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/mobile/profile');
    }
  };

  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    navigate(`/mobile/profile/${profileId}`);
  };

  const handleWallpaperClick = (wallpaperId) => {
    console.log('Navigate to wallpaper:', wallpaperId);
    navigate(`/mobile/wallpaper/${wallpaperId}`);
  };

  const handleHashtagClick = (hashtag) => {
    console.log('Search for hashtag:', hashtag);
    navigate(`/mobile/?search=${encodeURIComponent(hashtag)}`);
  };

  const renderSkeletonCards = () => {
    // Render 4 skeletons for initial view, as it's a single column now
    return Array.from({ length: 4 }, (_, index) => (
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view category wallpapers</p>
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
      {/* This main wrapper div gives the entire content area a grayish background */}
      <div className="bg-gray-200 min-h-screen">
        {/* Page Title Section - Already included in the gray background */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold md:text-4xl" style={customTextStyle}>
            Wallpapers in {categoryName}
          </h1>
        </div>

        {/* Content Area - Already included in the gray background */}
        <div className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                <p className="text-red-700 text-sm md:text-base" style={customTextStyle}>{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && wallpapers.length === 0 && (
            <div className="grid grid-cols-1 gap-5">
              {renderSkeletonCards()}
            </div>
          )}

          {/* No Wallpapers Found State */}
          {!loading && wallpapers.length === 0 && !error && (
            <div className="flex justify-center pt-4">
              <div className="text-gray-600 text-base md:text-lg" style={customTextStyle}>
                No wallpapers found for this category.
              </div>
            </div>
          )}

          {/* Wallpapers Grid */}
          {wallpapers.length > 0 && (
            <div className="grid grid-cols-1 gap-5">
              {wallpapers.map((wallpaper) => (
                <MobileWallpapercard
                  key={wallpaper.id}
                  wallpaper={wallpaper}
                  userId={userId}
                  onProfileClick={handleProfileClick}
                  onWallpaperClick={handleWallpaperClick}
                  onHashtagClick={handleHashtagClick}
                />
              ))}
            </div>
          )}
        </div> {/* End of px-6 py-4 content area */}
      </div> {/* End of bg-gray-200 wrapper */}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default CategoryWallpapers;