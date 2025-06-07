// src/elements/ReportModal.js
import React, { useState, useRef, useEffect } from 'react';
import wrapperFetch from '../Middleware/wrapperFetch';

// Define the character limit for the report reason
const REPORT_REASON_CHAR_LIMIT = 15;

const ReportModal = ({
  isOpen,
  onClose,
  elementType, // 'wallpaper', 'profile', or 'user'
  elementId,    // The ID of the wallpaper, profile, or user being reported
  onReportSuccess, // Callback for successful report submission
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const modalRef = useRef(null);
  const reporterId = localStorage.getItem('userId'); // Get the logged-in user's ID

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  // Predefined reasons for quick selection
  const predefinedReasons = [
    'Inappropriate content',
    'Spam',
    'Harassment',
    'Copyright violation',
  ];

  useEffect(() => {
    // Reset state when modal opens/closes or element changes
    setReason('');
    setCustomReason('');
    setError(null);
    setSuccess(null);
  }, [isOpen, elementId, elementType]);


  // Close modal on outside click (if it's not the modal content itself)
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Add and remove event listener for outside clicks
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  const handleReasonChange = (e) => {
    const selectedReason = e.target.value;
    setReason(selectedReason);
    if (selectedReason !== 'Other') {
      setCustomReason(''); // Clear custom reason if a predefined one is selected
    }
  };

  const handleCustomReasonChange = (e) => {
    setCustomReason(e.target.value);
    setReason('Other'); // Automatically select 'Other' when typing custom reason
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!reporterId) {
      setError('You must be logged in to report.');
      setIsSubmitting(false);
      return;
    }

    let finalReason = reason;
    if (reason === 'Other') {
      finalReason = customReason.trim();
    }

    if (!finalReason) {
      setError('Please select a reason or provide a custom one.');
      setIsSubmitting(false);
      return;
    }

    if (finalReason.length > REPORT_REASON_CHAR_LIMIT) {
      setError(`Reason cannot exceed ${REPORT_REASON_CHAR_LIMIT} characters.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await wrapperFetch('http://localhost:3000/api/report', { // Use the full URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reporter_id: reporterId,
          element_type: elementType,
          element_id: elementId,
          reason: finalReason,
        }),
      });

      if (response && response.message) {
        setSuccess(response.message);
        onReportSuccess && onReportSuccess(); // Trigger callback
        setTimeout(() => {
          onClose(); // Close modal after a short delay
        }, 1500);
      } else {
        setError(response?.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <i className="fas fa-flag text-gray-600 text-xl mr-3"></i>
            <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
              Report {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          {error && (
            <div className="mb-4 text-red-500 text-center" style={customTextStyle}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-green-500 text-center" style={customTextStyle}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                Reason for reporting: <span className="text-red-500">*</span>
              </label>
              <select
                id="reason"
                className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                value={reason}
                onChange={handleReasonChange}
                disabled={isSubmitting}
                style={customTextStyle}
              >
                <option value="">Select a reason</option>
                {predefinedReasons.map((r, index) => (
                  <option key={index} value={r}>{r}</option>
                ))}
                <option value="Other">Other (please specify)</option>
              </select>
            </div>

            {reason === 'Other' && (
              <div>
                <label htmlFor="customReason" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
                  Specify Reason: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="customReason"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={customReason}
                  onChange={handleCustomReasonChange}
                  maxLength={REPORT_REASON_CHAR_LIMIT}
                  placeholder={`Max ${REPORT_REASON_CHAR_LIMIT} characters`}
                  disabled={isSubmitting}
                  style={customTextStyle}
                />
                <p className="text-gray-400 text-xs text-right mt-1" style={customTextStyle}>
                  {customReason.length} / {REPORT_REASON_CHAR_LIMIT} characters
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || (!reason && customReason.trim().length === 0)}
              style={customTextStyle}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;