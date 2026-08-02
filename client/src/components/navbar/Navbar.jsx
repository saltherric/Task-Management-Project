import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUserInfo, updateStoredUserInfo } from '../../helpers/auth';
import { getProfile } from '../../services/authApi';
import { ThemeContext } from '../../contexts/ThemeContext';
import { SearchBar } from '../navbar/SearchBar';
import { NotificationDropdown } from '../navbar/NotificationDropdown';
import { ProfileDropdown } from '../navbar/ProfileDropdown';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from '../../services/notificationService';
import { connectTelegram } from '../../services/telegramApi';

function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Refs for click-outside detection
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const rawUserInfo = localStorage.getItem('userInfo');
      const storedUserInfo = rawUserInfo ? JSON.parse(rawUserInfo) : null;
      return {
        name: storedUserInfo?.name || storedUserInfo?.username || storedUserInfo?.fullName || 'Sarah Connor',
        email: storedUserInfo?.email || 'sarah.connor@taskme.io',
        avatar: storedUserInfo?.avatar || null,
      };
    } catch {
      return { name: 'Sarah Connor', email: 'sarah.connor@taskme.io', avatar: null };
    }
  });

  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [currentUser?.avatar]);

  const [notifications, setNotifications] = useState([]);


  useClickOutside(
    notifRef,
    () => setShowNotifDropdown(false)
  );

  useClickOutside(
    profileRef,
    () => setShowProfileDropdown(false)
  );

  useClickOutside(
    searchRef,
    () => setIsSearchFocused(false)
  );

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) {
      return 'Just now';
    }

    const date = new Date(dateValue);
    const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const loadNotifications = async () => {
    try {
      const response = await getNotifications(20);
      const normalizedNotifications = (response.notifications || []).map((notification) => ({
        id: notification._id,
        text: notification.message || notification.title,
        time: formatRelativeTime(notification.createdAt),
        read: Boolean(notification.isRead),
        type: notification.type,
        actionUrl: notification.actionUrl,
      }));

      setNotifications(normalizedNotifications);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    const fetchLatestProfile = async () => {
      try {
        const user = await getProfile();
        if (user) {
          updateStoredUserInfo({
            name: user.username,
            username: user.username,
            avatar: user.avatar,
          });
          setCurrentUser({
            name: user.username || 'Sarah Connor',
            email: user.email || 'sarah.connor@taskme.io',
            avatar: user.avatar || null,
          });
        }
      } catch (err) {
        console.error("Failed to load user profile in Navbar", err);
      }
    };
    fetchLatestProfile();

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (showNotifDropdown) {
      loadNotifications();
    }
  }, [showNotifDropdown]);

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const rawUserInfo = localStorage.getItem('userInfo');
        const storedUserInfo = rawUserInfo ? JSON.parse(rawUserInfo) : null;
        if (storedUserInfo) {
          setCurrentUser({
            name: storedUserInfo.name || storedUserInfo.username || storedUserInfo.fullName || 'Sarah Connor',
            email: storedUserInfo.email || 'sarah.connor@taskme.io',
            avatar: storedUserInfo.avatar || null,
          });
        }
      } catch (err) {
        console.error("Failed to load user info on update event", err);
      }
    };

    window.addEventListener('userInfoUpdated', handleUserUpdate);
    return () => window.removeEventListener('userInfoUpdated', handleUserUpdate);
  }, []);



  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  const removeNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error('Failed to remove notification', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setShowNotifDropdown(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setCurrentUser({ name: 'Guest', email: '' });
    navigate('/login');
  };

  const handleConnectTelegram = async () => {
    try {
      setIsConnectingTelegram(true);
      const response = await connectTelegram();

      if (response?.url) {
        window.open(response.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to create Telegram connection link', error);
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  const profileInitials = (currentUser?.name || 'G')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'G';

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'Critical': return isDark ? 'bg-rose-900/40 text-rose-300' : 'bg-rose-100 text-rose-700';
      case 'High': return isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
      case 'Medium': return isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-100 text-sky-700';
      default: return isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_UNASSIGNED':
      case 'TASK_UPDATED':
      case 'TASK_MOVED':
      case 'TASK_COMPLETED':
      case 'TASK_DELETED':
      case 'PROJECT_ADDED':
      case 'PROJECT_REMOVED':
        return (
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
        );
      case 'COMMENT_ADDED':
      case 'COMMENT_REPLY':
      case 'MENTION':
        return (
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-950/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
        );
      case 'TASK_DUE_SOON':
      case 'TASK_OVERDUE':
        return (
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        );
      case 'WORKSPACE_INVITE':
      case 'WORKSPACE_JOINED':
      case 'WORKSPACE_ROLE_CHANGED':
      case 'ATTACHMENT_ADDED':
      case 'TAG_ADDED':
      case 'INVITE_ACCEPTED':
        return (
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        );
      default:
        return (
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        );
    }
  };

  return (
    <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200/80 bg-white/80'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {isMobileSearchOpen ? (
            <div className="flex h-16 w-full items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                className={`p-1.5 rounded-xl transition-all duration-200 outline-none ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Exit search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <SearchBar
                searchRef={searchRef}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                isDark={isDark}
                mobile={true}
                onMobileSelect={() => setIsMobileSearchOpen(false)}
              />
            </div>
          ) : (
            <React.Fragment>
              {/* Menu & Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onMenuClick}
              className={`p-1.5 rounded-xl lg:hidden transition-all duration-200 outline-none ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Toggle sidebar menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div 
              className="flex flex-shrink-0 items-center gap-2.5 cursor-pointer group"
              onClick={() => navigate('/home')}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 group-hover:scale-105 transition-all duration-200 ${isDark ? 'shadow-none' : 'shadow-md shadow-indigo-200'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12L10 17L19 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 13V19M16 16H22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className={`text-xl font-bold tracking-tight bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white via-indigo-200 to-white' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'}`}>
                TaskMe
              </span>
            </div>
          </div>

          {/* Interactive Modern Search Bar */}
          <SearchBar
            searchRef={searchRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            isDark={isDark}
          />

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 md:gap-3">
            
            {/* Mobile Search Toggle Button */}
            <button
              className={`p-2 rounded-xl sm:hidden transition-all duration-200 ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            
            {/* Theme Toggle Button */}
            <button
              className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              ) : (
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L12 12"></path>
                </svg>
              )}
            </button>
            
            {/* Notification Bell Dropdown */}
            <div ref={notifRef} className="relative">
              <button 
                className={`relative p-2 rounded-xl transition-all duration-200 ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowProfileDropdown(false);
                }}
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown Panel */}
              {showNotifDropdown && (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  isDark={isDark}
                  markAllAsRead={markAllAsRead}
                  removeNotification={removeNotification}
                  getNotificationIcon={getNotificationIcon}
                  onNotificationClick={handleNotificationClick}
                />
              )}
            </div>

            {/* Premium Profile Avatar & Menu */}
            <div ref={profileRef} className="relative">
              <button 
                className="flex items-center gap-2 focus:outline-none group"
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifDropdown(false);
                }}
              >
                {currentUser?.avatar && !avatarFailed ? (
                  <img 
                    src={currentUser.avatar}
                    alt="User Avatar"
                    onError={() => setAvatarFailed(true)}
                    className={`h-9 w-9 rounded-full object-cover ring-2 group-hover:ring-indigo-100 transition-all duration-200 shadow-sm ${isDark ? 'ring-slate-800 group-hover:ring-indigo-950/60' : 'ring-slate-100'}`}
                  />
                ) : (
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center ring-2 group-hover:ring-indigo-100 transition-all duration-200 shadow-sm ${isDark ? 'ring-slate-800 group-hover:ring-indigo-950/60' : 'ring-slate-100'}`}>
                    {profileInitials}
                  </div>
                )}
              </button>

              {/* Profile Dropdown Panel */}
              {showProfileDropdown && (
                <ProfileDropdown
                  currentUser={currentUser}
                  profileInitials={profileInitials}
                  isDark={isDark}
                  handleConnectTelegram={handleConnectTelegram}
                  isConnectingTelegram={isConnectingTelegram}
                  handleLogout={handleLogout}
                  onClose={() => setShowProfileDropdown(false)}
                />
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  </div>
</nav>
  );
}
export default Navbar


