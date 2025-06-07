// src/components/InformationPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Mobelements/MainlayoutMob'; // Using MainlayoutMob as provided
import wrapperFetch from '../../Middleware/wrapperFetch';
import { isAfter, subDays, parseISO } from 'date-fns';

// Word limits from your backend
const NAME_WORD_LIMIT = 20;
const SUBJECT_WORD_LIMIT = 20;
const MESSAGE_WORD_LIMIT = 500;

// Helper function to count words (client-side for display)
function countWords(str) {
  if (!str) return 0;
  // Split by whitespace and filter out empty strings
  return str.trim().split(/\s+/).filter(Boolean).length;
}

const InformationPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || 'User';

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const [activeTab, setActiveTab] = useState('Our Services');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Info');

  // Contact form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmitContact, setCanSubmitContact] = useState(true);
  const [lastSubmissionDate, setLastSubmissionDate] = useState(null);

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // --- Check Contact Submission Status on Mount and Tab Change ---
  const checkContactSubmissionStatus = useCallback(async () => {
    if (!userId) {
      setCanSubmitContact(true);
      return;
    }
    try {
      const response = await wrapperFetch(`${backendUrl}/api/contact/submitted/${userId}`);
      if (response && response.submitted) {
        const lastSubmitted = parseISO(response.created_at);
        setLastSubmissionDate(lastSubmitted);
        const threeDaysAgo = subDays(new Date(), 3);
        if (isAfter(lastSubmitted, threeDaysAgo)) {
          setCanSubmitContact(false);
        } else {
          setCanSubmitContact(true);
        }
      } else {
        setCanSubmitContact(true); // No previous submission
      }
    } catch (error) {
      console.error('Error checking contact submission status:', error);
      setCanSubmitContact(true); // Default to allowing submission on error
    }
  }, [userId, backendUrl]);

  useEffect(() => {
    if (activeTab === 'Contact Us') {
      checkContactSubmissionStatus();
    }
  }, [activeTab, checkContactSubmissionStatus]);

  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  const handleProfileClick = () => {
    if (userId) {
      navigate('/mobile/profile');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    if (!userId) {
      setFormError('You must be logged in to submit a message.');
      setIsSubmitting(false);
      return;
    }
    if (!canSubmitContact) {
      setFormError('You can only submit one message every 3 days. Please wait.');
      setIsSubmitting(false);
      return;
    }
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      setFormError('All fields are required.');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setFormError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (countWords(contactName) > NAME_WORD_LIMIT) {
      setFormError(`Name cannot exceed ${NAME_WORD_LIMIT} words.`);
      setIsSubmitting(false);
      return;
    }
    if (countWords(contactSubject) > SUBJECT_WORD_LIMIT) {
      setFormError(`Subject cannot exceed ${SUBJECT_WORD_LIMIT} words.`);
      setIsSubmitting(false);
      return;
    }
    if (countWords(contactMessage) > MESSAGE_WORD_LIMIT) {
      setFormError(`Message cannot exceed ${MESSAGE_WORD_LIMIT} words.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await wrapperFetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });

      if (response && response.message) {
        setFormSuccess(response.message);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
        checkContactSubmissionStatus(); // Re-check to activate cooldown
      } else {
        setFormError(response?.error || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending contact message:', err);
      setFormError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = ['Our Services', 'FAQ', 'Contact Us'];

  const renderContent = () => {
    // This div explicitly has the white background
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {activeTab === 'Our Services' && (
          <>
            <h3 className="text-2xl font-bold text-black mb-4" style={customTextStyle}>
              Our Services
            </h3>
            <p className="text-gray-700 text-base md:text-lg mb-4" style={customTextStyle}>
              Welcome to our platform! We offer a wide range of services designed to enhance your digital experience.
              Whether you're looking for stunning wallpapers to personalize your devices, seeking creative inspiration,
              or want to share your own unique designs with a global community, we've got you covered.
            </p>
            <ul className="list-disc list-inside text-gray-700 text-base md:text-lg space-y-2" style={customTextStyle}>
              <li>Access to an extensive library of high-quality wallpapers.</li>
              <li>Personalized recommendations based on your preferences.</li>
              <li>Tools to upload and manage your own wallpaper creations.</li>
              <li>Community features to connect with other enthusiasts.</li>
              <li>Seamless Browse experience across all devices.</li>
            </ul>
            <p className="text-gray-700 text-base md:text-lg mt-4" style={customTextStyle}>
              We are constantly innovating to bring you new features and content.
              Our goal is to be your go-to destination for all things wallpaper!
            </p>
          </>
        )}
        {activeTab === 'FAQ' && (
          <>
            <h3 className="text-2xl font-bold text-black mb-4" style={customTextStyle}>
              Frequently Asked Questions (FAQ)
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2" style={customTextStyle}>
                  How do I download a wallpaper?
                </h4>
                <p className="text-gray-700 text-base" style={customTextStyle}>
                  Simply browse to your desired wallpaper, click on it, and then select the 'Download' button.
                  Choose your preferred resolution, and the download will begin automatically.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2" style={customTextStyle}>
                  Can I upload my own wallpapers?
                </h4>
                <p className="text-gray-700 text-base" style={customTextStyle}>
                  Yes! Once you're logged in, navigate to your profile or the 'Upload' section.
                  You can then submit your own high-quality images to share with the community.
                  Please ensure they comply with our content guidelines.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2" style={customTextStyle}>
                  Is there a cost to use this service?
                </h4>
                <p className="text-gray-700 text-base" style={customTextStyle}>
                  Our basic services, including Browse and downloading most wallpapers, are completely free.
                  We may introduce premium features in the future, but core functionality will remain accessible.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2" style={customTextStyle}>
                  How often is new content added?
                </h4>
                <p className="text-gray-700 text-base" style={customTextStyle}>
                  We strive to update our collection daily with fresh, new wallpapers from our community and curated selections.
                  Keep an eye on the 'Newest' section for the latest additions!
                </p>
              </div>
            </div>
          </>
        )}
        {activeTab === 'Contact Us' && (
          <>
            <h3 className="text-2xl font-bold text-black mb-6" style={customTextStyle}>
              Send us a message!
            </h3>
            {!userId && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4" role="alert" style={customTextStyle}>
                <p>Please <a href="/login" className="font-semibold underline">log in</a> to send us a message.</p>
              </div>
            )}
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert" style={customTextStyle}>
                <p>{formError}</p>
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4" role="alert" style={customTextStyle}>
                <p>{formSuccess}</p>
              </div>
            )}

            {!canSubmitContact && userId && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4" role="alert" style={customTextStyle}>
                <p>
                  You recently submitted a contact message on{' '}
                  {lastSubmissionDate ? lastSubmissionDate.toLocaleDateString() : 'a recent date'}.
                  Please wait 3 days between submissions. Thank you for your patience!
                </p>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="contactName" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  <i className="fas fa-user text-gray-500 mr-2"></i> Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactName"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isSubmitting || !userId || !canSubmitContact}
                  style={customTextStyle}
                />
                <p className="text-gray-400 text-xs text-right mt-1" style={customTextStyle}>
                  {countWords(contactName)} / {NAME_WORD_LIMIT} words
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="contactEmail" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  <i className="fas fa-envelope text-gray-500 mr-2"></i> Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting || !userId || !canSubmitContact}
                  style={customTextStyle}
                />
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="contactSubject" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  <i className="fas fa-tag text-gray-500 mr-2"></i> Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactSubject"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  disabled={isSubmitting || !userId || !canSubmitContact}
                  placeholder="Briefly describe your inquiry"
                  style={customTextStyle}
                />
                <p className="text-gray-400 text-xs text-right mt-1" style={customTextStyle}>
                  {countWords(contactSubject)} / {SUBJECT_WORD_LIMIT} words
                </p>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="contactMessage" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  <i className="fas fa-comment-alt text-gray-500 mr-2"></i> Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contactMessage"
                  rows="6"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  disabled={isSubmitting || !userId || !canSubmitContact}
                  placeholder="Tell us what's on your mind..."
                  style={customTextStyle}
                ></textarea>
                <p className="text-gray-400 text-xs text-right mt-1" style={customTextStyle}>
                  {countWords(contactMessage)} / {MESSAGE_WORD_LIMIT} words
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !userId || !canSubmitContact}
                style={customTextStyle}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </>
        )}
      </div>
    );
  };

  // Login message for non-logged-in users
  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view this page</p>
          <a
            href="/"
            className="bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
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
      onUserProfileClick={handleProfileClick}
    >
      {/* This new wrapper div makes the entire content area (title, tabs, and content) gray */}
      <div className="bg-gray-200 min-h-screen">
        {/* Page Title Section - Removed individual bg-gray-200 as parent handles it */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold" style={customTextStyle}>
            Information Center
          </h1>
        </div>

        {/* Tabs Section - Removed individual bg-gray-200 as parent handles it */}
        <div className="flex items-center space-x-4 mb-6 px-4 border-b border-gray-300 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-1 relative transition-colors"
              style={{ fontSize: '18px', ...customTextStyle }}
            >
              <span className={activeTab === tab ? 'text-black font-semibold' : 'text-gray-600'}>
                {tab}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* This div just provides padding, the bg-white comes from renderContent() itself */}
        <div className="px-4 py-4">
          {renderContent()}
        </div>
      </div>

      {/* Font Awesome (best practice: include in public/index.html) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default InformationPage;