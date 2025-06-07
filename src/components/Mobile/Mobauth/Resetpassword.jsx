import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wrapperFetch from '../../Middleware/wrapperFetch';
import logo from "../../Web Image/logo 2.png";

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

    // --- Start: All fields required validation ---
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
    if (passwordStrength < 3) { // Ensure new password meets strength criteria
        setErrorMessage("New password is too weak. Please choose a stronger password.");
        return;
    }
    // --- End: All fields required validation ---

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
        navigate("/mobile/login");
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
    <div className="min-h-screen bg-black flex items-center justify-center px-2 sm:px-3 md:px-4"> {/* Compacted px */}
      <div className="w-full max-w-sm sm:max-w-md border border-gray-600 rounded-md p-4 sm:p-5 md:p-6"> {/* Compacted max-w and p */}
        {/* pixalPedia Logo */}
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
            Reset Your Password
          </h2>
          <p className="text-gray-400 text-sm sm:text-base"> {/* Compacted text size */}
            Enter the OTP sent to your email, then set your new password.
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

        {/* Reset Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5"> {/* Compacted space-y */}
          {/* OTP Input Boxes */}
          <div className="flex justify-center space-x-1 sm:space-x-2"> {/* Compacted space-x */}
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(e, index)}
                // Safari auto-zoom fix: text-base (16px) and smaller w/h
                className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-transparent border border-gray-600 rounded-lg text-base text-white placeholder-gray-400 transition-colors focus:outline-none focus:border-blue-500"
                style={customTextStyle}
              />
            ))}
          </div>

          {/* Resend OTP Option */}
          <div className="text-center mt-3 sm:mt-4" style={customTextStyle}> {/* Compacted mt */}
            <span className="text-gray-400 text-xs sm:text-sm"> {/* Compacted text size */}
              Didn't get OTP? Check your spam folder or{" "}
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium text-xs sm:text-sm" // Compacted text size
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
              // Safari auto-zoom fix: text-base (16px) and smaller pr
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-3 pr-10 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors" // Compacted px, py, added text-base
              style={customTextStyle}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 md:pr-4 text-white focus:outline-none" // Compacted pr, text size
            >
              <i className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"} text-sm sm:text-base md:text-lg`}></i>
            </button>
          </div>

          {/* Confirm Password Input with Eye Icon Toggle */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              // Safari auto-zoom fix: text-base (16px) and smaller pr
              className="w-full bg-transparent border border-gray-600 rounded-lg pl-3 pr-10 py-2 text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors" // Compacted px, py, added text-base
              style={customTextStyle}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 md:pr-4 text-white focus:outline-none" // Compacted pr, text size
            >
              <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-sm sm:text-base md:text-lg`}></i>
            </button>
          </div>

          {/* Password Strength Indicator for New Password */}
          <div className="w-full flex items-center justify-end mt-1"> {/* Changed w-1/2 to w-full, compacted mt */}
            <div className="w-3/4 h-2 rounded bg-gray-700 mr-1 sm:mr-2"> {/* Compacted mr */}
              <div
                className="h-full rounded"
                style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
              ></div>
            </div>
            <div className="w-1/4 text-xs sm:text-sm font-medium" style={{ color: strengthColor, ...customTextStyle }}> {/* Compacted text size */}
              {strengthLabel}
            </div>
          </div>

          {/* Reset Password Button */}
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
            Back to{" "}
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
            href="/mobile/Forgotpassword"
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs sm:text-sm" // Compacted text size
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