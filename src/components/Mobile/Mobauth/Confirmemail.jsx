import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';
import logo from "../../Web Image/logo 2.png";

const ConfirmEmail = () => {
  // State for OTP digits and messages.
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Retrieve the email (and password) from localStorage.
  const email = localStorage.getItem("tempmail") || "";
  const password = localStorage.getItem("temppassword") || "";

  // Custom font style.
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  // Handler for each OTP input change.
  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]$/.test(val)) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = val;
      setOtpValues(newOtpValues);
      // Auto-focus to the next input if available.
      if (val && index < otpValues.length - 1) {
        const nextSibling = e.target.nextSibling;
        if (nextSibling) {
          nextSibling.focus();
        }
      }
    }
  };

  // Function to perform auto login using stored email and password.
  const autoLogin = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const responseData = await wrapperFetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!responseData) {
        setErrorMessage("An error occurred during login. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      // Save user details if the response includes them.
      const user = responseData.user;
      if (user) {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("email", user.email);
        localStorage.setItem("username", user.username);
      }
      // Clear temporary credentials.
      localStorage.removeItem("tempmail");
      localStorage.removeItem("temppassword");

      // Redirect to home.
      navigate("/mobile/Setuprofile");
    } catch (err) {
      console.error("Auto login failed:", err);
      setErrorMessage("Auto login failed. Please try logging in manually.");
    }
  };

  // Handler to confirm the OTP.
  const handleConfirmOTP = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const otpCombined = otpValues.join("");
    if (otpCombined.length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    try {
      // Send OTP verification to the backend.
      const responseData = await wrapperFetch(`${backendUrl}/verify-email-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, otp: otpCombined }),
      });

      if (!responseData) {
        setErrorMessage("An unknown error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      // Display success message and auto-login.
      setSuccessMessage(responseData.message || "Email verified successfully! Logging in...");
      autoLogin();
    } catch (err) {
      console.error("OTP Verification Error:", err);
      setErrorMessage("OTP verification failed. Please try again later.");
    }
  };

  // Handler to resend OTP.
  const handleResendOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    try {
      const responseData = await wrapperFetch(`${backendUrl}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          purpose: "email_verification",
        }),
      });
      if (!responseData) {
        setErrorMessage("An unknown error occurred while resending OTP. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }
      setSuccessMessage(
        responseData.message ||
          "A new OTP has been sent for email verification. Please check your email."
      );
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setErrorMessage("Failed to resend OTP. Please try again later.");
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

        {/* Header and Description */}
        <div className="text-center mb-4 sm:mb-5" style={customTextStyle}> {/* Compacted mb */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2"> {/* Compacted text size */}
            Confirm Your Email
          </h2>
          <p className="text-gray-400 text-sm sm:text-base"> {/* Compacted text size */}
            Enter the OTP sent to your email.
          </p>
        </div>

        {/* Success or Error Message */}
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

        {/* Confirm Email Form */}
        <form onSubmit={handleConfirmOTP} className="space-y-4 sm:space-y-5"> {/* Compacted space-y */}
          <div className="flex justify-center space-x-1 sm:space-x-2"> {/* Compacted space-x */}
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(e, index)}
                // Safari auto-zoom fix: text-base (16px) and smaller w/h
                className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-transparent border border-gray-600 rounded-lg text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                style={customTextStyle}
              />
            ))}
          </div>

          {/* Resend OTP Option */}
          <div className="text-center mt-3 sm:mt-4" style={customTextStyle}> {/* Compacted mt */}
            <span className="text-gray-400 text-xs sm:text-sm"> {/* Compacted text size */}
              Didn't receive OTP? Check your spam folder or{" "}
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium text-xs sm:text-sm" // Compacted text size
            >
              Resend OTP
            </button>
          </div>

          {/* Confirm OTP Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base" // Compacted py and text size
            style={customTextStyle}
          >
            Confirm OTP
          </button>
        </form>

        {/* Navigation Link */}
        <div className="text-center mt-3 sm:mt-4"> {/* Compacted mt */}
          <span className="text-gray-400 text-xs sm:text-sm" style={customTextStyle}> {/* Compacted text size */}
            Back to Sign Up?{" "}
          </span>
          <a
            href="/mobile/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm" // Compacted text size
            style={customTextStyle}
          >
            Sign Up
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

export default ConfirmEmail;