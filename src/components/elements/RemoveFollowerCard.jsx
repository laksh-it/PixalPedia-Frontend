import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';

const RemoveFollowerCard = ({ follower, onRemove, onProfileClick }) => {
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const loggedInUserId = localStorage.getItem('userId');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- CORRECTION HERE ---
  // Ensure profileId prioritizes follower.id (the profile ID)
  const profileId = String(follower.id || follower.user_id); // Use follower.id first, then fallback to user_id
  // --- END CORRECTION ---

  const [removing, setRemoving] = useState(false);

  const handleRemove = async (event) => {
    event.stopPropagation(); // Prevent card click from firing when button is clicked

    if (removing || !profileId || profileId === 'undefined' || profileId === 'null' || !loggedInUserId) {
      console.warn("Remove action skipped: Invalid follower ID or not logged in.");
      return;
    }

    setRemoving(true);
    try {
      // The endpoint is for removing a follower from loggedInUserId's list.
      // The `profileId` here should be the ID of the follower's profile/user being removed.
      // Assuming the backend expects the follower's profile ID in the URL segment.
      const endpoint = `${backendUrl}/api/fetch/followers/${loggedInUserId}/remove/${profileId}`;
      const response = await wrapperFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response && response.message === 'Follower removed successfully.') {
        if (onRemove) {
          onRemove(profileId); // Notify parent to remove this card using the profileId
        }
      } else {
        console.error('Failed to remove follower:', response?.message);
        // You might want to add a toast notification here as well.
      }
    } catch (error) {
      console.error('Error removing follower:', error);
      // You might want to add a toast notification here as well.
    } finally {
      setRemoving(false);
    }
  };

  const handleUserClick = () => {
    if (!profileId || profileId === '' || profileId === 'undefined' || profileId === 'null') {
      console.warn("Attempted to navigate with an invalid or empty profile ID.");
      return;
    }

    // Prioritize the onProfileClick prop if it exists and is a function
    if (onProfileClick && typeof onProfileClick === 'function') {
      onProfileClick(profileId); // Pass the profileId for navigation
    } else {
      // Fallback navigation if onProfileClick prop is not provided or invalid
      if (profileId === loggedInUserId) {
        navigate(`/desktop/profile/user`); // Assuming '/profile/user' is your own profile route
      } else {
        navigate(`/desktop/profile/${profileId}`); // Navigate to the specific profile ID
      }
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
      <div
        className="w-12 h-12 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleUserClick}
      >
        {follower.dp ? (
          <img
            src={follower.dp}
            alt={follower.username}
            className="w-full h-full object-cover"
            onError={(e) => { // Fallback if image fails to load
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM1MxNi41IDUgMTYuNSA3LjVTMTQuNSAxMiAxMiAxMlpNMTIgMTQuNUM5IDEzLjUgNiAxNiA2IDIxSDE4QzE4IDE2IDE1IDEzLjUgMTIgMTQuNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='; // Placeholder SVG for broken image
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-sm"></i> {/* Font Awesome user icon */}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-black truncate cursor-pointer hover:text-gray-700 transition-colors"
          style={{ ...customTextStyle, fontSize: '16px' }}
          onClick={handleUserClick} // Make the username clickable
        >
          {follower.username}
        </p>
      </div>

      <button
        onClick={handleRemove}
        disabled={removing}
        className={`px-4 py-2 rounded-md text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
          removing ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'
        }`}
        style={{ ...customTextStyle, fontSize: '14px' }}
      >
        {removing ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          'Remove'
        )}
      </button>
    </div>
  );
};

export default RemoveFollowerCard;