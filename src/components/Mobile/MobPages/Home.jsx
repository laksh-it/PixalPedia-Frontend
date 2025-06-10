import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WallpaperCard from '../Mobelements/MobWallpaperCard';
import WallpaperSkeleton from '../../elements/SkeletonCard';
import UserCard from '../Mobelements/MobUserCard'; // Corrected import for mobile UserCard
import wrapperFetch from '../../Middleware/wrapperFetch';
import logo from "../../Web Image/logoStrip.png";

const MobileHome = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [searchQuery, setSearchQuery] = useState('');
  const [wallpapers, setWallpapers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [noSearchResults, setNoSearchResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState('Wallpapers');

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

  const navigate = useNavigate();
  const location = useLocation();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://pixalpedia-backend.onrender.com';
  const userId = localStorage.getItem('userId');

  const tabs = [
    { name: 'For You', icon: 'fas fa-heart' },
    { name: 'Trending', icon: 'fas fa-fire' },
    { name: 'Newest', icon: 'fas fa-clock' }
  ];

  const searchTabs = ['Wallpapers', 'Profiles'];

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Cache functions
  const getCacheKey = (tab) => `wallpapers_${tab}_${userId}`;

  const isCacheValid = (tab) => {
    const cached = localStorage.getItem(getCacheKey(tab));
    return cached !== null;
  };

  const getCachedWallpapers = (tab) => {
    if (!isCacheValid(tab)) return null;
    const cached = localStorage.getItem(getCacheKey(tab));
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        console.error('Error parsing cached wallpapers:', error);
        localStorage.removeItem(getCacheKey(tab));
        return null;
      }
    }
    return null;
  };

  const setCachedWallpapers = (tab, data) => {
    try {
      localStorage.setItem(getCacheKey(tab), JSON.stringify(data));
    } catch (error) {
      console.error('Error caching wallpapers:', error);
    }
  };

  const clearCache = (tab) => {
    localStorage.removeItem(getCacheKey(tab));
  };

  // Fetch wallpapers function
  const fetchWallpapers = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      console.log('No userId found, cannot fetch wallpapers');
      setLoading(false); // Ensure loading is false if not logged in
      return;
    }

    if (!isSearchMode && !forceRefresh) {
      const cachedWallpapers = getCachedWallpapers(activeTab);
      if (cachedWallpapers) {
        setWallpapers(cachedWallpapers);
        console.log('Loaded persistent cached wallpapers for:', activeTab);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'For You':
          endpoint = `${backendUrl}/api/recommendations/${userId}`;
          break;
        case 'Trending':
          endpoint = `${backendUrl}/api/wallpapers/trending/${userId}`;
          break;
        case 'Newest':
          endpoint = `${backendUrl}/api/wallpapers/latest/${userId}`;
          break;
        default:
          endpoint = `${backendUrl}/api/recommendations/${userId}`;
      }

      console.log('Fetching wallpapers from:', endpoint);
      const response = await wrapperFetch(endpoint);

      if (response) {
        let wallpapersData = [];
        if (activeTab === 'For You' && response.recommendations) {
          wallpapersData = response.recommendations;
        } else if (response.wallpapers) {
          wallpapersData = response.wallpapers;
        }
        setWallpapers(wallpapersData);
        if (!isSearchMode) {
          setCachedWallpapers(activeTab, wallpapersData);
        }
      } else {
        setWallpapers([]);
        if (!isSearchMode) {
          clearCache(activeTab);
        }
      }
    } catch (error) {
      console.error('Error fetching wallpapers:', error);
      setWallpapers([]); // Clear wallpapers on error
      if (!isSearchMode) {
        clearCache(activeTab);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, userId, backendUrl, isSearchMode]);

  // Search function
  const handleSearch = useCallback(async (page = 0, searchTab = 'Wallpapers', query = searchQuery) => {
    const currentQuery = query.trim();
    if (!currentQuery || !userId) {
      setWallpapers([]);
      setProfiles([]);
      setNoSearchResults(true); // Indicate no search query entered
      setLoading(false);
      return;
    }

    setLoading(true);
    setNoSearchResults(false); // Reset no search results on new search

    try {
      let response;
      if (searchTab === 'Wallpapers') {
        response = await wrapperFetch(
          `${backendUrl}/api/search?q=${encodeURIComponent(currentQuery)}&refresh=${page}&user_id=${userId}`
        );
        if (response) {
          setNoSearchResults(response.wallpapers?.length === 0 && !response.fallback); // No results and no fallback
          const newWallpapers = response.wallpapers || [];
          if (page === 0) {
            setWallpapers(newWallpapers);
          } else {
            setWallpapers(prev => [...prev, ...newWallpapers]);
          }
          setHasNextPage(newWallpapers.length === 30); // Assuming 30 items per page for hasNextPage
          setSearchPage(page);
        } else {
          if (page === 0) setWallpapers([]);
          setNoSearchResults(true);
          setHasNextPage(false);
        }
        setProfiles([]); // Clear profiles when searching wallpapers
      } else if (searchTab === 'Profiles') {
        response = await wrapperFetch(
          `${backendUrl}/api/profile/search?username=${encodeURIComponent(currentQuery)}`
        );
        if (response && response.profile) {
          setProfiles([response.profile]);
          setNoSearchResults(false);
          setHasNextPage(false);
        } else {
          setProfiles([]);
          setNoSearchResults(true);
          setHasNextPage(false);
        }
        setWallpapers([]); // Clear wallpapers when searching profiles
      }
    } catch (error) {
      console.error(`Error searching ${searchTab.toLowerCase()}:`, error);
      setNoSearchResults(true); // Indicate error led to no results
      setWallpapers([]);
      setProfiles([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [userId, backendUrl, searchQuery]); // Depend on searchQuery as well

  // Handle hashtag click
  const handleHashtagClick = useCallback((hashtag) => {
    setSearchQuery(hashtag);
    setIsSearchMode(true);
    setActiveSearchTab('Wallpapers');
    setSearchPage(0);
    setWallpapers([]);
    setProfiles([]);
    setNoSearchResults(false);
    setHasNextPage(false);
    handleSearch(0, 'Wallpapers', hashtag);
  }, [handleSearch]);

  // Handle incoming navigation state for hashtags
  useEffect(() => {
    if (location.state && location.state.hashtag) {
      const incomingHashtag = location.state.hashtag;
      console.log('Incoming hashtag from navigation state:', incomingHashtag);
      handleHashtagClick(incomingHashtag);
      // Clear the state so it doesn't re-trigger on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, handleHashtagClick]);

  // Fetch wallpapers when activeTab changes or search mode changes
  useEffect(() => {
    if (!isSearchMode && userId && !location.state?.hashtag) {
      fetchWallpapers();
    }
  }, [activeTab, userId, isSearchMode, fetchWallpapers, location.state?.hashtag]);

  // User profile fetch for header DP/username
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setLoggedInUserProfile(null);
        localStorage.removeItem('userDp');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        return;
      }

      // Check if profile is already loaded and valid for the current user
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
        console.error('Error fetching logged-in user profile in Home component:', error);
        const storedUsername = localStorage.getItem('username');
        setLoggedInUserProfile(storedUsername ? { username: storedUsername, dp: null, id: userId } : null);
        localStorage.removeItem('userDp');
      }
    };

    fetchUserProfile();
  }, [userId, backendUrl]);

  // Handle refresh
  const handleRefresh = async () => {
    if (isSearchMode || loading) return; // Prevent refresh during search or if already loading
    console.log(`Manual refresh triggered for tab: ${activeTab}`);
    setIsRefreshing(true);
    clearCache(activeTab);
    await fetchWallpapers(true);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      setNoSearchResults(false); // Reset before new search
      setSearchPage(0);
      handleSearch(0, activeSearchTab, searchQuery);
    } else {
      handleClearSearch();
    }
  };

  // Handle tab change (For You, Trending, Newest)
  const handleTabChange = (tab) => {
    if (activeTab === tab && !isSearchMode) return;
    setActiveTab(tab);
    setIsSearchMode(false);
    setSearchQuery('');
    setNoSearchResults(false);
    setHasNextPage(false);
    setWallpapers([]);
    setProfiles([]);
    setActiveSearchTab('Wallpapers'); // Default to wallpapers when switching main tabs
    setShowDropdown(false); // Close dropdown on tab change
  };

  // Handle search tab change (Wallpapers, Profiles)
  const handleSearchTabChange = (tab) => {
    if (activeSearchTab === tab) return;
    setActiveSearchTab(tab);
    setWallpapers([]); // Clear current results for new search tab
    setProfiles([]);
    setNoSearchResults(false);
    setSearchPage(0);
    setHasNextPage(false);
    if (searchQuery.trim()) {
      handleSearch(0, tab, searchQuery);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setNoSearchResults(false);
    setHasNextPage(false);
    setWallpapers([]);
    setProfiles([]);
    setActiveSearchTab('Wallpapers'); // Reset to default search tab
    // If we were in search mode, fetch default tab wallpapers
    if (searchQuery.trim()) { // Only fetch if search was active before clearing
      fetchWallpapers();
    }
  };

  // Handle load next page for search results
  const handleLoadNextPage = () => {
    if (hasNextPage && !loading && isSearchMode && activeSearchTab === 'Wallpapers') {
      handleSearch(searchPage + 1, 'Wallpapers', searchQuery);
    }
  };

  // Mobile navigation items (for bottom nav)
  const mobileNavItems = [
    { name: 'Home', icon: 'fas fa-home', path: '/mobile/home' },
    { name: 'Gallery', icon: 'fas fa-images', path: '/mobile/gallery' },
    { name: 'Create', icon: 'fas fa-plus-square', path: '/mobile/create' },
    { name: 'Saved', icon: 'fas fa-bookmark', path: '/mobile/saved' },
    // Profile is handled separately in MainLayoutMob header/bottom nav
  ];

  // Handle mobile bottom nav item click
  const handleMobileNavItemClick = (path) => {
    navigate(path);
  };

  // Render skeleton cards for loading states
  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }, (_, index) => ( // Render enough to fill initial view
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

  const userDp = loggedInUserProfile?.dp;
  const displayUsername = loggedInUserProfile?.username || 'User';

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view wallpapers</p>
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
    <div className="min-h-screen bg-white flex flex-col"> {/* This outermost div likely defines the overall page background */}
      {/* Mobile Header (black background) - Remains fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-black h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* Search Bar (dark background to match header) */}
        <div className="flex-1 max-w-xs ml-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wallpapers or profiles..."
                className="w-full text-white bg-gray-900 border border-gray-700 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-white text-base"
                style={customTextStyle}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-search text-sm"></i>
              </button>
            </div>
            {isSearchMode && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 bg-gray-700 text-white rounded-md px-3 py-2 hover:bg-gray-600 text-sm"
                style={customTextStyle}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Main Content (grayish background for content area) - Padded for fixed header and footer */}
      <div className="flex-1 pt-16 pb-20 bg-gray-200"> {/* Changed bg-white to bg-gray-200 */}
        {/* Tab Selection/Search Info Section - Light background, remains at top of scrollable content */}
        {/* You might want this to inherit the bg-gray-200 or explicitly set it to bg-white if you want it to stand out */}
        <div className="px-4 py-4 border-b border-gray-300 bg-gray-200"> {/* Changed bg-white to bg-gray-200 */}
          {!isSearchMode ? (
            // Tabs for 'For You', 'Trending', 'Newest'
            <div className="flex items-center justify-between">
              <div className="relative flex items-center space-x-3">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-between text-left"
                >
                  <span className="text-black text-lg font-medium" style={customTextStyle}>
                    {activeTab}
                  </span>
                  <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} text-black text-sm transition-transform ml-2`}></i>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-2 z-10 shadow-lg"
                       style={{ minWidth: '150px' }}>
                    {tabs.map((tab) => (
                      <button
                        key={tab.name}
                        onClick={() => handleTabChange(tab.name)}
                        className={`flex items-center space-x-3 w-full px-4 py-3 text-left transition-colors
                                    ${activeTab === tab.name ? 'bg-gray-100 text-black' : 'bg-white text-gray-700'}
                                    hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg`}
                        style={customTextStyle}
                      >
                        <i className={`${tab.icon} text-lg`}></i>
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh button aligned right */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="p-2 text-gray-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <i className={`fas fa-sync-alt text-xl ${isRefreshing ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          ) : (
            // Search Results Info (when in search mode)
            <div>
              <p className="text-gray-700 text-sm mb-2" style={customTextStyle}>
                {noSearchResults && (wallpapers.length > 0 || profiles.length > 0)
                  ? `No exact matches for "${searchQuery}". Showing related ${activeSearchTab.toLowerCase()}:`
                  : noSearchResults && wallpapers.length === 0 && profiles.length === 0
                  ? `No ${activeSearchTab.toLowerCase()} found for "${searchQuery}".` // More specific message
                  : `Results for "${searchQuery}"`
                }
              </p>

              {/* Search Tabs */}
              <div className="flex space-x-4">
                {searchTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleSearchTabChange(tab)}
                    className={`pb-1 relative transition-colors text-sm ${
                      activeSearchTab === tab ? 'text-black font-semibold' : 'text-gray-600'
                    }`}
                    style={customTextStyle}
                  >
                    {tab}
                    {activeSearchTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area - Contains wallpapers or profiles grid */}
        <div className="px-4 py-4"> {/* Adjusted from px-6 py-4 to px-4 py-4 for tighter mobile layout */}
          {/* Loading Skeletons */}
          {loading && wallpapers.length === 0 && profiles.length === 0 && (
            <div className="grid grid-cols-1 gap-5"> {/* Grid columns and gap updated */}
              {renderSkeletonCards()}
            </div>
          )}

          {/* Wallpapers Grid */}
          {activeSearchTab === 'Wallpapers' && wallpapers.length > 0 && (
            <div>
              <div className="grid grid-cols-1 gap-5"> {/* Grid columns and gap updated */}
                {wallpapers.map((wallpaper) => (
                  <WallpaperCard
                    key={wallpaper.id || wallpaper._id}
                    wallpaper={wallpaper}
                    userId={userId}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {isSearchMode && hasNextPage && !loading && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadNextPage}
                    className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                    style={customTextStyle}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profiles Grid */}
          {activeSearchTab === 'Profiles' && profiles.length > 0 && (
            <div className="grid grid-cols-1 gap-5"> {/* Grid columns and gap updated for consistency */}
              {profiles.map((profile) => (
                <UserCard
                  key={profile.id}
                  user={profile}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && wallpapers.length === 0 && profiles.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 text-lg" style={customTextStyle}>
                  {isSearchMode && noSearchResults
                    ? `No ${activeSearchTab.toLowerCase()} found for "${searchQuery}".`
                    : !isSearchMode && !loading // If not in search mode and not loading, means no default wallpapers
                    ? 'No wallpapers found. Try refreshing!'
                    : 'Loading...' // Fallback for when loading and no data
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation (black background) - Remains fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-black h-16 flex items-center justify-around border-t border-gray-800">
        {mobileNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMobileNavItemClick(item.path)}
            className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 ${
              location.pathname.startsWith(item.path) ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className={`${item.icon} text-2xl`}></i> {/* Changed text-xl to text-2xl */}
          </button>
        ))}

        {/* Profile Button */}
        <button
          onClick={() => handleMobileNavItemClick('/mobile/profile')}
          className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 ${
            location.pathname.startsWith('/mobile/profile') ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${ // Changed w-6 h-6 to w-8 h-8
            location.pathname.startsWith('/mobile/profile') ? 'border-white' : 'border-transparent'
          }`}>
            {userDp ? (
              <img
                src={userDp}
                alt={displayUsername}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjE2IiByPSIxMC4yNSIgZmlsbD0iIzlDQTMzQSIvPgo8cGF0aCBkPSJNMCA0MFY0MEMxMy43Njk1IDM0LjY5MjEgMjYuMjMwNSAzNC42OTIxIDQwIDQwQzQwIDI3LjQ3NDIgMzIuMzE2MyAxOC43NjE1IDIzLjYxOTggMTQuNzMzOVYzOS43NjEyQzAgMzkuNzg4OSAwIDM5Ljk5NzcgMCA0NloiIGZpbGw9IiM1REZGNjQ2MCIvPgo=';
                  localStorage.removeItem('userDp');
                  setLoggedInUserProfile(prev => ({ ...prev, dp: null }));
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <i className="fas fa-user text-white text-xs"></i>
              </div>
            )}
          </div>
        </button>
      </nav>

      {/* Font Awesome (best practice: include in public/index.html) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default MobileHome;