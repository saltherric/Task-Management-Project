import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { getStoredUserInfo, updateStoredUserInfo } from '../helpers/auth';
import { updateProfile, getProfile } from '../services/authApi';
import { useAlert } from '../contexts/AlertContext';
import API from '../services/api';

export default function SettingsPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const { showAlert } = useAlert();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarKey, setAvatarKey] = useState(null);
  const [initialAvatarKey, setInitialAvatarKey] = useState(null);
  const [initialFullname, setInitialFullname] = useState('');

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    commentsMentions: true,
    dueReminders: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Avatar image must be under 5MB.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingAvatar(true);
    try {
      const response = await API.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        const { fileKey, fileUrl } = response.data;
        setAvatarPreview(fileUrl);
        setAvatarKey(fileKey);
        showAlert("Avatar uploaded successfully. Don't forget to save changes!", "success");
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      showAlert(err.response?.data?.message || "Failed to upload avatar image.", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  // Fetch the latest user configuration when the page loads
  useEffect(() => {
    const fetchUserSettings = async () => {
      setIsLoading(true);
      try {
        const user = await getProfile();
        if (user) {
          // Set inputs to user data
          setFullname(user.username || '');
          setInitialFullname(user.username || '');
          setEmail(user.email || '');
          setAvatarPreview(user.avatar || null);
          setAvatarKey(user.avatar || null);
          setInitialAvatarKey(user.avatar || null);
          
          // Set notification preferences
          if (user.notificationSettings) {
            setNotifications({
              taskAssigned: user.notificationSettings.taskAssigned !== false,
              commentsMentions: user.notificationSettings.commentsMentions !== false,
              dueReminders: user.notificationSettings.dueReminders !== false,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load profile details:', error);
        showAlert('Failed to load user profile.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, []);

  // Handle profile form submissions to save changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullname.trim()) {
      showAlert('Full name is required.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      // Send updated values to database
      const response = await updateProfile({
        username: fullname.trim(),
        avatar: avatarKey,
      });

      if (response) {
        // Sync name directly inside the local storage cache
        updateStoredUserInfo({ 
          name: response.username,
          username: response.username,
          avatar: response.avatar
        });
        setAvatarPreview(response.avatar);
        setAvatarKey(response.avatar);
        setInitialAvatarKey(response.avatar);
        setInitialFullname(response.username);
        showAlert('Profile updated successfully.', 'success');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showAlert(error.response?.data?.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = async (field) => {
    const nextSettings = {
      ...notifications,
      [field]: !notifications[field]
    };

    setNotifications(nextSettings);

    try {
      // Post updated preferences object to the database
      await updateProfile({
        notificationSettings: nextSettings
      });
    } catch (error) {
      console.error(`Failed to save toggle for ${field}:`, error);
      showAlert('Failed to save notification preferences.', 'error');
      // Revert state back on error
      setNotifications(notifications);
    }
  };
  
  const profileInitials = fullname
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className={`w-full h-full flex flex-col min-h-0 overflow-y-auto font-sans antialiased transition-colors duration-300 ${
      isDark ? 'bg-[#090D16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Scrollable Layout Container aligned to the left */}
      <div className="max-w-[800px] px-4 py-6 sm:px-6 space-y-8">
        
        {/* Page Title & Subtitle Header */}
        <div className="border-b pb-5 border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className={`text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage your account, workspace and integrations.
          </p>
        </div>

        {isLoading ? (
          // Loading spinner view
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading settings...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* CARD 1: PROFILE CARD */}
            <div className={`border rounded-2xl p-6 shadow-xs ${
              isDark ? 'border-slate-800 bg-[#121622]' : 'border-slate-200/80 bg-white'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Profile
                </h3>
              </div>

              {/* Avatar circle & upload actions row */}
              <div className="flex items-center gap-4 mt-5">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile Avatar" 
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                    {profileInitials}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="avatar-upload-input"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload-input').click()}
                    disabled={isUploadingAvatar}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-750 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (avatarKey && avatarKey !== initialAvatarKey && !avatarKey.startsWith('http')) {
                          try {
                            await API.delete(`/uploads/files/${avatarKey}`);
                          } catch (err) {
                            console.error("Failed to delete temporary S3 avatar:", err);
                          }
                        }
                        setAvatarPreview(null);
                        setAvatarKey(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Input Forms Grid */}
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`mb-2 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className={`h-10 w-full border rounded-xl px-3 py-2 text-sm focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none ${
                        isDark ? 'border-slate-800 bg-[#0C101B] text-slate-200 placeholder-slate-650' : 'border-slate-200 bg-white text-slate-850 placeholder-slate-400'
                      }`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className={`mb-2 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className={`cursor-not-allowed h-10 w-full border rounded-xl px-3 py-2 text-sm outline-none ${
                        isDark ? 'border-slate-800 bg-[#0C101B]/40 text-slate-500' : 'border-slate-200 bg-slate-100/50 text-slate-500'
                      }`}
                      title="Email address cannot be changed"
                    />
                  </div>


                </div>

                {/* Submit action block */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || (fullname.trim() === initialFullname.trim() && avatarKey === initialAvatarKey)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: NOTIFICATIONS CARD */}
            <div className={`border rounded-2xl p-6 shadow-xs ${
              isDark ? 'border-slate-800 bg-[#121622]' : 'border-slate-200/80 bg-white'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Notifications
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Decide when and how you want to be notified.
                </p>
              </div>

              {/* Toggles row listing */}
              <div className="mt-6 space-y-5">
                
                {/* Switch 1: Task Assigned */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Task assigned to you
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                      Get a ping when someone assigns you a task.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('taskAssigned')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.taskAssigned ? 'bg-indigo-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifications.taskAssigned ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch 2: Comments & Mentions */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Comments & mentions
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                      Be notified when teammates mention you.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('commentsMentions')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.commentsMentions ? 'bg-indigo-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifications.commentsMentions ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch 3: Due Date Reminders */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Due date reminders
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                      Be notified when your tasks are due soon or overdue.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('dueReminders')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.dueReminders ? 'bg-indigo-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifications.dueReminders ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
