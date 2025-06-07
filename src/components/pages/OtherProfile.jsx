import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainLayout';
import wrapperFetch from '../Middleware/wrapperFetch';
import WallpaperCard from '../elements/Wallpapercard';
import UserCard from '../elements/UserCard';
import ReportModal from '../elements/ReportModal';

// Simple Notification Component
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

  const menuRef = useRef(null);

  const [activeSidebarItem, setActiveSidebarItem] = useState('Profile');

  const isOwnProfile = profile && profile.user_id === loggedInUserId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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
      // If profileId is missing or it's the logged-in user's own ID,
      // and loggedInUserId is missing, set loading to false and return immediately.
      // This ensures we don't attempt to fetch a profile that doesn't exist
      // or redirect to own profile without a logged in user.
      if (!profileId || !loggedInUserId) { // Removed the `isOwnProfile` check here
        console.log('User not logged in or profile ID missing, skipping profile data fetch.');
        setLoading(false);
        setProfile(null); // Ensure profile is null if not logged in or ID missing
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
    navigate('/desktop/profile');
  };

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  const handleProfileClick = (navProfileId) => {
    if (navProfileId && navProfileId === loggedInUserId) {
      navigate('/desktop/profile');
    } else if (navProfileId && navProfileId !== profileId) {
      navigate(`/desktop/profile/${navProfileId}`);
      setShowFollowersModal(false);
      setShowFollowingModal(false);
    } else if (navProfileId && navProfileId === profileId) {
      setShowFollowersModal(false);
      setShowFollowingModal(false);
    }
  };

  const handleWallpaperClick = (wallpaperId) => {
    navigate(`/desktop/wallpaper/${wallpaperId}`);
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/desktop/search?hashtag=${hashtag}`);
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
      let tempString = linksString.substring(1, linksString.length - 1).replace(/\\/g, '');
      links = tempString.split(',')
                           .map(link => link.trim().replace(/"/g, ''))
                           .filter(link => link !== '');

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
      } else if (url.includes('youtube.com')) {
        return <i className="fab fa-youtube"></i>;
      }
      return <i className="fas fa-link"></i>;
    };

    return (
      <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-4">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors text-2xl"
            title={link}
          >
            {getIcon(link)}
          </a>
        ))}
      </div>
    );
  };

  const renderSkeletonLoader = () => (
    <div className="animate-pulse p-8">
      <div className="flex mb-8">
        <div className="w-32 h-32 bg-gray-300 rounded-full mr-6"></div>
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-48 bg-gray-300 rounded-lg"></div>
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
        <div className="bg-gray-200 rounded-tl-2xl p-8">
          {renderSkeletonLoader()}
        </div>
      ) : profile ? (
        <div className="bg-gray-200 rounded-tl-2xl p-8">
          {/* Top Profile Info */}
          <div className="flex flex-col md:flex-row mb-8">
            <div className="w-32 h-32 mb-6 md:mb-0 md:mr-8 mx-auto md:mx-0">
              {profile.dp ? (
                <img
                  src={profile.dp}
                  alt={profile.username}
                  className="w-full h-full object-cover rounded-full border-4 border-gray-200 shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallbackDiv = e.target.closest('.w-32.h-32').querySelector('.fallback-dp');
                    if (fallbackDiv) {
                      fallbackDiv.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center border-4 border-gray-200 shadow-lg fallback-dp"
                style={{ display: profile.dp ? 'none' : 'flex' }}
              >
                <i className="fas fa-user text-gray-600 text-4xl"></i>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-6">
                <h2 className="text-4xl font-bold text-black mb-4 md:mb-0" style={customTextStyle}>
                  {profile.username}
                </h2>
                {!isOwnProfile && (
                  <div className="flex items-center space-x-4">
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        disabled={followLoading}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ ...customTextStyle, fontSize: '16px' }}
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
                        className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ ...customTextStyle, fontSize: '16px' }}
                      >
                        {followLoading ? (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : null}
                        Follow
                      </button>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(prev => !prev)}
                        className="p-2 rounded-full hover:bg-gray-300 transition-colors"
                        title="More options"
                      >
                        <i className="fas fa-ellipsis-h text-xl text-gray-600"></i>
                      </button>
                      {showProfileMenu && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200"
                        >
                          <button
                            onClick={handleReportProfile}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <i className="fas fa-flag mr-2"></i> Report
                          </button>
                          <button
                            onClick={handleShareProfile}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <i className="fas fa-share-alt mr-2"></i> Share Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center md:justify-start space-x-8 mb-6">
                <div
                  className="text-center cursor-pointer hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setShowFollowersModal(true)}
                >
                  <span className="font-bold text-black text-xl" style={customTextStyle}>
                    {formatNumber(profile.followers_count || 0)}
                  </span>
                  <p className="text-gray-600" style={{ ...customTextStyle, fontSize: '14px' }}>
                    Followers
                  </p>
                </div>

                <div
                  className="text-center cursor-pointer hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <span className="font-bold text-black text-xl" style={customTextStyle}>
                    {formatNumber(profile.following_count || 0)}
                  </span>
                  <p className="text-gray-600" style={{ ...customTextStyle, fontSize: '14px' }}>
                    Following
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-black" style={customTextStyle}>
                  {profile.name || profile.username}
                </h3>
                {profile.bio && (
                  <p className="text-gray-700 leading-relaxed" style={{ ...customTextStyle, fontSize: '16px' }}>
                    {profile.bio}
                  </p>
                )}
              </div>

              {renderSocialLinks(profile.social_links)}

            </div>
          </div>

          <div className="border-t border-gray-300 pt-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-black" style={customTextStyle}>
                Posts
              </h3>
              <div className="text-gray-500" style={{ ...customTextStyle, fontSize: '16px' }}>
                {formatNumber(wallpapers.length)} {wallpapers.length === 1 ? 'post' : 'posts'}
              </div>
            </div>

            {wallpapers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallpapers.map(wallpaper => (
                  <WallpaperCard
                    key={wallpaper.id || wallpaper._id}
                    wallpaper={wallpaper}
                    userId={loggedInUserId}
                    onProfileClick={handleProfileClick}
                    onWallpaperClick={handleWallpaperClick}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <i className="fas fa-images text-gray-400 text-6xl mb-4"></i>
                <p className="text-gray-500 text-xl" style={customTextStyle}>
                  No posts yet
                </p>
                <p className="text-gray-400 mt-2" style={{ ...customTextStyle, fontSize: '14px' }}>
                  When {profile.username} shares wallpapers, they'll appear here
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-200 rounded-tl-2xl p-8">
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

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                Followers
              </h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
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

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-black" style={customTextStyle}>
                Following
              </h3>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
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

      {/* Report Profile Modal */}
      {profile && (
        <ReportModal
          isOpen={showReportProfileModal}
          onClose={() => setShowReportProfileModal(false)}
          elementType="profile"
          elementId={profile.user_id}
          onReportSuccess={onReportSuccess}
        />
      )}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default OtherProfile;