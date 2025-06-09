import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch'; // Adjust the path as needed
import logo from "../../Web Image/logo 2.png";
// No need to import logobr if we're removing the left image

const Login = () => {
  // State for text fields and errors.
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Custom font style.
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  // Standard email/password login.
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear any previous error messages

    // --- Start: Added validation for required fields ---
    if (!login.trim() || !password.trim()) {
      setErrorMessage('All fields are required.');
      return; // Stop the form submission if fields are empty
    }
    // --- End: Added validation for required fields ---

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL; // Fallback for local development
      const responseData = await wrapperFetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: login, // can be username or email
          password: password,
        }),
      });

      if (!responseData) {
        setErrorMessage("An error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      // --- START: MODIFICATIONS FOR TOKEN STORAGE ---
      // Save user details locally.
      const user = responseData.user;
      if (user) {
        localStorage.setItem('userId', user.id);
        localStorage.setItem('email', user.email);
        localStorage.setItem('username', user.username);
      }

      // Store authToken and sessionToken from the response in localStorage.
      if (responseData.authToken) {
        localStorage.setItem('authToken', responseData.authToken);
      }
      if (responseData.sessionToken) {
        localStorage.setItem('sessionToken', responseData.sessionToken);
      }
      // --- END: MODIFICATIONS FOR TOKEN STORAGE ---

      // Tokens are set as HTTP-only cookies by the server.
      // Redirect to home.
      navigate('/tablet/Setuprofile');
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("Login failed. Please try again later.");
    }
  };

  // Redirect to backend for OAuth.
  const handleGoogleLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4"> {/* Centering adjustments */}
      {/* Login Form Container - now centered and styled like ForgotPassword */}
      <div className="w-full max-w-md border border-gray-600 rounded-md p-6"> {/* Added border, padding, rounded */}
        {/* Logo */}
        <div className="text-center mb-8"> {/* Adjusted margin-bottom for spacing */}
          <img
            src={logo}
            alt="pixalPedia Logo"
            className="mx-auto h-16 w-auto"
          />
          <div className="border-t border-gray-600 mx-auto w-full mt-4"></div> {/* Divider below logo */}
        </div>

        {/* Display error messages */}
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center" style={customTextStyle}>
            {errorMessage}
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Email address"
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-white focus:outline-none"
            >
              <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            style={customTextStyle}
          >
            Log In
          </button>
          <div className="border-t border-gray-600 mt-6"></div> {/* Divider below login button */}
        </form>

        {/* Social Login Options */}
        <div className="mt-8">
          <div className="text-center text-gray-400 mb-6" style={customTextStyle}>
            Also Log in With
          </div>
          <div className="flex justify-center space-x-8">
            <button
              className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGoogleLogin}
            >
              <i className="fab fa-google text-3xl text-white transition-colors group-hover:text-gray-400"></i>
            </button>
            <button
              className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGithubLogin}
            >
              <i className="fab fa-github text-3xl text-white transition-colors group-hover:text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Additional Links */}
        <div className="text-center mt-8">
          <a
            href="/tablet/Forgotpassword"
            className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            style={customTextStyle}
          >
            Forgotten your password?
          </a>
        </div>
        <div className="text-center mt-6">
          <span className="text-gray-400" style={customTextStyle}>
            Don't have an account?{' '}
          </span>
          <a
            href="/tablet/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors"
            style={customTextStyle}
          >
            Sign up
          </a>
        </div>
      </div>

      {/* External stylesheets - best placed in public/index.html <head> */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+TC:wght@300;400;500;600&display=swap"
      />
    </div>
  );
};

export default Login;