import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Song {
  id?: string;
  title: string;
  artist: string;
  content: string; // Markdown with [Am] chords
  category?: string;
  tags?: string[];
  ownerId: string;
  createdAt: Timestamp;
}

export interface Setlist {
  id?: string;
  name: string;
  songIds: string[];
  ownerId: string;
  createdAt: Timestamp;
}
