import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch'; // Adjust the path as needed

const GithubAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGithubAuth = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const backendUrl = process.env.REACT_APP_BACKEND_URL; // Keep full URL for direct OAuth redirects
        
        const deviceType = localStorage.getItem('deviceType') || 'tablet';
        
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
            
            // Store user details
            if (userData) {
              localStorage.setItem('userId', userData.id);
              localStorage.setItem('email', userData.email);
              localStorage.setItem('username', userData.username);
            }

            // Store authToken and sessionToken from URL params
            localStorage.setItem('authToken', authTokenParam);
            localStorage.setItem('sessionToken', sessionTokenParam);
            
            console.log("GitHub authentication successful (from URL):", userData);
            navigate(`/${deviceType}/Setuprofile`);
            return; // Exit as we've handled the authentication
          } catch (parseError) {
            console.error("Error parsing user data from URL:", parseError);
            // Fall through to Method 2 if parsing fails, or handle specifically
          }
        }

        // --- Scenario 2: No tokens in URL, make a fetch call to get user data and tokens ---
        // This is typically for cases where the backend doesn't put tokens in the URL
        // or a fallback if the URL param method fails.
        // If your backend now sends tokens in JSON, make sure this `wrapperFetch` handles it.

        // IMPORTANT: If your backend *also* sets cookies for OAuth, `credentials: 'include'`
        // would be necessary for that. But if you're ONLY sending tokens in JSON,
        // then `credentials: 'omit'` or removing the `credentials` option is fine.
        // Given your current strategy, `credentials: 'omit'` is more aligned.
        const responseData = await wrapperFetch(`${backendUrl}/auth/github/user`, {
          method: 'GET',
          // credentials: 'include' // REMOVE or change to 'omit' if only using JSON tokens
        });

        if (!responseData || responseData.error) {
          console.error("GitHub authentication failed:", responseData?.error || "No data received.");
          navigate(`/${deviceType}/login`);
          return;
        }

        // Store user details
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
  }, [navigate, location]);

  return <div>Authenticating GitHub login...</div>;
};

export default GithubAuth;