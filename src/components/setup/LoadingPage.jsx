import React, { useState, useEffect, useRef } from 'react';
import wrapperFetch from '../Middleware/wrapperFetch'; // Adjust path as needed
import logobr from "../Web Image/logo.png"; // Your logo import

const LoadingValidation = () => {
  const [message, setMessage] = useState('Initializing...');
  const [showRotationPrompt, setShowRotationPrompt] = useState(false);
  const [isOrientationCorrect, setIsOrientationCorrect] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const hasAttemptedRedirection = useRef(false);

  // Enhanced device detection function
  const detectDevice = () => {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxDimension = Math.max(screenWidth, screenHeight);
    const minDimension = Math.min(screenWidth, screenHeight);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // iPhone screen sizes (including all models) - A comprehensive list for accuracy
    const iPhoneScreens = [
      { w: 320, h: 568 }, { w: 568, h: 320 }, // SE, 5s, 5c, 5
      { w: 375, h: 667 }, { w: 667, h: 375 }, // 6, 7, 8
      { w: 414, h: 736 }, { w: 736, h: 414 }, // 6 Plus, 7 Plus, 8 Plus
      { w: 375, h: 812 }, { w: 812, h: 375 }, // X, XS, 11 Pro, 12 mini, 13 mini
      { w: 414, h: 896 }, { w: 896, h: 414 }, // XR, 11
      { w: 390, h: 844 }, { w: 844, h: 390 }, // 12, 12 Pro, 13, 13 Pro, 14
      { w: 428, h: 926 }, { w: 926, h: 428 }, // 12 Pro Max, 13 Pro Max, 14 Plus
      { w: 393, h: 852 }, { w: 852, h: 393 }, // 14 Pro, 15, 15 Pro
      { w: 430, h: 932 }, { w: 932, h: 430 }  // 14 Pro Max, 15 Plus, 15 Pro Max
    ];

    // Check if current screen matches iPhone dimensions
    const isIPhoneScreen = iPhoneScreens.some(phone =>
      (screenWidth === phone.w && screenHeight === phone.h) ||
      (screenWidth === phone.h && screenHeight === phone.w)
    );

    // Explicit mobile device patterns
    const mobilePatterns = /iPhone|iPod|Android.*Mobile|BlackBerry|Windows Phone|Opera Mini|Mobile/i;

    // Device type logic
    if (isIOS && !isIPhoneScreen) {
      // iOS device with non-iPhone screen = iPad
      return 'tablet';
    } else if (mobilePatterns.test(userAgent) || isIPhoneScreen) {
      // Explicit mobile patterns or iPhone screen sizes
      return 'mobile';
    } else if (hasTouch && minDimension >= 600 && maxDimension <= 1400) {
      // Touch device with tablet-like screen size
      return 'tablet';
    } else if (hasTouch && minDimension < 600) {
      // Small touch device = mobile
      return 'mobile';
    } else if (!hasTouch || maxDimension > 1400) {
      // No touch or large screen = desktop
      return 'desktop';
    } else {
      // Default fallback
      return 'desktop';
    }
  };

  // Check screen orientation for tablet users only
  const checkOrientation = () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const isCurrentlyPortrait = currentHeight > currentWidth;
    const deviceType = detectDevice();

    // Set showRotationPrompt based on tablet and portrait
    if (deviceType === 'tablet' && isCurrentlyPortrait) {
      setShowRotationPrompt(true);
      setIsOrientationCorrect(false); // Orientation is NOT correct for tablets in portrait
    }
    // If tablet is in landscape, or it's not a tablet at all
    else {
      setShowRotationPrompt(false);
      setIsOrientationCorrect(true); // Orientation is correct (or not restricted)
    }
  };

  useEffect(() => {
    // Initial check for orientation
    checkOrientation();

    // Event listeners for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete and dimensions are updated
      setTimeout(checkOrientation, 200);
    });

    // Also check on screen rotation events if available
    try {
      if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', () => {
          setTimeout(checkOrientation, 200);
        });
      }
    } catch (error) {
      console.log('Screen orientation API not available:', error);
    }

    // Cleanup function for event listeners
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      try {
        if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
          window.screen.orientation.removeEventListener('change', checkOrientation);
        }
      } catch (error) {
        console.log('Error removing screen orientation listener:', error);
      }
    };
  }, []);

  // New useEffect for handling loading logic, dependent on orientation correctness
  useEffect(() => {
    if (isOrientationCorrect && !hasAttemptedRedirection.current) {
      hasAttemptedRedirection.current = true; // Mark that we've attempted redirection
      handleLoading();
    } else if (!isOrientationCorrect) {
      // Reset the flag if orientation becomes incorrect again, so handleLoading can run again if corrected
      hasAttemptedRedirection.current = false;
      setMessage('Waiting for correct orientation...');
    }
  }, [isOrientationCorrect]);

  const handleLoading = async () => {
    try {
      const deviceType = detectDevice();
      // --- ADD THIS LINE TO SAVE DEVICE TYPE TO LOCALSTORAGE ---
      localStorage.setItem('deviceType', deviceType);
      // --------------------------------------------------------

      const homePath = `/${deviceType}/home`;
      const loginPath = `/${deviceType}/login`;

      setMessage(`Checking device...`);

      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem('email');
      const username = localStorage.getItem('username');

      if (!userId || !email || !username) {
        setMessage('Redirecting...');
        setTimeout(() => {
          window.location.href = loginPath;
        }, 1000);
        return;
      }

      setMessage('Validating session...');

      const endpoint = `${backendUrl}/api/auth/vailed`;
      const response = await wrapperFetch(endpoint);

      if (response && (response.status === 304 || response.valid === true)) {
        setMessage('Redirecting...');
        setTimeout(() => {
          window.location.href = homePath;
        }, 1000);
      } else {
        setMessage('Redirecting...');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        setTimeout(() => {
          window.location.href = loginPath;
        }, 1000);
      }

    } catch (error) {
      setMessage('Redirecting...');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      setTimeout(() => {
        const deviceType = detectDevice();
        const loginPath = `/${deviceType}/login`;
        window.location.href = loginPath;
      }, 1500);
    }
  };

  // Rotation Prompt Component
  const RotationPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50">
      <div className="text-center p-8">
        {/* Rotation Icon */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-white mx-auto animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-white text-2xl font-bold mb-4">
          Please Rotate Your Device
        </h2>
        <p className="text-gray-300 text-lg mb-6">
          This application works best in landscape mode
        </p>

        {/* Device Illustration - Corrected Icons */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {/* Portrait Phone */}
          <div className="w-8 h-12 border-2 border-gray-400 rounded-md flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
          {/* Arrow */}
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {/* Landscape Phone */}
          <div className="w-12 h-8 border-2 border-white rounded-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          Rotate to landscape orientation for the best experience
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      {/* Rotation Prompt Overlay */}
      {showRotationPrompt && <RotationPrompt />}

      {/* Logo */}
      <div className="mb-8">
        <img src={logobr} alt="Laksh Logo" className="w-40 h-40 rounded-full object-cover" />
      </div>

      {/* Enhanced animated loading bar using Tailwind */}
      <div className="relative w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
        <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white to-transparent sliding-bar">
          <style>{`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
            .sliding-bar {
              animation: slide 1.5s infinite;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default LoadingValidation;