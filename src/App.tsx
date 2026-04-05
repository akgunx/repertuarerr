import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Song, Setlist } from './types';
import { Auth } from './components/Auth';
import { SongViewer } from './components/SongViewer';
import { SongEditor } from './components/SongEditor';
import { SetlistManager } from './components/SetlistManager';
import { 
  Music, 
  Search, 
  Plus, 
  Filter, 
  ListMusic, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Mic2, 
  Guitar,
  LayoutGrid,
  Menu,
  X,
  Loader2,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>(() => {
    return (localStorage.getItem('repertuar_activeTab') as 'songs' | 'setlists') || 'songs';
  });
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch Songs
  useEffect(() => {
    if (!user) {
      setSongs([]);
      return;
    }
    const q = query(collection(db, 'songs'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });
    return unsubscribe;
  }, [user]);

  // Fetch Setlists
  useEffect(() => {
    if (!user) {
      setSetlists([]);
      return;
    }
    const q = query(collection(db, 'setlists'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSetlists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Setlist)));
    });
    return unsubscribe;
  }, [user]);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('repertuar_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (viewingSong) {
      localStorage.setItem('repertuar_lastSongId', viewingSong.id || '');
    } else {
      localStorage.removeItem('repertuar_lastSongId');
    }
  }, [viewingSong]);

  useEffect(() => {
    if (activeSetlist) {
      localStorage.setItem('repertuar_lastSetlistId', activeSetlist.id || '');
    } else {
      localStorage.removeItem('repertuar_lastSetlistId');
    }
  }, [activeSetlist]);

  // Restore State Effect
  useEffect(() => {
    if (songs.length > 0 && !viewingSong && !activeSetlist) {
      const lastSongId = localStorage.getItem('repertuar_lastSongId');
      const lastSetlistId = localStorage.getItem('repertuar_lastSetlistId');

      if (lastSongId) {
        const song = songs.find(s => s.id === lastSongId);
        if (song) setViewingSong(song);
      }

      if (lastSetlistId) {
        const setlist = setlists.find(s => s.id === lastSetlistId);
        if (setlist) setActiveSetlist(setlist);
      }
    }
  }, [songs, setlists]);

  const categories = useMemo(() => {
    const cats = new Set(songs.map(s => s.category).filter(Boolean));
    return ['Tümü', ...Array.from(cats)];
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let baseSongs = songs;
    
    if (activeSetlist) {
      baseSongs = activeSetlist.songIds
        .map(id => songs.find(s => s.id === id))
        .filter((s): s is Song => !!s);
    }

    return baseSongs.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tümü' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [songs, searchQuery, selectedCategory, activeSetlist]);

  const handleSaveSong = async (songData: Partial<Song>) => {
    if (!user) return;
    try {
      if (editingSong) {
        await updateDoc(doc(db, 'songs', editingSong.id!), songData);
      } else {
        await addDoc(collection(db, 'songs'), {
          ...songData,
          ownerId: user.uid,
          createdAt: Timestamp.now()
        });
      }
      setIsAddingSong(false);
      setEditingSong(null);
    } catch (err) {
      console.error("Song save failed", err);
    }
  };

  const handleDeleteSong = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmModal({
      show: true,
      title: "Şarkıyı Sil",
      message: "Bu şarkıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'songs', id));
          setConfirmModal(null);
        } catch (err) {
          console.error("Song deletion failed", err);
        }
      }
    });
  };

  const handleOpenSetlist = (setlist: Setlist) => {
    setActiveSetlist(setlist);
    setSearchQuery('');
    setSelectedCategory('Tümü');
    setActiveTab('songs');
  };

  const getNextSong = () => {
    if (!viewingSong) return null;
    const currentIndex = filteredSongs.findIndex(s => s.id === viewingSong.id);
    if (currentIndex === -1 || currentIndex === filteredSongs.length - 1) return null;
    return filteredSongs[currentIndex + 1];
  };

  const getPrevSong = () => {
    if (!viewingSong) return null;
    const currentIndex = filteredSongs.findIndex(s => s.id === viewingSong.id);
    if (currentIndex <= 0) return null;
    return filteredSongs[currentIndex - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-8"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full" />
            <Music className="w-20 h-20 text-blue-500 relative" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tight">Repertuarım</h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Müzisyenler için profesyonel repertuar yönetimi. Akorlar, sözler ve setlistler her an elinizin altında.
            </p>
          </div>
          <div className="pt-4">
            <Auth />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-12">
            <div className="space-y-2">
              <Mic2 className="w-6 h-6 text-gray-600 mx-auto" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Vokal</p>
            </div>
            <div className="space-y-2">
              <Guitar className="w-6 h-6 text-gray-600 mx-auto" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gitar</p>
            </div>
            <div className="space-y-2">
              <LayoutGrid className="w-6 h-6 text-gray-600 mx-auto" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sahne</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <header className="bg-gray-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-black tracking-tighter">REPERTUARIM</h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('songs')}
              className={`text-sm font-bold tracking-wider uppercase transition-all ${activeTab === 'songs' ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              Şarkılar
            </button>
            <button 
              onClick={() => setActiveTab('setlists')}
              className={`text-sm font-bold tracking-wider uppercase transition-all ${activeTab === 'setlists' ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              Setlistler
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              title={darkMode ? "Açık Mod" : "Karanlık Mod"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Auth />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'songs' ? (
            <motion.div 
              key="songs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Toolbar */}
              <div className="flex flex-col gap-4">
                {activeSetlist && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-3">
                      <ListMusic className="w-6 h-6 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Aktif Setlist</p>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeSetlist.name}</h2>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveSetlist(null)}
                      className="p-2 hover:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
                      title="Setlistten Çık"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Şarkı veya sanatçı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all dark:text-white"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-9 pr-8 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setIsAddingSong(true)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Ekle</span>
                  </button>
                </div>
              </div>
            </div>

              {/* Song List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSongs.map((song) => (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                    onClick={() => setViewingSong(song)}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{song.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium truncate">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingSong(song); setIsAddingSong(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSong(e, song.id!)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-2">
                        {song.category && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                            {song.category}
                          </span>
                        )}
                        {song.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-2 py-1 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredSongs.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-inner">
                  <Music className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">Şarkı bulunamadı.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="setlists"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SetlistManager 
                songs={songs} 
                setlists={setlists} 
                userId={user.uid} 
                onSelectSetlist={handleOpenSetlist} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {confirmModal && confirmModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border dark:border-gray-800 text-center"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  İptal
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {viewingSong && (
          <SongViewer 
            song={viewingSong} 
            onClose={() => setViewingSong(null)} 
            nextSong={getNextSong() || undefined}
            prevSong={getPrevSong() || undefined}
            onNavigate={setViewingSong}
          />
        )}
        {isAddingSong && (
          <SongEditor 
            song={editingSong || undefined} 
            onSave={handleSaveSong} 
            onCancel={() => { setIsAddingSong(false); setEditingSong(null); }} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-gray-900 z-50 p-6 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Music className="w-6 h-6 text-blue-500" />
                  <h1 className="text-xl font-black text-white tracking-tighter">REPERTUARIM</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-4">
                <button 
                  onClick={() => { setActiveTab('songs'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'songs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Music className="w-5 h-5" />
                  Şarkılar
                </button>
                <button 
                  onClick={() => { setActiveTab('setlists'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'setlists' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <ListMusic className="w-5 h-5" />
                  Setlistler
                </button>
              </nav>

              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-4 p-4 rounded-2xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {darkMode ? "Açık Mod" : "Karanlık Mod"}
                </button>
                <Auth />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
