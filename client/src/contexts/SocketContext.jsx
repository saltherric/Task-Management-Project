import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createSocketConnection } from "../socket";
import { getSocketAccessToken } from "../services/socket/socketAuth";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const workspaceRoomRefs = useRef(new Map());
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const connectSocket = useCallback(() => {
    const token = getSocketAccessToken();

    if (!token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        workspaceRoomRefs.current.clear();
        setSocket(null);
        setIsConnected(false);
      }

      return;
    }

    // Avoid creating duplicate connections
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const nextSocket = createSocketConnection(token);

    socketRef.current = nextSocket;
    workspaceRoomRefs.current.clear();
    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      console.log("Socket connected:", nextSocket.id);
      setIsConnected(true);
    });

    nextSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    nextSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    nextSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    nextSocket.connect();
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      workspaceRoomRefs.current.clear();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }
  }, []);

  const joinWorkspace = useCallback((workspaceId) => {
    return new Promise((resolve) => {
      const activeSocket = socketRef.current;
      const roomKey = String(workspaceId || "");

      if (!activeSocket || !roomKey) {
        resolve({ success: false, message: "Socket not connected" });
        return;
      }

      const currentRefs = workspaceRoomRefs.current.get(roomKey) || 0;

      if (currentRefs > 0) {
        workspaceRoomRefs.current.set(roomKey, currentRefs + 1);
        resolve({ success: true });
        return;
      }

      workspaceRoomRefs.current.set(roomKey, 1);

      activeSocket.emit("workspace:join", { workspaceId }, (response) => {
        if (response?.success === false) {
          workspaceRoomRefs.current.delete(roomKey);
        }

        resolve(response || { success: false, message: "No response" });
      });
    });
  }, []);

  const leaveWorkspace = useCallback((workspaceId) => {
    const activeSocket = socketRef.current;
    const roomKey = String(workspaceId || "");

    if (!activeSocket || !roomKey) return;

    const currentRefs = workspaceRoomRefs.current.get(roomKey) || 0;

    if (currentRefs > 1) {
      workspaceRoomRefs.current.set(roomKey, currentRefs - 1);
      return;
    }

    workspaceRoomRefs.current.delete(roomKey);
    activeSocket.emit("workspace:leave", { workspaceId });
  }, []);

  useEffect(() => {
    // Connect immediately if token already exists (e.g. page refresh while logged in)
    let shouldConnect = true;
    queueMicrotask(() => {
      if (shouldConnect) {
        connectSocket();
      }
    });

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
      shouldConnect = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-login", connectSocket);
      window.removeEventListener("auth-logout", disconnectSocket);
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  const value = {
    socket,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
