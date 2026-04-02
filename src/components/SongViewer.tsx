import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { transposeContent } from '../lib/chordUtils';
import { ChevronUp, ChevronDown, Play, Pause, RotateCcw, Type, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SongViewerProps {
  song: Song;
  onClose: () => void;
  nextSong?: Song;
  prevSong?: Song;
  onNavigate?: (song: Song) => void;
}

export const SongViewer: React.FC<SongViewerProps> = ({ 
  song, 
  onClose, 
  nextSong, 
  prevSong, 
  onNavigate 
}) => {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20); // pixels per second
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const transposedContent = transposeContent(song.content, transpose);

  // Reset transpose when song changes
  useEffect(() => {
    setTranspose(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [song.id]);

  useEffect(() => {
    if (isScrolling) {
      const interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += 1;
        }
      }, 1000 / scrollSpeed);
      scrollIntervalRef.current = interval as unknown as number;
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/(\[[^\]]+\])/g);
      const hasChords = line.includes('[');
      
      return (
        <div 
          key={i} 
          className={`relative flex flex-wrap items-end leading-normal ${hasChords ? 'min-h-[4em] pt-10 pb-1' : 'min-h-[1.8em] py-1'}`}
        >
          {parts.map((part, j) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chord = part.slice(1, -1);
              return (
                <span key={j} className="relative inline-block w-0 h-0 overflow-visible">
                  <span 
                    className="absolute bottom-[1.8em] left-0 text-blue-500 dark:text-blue-400 font-bold text-[0.8em] select-none whitespace-nowrap bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 z-20 transform -translate-x-1/2 pointer-events-none"
                    style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
                  >
                    {chord}
                  </span>
                </span>
              );
            }
            return (
              <span key={j} className="text-gray-900 dark:text-gray-100 whitespace-pre relative z-10">
                {part}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-white dark:bg-gray-950 z-50 flex flex-col transition-colors duration-300"
    >
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex-1">
          <h2 className="text-xl font-bold truncate">{song.title}</h2>
          <p className="text-sm text-gray-400 truncate">{song.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <div className="flex items-center gap-1 mr-4 bg-white/10 rounded-full p-1">
              <button 
                disabled={!prevSong}
                onClick={() => prevSong && onNavigate(prevSong)}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-20 transition-all"
                title="Önceki Şarkı"
              >
                <ChevronUp className="w-5 h-5 -rotate-90" />
              </button>
              <button 
                disabled={!nextSong}
                onClick={() => nextSong && onNavigate(nextSong)}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-20 transition-all"
                title="Sonraki Şarkı"
              >
                <ChevronUp className="w-5 h-5 rotate-90" />
              </button>
            </div>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b dark:border-gray-700 flex flex-wrap items-center gap-4 justify-center sm:justify-start transition-colors">
        {/* Transpose */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg shadow-sm border dark:border-gray-700">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Transpoze</span>
          <button onClick={() => setTranspose(t => t - 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white"><Minus className="w-4 h-4"/></button>
          <span className="w-6 text-center font-bold dark:text-white">{transpose > 0 ? `+${transpose}` : transpose}</span>
          <button onClick={() => setTranspose(t => t + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white"><Plus className="w-4 h-4"/></button>
          <button onClick={() => setTranspose(0)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400"><RotateCcw className="w-4 h-4"/></button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg shadow-sm border dark:border-gray-700">
          <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <button onClick={() => setFontSize(s => Math.max(10, s - 2))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white"><Minus className="w-4 h-4"/></button>
          <span className="w-6 text-center font-bold dark:text-white">{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(40, s + 2))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white"><Plus className="w-4 h-4"/></button>
        </div>

        {/* Auto Scroll */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg shadow-sm border dark:border-gray-700">
          <button 
            onClick={() => setIsScrolling(!isScrolling)}
            className={`p-1.5 rounded-full ${isScrolling ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            {isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Hız</span>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={scrollSpeed} 
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white dark:bg-gray-950 selection:bg-blue-100 dark:selection:bg-blue-900/30 transition-colors"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-3xl mx-auto font-mono whitespace-pre-wrap pt-12 pb-32">
          {renderContent(transposedContent)}
        </div>
      </div>

      {/* Setlist Navigation Footer */}
      {(prevSong || nextSong) && onNavigate && (
        <div className="bg-gray-900 p-4 border-t border-white/10 flex items-center justify-between text-white">
          <button 
            disabled={!prevSong}
            onClick={() => prevSong && onNavigate(prevSong)}
            className="flex-1 flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all disabled:opacity-20 text-left"
          >
            <ChevronUp className="w-5 h-5 -rotate-90 text-blue-500" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Önceki</p>
              <p className="font-bold truncate text-sm">{prevSong?.title || '-'}</p>
            </div>
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-4" />

          <button 
            disabled={!nextSong}
            onClick={() => nextSong && onNavigate(nextSong)}
            className="flex-1 flex items-center justify-end gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all disabled:opacity-20 text-right"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sonraki</p>
              <p className="font-bold truncate text-sm">{nextSong?.title || '-'}</p>
            </div>
            <ChevronUp className="w-5 h-5 rotate-90 text-blue-500" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
