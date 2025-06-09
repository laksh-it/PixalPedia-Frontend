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
 * For protected pages, the user data and authentication tokens are retrieved from localStorage
 * and added to the request headers. The default headers for protected pages do NOT forcibly
 * include "Content-Type": "application/json" so that requests with multi-part form data
 * or other content types can supply their own.
 * If user data, authToken, or sessionToken is missing on a protected page or the API returns a 401 error,
 * the user is redirected to the `/` page.
 *
 * @param {string} url - The API endpoint to call.
 * @param {object} [options={}] - Optional custom fetch options and headers.
 * @returns {Promise<object|{status: number, message: string}|null>} - The JSON response, a special object for 304, or null if an error occurred.
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
  ];
  const currentPath = window.location.pathname;
  const isPublicPage = publicPaths.includes(currentPath);

  let defaultHeaders = {};

  if (isPublicPage) {
    // For public pages, send only ts token and login set to false.
    defaultHeaders = {
      ts: tsToken,
      login: "false",
    };
  } else {
    // For protected pages, retrieve the required user data and auth/session tokens.
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    const authToken = localStorage.getItem("authToken");   // Retrieve authToken
    const sessionToken = localStorage.getItem("sessionToken"); // Retrieve sessionToken

    // isAuthenticated now also depends on the presence of both tokens
    const isAuthenticated = Boolean(userId && email && username && authToken && sessionToken);

    if (!isAuthenticated) {
      console.warn("User not logged in, or auth/session token missing on a protected page. Redirecting to /.");
      window.location.href = "/"; // Redirect to home/login page
      return null;
    }

    // Include userId, authentication headers, and the Authorization token.
    defaultHeaders = {
      ts: tsToken,
      login: "true",
      "x-user-id": userId,
      // Standard way to send JWT/Bearer tokens
      'Authorization': `Bearer ${authToken}`,
      // Custom header for session token, adjust 'X-Session-Token' if your backend expects a different name
      'X-Session-Token': sessionToken,
    };
  }

  const finalOptions = {
    ...options, // Spread existing options first
    headers: {
      ...defaultHeaders, // Default headers (including Authorization and X-Session-Token) go first
      ...(options.headers || {}), // Any custom headers from options override defaults
    },
  };

  // Explicitly remove credentials if it's somehow passed in options to prevent cookie sending
  if (finalOptions.credentials) {
    delete finalOptions.credentials;
  }

  try {
    const response = await fetch(url, finalOptions);

    // --- CRITICAL ADDITION: Handle 304 Not Modified status ---
    if (response.status === 304) {
      console.log(`Resource at ${url} not modified. Using cached version.`);
      // Return a specific object to signal 304, so the calling component can handle it.
      return { status: 304, message: "Not Modified" };
    }
    // --- END CRITICAL ADDITION ---

    if (response.status === 401) {
      console.warn("Unauthorized request. Auth or session token might be expired or invalid. Redirecting to /.");
      // Clear all relevant tokens and user data on 401
      localStorage.removeItem('authToken');
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      window.location.href = "/"; // Redirect to home/login page
      return null;
    }
    if (!response.ok) {
      // For other non-OK statuses (e.g., 400, 403, 500) that *do* have a body.
      // Attempt to parse JSON for more detailed error messages if available.
      let errorData = {};
      try {
        errorData = await response.json(); // Attempt to parse JSON error body
      } catch (e) {
        // If parsing JSON fails, it's likely a non-JSON error response or empty body
        console.warn(`Could not parse error JSON for status ${response.status}:`, e);
      }
      throw new Error(
        `API Error: ${response.statusText} (Status: ${response.status})${errorData.message ? ` - ${errorData.message}` : ''}`
      );
    }

    // Only parse JSON if the response status is OK (200-299) and not 304
    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    // You might want more specific error handling here based on the type of error
    return null;
  }
}