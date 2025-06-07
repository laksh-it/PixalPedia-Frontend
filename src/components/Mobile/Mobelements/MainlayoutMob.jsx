// src/Mobelements/MainlayoutMob.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from "../../Web Image/logoStrip.png";
import wrapperFetch from '../../Middleware/wrapperFetch';

const MainLayout = ({
  children,
  // Removed these props as their functionality is now handled internally or moved
  // activeSidebarItem,
  // onSidebarItemClick,
  // username,
  // onUserProfileClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem('userId');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://pixalpedia-backend.onrender.com';

  const [loggedInUserProfile, setLoggedInUserProfile] = useState(() => {
    try {
      const storedDp = localStorage.getItem('userDp');
      const storedUsername = localStorage.getItem('username');
      const storedUserId = localStorage.getItem('userId');
      if (storedDp && storedUsername && storedUserId) {
        return { dp: storedDp, username: storedUsername, id: storedUserId };
      }
    } catch (error) {
      console.error("Failed to read user data from localStorage:", error);
    }
    return null;
  });

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- Fetch User Profile ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.log('userId not found in localStorage, cannot fetch profile in MainLayout.');
        setLoggedInUserProfile(null);
        localStorage.removeItem('userDp');
        localStorage.removeItem('username');
        localStorage.removeItem('userId'); // Ensure userId is also cleared
        return;
      }

      // Check if the profile is already loaded for the current user
      if (loggedInUserProfile?.id === userId && loggedInUserProfile?.dp && loggedInUserProfile?.username) {
        return;
      }

      try {
        const response = await wrapperFetch(`${backendUrl}/api/fetch/profilegate/${userId}/${userId}`);
        if (response && response.profile) {
          setLoggedInUserProfile(response.profile);
          localStorage.setItem('userDp', response.profile.dp || '');
          if (response.profile.username) {
            localStorage.setItem('username', response.profile.username);
          }
        } else {
          console.warn('Logged-in user profile not found or response invalid for ID:', userId);
          const storedUsername = localStorage.getItem('username');
          setLoggedInUserProfile(storedUsername ? { username: storedUsername, dp: null, id: userId } : null);
          localStorage.removeItem('userDp');
        }
      } catch (error) {
        console.error('Error fetching logged-in user profile in MainLayout:', error);
        const storedUsername = localStorage.getItem('username');
        setLoggedInUserProfile(storedUsername ? { username: storedUsername, dp: null, id: userId } : null);
        localStorage.removeItem('userDp');
      }
    };

    fetchUserProfile();
  }, [userId, backendUrl]);


  const userDp = loggedInUserProfile?.dp;
  const username = loggedInUserProfile?.username; // Get username from internal state

  // --- Click handler for mobile bottom nav items ---
  const handleMobileNavItemClick = (path) => {
    navigate(path);
  };

  // --- Click handler for profile in header ---
  const handleHeaderProfileClick = () => {
    if (userId) {
      navigate('/mobile/profile');
    }
  };

  // Mobile Bottom Nav items - Icon-only
  const mobileNavItems = [
    { name: 'Home', icon: 'fas fa-home', path: '/mobile/home' },
    { name: 'Gallery', icon: 'fas fa-images', path: '/mobile/gallery' },
    { name: 'Create', icon: 'fas fa-plus-square', path: '/mobile/create' },
    { name: 'Saved', icon: 'fas fa-bookmark', path: '/mobile/saved' },
    { name: 'Insights', icon: 'fas fa-chart-line', path: '/mobile/insights' }, // New 'Insights' button
  ];

  // --- Layout Classes ---
  const mobileHeaderHeightPx = 64; // Corresponds to h-16 (4rem * 16px/rem = 64px)
  const mobileBottomNavHeightPx = 64; // Adjusted to h-16 (4rem * 16px/rem = 64px) - previously h-20 (80px)

  return (
    <div className="min-h-screen bg-white flex flex-col md:hidden">

      {/* Mobile Header (black background, fixed, logo left, profile right) */}
      <header className={`fixed top-0 left-0 right-0 z-20 bg-black h-16 flex items-center justify-between px-4 border-b border-gray-800`}>
        {/* Logo */}
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>
        {/* Profile on right side of header */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleHeaderProfileClick}
        >
          <span
            className="text-white text-base truncate max-w-[80px] sm:max-w-[120px]" // Added truncate for long names
            style={customTextStyle}
          >
            {username || 'Guest'}
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-white transition-colors"> {/* Changed w-8 h-8 */}
            {userDp ? (
              <img
                src={userDp}
                alt={username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93My5vcmcvMjAyMDQwNDyMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjEwLjI1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0wIDRWNDBDMTMuNzY5NSAzNC42OTIxIDI2LjIzMDUgMzQuNjkyMSA0MCA0MEM0MCAyNy40NzQyIDMyLjMxNjMgMTguNzYxNSAyMy42MTk4IDE0LjczMzlWMzkuNzYxMkMwIDM5Ljc4ODkgMCAzOS45OTc3IDAgNDZaIiBmaWxsPSIjNURGNjQ2MCIvPgo='; // Placeholder for user icon
                  localStorage.removeItem('userDp');
                  setLoggedInUserProfile(prev => ({ ...prev, dp: null }));
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <i className="fas fa-user text-white text-sm"></i>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (white background, padded for header/footer) */}
      <div className={`flex-1 bg-white overflow-y-auto`}
           style={{ paddingTop: `${mobileHeaderHeightPx}px`, paddingBottom: `${mobileBottomNavHeightPx}px` }}>
        {children}
      </div>

      {/* Mobile Bottom Navigation Bar (black background, fixed) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-20 bg-black h-16 flex items-center justify-around border-t border-gray-800`}> {/* Changed h-20 to h-16 */}
        {mobileNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMobileNavItemClick(item.path)}
            className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 ${
              location.pathname.startsWith(item.path) ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className={`${item.icon} text-2xl`}></i> {/* Changed text-xl to text-2xl and removed mb-1 */}
            {/* Removed <span>{item.name}</span> */}
          </button>
        ))}
      </nav>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MainLayout;