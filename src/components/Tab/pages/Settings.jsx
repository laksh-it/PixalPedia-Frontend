// src/components/Settings.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../elements/MainlayoutTab';
import wrapperFetch from '../../Middleware/wrapperFetch';
import { format } from 'date-fns';

import VerificationRequestModal from '../../elements/VerificationRequestModal'; // Import the new modal

const Settings = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || 'User';

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationRequestSent, setVerificationRequestSent] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Settings');

  const [showVerificationRequestModal, setShowVerificationRequestModal] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationModalError, setVerificationModalError] = useState(null);
  const [verificationModalSuccess, setVerificationModalSuccess] = useState(null);

  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordResetError, setPasswordResetError] = useState("");
  const [passwordResetSuccess, setPasswordResetSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // NEW STATE: For custom logout confirmation modal
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      showNotification('You need to be logged in to view settings.', 'error');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const response = await wrapperFetch(`${backendUrl}/api/settings/${userId}`);
      if (response && response.settings) {
        setSettings(response.settings);
        if (response.settings.profile?.requested_verification_reason) {
          setVerificationRequestSent(true);
        } else {
          setVerificationRequestSent(false);
        }
      } else {
        showNotification(response?.error || 'Failed to load settings.', 'error');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      showNotification('An unexpected error occurred while loading settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, backendUrl, showNotification, navigate]);

  const fetchVerificationStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await wrapperFetch(`${backendUrl}/api/fetch/verified/${userId}/status`);
      if (response && typeof response.verified === 'boolean') {
        setIsVerified(response.verified);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  }, [userId, backendUrl]);

  useEffect(() => {
    fetchSettings();
    fetchVerificationStatus();
  }, [fetchSettings, fetchVerificationStatus]);

  const handleDisconnectProvider = async (provider) => {
    if (!userId) {
      showNotification('User not logged in.', 'error');
      return;
    }

    // Using a custom confirm here as well
    if (window.confirm(`Are you sure you want to disconnect your ${provider} account?`)) { // You might want to make this a custom modal too for consistency
      try {
        const response = await wrapperFetch(`${backendUrl}/api/settings/disconnect`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, provider }),
        });

        if (response && response.message) {
          showNotification(response.message, 'success');
          fetchSettings();
        } else {
          showNotification(response?.error || `Failed to disconnect ${provider}.`, 'error');
        }
      } catch (err) {
        console.error(`Error disconnecting ${provider}:`, err);
        showNotification(`An unexpected error occurred while disconnecting ${provider}.`, 'error');
      }
    }
  };

  const handleRequestVerification = () => {
    setShowVerificationRequestModal(true);
    setVerificationModalError(null);
    setVerificationModalSuccess(null);
  };

  const handleSubmitVerificationRequest = async (reason) => {
    if (!userId) {
      setVerificationModalError('User not logged in.');
      showNotification('User not logged in.', 'error');
      return;
    }
    if (!reason || reason.trim() === '') {
      setVerificationModalError('A reason for verification is required.');
      return;
    }

    setIsSubmittingVerification(true);
    setVerificationModalError(null);
    setVerificationModalSuccess(null);

    try {
      const response = await wrapperFetch(`${backendUrl}/api/profile/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, request_reason: reason.trim() }),
      });

      if (response && response.message) {
        setVerificationModalSuccess(response.message);
        showNotification(response.message, 'success');
        setVerificationRequestSent(true);
        fetchSettings(); // Re-fetch settings to reflect the pending request immediately
        setTimeout(() => setShowVerificationRequestModal(false), 2000);
      } else {
        setVerificationModalError(response?.error || 'Failed to submit verification request.');
        showNotification(response?.error || 'Failed to submit verification request.', 'error');
      }
    } catch (err) {
      console.error('Error requesting verification:', err);
      setVerificationModalError('An unexpected error occurred while submitting verification request.');
      showNotification('An unexpected error occurred while submitting verification request.', 'error');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // ORIGINAL handleLogout function, now just opens the custom modal
  const handleLogout = () => {
    if (!userId) {
      showNotification('No user logged in to log out.', 'error');
      return;
    }
    setShowLogoutConfirmModal(true); // Open the custom confirmation modal
  };

  // NEW FUNCTION: Contains the actual logout logic
  const confirmLogout = async () => {
    setShowLogoutConfirmModal(false); // Close the modal immediately
    try {
      const response = await wrapperFetch(`${backendUrl}/api/logout/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response && response.message) {
        showNotification(response.message, 'success');
        localStorage.clear();
        setTimeout(() => navigate('/'), 1000);
      } else {
        showNotification(response?.error || 'Logout failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error logging out:', err);
      showNotification('An unexpected error occurred during logout.', 'error');
    }
  };


  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(newPassword);
  let strengthLabel = "";
  let strengthColor = "";
  if (passwordStrength <= 1) { strengthLabel = "Very Weak"; strengthColor = "#ef4444"; }
  else if (passwordStrength === 2) { strengthLabel = "Weak"; strengthColor = "#fbbf24"; }
  else if (passwordStrength === 3) { strengthLabel = "Medium"; strengthColor = "#3b82f6"; }
  else if (passwordStrength === 4) { strengthLabel = "Strong"; strengthColor = "#22c55e"; }

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

  const handleSendOtpForReset = async () => {
    setPasswordResetError("");
    setPasswordResetSuccess("");
    if (!settings?.email) {
      setPasswordResetError("Your email is not available to send OTP.");
      return;
    }
    try {
      const responseData = await wrapperFetch(`${backendUrl}/request-password-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: settings.email }),
      });

      if (responseData.error) {
        setPasswordResetError(responseData.error);
        return;
      }
      setPasswordResetSuccess(responseData.message || "OTP sent to your email. Please check.");
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setPasswordResetError("Failed to send OTP. Please try again later.");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordResetError("");
    setPasswordResetSuccess("");

    const otpCombined = otpValues.join("");
    if (otpCombined.length < 6) {
      setPasswordResetError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (!newPassword) {
      setPasswordResetError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordResetError("Passwords do not match.");
      return;
    }

    try {
      const responseData = await wrapperFetch(`${backendUrl}/reset-password-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: settings.email,
          otp: otpCombined,
          new_password: newPassword,
        }),
      });

      if (responseData.error) {
        setPasswordResetError(responseData.error);
        return;
      }

      setPasswordResetSuccess(responseData.message || "Password reset successful!");
      setOtpValues(Array(6).fill(""));
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordResetModal(false), 2000);
      showNotification('Password reset successfully!', 'success');
    } catch (err) {
      console.error("Reset Password Error:", err);
      setPasswordResetError("Password reset failed. Please try again later.");
    }
  };

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  const handleUserProfileClick = () => {
    if (userId) {
      navigate('/tablet/profile');
    }
  };

  // --- NEW LOGIN HANDLERS ---
  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${backendUrl}/auth/github`;
  };

  const handlePublicAccountConnect = () => {
    navigate('/tablet/signup');
  };
  // --- END NEW LOGIN HANDLERS ---


  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-200 text-black flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <i className="fas fa-user-lock text-gray-400 text-6xl mb-4"></i>
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to manage your settings</p>
          <a
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            style={customTextStyle}
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      activeSidebarItem={activeSidebarItem}
      onSidebarItemClick={handleSidebarItemClick}
      username={username}
      onUserProfileClick={handleUserProfileClick}
    >
      {/* Notification Display */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md text-white
          ${notification.type === 'success' ? 'bg-green-500' :
             notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-gray-200 rounded-tl-2xl p-8 min-h-screen">
        <div className="pb-6 border-b border-gray-300 mb-6">
          <h1 className="text-black text-4xl font-semibold" style={customTextStyle}>
            Settings
          </h1>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            {/* Skeleton loader content */}
            <div className="bg-white rounded-xl shadow-lg p-6 h-64"></div>
            <div className="bg-white rounded-xl shadow-lg p-6 h-64"></div>
            <div className="bg-white rounded-xl shadow-lg p-6 h-32"></div>
          </div>
        ) : settings ? (
          <div className="space-y-12">
            {/* --- Personal Information --- */}
            <section>
              <div className="flex items-center mb-6">
                <i className="fas fa-user-circle text-gray-600 text-2xl mr-3"></i>
                <h2 className="text-3xl font-bold text-black" style={customTextStyle}>
                  Personal Information
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Username</label>
                  <p className="text-gray-900 text-lg" style={customTextStyle}>{settings.username}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Email</label>
                  <p className="text-gray-900 text-lg" style={customTextStyle}>{settings.email}</p>
                </div>
                {settings.profile?.name && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Full Name</label>
                    <p className="text-gray-900 text-lg" style={customTextStyle}>{settings.profile.name}</p>
                  </div>
                )}
                {settings.profile?.bio && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Bio</label>
                    <p className="text-gray-900 text-lg" style={customTextStyle}>{settings.profile.bio}</p>
                  </div>
                )}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Member Since</label>
                  <p className="text-gray-900 text-lg" style={customTextStyle}>{format(new Date(settings.created_at), 'MMMM d, yy')}</p>
                </div>
                {isVerified ? (
                  <div className="flex items-center text-green-600 text-lg">
                    <i className="fas fa-badge-check mr-2"></i>
                    <span style={customTextStyle}>Account Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 text-lg">
                    <i className="fas fa-info-circle mr-2"></i>
                    <span style={customTextStyle}>Account Not Verified</span>
                    {!verificationRequestSent ? (
                      <button
                        onClick={handleRequestVerification}
                        className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        style={customTextStyle}
                      >
                        Request Verification
                      </button>
                    ) : (
                      <span className="ml-4 text-orange-500" style={customTextStyle}>
                        (Verification request pending)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* --- Security & Connections --- */}
            <section>
              <div className="flex items-center mb-6">
                <i className="fas fa-lock text-gray-600 text-2xl mr-3"></i>
                <h2 className="text-3xl font-bold text-black" style={customTextStyle}>
                  Security & Connections
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6"> {/* Increased space-y for better separation */}
                {/* Password Reset - Only shown if public_connected is true */}
                {settings.public_connected && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>Password</label>
                    <button
                      onClick={() => setShowPasswordResetModal(true)}
                      className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                      style={customTextStyle}
                    >
                      <i className="fas fa-key mr-2"></i>
                      Reset Password
                    </button>
                  </div>
                )}

                {/* Connected Accounts */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-3" style={customTextStyle}>Connected Accounts</label>
                  <div className="space-y-4"> {/* Increased space-y */}
                    {/* Google Connection */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"> {/* Enhanced styling */}
                      <span className="flex items-center text-gray-800" style={customTextStyle}>
                        <i className="fab fa-google text-red-500 text-2xl mr-4"></i> {/* Slightly larger icon */}
                        Google
                      </span>
                      {settings.google_connected ? (
                        <button
                          onClick={() => handleDisconnectProvider('google')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          style={customTextStyle}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center group transition-colors"
                          onClick={handleGoogleLogin}
                          title="Connect Google Account"
                        >
                          <i className="fab fa-google text-2xl text-red-500 transition-colors group-hover:text-red-600"></i>
                        </button>
                      )}
                    </div>

                    {/* GitHub Connection */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"> {/* Enhanced styling */}
                      <span className="flex items-center text-gray-800" style={customTextStyle}>
                        <i className="fab fa-github text-gray-800 text-2xl mr-4"></i> {/* Slightly larger icon */}
                        GitHub
                      </span>
                      {settings.github_connected ? (
                        <button
                          onClick={() => handleDisconnectProvider('github')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          style={customTextStyle}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center group transition-colors"
                          onClick={handleGithubLogin}
                          title="Connect GitHub Account"
                        >
                          <i className="fab fa-github text-2xl text-gray-700 transition-colors group-hover:text-black"></i>
                        </button>
                      )}
                    </div>

                    {/* Public Registration (Email/Password) */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"> {/* Enhanced styling */}
                       <span className="flex items-center text-gray-800" style={customTextStyle}>
                         <i className="fas fa-user-shield text-blue-500 text-2xl mr-4"></i> {/* Updated icon */}
                         Email & Password Account
                       </span>
                       {settings.public_connected ? (
                          <span className="text-green-600 font-semibold px-3 py-1 bg-green-100 rounded-md text-sm" style={customTextStyle}>
                            <i className="fas fa-check-circle mr-1"></i> Active
                          </span>
                       ) : (
                        <button
                          onClick={handlePublicAccountConnect}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          style={customTextStyle}
                        >
                          <i className="fas fa-link mr-2"></i>
                          Connect Account
                        </button>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </section>

            {/* --- Account Actions --- */}
            <section>
              <div className="flex items-center mb-6">
                <i className="fas fa-cogs text-gray-600 text-2xl mr-3"></i>
                <h2 className="text-3xl font-bold text-black" style={customTextStyle}>
                  Account Actions
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>Log Out</label>
                  <button
                    onClick={handleLogout} // Calls the new handleLogout (opens modal)
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-900 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={customTextStyle}
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Log Out
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600 text-xl" style={customTextStyle}>Error loading settings. Please try again.</p>
          </div>
        )}
      </div>

      {/* Password Reset Modal (Conditional Render) */}
      {showPasswordResetModal && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"> {/* Added overflow-y-auto */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10"> {/* Made header sticky */}
              <div className="flex items-center">
                <i className="fas fa-key text-gray-600 text-xl mr-3"></i>
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                  Reset Password
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordResetModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {passwordResetError && (
                <div className="mb-4 text-red-500 text-center p-3 bg-red-50 rounded-lg" style={customTextStyle}> {/* Enhanced error display */}
                  {passwordResetError}
                </div>
              )}
              {passwordResetSuccess && (
                <div className="mb-4 text-green-500 text-center p-3 bg-green-50 rounded-lg" style={customTextStyle}> {/* Enhanced success display */}
                  {passwordResetSuccess}
                </div>
              )}

              <div className="flex justify-center space-x-2 mb-4">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={value}
                    onChange={(e) => handleOtpChange(e, index)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" /* Enhanced input styling */
                    style={customTextStyle}
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                <button
                  type="button"
                  onClick={handleSendOtpForReset}
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm hover:underline" /* Subtle styling */
                  style={customTextStyle}
                  disabled={!settings.email} /* Disable if no email */
                >
                  {settings.email ? `Send OTP to ${settings.email}` : "Email not available"}
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-4 pr-12 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" /* Enhanced input styling */
                    style={customTextStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 focus:outline-none" /* Enhanced button styling */
                  >
                    <i className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-4 pr-12 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" /* Enhanced input styling */
                    style={customTextStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 focus:outline-none" /* Enhanced button styling */
                  >
                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}></i>
                  </button>
                </div>

                {newPassword && ( /* Only show strength if newPassword is not empty */
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full mr-2">
                      <div
                        className="h-2.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
                      ></div>
                    </div>
                    <span className="font-medium w-24 text-right" style={{ color: strengthColor, ...customTextStyle, whiteSpace: 'nowrap' }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50" /* Enhanced button styling */
                  style={customTextStyle}
                  disabled={!newPassword || !confirmPassword || otpValues.join("").length < 6 || passwordStrength < 2} /* Disable button if conditions not met */
                >
                  Confirm Password Reset
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVerificationRequestModal && (
        <VerificationRequestModal
          onClose={() => setShowVerificationRequestModal(false)}
          onSubmit={handleSubmitVerificationRequest}
          isSubmitting={isSubmittingVerification}
          error={verificationModalError}
          success={verificationModalSuccess}
        />
      )}

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-2xl font-bold text-black mb-4" style={customTextStyle}>
              Confirm Logout
            </h3>
            <p className="text-gray-700 mb-6" style={customTextStyle}>
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmLogout} // Call the actual logout logic
                className="px-6 py-3 bg-black hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                style={customTextStyle}
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirmModal(false)} // Close the modal
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
                style={customTextStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default Settings;