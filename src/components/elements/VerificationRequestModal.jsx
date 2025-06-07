// src/components/VerificationRequestModal.js
import React, { useState } from 'react';

const VerificationRequestModal = ({ onClose, onSubmit, isSubmitting, error, success }) => {
  const [reason, setReason] = useState('');

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <i className="fas fa-badge-check text-gray-600 text-xl mr-3"></i>
            <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
              Request Account Verification
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
        <form onSubmit={handleSubmit} className="p-6">
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

          <div className="mb-4">
            <label htmlFor="verificationReason" className="block text-gray-700 text-sm font-bold mb-2" style={customTextStyle}>
              Why do you need verification?
            </label>
            <textarea
              id="verificationReason"
              rows="5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
              placeholder="e.g., I am a professional artist and want to authenticate my profile."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isSubmitting}
              style={customTextStyle}
            ></textarea>
            <p className="text-gray-500 text-xs mt-1" style={customTextStyle}>
              Please provide a clear and concise reason for your verification request. This helps us review your request.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 mr-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={customTextStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={customTextStyle}
            >
              {isSubmitting ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : null}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationRequestModal;