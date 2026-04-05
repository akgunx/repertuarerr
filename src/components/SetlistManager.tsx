import React, { useState } from 'react';
import { Song, Setlist } from '../types';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from '../firebase';
import { ListMusic, Plus, X, Trash2, ChevronRight, Music, Search, Save, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetlistManagerProps {
  songs: Song[];
  setlists: Setlist[];
  userId: string;
  onSelectSetlist: (setlist: Setlist) => void;
}

export const SetlistManager: React.FC<SetlistManagerProps> = ({ songs, setlists, userId, onSelectSetlist }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!newSetName || selectedSongIds.length === 0) return;
    try {
      if (editingSetlist) {
        await updateDoc(doc(db, 'setlists', editingSetlist.id!), {
          name: newSetName,
          songIds: selectedSongIds,
        });
      } else {
        await addDoc(collection(db, 'setlists'), {
          name: newSetName,
          songIds: selectedSongIds,
          ownerId: userId,
          createdAt: Timestamp.now()
        });
      }
      closeModal();
    } catch (err) {
      console.error("Setlist save failed", err);
    }
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingSetlist(null);
    setNewSetName('');
    setSelectedSongIds([]);
    setSearchQuery('');
  };

  const openEdit = (set: Setlist) => {
    setEditingSetlist(set);
    setNewSetName(set.name);
    setSelectedSongIds(set.songIds);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    // Confirmation is handled by the parent component or a custom modal
    try {
      await deleteDoc(doc(db, 'setlists', id));
    } catch (err) {
      console.error("Setlist deletion failed", err);
    }
  };

  const toggleSong = (id: string) => {
    setSelectedSongIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
          <ListMusic className="w-6 h-6 text-blue-500" />
          Setlistlerim
        </h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Yeni Setlist
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {setlists.map((set) => (
            <motion.div
              key={set.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between gap-4"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onSelectSetlist(set)}>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ListMusic className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{set.name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{set.songIds.length} Şarkı</p>
                    <div className="flex -space-x-2">
                      {set.songIds.slice(0, 3).map((sid, idx) => {
                        const song = songs.find(s => s.id === sid);
                        return song ? (
                          <div key={sid} className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-bold text-gray-500" title={song.title}>
                            {song.title[0]}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEdit(set)}
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onSelectSetlist(set)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-sm rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  Aç
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(set.id!)}
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {setlists.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <ListMusic className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-600 font-medium">Henüz bir setlist oluşturmadınız.</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border dark:border-gray-800"
            >
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  {editingSetlist ? (
                    <>
                      <Edit2 className="w-5 h-5 text-blue-500" />
                      Setlisti Düzenle
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-blue-500" />
                      Yeni Setlist Oluştur
                    </>
                  )}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Setlist Adı</label>
                  <input 
                    type="text" 
                    value={newSetName} 
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg dark:text-white"
                    placeholder="Örn: Cuma Gecesi Sahnesi"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Şarkı Seç ({selectedSongIds.length})</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 transition-all w-48 dark:text-white"
                        placeholder="Şarkı ara..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                    {filteredSongs.map(song => (
                      <button
                        key={song.id}
                        onClick={() => toggleSong(song.id!)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedSongIds.includes(song.id!) 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 ring-1 ring-blue-200 dark:ring-blue-800' 
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedSongIds.includes(song.id!) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
                            <Music className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className={`font-bold text-sm ${selectedSongIds.includes(song.id!) ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>{song.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{song.artist}</div>
                          </div>
                        </div>
                        {selectedSongIds.includes(song.id!) && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white rotate-45" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                <button 
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!newSetName || selectedSongIds.length === 0}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingSetlist ? 'Güncelle' : 'Setlisti Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
