
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppTab, User, Message } from './types';
import { ICONS } from './constants';
import { generateIcebreakers, transcribeAudio, askLoveAI } from './services/geminiService';
import { db } from './db';

db.init();

// --- Helper Components ---
const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; onClick: () => void }> = ({ active, icon, onClick }) => (
  <button 
    onClick={onClick} 
    className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'text-gray-900 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
  >
    <div className="w-6 h-6">{icon}</div>
  </button>
);

const Toggle: React.FC<{ active: boolean; onChange: (v: boolean) => void }> = ({ active, onChange }) => (
  <button 
    onClick={() => onChange(!active)}
    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${active ? 'bg-rose-500' : 'bg-gray-200'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
  </button>
);

// --- Auth Components ---
const AuthPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [view, setView] = useState<'landing' | 'email' | 'phone' | 'otp' | 'register'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.auth.login(email, password);
    if (user) onAuth();
    else setError('Invalid email or password');
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) {
      setError('Invalid phone number');
      return;
    }
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setView('otp'); }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '1234') {
      const user = db.auth.loginWithPhone(phone);
      if (user) onAuth();
      else setView('register');
    } else setError('Incorrect code (use 1234)');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = { 
      id: `u_${Date.now()}`, 
      email, 
      phone, 
      name, 
      username: name.toLowerCase().replace(/\s+/g, '_'), 
      age: 25, 
      bio: '', 
      interests: [], 
      online: true, 
      photo: `https://picsum.photos/seed/${name}/400/600`, 
      isVerified: true, 
      distance: '0km', 
      intent: 'serious', 
      joinedDate: Date.now(), 
      stats: { matches: 0, likes: 0, profileScore: 80 } 
    };
    db.auth.register(newUser);
    onAuth();
  };

  return (
    <div className="flex flex-col h-full bg-white p-8 animate-fade-in-up">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#0f141e] rounded-[32px] flex items-center justify-center shadow-lg mb-6">
            <ICONS.Heart className="w-10 h-10 text-rose-500 fill-current" />
          </div>
          <h1 className="text-4xl font-black text-[#0f141e] tracking-tighter text-center leading-none mb-2">Hearts Connect</h1>
          <p className="text-[#a0abbb] text-[11px] font-black text-center uppercase tracking-[0.25em] opacity-80">Discovery & Stack MVP</p>
        </div>
        
        {view === 'landing' && (
          <div className="space-y-4 w-full flex flex-col items-center">
            {/* Apple Button */}
            <button 
              onClick={() => { db.auth.socialLogin('apple'); onAuth(); }} 
              className="w-full flex items-center justify-center space-x-2 py-4 bg-[#111827] text-white font-black text-[15px] rounded-[18px] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.96.95-2.06 1.91-3.32 1.91-1.24 0-1.63-.76-3.11-.76-1.49 0-1.92.74-3.11.76-1.26.02-2.43-1.05-3.39-2.01-1.95-1.96-3.44-5.53-3.44-8.76 0-5.18 3.25-7.91 6.32-7.91 1.62 0 3.14.9 4.14.9 1 0 2.87-1.11 4.79-1.11 2.02 0 3.55 1.07 4.39 2.28-4.22 2.53-3.53 8.1 0 9.58-.91 2.21-2.08 4.41-3.27 5.62v.01zm-3.41-17.76c.86-1.04 1.44-2.48 1.44-3.93 0-.2-.02-.4-.06-.59-1.31.05-2.9 1.11-3.84 2.22-.84.97-1.58 2.45-1.58 3.87 0 .22.02.44.07.61 1.46.06 2.92-1.11 3.97-2.18z"/>
              </svg>
              <span className="tracking-tight">Continue with Apple</span>
            </button>
            
            {/* Google Login Card - Fixed Sizing */}
            <button 
              onClick={() => { db.auth.socialLogin('google'); onAuth(); }} 
              className="w-full flex items-center bg-[#f1f5f9] border border-[#e2e8f0] py-5 px-6 rounded-[28px] active:scale-[0.98] transition-all group overflow-hidden"
            >
              <div className="w-1/2 flex justify-center">
                <svg className="w-14 h-14" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="w-1/2 text-left pl-2">
                <p className="text-[14px] font-black text-[#4b5563] leading-tight">Continue with<br/>Google</p>
              </div>
            </button>
            
            {/* Email Button */}
            <button 
              onClick={() => setView('email')} 
              className="w-full py-4 bg-[#f8fafc] text-[#4b5563] font-black text-[15px] rounded-[18px] active:scale-[0.98] transition-all"
            >
              Sign in with Email
            </button>
            
            {/* Phone Option */}
            <button 
              onClick={() => setView('phone')} 
              className="text-[10px] font-black text-[#a0abbb] uppercase tracking-[0.3em] text-center mt-6 hover:text-[#0f141e] transition-colors"
            >
              USE PHONE NUMBER
            </button>
          </div>
        )}

        {view === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 animate-fade-in-up">
            <div className="flex space-x-2">
              <div className="w-20 bg-gray-50 border p-4 rounded-2xl text-center font-bold text-gray-400">+233</div>
              <input className="flex-1 bg-gray-50 border p-4 rounded-2xl font-bold outline-none" placeholder="00 000 0000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoFocus />
            </div>
            <button className="w-full py-4 bg-gray-900 text-white font-black uppercase rounded-2xl">Next</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-2">Back</button>
          </form>
        )}
        
        {view === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 animate-fade-in-up text-center">
            <h2 className="text-xl font-black mb-2">Verification</h2>
            <input className="w-full bg-gray-50 border p-4 rounded-2xl font-black text-center text-2xl tracking-[1em] outline-none" placeholder="0000" maxLength={4} value={otp} onChange={e => setOtp(e.target.value)} autoFocus />
            <button className="w-full py-4 bg-gray-900 text-white font-black uppercase rounded-2xl mt-4">Verify Code</button>
          </form>
        )}
        
        {view === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in-up">
            <input className="w-full bg-gray-50 border p-4 rounded-[18px] font-medium outline-none" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="w-full bg-gray-50 border p-4 rounded-[18px] font-medium outline-none" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-4 bg-gray-900 text-white font-black uppercase rounded-[18px]">Login</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-2">Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Settings Toggle Component ---
const SettingsItem: React.FC<{ label: string; icon?: React.ReactNode; value?: string; onClick?: () => void; showChevron?: boolean }> = ({ label, icon, value, onClick, showChevron = true }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 active:bg-gray-50 transition-colors text-left"
  >
    <div className="flex items-center space-x-3">
      {icon && <div className="text-gray-400">{icon}</div>}
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      {value && <span className="text-xs font-medium text-gray-400">{value}</span>}
      {showChevron && <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>}
    </div>
  </button>
);

// --- Main App Components ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(db.auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DISCOVERY);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isGeneratingIcebreakers, setIsGeneratingIcebreakers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');

  // Discovery settings states
  const [discoveryDistance, setDiscoveryDistance] = useState(50);
  const [showOnline, setShowOnline] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Geographic Options
  const availableCountries = useMemo(() => ['All', ...Array.from(new Set(db.users.getAll().map(u => u.locationCountry).filter(Boolean))).sort()] as string[], []);
  const availableRegions = useMemo(() => ['All', ...Array.from(new Set(db.users.getAll().filter(u => filterCountry === 'All' || u.locationCountry === filterCountry).map(u => u.locationRegion).filter(Boolean))).sort()] as string[], [filterCountry]);

  // Filtering Logic
  const filteredUsers = useMemo(() => db.users.getAll().filter(u => u.id !== currentUser?.id && (filterCountry === 'All' || u.locationCountry === filterCountry) && (filterRegion === 'All' || u.locationRegion === filterRegion)), [currentUser, filterCountry, filterRegion]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      const msgs = db.messages.getByChatId(currentUser.id, selectedUser.id);
      setChatMessages(msgs);
      if (msgs.length === 0) (async () => { 
        setIsGeneratingIcebreakers(true); 
        const ideas = await generateIcebreakers(currentUser.interests, selectedUser.interests); 
        setIcebreakers(ideas); 
        setIsGeneratingIcebreakers(false); 
      })();
    }
  }, [selectedUser, currentUser]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatMessages]);

  const handleSendMessage = (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const msg = text || chatInput;
    if (!msg.trim() || !currentUser || !selectedUser) return;
    const newMessage = { id: Date.now().toString(), senderId: currentUser.id, receiverId: selectedUser.id, text: msg, timestamp: Date.now() };
    db.messages.send(newMessage);
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  const handleLogout = () => {
    db.auth.logout();
    setCurrentUser(null);
  };

  const saveProfileChanges = () => {
    if (currentUser && editFormData) {
      db.users.update(currentUser.id, editFormData);
      setCurrentUser(prev => prev ? { ...prev, ...editFormData } : null);
      setIsEditingProfile(false);
    }
  };

  if (!currentUser) return <AuthPage onAuth={() => setCurrentUser(db.auth.getCurrentUser())} />;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white shadow-2xl relative overflow-hidden font-inter text-gray-900 border-x border-gray-100">
      
      {/* Settings/Filters Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 animate-fade-in-up flex flex-col max-w-md mx-auto">
          <header className="px-6 py-4 bg-white border-b flex items-center justify-between shadow-sm">
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 p-2"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
            <h2 className="text-sm font-black uppercase tracking-widest">Settings Center</h2>
            <div className="w-6" />
          </header>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            {/* VIP Section */}
            <div className="p-4">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/20 blur-3xl group-hover:bg-rose-500/30 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-rose-500 p-1.5 rounded-lg"><ICONS.Heart className="w-3 h-3 text-white fill-current" /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Hearts Plus</span>
                  </div>
                  <h3 className="text-xl font-black mb-1">Upgrade to Premium</h3>
                  <p className="text-xs text-gray-400 mb-6 font-medium">Unlock unlimited likes, travel anywhere, and see who likes you.</p>
                  <button className="w-full py-4 bg-white text-gray-900 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg">Get 3 Months - 50% Off</button>
                </div>
              </div>
            </div>

            {/* Discovery Settings */}
            <div className="px-6 pt-6 pb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Discovery Filters</h4>
              <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-50">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Country</label>
                  <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setFilterRegion('All'); }} className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none">
                    {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="p-4 border-b border-gray-50">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Region</label>
                  <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none">
                    {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-white border-b border-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-700">Distance Preference</span>
                    <span className="text-xs font-black text-rose-500 uppercase">{discoveryDistance} km</span>
                  </div>
                  <input type="range" min="1" max="160" value={discoveryDistance} onChange={(e) => setDiscoveryDistance(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                </div>
              </div>
            </div>

            {/* Privacy & Visibility */}
            <div className="px-6 pt-6 pb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Privacy & Safety</h4>
              <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50">
                  <div className="flex items-center space-x-3"><ICONS.Activity className="w-4 h-4 text-gray-400" /><span className="text-sm font-bold text-gray-700">Activity Status</span></div>
                  <Toggle active={showOnline} onChange={setShowOnline} />
                </div>
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50">
                  <div className="flex items-center space-x-3"><ICONS.Chat className="w-4 h-4 text-gray-400" /><span className="text-sm font-bold text-gray-700">Notifications</span></div>
                  <Toggle active={pushEnabled} onChange={setPushEnabled} />
                </div>
                <SettingsItem label="Blocked Accounts" />
                <SettingsItem label="Safety Center" icon={<ICONS.Verify className="w-4 h-4 text-rose-400" />} />
              </div>
            </div>

            <div className="px-6 pt-10 pb-20 space-y-4">
              <button onClick={handleLogout} className="w-full py-5 bg-white border border-rose-100 text-rose-500 font-black uppercase text-[10px] tracking-widest rounded-[24px] active:scale-95 transition-all">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI Header */}
      {!selectedUser && (
        <header className="px-6 py-4 flex items-center justify-between bg-white/95 backdrop-blur-md border-b sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <ICONS.Heart className="w-5 h-5 text-rose-500 fill-current" />
            </div>
            <span className="font-black text-sm uppercase tracking-tighter">Hearts Connect</span>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-gray-50 rounded-full border border-gray-100 text-gray-400 hover:text-rose-500 transition-all">
            <ICONS.Filter className="w-5 h-5" />
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar relative pb-20">
        {activeTab === AppTab.DISCOVERY && !selectedUser && (
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter">Discovery</h1>
            <div className="grid grid-cols-2 gap-4">
              {filteredUsers.map((u, i) => (
                <div key={u.id} onClick={() => setSelectedUser(u)} className="relative aspect-[3/4] rounded-[32px] overflow-hidden group shadow-lg cursor-pointer bg-gray-100 animate-fade-in-up" style={{ animationDelay: `${i*100}ms` }}>
                  <img src={u.photo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={u.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center space-x-1 font-black text-sm tracking-tight">{u.name}, {u.age}{u.isVerified && <ICONS.Verify className="w-3.5 h-3.5 text-rose-400" />}</div>
                    <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest truncate">{u.locationRegion || 'Near You'}</p>
                    {u.isVerified && <p className="text-[6px] font-black uppercase tracking-widest text-white/40 mt-1">Verified with Hearts Connect</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === AppTab.PROFILE && !selectedUser && (
          <div className="animate-fade-in-up h-full flex flex-col">
            <div className="px-6 py-6 bg-white border-b">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2 text-gray-300"><ICONS.Appearance className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Personal Center</span></div>
                <div className="flex items-center space-x-3">
                  <div className="p-[1.5px] bg-blue-400/20 rounded-xl"><button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white rounded-lg border-2 border-blue-400/40 group"><ICONS.Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-500" /></button></div>
                  <button className="p-2.5 bg-rose-50 rounded-full border border-rose-100"><ICONS.Report className="w-5 h-5 text-rose-500" /></button>
                </div>
              </div>
              <div className="flex items-center space-x-8 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-100 shadow-xl p-1.5"><img src={currentUser.photo} className="w-full h-full rounded-full object-cover" alt="Profile" /></div>
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm"><ICONS.Verify className="w-3.5 h-3.5" /></div>
                </div>
                <div className="flex-1 grid grid-cols-3 text-center border-l border-gray-100 pl-6">
                  <div className="flex flex-col"><span className="text-xl font-black">{currentUser.stats.matches}</span><span className="text-[8px] font-black text-gray-300 uppercase">Stack</span></div>
                  <div className="flex flex-col border-x border-gray-50"><span className="text-xl font-black">{currentUser.stats.likes}</span><span className="text-[8px] font-black text-gray-300 uppercase">Favs</span></div>
                  <div className="flex flex-col"><span className="text-xl font-black text-rose-500">{currentUser.stats.profileScore}</span><span className="text-[8px] font-black text-gray-300 uppercase">Score</span></div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 leading-none">{currentUser.name}</h3>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">@{currentUser.username}</p>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">{currentUser.bio || 'Verified Member.'}</p>
                {currentUser.isVerified && (
                  <div className="flex items-center space-x-1 mt-4">
                    <ICONS.Verify className="w-3 h-3 text-rose-500" />
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Verified with Hearts Connect</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 bg-white border-t border-gray-50 grid grid-cols-3 gap-0.5 p-0.5 animate-fade-in-up">
              {[1,2,3,4,5,6].map(n => <div key={n} className="aspect-square bg-gray-100"><img src={`https://picsum.photos/seed/${currentUser.id}_p_${n}/400/400`} className="w-full h-full object-cover" alt="Gallery" /></div>)}
            </div>
          </div>
        )}

        {/* Professional Chat View */}
        {selectedUser && (
          <div className="fixed inset-0 z-[110] bg-white flex flex-col max-w-md mx-auto animate-fade-in-up">
            <header className="px-4 py-3 flex items-center justify-between border-b bg-white/95 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 text-gray-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                <div className="relative">
                  <img src={selectedUser.photo} className="w-9 h-9 rounded-full object-cover border shadow-sm" alt={selectedUser.name} />
                  {selectedUser.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <h4 className="font-black text-sm text-gray-800 leading-tight">{selectedUser.name}</h4>
                    {selectedUser.isVerified && <ICONS.Verify className="w-3 h-3 text-rose-500" />}
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{selectedUser.online ? 'Online now' : 'Active recently'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                 <button className="p-2 text-gray-400 hover:text-gray-600"><ICONS.Activity className="w-5 h-5" /></button>
                 <button className="p-2 text-gray-400 hover:text-gray-600"><ICONS.Report className="w-5 h-5" /></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50/30">
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                 <img src={selectedUser.photo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" alt={selectedUser.name} />
                 <div>
                    <h3 className="text-xl font-black text-gray-800">{selectedUser.name}, {selectedUser.age}</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">{selectedUser.bio}</p>
                    {selectedUser.isVerified && <p className="text-[8px] font-black uppercase tracking-widest text-rose-500 mt-2">Verified with Hearts Connect</p>}
                 </div>
              </div>

              {chatMessages.length === 0 ? (
                <div className="space-y-6 pt-4 animate-fade-in-up">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-px w-8 bg-gray-200"></div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Icebreakers by Love AI</span>
                    <div className="h-px w-8 bg-gray-200"></div>
                  </div>
                  <div className="flex flex-col space-y-3">
                    {isGeneratingIcebreakers ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-rose-500 border-t-transparent"></div>
                      </div>
                    ) : icebreakers.map((text, idx) => (
                      <button key={idx} onClick={() => handleSendMessage(undefined, text)} className="p-4 bg-white border border-gray-100 rounded-3xl text-sm font-medium text-gray-600 hover:border-rose-300 transition-all text-left shadow-sm active:scale-[0.98]">
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'} group animate-fade-in-up`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${
                      m.senderId === currentUser.id 
                        ? 'bg-gray-900 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {m.text}
                      <p className={`text-[8px] mt-1 font-bold uppercase opacity-40 ${m.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t sticky bottom-0">
               <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                 <div className="flex-1 bg-gray-100 rounded-[28px] px-2 py-1 flex items-end">
                    <button type="button" className="p-2 text-gray-400 hover:text-rose-500"><ICONS.Saved className="w-5 h-5" /></button>
                    <textarea 
                      className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-sm font-medium max-h-32 resize-none no-scrollbar placeholder-gray-400"
                      placeholder="Aa"
                      rows={1}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                    <button type="button" className="p-2 text-gray-400 hover:text-rose-500"><ICONS.Activity className="w-5 h-5" /></button>
                 </div>
                 {chatInput.trim() ? (
                   <button type="submit" className="w-11 h-11 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-100 active:scale-90 transition-all">
                     <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-7-9-7V5l12 7-12 7v-5z" /></svg>
                   </button>
                 ) : (
                   <button type="button" className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-all">
                     <ICONS.Activity className="w-5 h-5" />
                   </button>
                 )}
               </form>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      {!selectedUser && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-3xl border-t flex items-center justify-around px-2 py-3 z-40 shadow-2xl">
          <NavButton active={activeTab === AppTab.DISCOVERY} icon={<ICONS.Search className="w-6 h-6" />} onClick={() => { setActiveTab(AppTab.DISCOVERY); setSelectedUser(null); }} />
          <NavButton active={activeTab === AppTab.MATCHES} icon={<ICONS.Heart className="w-6 h-6" />} onClick={() => { setActiveTab(AppTab.MATCHES); setSelectedUser(null); }} />
          <NavButton active={activeTab === AppTab.GHOST} icon={<div className="w-6 h-6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg></div>} onClick={() => { setActiveTab(AppTab.GHOST); setSelectedUser(null); }} />
          <NavButton active={activeTab === AppTab.MESSAGES} icon={<ICONS.Chat className="w-6 h-6" />} onClick={() => { setActiveTab(AppTab.MESSAGES); setSelectedUser(null); }} />
          <NavButton active={activeTab === AppTab.PROFILE} icon={<div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${activeTab === AppTab.PROFILE ? 'border-gray-900 shadow-lg' : 'border-transparent'}`}><img src={currentUser.photo} className="w-full h-full object-cover" alt="Avatar" /></div>} onClick={() => { setActiveTab(AppTab.PROFILE); setSelectedUser(null); }} />
        </nav>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #f43f5e;
          border: 4px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
}
