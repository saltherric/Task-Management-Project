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

module.exports = {
  setSocketServer,
  emitToWorkspace,
};