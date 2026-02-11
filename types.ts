
export enum AppTab {
  DISCOVERY = 'discovery',
  MATCHES = 'matches',
  GHOST = 'ghost',
  MESSAGES = 'messages',
  PROFILE = 'profile'
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  password?: string;
  name: string;
  username: string;
  age: number;
  dob?: string;
  gender?: 'male' | 'female' | 'custom';
  interestedIn?: 'men' | 'women' | 'everyone';
  locationCity?: string;
  locationCountry?: string;
  locationRegion?: string;
  bio: string;
  distance: string;
  distanceValue?: number; // km
  online: boolean;
  photo: string;
  isVerified: boolean; // Renamed from isInstagramVerified
  instagramHandle?: string;
  interests: string[];
  intent: 'casual' | 'serious' | 'friends' | 'fwb';
  // Professional Stats
  stats: {
    matches: number;
    likes: number;
    profileScore: number;
  };
  joinedDate: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface Match {
  id: string;
  users: [string, string];
  timestamp: number;
}
