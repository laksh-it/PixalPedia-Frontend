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
    // For protected pages, retrieve the required user data.
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    const isAuthenticated = Boolean(userId && email && username);

    if (!isAuthenticated) {
      console.warn("User not logged in on a protected page. Redirecting to /loading.");
      window.location.href = "/";
      return null;
    }

    // Include userId and authentication headers.
    defaultHeaders = {
      ts: tsToken,
      Authentication: "auth",
      login: "true",
      "x-user-id": userId,
    };
  }

  // Merge default options (like credentials: "include") with any provided options.
  const defaultOptions = { credentials: "include" };
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, finalOptions);

    if (response.status === 401) {
      console.warn("Unauthorized request. Redirecting to /loading.");
      window.location.href = "/";
      return null;
    }
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
}
