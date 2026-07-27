const Project = require ("../models/Project");
const Column = require ("../models/Column");
const Workspace = require ("../models/Workspace");
const User = require("../models/User");
const Task = require("../models/Task");
const Attachment = require("../models/Attachment");
const Comment = require("../models/Comment");
const { deleteFile } = require("./uploadFile");
const { getProjectForUser, assertCanManageProject, sameId } = require("./projectAccessService");
const { logActivity } = require("./activityService");


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

    try {
        await logActivity({
            actor: user._id,
            type: "project_created",
            targetType: "Project",
            targetId: project._id,
            targetTitle: project.name,
            workspace: project.workspace,
            project: project._id,
        });
    } catch (activityError) {
        console.error("Failed to log project creation activity:", activityError);
    }
    
    // Default columns for every new project.
    const defaultColumns = [
        {
            project: project._id,
            name: "To Do",
            position: 0,
            color: "#94a3b8"
        },
        {
            project: project._id,
            name: "In Progress",
            position: 1,
            color: "#4B28FA"
        },
        {
            project: project._id,
            name: "Review",
            position: 2,
            color: "#f59e0b"
        },
        {
            project: project._id,
            name: "Done",
            position: 3,
            color: "#10b981"
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
    return await project.populate([
        { path: "createdBy", select: "username email" },
        { path: "members.user", select: "username email avatar" }
    ]);
};

const removeProjectMember = async ({ projectId, userId, requesterId }) => {
    const project = await getProjectForUser({ projectId, userId: requesterId });
    assertCanManageProject(project, requesterId);
    project.members = (project.members || []).filter((member) => !sameId(member.user, userId));
    await project.save();
    return await project.populate([
        { path: "createdBy", select: "username email" },
        { path: "members.user", select: "username email avatar" }
    ]);
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
    return await project.populate([
        { path: "createdBy", select: "username email" },
        { path: "members.user", select: "username email avatar" }
    ]);
};

const copyProject = async ({ projectId, user }) => {
    const sourceProject = await getProjectForUser({ projectId, userId: user._id });
    if (!sourceProject) {
        throw new Error("Project not found or access denied");
    }

    const newProject = await Project.create({
        workspace: sourceProject.workspace,
        name: `${sourceProject.name} (copy)`,
        description: sourceProject.description,
        createdBy: user._id,
        visibility: sourceProject.visibility || "workspace",
        members: sourceProject.members.map(m => ({ user: m.user, role: m.role, invitedBy: user._id }))
    });

    try {
        await logActivity({
            actor: user._id,
            type: "project_created",
            targetType: "Project",
            targetId: newProject._id,
            targetTitle: newProject.name,
            workspace: newProject.workspace,
            project: newProject._id,
        });
    } catch (activityError) {
        console.error("Failed to log project copy activity:", activityError);
    }

    const sourceColumns = await Column.find({ project: projectId }).sort({ position: 1 });
    
    for (const sourceCol of sourceColumns) {
        const newCol = await Column.create({
            project: newProject._id,
            name: sourceCol.name,
            position: sourceCol.position,
            color: sourceCol.color
        });

        const sourceTasks = await Task.find({ column: sourceCol._id, isArchived: false }).sort({ position: 1 });
        
        for (const sourceTask of sourceTasks) {
            await Task.create({
                project: newProject._id,
                column: newCol._id,
                title: sourceTask.title,
                description: sourceTask.description,
                status: sourceTask.status,
                priority: sourceTask.priority,
                dueDate: sourceTask.dueDate,
                assignedTo: sourceTask.assignedTo,
                createdBy: user._id,
                isArchived: false
            });
        }
    }

    return await newProject.populate([
        { path: "createdBy", select: "username email" },
        { path: "members.user", select: "username email avatar" }
    ]);
};

const deleteProject = async ({ projectId, user }) => {
    const project = await getProjectForUser({ projectId, userId: user._id });
    assertCanManageProject(project, user._id);

    const workspaceId = project.workspace;

    // Find all tasks in the project to get their IDs
    const tasks = await Task.find({ project: projectId }).select("_id");
    const taskIds = tasks.map(t => t._id);

    // Find and delete all attachments from S3 and database
    const attachments = await Attachment.find({ task: { $in: taskIds } });
    for (const attachment of attachments) {
        try {
            await deleteFile(attachment.fileKey);
        } catch (s3Error) {
            console.error(`Failed to delete S3 file for attachment ${attachment._id}:`, s3Error);
        }
    }
    await Attachment.deleteMany({ task: { $in: taskIds } });

    // Delete all comments of the tasks
    await Comment.deleteMany({ task: { $in: taskIds } });

    // Delete all tasks in the project
    await Task.deleteMany({ project: projectId });

    // Delete all columns in the project
    await Column.deleteMany({ project: projectId });

    // Log the activity before deleting the project from database (so project metadata is referenced)
    try {
        await logActivity({
            actor: user._id,
            type: "project_deleted",
            targetType: "Project",
            targetId: project._id,
            targetTitle: project.name,
            workspace: workspaceId,
        });
    } catch (activityError) {
        console.error("Failed to log project deletion activity:", activityError);
    }

    // Delete the project itself
    await Project.findByIdAndDelete(projectId);

    return {
        projectId,
        workspaceId,
    };
};

module.exports = { createProject, getProjects, inviteProjectMember, removeProjectMember, updateProject, copyProject, deleteProject };

