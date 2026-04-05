const CHORDS_MAJOR = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORDS_MINOR = ['Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

export function transposeChord(chord: string, semitones: number): string {
  const isMinor = chord.endsWith('m');
  const baseChord = isMinor ? chord.slice(0, -1) : chord;
  
  // Handle flats by converting to sharps
  const flatMap: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  const normalizedBase = flatMap[baseChord] || baseChord;
  
  const chords = isMinor ? CHORDS_MINOR : CHORDS_MAJOR;
  const index = CHORDS_MAJOR.indexOf(normalizedBase);
  
  if (index === -1) return chord; // Not a standard chord
  
  const newIndex = (index + semitones + 12) % 12;
  return chords[newIndex];
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  // Regex to find chords in brackets [Am]
  return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
    // Handle complex chords like Am7, Gsus4, etc.
    // For simplicity, we'll just transpose the base part if it matches
    const baseMatch = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!baseMatch) return match;
    
    const [_, base, suffix] = baseMatch;
    const transposedBase = transposeChord(base, semitones);
    return `[${transposedBase}${suffix}]`;
  });
}

/**
 * Smart extraction of metadata and cleanup of raw text.
 */
export function parseRawSongText(text: string): { title: string, artist: string, content: string } {
  const lines = text.split('\n');
  let title = '';
  let artist = '';
  let startIndex = 0;

  // Heuristic: Check first 5 lines for Title - Artist or similar patterns
  const delimiters = [' - ', ' – ', ' — ', ' | ', ' / ', ' : '];
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let found = false;
    for (const delimiter of delimiters) {
      if (line.includes(delimiter)) {
        const parts = line.split(delimiter);
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
          startIndex = i + 1;
          found = true;
          break;
        }
      }
    }
    if (found) break;
    
    // Pattern: "Title: Something"
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('başlık:') || lowerLine.startsWith('title:') || lowerLine.startsWith('şarkı:')) {
      title = line.split(':')[1].trim();
      startIndex = i + 1;
      continue;
    }
    
    if (lowerLine.startsWith('sanatçı:') || lowerLine.startsWith('artist:') || lowerLine.startsWith('yorum:')) {
      artist = line.split(':')[1].trim();
      startIndex = i + 1;
      continue;
    }
  }

  // If we didn't find a clear pattern, use first line as title if it's short
  if (!title && lines[0] && lines[0].length < 60 && lines[0].trim().length > 0) {
    title = lines[0].trim();
    startIndex = 1;
  }

  // Clean up title: remove "akor", "chord", "lyrics", etc.
  if (title) {
    title = title.replace(/\b(akor|akorlar|chord|chords|lyrics|söz|sözler|tab|tablar|official|video|klip|hd|4k)\b/gi, '').replace(/[\[\]\(\)]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Filter out "unimportant" lines
  const filteredLines = lines.slice(startIndex).filter(line => {
    const l = line.toLowerCase().trim();
    if (!l) return true; // Keep empty lines for spacing
    if (l.startsWith('söz:') || l.startsWith('müzik:') || l.startsWith('akorlar:')) return false;
    if (l.startsWith('lyrics:') || l.startsWith('chords:')) return false;
    if (l.includes('www.') || l.includes('.com') || l.includes('.net') || l.includes('.org')) return false;
    if (l.includes('tüm hakları saklıdır') || l.includes('abone ol') || l.includes('takip et')) return false;
    return true;
  });

  return {
    title: title || 'Adsız Şarkı',
    artist: artist || 'Bilinmeyen Sanatçı',
    content: filteredLines.join('\n').trim()
  };
}

/**
 * Heuristic-based chord extraction.
 * It looks for lines that consist mostly of chord-like patterns
 * and merges them into the lyrics below them using brackets.
 */
export function extractChordsLocally(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const words = line.trim().split(/\s+/);
    
    // Check if this line is likely a chord line
    const isChordLine = words.length > 0 && words.every(word => {
      // Remove common suffixes for check
      // Chords like A, Am, A7, Amaj7, A/G, A#, Abm, etc.
      const cleanWord = word.replace(/(maj|min|dim|aug|sus|add|m|M)?\d?(\/.*)?$/, '');
      return /^[A-G][#b]?$/i.test(cleanWord);
    });

    if (isChordLine && i + 1 < lines.length) {
      const chordLine = lines[i];
      const lyricLine = lines[i + 1];
      
      // If the next line is also a chord line or empty, just keep it as is
      if (lyricLine.trim() === '' || lyricLine.trim().split(/\s+/).every(word => {
        const cleanWord = word.replace(/(maj|min|dim|aug|sus|add|m|M)?\d?(\/.*)?$/, '');
        return /^[A-G][#b]?$/i.test(cleanWord);
      })) {
        result.push(line);
        continue;
      }

      // Merge chords into lyrics based on their position
      let mergedLine = '';
      let currentLyricPos = 0;
      
      // Find positions of chords in the chord line
      const chordsInLine: { chord: string, pos: number }[] = [];
      const wordMatches = chordLine.matchAll(/\S+/g);
      for (const match of wordMatches) {
        chordsInLine.push({ chord: match[0], pos: match.index! });
      }

      for (const { chord, pos } of chordsInLine) {
        // Add lyrics before this chord
        let lyricPart = lyricLine.substring(currentLyricPos, pos);
        
        // If chords are adjacent (no lyrics between them), add a space to prevent overlap
        if (currentLyricPos > 0 && !lyricPart.trim()) {
          lyricPart = '  ';
        }
        
        mergedLine += lyricPart;
        // Add chord in brackets
        mergedLine += `[${chord}]`;
        currentLyricPos = pos;
      }
      // Add remaining lyrics
      mergedLine += lyricLine.substring(currentLyricPos);
      
      result.push(mergedLine);
      i++; // Skip the lyric line since we merged it
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

export function extractChords(text: string): string {
  return extractChordsLocally(text);
}
