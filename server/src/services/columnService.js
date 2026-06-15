import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Column from "../models/Column.js";

const getColumns = async ({projectId, user}) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw new Error("Project not found");
    }

    const workspace = await Workspace.findOne({
        _id: project.workspace,
        "members.user": user._id,
    });

    if (!workspace) {
        throw new Error("Access denied");
    }

    return Column.find({
        project: projectId,
    }).sort({ position: 1 });
};

export { getColumns };