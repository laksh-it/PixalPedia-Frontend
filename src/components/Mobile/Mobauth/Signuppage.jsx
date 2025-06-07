import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';
import logo from "../../Web Image/logo 2.png";

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);

  let strengthLabel = '';
  let strengthColor = '';
  if (passwordStrength <= 1) {
    strengthLabel = 'Very Weak';
    strengthColor = '#555';
  } else if (passwordStrength === 2) {
    strengthLabel = 'Weak';
    strengthColor = '#888';
  } else if (passwordStrength === 3) {
    strengthLabel = 'Medium';
    strengthColor = '#bbb';
  } else if (passwordStrength === 4) {
    strengthLabel = 'Strong';
    strengthColor = '#fff';
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // --- Start: Added validation for required fields ---
    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('All fields are required.');
      return; // Stop the form submission if fields are empty
    }
    // --- End: Added validation for required fields ---

    // Disallow submission if password strength is less than Medium.
    if (passwordStrength < 3) {
      setErrorMessage("Password is too weak. Please choose a stronger password.");
      return;
    }

    const payload = {
      email,
      password,
      username,
    };

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const responseData = await wrapperFetch(`${backendUrl}/signup`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!responseData) {
        setErrorMessage("An unknown error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      console.log('Signup successful:', responseData);
      localStorage.setItem('tempmail', email);
      localStorage.setItem('temppassword', password);
      navigate('/mobile/Confirmemail');
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage("Signup failed. Please try again later.");
    }
  };

  const handleGoogleSignup = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubSignup = () => {
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

        <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5 md:space-y-6">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Name"
              className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-base text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
              style={customTextStyle}
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-base text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
              style={customTextStyle}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-3 pr-10 py-2 text-base text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
              style={customTextStyle}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 md:pr-4">
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-white focus:outline-none"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm sm:text-base md:text-lg`}></i>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end mt-1 w-full">
            <div className="w-3/4 h-2 rounded bg-gray-700 mr-1 sm:mr-2">
              <div
                className="h-full rounded"
                style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
              ></div>
            </div>
            <div className="w-1/4 text-xs sm:text-sm font-medium" style={{ color: strengthColor, ...customTextStyle }}>
              {strengthLabel}
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordStrength < 3}
            className={`w-full ${passwordStrength < 3 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white font-medium py-2 rounded-lg transition-colors text-sm sm:text-base md:py-2.5`}
            style={customTextStyle}
          >
            Sign Up
          </button>

          <div className="border-t border-gray-600 mt-4 sm:mt-5 md:mt-6"></div>
        </form>

        <div className="mt-5 sm:mt-6 md:mt-8">
          <div className="text-center text-gray-400 mb-4 sm:mb-5 md:mb-6" style={customTextStyle}>
            Also Sign Up With
          </div>
          <div className="flex justify-center space-x-5 sm:space-x-6 md:space-x-8">
            <button
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGoogleSignup}
            >
              <i className="fab fa-google text-xl sm:text-2xl md:text-3xl text-white transition-colors group-hover:text-blue-500"></i>
            </button>
            <button
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-transparent rounded-full flex items-center justify-center group"
              onClick={handleGithubSignup}
            >
              <i className="fab fa-github text-xl sm:text-2xl md:text-3xl text-white transition-colors group-hover:text-blue-500"></i>
            </button>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-5 md:mt-6">
          <span className="text-gray-400 text-xs sm:text-sm md:text-base" style={customTextStyle}>
            Already have an account?{' '}
          </span>
          <a
            href="/mobile/login"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm md:text-base"
            style={customTextStyle}
          >
            Log In
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

export default Signup;