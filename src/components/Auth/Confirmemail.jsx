import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';
import logo from "../Web Image/logo 2.png";

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
      navigate("/desktop/Setuprofile");
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

        {/* Header and Description */}
        <div className="text-center mb-6" style={customTextStyle}>
          <h2 className="text-3xl font-bold text-white mb-2">
            Confirm Your Email
          </h2>
          <p className="text-gray-400">
            Enter the OTP sent to your email.
          </p>
        </div>

        {/* Success or Error Message */}
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

        {/* Confirm Email Form */}
        <form onSubmit={handleConfirmOTP} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(e, index)}
                className="w-12 h-12 text-center bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                style={customTextStyle}
              />
            ))}
          </div>

          {/* Resend OTP Option */}
          <div className="text-center mt-4" style={customTextStyle}>
            <span className="text-gray-400">
              Didn't receive OTP? Check your spam folder or{" "}
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
            >
              Resend OTP
            </button>
          </div>

          {/* Confirm OTP Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            style={customTextStyle}
          >
            Confirm OTP
          </button>
        </form>

        {/* Navigation Link */}
        <div className="text-center mt-4">
          <span className="text-gray-400" style={customTextStyle}>
            Back to Sign Up?{" "}
          </span>
          <a
            href="/desktop/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors"
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
