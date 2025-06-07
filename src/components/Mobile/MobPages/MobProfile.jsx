import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob';
import wrapperFetch from '../../Middleware/wrapperFetch';
import WallpaperCard from '../Mobelements/MobProWallpaperCard';
import UserCard from '../Mobelements/MobUserCard';
import RemoveFollowerCard from '../Mobelements/MobRemoveFollowerCard';
import EditProfileModal from '../../elements/EditProfileModal';
import SimpleWallpaperGridItem from '../Mobelements/SimpleWallpaperGridItem'; // <--- NEW IMPORT

// Simple Notification Component (remains the same)
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

const Profile = () => {
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');
  const initialUsername = localStorage.getItem('username') || 'User';

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const [profile, setProfile] = useState(null);
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); // State for the ellipsis menu dropdown
  const optionsMenuRef = useRef(null); // Ref for the options menu dropdown

  const [activeSidebarItem, setActiveSidebarItem] = useState('Profile');

  // New state to track if a change occurred in the modal
  const [followersUpdatedInModal, setFollowersUpdatedInModal] = useState(false);
  const [followingUpdatedInModal, setFollowingUpdatedInModal] = useState(false);

  // --- NEW STATE FOR SELECTED WALLPAPER ---
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const wallpaperModalRef = useRef(null); // Ref for the full-screen wallpaper modal

  // Close options menu AND wallpaper modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
      // Close selected wallpaper if click outside its modal
      if (wallpaperModalRef.current && selectedWallpaper && !wallpaperModalRef.current.contains(event.target)) {
        setSelectedWallpaper(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedWallpaper]); // Add selectedWallpaper as dependency for the modal close logic

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

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

  const fetchProfileData = useCallback(async () => {
    if (!loggedInUserId) {
      console.log('User not logged in, skipping profile data fetch.');
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fetchUrl = `${backendUrl}/api/fetch/profilegate/${loggedInUserId}/${loggedInUserId}`;
      const response = await wrapperFetch(fetchUrl);
      if (response && response.profile) {
        setProfile(response.profile);
        setWallpapers(response.profile.wallpapers || []);
        if (response.profile.username !== localStorage.getItem('username')) {
            localStorage.setItem('username', response.profile.username);
        }
      } else {
        showNotification('Failed to load profile data.', 'error');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      showNotification('Failed to load profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [loggedInUserId, showNotification]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const fetchFollowers = useCallback(async () => {
    try {
      if (!profile?.id || !loggedInUserId) {
        console.warn('Cannot fetch followers: profileId or loggedInUserId is undefined.');
        return;
      }
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const followersUrl = `${backendUrl}/api/fetch/${profile.id}/followers/${loggedInUserId}`;
      const resp = await wrapperFetch(followersUrl);
      if (resp && resp.followers) {
        setFollowersList(resp.followers);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  }, [profile?.id, loggedInUserId]);

  const fetchFollowing = useCallback(async () => {
    try {
      if (!profile?.id || !loggedInUserId) {
        console.warn('Cannot fetch following: profileId or loggedInUserId is undefined.');
        return;
      }
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const followingUrl = `${backendUrl}/api/fetch/${profile.id}/following/${loggedInUserId}`;
      const resp = await wrapperFetch(followingUrl);
      if (resp && resp.following) {
        setFollowingList(resp.following);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  }, [profile?.id, loggedInUserId]);

  useEffect(() => {
    if (profile?.id && loggedInUserId) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profile?.id, loggedInUserId, fetchFollowers, fetchFollowing]);

  const handleUserProfileClick = () => {
    // This is the user's own profile, no navigation needed when clicking from MainLayout
  };

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  const handleProfileClick = (navProfileId) => {
    if (navProfileId && String(navProfileId) === String(loggedInUserId)) { // Ensure string comparison
      // If clicking own profile in a list, just close modals (and prevent navigation)
      setShowFollowersModal(false);
      setShowFollowingModal(false);
      // If we're already on the profile page, simply close the modal.
      // If we need to re-fetch for some reason, fetchProfileData() could be called here.
      // For now, let's rely on the modal close handler to trigger re-fetch.
    } else if (navProfileId) {
      navigate(`/mobile/profile/${navProfileId}`);
    }
  };

  // --- NEW HANDLER FOR SIMPLE WALLPAPER CLICK ---
  const handleSimpleWallpaperClick = (wallpaper) => {
    setSelectedWallpaper(wallpaper);
  };

  // The WallpaperCard's own click handlers can still trigger navigation to the full page if desired
  const handleWallpaperClick = (wallpaperId) => {
    navigate(`/mobile/wallpaper/${wallpaperId}`);
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/mobile/search?hashtag=${hashtag}`);
  };

  // This is for when *you* remove a follower
  const handleFollowerRemoved = (removedFollowerId) => {
    setFollowersList(prev => prev.filter(f => String(f.user_id) !== String(removedFollowerId) && String(f.id) !== String(removedFollowerId)));
    setFollowersUpdatedInModal(true); // Mark that a change occurred
    showNotification('Follower removed successfully!', 'success');
  };

  // NEW: Handler for when *you* unfollow someone from the Following modal
  const handleUnfollowSuccess = (unfollowedUserId) => {
    setFollowingList(prev => prev.filter(f => String(f.id) !== String(unfollowedUserId) && String(f.user_id) !== String(unfollowedUserId)));
    setFollowingUpdatedInModal(true); // Mark that a change occurred
    showNotification('Unfollowed successfully!', 'success');
  };

  const handleWallpaperDeleteSuccess = useCallback((deletedWallpaperId) => {
    setWallpapers(prevWallpapers => prevWallpapers.filter(wp => wp.id !== deletedWallpaperId));
    setProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
            ...prevProfile,
            upload_count: Math.max(0, (prevProfile.upload_count || 0) - 1)
        };
    });
    showNotification('Wallpaper deleted successfully!', 'success');
  }, [showNotification]);


  const renderSocialLinks = (linksString) => {
    if (!linksString) return null;

    let links = [];
    try {
        const parsedLinks = JSON.parse(linksString);
        if (Array.isArray(parsedLinks)) {
            links = parsedLinks.map(link => link.trim()).filter(link => link !== '');
        }
    } catch (e) {
      console.error("Error parsing social links:", e);
      let tempString = linksString.substring(1, linksString.length - 1).replace(/\\/g, '');
      links = tempString.split(',')
                           .map(link => link.trim().replace(/"/g, ''))
                           .filter(link => link !== '');
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
      } else if (url.includes('youtube.com')) { // Broader YouTube check
        return <i className="fab fa-youtube"></i>;
      }
      return <i className="fas fa-link"></i>;
    };

    return (
      <div className="flex flex-wrap gap-2 justify-start mt-2">
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
    <div className="animate-pulse p-4">
      <div className="flex mb-4 items-center">
        <div className="w-24 h-24 bg-gray-300 rounded-full mr-4"></div>
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-300 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view your profile</p>
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

  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={profile?.username || initialUsername}
      onUserProfileClick={handleUserProfileClick}
    >
      <Notification
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      {/* Outer container for the grayish background */}
      <div className="flex-1 bg-gray-200 rounded-tl-2xl min-h-screen">
        {loading ? (
          <div className="p-4">
            {renderSkeletonLoader()}
          </div>
        ) : profile ? (
          <div className="p-4">
            {/* Top Profile Info */}
            <div className="flex flex-col mb-4">
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
                    <i className="fas fa-user text-gray-600 text-3xl"></i>
                  </div>
                </div>

                <div className="flex-1">
                  {/* Username */}
                  <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                    {profile.username}
                  </h2>

                  {/* Follower/Following Counts - Now directly under username */}
                  <div className="flex justify-start space-x-6 mt-2">
                    <div
                      className="text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                      onClick={() => setShowFollowersModal(true)}
                    >
                      <span className="font-bold text-black text-lg" style={customTextStyle}>
                        {formatNumber(profile.followers_count || 0)}
                      </span>
                      <p className="text-gray-600 text-xs" style={customTextStyle}>
                        Followers
                      </p>
                    </div>

                    <div
                      className="text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                      onClick={() => setShowFollowingModal(true)}
                    >
                      <span className="font-bold text-black text-lg" style={customTextStyle}>
                        {formatNumber(profile.following_count || 0)}
                      </span>
                      <p className="text-gray-600 text-xs" style={customTextStyle}>
                        Following
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ellipsis (Three Dots) Menu for Settings and More */}
                <div className="relative flex-shrink-0" ref={optionsMenuRef}>
                  <button
                    onClick={() => setShowOptionsMenu(prev => !prev)}
                    className="p-2 rounded-full hover:bg-gray-300 transition-colors"
                    title="More Options"
                  >
                    <i className="fas fa-ellipsis-v text-xl text-gray-600"></i>
                  </button>
                  {showOptionsMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <button
                        onClick={() => { navigate('/mobile/settings'); setShowOptionsMenu(false); }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        style={customTextStyle}
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => { navigate('/mobile/more'); setShowOptionsMenu(false); }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        style={customTextStyle}
                      >
                        More options
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User's Name (now just above bio, added font-bold for highlight) */}
              {profile.name && (
                <p className="text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  {profile.name}
                </p>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 text-sm leading-relaxed mb-4" style={customTextStyle}>
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              {renderSocialLinks(profile.social_links)}

              {/* Edit Profile Button */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200"
                  style={customTextStyle}
                >
                  <i className="fas fa-user-edit mr-2"></i> Edit Profile
                </button>
              </div>

            </div>

            <div className="border-t border-gray-300 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                  Posts
                </h3>
                <div className="text-gray-500 text-sm" style={customTextStyle}>
                  {formatNumber(wallpapers.length)} {wallpapers.length === 1 ? 'post' : 'posts'}
                </div>
              </div>

              {wallpapers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
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
                <div className="text-center py-8">
                  <i className="fas fa-images text-gray-400 text-5xl mb-3"></i>
                  <p className="text-gray-500 text-lg" style={customTextStyle}>
                    No posts yet
                  </p>
                  <p className="text-gray-400 text-sm mt-1" style={customTextStyle}>
                    You haven't shared any wallpapers yet
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <i className="fas fa-user-slash text-gray-400 text-6xl mb-4"></i>
                <p className="text-gray-600 text-xl" style={customTextStyle}>
                  Unable to load your profile
                </p>
                <p className="text-gray-400 mt-2" style={{ ...customTextStyle, fontSize: '14px' }}>
                  There was an error fetching your profile data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal (No changes here needed for follower/following) */}
      {showEditProfileModal && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfileModal(false)}
          onProfileUpdated={fetchProfileData}
          showNotification={showNotification}
        />
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-black" style={customTextStyle}>
                Followers
              </h3>
              <button
                onClick={() => {
                  setShowFollowersModal(false);
                  if (followersUpdatedInModal) {
                    fetchProfileData();
                    setFollowersUpdatedInModal(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
              {followersList.length > 0 ? (
                <div className="space-y-1">
                  {followersList.map(follower => (
                    <RemoveFollowerCard
                      key={follower.id || follower.user_id}
                      follower={follower}
                      onRemove={handleFollowerRemoved}
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

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-black" style={customTextStyle}>
                Following
              </h3>
              <button
                onClick={() => {
                  setShowFollowingModal(false);
                  if (followingUpdatedInModal) {
                    fetchProfileData();
                    setFollowingUpdatedInModal(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
              {followingList.length > 0 ? (
                <div className="space-y-1">
                  {followingList.map(followedUser => (
                    <UserCard
                      key={followedUser.id || followedUser.user_id}
                      user={followedUser}
                      loggedInUserId={loggedInUserId}
                      isFollowing={followedUser.is_following}
                      onProfileClick={handleProfileClick}
                      onUnfollowSuccess={handleUnfollowSuccess}
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

      {/* --- NEW: Full-screen Wallpaper Details Modal --- */}
      {selectedWallpaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div
            ref={wallpaperModalRef}
            className="relative bg-transparent rounded-2xl overflow-hidden max-w-sm max-h-[95vh] w-full" // Use max-w-sm for original size feel
            // Prevent clicks inside this div from closing the modal immediately
            onClick={(e) => e.stopPropagation()}
          >
            {/* The WallpaperCard will be rendered here. */}
            <WallpaperCard
              wallpaper={selectedWallpaper}
              userId={loggedInUserId}
              isModalView={true} // Indicate to WallpaperCard it's in a modal context
              onProfileClick={handleProfileClick} // Pass these so WallpaperCard can navigate if needed
              onWallpaperClick={handleWallpaperClick}
              onHashtagClick={handleHashtagClick}
              onDeleteSuccess={handleWallpaperDeleteSuccess} // Crucial for own profile to handle deletion
            />

            {/* The explicit close button has been REMOVED from here,
                relying on click outside or WallpaperCard's internal logic.
            */}
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

export default Profile;