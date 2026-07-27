const { authenticateSocket } = require("./socketAuth");
const Workspace = require("../models/Workspace");
const Project = require("../models/Project"); // Import Project model to verify project access
const { getWorkspaceRoom, getProjectRoom } = require("./rooms");
const { generateSignedUrl } = require("../services/signedUrl");

// This helper function broadcasts the list of active users in a project to everyone in that project room
const broadcastActiveUsersInProject = async (io, projectId, disconnectingSocketId = null) => {
  const roomName = getProjectRoom(projectId);
  try {
    // Get all socket instances currently inside this project's room
    const sockets = await io.in(roomName).fetchSockets();

    // Use a Map to keep user IDs unique so if a user has multiple tabs open, we only count them once
    const activeUsersMap = new Map();

    for (const s of sockets) {
      // Skip the socket that is currently disconnecting
      if (s.id === disconnectingSocketId) {
        continue;
      }

      // If the socket has a user object attached, add the user information to our unique map
      if (s.user) {
        const uId = String(s.user._id);
        if (!activeUsersMap.has(uId)) {
          let signedAvatar = s.user.avatar;
          if (s.user.avatar && !s.user.avatar.startsWith('http') && !s.user.avatar.startsWith('data:')) {
            try {
              signedAvatar = await generateSignedUrl(s.user.avatar);
            } catch (err) {
              console.error("Failed to sign active user avatar:", err);
            }
          }
          activeUsersMap.set(uId, {
            _id: s.user._id,
            username: s.user.username,
            email: s.user.email,
            avatar: signedAvatar,
          });
        }
      }
    }

    // Convert the unique user map entries into an array of users
    const users = Array.from(activeUsersMap.values());

    // Broadcast the updated list of users to all users in this project room
    io.to(roomName).emit("project:active_users", { projectId, users });
  } catch (error) {
    console.error(`Failed to broadcast active users for project ${projectId}:`, error);
  }
};

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

    // Listen for when a user joins a project board
    socket.on("project:join", async ({ projectId }, ack) => {
      if (!projectId) {
        return ack?.({
          success: false,
          message: "projectId is required",
        });
      }

      try {
        // Fetch project to see what workspace it belongs to and check accessibility settings
        const project = await Project.findById(projectId).select("_id workspace visibility createdBy members");
        if (!project) {
          return ack?.({
            success: false,
            message: "Project not found",
          });
        }

        // Verify the user is a member of the project's workspace
        const workspace = await Workspace.findOne({
          _id: project.workspace,
          "members.user": socket.user._id,
        }).select("_id");

        if (!workspace) {
          return ack?.({
            success: false,
            message: "Access denied",
          });
        }

        // Check if the user is authorized to open the project (handles private projects check)
        const canAccessProject =
          project.visibility === "workspace" ||
          project.createdBy.toString() === socket.user._id.toString() ||
          (project.members || []).some((m) => m.user.toString() === socket.user._id.toString());

        if (project.visibility === "private" && !canAccessProject) {
          return ack?.({
            success: false,
            message: "Access denied",
          });
        }

        // If the socket was in a previous project room, leave it first
        const oldProjectId = socket.data.currentProject;
        if (oldProjectId) {
          socket.leave(getProjectRoom(oldProjectId));
          socket.data.currentProject = null;
          // Notify other users on the old board that this user left
          await broadcastActiveUsersInProject(io, oldProjectId);
        }

        // Join the new project room
        socket.join(getProjectRoom(projectId));
        socket.data.currentProject = projectId;

        console.log(`➡️ ${socket.user.username} joined project board ${projectId}`);

        ack?.({
          success: true,
          projectId,
        });

        // Notify everyone on the new board that this user joined
        await broadcastActiveUsersInProject(io, projectId);
      } catch (error) {
        console.error(error);
        ack?.({
          success: false,
          message: "Failed to join project room",
        });
      }
    });

    // Listen for when a user leaves a project board
    socket.on("project:leave", async ({ projectId }) => {
      if (!projectId) return;

      // Leave the project room
      socket.leave(getProjectRoom(projectId));

      // Clear the current active project tracking
      if (socket.data.currentProject === projectId) {
        socket.data.currentProject = null;
      }

      console.log(`↩️ ${socket.user.username} left project board ${projectId}`);

      // Broadcast updated active users list to the room
      await broadcastActiveUsersInProject(io, projectId);
    });

    socket.on("disconnect", async () => {
      console.log(`❌ ${socket.user.username} disconnected`);

      const user = connectedUsers.get(userId);

      if (!user) return;

      user.socketIds.delete(socket.id);

      if (user.socketIds.size === 0) {
        connectedUsers.delete(userId);
      }

      publishOnlineUsers();

      // If the user was active on a project board, broadcast their departure
      const projectId = socket.data.currentProject;
      if (projectId) {
        await broadcastActiveUsersInProject(io, projectId, socket.id);
      }
    });
  });
}

module.exports = { registerSocketHandlers };