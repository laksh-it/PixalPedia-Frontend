import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';
import logo from "../Web Image/logo 2.png";

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
        navigate('/desktop/Resetpassword');
      }, 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setErrorMessage("Reset Password failed. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-600 rounded-md p-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="pixalPedia Logo" 
            className="mx-auto h-16 w-auto"
          />
          <div className="border-t border-gray-600 mx-auto w-full mt-4"></div>
        </div>

        {/* Header & Description */}
        <div className="text-center mb-6" style={customTextStyle}>
          <h2 className="text-3xl font-bold text-white mb-2">
            Forgot Your Password?
          </h2>
          <p className="text-gray-400">
            Enter your email address below and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center" style={customTextStyle}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 text-green-500 text-center" style={customTextStyle}>
            {successMessage}
          </div>
        )}

        {/* Forgot Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
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
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            style={customTextStyle}
          >
            Reset Password
          </button>
        </form>

        {/* Navigation Links */}
        <div className="text-center mt-6">
          <span className="text-gray-400" style={customTextStyle}>
            Remember your password?{' '}
          </span>
          <a 
            href="/desktop/login" 
            className="text-blue-500 hover:text-blue-400 transition-colors"
            style={customTextStyle}
          >
            Log In
          </a>
        </div>
        <div className="text-center mt-4">
          <a 
            href="/desktop/signup" 
            className="text-blue-500 hover:text-blue-400 transition-colors"
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
