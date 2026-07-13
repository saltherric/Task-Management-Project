const Project = require("../models/Project");
const Workspace = require("../models/Workspace");

const sameId = (left, right) => left?.toString() === right?.toString();

const getProjectForUser = async ({ projectId, userId }) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new Error("Project not found");
    }

    const workspaceMember = await Workspace.exists({
        _id: project.workspace,
        "members.user": userId,
    });
    if (!workspaceMember) {
        throw new Error("Access denied");
    }

    const canAccessPrivateProject =
        sameId(project.createdBy, userId) ||
        (project.members || []).some((member) => sameId(member.user, userId));

    if (project.visibility === "private" && !canAccessPrivateProject) {
        throw new Error("Access denied");
    }

    return project;
};

const assertCanManageProject = (project, userId) => {
    if (!sameId(project.createdBy, userId)) {
        throw new Error("Only the project creator can manage project access");
    }
};

module.exports = { getProjectForUser, assertCanManageProject, sameId };
