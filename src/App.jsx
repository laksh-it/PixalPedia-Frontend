import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GlobalSessionErrorOverlay from './components/Middleware/GlobalErrorOverlay'; // Import the new overlay component

// Import your pages/components
import LoadingPage from './components/setup/LoadingPage';
import Home from './components/pages/Home';
import ProfileUser from './components/pages/OtherProfile';
import Profile from './components/pages/Profile';
import Setuprofile from './components/pages/Setuprofile';
import Saved from './components/pages/saved';
import Create from './components/pages/Create';
import Gallery from './components/pages/Gallery';
import Wallpaperdetail from './components/pages/Wallpaperdetail';
import Gallerywallpaper from './components/pages/CategoryWallpapers';
import Insights from './components/pages/Insights';
import Settings from './components/pages/Settings';
import About from './components/pages/About';
import Login from './components/Auth/Loginpage';
import Signup from './components/Auth/Signuppage';
import Forgotpassword from './components/Auth/Forgotpassword';
import Resetpassword from './components/Auth/Resetpassword';
import Confirmemail from './components/Auth/Confirmemail';
import GoogleAuth from './components/Auth/GoogleAuth';
import GithubAuth from './components/Auth/GithubAuth';

//Import tablet components
import TabHome from './components/Tab/pages/Home';
import TabProfileUser from './components/Tab/pages/OtherProfile';
import TabProfile from './components/Tab/pages/Profile';
import TabSetuprofile from './components/Tab/pages/Setuprofile';
import TabSaved from './components/Tab/pages/saved';
import TabCreate from './components/Tab/pages/Create';
import TabGallery from './components/Tab/pages/Gallery';
import TabWallpaperdetail from './components/Tab/pages/Wallpaperdetail';
import TabGallerywallpaper from './components/Tab/pages/CategoryWallpapers';
import TabInsights from './components/Tab/pages/Insights';
import TabSettings from './components/Tab/pages/Settings';
import TabAbout from './components/Tab/pages/About';
import TabLogin from './components/Tab/Tabauth/Loginpage';
import TabSignup from './components/Tab/Tabauth/Signuppage';
import TabForgotpassword from './components/Tab/Tabauth/Forgotpassword';
import TabResetpassword from './components/Tab/Tabauth/Resetpassword';
import TabConfirmemail from './components/Tab/Tabauth/Confirmemail';

// Import mobile components
import MobileHome from './components/Mobile/MobPages/Home';
import MobileGallery from './components/Mobile/MobPages/MobGallery';
import MobileGallerywallpaper from './components/Mobile/MobPages/MobCategoryWallpapers';
import MobileSetuprofile from './components/Mobile/MobPages/Setuprofile';
import MobileCreate from './components/Mobile/MobPages/MobCreate';
import MobileProfileUser from './components/Mobile/MobPages/MobOtherProfile';
import MobileWallpaperdetail from './components/Mobile/MobPages/MobWallaperDetail';
import MobileSaved from './components/Mobile/MobPages/MobileSaved';
import MobileAbout from './components/Mobile/MobPages/MobAbout';
import MobileProfile from './components/Mobile/MobPages/MobProfile';
import MobileSettings from './components/Mobile/MobPages/MobSettings';
import MobileInsights from './components/Mobile/MobPages/MobInsights';
import MobileLogin from './components/Mobile/Mobauth/Loginpage';
import MobileSignup from './components/Mobile/Mobauth/Signuppage';
import MobileForgotpassword from './components/Mobile/Mobauth/Forgotpassword';
import MobileResetpassword from './components/Mobile/Mobauth/Resetpassword';
import MobileConfirmemail from './components/Mobile/Mobauth/Confirmemail';


