import React from 'react';

const WallpaperSkeleton = () => {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
      {/* Main Image Skeleton - Maintains smartphone aspect ratio (9:16) */}
      <div className="aspect-[9/16] bg-gray-300 relative">
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        
        {/* Profile and actions overlay skeleton */}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col justify-between p-6">
          {/* Top Section - Profile skeleton */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-400"></div>
              <div className="h-4 bg-gray-400 rounded w-24"></div>
            </div>
            <div className="w-6 h-6 bg-gray-400 rounded"></div>
          </div>

          {/* Bottom Section - Content skeleton */}
          <div className="space-y-4">
            {/* Action buttons skeleton */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                {/* Like skeleton */}
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <div className="h-4 bg-gray-400 rounded w-8"></div>
                </div>
                
                {/* Download skeleton */}
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <div className="h-4 bg-gray-400 rounded w-8"></div>
                </div>
                
                {/* Share skeleton */}
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <div className="h-4 bg-gray-400 rounded w-8"></div>
                </div>
              </div>
              
              {/* View count skeleton */}
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <div className="h-4 bg-gray-400 rounded w-8"></div>
              </div>
            </div>

            {/* Title and description skeleton */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-400 rounded w-3/4"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-400 rounded w-full"></div>
                <div className="h-4 bg-gray-400 rounded w-5/6"></div>
                <div className="h-4 bg-gray-400 rounded w-2/3"></div>
              </div>
            </div>

            {/* Hashtags skeleton */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-gray-400 rounded-md w-16"></div>
              <div className="h-6 bg-gray-400 rounded-md w-20"></div>
              <div className="h-6 bg-gray-400 rounded-md w-14"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WallpaperSkeleton;