import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../Middleware/wrapperFetch';
import logo from "../Web Image/logo 2.png";

const ResetPassword = () => {
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Retrieve email from localStorage
  const email = localStorage.getItem("passresetmail") || "";

  // Custom font style using WDXL Lubrifont TC
  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
  };

  // Function to calculate password strength (score 0 to 4)
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // Map strength score to a label and grayscale color.
  let strengthLabel = "";
  let strengthColor = "";
  if (passwordStrength <= 1) {
    strengthLabel = "Very Weak";
    strengthColor = "#555"; // dark grey
  } else if (passwordStrength === 2) {
    strengthLabel = "Weak";
    strengthColor = "#888"; // medium grey
  } else if (passwordStrength === 3) {
    strengthLabel = "Medium";
    strengthColor = "#bbb"; // light grey
  } else if (passwordStrength === 4) {
    strengthLabel = "Strong";
    strengthColor = "#fff"; // white
  }

  // Handler for OTP input changes.
  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]$/.test(val)) {
      const newOtp = [...otpValues];
      newOtp[index] = val;
      setOtpValues(newOtp);
      if (val && index < otpValues.length - 1) {
        const nextSibling = e.target.nextSibling;
        if (nextSibling) nextSibling.focus();
      }
    }
  };

  // Handler for Reset Password form submission.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const otpCombined = otpValues.join("");

    if (!otpCombined || otpCombined.length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage("New password is required.");
      return;
    }
    if (!confirmPassword.trim()) {
      setErrorMessage("Confirm password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (passwordStrength < 3) { // Ensures new password meets strength criteria
        setErrorMessage("New password is too weak. Please choose a stronger password.");
        return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    try {
      const responseData = await wrapperFetch(`${backendUrl}/reset-password-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otp: otpCombined,
          new_password: newPassword,
        }),
      });

      if (!responseData) {
        setErrorMessage("An unknown error occurred. Please try again.");
        return;
      }
      if (responseData.error) {
        setErrorMessage(responseData.error);
        return;
      }

      setSuccessMessage(responseData.message || "Password reset successful!");
      // Clear temporary email from localStorage.
      localStorage.removeItem("passresetmail");
      // After a brief delay, navigate to /login.
      setTimeout(() => {
        navigate("/desktop/login");
      }, 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setErrorMessage("Reset Password failed. Please try again later.");
    }
  };

  // Handler to resend OTP for password reset.
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
          purpose: "password_reset",
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
        responseData.message || "A new OTP has been sent for password reset. Please check your email."
      );
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setErrorMessage("Failed to resend OTP. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-600 rounded-md p-6">
        {/* pixalPedia Logo */}
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
            Reset Your Password
          </h2>
          <p className="text-gray-400">
            Enter the OTP sent to your email, then set your new password.
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

        {/* Reset Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* OTP Input Boxes */}
          <div className="flex justify-center space-x-2">
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(e, index)}
                className="w-12 h-12 text-center bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
                style={customTextStyle}
              />
            ))}
          </div>

          {/* Resend OTP Option */}
          <div className="text-center mt-4" style={customTextStyle}>
            <span className="text-gray-400">
              Didn't get OTP? Check your spam folder or{" "}
            </span>
            <button 
              type="button"
              onClick={handleResendOtp}
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
            >
              Resend OTP
            </button>
          </div>

          {/* New Password Input with Eye Icon Toggle */}
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
            <button 
              type="button"
              onClick={() => setShowNewPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-white focus:outline-none"
            >
              <i className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
            </button>
          </div>

          {/* Confirm Password Input with Eye Icon Toggle */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              style={customTextStyle}
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-white focus:outline-none"
            >
              <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
            </button>
          </div>

          {/* Password Strength Indicator for New Password */}
          <div className="w-1/2 flex items-center justify-end mt-2">
            <div className="w-3/4 h-2 rounded bg-gray-700 mr-2">
              <div 
                className="h-full rounded" 
                style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
              ></div>
            </div>
            <div className="w-1/2 text-sm font-medium" style={{ color: strengthColor, ...customTextStyle }}>
              {strengthLabel}
            </div>
          </div>

          {/* Reset Password Button */}
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
            Back to{" "}
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
            href="/desktop/Forgotpassword" 
            className="text-blue-500 hover:text-blue-400 transition-colors"
            style={customTextStyle}
          >
            Re-enter email address
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

export default ResetPassword;
