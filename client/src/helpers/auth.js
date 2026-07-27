const readStoredUserInfo = () => {
  try {
    const rawUserInfo = localStorage.getItem('userInfo');
    return rawUserInfo ? JSON.parse(rawUserInfo) : null;
  } catch {
    return null;
  }
};

const getStoredUserInfo = () => readStoredUserInfo();

const getAuthToken = () => readStoredUserInfo()?.token || '';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const getAuthState = () => {
  const userInfo = readStoredUserInfo();
  return {
    currentUser: userInfo,
    isAuthenticated: Boolean(userInfo?.token),
  };
};

// This helper function updates the user's name in local storage without breaking other login details
const updateStoredUserInfo = (updatedUser) => {
  try {
    const rawUserInfo = localStorage.getItem('userInfo');
    if (rawUserInfo) {
      const current = JSON.parse(rawUserInfo);
      // Merge the existing details with updated ones (like the name/username)
      const next = { ...current, ...updatedUser };
      localStorage.setItem('userInfo', JSON.stringify(next));
    }
  } catch (e) {
    console.error("Failed to update stored user info in localStorage:", e);
  }
};

export {
  getStoredUserInfo,
  getAuthToken,
  getAuthHeaders,
  getAuthState,
  updateStoredUserInfo
}