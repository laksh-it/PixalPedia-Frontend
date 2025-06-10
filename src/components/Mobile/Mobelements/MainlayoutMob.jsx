// src/Mobelements/MainlayoutMob.js
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'; // Removed useCallback
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
    console.log('Route changed to:', location.pathname);

    if (mainContentRef.current) {
      console.log('Resetting scroll on mainContentRef');
      mainContentRef.current.scrollTop = 0;
    }

    // Also try to reset scroll on window and document
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Try to find and reset any scrollable elements
    const scrollableElements = document.querySelectorAll('[class*="overflow-y-auto"]');
    scrollableElements.forEach((element, index) => {
      console.log(`Resetting scroll on element ${index}:`, element);
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
        localStorage.removeItem('userId');
        return;
      }

      // **IMPORTANT: The dependency array warning refers to this line.**
      // If loggedInUserProfile changes, we might need to re-evaluate if we need to fetch.
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

    // Add loggedInUserProfile to the dependency array
    fetchUserProfile();
  }, [userId, backendUrl, loggedInUserProfile]); // Corrected dependency array

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

  // --- Layout Classes ---
  const mobileHeaderHeightPx = 64;
  const mobileBottomNavHeightPx = 64;

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
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93My5vcmcvMjAyMDQwNDyMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjEwLjI1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0wIDRWNDBDMTMuNzY5NSAzNC42OTIxIDI2LjIzMDUgMzQuNjkyMSA0MCA0MEM0MCAyNy40NzQyIDMyLjMxNjMgMTguNzYxNSAyMy42MTk4IDE0LjczMzlWMzkuNzYxMkMwIDM5Ljc4ODkgMCAzOS45OTc3IDAgNDZaIiBmaWxsPSIjNURGNjQ2MCIvPgo=';
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

      {/* Main Content Container - no overflow here */}
      <div
        className={`flex-1 bg-white flex flex-col`}
        style={{ paddingTop: `${mobileHeaderHeightPx}px`, paddingBottom: `${mobileBottomNavHeightPx}px` }}
      >
        {/* Actual scrollable content area */}
        <main
          key={location.pathname} // This is good for forcing re-render of children if needed for other reasons
          ref={mainContentRef}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (black background, fixed) */}
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

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MainLayout;