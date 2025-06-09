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
 * For protected pages, the user data (userId, email, username) is verified from localStorage,
 * and the authToken and sessionToken are added to the request headers from localStorage.
 * The default headers for protected pages do NOT forcibly include "Content-Type": "application/json"
 * so that requests with multi-part form data or other content types can supply their own.
 * If user data is missing on a protected page or the API returns a 401 error,
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
    // For protected pages, retrieve the required user data for isAuthenticated check.
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");

    // The isAuthenticated check remains exactly as per your specified logic.
    const isAuthenticated = Boolean(userId && email && username);

    if (!isAuthenticated) {
      console.warn("User not logged in on a protected page. Redirecting to /.");
      window.location.href = "/";
      return null;
    }

    // Retrieve authToken and sessionToken from localStorage.
    // Their presence is not strictly required for the 'isAuthenticated' boolean above,
    // but they will be added to headers if found.
    const authToken = localStorage.getItem("authToken");
    const sessionToken = localStorage.getItem("sessionToken");

    // Include userId and authentication headers.
    defaultHeaders = {
      ts: tsToken,
      Authentication: "auth", // Keeping this as per your previous "working" version
      login: "true",
      "x-user-id": userId,
    };

    // --- ADD AUTH AND SESSION TOKENS TO HEADERS IF THEY EXIST ---
    // These will be added regardless of the initial `isAuthenticated` check,
    // as long as they are present in localStorage.
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    if (sessionToken) {
      // Use a custom header name your backend expects, e.g., 'X-Session-Token'
      defaultHeaders['X-Session-Token'] = sessionToken;
    }
    // --- END ADDITION ---
  }

  // --- REMOVE `credentials: "include"` AND ENSURE NO COOKIES ARE SENT ---
  // We explicitly set 'credentials: "omit"' to prevent the browser from sending cookies.
  const finalOptions = {
    ...options, // Spread existing options first
    headers: {
      ...defaultHeaders, // Default headers (now including tokens) go first
      ...(options.headers || {}), // Any custom headers from options override defaults
    },
    credentials: 'omit', // Explicitly tell fetch not to send cookies
  };
  // --- END REMOVAL ---

  try {
    const response = await fetch(url, finalOptions);

    // --- CRITICAL ADDITION: Handle 304 Not Modified status ---
    if (response.status === 304) {
      console.log(`Resource at ${url} not modified. Using cached version.`);
      return { status: 304, message: "Not Modified" }; // Signal 304 to the caller
    }
    // --- END CRITICAL ADDITION ---

    if (response.status === 401) {
      console.warn("Unauthorized request. Redirecting to /.");
      // Clear all relevant tokens and user data on 401 for a clean logout
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
      let errorData = {};
      try {
        errorData = await response.json(); // Attempt to parse JSON error body
      } catch (e) {
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
    return null;
  }
}