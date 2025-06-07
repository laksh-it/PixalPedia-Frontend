import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';
import logo from "../../Web Image/logo 2.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  // Custom font style using WDXL Lubrifont TC
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  // Handler for the Forgot Password form submission.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // --- Start: Added validation for required fields ---
    if (!email.trim()) {
      setErrorMessage('Email address is required.'); // More specific error for this page
      return; // Stop the form submission if email is empty
    }
    // --- End: Added validation for required fields ---

    // Save email to localStorage as "passresetmail" for later use.
    localStorage.setItem('passresetmail', email);

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    try {
      const responseData = await wrapperFetch(`${backendUrl}/request-password-reset-otp`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!responseData) {
        setErrorMessage("An unknown error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      // Show a success message so the user knows an OTP was sent.
      setSuccessMessage(responseData.message || "OTP sent for password reset. Please check your email.");
      // After a brief delay, navigate to /Resetpassword.
      setTimeout(() => {
        navigate('/mobile/Resetpassword');
      }, 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setErrorMessage("Reset Password failed. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-2 sm:px-3 md:px-4"> {/* Compacted px */}
      <div className="w-full max-w-sm sm:max-w-md border border-gray-600 rounded-md p-4 sm:p-5 md:p-6"> {/* Compacted max-w and p */}
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8"> {/* Compacted mb */}
          <img
            src={logo}
            alt="pixalPedia Logo"
            className="mx-auto h-12 w-auto sm:h-14 md:h-16" // Compacted logo size
          />
          <div className="border-t border-gray-600 mx-auto w-full mt-2 sm:mt-3 md:mt-4"></div> {/* Compacted mt */}
        </div>

        {/* Header & Description */}
        <div className="text-center mb-4 sm:mb-5" style={customTextStyle}> {/* Compacted mb */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2"> {/* Compacted text size */}
            Forgot Your Password?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base"> {/* Compacted text size */}
            Enter your email address below and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="mb-2 sm:mb-3 text-red-500 text-center text-sm sm:text-base" style={customTextStyle}> {/* Compacted mb and text size */}
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-2 sm:mb-3 text-green-500 text-center text-sm sm:text-base" style={customTextStyle}> {/* Compacted mb and text size */}
            {successMessage}
          </div>
        )}

        {/* Forgot Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5"> {/* Compacted space-y */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              // Safari auto-zoom fix: text-base (16px)
              className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-base text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500" // Compacted px, py, added text-base
              style={customTextStyle}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base" // Compacted py and text size
            style={customTextStyle}
          >
            Reset Password
          </button>
        </form>

        {/* Navigation Links */}
        <div className="text-center mt-4 sm:mt-5"> {/* Compacted mt */}
          <span className="text-gray-400 text-xs sm:text-sm" style={customTextStyle}> {/* Compacted text size */}
            Remember your password?{' '}
          </span>
          <a
            href="/mobile/login"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm" // Compacted text size
            style={customTextStyle}
          >
            Log In
          </a>
        </div>
        <div className="text-center mt-3 sm:mt-4"> {/* Compacted mt */}
          <a
            href="/mobile/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm" // Compacted text size
            style={customTextStyle}
          >
            Create new account
          </a>
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

export default ForgotPassword;