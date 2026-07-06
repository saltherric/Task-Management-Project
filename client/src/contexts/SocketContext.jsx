import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createSocketConnection } from "../socket";
import { getSocketAccessToken } from "../services/socket/socketAuth";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const connectSocket = useCallback(() => {
    const token = getSocketAccessToken();

    if (!token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }

      return;
    }

    // Avoid creating duplicate connections
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = createSocketConnection(token);

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.connect();
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
    }
  }, []);

  const joinWorkspace = useCallback((workspaceId) => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, message: "Socket not connected" });
        return;
      }

      socketRef.current.emit("workspace:join", { workspaceId }, (response) => {
        resolve(response || { success: false, message: "No response" });
      });
    });
  }, []);

  const leaveWorkspace = useCallback((workspaceId) => {
    if (!socketRef.current) return;
    socketRef.current.emit("workspace:leave", { workspaceId });
  }, []);

  useEffect(() => {
    // Connect immediately if token already exists (e.g. page refresh while logged in)
    connectSocket();

    // Listen for login/logout dispatched from other tabs (storage event)
    const handleStorageChange = (e) => {
      if (e.key === "userInfo") {
        if (e.newValue) {
          connectSocket();
        } else {
          disconnectSocket();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom in-tab login/logout events (see note below)
    window.addEventListener("auth-login", connectSocket);
    window.addEventListener("auth-logout", disconnectSocket);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-login", connectSocket);
      window.removeEventListener("auth-logout", disconnectSocket);
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    joinWorkspace,
    leaveWorkspace,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}