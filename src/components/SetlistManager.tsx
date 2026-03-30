import React, { useState } from 'react';
import { Song, Setlist } from '../types';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from '../firebase';
import { ListMusic, Plus, X, Trash2, ChevronRight, Music, Search, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetlistManagerProps {
  songs: Song[];
  setlists: Setlist[];
  userId: string;
  onSelectSetlist: (setlist: Setlist) => void;
}

export const SetlistManager: React.FC<SetlistManagerProps> = ({ songs, setlists, userId, onSelectSetlist }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newSetName || selectedSongIds.length === 0) return;
    try {
      await addDoc(collection(db, 'setlists'), {
        name: newSetName,
        songIds: selectedSongIds,
        ownerId: userId,
        createdAt: Timestamp.now()
      });
      setIsCreating(false);
      setNewSetName('');
      setSelectedSongIds([]);
    } catch (err) {
      console.error("Setlist creation failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu setlisti silmek istediğinize emin misiniz?")) return;
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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ListMusic className="w-6 h-6 text-blue-500" />
          Setlistlerim
        </h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Yeni Setlist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {setlists.map((set) => (
            <motion.div
              key={set.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 cursor-pointer" onClick={() => onSelectSetlist(set)}>
                  <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{set.name}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{set.songIds.length} Şarkı</p>
                </div>
                <button 
                  onClick={() => handleDelete(set.id!)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {set.songIds.slice(0, 3).map(sid => {
                  const song = songs.find(s => s.id === sid);
                  return song ? (
                    <span key={sid} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium truncate max-w-[100px]">
                      {song.title}
                    </span>
                  ) : null;
                })}
                {set.songIds.length > 3 && (
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-400 font-medium">
                    +{set.songIds.length - 3} daha
                  </span>
                )}
              </div>
              <button 
                onClick={() => onSelectSetlist(set)}
                className="w-full py-2 bg-gray-50 text-gray-600 font-bold text-sm rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Görüntüle
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {setlists.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <ListMusic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Henüz bir setlist oluşturmadınız.</p>
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
              className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  Yeni Setlist Oluştur
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setlist Adı</label>
                  <input 
                    type="text" 
                    value={newSetName} 
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg"
                    placeholder="Örn: Cuma Gecesi Sahnesi"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Şarkı Seç ({selectedSongIds.length})</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 transition-all w-48"
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
                          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                          : 'bg-white border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedSongIds.includes(song.id!) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Music className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className={`font-bold text-sm ${selectedSongIds.includes(song.id!) ? 'text-blue-900' : 'text-gray-900'}`}>{song.title}</div>
                            <div className="text-xs text-gray-500">{song.artist}</div>
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

              <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-all"
                >
                  İptal
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newSetName || selectedSongIds.length === 0}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Setlisti Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
