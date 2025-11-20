import * as React from 'react';
import { MenuIcon, LogInIcon, UserIcon } from './icons/Icons';

interface HeaderProps {
  toggleSidebar: () => void;
  showToast: (message: string) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isLoggedIn, onLogin, onLogout }) => {
  const GUEST_AVATAR_URL = `https://ui-avatars.com/api/?name=G&background=94a3b8&color=fff&bold=true&size=128`;
  const USER_AVATAR_URL = `https://ui-avatars.com/api/?name=User&background=ef4444&color=fff&bold=true&size=128`;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm shadow-sm p-4 border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Toggle menu">
                  <MenuIcon className="w-6 h-6 text-slate-700"/>
              </button>
              <h1 className="text-xl font-bold text-slate-800 tracking-wide">
                <span className="text-red-600">bapkam</span>.ai
              </h1>
          </div>
          <div className="relative">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                  <img src={USER_AVATAR_URL} alt="User avatar" className="w-10 h-10 rounded-full border-2 border-red-500" />
                  <button 
                    onClick={onLogout}
                    className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
              </div>
            ) : (
               <button
                  onClick={onLogin}
                  className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center ring-2 ring-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover:bg-slate-300 transition-colors"
                  aria-label="Sign in"
                >
                  <LogInIcon className="w-5 h-5 text-slate-600" />
                </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;