// wrapperFetch.js

import { setGlobalSessionError } from './GlobalErrorOverlay';

/**
 * Generates a TS token carrying the device and session details.
 * The token is a base64-encoded JSON string.
 */
export function generateTSToken() {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;
  const timezoneOffset = new Date().getTimezoneOffset();

  // Generate unique session identifiers.
  const sessionId =
    window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);
  const sessionPoint =
    window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);
  const generatedAt = Date.now();

  const sessionData = {
    userAgent,
    language,
    platform,
    screenResolution,
    timezoneOffset,
    sessionId,
    sessionPoint,
    generatedAt,
  };

  return btoa(JSON.stringify(sessionData));
}

/**
 * A wrapper around the native fetch function for API calls with comprehensive error handling.
 *
 * For public pages, only TS token is sent.
 * For protected pages, full authentication headers (x-user-id, Authorization, X-Session-Token) are included.
 * Handles all backend error responses with appropriate user feedback and redirects.
 *
 * @param {string} url - The API endpoint to call.
 * @param {object} [options={}] - Optional custom fetch options and headers.
 * @returns {Promise<object|{status: number, message: string}|null>} - The JSON response, a special object for 304, or null if an error occurred.
 */
export default async function wrapperFetch(url, options = {}) {
  const tsToken = generateTSToken();

  const publicPaths = [
    "/desktop/login",
    "/desktop/signup",
    "/desktop/Forgotpassword",
    "/desktop/Resetpassword",
    "/desktop/Confirmemail",
    "/mobile/login",
    "/mobile/signup",
    "/mobile/Forgotpassword",
    "/mobile/Resetpassword",
    "/mobile/Confirmemail",
    "/tablet/login",
    "/tablet/signup",
    "/tablet/Forgotpassword",
    "/tablet/Resetpassword",
    "/tablet/Confirmemail",
    "/request-password-reset-otp",
    "/reset-password-with-otp",
    "/verify-email-with-otp",
    "/resend-otp",
    "/check-username",
  ];

  const currentPath = window.location.pathname;
  const isPublicPage = publicPaths.includes(currentPath);

  let defaultHeaders = {
    // 'Content-Type': 'application/json', // Keep this as a default for most JSON APIs
    'ts': tsToken, // TS token is MANDATORY for all requests
  };

  if (!isPublicPage) {
    // For protected pages, get user ID and tokens
    const userId = localStorage.getItem("userId");
    const authToken = localStorage.getItem("authToken");
    const sessionToken = localStorage.getItem("sessionToken");

    // Simplified isAuthenticated check: only tokens and userId matter for sending headers
    // The backend is the ultimate source of truth for full authentication
    const isAuthenticated = Boolean(userId && authToken && sessionToken);

    if (!isAuthenticated) {
      console.warn("User not authenticated on protected page. Triggering global session error.");
      clearAuthData(); // Clear potentially stale/partial data
      setGlobalSessionError("Please log in to access this page. Your session may have expired or is invalid.");
      return null;
    }

    // Set headers for authenticated requests
    defaultHeaders['x-user-id'] = userId;
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    defaultHeaders['X-Session-Token'] = sessionToken;
  }
  // The 'authentication: "public"' header is removed as the backend uses the PUBLIC_ROUTES array

  // Merge with provided options
  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'omit', // Prevent sending cookies
  };

  try {
    const response = await fetch(url, finalOptions);

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.log(`Resource at ${url} not modified. Using cached version.`);
      return { status: 304, message: "Not Modified" };
    }

    // Parse error response for non-OK statuses
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.warn(`Could not parse error response for status ${response.status}:`, e);
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: "An unexpected error occurred"
        };
      }

      // Handle specific error statuses
      switch (response.status) {
        case 400:
          handleBadRequestError(errorData, url);
          break;

        case 401:
          // Crucial change: Trigger global error for session issues
          handleUnauthorizedError(errorData, url, isPublicPage);
          return null; // Stop execution after handling auth error

        case 429:
          handleRateLimitError(errorData, url);
          break;

        case 500:
          handleServerError(errorData, url);
          break;

        default:
          handleGenericError(response.status, errorData, url);
          break;
      }

      // Only throw error for non-auth errors (401 handled by global redirect)
      if (response.status !== 401) {
          const error = new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
          error.status = response.status;
          error.data = errorData;
          throw error;
      }
    }

    // Parse successful response
    return await response.json();

  } catch (error) {
    // Handle network errors or other fetch failures
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error("Network error:", error);
      showErrorMessage("Network error. Please check your connection and try again.");
    } else if (!error.status) {
      // This is a non-HTTP error (network, parsing, etc.)
      console.error("Fetch Error (non-HTTP or parsing):", error);
      showErrorMessage("An unexpected error occurred. Please try again.");
    }
    // For HTTP errors that were already handled (e.g., 401), we don't re-throw
    // For other HTTP errors that were thrown, they'll be caught here and show a generic message.
    else {
        // This 'else' block will catch errors that were explicitly thrown for non-401 HTTP statuses
        console.error("HTTP Error caught by wrapperFetch's outer catch:", error);
        // The error message would have already been shown by the specific handle function
        // Or you can re-show a generic one if needed:
        // showErrorMessage(error.data?.message || error.message);
    }

    return null;
  }
}

