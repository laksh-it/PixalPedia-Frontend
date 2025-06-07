import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainLayout'; // Adjust path as needed
import wrapperFetch from '../Middleware/wrapperFetch'; // Adjust path as needed

const Gallery = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Gallery'); // Highlight "Gallery" in sidebar

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const username = localStorage.getItem('username'); // Get username for MainLayout
  const userId = localStorage.getItem('userId'); // Needed for MainLayout's user profile click

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Function to fetch categories
  const fetchCategories = useCallback(async () => {
    // --- IMPORTANT: ADD THIS CHECK HERE ---
    // If userId is missing, prevent the API call and show an error/loading state.
    if (!userId) {
      console.log('User not logged in, skipping category fetch.');
      setLoading(false); // Stop loading state
      setError('You must be logged in to view categories.'); // Optional: set a relevant error message
      return; // Exit the function early
    }
    // --- END OF ADDED CHECK ---

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
  }, [backendUrl, userId]); // Add userId to dependency array

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // Re-run when fetchCategories changes

  // Handle sidebar item click for navigation (re-using MainLayout's prop)
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }
    navigate(path);
  };

  // Handle user profile click from header (re-using MainLayout's prop)
  const handleUserProfileClick = () => {
    if (userId) {
      console.log('Navigate to own profile:', userId);
      navigate('/desktop/profile');
    }
  };

  // Handle category click to navigate to wallpapers by category
  const handleCategoryClick = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryName = category ? category.name : '';
    console.log('Navigating to category:', categoryId);
    navigate(`/desktop/gallery/wallpaper/${categoryId}/${categoryName}`);
  };

  // Placeholder for skeleton cards (can be a simple div or a more complex skeleton component)
  const renderSkeletonCards = () => {
    return Array.from({ length: 9 }, (_, index) => ( // Render 9 skeletons for categories
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

  // --- Display login message if userId is missing ---
  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view categories</p>
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
          Category Gallery
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
      {loading && categories.length === 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {renderSkeletonCards()}
          </div>
        </div>
      )}

      {/* No Categories Found State */}
      {!loading && categories.length === 0 && !error && (
        <div className="pt-6 flex justify-center">
          <div className="text-gray-600 text-lg" style={customTextStyle}>
            No categories found.
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
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
                  // Fallback for broken images
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = `https://placehold.co/400x400/cccccc/333333?text=${category.name.charAt(0).toUpperCase()}`;
                    e.target.style.objectFit = 'contain'; // Adjust object-fit for placeholder
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-lg font-bold truncate" style={customTextStyle}>
                    {category.name}
                  </p>
                </div>
                {/* Always visible name at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <p className="text-white text-lg font-bold truncate" style={customTextStyle}>
                    {category.name}
                  </p>
                </div>
              </div>
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

export default Gallery;