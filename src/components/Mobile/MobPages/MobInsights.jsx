// src/pages/Insights.jsx (or src/components/Insights.jsx)
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import MainLayout from '../Mobelements/MainlayoutMob'; // Updated path for mobile layout
import wrapperFetch from '../../Middleware/wrapperFetch';
import { useNavigate } from 'react-router-dom';

// Helper Notification Component (No changes needed here)
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white flex items-center space-x-2 z-50 ${bgColor}`}>
      <i className={`${icon} text-xl`}></i>
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-white opacity-75 hover:opacity-100">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

const Insights = () => {
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');
  const initialUsername = localStorage.getItem('username') || 'User';

  const customTextStyle = {
    fontFamily: '"WDXL Lubrifont TC", sans-serif',
    fontWeight: 500
  };

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Insights');

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!loggedInUserId) {
      setError('User not logged in.');
      setLoading(false);
      showNotification('Please log in to view insights.', 'error');
      return;
    }

    try {
      const endpoint = `${backendUrl}/api/profile/insights/${loggedInUserId}`;
      const response = await wrapperFetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response && response.insights) {
        setInsights(response.insights);
      } else {
        setError(response?.message || 'Failed to fetch insights.');
        showNotification(response?.message || 'Failed to fetch insights.', 'error');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('An error occurred while fetching insights.');
      showNotification('An error occurred while fetching insights.', 'error');
    } finally {
      setLoading(false);
    }
  }, [loggedInUserId, backendUrl, showNotification]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Handle sidebar item click (now bottom nav for mobile)
  const handleSidebarItemClick = (itemName, path) => {
    setActiveSidebarItem(itemName);
    navigate(path);
  };

  // Handle user profile click (now usually from mobile bottom nav)
  const handleUserProfileClick = () => {
    navigate('/mobile/profile'); // Updated path for mobile
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
  };

  // Chart data preparation (No changes needed here)
  const getMonthlyComparisonData = () => {
    if (!insights?.monthlyComparisons) return [];
    
    return [
      { name: 'Previous Month', views: insights.monthlyComparisons.views?.previous || 0, downloads: insights.monthlyComparisons.downloads?.previous || 0, shares: insights.monthlyComparisons.shares?.previous || 0, likes: insights.monthlyComparisons.likes?.previous || 0 },
      { name: 'Current Month', views: insights.monthlyComparisons.views?.current || 0, downloads: insights.monthlyComparisons.downloads?.current || 0, shares: insights.monthlyComparisons.shares?.current || 0, likes: insights.monthlyComparisons.likes?.current || 0 }
    ];
  };

  const getPieChartData = () => {
    if (!insights?.wallpapersInsights) return [];
    
    return [
      { name: 'Views', value: insights.wallpapersInsights.total_views || 0, color: '#3B82F6' },
      { name: 'Downloads', value: insights.wallpapersInsights.total_downloads || 0, color: '#10B981' },
      { name: 'Shares', value: insights.wallpapersInsights.total_shares || 0, color: '#F59E0B' },
      { name: 'Likes', value: insights.wallpapersInsights.total_likes || 0, color: '#EF4444' }
    ];
  };

  // StatCard Component (No changes needed to the component itself, only its usage)
  const StatCard = ({ title, value, icon, color = "text-gray-600" }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1" style={customTextStyle}>{title}</p>
          <p className="text-3xl font-bold text-black" style={customTextStyle}>{formatNumber(value)}</p>
        </div>
        <div className={`${color} text-3xl`}>
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );

  // MetricRow Component (No changes needed here)
  const MetricRow = ({ label, current, previous, percentage, icon }) => {
    const isPositive = percentage > 0;
    const isNegative = percentage < 0;
    const percentageColor = isPositive ? 'text-green-600' : (isNegative ? 'text-red-600' : 'text-gray-500');
    const bgColor = isPositive ? 'bg-green-50' : (isNegative ? 'bg-red-50' : 'bg-gray-50');
    const arrowIcon = isPositive ? 'fas fa-arrow-up' : (isNegative ? 'fas fa-arrow-down' : 'fas fa-minus');

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-6">
          <div className="flex items-center">
            <i className={`${icon} text-gray-600 mr-3`}></i>
            <span className="font-medium text-gray-900" style={customTextStyle}>{label}</span>
          </div>
        </td>
        <td className="py-4 px-6 text-center">
          <span className="text-xl font-bold text-black" style={customTextStyle}>{formatNumber(current)}</span>
        </td>
        <td className="py-4 px-6 text-center">
          <span className="text-gray-600" style={customTextStyle}>{formatNumber(previous)}</span>
        </td>
        <td className="py-4 px-6 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${bgColor} ${percentageColor}`}>
            <i className={`${arrowIcon} mr-1`}></i>
            {Math.abs(percentage).toFixed(1)}%
          </div>
        </td>
      </tr>
    );
  };

  // This specific login message should be handled by MainLayout for consistency,
  // but keeping it here for immediate feedback if MainLayout doesn't render it based on userId.
  if (!loggedInUserId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={customTextStyle}>Please log in to view your insights</p> {/* Updated text */}
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
      username={initialUsername}
      onUserProfileClick={handleUserProfileClick}
    >
      <Notification
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      {/* This main wrapper div makes the entire content area a grayish background */}
      <div className="bg-gray-200 min-h-screen">
        {/* Header Section - Adjusted padding and text sizes for mobile */}
        <div className="pt-6 pb-4 border-b border-gray-300 mb-4 px-4">
          <h1 className="text-black text-3xl font-semibold md:text-4xl" style={customTextStyle}> {/* Smaller text for mobile */}
            Analytics & Insights
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base" style={customTextStyle}> {/* Smaller text for mobile */}
            Track your wallpaper performance and profile engagement
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 px-4"> {/* Added px-4 */}
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black"></div>
            <p className="ml-4 text-xl text-gray-700" style={customTextStyle}>Loading insights...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-4 mx-4"> {/* Adjusted margin/padding */}
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-3"></i>
              <div>
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            </div>
          </div>
        )}

        {insights && !loading && !error && (
          <div className="space-y-6"> {/* Reduced space for mobile */}
            {/* Profile Overview Cards - Adjusted grid and added horizontal padding */}
            <div className="grid grid-cols-2 gap-4 px-4"> {/* Changed to grid-cols-2 gap-4 for mobile */}
              <StatCard 
                title="Profile Views" 
                value={insights.profileInsights.profile_views} 
                icon="fas fa-eye" 
                color="text-blue-600"
              />
              <StatCard 
                title="Followers" 
                value={insights.profileInsights.followers_count} 
                icon="fas fa-users" 
                color="text-green-600"
              />
              {/* Added breakpoint for third column for larger screens if needed, otherwise 2 columns */}
              <div className="col-span-2 md:col-span-1"> {/* This makes the third card span 2 cols on mobile, 1 on md+ */}
                  <StatCard 
                  title="Following" 
                  value={insights.profileInsights.following_count} 
                  icon="fas fa-user-plus" 
                  color="text-purple-600"
                  />
              </div>
            </div>

            {/* Wallpaper Performance Cards - Adjusted grid and added horizontal padding */}
            <div className="grid grid-cols-2 gap-4 px-4"> {/* Changed to grid-cols-2 gap-4 for mobile */}
              <StatCard 
                title="Total Uploads" 
                value={insights.wallpapersInsights.total_uploaded} 
                icon="fas fa-cloud-upload-alt" 
                color="text-indigo-600"
              />
              <StatCard 
                title="Total Views" 
                value={insights.wallpapersInsights.total_views} 
                icon="fas fa-eye" 
                color="text-blue-600"
              />
              <StatCard 
                title="Downloads" 
                value={insights.wallpapersInsights.total_downloads} 
                icon="fas fa-download" 
                color="text-green-600"
              />
              <StatCard 
                title="Shares" 
                value={insights.wallpapersInsights.total_shares} 
                icon="fas fa-share-alt" 
                color="text-orange-600"
              />
            </div>

            {/* Charts Section - Adjusted grid and added horizontal padding */}
            <div className="grid grid-cols-1 gap-6 px-4"> {/* Changed to grid-cols-1 for mobile */}
              {/* Monthly Comparison Chart */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <i className="fas fa-chart-line text-gray-600 text-xl mr-3"></i>
                  <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                    Monthly Comparison
                  </h2>
                </div>
                <div className="h-64 sm:h-80"> {/* Adjusted height for smaller screens, retain for sm+ */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getMonthlyComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#3B82F6" name="Views" />
                      <Bar dataKey="downloads" fill="#10B981" name="Downloads" />
                      <Bar dataKey="shares" fill="#F59E0B" name="Shares" />
                      <Bar dataKey="likes" fill="#EF4444" name="Likes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement Distribution */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <i className="fas fa-chart-pie text-gray-600 text-xl mr-3"></i>
                  <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                    Engagement Distribution
                  </h2>
                </div>
                <div className="h-64 sm:h-80"> {/* Adjusted height for smaller screens, retain for sm+ */}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Performance Table - Added horizontal padding */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mx-4"> {/* Added mx-4 */}
              <div className="flex items-center mb-6">
                <i className="fas fa-table text-gray-600 text-xl mr-3"></i>
                <h2 className="text-2xl font-bold text-black" style={customTextStyle}>
                  Monthly Performance Analysis
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700" style={customTextStyle}>Metric</th> {/* Adjusted px for mobile */}
                      <th className="text-center py-4 px-3 sm:px-6 font-semibold text-gray-700" style={customTextStyle}>Current Month</th> {/* Adjusted px for mobile */}
                      <th className="text-center py-4 px-3 sm:px-6 font-semibold text-gray-700" style={customTextStyle}>Previous Month</th> {/* Adjusted px for mobile */}
                      <th className="text-center py-4 px-3 sm:px-6 font-semibold text-gray-700" style={customTextStyle}>Change</th> {/* Adjusted px for mobile */}
                    </tr>
                  </thead>
                  <tbody>
                    {insights.monthlyComparisons.views && (
                      <MetricRow 
                        label="Views"
                        current={insights.monthlyComparisons.views.current}
                        previous={insights.monthlyComparisons.views.previous}
                        percentage={insights.monthlyComparisons.views.percentage}
                        icon="fas fa-eye"
                      />
                    )}
                    {insights.monthlyComparisons.downloads && (
                      <MetricRow 
                        label="Downloads"
                        current={insights.monthlyComparisons.downloads.current}
                        previous={insights.monthlyComparisons.downloads.previous}
                        percentage={insights.monthlyComparisons.downloads.percentage}
                        icon="fas fa-download"
                      />
                    )}
                    {insights.monthlyComparisons.shares && (
                      <MetricRow 
                        label="Shares"
                        current={insights.monthlyComparisons.shares.current}
                        previous={insights.monthlyComparisons.shares.previous}
                        percentage={insights.monthlyComparisons.shares.percentage}
                        icon="fas fa-share-alt"
                      />
                    )}
                    {insights.monthlyComparisons.likes && (
                      <MetricRow 
                        label="Likes"
                        current={insights.monthlyComparisons.likes.current}
                        previous={insights.monthlyComparisons.likes.previous}
                        percentage={insights.monthlyComparisons.likes.percentage}
                        icon="fas fa-heart"
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Metrics - Adjusted grid and added horizontal padding */}
            <div className="grid grid-cols-2 gap-4 px-4 pb-4"> {/* Changed to grid-cols-2 gap-4 for mobile, added pb-4 for bottom spacing */}
              <StatCard 
                title="Total Likes" 
                value={insights.wallpapersInsights.total_likes} 
                icon="fas fa-heart" 
                color="text-red-600"
              />
              <StatCard 
                title="Total Reports" 
                value={insights.wallpapersInsights.total_reports} 
                icon="fas fa-flag" 
                color="text-yellow-600"
              />
            </div>
          </div>
        )}
      </div> {/* End of bg-gray-200 wrapper */}

      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </MainLayout>
  );
};

export default Insights;