/**
 * Handle 400 Bad Request errors
 */
function handleBadRequestError(errorData, url) {
  console.error(`Bad Request to ${url}:`, errorData);

  if (errorData.error === "Missing TS token") {
    showErrorMessage("App security token missing. Please refresh the page.");
    setTimeout(() => window.location.reload(), 2000);
  } else if (errorData.error === "Invalid TS token") {
    showErrorMessage("Invalid app security token. Please refresh the page.");
    setTimeout(() => window.location.reload(), 2000);
  } else {
    showErrorMessage(errorData.message || "Invalid request. Please check your input.");
  }
}

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorizedError(errorData, url, isPublicPage) {
  console.error(`Unauthorized request to ${url}:`, errorData);

  // Handle TS token expiration
  if (errorData.error === "Expired TS token. Please refresh or re-login.") {
    showErrorMessage("Session security expired. Please refresh the page.");
    setTimeout(() => window.location.reload(), 2000);
    return;
  }

  // Intercept specific authentication errors to trigger the global overlay
  if (errorData.code === "LOGIN_REQUIRED" || errorData.error?.includes("auth")) {
    console.warn("Authentication required. Clearing stored data and triggering global session error.");
    clearAuthData();
    setGlobalSessionError(errorData.message || "Your session has expired. Please log in again.");
  } else {
    // Generic unauthorized error for other 401 cases
    showErrorMessage("Access denied. Please log in and try again.");
    if (!isPublicPage) {
      clearAuthData();
      // Fallback to global error for non-public pages with generic 401
      setGlobalSessionError("Access denied. Please log in and try again.");
    }
  }
}


/**
 * Handle 429 Rate Limit errors
 */
function handleRateLimitError(errorData, url) {
  console.error(`Rate limited on ${url}:`, errorData);
  showErrorMessage("Too many requests. Please wait a moment before trying again.");
}

/**
 * Handle 500 Server errors
 */
function handleServerError(errorData, url) {
  console.error(`Server error on ${url}:`, errorData);
  showErrorMessage("Server error occurred. Please try again later.");
}

/**
 * Handle other HTTP errors
 */
function handleGenericError(status, errorData, url) {
  console.error(`HTTP ${status} error on ${url}:`, errorData);
  const message = errorData.message || errorData.error || `Unexpected error (${status})`;
  showErrorMessage(message);
}

/**
 * Clear all authentication data from localStorage
 */
function clearAuthData() {
  const authKeys = [
    'authToken',
    'sessionToken',
    'userId',
    'email',
    'username'
  ];

  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log("Authentication data cleared from localStorage");
}

/**
 * Show error message to user (customize based on your UI framework)
 * This `showErrorMessage` will be used for less critical errors.
 * The critical session error will use `setGlobalSessionError`.
 */
function showErrorMessage(message) {
  alert(message); // Keep this for non-critical alerts, or integrate with a toast/notification system
  console.error("User Error:", message);
}

/**
 * Enhanced error handling for specific API endpoints
 * Call this function for critical operations that need special handling
 */
export async function criticalFetch(url, options = {}) {
  try {
    const result = await wrapperFetch(url, options);
    return { success: true, data: result };
  } catch (error) {
    // Don't re-throw if it's a global session error, as that's handled by the overlay.
    // If it's another type of error, still return its details.
    return {
      success: false,
      error: error.message,
      status: error.status,
      data: error.data
    };
  }
}