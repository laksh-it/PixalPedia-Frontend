import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';

const UserCard = ({ user, onProfileClick }) => {
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const loggedInUserId = localStorage.getItem('userId'); // This is the user_id of the logged-in user

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Explicitly get the profile ID for navigation/display purposes
  const userProfileId = String(user.id || user.user_id); // Prioritize user.id for profile page identity
  // Explicitly get the user account ID for API calls (as per backend spec for follow/unfollow)
  const userTargetAccountId = String(user.user_id || user.id); // Prioritize user.user_id for account-based actions

  // Do not show a button if this card represents the logged-in user.
  // We compare user account IDs here, as follow/unfollow is account-based.
  const showButton = loggedInUserId !== userTargetAccountId;

  const [followed, setFollowed] = useState(user.isFollowed);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowUnfollow = async (event) => {
    event.stopPropagation(); // Prevent card click from firing when button is clicked

    // Use userTargetAccountId for API validation
    if (isLoading || !userTargetAccountId || userTargetAccountId === 'undefined' || userTargetAccountId === 'null' || !loggedInUserId) {
      console.warn("Follow/Unfollow action skipped: Invalid target user account ID or not logged in.");
      return;
    }

    setIsLoading(true);

    const endpoint = followed
      ? `${backendUrl}/api/unfollow`
      : `${backendUrl}/api/follow`;

    try {
      const response = await wrapperFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: loggedInUserId,       // The user_id of the logged-in user (the follower)
          following_id: userTargetAccountId  // The user_id of the user being followed/unfollowed (the following)
        })
      });

      if (response && response.message) {
        setFollowed(!followed);
        // Optionally, trigger a profile data refresh in parent if follower/following counts need update
      } else {
        console.error('Failed to perform follow/unfollow:', response?.message);
      }
    } catch (error) {
      console.error('Error in follow/unfollow action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = () => {
    // Use userProfileId for navigation, as it identifies the profile page
    if (!userProfileId || userProfileId === '' || userProfileId === 'undefined' || userProfileId === 'null') {
      console.warn("Attempted to navigate with an invalid or empty profile ID.");
      return;
    }

    // Prioritize the onProfileClick prop if it exists and is a function
    if (onProfileClick && typeof onProfileClick === 'function') {
      onProfileClick(userProfileId); // Pass the profile ID for navigation
    } else {
      // Fallback navigation
      // Check if the card represents the logged-in user's *own account*
      if (userTargetAccountId === loggedInUserId) {
        navigate(`/tablet/profile`); // Navigate to the general logged-in user's profile route
      } else {
        navigate(`/tablet/profile/${userProfileId}`); // Navigate to the specific profile ID
      }
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
      <div
        className="w-12 h-12 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleUserClick} // Clickable area for navigation
      >
        {user.dp ? (
          <img
            src={user.dp}
            alt={user.username}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMTIgMTJDOS41IDEyIDcuNSAxMCA3LjUgNy41UzkuNSAzIDEyIDNTMTYuNSAzIDE2LjUgNy41UzE0LjUgMTIgMTIgMTJaTTEyIDE0LjVDOSAxMy41IDYgMTYgNiAyMUgxOEMxOCAxNiAxNSAxMy41IDEyIDE0LjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4=';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-sm"></i>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-black truncate cursor-pointer hover:text-gray-700 transition-colors"
          style={{ ...customTextStyle, fontSize: '16px' }}
          onClick={handleUserClick} // Make the username clickable too
        >
          {user.username}
        </p>
      </div>

      {showButton && (
        <button
          onClick={handleFollowUnfollow}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            followed
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-black hover:bg-gray-800'
          }`}
          style={{ ...customTextStyle, fontSize: '14px' }}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            followed ? 'Unfollow' : 'Follow'
          )}
        </button>
      )}
    </div>
  );
};

export default UserCard;