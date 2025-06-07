import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../../Web Image/logoStrip.png"; // Assuming this is your wide logo
// Removed logobr import as it's not in the screenshot and we're sticking to the icon-only layout
import wrapperFetch from '../../Middleware/wrapperFetch'; // Import wrapperFetch

const MainLayout = ({
  children,
  activeSidebarItem,
  onSidebarItemClick,
  username,
  onUserProfileClick
}) => {
  const navigate = useNavigate();

  const [loggedInUserProfile, setLoggedInUserProfile] = useState(() => {
    try {
      const storedDp = localStorage.getItem('userDp');
      const storedUsername = localStorage.getItem('username');
      if (storedDp && storedUsername) {
        return { dp: storedDp, username: storedUsername };
      }
    } catch (error) {
      console.error("Failed to read userDp from localStorage:", error);
    }
    return null;
  });

  const userId = localStorage.getItem('userId');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.log('userId not found in localStorage, cannot fetch profile in MainLayout.');
        setLoggedInUserProfile(null);
        localStorage.removeItem('userDp');
        return;
      }

      let shouldFetch = true;
      if (loggedInUserProfile?.dp && loggedInUserProfile?.username) {
        shouldFetch = false;
      }

      if (shouldFetch) {
        try {
          // Corrected template literal string for wrapperFetch
          const response = await wrapperFetch(`${backendUrl}/api/fetch/profilegate/${userId}/${userId}`);
          if (response && response.profile) {
            setLoggedInUserProfile(response.profile);
            localStorage.setItem('userDp', response.profile.dp || '');
            if (response.profile.username) {
              localStorage.setItem('username', response.profile.username);
            }
          } else {
            console.warn('Logged-in user profile not found or response invalid for ID:', userId);
            setLoggedInUserProfile(null);
            localStorage.removeItem('userDp');

            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
              setLoggedInUserProfile({ username: storedUsername, dp: null });
            }
          }
        } catch (error) {
          console.error('Error fetching logged-in user profile in MainLayout:', error);
          localStorage.removeItem('userDp');

          const storedUsername = localStorage.getItem('username');
          if (storedUsername) {
            setLoggedInUserProfile({ username: storedUsername, dp: null });
          } else {
            setLoggedInUserProfile(null);
          }
        }
      }
    };

    fetchUserProfile();
  }, [userId, backendUrl]);

  const userDp = loggedInUserProfile?.dp;

  const handleHeaderUserProfileClick = () => {
    if (onUserProfileClick && typeof onUserProfileClick === 'function') {
      onUserProfileClick(loggedInUserProfile?.id || loggedInUserProfile?.user_id);
    } else {
      if (userId) {
        navigate('/tablet/profile');
      } else {
        console.warn("Cannot navigate to own profile: userId not available.");
      }
    }
  };

  const sidebarItems = [
    { name: 'Home', icon: 'fas fa-home', path: '/tablet/home', label: 'Home' },
    { name: 'Profile', icon: 'fas fa-user', path: '/tablet/profile', label: 'Profile' },
    { name: 'Create', icon: 'fas fa-plus', path: '/tablet/create', label: 'Create' },
    { name: 'Saved', icon: 'fas fa-bookmark', path: '/tablet/saved', label: 'Saved' },
    { name: 'Gallery', icon: 'fas fa-images', path: '/tablet/gallery', label: 'Gallery' },
    { name: 'Insights', icon: 'fas fa-chart-line', path: '/tablet/insights', label: 'Insights' },
    { name: 'Settings', icon: 'fas fa-cog', path: '/tablet/Settings', label: 'Settings' },
  ];

  // Reverting to previous sidebar/header dimensions for icon-only mode
  const sidebarWidthClass = 'w-20'; // 80px wide
  const mainContentMlClass = 'ml-20'; // Margin-left for main content to match sidebar width
  const headerHeightClass = 'h-16'; // 64px tall
  const mainContentMtClass = 'mt-16'; // Margin-top for main content to match header height


  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar - Icon-only for Tablet, with reduced top padding */}
      <div className={`fixed top-0 left-0 h-screen ${sidebarWidthClass} bg-black p-4 flex flex-col items-center pt-4`}> {/* Changed pt-8 to pt-4 here */}
        {/* Logo at the top - size remains w-20 */}
        <div className="mb-8">
          <img src={logo} alt="Logo" className="w-18 h-auto" /> {/* Logo size remains w-20 */}
        </div>
        <nav className="flex-grow w-full">
          <ul className="space-y-6">
            {sidebarItems.map((item, index) => (
              <li
                key={item.name + index}
                onClick={() => onSidebarItemClick(item.name, item.path)}
                title={item.label}
                className={`flex items-center justify-center p-3 rounded-md cursor-pointer transition-colors
                            ${activeSidebarItem === item.name ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#1A1A1A] text-gray-400 hover:text-white'}`}
              >
                <i
                  className={`${item.icon}`}
                  style={{ fontSize: '24px' }}
                ></i>
              </li>
            ))}
          </ul>
        </nav>
        {/* The logobr div is removed as per the previous discussion, focusing on the screenshot */}
      </div>

      {/* Main Content Container */}
      <div className={`${mainContentMlClass} flex-1 flex flex-col h-screen overflow-hidden`}>
        {/* Header - Reverted to h-16 and left-20 */}
        <header className={`fixed top-0 left-20 right-0 z-10 bg-black ${headerHeightClass} flex items-center justify-end border-b border-black px-5`}>
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={handleHeaderUserProfileClick}
          >
            <span
              className="text-white text-lg hidden sm:block"
              style={customTextStyle}
            >
              {username}
            </span>
            <div className="w-9 h-9 rounded-full overflow-hidden"> {/* Reverted to w-9 h-9 */}
              {userDp ? (
                <img
                  src={userDp}
                  alt={username || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iMTAuMjUiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTAgNDBWNDBDMTMuNzY5NSAzNC42OTIxIDI2LjIzMDUgMzQuNjkyMSA0MCA0MEM0MCAyNy40NzQyIDMyLjMxNjMgMTguNzYxNSAyMy42MTk4IDE0Ljc0NDFDMTQuOTIzMyAxMC43MjY3IDUuODY2NjUgMTAuNzI2NyAwIDE0LjczMzlWMzkuNzYxMkMwIDM5Ljc4ODkgMCAzOS45OTc3IDAgNDBaIiBmaWxsPSIjNURGNjQ2MCIvPgo=';
                    localStorage.removeItem('userDp');
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

        {/* Content Area */}
        <main className={`${mainContentMtClass} flex-1 overflow-y-auto bg-gray-200 rounded-tl-2xl p-6`}>
          {children}
        </main>
      </div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MainLayout;