
import { User, Message } from './types';
import { MOCK_USERS } from './constants';

const DB_KEYS = {
  USERS: 'hearts_connect_users',
  MESSAGES: 'hearts_connect_messages',
  SESSION: 'hearts_connect_session'
};

export const db = {
  init: () => {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      // Map mock users to include credentials
      const seededUsers = MOCK_USERS.map(u => ({
        ...u,
        email: `${u.name.toLowerCase()}@example.com`,
        phone: `+233${Math.floor(Math.random() * 900000000 + 100000000)}`,
        password: 'password123',
        username: u.name.toLowerCase() + '_hearts',
        joinedDate: Date.now() - (Math.random() * 1000000000),
        stats: {
          matches: Math.floor(Math.random() * 50),
          likes: Math.floor(Math.random() * 200),
          profileScore: 85 + Math.floor(Math.random() * 15)
        }
      }));
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seededUsers));
    }
    if (!localStorage.getItem(DB_KEYS.MESSAGES)) {
      localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify([]));
    }
  },

  users: {
    getAll: (): User[] => {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    },
    getById: (id: string): User | undefined => {
      return db.users.getAll().find(u => u.id === id);
    },
    getByEmail: (email: string): User | undefined => {
      return db.users.getAll().find(u => u.email === email);
    },
    getByPhone: (phone: string): User | undefined => {
      return db.users.getAll().find(u => u.phone === phone);
    },
    create: (user: User): void => {
      const users = db.users.getAll();
      users.push(user);
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    },
    update: (id: string, updates: Partial<User>): void => {
      const users = db.users.getAll();
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      }
    }
  },

  messages: {
    getByChatId: (myId: string, theirId: string): Message[] => {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MESSAGES) || '[]');
      return all.filter((m: Message) => 
        (m.senderId === myId && m.receiverId === theirId) || 
        (m.senderId === theirId && m.receiverId === myId)
      );
    },
    send: (message: Message): void => {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MESSAGES) || '[]');
      all.push(message);
      localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify(all));
    }
  },

  auth: {
    login: (email: string, pass: string): User | null => {
      const user = db.users.getByEmail(email);
      if (user && user.password === pass) {
        localStorage.setItem(DB_KEYS.SESSION, user.id);
        return user;
      }
      return null;
    },
    loginWithPhone: (phone: string): User | null => {
      const user = db.users.getByPhone(phone);
      if (user) {
        localStorage.setItem(DB_KEYS.SESSION, user.id);
        return user;
      }
      return null;
    },
    socialLogin: (type: 'google' | 'apple'): User => {
      // Simulate OAuth redirect and success
      const email = `${type}_user@example.com`;
      let user = db.users.getByEmail(email);
      if (!user) {
        user = {
          id: `${type}_${Date.now()}`,
          email,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} User`,
          username: `${type}_connect`,
          age: 25,
          bio: `Joined via ${type}`,
          interests: [],
          online: true,
          photo: `https://picsum.photos/seed/${type}/400/600`,
          isVerified: true, // Auto-verify social logins
          distance: '0km',
          intent: 'serious',
          joinedDate: Date.now(),
          stats: { matches: 0, likes: 0, profileScore: 100 }
        };
        db.users.create(user);
      }
      localStorage.setItem(DB_KEYS.SESSION, user.id);
      return user;
    },
    register: (userData: User): void => {
      db.users.create(userData);
      localStorage.setItem(DB_KEYS.SESSION, userData.id);
    },
    getCurrentUser: (): User | null => {
      const id = localStorage.getItem(DB_KEYS.SESSION);
      if (!id) return null;
      return db.users.getById(id) || null;
    },
    logout: () => {
      localStorage.removeItem(DB_KEYS.SESSION);
    }
  }
};
