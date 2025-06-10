// GlobalErrorOverlay.js
import React, { useState, useEffect } from 'react';

// Using a module-level variable for the global state
// This is a simple way to manage global state without full Context API for this specific case.
// For more complex apps, consider Redux, Zustand, or React Context API.
let globalSetSessionErrorState = null; // To store the state setter

export function setGlobalSessionError(message) {
  if (globalSetSessionErrorState) {
    globalSetSessionErrorState(message);
  } else {
    // Fallback if the component hasn't mounted yet or is not in the DOM
    console.error("GlobalSessionErrorOverlay not ready, could not set error:", message);
    alert(message); // Show a simple alert as a fallback
    window.location.href = "/";
  }
}

export function clearGlobalSessionError() {
  if (globalSetSessionErrorState) {
    globalSetSessionErrorState(null);
  }
}

const GlobalSessionErrorOverlay = () => {
  const [sessionErrorMessage, setSessionErrorMessage] = useState(null);

  // Expose the state setter to the module level
  useEffect(() => {
    globalSetSessionErrorState = setSessionErrorMessage;
    // Cleanup on unmount
    return () => {
      globalSetSessionErrorState = null;
    };
  }, []);

  const handleLoginRedirect = () => {
    // Clear any stored authentication data
    localStorage.clear(); // Clear all localStorage items for a clean slate
    // Then navigate to the login page
    window.location.href = "/";
  };

  if (!sessionErrorMessage) {
    return null; // Don't render anything if there's no session error
  }

  // Custom styles for the message and button
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif', // Updated font family
    fontWeight: 500, // Updated font weight
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-50">
      <div className="text-center"> {/* Removed redundant padding, rounded-lg, shadow-lg */}
        <p className="text-xl mb-4" style={customTextStyle}>
          {sessionErrorMessage}
        </p>
        <a
          href="/" // Changed to <a> tag with href for navigation
          onClick={handleLoginRedirect} // Still attach onClick to clear localStorage
          className="bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition-colors" // Matched button styles
          style={customTextStyle}
        >
          Login
        </a>
      </div>
    </div>
  );
};

export default GlobalSessionErrorOverlay;