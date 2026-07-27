const Workspace = require("../models/Workspace");
const { emitToWorkspace } = require("../socket/socketGateway");
const { 
  createProject: createProjectService, 
  getProjects: getProjectsService,
  inviteProjectMember: inviteProjectMemberService, 
  removeProjectMember: removeProjectMemberService, 
  updateProject: updateProjectService,
  copyProject: copyProjectService,
  deleteProject: deleteProjectService
} = require("../services/projectService");


const createProject = async (req, res, next) => {
  try {
    const project = await createProjectService({
      projectData: req.body,
      user: req.user,
    });
    emitToWorkspace(project.workspace, "project:updated", { project });
    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error)
  }
}

const getProjects = async (req, res, next) => {
  try {
    const projects = await getProjectsService({
      workspaceId: req.params.workspaceId,
      user: req.user,
    })
    res.status(200).json({
      success: true,
      projects,
    })
  } catch (error) {
    next(error);
  }
}

const inviteProjectMember = async (req, res, next) => {
  try {
    const project = await inviteProjectMemberService({
      projectId: req.params.projectId,
      userId: req.body.userId,
      requesterId: req.user._id,
    });
    emitToWorkspace(project.workspace, "project:updated", { project });
    res.status(200).json({ success: true, project });
  } catch (error) { 
    next(error); 
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const project = await removeProjectMemberService({
      projectId: req.params.projectId,
      userId: req.params.userId,
      requesterId: req.user._id,
    });
    emitToWorkspace(project.workspace, "project:updated", { project });
    res.status(200).json({ success: true, project });
  } catch (error) { 
    next(error); 
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await updateProjectService({
      projectId: req.params.projectId,
      projectData: req.body,
      user: req.user,
    });
    emitToWorkspace(project.workspace, "project:updated", { project });
    res.status(200).json({ success: true, project });
  } catch (error) { 
    next(error); 
  }
};

const copyProject = async (req, res, next) => {
  try {
    const project = await copyProjectService({
      projectId: req.params.projectId,
      user: req.user,
    });
    emitToWorkspace(project.workspace, "project:updated", { project });
    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await deleteProjectService({
      projectId: req.params.projectId,
      user: req.user,
    });
    emitToWorkspace(result.workspaceId, "project:deleted", {
      projectId: result.projectId,
      workspaceId: result.workspaceId,
    });
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createProject, 
  getProjects, 
  inviteProjectMember, 
  removeProjectMember, 
  updateProject,
  copyProject,
  deleteProject
};