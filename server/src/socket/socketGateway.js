const { getWorkspaceRoom } = require("./rooms");

let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToWorkspace(workspaceId, eventName, payload) {
  if (!ioInstance || !workspaceId) {
    return;
  }

  ioInstance.to(getWorkspaceRoom(workspaceId)).emit(eventName, payload);
}

async function updateUserSockets(userId, updatedUserData) {
  if (!ioInstance || !userId) return;

  try {
    const sockets = await ioInstance.fetchSockets();
    const projectsToBroadcast = new Set();

    for (const s of sockets) {
      if (s.user && String(s.user._id) === String(userId)) {
        s.user.avatar = updatedUserData.avatar;
        s.user.username = updatedUserData.username || s.user.username;
        if (s.data && s.data.currentProject) {
          projectsToBroadcast.add(s.data.currentProject);
        }
      }
    }

    const { updateConnectedUser, broadcastActiveUsersInProject } = require("./socketManager");
    updateConnectedUser(userId, updatedUserData);

    if (projectsToBroadcast.size > 0) {
      for (const projectId of projectsToBroadcast) {
        await broadcastActiveUsersInProject(ioInstance, projectId);
      }
    }
  } catch (err) {
    console.error("Failed to update user sockets:", err);
  }
}

module.exports = {
  setSocketServer,
  emitToWorkspace,
  updateUserSockets,
};