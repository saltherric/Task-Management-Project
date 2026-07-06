const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const connectDB = require("./config/db.js");
const app = require("./app.js");
const { Server } = require("socket.io");
const { registerSocketHandlers } = require("./socket/socketManager");
const { setSocketServer } = require("./socket/socketGateway");
const { initializeTelegramBot } = require("./services/telegramBotService");

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;

// 1. Create HTTP server first
const server = http.createServer(app);

console.log("Creating Socket.IO server...");

// 2. Now attach Socket.io to it
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

setSocketServer(io);
registerSocketHandlers(io);

console.log("Socket handlers registered.");

// 4. Start listening
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT.`);
    return process.exit(1);
  }

  throw error;
});

const startServer = async () => {
  await connectDB();
  await initializeTelegramBot();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
