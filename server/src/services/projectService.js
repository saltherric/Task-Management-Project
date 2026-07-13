const Project = require ("../models/Project");
const Column = require ("../models/Column");
const Workspace = require ("../models/Workspace");
const User = require("../models/User");
const { getProjectForUser, assertCanManageProject, sameId } = require("./projectAccessService");

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
        visibility: projectData.visibility || "workspace",
        sprintEndDate: projectData.sprintEndDate
    });
    
    // Default columns for every new project.
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
        $or: [
            { visibility: "workspace" },
            { createdBy: user._id },
            { "members.user": user._id },
        ],
    })
        .populate("createdBy", "username email")
        .populate("members.user", "username email avatar")
        .sort({ createdAt: -1 });

    return projects;
};

const inviteProjectMember = async ({ projectId, userId, requesterId }) => {
    const project = await getProjectForUser({ projectId, userId: requesterId });
    assertCanManageProject(project, requesterId);

    if (sameId(project.createdBy, userId)) {
        throw new Error("The project creator already has access");
    }

    const [user, workspaceMember] = await Promise.all([
        User.exists({ _id: userId }),
        Workspace.exists({ _id: project.workspace, "members.user": userId }),
    ]);
    if (!user) throw new Error("User not found");
    if (!workspaceMember) throw new Error("User must be a member of this workspace");

    if (!(project.members || []).some((member) => sameId(member.user, userId))) {
        project.members.push({ user: userId, invitedBy: requesterId });
        await project.save();
    }
    return project.populate("createdBy", "username email").populate("members.user", "username email avatar");
};

const removeProjectMember = async ({ projectId, userId, requesterId }) => {
    const project = await getProjectForUser({ projectId, userId: requesterId });
    assertCanManageProject(project, requesterId);
    project.members = (project.members || []).filter((member) => !sameId(member.user, userId));
    await project.save();
    return project.populate("createdBy", "username email").populate("members.user", "username email avatar");
};

const updateProject = async ({ projectId, projectData, user }) => {
    const project = await getProjectForUser({ projectId, userId: user._id });
    assertCanManageProject(project, user._id);

    if (projectData.name !== undefined) {
        if (!projectData.name.trim()) throw new Error("Project name cannot be empty");
        project.name = projectData.name;
    }
    if (projectData.description !== undefined) {
        project.description = projectData.description;
    }
    if (projectData.visibility !== undefined) {
        project.visibility = projectData.visibility;
    }

    await project.save();
    return project.populate("createdBy", "username email").populate("members.user", "username email avatar");
};

module.exports = { createProject, getProjects, inviteProjectMember, removeProjectMember, updateProject };
