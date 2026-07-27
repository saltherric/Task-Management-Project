// This function returns the room name for a workspace
function getWorkspaceRoom(workspaceId) {
  return `workspace:${workspaceId}`;
}

// This function returns the room name for a project
function getProjectRoom(projectId) {
  return `project:${projectId}`;
}

// Export the functions so other files can use them
module.exports = { getWorkspaceRoom, getProjectRoom };