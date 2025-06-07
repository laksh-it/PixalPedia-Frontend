import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../Web Image/logo 2.png";
import logobr from "../Web Image/Laksh.png";
import wrapperFetch from '../Middleware/wrapperFetch'; // Import wrapperFetch

const MainLayout = ({
  children,
  activeSidebarItem,
  onSidebarItemClick,
  username, // We'll still use the username prop for display
  onUserProfileClick // This prop is still useful if parent wants to override click behavior
}) => {
  const navigate = useNavigate();

  // State to hold the logged-in user's profile fetched by MainLayout itself
  // Initialize with DP from localStorage if available
  const [loggedInUserProfile, setLoggedInUserProfile] = useState(() => {
    try {
      const storedDp = localStorage.getItem('userDp');
      const storedUsername = localStorage.getItem('username'); // Also check for username
      if (storedDp && storedUsername) {
        return { dp: storedDp, username: storedUsername };
      }
    } catch (error) {
      console.error("Failed to read userDp from localStorage:", error);
    }
    return null;
  });

  const userId = localStorage.getItem('userId'); // Get userId directly from localStorage
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Custom text style to match your site theme
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- DP fetching logic with localStorage optimization ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.log('userId not found in localStorage, cannot fetch profile in MainLayout.');
        setLoggedInUserProfile(null); // Ensure profile is null if not logged in
        localStorage.removeItem('userDp'); // Clear potentially stale DP
        // DON'T remove username here - it might be needed for auth
        return;
      }

      let shouldFetch = true;
      // If we have a stored DP and username, assume it's valid for now
      if (loggedInUserProfile?.dp && loggedInUserProfile?.username) {
        shouldFetch = false; // Don't fetch immediately, assume stored is good
      }

      if (shouldFetch) {
        try {
          const response = await wrapperFetch(`${backendUrl}/api/fetch/profilegate/${userId}/${userId}`);
          if (response && response.profile) {
            setLoggedInUserProfile(response.profile);
            // Save DP and username to localStorage for future quick access
            localStorage.setItem('userDp', response.profile.dp || ''); // Store empty string if no DP
            // Only update username if we got a valid one from the API
            if (response.profile.username) {
              localStorage.setItem('username', response.profile.username);
            }
            // If API doesn't return username, preserve what's already in localStorage
          } else {
            console.warn('Logged-in user profile not found or response invalid for ID:', userId);
            setLoggedInUserProfile(null); // Clear profile if not found
            localStorage.removeItem('userDp'); // Clear if fetch fails
            // DON'T remove username - preserve it from auth
            
            // Try to reconstruct profile from localStorage if username exists
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
              setLoggedInUserProfile({ username: storedUsername, dp: null });
            }
          }
        } catch (error) {
          console.error('Error fetching logged-in user profile in MainLayout:', error);
          localStorage.removeItem('userDp'); // Clear if fetch fails
          // DON'T remove username - preserve it from auth
          
          // Try to reconstruct profile from localStorage if username exists
          const storedUsername = localStorage.getItem('username');
          if (storedUsername) {
            setLoggedInUserProfile({ username: storedUsername, dp: null });
          } else {
            setLoggedInUserProfile(null); // Only clear if no username available
          }
        }
      }
    };

    fetchUserProfile();
    // This effect runs once on mount, and then if userId or backendUrl changes.
    // It doesn't re-run if loggedInUserProfile changes, to prevent infinite loops
    // since loggedInUserProfile is updated *by* this effect.
  }, [userId, backendUrl]); // Re-run effect if userId or backendUrl changes


  // Safely access the user's DP URL from the internal loggedInUserProfile state
  const userDp = loggedInUserProfile?.dp;

  // Handle click on the user's profile in the header
  const handleHeaderUserProfileClick = () => {
    if (onUserProfileClick && typeof onUserProfileClick === 'function') {
      // Pass the loggedInUserProfile's ID if the parent handler expects it
      onUserProfileClick(loggedInUserProfile?.id || loggedInUserProfile?.user_id);
    } else {
      // Default navigation to the logged-in user's own profile
      if (userId) {
        navigate('/desktop/profile'); // Assuming '/profile' is your own profile route
      } else {
        console.warn("Cannot navigate to own profile: userId not available.");
        // Optionally navigate to a login page or guest profile if not logged in
      }
    }
  };


