import React from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User } from 'lucide-react';

export const Auth: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear all persistence data
      localStorage.removeItem('repertuar_activeTab');
      localStorage.removeItem('repertuar_lastSongId');
      localStorage.removeItem('repertuar_lastSetlistId');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) return <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-full"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 px-3 py-1.5 rounded-full">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-4 h-4 text-white dark:text-gray-300" />
          )}
          <span className="text-sm font-medium text-white dark:text-gray-200 hidden sm:inline">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 dark:hover:bg-gray-800 rounded-full transition-colors text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-white"
          title="Çıkış Yap"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="flex items-center gap-2 bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-lg active:scale-95 border dark:border-gray-700"
    >
      <LogIn className="w-4 h-4" />
      Giriş Yap
    </button>
  );
};
