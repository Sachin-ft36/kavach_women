import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, Headphones, Play, Pause, 
  Leaf, Target, Moon, Heart, Smile, 
  MessageCircle, Clock, BookOpen, Wind, 
  SkipBack, SkipForward, ListMusic, ChevronRight, List, Library, Music,
  FolderPlus, X, Check, Plus, Folder, Trash2, MoreHorizontal,
  Shuffle, Repeat, ChevronDown, Share2
} from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { toast } from 'sonner';

// Custom Lotus Icon SVG
const LotusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C12 22 15 18 15 14C15 10 12 5 12 5C12 5 9 10 9 14C9 18 12 22 12 22Z" fill="url(#paint0_linear_calm)"/>
    <path d="M12 22C12 22 18 20 20 16C22 12 21 8 21 8C21 8 18 12 15 14C12.5 15.6667 12 22 12 22Z" fill="url(#paint1_linear_calm)"/>
    <path d="M12 22C12 22 6 20 4 16C2 12 3 8 3 8C3 8 6 12 9 14C11.5 15.6667 12 22 12 22Z" fill="url(#paint2_linear_calm)"/>
    <defs>
      <linearGradient id="paint0_linear_calm" x1="12" y1="5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D946EF" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="paint1_linear_calm" x1="16.5" y1="8" x2="16.5" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="paint2_linear_calm" x1="7.5" y1="8" x2="7.5" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
    </defs>
  </svg>
);