const sidebarItems = [
  { name: 'Home', icon: 'fas fa-home', path: '/desktop/home' },
  { name: 'Profile', icon: 'fas fa-user', path: '/desktop/profile' },
  { name: 'Create', icon: 'fas fa-plus', path: '/desktop/create' },
  { name: 'Saved', icon: 'fas fa-bookmark', path: '/desktop/saved' },
  { name: 'Gallery', icon: 'fas fa-images', path: '/desktop/gallery' },
  { name: 'Insights', icon: 'fas fa-chart-line', path: '/desktop/insights' }, // New option replacing Notifications
  { name: 'Settings', icon: 'fas fa-cog', path: '/desktop/Settings' },
  { name: 'More', icon: 'fas fa-bars', path: '/desktop/More' }
];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed top-0 left-0 h-screen w-[18%] bg-black p-6 pt-10">
          <div className="mb-8">
            <img src={logo} alt="Logo" className="w-32 h-auto" />
          </div>
          <nav>
            <ul className="space-y-4">
              {sidebarItems.map((item, index) => (
                <li
                  key={item.name + index}
                  onClick={() => onSidebarItemClick(item.name, item.path)}
                  // --- MODIFIED CLASSNAME HERE ---
                  className={`flex items-center space-x-3 cursor-pointer rounded-md p-2 transition-colors hover:bg-[#1A1A1A]
                  ${activeSidebarItem === item.name ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  // --- END MODIFIED CLASSNAME ---
                >
                  <i
                    className={`${item.icon}`} // Removed 'text-white' here, will inherit from parent <li>
                    style={{ fontSize: '20px', width: '20px', height: '20px' }}
                  ></i>
                  <span
                    style={{
                      fontSize: '26px',
                      fontFamily: '"WDXL Lubrifont TC", sans-serif',
                      fontWeight: activeSidebarItem === item.name ? 700 : 500
                    }}
                  >
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute bottom-6 left-0 w-full flex flex-col items-center">
            <div className="text-gray-400 text-xs mb-1">Powered By</div>
            <img src={logobr} alt="Icon Logo" className="w-28 h-auto" />
          </div>
        </div>

        {/* Main Content Container */}
        <div className="ml-[18%] flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="fixed top-0 left-[18%] right-0 z-10 bg-black h-20 flex items-center justify-end border-b border-black px-5">
            <div
              className="flex items-center justify-end space-x-3 cursor-pointer"
              onClick={handleHeaderUserProfileClick} // Use the internal handler
            >
              <span
                className="text-white"
                style={{
                  fontSize: '24px',
                  fontFamily: '"WDXL Lubrifont TC", sans-serif',
                  fontWeight: 500
                }}
              >
                {username}
              </span>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {/* Display DP if available, otherwise display a fallback icon */}
                {userDp ? (
                  <img
                    src={userDp}
                    alt={username || 'User'}
                    className="w-full h-full object-cover"
                    // Fallback in case the image fails to load
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRo IGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM1MxNi41IDUgMTYuNSAxMi41UzE0LjUgMTIgMTIgMTJaTTEyIDE0LjVDOSAxMy41IDYgMTYgNiAyMUgxOEMxOCAxNiAxNSAxMy41IDEyIDE0LjcgMlpJMiIgZmlsbD0iIjlDQTMlQUYiPjwvYnZnPgo=';
                      // If the image fails to load, also remove it from localStorage
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
          <main className="mt-20 flex-1 overflow-y-auto bg-gray-200 rounded-tl-2xl p-6">
            {children}
          </main>
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MainLayout;