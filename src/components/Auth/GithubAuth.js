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
        const backendUrl = process.env.REACT_APP_BACKEND_URL;

        // --- Retrieve device type from localStorage ---
        const deviceType = localStorage.getItem('deviceType') || 'tablet';
        // ----------------------------------------------------

        // Check if we're coming from OAuth redirect with user data in URL
        const userDataParam = urlParams.get('user');
        const authTokenParam = urlParams.get('authToken');
        const sessionTokenParam = urlParams.get('sessionToken');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          console.error("GitHub authentication failed:", errorParam);
          navigate(`/${deviceType}/login`);
          return;
        }

        // --- NEW: Handle data directly from URL params ---
        if (userDataParam && authTokenParam && sessionTokenParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));

            // Save user details to localStorage
            localStorage.setItem('userId', userData.id);
            localStorage.setItem('email', userData.email);
            localStorage.setItem('username', userData.username);

            // Store authToken and sessionToken from the URL in localStorage
            localStorage.setItem('authToken', authTokenParam);
            localStorage.setItem('sessionToken', sessionTokenParam);

            console.log("GitHub authentication successful (from URL params):", userData);
            navigate(`/${deviceType}/Setuprofile`);
            return;
          } catch (parseError) {
            console.error("Error parsing user data from URL:", parseError);
            // Fall through to Method 2 if URL parsing fails
          }
        }
        // --- END NEW ---

        // Method 2: Fetch user data from backend (fallback, if URL params are missing or invalid)
        const responseData = await wrapperFetch(`${backendUrl}/auth/github/user`, {
          method: 'GET',
          // 'credentials: include' is removed as you're moving away from cookies
        });

        if (!responseData || responseData.error) {
          console.error("GitHub authentication failed:", responseData?.error);
          navigate(`/${deviceType}/login`);
          return;
        }

        // Save user details
        const user = responseData.user;
        localStorage.setItem('userId', user.id);
        localStorage.setItem('email', user.email);
        localStorage.setItem('username', user.username);

        // Store authToken and sessionToken from the response in localStorage (fallback case)
        if (responseData.authToken) {
          localStorage.setItem('authToken', responseData.authToken);
        }
        if (responseData.sessionToken) {
          localStorage.setItem('sessionToken', responseData.sessionToken);
        }

        console.log("GitHub authentication successful (from backend fallback):", responseData);
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