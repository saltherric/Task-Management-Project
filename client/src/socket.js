import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:5000";                                                           

function  createSocketConnection(token) {
  return io(SERVER_URL, {
    withCredentials: true,
    autoConnect: false,
    auth: { token },
    transports: ["websocket"],
  });
}

export { SERVER_URL, createSocketConnection };