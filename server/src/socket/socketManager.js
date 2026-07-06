const { authenticateSocket } = require("./socketAuth");
const Workspace = require("../models/Workspace");
const { getWorkspaceRoom } = require("./rooms");

function createOnlineUserSnapshot(connectedUsers) {
  return Array.from(connectedUsers.values()).map((user) => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
  }));
}

function registerSocketHandlers(io) {
  const connectedUsers = new Map();

  io.use(authenticateSocket);

  const publishOnlineUsers = () => {
    io.emit("online_users", createOnlineUserSnapshot(connectedUsers));
  };

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);

    console.log(`✅ ${socket.user.username} connected (${socket.id})`);

    const currentUser = connectedUsers.get(userId) || {
      id: userId,
      username: socket.user.username,
      avatar: socket.user.avatar,
      socketIds: new Set(),
    };

    currentUser.username = socket.user.username;
    currentUser.avatar = socket.user.avatar;
    currentUser.socketIds.add(socket.id);

    connectedUsers.set(userId, currentUser);

    publishOnlineUsers();

    socket.on("workspace:join", async ({ workspaceId }, ack) => {
      if (!workspaceId) {
        return ack?.({
          success: false,
          message: "workspaceId is required",
        });
      }

      try {
        const workspace = await Workspace.findOne({
          _id: workspaceId,
          "members.user": socket.user._id,
        }).select("_id");

        if (!workspace) {
          return ack?.({
            success: false,
            message: "Access denied",
          });
        }

        // Leave previous workspace if any
        if (socket.data.currentWorkspace) {
          socket.leave(getWorkspaceRoom(socket.data.currentWorkspace));

          console.log(
            `↩️ ${socket.user.username} left workspace ${socket.data.currentWorkspace}`
          );
        }

        socket.join(getWorkspaceRoom(workspaceId));
        socket.data.currentWorkspace = workspaceId;

        console.log(
          `➡️ ${socket.user.username} joined workspace ${workspaceId}`
        );

        ack?.({
          success: true,
          workspaceId,
        });
      } catch (error) {
        console.error(error);

        ack?.({
          success: false,
          message: "Failed to join workspace",
        });
      }
    });

    socket.on("workspace:leave", ({ workspaceId }) => {
      if (!workspaceId) return;

      socket.leave(getWorkspaceRoom(workspaceId));

      if (socket.data.currentWorkspace === workspaceId) {
        socket.data.currentWorkspace = null;
      }

      console.log(
        `↩️ ${socket.user.username} left workspace ${workspaceId}`
      );
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.user.username} disconnected`);

      const user = connectedUsers.get(userId);

      if (!user) return;

      user.socketIds.delete(socket.id);

      if (user.socketIds.size === 0) {
        connectedUsers.delete(userId);
      }

      publishOnlineUsers();
    });
  });
}

module.exports = { registerSocketHandlers };