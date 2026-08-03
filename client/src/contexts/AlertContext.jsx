import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  // Check for any pending alerts from localStorage when the provider mounts
  useEffect(() => {
    try {
      const pendingAlert = localStorage.getItem('pendingAlert');
      if (pendingAlert) {
        setAlert(JSON.parse(pendingAlert));
        localStorage.removeItem('pendingAlert');
      }
    } catch (e) {
      console.error('Failed to parse pending alert:', e);
    }
  }, []);

  // Handle auto-dismissal
  useEffect(() => {
    if (!alert) return;

    const timerId = setTimeout(() => {
      setAlert(null);
    }, 3000);

    return () => clearTimeout(timerId);
  }, [alert]);

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
      {alert && <Alert alert={alert} onClose={hideAlert} />}
    </AlertContext.Provider>
  );
}

export default AlertProvider;
