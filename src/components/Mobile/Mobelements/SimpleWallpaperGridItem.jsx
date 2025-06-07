// src/components/SimpleWallpaperGridItem.js
import React from 'react';

const SimpleWallpaperGridItem = ({ wallpaper, onClick }) => {
  const transformImageUrl = (url) => {
    // This logic should be consistent with your WallpaperCard
    if (url && url.includes('https://yourdomain.com/proxy-image')) {
      return url.replace(
        'https://yourdomain.com/proxy-image',
        'https://aoycxyazroftyzqlrvpo.supabase.co'
      );
    }
    return url;
  };

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onClick(wallpaper)} // Pass the entire wallpaper object on click
    >
      <div className="aspect-[9/15] overflow-hidden">
        <img
          src={transformImageUrl(wallpaper.image_url)}
          alt={wallpaper.title || 'Wallpaper'}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default SimpleWallpaperGridItem;