export default function CalmSpaceScreen() {
  const { setActiveTab } = useKavachStore();
  const { timeOfDay } = useTimeTheme();
  const isNight = timeOfDay === 'night';
  const [activeCategory, setActiveCategory] = useState('Discover');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [firebaseSongs, setFirebaseSongs] = useState<any[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Dynamic Time-of-Day theme tokens matching morning & night aesthetics
  const bgMain = isNight ? 'bg-[#080713] text-white' : 'bg-gradient-to-b from-[#eef2f7] to-[#f5f7fa] text-slate-800';
  const headerBg = isNight ? 'bg-[#080713]/90' : 'bg-white/80 border-b border-slate-200/50';
  const textTitle = isNight ? 'text-white' : 'text-slate-900';
  const textMuted = isNight ? 'text-[#C9C2DE]' : 'text-slate-500';
  const textSub = isNight ? 'text-[#8C87A3]' : 'text-slate-400';
  const bgCard = isNight ? 'bg-[#141024]' : 'bg-white shadow-sm border border-slate-200/50';
  const bgCardAlt = isNight ? 'bg-[#0C0B18]/90 border border-[#A855F7]/30' : 'bg-white border border-slate-200 shadow-sm';
  const bgCardAltBlue = isNight ? 'bg-[#0C0B18]/90 border border-[#2997FF]/30' : 'bg-white border border-slate-200 shadow-sm';
  const borderCard = isNight ? 'border-[#30254C]' : 'border-slate-200';
  const bgInner = isNight ? 'bg-[#07060F]' : 'bg-slate-50';
  const bgPill = isNight ? 'bg-black/20' : 'bg-slate-100';
  const borderPill = isNight ? 'border-[#A855F7]/30' : 'border-purple-200';
  const textPill = isNight ? 'text-white' : 'text-slate-700';
  const categoryBorder = isNight ? 'border-[#30254C]/40' : 'border-slate-200';
  const buttonHeader = isNight ? 'border-[#A855F7]/30 text-purple-100' : 'border-purple-200 bg-purple-50/50 text-purple-900';
  const headerNavBtn = isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700';
  const continueCard = isNight ? 'bg-[#0E0C1B] border-[#A855F7]/25' : 'bg-white border-slate-200 shadow-sm';
  const continueCardActive = isNight ? 'border-[#A855F7]/70 shadow-[0_0_16px_rgba(168,85,247,0.45)]' : 'border-[#A855F7] shadow-[0_4px_12px_rgba(168,85,247,0.2)]';
  const progressBg = isNight ? 'bg-[#161427]' : 'bg-slate-100';
  const pathCard = isNight ? 'bg-[#0C0B18]/90 text-white' : 'bg-white text-slate-800 shadow-sm hover:bg-slate-50/90';
  const bottomMiniPlayer = isNight ? 'bg-[#191329]/95 border-[#30254C] text-white' : 'bg-white/95 border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-slate-800';
  const spotifyPlayControl = isNight ? 'bg-[#0E0C1B]' : 'bg-[#F4F5F9]';
  const spotifyTableHeader = isNight ? 'bg-[#0E0C1B] text-white/40 border-white/10' : 'bg-[#F4F5F9] text-slate-400 border-slate-200';
  const spotifyRowHover = isNight ? 'hover:bg-white/10' : 'hover:bg-slate-100/80';
  const durationPill = isNight ? 'bg-black/75 border-white/10' : 'bg-slate-800/80 border-slate-700/20';

  // ── MY LIBRARY STATE ────────────────────────────────────────────
  const [likedSongs, setLikedSongs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('kavach_liked_songs') || '[]'); } catch { return []; }
  });
  const [playlists, setPlaylists] = useState<{ id: string; name: string; songs: any[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem('kavach_playlists') || '[]'); } catch { return []; }
  });
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryView, setLibraryView] = useState<'home' | 'liked' | string>('home'); // string = playlist id
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [songContextMenu, setSongContextMenu] = useState<{ song: any; x: number; y: number } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<any>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Persist liked songs
  const toggleLike = (song: any) => {
    setLikedSongs(prev => {
      const wasLiked = prev.some(s => s.id === song.id);
      const next = wasLiked ? prev.filter(s => s.id !== song.id) : [...prev, song];
      localStorage.setItem('kavach_liked_songs', JSON.stringify(next));
      if (wasLiked) {
        toast('Removed from Liked Songs', { icon: '🤍' });
      } else {
        toast('Added to Liked Songs ❤️', { icon: '💜' });
      }
      return next;
    });
  };
  const isLiked = (song: any) => likedSongs.some(s => s.id === song.id);

  // Persist playlists
  const savePlaylists = (next: typeof playlists) => {
    setPlaylists(next);
    localStorage.setItem('kavach_playlists', JSON.stringify(next));
  };
  const createPlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const newPL = { id: Date.now().toString(), name, songs: [] };
    savePlaylists([...playlists, newPL]);
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };
  const deletePlaylist = (id: string) => savePlaylists(playlists.filter(p => p.id !== id));
  const addSongToPlaylist = (playlistId: string, song: any) => {
    savePlaylists(playlists.map(p =>
      p.id === playlistId && !p.songs.some(s => s.id === song.id)
        ? { ...p, songs: [...p.songs, song] }
        : p
    ));
    setAddToPlaylistSong(null);
  };
  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    savePlaylists(playlists.map(p =>
      p.id === playlistId ? { ...p, songs: p.songs.filter(s => s.id !== songId) } : p
    ));
  };

  // Audio playback controller effect + Web Audio Analyser setup
  React.useEffect(() => {
    if (!audioRef.current) return;

    // Load new source when song URL changes
    if (currentSong?.url && audioRef.current.src !== currentSong.url) {
      audioRef.current.load();
    }

    if (isPlaying && currentSong?.url) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Audio play interrupted or failed:", err);
        });
      }

      // Initialize Web Audio API Analyser safely (only for local non-CORS files to avoid silencing/loading exceptions)
      const isLocalFile = currentSong?.url && !currentSong.url.startsWith('http') && !currentSong.url.includes('firebasestorage');
      if (isLocalFile && !audioCtxRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.82;

          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);

          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
          audioSourceRef.current = source;
        } catch (e) {
          console.warn("Could not setup audio analyser node (likely CORS or browser policy):", e);
        }
      } else if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // RequestAnimationFrame loop for broadcasting frequency data
  React.useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const sendFrequencyData = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Verify that the analyser isn't returning pure silence due to CORS block
        let isSilent = true;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > 0) {
            isSilent = false;
            break;
          }
        }

        window.dispatchEvent(new CustomEvent('kavach-frequency-data', {
          detail: {
            frequencies: Array.from(dataArray),
            isSilent
          }
        }));
      }
      animId = requestAnimationFrame(sendFrequencyData);
    };

    animId = requestAnimationFrame(sendFrequencyData);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Listen for dashboard card control command events
  React.useEffect(() => {
    const handleCmdPlayPause = () => {
      setIsPlaying(prev => !prev);
    };

    const handleCmdNext = () => {
      const currentIndex = firebaseSongs.findIndex(s => s.id === currentSong?.id);
      if (currentIndex !== -1 && currentIndex < firebaseSongs.length - 1) {
        setCurrentSong(firebaseSongs[currentIndex + 1]);
        setIsPlaying(true);
      }
    };

    const handleCmdPrev = () => {
      const currentIndex = firebaseSongs.findIndex(s => s.id === currentSong?.id);
      if (currentIndex > 0) {
        setCurrentSong(firebaseSongs[currentIndex - 1]);
        setIsPlaying(true);
      }
    };

    const handleCmdSeek = (e: Event) => {
      const seekTime = (e as CustomEvent).detail;
      if (audioRef.current && !isNaN(seekTime)) {
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    };

    const handleRequestCurrentSong = () => {
      if (currentSong) {
        window.dispatchEvent(new CustomEvent('kavach-song-change', { detail: currentSong }));
        window.dispatchEvent(new CustomEvent('kavach-play-state-change', { detail: { isPlaying } }));
        window.dispatchEvent(new CustomEvent('kavach-time-update', { detail: { currentTime, duration } }));
      }
    };

    window.addEventListener('kavach-cmd-play-pause', handleCmdPlayPause);
    window.addEventListener('kavach-cmd-next', handleCmdNext);
    window.addEventListener('kavach-cmd-prev', handleCmdPrev);
    window.addEventListener('kavach-cmd-seek', handleCmdSeek);
    window.addEventListener('kavach-request-current-song', handleRequestCurrentSong);

    // Setup HTML5 Media Session API for Lock Screen & Notification Shade
    if ('mediaSession' in navigator && currentSong) {
      // Set metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.subtitle || 'Kavach Calm',
        album: activeCategory + ' Session',
        artwork: [
          { src: currentSong.img, sizes: '96x96',   type: 'image/jpeg' },
          { src: currentSong.img, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.img, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.img, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.img, sizes: '384x384', type: 'image/jpeg' },
          { src: currentSong.img, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      // Set playback state for system UI sync
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Lock screen control action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handleCmdPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleCmdNext();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }

    return () => {
      window.removeEventListener('kavach-cmd-play-pause', handleCmdPlayPause);
      window.removeEventListener('kavach-cmd-next', handleCmdNext);
      window.removeEventListener('kavach-cmd-prev', handleCmdPrev);
      window.removeEventListener('kavach-cmd-seek', handleCmdSeek);
      window.removeEventListener('kavach-request-current-song', handleRequestCurrentSong);
    };
  }, [currentSong, firebaseSongs, isPlaying, currentTime, duration, activeCategory]);

  // Dispatch details when currentSong or playState changes
  React.useEffect(() => {
    if (currentSong) {
      window.dispatchEvent(new CustomEvent('kavach-song-change', { detail: currentSong }));
    }
  }, [currentSong]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('kavach-play-state-change', { detail: { isPlaying } }));
  }, [isPlaying]);

  // Update time updates
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('kavach-time-update', { detail: { currentTime, duration } }));
  }, [currentTime, duration]);

  // Fetch songs from Firebase Storage category folder dynamically on activeCategory change
  React.useEffect(() => {
    async function fetchCategorySongs() {
      // Translate category to storage folder path
      let folderName = activeCategory.toLowerCase();
      // Fallback or map 'discover' to 'meditation' so there are always files loaded
      if (folderName === 'discover') {
        folderName = 'meditation';
      }

      // SWR Cache Check: Load cached songs first for instant display
      // v2 = strip ES_ prefix — bust old cache entries
      const CACHE_VER = 'v2';
      const cacheKey = `kavach_songs_${folderName}_${CACHE_VER}`;
      // Clear old v1 cache to avoid stale prefixed titles
      localStorage.removeItem(`kavach_songs_${folderName}`);
      const cached = localStorage.getItem(cacheKey);
      let hasCache = false;
      if (cached) {
        try {
          const cachedList = JSON.parse(cached);
          if (cachedList && cachedList.length > 0) {
            setFirebaseSongs(cachedList);
            setIsLoadingSongs(false); // Suppress spinner since cache is available
            hasCache = true;
            if (!currentSong) {
              setCurrentSong(cachedList[0]);
            }
          }
        } catch (e) {
          console.warn("Failed to parse cached songs list:", e);
        }
      }

      if (!hasCache) {
        setIsLoadingSongs(true);
      }
      
      try {
        const listRef = ref(storage, `songs/${folderName}`);
        const res = await listAll(listRef);
        console.log(`Firebase Storage songs/${folderName} items count:`, res.items.length);
        
        if (res.items.length > 0) {
          const songsList = await Promise.all(
            res.items.map(async (itemRef, idx) => {
              const url = await getDownloadURL(itemRef);
              let title = itemRef.name.replace(/\.[^/.]+$/, ""); // remove extension
              title = title.replace(/^[A-Z]{2}_/i, "").trim();   // strip prefixes like ES_, ZS_, FS_
              let artist = activeCategory;
              const fallbackDurations = ['3:45', '4:12', '2:50', '5:10', '3:24', '4:02', '6:15', '3:50', '4:35', '5:01', '3:18', '2:44'];
              let duration = fallbackDurations[idx % fallbackDurations.length];
              let img = '';
              
              // Try to get custom metadata
              try {
                const metadata = await getMetadata(itemRef);
                if (metadata.customMetadata) {
                  if (metadata.customMetadata.title) title = metadata.customMetadata.title;
                  if (metadata.customMetadata.artist) artist = metadata.customMetadata.artist;
                  if (metadata.customMetadata.duration) duration = metadata.customMetadata.duration;
                  if (metadata.customMetadata.img) img = metadata.customMetadata.img;
                }
              } catch (metaErr) {
                // No custom metadata found
              }

              // Pick a nice Unsplash image based on index if no image is preset
              const fallbackImages = [
                'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'
              ];
              if (!img || !img.startsWith('http')) {
                img = fallbackImages[idx % fallbackImages.length];
              }

              return {
                id: itemRef.name,
                title: title.split('-')[0]?.trim() || title,
                subtitle: title.split('-')[1]?.trim() || artist,
                duration: duration,
                progress: idx === 0 ? 65 : (idx === 1 ? 30 : (idx === 2 ? 50 : 0)),
                img: img,
                url: url,
                category: activeCategory
              };
            })
          );
          
          // Update cache
          localStorage.setItem(cacheKey, JSON.stringify(songsList));
          
          console.log(`Successfully loaded Firebase Storage songs count for folder "${folderName}":`, songsList.length);
          setFirebaseSongs(songsList);
          setCurrentSong((prev: any) => prev || songsList[0]);
        } else {
          console.warn(`No items found in Firebase Storage "songs/${folderName}/" path.`);
          setFirebaseSongs([]);
        }
      } catch (err) {
        console.error(`CRITICAL error listing files from Firebase Storage at songs/${folderName}:`, err);
        setFirebaseSongs([]);
      } finally {
        setIsLoadingSongs(false);
      }
    }
    fetchCategorySongs();
  }, [activeCategory]);

  const categories = ['Discover', 'Music', 'Meditation', 'Mood Booster', 'Breathing', 'Focus', 'Sleep', 'Stories'];

  const continueListening = [
    { title: 'Deep Sleep', subtitle: 'Sleep Music', duration: '18:20', progress: 65, img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80' },
    { title: 'Ocean Waves', subtitle: 'Relaxation', duration: '12:45', progress: 30, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80' },
    { title: 'Morning Meditation', subtitle: 'Mindfulness', duration: '15:30', progress: 50, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80' },
    { title: 'Piano Peace', subtitle: 'Instrumental', duration: '20:10', progress: 85, img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=300&q=80' },
  ];

  const paths = [
    { 
      title: 'Meditation', 
      subtitle: 'Calm your mind', 
      icon: <LotusIcon className="w-6 h-6" />, 
      border: 'border-[#A855F7]/30', 
      glowClass: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.75)]',
      shadowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]'
    },
    { 
      title: 'Music', 
      subtitle: 'Soothing sounds', 
      icon: <Music className="w-6 h-6 text-[#FF4FC9]" />, 
      border: 'border-[#FF4FC9]/30', 
      glowClass: 'drop-shadow-[0_0_8px_rgba(255,79,201,0.75)]',
      shadowClass: 'shadow-[0_0_12px_rgba(255,79,201,0.25)]'
    },
    { 
      title: 'Mood Booster', 
      subtitle: 'Feel better', 
      icon: <Smile className="w-6 h-6 text-[#FF7A00]" />, 
      border: 'border-[#FF7A00]/30', 
      glowClass: 'drop-shadow-[0_0_8px_rgba(255,122,0,0.75)]',
      shadowClass: 'shadow-[0_0_12px_rgba(255,122,0,0.25)]'
    },
    { 
      title: 'Sleep', 
      subtitle: 'Rest deeply', 
      icon: <Moon className="w-6 h-6 text-[#2997FF]" />, 
      border: 'border-[#2997FF]/30', 
      glowClass: 'drop-shadow-[0_0_8px_rgba(41,151,255,0.75)]',
      shadowClass: 'shadow-[0_0_12px_rgba(41,151,255,0.25)]'
    },
    { 
      title: 'Stories', 
      subtitle: 'Peaceful tales', 
      icon: <BookOpen className="w-6 h-6 text-[#00F57A]" />, 
      border: 'border-[#00F57A]/30', 
      glowClass: 'drop-shadow-[0_0_8px_rgba(0,245,122,0.75)]',
      shadowClass: 'shadow-[0_0_12px_rgba(0,245,122,0.25)]'
    },
  ];

  const moods = [
    { emoji: '😊', label: 'Great', id: 'great' },
    { emoji: '🙂', label: 'Good', id: 'good' },
    { emoji: '😐', label: 'Okay', id: 'okay' },
    { emoji: '😔', label: 'Low', id: 'low' },
    { emoji: '😭', label: 'Need Support', id: 'support' },
  ];

  const topPicks = [
    { title: 'Gratitude Meditation', subtitle: 'Mindfulness', duration: '10 Min', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80' },
    { title: 'Positive Energy', subtitle: 'Mood Booster', duration: '8 Min', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80' },
    { title: 'Let Go of Stress', subtitle: 'Relaxation', duration: '12 Min', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80' },
    { title: 'Night Sleep Music', subtitle: 'Deep Sleep', duration: '20 Min', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
  ];

  const displayContinueListening = firebaseSongs.length > 0 ? firebaseSongs.slice(0, 4) : continueListening;
  const displayTopPicks = firebaseSongs.length > 0 ? firebaseSongs.slice(4, 8) : topPicks;

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden selection:bg-purple-500/30 ${currentSong ? 'pb-48' : 'pb-24'} ${bgMain}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes eqBar1 {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        @keyframes eqBar2 {
          0%, 100% { height: 14px; }
          50% { height: 6px; }
        }
        @keyframes eqBar3 {
          0%, 100% { height: 6px; }
          50% { height: 12px; }
        }
        @keyframes eqBar4 {
          0%, 100% { height: 10px; }
          50% { height: 4px; }
        }
        .eq-bar-1 { animation: eqBar1 0.8s ease-in-out infinite; }
        .eq-bar-2 { animation: eqBar2 0.7s ease-in-out infinite; }
        .eq-bar-3 { animation: eqBar3 0.9s ease-in-out infinite; }
        .eq-bar-4 { animation: eqBar4 0.6s ease-in-out infinite; }
        @keyframes heartPop {
          0% { transform: scale(1); }
          30% { transform: scale(1.5); }
          60% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      `}} />

      {/* HEADER */}
      <header className={`flex items-center justify-between px-4 pt-3 pb-2 sticky top-0 z-40 backdrop-blur-xl border-b border-transparent transition-all duration-300 ${headerBg}`}>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform shrink-0 ${headerNavBtn}`}
          >
            <ChevronLeft className="w-4 h-4 -ml-0.5" />
          </button>
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full border bg-transparent shrink-0 ${borderPill}`}>
                <LotusIcon className="w-5 h-5 drop-shadow-md" />
              </div>
              <h1 className={`text-[12px] font-bold tracking-wide uppercase flex items-center gap-1 ${textTitle}`}>
                CALM SPACE
                <Headphones className="w-3.5 h-3.5 text-[#A855F7]" />
              </h1>
            </div>
            <p className={`text-[9px] font-medium tracking-wide -mt-0.5 pl-[38px] ${textMuted}`}>Your peaceful escape</p>
          </div>
        </div>

        <button
          onClick={() => { setIsLibraryOpen(true); setLibraryView('home'); }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-transparent border backdrop-blur-md active:scale-95 transition-transform cursor-pointer shrink-0 relative ${buttonHeader}`}>
          <Library className="w-3.5 h-3.5 text-[#A855F7]" />
          <span className="text-[9px] font-bold tracking-wide">My Library</span>
          {likedSongs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF4FC9] text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{likedSongs.length > 9 ? '9+' : likedSongs.length}</span>
          )}
        </button>
      </header>

      {/* CATEGORY BAR */}
      <div className="px-4 pt-3">
        <div className={`flex overflow-x-auto hide-scrollbar gap-4 pb-1.5 border-b ${categoryBorder}`}>
          {categories.map((category) => (
            <button 
              key={category}
              onClick={() => setActiveCategory(category)}
              className="relative whitespace-nowrap pb-1.5 text-[12px] font-bold transition-colors border-0 bg-transparent cursor-pointer"
            >
              <span className={activeCategory === category ? textTitle : textSub}>
                {category}
              </span>
              {activeCategory === category && (
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#A855F7] shadow-[0_0_6px_rgba(168,85,247,0.8)] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
      <main className="mt-2 px-4 space-y-5 pb-8">
        {activeCategory === 'Discover' ? (
          <>
            {/* HERO SECTION */}
            <div className="w-full rounded-[18px] p-[1.5px] bg-gradient-to-br from-[#A855F7]/70 via-[#FF4FC9]/30 to-[#2997FF]/70 shadow-[0_4px_25px_rgba(168,85,247,0.25)] relative overflow-hidden z-10">
              <section className="relative w-full h-[180px] rounded-[17px] overflow-hidden bg-[#141024]">
                {/* Background image */}
                <img 
                  src="/assets/song/meditation.jpeg" 
                  alt="Meditation" 
                  className="absolute inset-0 w-full h-full object-cover opacity-100"
                />
                
                <div className="relative h-full flex flex-col justify-center py-4 px-4 z-10 w-[60%] text-left">
                  <h2 className="text-[20px] leading-tight font-extrabold tracking-tight mb-1">
                    <span className="text-white block">Find Your</span>
                    <span className="text-[#D946EF] drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Inner Peace</span>
                  </h2>
                  
                  <div className="text-[10px] text-[#C9C2DE] font-medium leading-normal mb-3 opacity-95 text-left">
                    <p>Take a deep breath.</p>
                    <p>Relax your mind.</p>
                    <p>Everything will be okay.</p>
                  </div>

                  <button 
                    onClick={() => {
                      const songs = firebaseSongs.length > 0 ? firebaseSongs : displayContinueListening;
                      if (songs.length === 0) return;
                      const randomSong = songs[Math.floor(Math.random() * songs.length)];
                      setCurrentSong(randomSong);
                      setIsPlaying(true);
                    }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#A855F7] via-[#FF4FC9] to-[#FF7A00] px-3.5 py-1.5 rounded-full w-max text-[10px] font-bold tracking-wide shadow-[0_0_12px_rgba(255,79,201,0.3)] active:scale-95 transition-transform border-0 cursor-pointer text-white">
                    <Play className="w-3 h-3 fill-current text-white" />
                    START NOW
                  </button>
                </div>

                {/* Right Side Pills */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                  {[
                    { icon: Leaf, label: 'Relax' },
                    { icon: Target, label: 'Focus' },
                    { icon: Moon, label: 'Sleep' }
                  ].map((pill, idx) => (
                    <div key={idx} className={`flex items-center gap-2.5 border px-3.5 py-1.5 rounded-full ${bgPill} ${borderPill}`}>
                      <pill.icon className="w-4 h-4 text-[#A855F7]" />
                      <span className={`text-[12px] font-bold tracking-wide ${textPill}`}>{pill.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* CONTINUE LISTENING */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className={`text-[13px] font-bold tracking-tight ${textTitle}`}>Continue Listening</h3>
                <button className="flex items-center text-[#A855F7] text-[10px] font-bold tracking-wide border-0 bg-transparent cursor-pointer">
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 -mx-4 px-4 snap-x">
                {displayContinueListening.map((item, idx) => {
                  const isActive = currentSong?.id === item.id;
                  const isThisPlaying = isActive && isPlaying;
                  return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (isActive) {
                        setIsPlaying(p => !p);
                      } else {
                        setCurrentSong(item);
                        setIsPlaying(true);
                      }
                    }}
                    className={`snap-start shrink-0 w-[120px] rounded-[15px] border overflow-hidden group cursor-pointer relative pb-3 transition-all active:scale-95 ${continueCard} ${isActive ? continueCardActive : ''}`}
                  >
                    <div className="relative h-[75px] w-full">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors"></div>
                      
                      {/* Play/Pause Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-7 h-7 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_3px_10px_rgba(0,0,0,0.3)] active:scale-90 transition-transform ${isActive ? 'bg-[#A855F7]' : 'bg-black/45'}`}>
                          {isThisPlaying 
                            ? <Pause className="w-3 h-3 text-white fill-current" />
                            : <Play className="w-3 h-3 text-white fill-current ml-0.5" />
                          }
                        </div>
                      </div>
                      
                      {/* Duration Chip */}
                      <div className={`absolute bottom-1.5 right-1.5 backdrop-blur-sm px-1.5 py-0.5 rounded-[3px] text-[8px] font-semibold text-white tracking-wide border ${durationPill}`}>
                        {item.duration}
                      </div>

                      {/* EQ animation when playing */}
                      {isThisPlaying && (
                        <div className="absolute bottom-1.5 left-1.5 flex items-end gap-[2px]">
                          <div className="w-[2px] bg-[#A855F7] rounded-full eq-bar-1" style={{height:'4px'}} />
                          <div className="w-[2px] bg-[#FF4FC9] rounded-full eq-bar-2" style={{height:'8px'}} />
                          <div className="w-[2px] bg-[#A855F7] rounded-full eq-bar-3" style={{height:'5px'}} />
                          <div className="w-[2px] bg-[#FF4FC9] rounded-full eq-bar-4" style={{height:'7px'}} />
                        </div>
                      )}
                    </div>

                    <div className="px-2.5 pt-1.5 text-left">
                      <h4 className={`font-bold text-[10.5px] leading-tight mb-0.5 truncate tracking-wide ${isActive ? 'text-[#A855F7]' : textTitle}`}>{item.title}</h4>
                      <p className={`${textSub} text-[8.5px] truncate mb-1`}>{item.subtitle}</p>
                    </div>
                    
                    {/* Progress Bar - full width at the bottom */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden ${progressBg}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] rounded-r-full" 
                        style={{ width: `${isActive ? Math.round((currentTime / (duration || 1)) * 100) : item.progress}%` }}
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>

            {/* CHOOSE YOUR PATH */}
            <section>
              <h3 className={`text-[13px] font-bold tracking-tight mb-2 text-left ${textTitle}`}>Choose Your Path</h3>
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 -mx-4 px-4 snap-x">
                {paths.map((path, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveCategory(path.title)}
                    className={`snap-start shrink-0 w-[90px] h-[100px] rounded-[15px] border ${path.border} ${path.shadowClass} flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-opacity-80 transition-all active:scale-95 ${pathCard}`}
                  >
                    <div className={`mb-1 ${path.glowClass}`}>
                      {path.icon}
                    </div>
                    <h4 className={`font-bold text-[11px] leading-tight mb-0.5`}>{path.title}</h4>
                    <p className={`${textSub} text-[8px] leading-tight`}>{path.subtitle}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* AMBIENT SOUNDS */}
            <section>
              <div className={`rounded-[20px] p-4 relative overflow-hidden shadow-[0_0_18px_rgba(41,151,255,0.12)] ${bgCardAltBlue}`}>
                {/* Background glow */}
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-blue-500/10 blur-[40px] rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500/10 blur-[30px] rounded-full" />

                {/* Header */}
                <div className="relative z-10 flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#2997FF]/15 border border-[#2997FF]/30 flex items-center justify-center shrink-0">
                    <Wind className="w-4 h-4 text-[#2997FF]" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-[13px] font-bold tracking-wide ${textTitle}`}>Ambient Atmosphere</h3>
                    <p className={`text-[9px] mt-0.5 ${textSub}`}>Tap a sound to mix it with your music 🎧</p>
                  </div>
                </div>

                {/* How to use hint */}
                <div className={`relative z-10 border rounded-[10px] px-3 py-2 mb-3 mt-2 flex items-center gap-2 ${isNight ? 'bg-[#2997FF]/8 border-[#2997FF]/20' : 'bg-blue-50/50 border-blue-200'}`}>
                  <span className="text-[14px]">💡</span>
                  <p className={`text-[9.5px] leading-relaxed text-left ${isNight ? 'text-[#A8D8FF]' : 'text-blue-700'}`}>
                    <span className={`font-bold ${isNight ? 'text-white' : 'text-slate-800'}`}>How to use:</span> Tap any sound to play it in the background. You can mix multiple sounds together for the perfect atmosphere!
                  </p>
                </div>

                {/* Inner card — Sound picker */}
                <div className={`relative z-10 border rounded-[14px] p-3 mt-1 ${isNight ? 'bg-[#07060F] border-[#2997FF]/25' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isNight ? 'text-[#2997FF]' : 'text-blue-600'}`}>🎵 Choose Your Sound</p>
                    <span className={`text-[8px] font-medium ${textSub}`}>Tap to activate</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    {[
                      { emoji: '🌧️', label: 'Rain',        color: 'from-[#2997FF]/25 to-[#2997FF]/8',  border: 'border-[#2997FF]/50' },
                      { emoji: '🌊', label: 'Ocean',       color: 'from-[#00B4D8]/25 to-[#00B4D8]/8',  border: 'border-[#00B4D8]/50' },
                      { emoji: '🐦', label: 'Birds',       color: 'from-[#00F57A]/25 to-[#00F57A]/8',  border: 'border-[#00F57A]/50' },
                      { emoji: '🌲', label: 'Forest',      color: 'from-[#A855F7]/25 to-[#A855F7]/8',  border: 'border-[#A855F7]/50' },
                      { emoji: '🔊', label: 'White\nNoise', color: 'from-[#FF4FC9]/25 to-[#FF4FC9]/8', border: 'border-[#FF4FC9]/50' },
                    ].map((sound, idx) => (
                      <button
                        key={idx}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-[11px] border bg-gradient-to-b ${sound.color} ${sound.border} cursor-pointer active:scale-95 transition-all hover:brightness-125`}
                        style={{ minWidth: 0 }}
                      >
                        <span className="text-[22px] leading-none">{sound.emoji}</span>
                        <span className={`text-[7.5px] font-bold text-center leading-tight w-full px-0.5 whitespace-pre-line ${textTitle}`}>{sound.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* MOOD CHECK */}
            <section>
              <div className={`rounded-[20px] p-4 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.18)] ${bgCardAlt}`}>
                {/* Background Glow */}
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500/10 blur-[30px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  {/* Left side text and icon */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(255,79,201,0.7)] shrink-0">
                      <Heart className="w-7 h-7 text-[#FF4FC9] fill-[#FF4FC9]" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-bold text-[13px] leading-tight tracking-wide ${textTitle}`}>How are you feeling today?</h3>
                      <p className={`text-[9px] mt-0.5 tracking-wide ${textSub}`}>Your mood helps us personalize your experience.</p>
                    </div>
                  </div>
                  
                  {/* Right side Emojis inline */}
                  <div className="flex items-center justify-between md:justify-end gap-2 px-1 flex-1">
                    {moods.map((mood) => {
                      const isSelected = selectedMood === mood.id;
                      return (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(mood.id)}
                          className="flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer active:scale-95 transition-transform"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[18px] transition-all duration-300 ${
                            isSelected 
                              ? 'border border-[#FF4FC9] drop-shadow-[0_0_8px_#FF4FC9] bg-[#FF4FC9]/10' 
                              : `${isNight ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200/60'} border border-transparent`
                          }`}>
                            {mood.emoji}
                          </div>
                          <span className={`text-[8.5px] font-semibold tracking-wide text-center transition-colors ${
                            isSelected ? 'text-[#FF4FC9]' : textSub
                          } leading-tight max-w-[42px]`}>
                            {mood.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
      
                {/* Dynamic Message Area */}
                <div className={`border rounded-[12px] p-2 flex items-center justify-between mt-1 gap-2 ${isNight ? 'bg-[#0B0914]/90 border-[#3A285B]/40' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[10px] font-medium pl-1 text-left ${textMuted}`}>
                    It's okay to have a tough day. You're not alone.
                  </p>
                  <button className="bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] text-white text-[10px] font-bold px-3 py-1.5 rounded-[9px] shadow-[0_3px_10px_rgba(255,79,201,0.25)] flex items-center gap-1.5 active:scale-95 transition-transform border-0 cursor-pointer shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    Talk To Someone
                  </button>
                </div>
              </div>
            </section>

            {/* TOP PICKS FOR YOU */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className={`text-[14px] font-bold tracking-tight ${textTitle}`}>Top Picks For You</h3>
                <button className="flex items-center text-[#A855F7] text-[11px] font-bold tracking-wide border-0 bg-transparent cursor-pointer">
                  View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
              
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 -mx-4 px-4 snap-x">
                {displayTopPicks.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`snap-start shrink-0 w-[120px] rounded-[15px] border overflow-hidden group cursor-pointer relative pb-2.5 ${continueCard}`}
                  >
                    <div className="relative h-[75px] w-full">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors"></div>
                      
                      {/* Floating Top Right Heart */}
                      <button className="absolute top-2 right-2 p-0.5 rounded-full bg-transparent text-white hover:text-[#A855F7] transition-colors border-0 cursor-pointer active:scale-90 transition-transform">
                        <Heart className="w-4 h-4 text-[#A855F7]" />
                      </button>
      
                      {/* Bottom Left Play Button */}
                      <div className="absolute bottom-2 left-2 w-5.5 h-5.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_3px_10px_rgba(0,0,0,0.3)]">
                        <Play className="w-2 h-2 text-white fill-current ml-0.5" />
                      </div>
      
                      {/* Bottom Right Duration Chip */}
                      <div className={`absolute bottom-2 right-2 backdrop-blur-sm px-1.5 py-0.5 rounded-[3px] text-[8px] font-semibold text-white tracking-wide border ${durationPill}`}>
                        {item.duration}
                      </div>
                    </div>
      
                    <div className="px-2.5 pt-1.5 text-left">
                      <h4 className={`font-bold text-[10.5px] leading-tight mb-0.5 truncate tracking-wide ${textTitle}`}>{item.title}</h4>
                      <p className={`${textSub} text-[8.5px] truncate`}>{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* QUICK WELLNESS TOOLS */}
            <section className="pb-6">
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 -mx-4 px-4">
                {[
                  { icon: Wind, title: 'Breathing Exercises', sub: 'Reduce stress', color: 'text-[#2997FF]' },
                  { icon: Clock, title: 'Focus Timer', sub: 'Stay productive', color: 'text-[#00F57A]' },
                  { icon: Heart, title: 'Daily Affirmation', sub: 'Positive mindset', color: 'text-[#FF4FC9]' },
                  { icon: BookOpen, title: 'Sleep Stories', sub: 'Night relaxation', color: 'text-[#A855F7]' },
                ].map((tool, idx) => (
                  <div key={idx} className={`shrink-0 flex items-center gap-2 rounded-[14px] p-2.5 pr-3.5 shadow-sm cursor-pointer transition-colors border ${bgCard} ${borderCard}`}>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <tool.icon className={`w-4 h-4 ${tool.color}`} />
                    </div>
                    <div className="text-left">
                      <h4 className={`text-[11px] font-bold leading-tight ${textTitle}`}>{tool.title}</h4>
                      <p className={`text-[9px] mt-0.5 ${textSub}`}>{tool.sub}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ml-1.5 ${textSub}`} />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* SPOTIFY PLAYLIST VIEW */
          <div className="text-left animate-fadeIn -mx-4 pb-12">
            {/* Header backdrop gradient */}
            <div 
              className="px-4 pt-6 pb-6 bg-gradient-to-b from-[#B07A3E]/90 via-[#181528]/95 to-[#0E0C1B] relative overflow-hidden"
              style={{
                background: activeCategory === 'Meditation' 
                  ? 'linear-gradient(to bottom, #9E6D38 0%, #161226 65%, #0E0C1B 100%)'
                  : activeCategory === 'Music'
                  ? 'linear-gradient(to bottom, #A63F86 0%, #161226 65%, #0E0C1B 100%)'
                  : activeCategory === 'Sleep'
                  ? 'linear-gradient(to bottom, #1D63A8 0%, #161226 65%, #0E0C1B 100%)'
                  : 'linear-gradient(to bottom, #7C3AED 0%, #161226 65%, #0E0C1B 100%)'
              }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Large Playlist Art */}
                <div className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] rounded-[6px] overflow-hidden shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-white/5 relative group">
                  <img 
                    src={firebaseSongs[0]?.img || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80'} 
                    alt={activeCategory} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <LotusIcon className="w-14 h-14 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
                  </div>
                </div>
                
                {/* Playlist Metadata details */}
                <div className="text-left flex-1 min-w-0 flex flex-col justify-end h-[150px] sm:h-[170px] pb-1">
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider block">Public Playlist</span>
                  <h1 className="text-[28px] sm:text-[42px] leading-tight font-extrabold text-white mt-1 mb-2 tracking-tighter truncate font-sans">
                    {activeCategory === 'Meditation' ? 'Peaceful Meditation' : activeCategory}
                  </h1>
                  <p className="text-white/80 text-[11px] font-medium leading-normal mb-3">
                    {activeCategory === 'Meditation' ? 'Breathe. Sense. Feel. Transcend.' : `Immerse in pure ambient ${activeCategory.toLowerCase()} relaxation tracks.`}
                  </p>
                  
                  {/* Kavach stats row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold text-white leading-none">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#A855F7] to-[#FF4FC9] flex items-center justify-center shrink-0">
                      <LotusIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="hover:underline cursor-pointer">Kavach</span>
                    <span className="text-white/60">•</span>
                    <span>2,826,142 saves</span>
                    <span className="text-white/60">•</span>
                    <span>{firebaseSongs.length} songs</span>
                    <span className="text-white/60 font-normal">, 9 hr 25 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Play bar control strip */}
            <div className={`px-4 py-4 flex items-center justify-between transition-colors ${spotifyPlayControl}`}>
              <div className="flex items-center gap-5 sm:gap-6">
                {/* Big Kavach Play Button */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-0 shadow-lg cursor-pointer shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current text-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-current text-white ml-0.5" />
                  )}
                </button>

                {/* Back Button styled as a mini album cover pill */}
                <button 
                  onClick={() => setActiveCategory('Discover')}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center active:scale-90 transition-all cursor-pointer ${headerNavBtn}`}
                  title="Go Back"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Kavach Shuffle Icon */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`border-0 bg-transparent cursor-pointer transition-colors ${isPlaying ? 'text-[#A855F7]' : 'text-slate-400 hover:text-[#A855F7]'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </button>

                {/* Add Circle Icon */}
                <button className={`border-0 bg-transparent cursor-pointer transition-colors ${textSub}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                {/* Download Arrow Circle Icon */}
                <button className={`border-0 bg-transparent cursor-pointer transition-colors ${textSub}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="8 12 12 16 16 12" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                  </svg>
                </button>

                {/* More options dots */}
                <button className={`border-0 bg-transparent cursor-pointer transition-colors text-[18px] font-bold leading-none pb-1 ${textSub}`}>
                  •••
                </button>
              </div>

              {/* Far right search & Custom Order */}
              <div className={`flex items-center gap-4 text-[11px] font-bold ${textSub}`}>
                <button className={`border-0 bg-transparent cursor-pointer ${textSub}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
                <div className={`hidden sm:flex items-center gap-1 cursor-pointer`}>
                  <span>Custom order</span>
                  <List className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Spotify Table Headers */}
            <div className={`px-4 transition-colors ${spotifyPlayControl}`}>
              <div className={`flex items-center text-[10.5px] font-black uppercase tracking-wider border-b pb-2.5 mb-2.5 ${spotifyTableHeader}`}>
                <span className="w-8 text-center shrink-0">#</span>
                <span className="flex-1 text-left">Title</span>
                <span className="hidden md:block w-[25%] text-left">Album</span>
                <span className="hidden sm:block w-[20%] text-left">Date added</span>
                <span className="w-12 text-right shrink-0 pr-2">
                  <svg className="w-4 h-4 inline-block -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
              </div>

              {/* Songs List */}
              <div className="flex flex-col gap-0.5 pb-10">
                {isLoadingSongs ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#A855F7]/30 border-t-[#A855F7] animate-spin" />
                    <p className="text-[#8C87A3] text-[11px] font-medium">Listing audio tracks from storage...</p>
                  </div>
                ) : firebaseSongs.length > 0 ? (
                  firebaseSongs.map((item, idx) => {
                    const isSelected = currentSong?.id === item.id;
                    const isCurrentPlaying = isSelected && isPlaying;
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setIsPlaying(!isPlaying);
                          } else {
                            setCurrentSong(item);
                            setIsPlaying(true);
                          }
                        }}
                        className={`flex items-center py-2.5 px-2 rounded-[4px] transition-colors duration-150 group cursor-pointer ${spotifyRowHover} ${
                          isSelected ? (isNight ? 'bg-white/5' : 'bg-slate-100') : ''
                        }`}
                      >
                        {/* Index number / Sound indicator */}
                        <div className="w-8 text-center shrink-0 flex items-center justify-center">
                          {isSelected ? (
                            isCurrentPlaying ? (
                              <div className="flex items-end gap-[2.5px] h-3.5 w-3.5 justify-center pb-0.5">
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full eq-bar-1" style={{ height: '4px' }} />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full eq-bar-2" style={{ height: '14px' }} />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full eq-bar-3" style={{ height: '6px' }} />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full eq-bar-4" style={{ height: '10px' }} />
                              </div>
                            ) : (
                              /* Paused state - static bars */
                              <div className="flex items-end gap-[2.5px] h-3.5 w-3.5 justify-center pb-0.5">
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full h-[5px]" />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full h-[9px]" />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full h-[4px]" />
                                <div className="w-[2.2px] bg-[#A855F7] rounded-full h-[6px]" />
                              </div>
                            )
                          ) : (
                            <>
                              <span className={`text-[12px] font-semibold group-hover:hidden ${textSub}`}>{idx + 1}</span>
                              <span className={`text-[10px] hidden group-hover:inline-block ${textTitle}`}>▶</span>
                            </>
                          )}
                        </div>

                        {/* Title Cover & Meta */}
                        <div className="flex-1 min-w-0 flex items-center gap-3.5 text-left">
                          <div className="w-[40px] h-[40px] rounded-[4px] overflow-hidden shrink-0 border border-white/5 shadow-md">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col truncate pr-3">
                            <span className={`text-[13px] font-semibold truncate ${
                              isSelected ? 'text-[#A855F7]' : textTitle
                            } tracking-wide`}>
                              {item.title}
                            </span>
                            <span className={`text-[11px] mt-0.5 truncate font-medium ${textMuted}`}>{item.subtitle}</span>
                          </div>
                        </div>

                        {/* Album Column */}
                        <div className={`hidden md:block w-[25%] text-left truncate text-[12px] font-semibold pr-3 ${textMuted}`}>
                          {activeCategory} Session
                        </div>

                        {/* Date Added Column */}
                        <div className={`hidden sm:block w-[20%] text-left text-[12px] font-semibold ${textMuted}`}>
                          1 week ago
                        </div>

                        {/* Heart + Duration */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(item); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all active:scale-90 ${isLiked(item) ? 'text-[#FF4FC9]' : `${textSub} hover:text-[#A855F7]`}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked(item) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddToPlaylistSong(item); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-colors active:scale-90 ${textSub} hover:text-[#A855F7]`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <span className={`text-[12px] font-semibold w-10 text-right pr-1 ${textMuted}`}>{item.duration}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`py-16 text-center rounded-[18px] border border-dashed p-6 ${isNight ? 'bg-[#0E0C1B]/50 border-[#A855F7]/20' : 'bg-white border-slate-200'}`}>
                    <Headphones className="w-8 h-8 text-[#A855F7]/50 mx-auto mb-2" />
                    <p className={`text-[12px] font-bold ${textTitle}`}>No songs found in songs/{activeCategory.toLowerCase()}/</p>
                    <p className={`text-[10px] mt-1 max-w-[200px] mx-auto leading-normal ${textSub}`}>
                      Please upload audio files in this subfolder inside your Firebase Storage bucket.
                    </p>
                    <button 
                      onClick={() => setActiveCategory('Discover')}
                      className="mt-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] text-white text-[10px] font-bold shadow-md cursor-pointer border-0 active:scale-95 transition-all"
                    >
                      Back to Discover
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── ADD TO PLAYLIST SHEET ─────────────────────────────── */}
      {addToPlaylistSong && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={() => setAddToPlaylistSong(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-[#120B25] border border-[#30254C] rounded-t-[24px] p-5 pb-8 z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-[14px] font-bold text-white mb-1">Add to Playlist</h3>
            <p className="text-[#8C87A3] text-[11px] mb-4 truncate">{addToPlaylistSong.title}</p>
            {playlists.length === 0 ? (
              <p className="text-[#8C87A3] text-[11px] text-center py-4">No playlists yet. Create one in My Library.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => addSongToPlaylist(pl.id, addToPlaylistSong)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] border cursor-pointer text-left transition-all active:scale-95 ${
                      pl.songs.some(s => s.id === addToPlaylistSong.id)
                        ? 'border-[#A855F7]/60 bg-[#A855F7]/10 text-[#D8B4FE]'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Folder className="w-4 h-4 shrink-0 text-[#A855F7]" />
                    <span className="text-[12px] font-semibold flex-1 truncate">{pl.name}</span>
                    <span className="text-[10px] text-white/40">{pl.songs.length} songs</span>
                    {pl.songs.some(s => s.id === addToPlaylistSong.id) && <Check className="w-3.5 h-3.5 text-[#A855F7]" />}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setAddToPlaylistSong(null)}
              className="mt-4 w-full py-2 rounded-full border border-white/10 text-white/60 text-[11px] font-semibold cursor-pointer bg-transparent active:scale-95 transition-all"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ── MY LIBRARY BOTTOM SHEET ───────────────────────────── */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={() => setIsLibraryOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-md border rounded-t-[24px] z-10 flex flex-col ${bgInner} ${borderCard}`}
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${categoryBorder}`}>
              {libraryView !== 'home' ? (
                <button onClick={() => setLibraryView('home')} className="flex items-center gap-1.5 text-[#A855F7] text-[11px] font-bold border-0 bg-transparent cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}
              <h2 className={`text-[14px] font-extrabold tracking-wide absolute left-1/2 -translate-x-1/2 ${textTitle}`}>
                {libraryView === 'home' ? 'My Library' : libraryView === 'liked' ? '❤️ Liked Songs' : (playlists.find(p => p.id === libraryView)?.name || 'Playlist')}
              </h2>
              <button onClick={() => setIsLibraryOpen(false)} className={`border-0 bg-transparent cursor-pointer hover:text-[#A855F7] ${textSub}`}><X className="w-4 h-4" /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">

              {/* HOME VIEW */}
              {libraryView === 'home' && (
                <>
                  {/* Liked Songs Folder */}
                  <div
                    onClick={() => setLibraryView('liked')}
                    className="flex items-center gap-3.5 p-3 rounded-[14px] bg-gradient-to-r from-[#FF4FC9]/15 to-[#A855F7]/10 border border-[#FF4FC9]/25 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="w-11 h-11 rounded-[10px] bg-gradient-to-br from-[#FF4FC9] to-[#A855F7] flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-white fill-current" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-[13px] font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>Liked Songs</p>
                      <p className={`text-[10px] ${isNight ? 'text-[#8C87A3]' : 'text-slate-500'}`}>{likedSongs.length} songs</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </div>

                  {/* Playlists */}
                  {playlists.map(pl => (
                    <div
                      key={pl.id}
                      className={`flex items-center gap-3.5 p-3 rounded-[14px] cursor-pointer active:scale-[0.98] transition-all group border ${continueCard}`}
                      onClick={() => setLibraryView(pl.id)}
                    >
                      <div className="w-11 h-11 rounded-[10px] bg-gradient-to-br from-[#A855F7]/40 to-[#6366F1]/30 flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5 text-[#A855F7]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[13px] font-bold truncate ${textTitle}`}>{pl.name}</p>
                        <p className={`text-[10px] ${textSub}`}>{pl.songs.length} songs</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-purple-400/70" />
                    </div>
                  ))}

                  {/* Create Playlist */}
                  {isCreatingPlaylist ? (
                    <div className={`flex items-center gap-2 p-3 rounded-[14px] border ${bgCard} ${borderCard}`}>
                      <input
                        autoFocus
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') createPlaylist(); if (e.key === 'Escape') setIsCreatingPlaylist(false); }}
                        placeholder="Playlist name..."
                        className={`flex-1 bg-transparent border-0 outline-none text-[13px] font-semibold ${textTitle} placeholder:${textSub}`}
                      />
                      <button onClick={createPlaylist} className="w-7 h-7 bg-[#A855F7] rounded-full flex items-center justify-center cursor-pointer border-0 shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button onClick={() => setIsCreatingPlaylist(false)} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-0 shrink-0 ${isNight ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingPlaylist(true)}
                      className={`flex items-center gap-3 w-full p-3 rounded-[14px] border border-dashed border-[#A855F7]/30 bg-transparent cursor-pointer active:scale-[0.98] transition-all text-left ${isNight ? 'hover:bg-[#A855F7]/5' : 'hover:bg-slate-50'}`}
                    >
                      <div className="w-11 h-11 rounded-[10px] border border-[#A855F7]/30 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-[#A855F7]" />
                      </div>
                      <span className="text-[13px] font-bold text-[#A855F7]">Create New Playlist</span>
                    </button>
                  )}
                </>
              )}

              {/* LIKED SONGS VIEW */}
              {libraryView === 'liked' && (
                likedSongs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Heart className="w-10 h-10 text-[#FF4FC9]/30 mx-auto mb-3" />
                    <p className={`text-[12px] ${textMuted}`}>No liked songs yet.<br />Tap ❤️ on any song to save it here.</p>
                  </div>
                ) : (
                  likedSongs.map((song, idx) => (
                    <div
                      key={song.id || idx}
                      onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                      className={`flex items-center gap-3 p-2.5 rounded-[12px] cursor-pointer active:scale-[0.98] transition-all ${
                        currentSong?.id === song.id ? 'bg-[#A855F7]/15 border border-[#A855F7]/30' : spotifyRowHover
                      }`}
                    >
                      <img src={song.img} alt={song.title} className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[12px] font-bold truncate ${currentSong?.id === song.id ? 'text-[#A855F7]' : textTitle}`}>{song.title}</p>
                        <p className={`text-[10px] truncate ${textSub}`}>{song.subtitle}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                        className="w-7 h-7 flex items-center justify-center border-0 bg-transparent cursor-pointer text-[#FF4FC9] active:scale-90"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <span className={`text-[10px] shrink-0 ${textMuted}`}>{song.duration}</span>
                    </div>
                  ))
                )
              )}

              {/* PLAYLIST DETAIL VIEW */}
              {libraryView !== 'home' && libraryView !== 'liked' && (() => {
                const pl = playlists.find(p => p.id === libraryView);
                if (!pl) return null;
                return pl.songs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Folder className="w-10 h-10 text-[#A855F7]/30 mx-auto mb-3" />
                    <p className={`text-[12px] ${textMuted}`}>Empty playlist.<br />Tap ••• on any song and add it here.</p>
                  </div>
                ) : (
                  pl.songs.map((song, idx) => (
                    <div
                      key={song.id || idx}
                      onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                      className={`flex items-center gap-3 p-2.5 rounded-[12px] cursor-pointer active:scale-[0.98] transition-all ${
                        currentSong?.id === song.id ? 'bg-[#A855F7]/15 border border-[#A855F7]/30' : spotifyRowHover
                      }`}
                    >
                      <img src={song.img} alt={song.title} className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[12px] font-bold truncate ${currentSong?.id === song.id ? 'text-[#A855F7]' : textTitle}`}>{song.title}</p>
                        <p className={`text-[10px] truncate ${textSub}`}>{song.subtitle}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(pl.id, song.id); }}
                        className={`w-7 h-7 flex items-center justify-center border-0 bg-transparent cursor-pointer active:scale-90 transition-colors ${textSub} hover:text-red-400`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-[10px] shrink-0 ${textMuted}`}>{song.duration}</span>
                    </div>
                  ))
                );
              })()}

            </div>

            {/* Play All Button for Liked/Playlist */}
            {(libraryView === 'liked' ? likedSongs : playlists.find(p => p.id === libraryView)?.songs || []).length > 0 && libraryView !== 'home' && (
              <div className={`px-4 pb-6 pt-3 border-t shrink-0 ${categoryBorder}`}>
                <button
                  onClick={() => {
                    const songs = libraryView === 'liked' ? likedSongs : (playlists.find(p => p.id === libraryView)?.songs || []);
                    if (songs.length > 0) { setCurrentSong(songs[0]); setIsPlaying(true); setIsLibraryOpen(false); }
                  }}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] text-white text-[12px] font-bold tracking-wide shadow-[0_0_16px_rgba(168,85,247,0.4)] cursor-pointer border-0 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Play All
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FULL SCREEN PLAYER ───────────────────────────────── */}
      {currentSong && isFullPlayerOpen && (() => {
        const formatTime = (secs: number) => {
          if (isNaN(secs) || secs === undefined) return '0:00';
          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };
        const progressPct = (currentTime / (duration || 1)) * 100;
        return (
          <div
            className="fixed inset-0 z-[500] flex flex-col"
            style={{
              background: `linear-gradient(180deg, #1a0533 0%, #0d0a1e 55%, #080713 100%)`,
              animation: 'slideUpPlayer 0.35s cubic-bezier(0.32,0.72,0,1) forwards',
            }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideUpPlayer {
                from { transform: translateY(100%); opacity: 0.5; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes spinSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .album-spin { animation: spinSlow 20s linear infinite; animation-play-state: paused; }
              .album-spin.playing { animation-play-state: running; }
              .progress-thumb::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 14px; height: 14px;
                background: white; border-radius: 50%;
                box-shadow: 0 0 6px rgba(255,255,255,0.5);
                cursor: pointer;
              }
              .progress-thumb { -webkit-appearance: none; appearance: none; }
            `}} />

            {/* Blurred album art background */}
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center blur-[60px] scale-110"
              style={{ backgroundImage: `url(${currentSong.img})` }}
            />

            {/* Top bar */}
            <div className="relative flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
              <button
                onClick={() => setIsFullPlayerOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border-0 cursor-pointer active:scale-90 transition-transform"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
              <div className="text-center">
                <p className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Now Playing</p>
                <p className="text-[11px] text-white font-bold mt-0.5 truncate max-w-[160px]">{activeCategory} Session</p>
              </div>
              <button
                onClick={() => setAddToPlaylistSong(currentSong)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border-0 cursor-pointer active:scale-90 transition-transform"
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Album Art */}
            <div className="relative flex-1 flex items-center justify-center px-8">
              <div
                className={`w-full max-w-[320px] aspect-square rounded-[24px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/10 ${isPlaying ? 'scale-100' : 'scale-[0.9]'} transition-transform duration-500`}
              >
                <img
                  src={currentSong.img}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Song Info + Heart */}
            <div className="relative px-6 pb-2 pt-6 flex items-center justify-between shrink-0">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-[22px] font-extrabold text-white truncate leading-tight">{currentSong.title}</h2>
                <p className="text-[14px] text-white/60 font-medium mt-1 truncate">{currentSong.subtitle}</p>
              </div>
              <button
                onClick={() => toggleLike(currentSong)}
                className={`shrink-0 transition-all border-0 bg-transparent cursor-pointer ${isLiked(currentSong) ? 'text-[#FF4FC9]' : 'text-white/50 hover:text-white'}`}
              >
                <Heart
                  key={`fp-heart-${currentSong?.id}-${isLiked(currentSong)}`}
                  className={`w-7 h-7 transition-all ${isLiked(currentSong) ? 'fill-current heart-pop drop-shadow-[0_0_10px_rgba(255,79,201,0.9)]' : ''}`}
                />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="relative px-6 pb-2 shrink-0">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                step={0.1}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  if (audioRef.current) { audioRef.current.currentTime = t; }
                  setCurrentTime(t);
                }}
                className="w-full h-1.5 rounded-full outline-none cursor-pointer progress-thumb"
                style={{
                  background: `linear-gradient(to right, #A855F7 ${progressPct}%, rgba(255,255,255,0.15) ${progressPct}%)`,
                }}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-white/50">{formatTime(currentTime)}</span>
                <span className="text-[11px] text-white/50">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="relative px-6 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                {/* Shuffle */}
                <button
                  onClick={() => setIsShuffled(p => !p)}
                  className={`border-0 bg-transparent cursor-pointer active:scale-90 transition-all ${isShuffled ? 'text-[#A855F7]' : 'text-white/50 hover:text-white'}`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                {/* Prev */}
                <button
                  onClick={() => {
                    const idx = firebaseSongs.findIndex(s => s.id === currentSong.id);
                    if (idx > 0) { setCurrentSong(firebaseSongs[idx - 1]); setIsPlaying(true); }
                  }}
                  className="border-0 bg-transparent cursor-pointer text-white active:scale-90 transition-transform"
                >
                  <SkipBack className="w-8 h-8 fill-current" />
                </button>

                {/* Play/Pause — big */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] border-0 cursor-pointer active:scale-95 transition-transform"
                >
                  {isPlaying
                    ? <Pause className="w-7 h-7 text-[#0D0A1E] fill-current" />
                    : <Play className="w-7 h-7 text-[#0D0A1E] fill-current ml-1" />}
                </button>

                {/* Next */}
                <button
                  onClick={() => {
                    const idx = firebaseSongs.findIndex(s => s.id === currentSong.id);
                    if (idx !== -1 && idx < firebaseSongs.length - 1) { setCurrentSong(firebaseSongs[idx + 1]); setIsPlaying(true); }
                  }}
                  className="border-0 bg-transparent cursor-pointer text-white active:scale-90 transition-transform"
                >
                  <SkipForward className="w-8 h-8 fill-current" />
                </button>

                {/* Repeat */}
                <button
                  onClick={() => setRepeatMode(m => m === 'off' ? 'all' : m === 'all' ? 'one' : 'off')}
                  className={`border-0 bg-transparent cursor-pointer active:scale-90 transition-all relative ${repeatMode !== 'off' ? 'text-[#A855F7]' : 'text-white/50 hover:text-white'}`}
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-black text-[#A855F7]">1</span>}
                </button>
              </div>
            </div>

            {/* Bottom row: Queue + Share */}
            <div className="relative px-6 pb-10 flex items-center justify-between shrink-0">
              <button
                onClick={() => { setIsFullPlayerOpen(false); setIsLibraryOpen(true); setLibraryView('liked'); }}
                className="flex items-center gap-2 text-white/40 hover:text-white border-0 bg-transparent cursor-pointer active:scale-90 transition-all text-[11px] font-semibold"
              >
                <Library className="w-4 h-4" /> My Library
              </button>
              <div className="flex items-center gap-1">
                {firebaseSongs.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => { setCurrentSong(s); setIsPlaying(true); }}
                    className={`h-1 rounded-full cursor-pointer transition-all ${
                      s.id === currentSong.id ? 'w-4 bg-white' : 'w-1 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <button className="flex items-center gap-2 text-white/40 hover:text-white border-0 bg-transparent cursor-pointer active:scale-90 transition-all text-[11px] font-semibold">
                <List className="w-4 h-4" /> Queue
              </button>
            </div>
          </div>
        );
      })()}

      {/* BOTTOM MINI PLAYER — sits above the global BottomNavBar (74px citizen nav) */}
      {currentSong && (
        <div className="fixed bottom-[74px] left-0 right-0 z-50 flex justify-center px-3 pb-1.5 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            <div className={`backdrop-blur-2xl border rounded-[16px] py-2.5 px-3.5 flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative transition-all duration-300 ${bgCard} ${borderCard}`}>

              {/* Subtle top progress border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-200/20">
                <div 
                  className="h-full bg-gradient-to-r from-[#A855F7] to-[#FF4FC9] transition-all duration-100"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>

              {/* Clickable song info area — opens full player */}
              <div
                className="flex items-center flex-1 min-w-0 pr-2.5 cursor-pointer"
                onClick={() => setIsFullPlayerOpen(true)}
              >
                <img 
                  src={currentSong.img} 
                  alt={currentSong.title} 
                  className="w-10 h-10 rounded-[8px] object-cover border border-white/10 shrink-0"
                />
                <div className="ml-3 truncate text-left flex-1 min-w-0">
                  <h4 className={`text-[12px] font-bold truncate ${textTitle}`}>{currentSong.title}</h4>
                  <p className={`text-[9.5px] truncate mt-0.5 ${textSub}`}>
                    {currentSong.subtitle} • {(() => {
                      const formatTime = (secs: number) => {
                        if (isNaN(secs)) return '0:00';
                        const m = Math.floor(secs / 60);
                        const s = Math.floor(secs % 60);
                        return `${m}:${s < 10 ? '0' : ''}${s}`;
                      };
                      return `${formatTime(currentTime)} / ${formatTime(duration || 480)}`;
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Media Controls */}
              <div className="flex items-center gap-2.5 shrink-0 pl-1">
                <button 
                  onClick={() => {
                    const currentIndex = firebaseSongs.findIndex(s => s.id === currentSong.id);
                    if (currentIndex > 0) {
                      setCurrentSong(firebaseSongs[currentIndex - 1]);
                      setIsPlaying(true);
                    }
                  }}
                  className={`transition-colors border-0 bg-transparent cursor-pointer active:scale-90 ${textSub} hover:text-[#A855F7]`}
                >
                  <SkipBack className="w-3.5 h-3.5 fill-current" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#A855F7] to-[#6366F1] shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center justify-center text-white active:scale-95 transition-transform border-0 cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <button 
                  onClick={() => {
                    const currentIndex = firebaseSongs.findIndex(s => s.id === currentSong.id);
                    if (currentIndex !== -1 && currentIndex < firebaseSongs.length - 1) {
                      setCurrentSong(firebaseSongs[currentIndex + 1]);
                      setIsPlaying(true);
                    }
                  }}
                  className={`transition-colors border-0 bg-transparent cursor-pointer active:scale-90 ${textSub} hover:text-[#A855F7]`}
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
                
                <div className={`w-[1px] h-4 mx-0.5 ${isNight ? 'bg-purple-900/30' : 'bg-slate-200'}`}></div>
                
                <button
                  onClick={() => currentSong && toggleLike(currentSong)}
                  className={`transition-all border-0 bg-transparent cursor-pointer ${currentSong && isLiked(currentSong) ? 'text-[#FF4FC9]' : `${textSub} hover:text-[#FF4FC9]`}`}
                >
                  <Heart
                    key={`heart-${currentSong?.id}-${isLiked(currentSong)}`}
                    className={`w-4 h-4 transition-all ${currentSong && isLiked(currentSong) ? 'fill-current heart-pop drop-shadow-[0_0_6px_rgba(255,79,201,0.8)]' : ''}`}
                  />
                </button>
                <button className={`transition-colors border-0 bg-transparent cursor-pointer ${textSub} hover:text-[#A855F7]`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio 
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const currentT = audioRef.current.currentTime;
            setCurrentTime(currentT);
            
            // Sync Media Session position state
            if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && duration) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: duration,
                  playbackRate: 1,
                  position: currentT
                });
              } catch (e) {
                console.warn('Error setting Media Session position state:', e);
              }
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const realDuration = audioRef.current.duration;
            setDuration(realDuration);
            const m = Math.floor(realDuration / 60);
            const s = Math.floor(realDuration % 60);
            const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
            
            setFirebaseSongs(prev => prev.map(song => {
              if (song.id === currentSong?.id) {
                return { ...song, duration: formatted };
              }
              return song;
            }));
          }
        }}
        onEnded={() => {
          const currentIndex = firebaseSongs.findIndex(s => s.id === currentSong?.id);
          if (currentIndex !== -1 && currentIndex < firebaseSongs.length - 1) {
            setCurrentSong(firebaseSongs[currentIndex + 1]);
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
      />
    </div>
  );
}
