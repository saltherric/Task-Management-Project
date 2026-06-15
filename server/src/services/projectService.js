const Project = require ("../models/Project");
const Column = require ("../models/Column");
const Workspace = require ("../models/Workspace");

const createProject = async ({ projectData, user}) => {
    const workspace = await Workspace.findOne({
        _id: projectData.workspace,
        "members.user": user._id,
    });

    if (!workspace) {
        throw new Error("Workspace not found or access denied");
    }

    const project = await Project.create({
        workspace: projectData.workspace,
        name: projectData.name,
        description: projectData.description,
        createdBy: user._id,
        visibility: projectData.visibility,
        sprintEndDate: projectData.sprintEndDate
    });
    
    //defaul column
    const defaultColumns = [
        {
            project: project._id,
            name: "To Do",
            position: 0
        },
        {
            project: project._id,
            name: "In Progress",
            position: 1
        },
        {
            project: project._id,
            name: "Review",
            position: 2
        },
        {
            project: project._id,
            name: "Done",
            position: 3
        }
    ];
    await Column.insertMany(defaultColumns);
    return project;
}

const getProjects = async ({workspaceId, user}) => {
    const workspace = await Workspace.findOne({
        _id: workspaceId,
        "members.user": user._id,
    });

    if (!workspace) {
        throw new Error("Workspace not found or access denied");
    }

    const projects = await Project.find({
        workspace: workspaceId,
        isArchived: false,
    })
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 });

    return projects;
};
module.exports = { createProject, getProjects };