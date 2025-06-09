import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';

const GithubAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGithubAuth = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        // Keep backendUrl as full URL for direct OAuth redirects if needed for initial calls
        // For subsequent proxied API calls, wrapperFetch handles it.
        const backendUrl = process.env.REACT_APP_BACKEND_URL;

        const deviceType = localStorage.getItem('deviceType') || 'tablet';

        // Check if we're coming from OAuth redirect with user data AND tokens in URL
        const userDataParam = urlParams.get('user');
        const authTokenParam = urlParams.get('authToken');
        const sessionTokenParam = urlParams.get('sessionToken');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          console.error("GitHub authentication failed:", errorParam);
          navigate(`/${deviceType}/login`);
          return;
        }

        // --- Scenario 1: Tokens and user data received directly via URL params ---
        if (userDataParam && authTokenParam && sessionTokenParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));

            // Save user details locally from the URL parameter
            if (userData) {
              localStorage.setItem('userId', userData.id);
              localStorage.setItem('email', userData.email);
              localStorage.setItem('username', userData.username);
            }

            // Store authToken and sessionToken directly from URL parameters
            localStorage.setItem('authToken', authTokenParam);
            localStorage.setItem('sessionToken', sessionTokenParam);

            console.log("GitHub authentication successful (from URL):", userData);
            navigate(`/${deviceType}/Setuprofile`);
            return; // Exit as we've handled the authentication
          } catch (parseError) {
            console.error("Error parsing user data from URL:", parseError);
            // If parsing fails, you might want to try Method 2 as a fallback,
            // or navigate to login directly based on severity of parse error.
            // For now, we'll let it fall through to Method 2.
          }
        }

        // --- Scenario 2: No tokens in URL params, or parsing failed. Fetch user data from backend ---
        // This 'wrapperFetch' call should now implicitly include Authorization headers
        // if the user's browser has already received them (e.g., from the OAuth redirect itself
        // or a previous login).
        // Since you've removed res.cookie calls, 'credentials: 'include'' is no longer relevant
        // for *getting* cookies from this specific fetch response.
        // If your backend for /auth/github/user sends JSON tokens, wrapperFetch will handle them.
        const responseData = await wrapperFetch(`${backendUrl}/auth/github/user`, {
          method: 'GET',
          // credentials: 'omit' // Explicitly 'omit' if not expecting any cookies, or remove if wrapperFetch defaults
        });

        if (!responseData || responseData.error) {
          console.error("GitHub authentication failed:", responseData?.error || "No data received.");
          navigate(`/${deviceType}/login`);
          return;
        }

        // Save user details from the fetch response
        const user = responseData.user;
        if (user) {
          localStorage.setItem('userId', user.id);
          localStorage.setItem('email', user.email);
          localStorage.setItem('username', user.username);
        }

        // Store authToken and sessionToken from the fetch response
        if (responseData.authToken) {
          localStorage.setItem('authToken', responseData.authToken);
        }
        if (responseData.sessionToken) {
          localStorage.setItem('sessionToken', responseData.sessionToken);
        }

        console.log("GitHub authentication successful (from fetch):", responseData);
        navigate(`/${deviceType}/Setuprofile`);
      } catch (error) {
        console.error("GitHub authentication error:", error);
        const deviceTypeOnError = localStorage.getItem('deviceType') || 'tablet';
        navigate(`/${deviceTypeOnError}/login`);
      }
    };

    handleGithubAuth();
  }, [navigate, location, backendUrl]); // Added backendUrl to dependencies for robustness

  return <div>Authenticating GitHub login...</div>;
};

export default GithubAuth;