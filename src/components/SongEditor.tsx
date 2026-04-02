import React, { useState } from 'react';
import { Song } from '../types';
import { extractChordsLocally, parseRawSongText } from '../lib/chordUtils';
import { Save, X, Music, User, FileText, Tag, Wand2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface SongEditorProps {
  song?: Song;
  onSave: (song: Partial<Song>) => void;
  onCancel: () => void;
}

export const SongEditor: React.FC<SongEditorProps> = ({ song, onSave, onCancel }) => {
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [content, setContent] = useState(song?.content || '');
  const [category, setCategory] = useState(song?.category || '');
  const [tags, setTags] = useState(song?.tags?.join(', ') || '');

  const handleSmartParse = () => {
    if (!content) return;
    const parsed = parseRawSongText(content);
    setTitle(parsed.title);
    setArtist(parsed.artist);
    setContent(parsed.content);
  };

  const handleExtract = () => {
    if (!content) return;
    const result = extractChordsLocally(content);
    setContent(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !content) {
      return;
    }
    onSave({
      title,
      artist,
      content,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border dark:border-gray-800">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <Music className="w-5 h-5 text-blue-500" />
            {song ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <Music className="w-3 h-3" /> Şarkı Adı *
                </label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  placeholder="Örn: Akdeniz Akşamları"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Sanatçı *
                </label>
                <input 
                  type="text" 
                  value={artist} 
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  placeholder="Örn: Haluk Levent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Kategori
                </label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  placeholder="Örn: Rock"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Etiketler
                </label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  placeholder="Örn: 90lar, slow"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <FileText className="text-gray-400 w-3 h-3" /> Sözler ve Akorlar *
                </label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={handleSmartParse}
                    disabled={!content}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                    title="Sanatçı ve başlığı metinden ayıkla"
                  >
                    <Sparkles className="w-3 h-3" />
                    Akıllı Ayıkla
                  </button>
                  <button 
                    type="button"
                    onClick={handleExtract}
                    disabled={!content}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" />
                    Akorları Yerleştir
                  </button>
                </div>
              </div>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm dark:text-white"
                placeholder="Sözleri ve akorları buraya yapıştırın. Akorlar üst satırdaysa otomatik ayıklanır."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            İptal
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>
    </motion.div>
  );
};
