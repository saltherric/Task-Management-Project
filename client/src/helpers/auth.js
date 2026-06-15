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

export {
  getStoredUserInfo,
  getAuthToken,
  getAuthHeaders,
  getAuthState
}