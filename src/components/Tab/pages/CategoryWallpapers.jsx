import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainlayoutTab'; // Adjust path as needed
import WallpaperCard from '../../Tab/elements/TabWallpapercard'; // Adjust path as needed
import WallpaperSkeleton from '../../elements/SkeletonCard'; // Re-use for loading state
import wrapperFetch from '../../Middleware/wrapperFetch'; // Adjust path as needed

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

  // Function to fetch wallpapers for the specific category
  const fetchCategoryWallpapers = useCallback(async () => {
    // --- IMPORTANT: ADD THIS CHECK HERE ---
    if (!userId) {
      console.log('User not logged in, skipping category wallpaper fetch.');
      setLoading(false); // Stop loading state
      setError('You must be logged in to view wallpapers for this category.'); // Optional: provide a message
      return; // Exit the function early if no user ID
    }
    // --- END OF ADDED CHECK ---

    if (!categoryId) {
      setError('Category ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Now, userId is guaranteed to be present if we reach this point
      const currentUserId = userId; // Use userId directly as we've checked for its existence
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
  }, [categoryId, userId, backendUrl]); // Add userId to the dependency array

  // Fetch wallpapers on component mount or when categoryId/userId changes
  useEffect(() => {
    fetchCategoryWallpapers();
  }, [fetchCategoryWallpapers]);

  // Handle sidebar item click for navigation
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }
    navigate(path);
  };

  // Handle user profile click from header
  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/tablet/profile');
    }
  };

  // Handle profile click (for WallpaperCard)
  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    navigate(`/tablet/profile/${profileId}`);
  };

  // Handle wallpaper click (for WallpaperCard)
  const handleWallpaperClick = (wallpaperId) => {
    console.log('Navigate to wallpaper:', wallpaperId);
    navigate(`/tablet/wallpaper/${wallpaperId}`);
  };

  // Handle hashtag click (for WallpaperCard)
  const handleHashtagClick = (hashtag) => {
    console.log('Search for hashtag:', hashtag);
    navigate(`/tablet/?search=${encodeURIComponent(hashtag)}`);
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

  // --- Display login message if userId is missing ---
  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view category wallpapers</p>
          <a
            href="/" // This link directs to your login/loading page when clicked
            className="bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
            style={customTextStyle}
          >
            Login
          </a>
        </div>
      </div>
    );
  }
  // --- END OF LOGIN MESSAGE BLOCK ---

  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
      onUserProfileClick={handleUserProfileClick}
    >
      {/* Page Title Section */}
      <div className="pb-6 border-b border-gray-300 mb-6">
        <h1 className="text-black text-4xl font-semibold" style={customTextStyle}>
          Wallpapers in {categoryName}
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
            <p className="text-red-700" style={customTextStyle}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && wallpapers.length === 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletonCards()}
          </div>
        </div>
      )}

      {/* No Wallpapers Found State */}
      {!loading && wallpapers.length === 0 && !error && (
        <div className="pt-6 flex justify-center">
          <div className="text-gray-600 text-lg" style={customTextStyle}>
            No wallpapers found for this category.
          </div>
        </div>
      )}

      {/* Wallpapers Grid */}
      {wallpapers.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallpapers.map((wallpaper) => (
              <WallpaperCard
                key={wallpaper.id}
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

      {/* Font Awesome for icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default CategoryWallpapers;