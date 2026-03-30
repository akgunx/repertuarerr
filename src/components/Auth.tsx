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
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) return <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-full"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
          <span className="text-sm font-medium text-white hidden sm:inline">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
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
      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
    >
      <LogIn className="w-4 h-4" />
      Giriş Yap
    </button>
  );
};
