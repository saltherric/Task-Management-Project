const { response } = require("express");
const Workspace = require("../models/Workspace");
const { createProject: createProjectService, getProjects: getProjectsService} = require("../services/projectService");

const createProject = async (req, res, next) => {
  try {
    const project = await createProjectService({
      projectData: req.body,
      user: req.user,
    });
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

module.exports = { createProject, getProjects};