// src/Mobelements/MainlayoutMob.js
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from "../../Web Image/logoStrip.png";
import wrapperFetch from '../../Middleware/wrapperFetch';

const MainLayout = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef(null);

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

  // Reset scroll position when route changes
  useLayoutEffect(() => {
    // console.log('Route changed to:', location.pathname); // Keep for debugging if needed

    if (mainContentRef.current) {
      // console.log('Resetting scroll on mainContentRef'); // Keep for debugging if needed
      mainContentRef.current.scrollTop = 0;
    }

    // Also try to reset scroll on window and document (good for general safety)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Try to find and reset any scrollable elements (might be redundant if mainContentRef is the only one)
    const scrollableElements = document.querySelectorAll('[class*="overflow-y-auto"]');
    scrollableElements.forEach((element) => {
      // console.log(`Resetting scroll on element:`, element); // Keep for debugging if needed
      element.scrollTop = 0;
    });

  }, [location.pathname]);

  // --- Fetch User Profile ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.log('userId not found in localStorage, cannot fetch profile in MainLayout.');
        setLoggedInUserProfile(null);
        localStorage.removeItem('userDp');
        localStorage.removeItem('username');
        localStorage.removeItem('userId'); // Ensure userId is also cleared if not found
        return;
      }

      // If we already have a valid profile fetched and it matches the current userId, don't re-fetch
      if (loggedInUserProfile?.id === userId && loggedInUserProfile?.dp && loggedInUserProfile?.username) {
        return;
      }

      try {
        const response = await wrapperFetch(`${backendUrl}/api/fetch/profilegate/${userId}/${userId}`);
        if (response && response.profile) {
          setLoggedInUserProfile(response.profile);
          // Store DP and username to localStorage for future quick access
          localStorage.setItem('userDp', response.profile.dp || ''); // Store empty string if no DP
          if (response.profile.username) {
            localStorage.setItem('username', response.profile.username);
          }
          if (response.profile.id) { // Ensure the ID is also stored if returned by API
            localStorage.setItem('userId', response.profile.id);
          }
        } else {
          console.warn('Logged-in user profile not found or response invalid for ID:', userId);
          const storedUsername = localStorage.getItem('username');
          // If fetch fails, try to use stored username, but clear DP
          setLoggedInUserProfile(storedUsername ? { username: storedUsername, dp: null, id: userId } : null);
          localStorage.removeItem('userDp');
          // Don't remove username/userId here, as they might be from auth
        }
      } catch (error) {
        console.error('Error fetching logged-in user profile in MainLayout:', error);
        const storedUsername = localStorage.getItem('username');
        // If fetch fails, try to use stored username, but clear DP
        setLoggedInUserProfile(storedUsername ? { username: storedUsername, dp: null, id: userId } : null);
        localStorage.removeItem('userDp');
        // Don't remove username/userId here, as they might be from auth
      }
    };

    fetchUserProfile();
  }, [userId, backendUrl, loggedInUserProfile]); // Corrected dependency array for `useEffect`

  const userDp = loggedInUserProfile?.dp;
  const username = loggedInUserProfile?.username;

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
    { name: 'Insights', icon: 'fas fa-chart-line', path: '/mobile/insights' },
  ];

  // Define fixed heights based on Tailwind's h-16 (16 * 4 = 64px)
  const mobileHeaderHeightPx = 64;
  const mobileBottomNavHeightPx = 64;

  return (
    // Root container: full screen, flex column. `relative` is good for fixed children positioning.
    <div className="relative min-h-screen bg-white flex flex-col md:hidden">

      {/* Mobile Header (fixed, sits on top) */}
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
            className="text-white text-base truncate max-w-[80px] sm:max-w-[120px]"
            style={customTextStyle}
          >
            {username || 'Guest'}
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-white transition-colors">
            {userDp ? (
              <img
                src={userDp}
                alt={username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjE2IiByPSIxMC4yNSIgZmlsbD0iIjlDQTM0NiIvPgo8cGF0aCBkPSJNMCA0VjQwQzEzLjc2OTUgMzQuNjkyMSAyNi4yMzA1IDM0LjY5MjEgNDAgNDBDNDAgMjcuNDc0MiAzMi4zMTYzIDE4Ljc2MTUgMjMuNjE5OCAxNC43MzM5VjM5Ljc2MTJDMCAzOS43ODg5IDAgMzkuOTk3NyAwIDQ2WiIgZmlsbD0iIzVDRjY0NjAiLz4KPC9zdmc+'; // A more generic fallback SVG
                  localStorage.removeItem('userDp');
                  setLoggedInUserProfile(prev => ({ ...prev, dp: null })); // Also update state to reflect no DP
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

      {/* Main Content Area */}
      {/* This `main` element now takes up the remaining flexible space and has margins
          to push it away from the fixed header and footer. */}
      <main
        key={location.pathname} // Good for forcing re-render/scroll reset when path changes
        ref={mainContentRef}
        className="flex-1 overflow-y-auto bg-white" // `flex-1` makes it grow, `overflow-y-auto` makes it scrollable
        style={{
          marginTop: `${mobileHeaderHeightPx}px`, // Space for the fixed header
          marginBottom: `${mobileBottomNavHeightPx}px` // Space for the fixed bottom nav
        }}
      >
        {children} {/* Your page content goes here */}
      </main>

      {/* Mobile Bottom Navigation Bar (fixed) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-20 bg-black h-16 flex items-center justify-around border-t border-gray-800`}>
        {mobileNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMobileNavItemClick(item.path)}
            className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 ${
              location.pathname.startsWith(item.path) ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className={`${item.icon} text-2xl`}></i>
          </button>
        ))}
      </nav>

      {/* Font Awesome link */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MainLayout;