import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch'; // Adjust the path as needed
import logo from "../../Web Image/logo 2.png";

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!login.trim() || !password.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const responseData = await wrapperFetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: login,
          password: password,
        }),
      });

      if (!responseData) {
        setErrorMessage("An unexpected error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      const user = responseData.user;
      if (user) {
        localStorage.setItem('userId', user.id);
        localStorage.setItem('email', user.email);
        localStorage.setItem('username', user.username);
      }

      navigate('/mobile/Setuprofile');
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("Login failed. Please try again later.");
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-2 sm:px-3 md:px-4">
      <div className="w-full max-w-sm sm:max-w-md border border-gray-600 rounded-md p-4 sm:p-5 md:p-6">
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <img
            src={logo}
            alt="pixalPedia Logo"
            className="mx-auto h-12 w-auto sm:h-14 md:h-16"
          />
          <div className="border-t border-gray-600 mx-auto w-full mt-2 sm:mt-3 md:mt-4"></div>
        </div>

        {errorMessage && (
          <div className="mb-2 sm:mb-3 md:mb-4 text-red-500 text-center text-sm sm:text-base" style={customTextStyle}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5 md:space-y-6">
          <div>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Email address"
              // *** CHANGE HERE ***
              className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              // *** CHANGE HERE ***
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-3 pr-10 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 md:pr-4 text-white focus:outline-none"
            >
              <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm sm:text-base md:text-lg`}></i>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm sm:text-base md:py-2.5"
            style={customTextStyle}
          >
            Log In
          </button>
          <div className="border-t border-gray-600 mt-4 sm:mt-5 md:mt-6"></div>
        </form>

        {/* Social Login Options */}
        <div className="mt-5 sm:mt-6 md:mt-8">
          <div className="text-center text-gray-400 mb-4 sm:mb-5 md:mb-6" style={customTextStyle}>
            Also Log in With
          </div>
          <div className="flex justify-center space-x-5 sm:space-x-6 md:space-x-8">
            <button
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGoogleLogin}
            >
              <i className="fab fa-google text-xl sm:text-2xl md:text-3xl text-white transition-colors group-hover:text-gray-400"></i>
            </button>
            <button
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGithubLogin}
            >
              <i className="fab fa-github text-xl sm:text-2xl md:text-3xl text-white transition-colors group-hover:text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Additional Links */}
        <div className="text-center mt-5 sm:mt-6 md:mt-8">
          <a
            href="/mobile/Forgotpassword"
            className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xs sm:text-sm md:text-base"
            style={customTextStyle}
          >
            Forgotten your password?
          </a>
        </div>
        <div className="text-center mt-4 sm:mt-5 md:mt-6">
          <span className="text-gray-400 text-xs sm:text-sm md:text-base" style={customTextStyle}>
            Don't have an account?{' '}
          </span>
          <a
            href="/mobile/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm md:text-base"
            style={customTextStyle}
          >
            Sign up
          </a>
        </div>
      </div>

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