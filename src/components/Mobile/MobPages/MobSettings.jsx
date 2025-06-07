// src/components/Settings.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob'; // Changed to mobile layout
import wrapperFetch from '../../Middleware/wrapperFetch';
import { format } from 'date-fns';

import VerificationRequestModal from '../../elements/VerificationRequestModal';

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
  const [activeSidebarItem, setActiveSidebarItem] = useState('Settings'); // This should map to a bottom nav item if used

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
      navigate('/'); // Redirect to mobile login/home
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
    if (window.confirm(`Are you sure you want to disconnect your ${provider} account?`)) {
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

  const handleLogout = () => {
    if (!userId) {
      showNotification('No user logged in to log out.', 'error');
      return;
    }
    setShowLogoutConfirmModal(true); // Open the custom confirmation modal
  };

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
        setTimeout(() => navigate('/'), 1000); // Redirect to mobile login/home
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
      navigate('/mobile/profile'); // Changed to /mobile/profile
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
    navigate('/mobile/signup'); // Changed to /mobile/signup
  };
  // --- END NEW LOGIN HANDLERS ---


  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-100 text-black flex items-center justify-center p-4"> {/* Adjusted background and padding */}
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm"> {/* Added max-w-sm for mobile */}
          <i className="fas fa-user-lock text-gray-400 text-6xl mb-4"></i>
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to manage your settings</p>
          <a
            href="/" // Assuming / is the mobile login page
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full inline-block" // Make button full width
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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-lg shadow-md text-white text-sm
          ${notification.type === 'success' ? 'bg-green-500' :
             notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Main Content Wrapper for mobile */}
      <div className="pt-4 px-4 pb-16 bg-gray-200 min-h-screen"> {/* Added padding bottom for fixed bottom nav */}
        {/* Header */}
        <div className="pb-4 border-b border-gray-300 mb-6 bg-gray-200 px-4 -mx-4 pt-4 shadow-sm"> {/* Adjusted padding/margin/bg for header */}
          <h1 className="text-black text-3xl font-semibold" style={customTextStyle}> {/* Adjusted font size */}
            Settings
          </h1>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4"> {/* Reduced space-y for mobile */}
            {/* Skeleton loader content */}
            <div className="bg-white rounded-xl shadow-lg p-5 h-48"></div> {/* Adjusted padding and height */}
            <div className="bg-white rounded-xl shadow-lg p-5 h-48"></div> {/* Adjusted padding and height */}
            <div className="bg-white rounded-xl shadow-lg p-5 h-24"></div> {/* Adjusted padding and height */}
          </div>
        ) : settings ? (
          <div className="space-y-6"> {/* Reduced space-y for mobile */}
            {/* --- Personal Information --- */}
            <section>
              <div className="flex items-center mb-4"> {/* Reduced margin-bottom */}
                <i className="fas fa-user-circle text-gray-600 text-xl mr-2"></i> {/* Adjusted icon size */}
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}> {/* Adjusted font size */}
                  Personal Information
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5 space-y-3"> {/* Adjusted padding and space-y */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Username</label>
                  <p className="text-gray-900 text-base" style={customTextStyle}>{settings.username}</p> {/* Adjusted text size */}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Email</label>
                  <p className="text-gray-900 text-base" style={customTextStyle}>{settings.email}</p> {/* Adjusted text size */}
                </div>
                {settings.profile?.name && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Full Name</label>
                    <p className="text-gray-900 text-base" style={customTextStyle}>{settings.profile.name}</p> {/* Adjusted text size */}
                  </div>
                )}
                {settings.profile?.bio && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Bio</label>
                    <p className="text-gray-900 text-base" style={customTextStyle}>{settings.profile.bio}</p> {/* Adjusted text size */}
                  </div>
                )}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1" style={customTextStyle}>Member Since</label>
                  <p className="text-gray-900 text-base" style={customTextStyle}>{format(new Date(settings.created_at), 'MMM d, yy')}</p> {/* Adjusted date format for mobile space */}
                </div>
                {isVerified ? (
                  <div className="flex items-center text-green-600 text-base"> {/* Adjusted text size */}
                    <i className="fas fa-badge-check mr-2"></i>
                    <span style={customTextStyle}>Account Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 text-base flex-wrap"> {/* Adjusted text size, added flex-wrap */}
                    <i className="fas fa-info-circle mr-2"></i>
                    <span style={customTextStyle}>Account Not Verified</span>
                    {!verificationRequestSent ? (
                      <button
                        onClick={handleRequestVerification}
                        className="ml-0 mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm w-full sm:w-auto" // Adjusted padding, added w-full for small screens
                        style={customTextStyle}
                      >
                        Request Verification
                      </button>
                    ) : (
                      <span className="ml-0 mt-2 text-orange-500 w-full sm:w-auto" style={customTextStyle}> {/* Added w-full */}
                        (Verification request pending)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* --- Security & Connections --- */}
            <section>
              <div className="flex items-center mb-4"> {/* Reduced margin-bottom */}
                <i className="fas fa-lock text-gray-600 text-xl mr-2"></i> {/* Adjusted icon size */}
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}> {/* Adjusted font size */}
                  Security & Connections
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5 space-y-4"> {/* Adjusted padding and space-y */}
                {/* Password Reset - Only shown if public_connected is true */}
                {settings.public_connected && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>Password</label>
                    <button
                      onClick={() => setShowPasswordResetModal(true)}
                      className="w-full px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-200" // Adjusted padding and added w-full
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
                  <div className="space-y-3"> {/* Reduced space-y */}
                    {/* Google Connection */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"> {/* Adjusted padding */}
                      <span className="flex items-center text-gray-800 text-base" style={customTextStyle}> {/* Adjusted text size */}
                        <i className="fab fa-google text-red-500 text-xl mr-3"></i> {/* Adjusted icon size */}
                        Google
                      </span>
                      {settings.google_connected ? (
                        <button
                          onClick={() => handleDisconnectProvider('google')}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs" // Adjusted padding/font size
                          style={customTextStyle}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center group transition-colors" // Adjusted size
                          onClick={handleGoogleLogin}
                          title="Connect Google Account"
                        >
                          <i className="fab fa-google text-xl text-red-500 transition-colors group-hover:text-red-600"></i> {/* Adjusted size */}
                        </button>
                      )}
                    </div>

                    {/* GitHub Connection */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"> {/* Adjusted padding */}
                      <span className="flex items-center text-gray-800 text-base" style={customTextStyle}> {/* Adjusted text size */}
                        <i className="fab fa-github text-gray-800 text-xl mr-3"></i> {/* Adjusted icon size */}
                        GitHub
                      </span>
                      {settings.github_connected ? (
                        <button
                          onClick={() => handleDisconnectProvider('github')}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs" // Adjusted padding/font size
                          style={customTextStyle}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center group transition-colors" // Adjusted size
                          onClick={handleGithubLogin}
                          title="Connect GitHub Account"
                        >
                          <i className="fab fa-github text-xl text-gray-700 transition-colors group-hover:text-black"></i> {/* Adjusted size */}
                        </button>
                      )}
                    </div>

                    {/* Public Registration (Email/Password) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"> {/* Adjusted padding */}
                       <span className="flex items-center text-gray-800 text-base" style={customTextStyle}> {/* Adjusted text size */}
                         <i className="fas fa-user-shield text-blue-500 text-xl mr-3"></i> {/* Adjusted icon size */}
                         Email & Password Account
                       </span>
                       {settings.public_connected ? (
                          <span className="text-green-600 font-semibold px-2 py-1 bg-green-100 rounded-md text-xs" style={customTextStyle}> {/* Adjusted padding/font size */}
                            <i className="fas fa-check-circle mr-1"></i> Active
                          </span>
                       ) : (
                        <button
                          onClick={handlePublicAccountConnect}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs" // Adjusted padding/font size
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
              <div className="flex items-center mb-4"> {/* Reduced margin-bottom */}
                <i className="fas fa-cogs text-gray-600 text-xl mr-2"></i> {/* Adjusted icon size */}
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}> {/* Adjusted font size */}
                  Account Actions
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5 space-y-3"> {/* Adjusted padding and space-y */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>Log Out</label>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-900 text-white rounded-lg font-medium transition-all duration-200" // Adjusted padding and added w-full
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
          <div className="flex items-center justify-center h-64"> {/* Reduced height for mobile */}
            <p className="text-gray-600 text-lg" style={customTextStyle}>Error loading settings. Please try again.</p> {/* Adjusted text size */}
          </div>
        )}
      </div>

      {/* Password Reset Modal (Conditional Render) */}
      {showPasswordResetModal && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto"> {/* Adjusted max-w and overflow */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10"> {/* Adjusted padding */}
              <div className="flex items-center">
                <i className="fas fa-key text-gray-600 text-lg mr-2"></i> {/* Adjusted icon size */}
                <h2 className="text-xl font-bold text-black" style={customTextStyle}> {/* Adjusted font size */}
                  Reset Password
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordResetModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors" // Adjusted padding
              >
                <i className="fas fa-times text-lg"></i> {/* Adjusted icon size */}
              </button>
            </div>

            <div className="p-4"> {/* Adjusted padding */}
              {passwordResetError && (
                <div className="mb-3 text-red-500 text-center p-2.5 bg-red-50 rounded-lg text-sm" style={customTextStyle}> {/* Adjusted padding/font size */}
                  {passwordResetError}
                </div>
              )}
              {passwordResetSuccess && (
                <div className="mb-3 text-green-500 text-center p-2.5 bg-green-50 rounded-lg text-sm" style={customTextStyle}> {/* Adjusted padding/font size */}
                  {passwordResetSuccess}
                </div>
              )}

              <div className="flex justify-center space-x-1.5 mb-3"> {/* Adjusted space-x */}
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={value}
                    onChange={(e) => handleOtpChange(e, index)}
                    className="w-9 h-9 text-center bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" /* Adjusted size/font size */
                    style={customTextStyle}
                  />
                ))}
              </div>

              <div className="text-center mb-4"> {/* Reduced margin-bottom */}
                <button
                  type="button"
                  onClick={handleSendOtpForReset}
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-xs hover:underline" // Adjusted font size
                  style={customTextStyle}
                  disabled={!settings.email}
                >
                  {settings.email ? `Send OTP to ${settings.email}` : "Email not available"}
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3"> {/* Reduced space-y */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" /* Adjusted padding/font size */
                    style={customTextStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none" /* Adjusted padding */
                  >
                    <i className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"} text-base`}></i> {/* Adjusted icon size */}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" /* Adjusted padding/font size */
                    style={customTextStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none" /* Adjusted padding */
                  >
                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-base`}></i> {/* Adjusted icon size */}
                  </button>
                </div>

                {newPassword && (
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <div className="w-full h-2 bg-gray-200 rounded-full mr-2"> {/* Adjusted height */}
                      <div
                        className="h-2 rounded-full transition-all duration-300 ease-in-out" // Adjusted height
                        style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }}
                      ></div>
                    </div>
                    <span className="font-medium w-20 text-right text-xs" style={{ color: strengthColor, ...customTextStyle, whiteSpace: 'nowrap' }}> {/* Adjusted width/font size */}
                      {strengthLabel}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 text-sm" // Adjusted padding/font size
                  style={customTextStyle}
                  disabled={!newPassword || !confirmPassword || otpValues.join("").length < 6 || passwordStrength < 2}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"> {/* Adjusted max-w and padding */}
            <h3 className="text-xl font-bold text-black mb-3" style={customTextStyle}> {/* Adjusted font size */}
              Confirm Logout
            </h3>
            <p className="text-gray-700 text-sm mb-4" style={customTextStyle}> {/* Adjusted font size and margin */}
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-center space-x-3"> {/* Adjusted space-x */}
              <button
                onClick={confirmLogout}
                className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm" // Adjusted padding/font size
                style={customTextStyle}
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="px-4 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors text-sm" // Adjusted padding/font size
                style={customTextStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Settings;