import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob';
import wrapperFetch from '../../Middleware/wrapperFetch';
import WallpaperCard from '../Mobelements/MobWallpaperCard'; // Keep WallpaperCard for the detailed view
import UserCard from '../Mobelements/MobUserCard';
import ReportModal from '../../elements/ReportModal';
import SimpleWallpaperGridItem from '../Mobelements/SimpleWallpaperGridItem'; // <--- NEW IMPORT

// Simple Notification Component (keep as is)
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white flex items-center space-x-2 z-50 ${bgColor}`}>
      <i className={`${icon} text-xl`}></i>
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-white opacity-75 hover:opacity-100">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

const OtherProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || 'User';

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const [profile, setProfile] = useState(null);
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showReportProfileModal, setShowReportProfileModal] = useState(false);

  // --- NEW STATE FOR SELECTED WALLPAPER ---
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const wallpaperModalRef = useRef(null); // Ref for the full-screen wallpaper modal

  const menuRef = useRef(null);

  const [activeSidebarItem, setActiveSidebarItem] = useState('Profile');

  const isOwnProfile = profile && profile.user_id === loggedInUserId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      // Close selected wallpaper if click outside its modal
      if (wallpaperModalRef.current && !wallpaperModalRef.current.contains(event.target)) {
        setSelectedWallpaper(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  };

  const formatNumber = (num) => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId || !loggedInUserId) {
        console.log('User not logged in or profile ID missing, skipping profile data fetch.');
        setLoading(false);
        setProfile(null);
        return;
      }

      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const fetchUrl = `${backendUrl}/api/fetch/profile/${profileId}/${loggedInUserId}`;
        const response = await wrapperFetch(fetchUrl);
        if (response && response.profile) {
          setProfile(response.profile);
          setWallpapers(response.profile.wallpapers || []);
          setIsFollowing(response.profile.isFollowed || false);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId, loggedInUserId]);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const fetchFollowers = async () => {
      try {
        if (!profileId || !loggedInUserId) return;
        const followersUrl = `${backendUrl}/api/fetch/${profileId}/followers/${loggedInUserId}`;
        const resp = await wrapperFetch(followersUrl);
        if (resp && resp.followers) {
          setFollowersList(resp.followers);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
    };

    const fetchFollowing = async () => {
      try {
        if (!profileId || !loggedInUserId) return;
        const followingUrl = `${backendUrl}/api/fetch/${profileId}/following/${loggedInUserId}`;
        const resp = await wrapperFetch(followingUrl);
        if (resp && resp.following) {
          setFollowingList(resp.following);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      }
    };

    if (profileId && loggedInUserId) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profileId, loggedInUserId]);


  const handleFollow = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await wrapperFetch(`${backendUrl}/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: loggedInUserId,
          following_id: profile.user_id
        })
      });
      if (response && response.message === 'Followed successfully.') {
        setIsFollowing(true);
        setProfile(prev => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        }));
        const followersUrl = `${backendUrl}/api/fetch/${profileId}/followers/${loggedInUserId}`;
        const resp = await wrapperFetch(followersUrl);
        if (resp && resp.followers) {
          setFollowersList(resp.followers);
        }
      } else {
        showNotification(response?.error || 'Failed to follow.', 'error');
      }
    } catch (error) {
      console.error('Error following user:', error);
      showNotification('An error occurred while following.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await wrapperFetch(`${backendUrl}/api/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: loggedInUserId,
          following_id: profile.user_id
        })
      });
      if (response && response.message === 'Unfollowed successfully.') {
        setIsFollowing(false);
        setProfile(prev => ({
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        }));
        const followersUrl = `${backendUrl}/api/fetch/${profileId}/followers/${loggedInUserId}`;
        const resp = await wrapperFetch(followersUrl);
        if (resp && resp.followers) {
          setFollowersList(resp.followers);
        }
      } else {
        showNotification(response?.error || 'Failed to unfollow.', 'error');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      showNotification('An error occurred while unfollowing.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUserProfileClick = () => {
    navigate('/mobile/profile');
  };

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  const handleProfileClick = (navProfileId) => {
    if (navProfileId && navProfileId === loggedInUserId) {
      navigate('/mobile/profile');
    } else if (navProfileId && navProfileId !== profileId) {
      navigate(`/mobile/profile/${navProfileId}`);
      setShowFollowersModal(false);
      setShowFollowingModal(false);
    } else if (navProfileId && navProfileId === profileId) {
      setShowFollowersModal(false);
      setShowFollowingModal(false);
    }
  };

  // --- NEW HANDLER FOR SIMPLE WALLPAPER CLICK ---
  const handleSimpleWallpaperClick = (wallpaper) => {
    setSelectedWallpaper(wallpaper);
  };

  // The WallpaperCard's own click handlers can still trigger navigation to the full page if desired
  // This `handleWallpaperClick` (original) can now be internal to WallpaperCard or used for the full page navigation
  // For the purpose of this change, we'll keep it as a prop for WallpaperCard if it still needs to navigate from the detailed view.
  const handleWallpaperClick = (wallpaperId) => {
    navigate(`/mobile/wallpaper/${wallpaperId}`);
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/mobile/search?hashtag=${hashtag}`);
  };

  const handleReportProfile = () => {
    setShowProfileMenu(false);
    setShowReportProfileModal(true);
  };

  const onReportSuccess = () => {
    showNotification('Profile reported successfully!', 'success');
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${profile.username}'s profile!`,
          url: profileUrl,
        });
        console.log('Profile shared successfully');
      } catch (error) {
        console.error('Error sharing profile:', error);
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(profileUrl);
            showNotification('Profile URL copied to clipboard!', 'success');
          } catch (copyError) {
            console.error('Failed to copy to clipboard:', copyError);
            showNotification('Could not copy profile URL.', 'error');
          }
        } else {
          showNotification('Sharing features not supported in this browser.', 'error');
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        showNotification('Profile URL copied to clipboard!', 'success');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showNotification('Could not copy profile URL.', 'error');
      }
    } else {
      showNotification('Sharing features not supported in this browser.', 'error');
    }
    setShowProfileMenu(false);
  };

  const renderSocialLinks = (linksString) => {
    if (!linksString) return null;

    let links = [];
    try {
      // Adjusted parsing logic to handle potential array string or simple comma-separated string
      if (linksString.startsWith('[') && linksString.endsWith(']')) {
        // Assume it's a JSON array string
        const parsed = JSON.parse(linksString);
        if (Array.isArray(parsed)) {
          links = parsed.map(link => link.trim()).filter(link => link !== '');
        }
      } else {
        // Assume it's a comma-separated string (potentially with escaped quotes)
        let tempString = linksString.replace(/\\"/g, '"'); // Unescape quotes if any
        links = tempString.split(',')
                           .map(link => link.trim().replace(/"/g, '')) // Remove any remaining quotes
                           .filter(link => link !== '');
      }
    } catch (e) {
      console.error("Error parsing social links:", e);
      return null;
    }

    if (links.length === 0) return null;

    const getIcon = (url) => {
      if (url.includes('twitter.com') || url.includes('x.com')) {
        return <i className="fab fa-twitter"></i>;
      } else if (url.includes('github.com')) {
        return <i className="fab fa-github"></i>;
      } else if (url.includes('facebook.com')) {
        return <i className="fab fa-facebook"></i>;
      } else if (url.includes('linkedin.com')) {
        return <i className="fab fa-linkedin"></i>;
      } else if (url.includes('instagram.com')) {
        return <i className="fab fa-instagram"></i>;
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) { // Broader YouTube check
        return <i className="fab fa-youtube"></i>;
      }
      return <i className="fas fa-link"></i>;
    };

    return (
      <div className="flex flex-wrap gap-2 justify-start mt-2"> {/* Adjusted justify-start */}
        {links.map((link, index) => (
          <a
            key={index}
            href={link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors text-xl"
            title={link}
          >
            {getIcon(link)}
          </a>
        ))}
      </div>
    );
  };

  const renderSkeletonLoader = () => (
    <div className="animate-pulse p-4"> {/* Adjusted padding */}
      <div className="flex mb-4 items-center"> {/* Adjusted margin and alignment */}
        <div className="w-24 h-24 bg-gray-300 rounded-full mr-4"></div> {/* Adjusted size and margin */}
        <div className="flex-1 space-y-3"> {/* Adjusted spacing */}
          <div className="h-6 bg-gray-300 rounded w-2/3"></div> {/* Adjusted height and width */}
          <div className="h-4 bg-gray-300 rounded w-1/2"></div> {/* Adjusted height and width */}
          <div className="h-4 bg-gray-300 rounded w-1/3"></div> {/* Adjusted height and width */}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4"> {/* Adjusted columns and gap */}
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 bg-gray-300 rounded-lg"></div>
        ))}
      </div>
    </div>
  );

  // --- BEGIN FULL-SCREEN LOGIN MESSAGE LOGIC ---
  if (!loggedInUserId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view profiles</p>
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
  // --- END FULL-SCREEN LOGIN MESSAGE LOGIC ---

  // If loggedInUserId exists, proceed with rendering the profile content within MainLayout
  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
      onUserProfileClick={handleUserProfileClick}
    >
      <Notification
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      {loading ? (
        <div className="flex-1 bg-gray-200 rounded-tl-2xl min-h-screen">
          {renderSkeletonLoader()}
        </div>
      ) : profile ? (
        <div className="flex-1 bg-gray-200 rounded-tl-2xl p-4 min-h-screen"> {/* Adjusted padding */}
          {/* Top Profile Info */}
          <div className="flex flex-col mb-4"> {/* Adjusted margin */}
            <div className="flex items-start mb-4"> {/* Changed to items-start to align DP top */}
              <div className="w-24 h-24 mr-4 flex-shrink-0"> {/* flex-shrink-0 to prevent DP from shrinking */}
                {profile.dp ? (
                  <img
                    src={profile.dp}
                    alt={profile.username}
                    className="w-full h-full object-cover rounded-full border-2 border-gray-200 shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const fallbackDiv = e.target.nextSibling;
                      if (fallbackDiv && fallbackDiv.classList.contains('bg-gray-300')) {
                        fallbackDiv.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm" style={{ display: profile.dp ? 'none' : 'flex' }}>
                  <i className="fas fa-user text-gray-600 text-3xl"></i> {/* Adjusted text size */}
                </div>
              </div>

              <div className="flex-1">
                {/* Username */}
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}> {/* Adjusted text size */}
                  {profile.username}
                </h2>

                {/* Follower/Following Counts - Now directly under username */}
                <div className="flex justify-start space-x-6 mt-2"> {/* Adjusted justify-start */}
                  <div
                    className="text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <span className="font-bold text-black text-lg" style={customTextStyle}> {/* Adjusted text size */}
                      {formatNumber(profile.followers_count || 0)}
                    </span>
                    <p className="text-gray-600 text-xs" style={customTextStyle}> {/* Adjusted text size */}
                      Followers
                    </p>
                  </div>

                  <div
                    className="text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <span className="font-bold text-black text-lg" style={customTextStyle}> {/* Adjusted text size */}
                      {formatNumber(profile.following_count || 0)}
                    </span>
                    <p className="text-gray-600 text-xs" style={customTextStyle}> {/* Adjusted text size */}
                      Following
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons / Ellipsis Menu */}
              <div className="relative flex-shrink-0" ref={menuRef}> {/* flex-shrink-0 for ellipsis */}
                {!isOwnProfile ? (
                  <div className="flex items-center space-x-2"> {/* Adjusted spacing */}
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        disabled={followLoading}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={customTextStyle}
                      >
                        {followLoading ? (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : null}
                        Unfollow
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={customTextStyle}
                      >
                        {followLoading ? (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : null}
                        Follow
                      </button>
                    )}
                    <button
                      onClick={() => setShowProfileMenu(prev => !prev)}
                      className="p-2 rounded-full hover:bg-gray-300 transition-colors"
                      title="More options"
                    >
                      <i className="fas fa-ellipsis-v text-xl text-gray-600"></i> {/* Changed to v for vertical */}
                    </button>
                  </div>
                ) : (
                  // For own profile, show options menu directly
                  <button
                    onClick={() => setShowProfileMenu(prev => !prev)}
                    className="p-2 rounded-full hover:bg-gray-300 transition-colors"
                    title="More options"
                  >
                    <i className="fas fa-ellipsis-v text-xl text-gray-600"></i>
                  </button>
                )}

                {showProfileMenu && (
                  <div
                    ref={menuRef} // The ref is for the button's parent, but we can assign it to the dropdown for click outside detection
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200"
                  >
                    <button
                      onClick={handleReportProfile}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      style={customTextStyle}
                    >
                      <i className="fas fa-flag mr-2"></i> Report
                    </button>
                    <button
                      onClick={handleShareProfile}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      style={customTextStyle}
                    >
                      <i className="fas fa-share-alt mr-2"></i> Share Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User's Name (now just above bio, with font-bold for highlight) */}
            {profile.name && (
              <p className="text-gray-700 text-sm font-bold mb-2" style={customTextStyle}> {/* Adjusted text size and added font-bold */}
                {profile.name}
              </p>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 text-sm leading-relaxed mb-4" style={customTextStyle}> {/* Adjusted text size */}
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            {renderSocialLinks(profile.social_links)}

            {/* No Edit Profile button for other profiles */}
          </div>

          <div className="border-t border-gray-300 pt-4 mt-4"> {/* Adjusted padding and margin */}
            <div className="flex items-center justify-between mb-4"> {/* Adjusted margin */}
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}> {/* Adjusted text size */}
                Posts
              </h3>
              <div className="text-gray-500 text-sm" style={customTextStyle}> {/* Adjusted text size */}
                {formatNumber(wallpapers.length)} {wallpapers.length === 1 ? 'post' : 'posts'}
              </div>
            </div>

            {wallpapers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2"> {/* Adjusted columns and gap */}
                {wallpapers.map(wallpaper => (
                  // --- RENDER SimpleWallpaperGridItem HERE ---
                  <SimpleWallpaperGridItem
                    key={wallpaper.id || wallpaper._id}
                    wallpaper={wallpaper}
                    onClick={handleSimpleWallpaperClick} // Pass the handler to open the detailed view
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8"> {/* Adjusted padding */}
                <i className="fas fa-images text-gray-400 text-5xl mb-3"></i> {/* Adjusted text size and margin */}
                <p className="text-gray-500 text-lg" style={customTextStyle}> {/* Adjusted text size */}
                  No posts yet
                </p>
                <p className="text-gray-400 text-sm mt-1" style={customTextStyle}> {/* Adjusted text size */}
                  When {profile.username} shares wallpapers, they'll appear here
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-200 rounded-tl-2xl p-4 min-h-screen"> {/* Adjusted padding */}
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <i className="fas fa-user-slash text-gray-400 text-6xl mb-4"></i>
              <p className="text-gray-600 text-xl" style={customTextStyle}>
                Profile not found
              </p>
              <p className="text-gray-400 mt-2" style={{ ...customTextStyle, fontSize: '14px' }}>
                This user may not exist or has been removed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal (keep as is) */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full max-h-[80vh] overflow-hidden"> {/* Adjusted max-width */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200"> {/* Adjusted padding */}
              <h3 className="text-xl font-bold text-black" style={customTextStyle}> {/* Adjusted text size */}
                Followers
              </h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar"> {/* Adjusted padding, added custom-scrollbar */}
              {followersList.length > 0 ? (
                <div className="space-y-1">
                  {followersList.map(follower => (
                    <UserCard
                      key={follower.id || follower.user_id}
                      user={follower}
                      loggedInUserId={loggedInUserId}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                  <p className="text-gray-500" style={customTextStyle}>
                    No followers yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal (keep as is) */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full max-h-[80vh] overflow-hidden"> {/* Adjusted max-width */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200"> {/* Adjusted padding */}
              <h3 className="text-xl font-bold text-black" style={customTextStyle}> {/* Adjusted text size */}
                Following
              </h3>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar"> {/* Adjusted padding, added custom-scrollbar */}
              {followingList.length > 0 ? (
                <div className="space-y-1">
                  {followingList.map(followedUser => (
                    <UserCard
                      key={followedUser.id || followedUser.user_id}
                      user={followedUser}
                      loggedInUserId={loggedInUserId}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-user-plus text-gray-400 text-4xl mb-4"></i>
                  <p className="text-gray-500" style={customTextStyle}>
                    Not following anyone yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Profile Modal (keep as is) */}
      {profile && (
        <ReportModal
          isOpen={showReportProfileModal}
          onClose={() => setShowReportProfileModal(false)}
          elementType="profile"
          elementId={profile.user_id}
          onReportSuccess={onReportSuccess}
        />
      )}

      {/* --- NEW: Full-screen Wallpaper Details Modal --- */}
      {selectedWallpaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div
            ref={wallpaperModalRef}
            className="relative bg-transparent rounded-2xl overflow-hidden max-w-sm max-h-[95vh] w-full" // Use max-w-sm for original size feel
            // Prevent clicks inside this div from closing the modal immediately
            onClick={(e) => e.stopPropagation()}
          >
            {/* The WallpaperCard will be rendered here.
                We need to adjust WallpaperCard's internal click handling
                to allow for a second click to close this modal,
                or provide a specific close button.
                For now, clicking outside the card will close it.
            */}
            <WallpaperCard
              wallpaper={selectedWallpaper}
              userId={loggedInUserId}
              // Pass a prop to WallpaperCard to indicate it's in a modal context
              // This might require a small adjustment in WallpaperCard to handle `isModalView` prop
              // For example, if WallpaperCard has an internal click that navigates,
              // you might want to prevent that when `isModalView` is true.
              isModalView={true}
            />
          </div>
        </div>
      )}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </MainLayout>
  );
};

export default OtherProfile;