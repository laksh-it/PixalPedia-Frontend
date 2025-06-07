// src/components/Mobile/MobPages/Gallery.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob'; // Path should be correct now
import wrapperFetch from '../../Middleware/wrapperFetch';

const Gallery = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Gallery');

 const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const fetchCategories = useCallback(async () => {
    if (!userId) {
      console.log('User not logged in, skipping category fetch.');
      setLoading(false);
      setError('You must be logged in to view categories.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = `${backendUrl}/api/fetch/categories`;
      console.log('Fetching categories from:', endpoint);

      const response = await wrapperFetch(endpoint);

      if (response && response.categories) {
        setCategories(response.categories);
      } else {
        setCategories([]);
        console.log('No categories found or invalid response.');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const handleCategoryClick = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryName = category ? category.name : '';
    console.log('Navigating to category:', categoryId);
    navigate(`/mobile/gallery/wallpaper/${categoryId}/${categoryName}`);
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 9 }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className="relative w-full aspect-square bg-gray-300 rounded-xl overflow-hidden shadow-lg animate-pulse"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-400 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <div className="h-4 bg-gray-400 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    ));
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view categories</p>
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
        {/* Page Title Section - Already covered by the gray background */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold" style={customTextStyle}>
            Category Gallery
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg mx-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
              <p className="text-red-700 text-sm" style={customTextStyle}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && categories.length === 0 && (
          <div className="pt-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              {renderSkeletonCards()}
            </div>
          </div>
        )}

        {/* No Categories Found State */}
        {!loading && categories.length === 0 && !error && (
          <div className="pt-4 flex justify-center px-4">
            <div className="text-gray-600 text-base" style={customTextStyle}>
              No categories found.
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length > 0 && (
          <div className="pt-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg cursor-pointer
                             transform transition-transform duration-200 hover:scale-105 hover:shadow-xl"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <img
                    src={category.thumbnail_url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/400x400/cccccc/333333?text=${category.name.charAt(0).toUpperCase()}`;
                      e.target.style.objectFit = 'contain';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/50 to-transparent">
                    <p className="text-white text-base font-bold truncate" style={customTextStyle}>
                      {category.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> {/* End of bg-gray-200 wrapper */}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default Gallery;