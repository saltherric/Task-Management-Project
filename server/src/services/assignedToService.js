const Project = require("../models/Project");
const Task = require("../models/Task")
const Workspace = require("../models/Workspace");
const { createNotification } = require("./notificationService");
const User = require("../models/User");
const { emitToWorkspace } = require("../socket/socketGateway");

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
};

const assignUser = async ({ taskId, userId, currentUserId }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project);

    if (!project) {
        throw new Error("Project not found");
    }

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const isWorkspaceMember = workspace.members.some(
        member => member.user.toString() === userId.toString()
    );

    if (!isWorkspaceMember) {
        throw new Error("User is not a workspace member");
    }

    await Task.findByIdAndUpdate(
        taskId,
        {
            $addToSet: {
                assignedTo: userId,
            },
        },
        {
            new: true,
        }
    );

    const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name");

    const sender = await User.findById(currentUserId).select("username");

    await createNotification({
        recipient: userId,
        sender: currentUserId,
        workspace: workspace._id,
        project: project._id,
        task: updatedTask._id,
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: `${sender.username} assigned you to "${updatedTask.title}".`,
        actionUrl: `/tasks/${updatedTask._id}`,
    });

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: updatedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: currentUserId.toString(),
        }
    );

    return updatedTask;
};

const removeAssignee = async ({ taskId, userId, currentUserId }) => {
    const task = await Task.findById(taskId);
    const project = await Project.findById(task.project);
    const workspace = await Workspace.findById(project.workspace);
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $pull: {
          assignedTo: userId,
        },
      },
      {
        new: true,  
      }
    )
    .populate("assignedTo", "username email")
    .populate("project", "name");

    const sender = await User.findById(currentUserId).select("username");
    await createNotification({
        recipient: userId,
        sender: currentUserId,
        workspace: workspace._id,
        project: project._id,
        task: taskId,  
        type: "TASK_UNASSIGNED",
        title: "Task Unassigned",
        message: `${sender.username} removed you from "${task.title}".`,
        actionUrl: `/tasks/${taskId}`,
    });

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: updatedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: currentUserId.toString(),
        }
    );

  return updatedTask;
};

module.exports = {
    getAvailableAssignees,
    removeAssignee,
    assignUser
};