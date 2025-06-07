import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';
import logo from "../Web Image/logo 2.png";
import logobr from "../Web Image/mainwalt.png";

const Signup = () => {
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  // Custom font style using WDXL Lubrifont TC
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  // Function to calculate password strength (score from 0 to 4)
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Map the strength score to a label and a grayscale color.
  let strengthLabel = '';
  let strengthColor = '';
  if (passwordStrength <= 1) {
    strengthLabel = 'Very Weak';
    strengthColor = '#555'; // dark grey
  } else if (passwordStrength === 2) {
    strengthLabel = 'Weak';
    strengthColor = '#888'; // medium grey
  } else if (passwordStrength === 3) {
    strengthLabel = 'Medium';
    strengthColor = '#bbb'; // light grey
  } else if (passwordStrength === 4) {
    strengthLabel = 'Strong';
    strengthColor = '#fff'; // white
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // --- Start: Added validation for required fields ---
    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('All fields are required.');
      return; // Stop the form submission if any field is empty
    }
    // --- End: Added validation for required fields ---
    
    // Disallow submission if password strength is less than Medium.
    if (passwordStrength < 3) {
      setErrorMessage("Password is too weak. Please choose a stronger password.");
      return;
    }
    
    // Construct the request payload.
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
      // Store email and password in localStorage
      localStorage.setItem('tempmail', email);
      localStorage.setItem('temppassword', password);
      navigate('/desktop/Confirmemail');
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage("Signup failed. Please try again later.");
    }
  };

  // Handlers to initiate social signup via Google and GitHub.
  const handleGoogleSignup = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubSignup = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.location.href = `${backendUrl}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Single Background Image */}
      <div className="w-1/2 relative flex items-center justify-center">
        <img 
          src={logobr}
          alt="Wallpaper Preview" 
          className="max-w-[90%] max-h-[90%] object-contain"
        />
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-1/2 bg-black flex flex-col justify-center items-center px-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-12">
            <img 
              src={logo} 
              alt="pixalPedia Logo" 
              className="mx-auto h-16 w-auto"
            />
          </div>

          {/* Display error message if any */}
          {errorMessage && (
            <div className="mb-4 text-red-500 text-center" style={customTextStyle}>
              {errorMessage}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Username Input */}
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Name"
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
                style={customTextStyle}
              />
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
                style={customTextStyle}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
                style={customTextStyle}
              />
              {/* Eye Icon Toggle */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <button 
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-white focus:outline-none"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
                </button>
              </div>
            </div>

            {/* Password Strength Indicator: Container occupies 50% width, with bar (75%) and label (25%) aligned to right */}
            <div className="w-1/2 flex items-center justify-end mt-2">
              <div className="w-3/4 h-2 rounded bg-gray-700 mr-2">
                <div 
                  className="h-full rounded" 
                  style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
                ></div>
              </div>
              <div className="w-1/4 text-sm font-medium" style={{ color: strengthColor, ...customTextStyle }}>
                {strengthLabel}
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={passwordStrength < 3}
              className={`w-full ${passwordStrength < 3 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white font-medium py-3 rounded-lg transition-colors`}
              style={customTextStyle}
            >
              Sign Up
            </button>

            {/* Separator */}
            <div className="border-t border-gray-600 mt-6"></div>
          </form>

          {/* Social Signup Options */}
          <div className="mt-8">
            <div className="text-center text-gray-400 mb-6" style={customTextStyle}>
              Also Sign Up With
            </div>
            <div className="flex justify-center space-x-8">
              {/* Google Signup */}
              <button 
                className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center group"
                onClick={handleGoogleSignup}
              >
                <i className="fab fa-google text-3xl text-white transition-colors group-hover:text-gray-400"></i>
              </button>
              {/* GitHub Signup */}
              <button 
                className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center group"
                onClick={handleGithubSignup}
              >
                <i className="fab fa-github text-3xl text-white transition-colors group-hover:text-gray-400"></i>
              </button>
            </div>
          </div>

          {/* Already have an account? Login */}
          <div className="text-center mt-6">
            <span className="text-gray-400" style={customTextStyle}>
              Already have an account?{' '}
            </span>
            <a 
              href="/desktop/login" 
              className="text-blue-500 hover:text-blue-400 transition-colors"
              style={customTextStyle}
            >
              Log In
            </a>
          </div>
        </div>
      </div>

      {/* External CSS Resources */}
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