function App() {
  return (
    <Router>
      {/* The GlobalSessionErrorOverlay should be rendered at the highest level possible */}
      {/* This ensures it can overlay any content rendered by the routes */}
      <GlobalSessionErrorOverlay />

      <Routes>
        {/* Initial Loading Page */}
        <Route path="/" element={<LoadingPage />} />

        {/* Desktop Routes */}
        <Route path="/desktop/Home" element={<Home />} />
        <Route path="/desktop/Profile/:profileId" element={<ProfileUser />} />
        <Route path="/desktop/Profile" element={<Profile />} />
        <Route path="/desktop/Setuprofile" element={<Setuprofile />} />
        <Route path="/desktop/Saved" element={<Saved />} />
        <Route path="/desktop/Create" element={<Create />} />
        <Route path="/desktop/Gallery" element={<Gallery />} />
        <Route path="/desktop/wallpaper/:wallpaperId" element={<Wallpaperdetail />} />
        <Route path="/desktop/gallery/wallpaper/:categoryId/:categoryName" element={<Gallerywallpaper />} />
        <Route path="/desktop/Insights" element={<Insights />} />
        <Route path="/desktop/Settings" element={<Settings />} />
        <Route path="/desktop/More" element={<About />} />
        {/* Standard Authentication routes for desktop */}
        <Route path="/desktop/login" element={<Login />} />
        <Route path="/desktop/signup" element={<Signup />} />
        <Route path="/desktop/Forgotpassword" element={<Forgotpassword />} />
        <Route path="/desktop/Resetpassword" element={<Resetpassword />} />
        <Route path="/desktop/Confirmemail" element={<Confirmemail />} />

        {/* Mobile Routes */}
        <Route path="/mobile/Home" element={<MobileHome />} />
        <Route path="/mobile/Setuprofile" element={<MobileSetuprofile />} />
        <Route path="/mobile/Gallery" element={<MobileGallery />} />
        <Route path="/mobile/gallery/wallpaper/:categoryId/:categoryName" element={<MobileGallerywallpaper />} />
        <Route path="/mobile/Create" element={<MobileCreate />} />
        <Route path="/mobile/Profile/:profileId" element={<MobileProfileUser />} />
        <Route path="/mobile/wallpaper/:wallpaperId" element={<MobileWallpaperdetail />} />
        <Route path="/mobile/Saved" element={<MobileSaved />} />
        <Route path="/mobile/Insights" element={<MobileInsights />} />
        <Route path="/mobile/Settings" element={<MobileSettings />} />
        <Route path="/mobile/Profile" element={<MobileProfile />} />
        <Route path="/mobile/More" element={<MobileAbout />} />
        {/* Standard Authentication routes for mobile */}
        <Route path="/mobile/login" element={<MobileLogin />} />
        <Route path="/mobile/signup" element={<MobileSignup />} />
        <Route path="/mobile/Forgotpassword" element={<MobileForgotpassword />} />
        <Route path="/mobile/Resetpassword" element={<MobileResetpassword />} />
        <Route path="/mobile/Confirmemail" element={<MobileConfirmemail />} />

        {/* Tablet Routes */}
        <Route path="/tablet/Home" element={<TabHome />} />
        <Route path="/tablet/Profile/:profileId" element={<TabProfileUser />} />
        <Route path="/tablet/Profile" element={<TabProfile />} />
        <Route path="/tablet/Setuprofile" element={<TabSetuprofile />} />
        <Route path="/tablet/Saved" element={<TabSaved />} />
        <Route path="/tablet/Create" element={<TabCreate />} />
        <Route path="/tablet/Gallery" element={<TabGallery />} />
        <Route path="/tablet/gallery/wallpaper/:categoryId/:categoryName" element={<TabGallerywallpaper />} />
        <Route path="/tablet/wallpaper/:wallpaperId" element={<TabWallpaperdetail />} />
        <Route path="/tablet/Insights" element={<TabInsights />} />
        <Route path="/tablet/Settings" element={<TabSettings />} />
        <Route path="/tablet/More" element={<TabAbout />} />
        {/* Standard Authentication routes for tablet */}
        <Route path="/tablet/login" element={<TabLogin />} />
        <Route path="/tablet/signup" element={<TabSignup />} />
        <Route path="/tablet/Forgotpassword" element={<TabForgotpassword />} />
        <Route path="/tablet/Resetpassword" element={<TabResetpassword />} />
        <Route path="/tablet/Confirmemail" element={<TabConfirmemail />} />

        {/* OAuth Callback routes (device-agnostic) */}
        {/* These routes are typically independent of device type as they handle redirects from external providers */}
        <Route path="/auth/google/callback" element={<GoogleAuth />} />
        <Route path="/auth/github/callback" element={<GithubAuth />} />
      </Routes>
    </Router>
  );
}

export default App;