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
 * A wrapper around the native fetch function for API calls.
 *
 * For public pages ("/login", "/signup", "/Forgotpassword", "/Resetpassword", "/Confirmemail"),
 * only two headers are sent: a TS token (ts header) and a login header with value "false".
 * For protected pages, the user data is verified and additional authentication headers are added.
 * The default headers for protected pages do NOT forcibly include "Content-Type": "application/json"
 * so that requests with multi-part form data or other content types can supply their own.
 * If user data is missing on a protected page or the API returns a 401 error,
 * the user is redirected to the `/loading` page.
 *
 * @param {string} url - The API endpoint to call.
 * @param {object} [options={}] - Optional custom fetch options and headers.
 * @returns {Promise<object|null>} - The JSON response or null if an error occurred.
 */
export default async function wrapperFetch(url, options = {}) {
  // Generate a fresh TS token.
  const tsToken = generateTSToken();

  // Define public route paths.
  const publicPaths = [
    "/desktop/login",
    "/desktop/signup",
    "/desktop/Forgotpassword",
    "/desktop/Resetpassword",
    "/desktop/Confirmemail",
    // Adding mobile paths for thoroughness as you have them in your app
    "/mobile/login",
    "/mobile/signup",
    "/mobile/Forgotpassword",
    "/mobile/Resetpassword",
    "/mobile/Confirmemail",
  ];
  const currentPath = window.location.pathname;
  const isPublicPage = publicPaths.includes(currentPath);

  let defaultHeaders = {};

  if (isPublicPage) {
    // For public pages, send only ts token and login set to false.
    defaultHeaders = {
      ts: tsToken,
      login: "false",
      // Include Content-Type for public pages that might send JSON bodies (e.g., login/signup)
      "Content-Type": "application/json",
    };
  } else {
    // For protected pages, retrieve the required user data and tokens.
    const userId = localStorage.getItem("userId");
    const authToken = localStorage.getItem("authToken"); // Retrieve authToken
    const sessionToken = localStorage.getItem("sessionToken"); // Retrieve sessionToken

    // Updated isAuthenticated check to rely on the actual tokens
    const isAuthenticated = Boolean(userId && authToken && sessionToken);

    if (!isAuthenticated) {
      console.warn("Authentication tokens missing on a protected page. Redirecting to login.");
      // Redirect to the appropriate login page based on current path, or a general base login
      const baseLoginPath = currentPath.startsWith('/mobile') ? '/mobile/login' : '/desktop/login';
      window.location.href = baseLoginPath;
      return null;
    }

    // Include userId and authentication headers using the tokens from localStorage.
    defaultHeaders = {
      ts: tsToken,
      "x-user-id": userId, // Continue sending user ID
      // Send the authToken in the Authorization header (Bearer token scheme)
      "Authorization": `Bearer ${authToken}`,
      // Send the sessionToken in a custom header
      "X-Session-Token": sessionToken,
      login: "true", // Keep existing 'login' header
      // Add default Content-Type for protected pages, can be overridden by options.headers
      "Content-Type": "application/json",
    };
  }

  // Merge default options.
  // CRITICAL CHANGE: Remove 'credentials: "include"' here if you are NO LONGER using HTTP-only cookies
  // for primary authentication tokens and are relying SOLELY on localStorage + headers.
  // Set to 'omit' to ensure no unnecessary cookies are sent with requests meant for token-based auth.
  const finalOptions = {
    ...options, // Spread any options passed in
    headers: {
      ...defaultHeaders, // Start with the headers determined above
      ...(options.headers || {}), // Merge any custom headers from the options parameter
    },
    // The previous defaultOptions had credentials: "include". We are overriding/removing it.
    // If you explicitly want to NOT send cookies with these requests, use 'omit'.
    credentials: 'omit' // Explicitly tells the browser NOT to send cookies automatically.
                        // This aligns with your choice to use localStorage tokens.
  };

  try {
    const response = await fetch(url, finalOptions);

    // Global 401/403 unauthorized handling.
    if (response.status === 401 || response.status === 403) {
      console.warn("Unauthorized or Forbidden request. Logging out user.");
      // Clear all authentication-related localStorage items
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      localStorage.removeItem("authToken"); // Clear authToken
      localStorage.removeItem("sessionToken"); // Clear sessionToken

      // Redirect to the appropriate login page after clearing tokens
      const baseLoginPath = currentPath.startsWith('/mobile') ? '/mobile/login' : '/desktop/login';
      window.location.href = baseLoginPath;
      return null;
    }
    if (!response.ok) {
      // Attempt to parse error body if available, otherwise use statusText
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API Error ${response.status}: ${errorBody.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    // You might want to re-throw a more specific error or return a structured error object
    return null;
  }
}