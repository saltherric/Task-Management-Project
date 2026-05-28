const { createProject: createProjectService } = require("../services/projectService");

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

module.exports = { createProject };