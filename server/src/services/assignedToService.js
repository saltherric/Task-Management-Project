const Project = require("../models/Project");
const Task = require("../models/Task")
const Workspace = require("../models/Workspace");

const getAvailableAssignees = async (taskId) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    
    const project = await Project.findById(task.project);
    if (!project) {
        throw new Error("Project not found");
    }

    const workspace = await Workspace.findById(project.workspace)
        .populate(
            "members.user", "username email"
        );
    
    return workspace.members.map(
        member => member.user
    );
}

const assignUser = async ({ taskId, userId }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project);

    const workspace = await Workspace.findById(project.workspace);

    const isWorkspaceMember = workspace.members.some(
        member => member.user.toString() === userId.toString()
    );
    if (!isWorkspaceMember) {
        throw new Error("User is not a workspace member")
    }

    const updateTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $addToSet: {
                assignedTo: userId
            },
        },
        {
            new: true,
        }
    )
    .populate(
        "assignedTo", "username email"
    );

    return updateTask;
}

const removeAssignee = async ({ taskId, userId }) => {
    const updateTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $pull: {
                assignedTo: userId
            },
        },
        {
            new: true,
        }
    )
    .populate(
        "assignedTo", "username email"
    );
    return updateTask;
}

module.exports = {
    getAvailableAssignees,
    removeAssignee,
    assignUser
};