const readStoredUserInfo = () => {
  try {
    const rawUserInfo = localStorage.getItem('userInfo');
    return rawUserInfo ? JSON.parse(rawUserInfo) : null;
  } catch {
    return null;
  }
};

export const getStoredUserInfo = () => readStoredUserInfo();

export const getAuthToken = () => readStoredUserInfo()?.token || '';

export const getAuthHeaders = () => {
  const token = getAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getAuthState = () => {
  const userInfo = readStoredUserInfo();

  return {
    currentUser: userInfo,
    isAuthenticated: Boolean(userInfo?.token),
  };
};