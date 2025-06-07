import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import MainLayout from '../elements/MainlayoutTab';
import WallpaperCard from '../../Tab/elements/TabWallpapercard';
import WallpaperSkeleton from '../../elements/SkeletonCard';
import UserCard from '../elements/TabUserCard';
import wrapperFetch from '../../Middleware/wrapperFetch';

const Home = () => {
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
  const [activeSidebarItem, setActiveSidebarItem] = useState('Home');
  const [activeSearchTab, setActiveSearchTab] = useState('Wallpapers');

  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation to access navigation state

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  console.log('Current userId from localStorage:', userId);

  // Cache key for localStorage
  const getCacheKey = (tab) => `wallpapers_${tab}_${userId}`;

  // Check if cache has data
  const isCacheValid = (tab) => {
    const cached = localStorage.getItem(getCacheKey(tab));
    return cached !== null;
  };

  // Get cached wallpapers
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

  // Set cached wallpapers
  const setCachedWallpapers = (tab, data) => {
    try {
      localStorage.setItem(getCacheKey(tab), JSON.stringify(data));
    } catch (error) {
      console.error('Error caching wallpapers:', error);
    }
  };

  // Clear cache for specific tab
  const clearCache = (tab) => {
    localStorage.removeItem(getCacheKey(tab));
  };

  const fetchWallpapers = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      console.log('No userId found, cannot fetch wallpapers');
      return;
    }

    // For non-search mode, always try cache first unless forceRefresh is true
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
        // Cache the data for the current tab if not in search mode
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
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, userId, backendUrl, isSearchMode]);

  const handleRefresh = async () => {
    if (isSearchMode) return;

    console.log(`Manual refresh triggered for tab: ${activeTab}`);
    setIsRefreshing(true);
    clearCache(activeTab);
    await fetchWallpapers(true);
  };

  // Pass query as a direct argument to ensure it's up-to-date
  const handleSearch = useCallback(async (page = 0, searchTab = 'Wallpapers', query = searchQuery) => {
    const currentQuery = query.trim();
    if (!currentQuery || !userId) {
      setLoading(false); // Ensure loading is off if we early exit
      return;
    }

    setLoading(true);

    try {
      let response;
      if (searchTab === 'Wallpapers') {
        response = await wrapperFetch(
          `${backendUrl}/api/search?q=${encodeURIComponent(currentQuery)}&refresh=${page}&user_id=${userId}`
        );
        if (response) {
          setNoSearchResults(!!response.fallback);
          const newWallpapers = response.wallpapers || [];
          if (page === 0) {
            setWallpapers(newWallpapers);
          } else {
            setWallpapers(prev => [...prev, ...newWallpapers]);
          }
          setHasNextPage(newWallpapers.length === 30);
          setSearchPage(page);
        } else {
          if (page === 0) setWallpapers([]);
          setNoSearchResults(true);
          setHasNextPage(false);
        }
        setProfiles([]);
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
        setWallpapers([]);
      }
    } catch (error) {
      console.error(`Error searching ${searchTab.toLowerCase()}:`, error);
      if (searchTab === 'Wallpapers') {
        if (page === 0) setWallpapers([]);
      } else {
        setProfiles([]);
      }
      setNoSearchResults(true);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [userId, backendUrl]); // Add dependencies to useCallback

  // Handle hashtag click - now used internally and by incoming navigation
  const handleHashtagClick = useCallback((hashtag) => {
    setSearchQuery(hashtag); // Update the search input
    setIsSearchMode(true);
    setActiveSearchTab('Wallpapers'); // Always search wallpapers for hashtags
    setSearchPage(0);
    setWallpapers([]); // Clear current wallpapers
    setProfiles([]); // Clear current profiles
    setNoSearchResults(false); // Reset search results status
    setHasNextPage(false); // Reset pagination

    // Immediately call handleSearch with the provided hashtag
    handleSearch(0, 'Wallpapers', hashtag);
  }, [handleSearch]); // Add handleSearch to dependencies

  // NEW: useEffect to handle incoming navigation state for hashtags
  useEffect(() => {
    if (location.state && location.state.hashtag) {
      const incomingHashtag = location.state.hashtag;
      console.log('Incoming hashtag from navigation state:', incomingHashtag);

      // Trigger the hashtag search logic
      handleHashtagClick(incomingHashtag);

      // IMPORTANT: Clear the state after processing it to prevent re-triggering
      // if the user navigates away and then back using browser history.
      // This replaces the current history entry with one that has no state.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, handleHashtagClick]); // Add dependencies

  // Fetch wallpapers when activeTab changes (and not in search mode) or userId changes
  useEffect(() => {
    if (!isSearchMode && userId && !location.state?.hashtag) { // Added condition to not fetch if a hashtag is incoming
      fetchWallpapers();
    }
  }, [activeTab, userId, isSearchMode, fetchWallpapers, location.state?.hashtag]); // Add location.state.hashtag to dependencies


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setWallpapers([]);
      setProfiles([]);
      setIsSearchMode(true);
      setNoSearchResults(false);
      setSearchPage(0);
      handleSearch(0, activeSearchTab, searchQuery); // Pass searchQuery directly
    } else {
      handleClearSearch();
    }
  };

  const handleLoadNextPage = () => {
    if (hasNextPage && !loading && isSearchMode && activeSearchTab === 'Wallpapers') {
      handleSearch(searchPage + 1, 'Wallpapers', searchQuery); // Pass searchQuery directly
    }
  };

  const handleTabChange = (tab) => {
    if (activeTab === tab && !isSearchMode) return;

    setActiveTab(tab);
    setIsSearchMode(false);
    setSearchQuery('');
    setNoSearchResults(false);
    setHasNextPage(false);
    setWallpapers([]);
    setProfiles([]);
    setActiveSearchTab('Wallpapers');
  };

  const handleSearchTabChange = (tab) => {
    if (activeSearchTab === tab) return;

    setActiveSearchTab(tab);
    setWallpapers([]);
    setProfiles([]);
    setNoSearchResults(false);
    setSearchPage(0);
    setHasNextPage(false);
    if (searchQuery.trim()) {
      handleSearch(0, tab, searchQuery); // Pass searchQuery directly
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setNoSearchResults(false);
    setHasNextPage(false);
    setWallpapers([]);
    setProfiles([]);
    setActiveSearchTab('Wallpapers');
    // After clearing search, if we were in search mode, trigger default fetch
    if (isSearchMode) { // Only fetch if we were in search mode, otherwise initial fetch will cover it
      fetchWallpapers();
    }
  };

  // Handle sidebar item click for navigation
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);

    if (itemName === 'More') {
      console.log('More options clicked');
      return;
    }

    navigate(path);
  };

  // You can keep these, but they are now handled internally by WallpaperCard
  // and UserCard. They can be removed if not directly used in Home.js JSX
  // for rendering these components outside of the cards themselves.
  const handleProfileClick = (profileId) => {
    console.log('Navigate to profile:', profileId);
    navigate(`/tablet/profile/${profileId}`);
  };

  const handleWallpaperClick = (wallpaperId) => {
    console.log('Navigate to wallpaper:', wallpaperId);
    navigate(`/tablet/wallpaper/${wallpaperId}`);
  };

  const tabs = ['For You', 'Trending', 'Newest'];
  const searchTabs = ['Wallpapers', 'Profiles'];

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <WallpaperSkeleton key={`skeleton-${index}`} />
    ));
  };

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
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
    >
      {/* Main content that goes inside MainLayout */}
      <div className="pb-6 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="pb-3 relative transition-colors"
                style={{ fontSize: '28px', ...customTextStyle }}
              >
                <span className={activeTab === tab && !isSearchMode ? 'text-black font-semibold' : 'text-gray-500'}>
                  {tab}
                </span>
                {activeTab === tab && !isSearchMode && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                )}
              </button>
            ))}
            {!isSearchMode && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="ml-4 p-2 text-gray-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <i className={`fas fa-sync-alt text-xl ${isRefreshing ? 'animate-spin' : ''}`}></i>
              </button>
            )}
          </div>
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wallpapers or profiles..."
              className="text-black border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="bg-black text-white rounded-r-md px-4 py-2 hover:bg-gray-700"
            >
              <i className="fas fa-search"></i>
            </button>
            {isSearchMode && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 bg-gray-500 text-white rounded-md px-3 py-2 hover:bg-gray-600"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {isSearchMode && (
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <p className="text-gray-600" style={customTextStyle}>
              {noSearchResults && (wallpapers.length > 0 || profiles.length > 0)
                ? `No exact matches found for "${searchQuery}". Showing related ${activeSearchTab.toLowerCase()}:`
                : noSearchResults && wallpapers.length === 0 && profiles.length === 0
                ? `No ${activeSearchTab.toLowerCase()} match your search for "${searchQuery}".`
                : `Search results for "${searchQuery}"`
              }
            </p>
            {noSearchResults && !loading && (wallpapers.length > 0 || profiles.length > 0) && (
              <span className="text-sm text-yellow-600" style={customTextStyle}>
                Showing related
              </span>
            )}
          </div>

          <div className="flex space-x-4 mt-2">
            {searchTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleSearchTabChange(tab)}
                className="pb-2 relative transition-colors"
                style={{ fontSize: '18px', ...customTextStyle }}
              >
                <span className={activeSearchTab === tab ? 'text-black font-semibold' : 'text-gray-500'}>
                  {tab}
                </span>
                {activeSearchTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && wallpapers.length === 0 && profiles.length === 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletonCards()}
          </div>
        </div>
      )}

      {activeSearchTab === 'Wallpapers' && wallpapers.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallpapers.map((wallpaper) => (
              <WallpaperCard
                key={wallpaper.id || wallpaper._id}
                wallpaper={wallpaper}
                userId={userId}
                // Removed onProfileClick and onWallpaperClick props as they are handled internally
                // onProfileClick={handleProfileClick}
                // onWallpaperClick={handleWallpaperClick}
                // onHashtagClick={handleHashtagClick} // Removed this as it's now handled internally
              />
            ))}
            {loading && isSearchMode && hasNextPage && renderSkeletonCards().slice(0, 3)}
          </div>

          {isSearchMode && hasNextPage && !loading && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadNextPage}
                disabled={loading}
                className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={customTextStyle}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          {isSearchMode && loading && !hasNextPage && wallpapers.length > 0 && (
            <div className="flex justify-center mt-8">
              <p style={customTextStyle}>Loading...</p>
            </div>
          )}
        </div>
      )}

      {activeSearchTab === 'Profiles' && profiles.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <UserCard
                key={profile.id}
                user={profile}
                // Removed onProfileClick here too, as it's handled internally in UserCard
                // onProfileClick={handleProfileClick}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && wallpapers.length === 0 && profiles.length === 0 && (
        <div className="pt-6 flex justify-center">
          <div className="text-gray-600" style={customTextStyle}>
            {isSearchMode && noSearchResults ? `No ${activeSearchTab.toLowerCase()} match your search for "${searchQuery}".` :
             isSearchMode && !noSearchResults ? `No ${activeSearchTab.toLowerCase()} found for this search.` :
             !isSearchMode ? 'No wallpapers found in this category yet. Try refreshing!' :
             'Loading...'}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Home;