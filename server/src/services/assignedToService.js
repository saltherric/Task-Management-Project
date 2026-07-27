const Project = require("../models/Project");
const Task = require("../models/Task")
const Workspace = require("../models/Workspace");
const { createNotification } = require("./notificationService");
const User = require("../models/User");
const { emitToWorkspace } = require("../socket/socketGateway");
const { getProjectForUser } = require("./projectAccessService");
const { generateSignedUrl } = require("./signedUrl");

const signUserAvatar = async (user) => {
    if (!user) return user;
    const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
    if (userObj.avatar && !userObj.avatar.startsWith('http') && !userObj.avatar.startsWith('data:')) {
        try {
            userObj.avatar = await generateSignedUrl(userObj.avatar);
        } catch (err) {
            console.error("Failed to sign user avatar:", err);
        }
    }
    return userObj;
};

const signTaskAvatars = async (task) => {
    if (!task) return task;
    const taskObj = typeof task.toObject === 'function' ? task.toObject() : task;

    if (taskObj.createdBy) taskObj.createdBy = await signUserAvatar(taskObj.createdBy);
    if (taskObj.completedBy) taskObj.completedBy = await signUserAvatar(taskObj.completedBy);
    if (taskObj.updatedBy) taskObj.updatedBy = await signUserAvatar(taskObj.updatedBy);
    if (taskObj.lastMovedBy) taskObj.lastMovedBy = await signUserAvatar(taskObj.lastMovedBy);

    if (taskObj.assignedTo && taskObj.assignedTo.length > 0) {
        taskObj.assignedTo = await Promise.all(taskObj.assignedTo.map(signUserAvatar));
    }

    return taskObj;
};

const getAvailableAssignees = async (taskId, currentUserId) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    
    const project = await getProjectForUser({ projectId: task.project, userId: currentUserId });

    const workspace = await Workspace.findById(project.workspace)
        .populate(
            "members.user", "username email avatar"
        );
    
    let assignees = [];
    if (project.visibility === "private") {
        const allowedIds = new Set([
            project.createdBy.toString(),
            ...(project.members || []).map((member) => member.user.toString()),
        ]);
        assignees = workspace.members
            .map((member) => member.user)
            .filter((member) => member && allowedIds.has(member._id.toString()));
    } else {
        assignees = workspace.members.map((member) => member.user).filter(Boolean);
    }

    return Promise.all(assignees.map(signUserAvatar));
};

const assignUser = async ({ taskId, userId, currentUserId }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId: currentUserId });

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === currentUserId.toString()
    );
    const userObj = await User.findById(currentUserId);
    const isAdmin = (member && member.role === "admin") || (userObj && userObj.role === "admin");

    if (!isAdmin) {
        throw new Error("Access Denied: Only admins can assign or reassign users");
    }

    const isWorkspaceMember = workspace.members.some(
        member => member.user.toString() === userId.toString()
    );

    if (!isWorkspaceMember) {
        throw new Error("User is not a workspace member");
    }
    if (
        project.visibility === "private" &&
        project.createdBy.toString() !== userId.toString() &&
        !(project.members || []).some((member) => member.user.toString() === userId.toString())
    ) {
        throw new Error("User does not have access to this private project");
    }

    await Task.findByIdAndUpdate(
        taskId,
        {
            $addToSet: {
                assignedTo: userId,
            },
            $set: {
                updatedBy: currentUserId,
            }
        },
        {
            new: true,
        }
    );

    const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar");

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

    const signedTask = await signTaskAvatars(updatedTask);

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: currentUserId.toString(),
        }
    );

    return signedTask;
};

const removeAssignee = async ({ taskId, userId, currentUserId }) => {
    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found");
    const project = await getProjectForUser({ projectId: task.project, userId: currentUserId });
    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === currentUserId.toString()
    );
    const userObj = await User.findById(currentUserId);
    const isAdmin = (member && member.role === "admin") || (userObj && userObj.role === "admin");

    if (!isAdmin) {
        throw new Error("Access Denied: Only admins can assign or reassign users");
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $pull: {
          assignedTo: userId,
        },
        $set: {
          updatedBy: currentUserId,
        }
      },
      {
        new: true,  
      }
    )
    .populate("createdBy", "username email avatar")
    .populate("assignedTo", "username email avatar")
    .populate("column", "name")
    .populate("project", "name")
    .populate("completedBy", "username email avatar")
    .populate("updatedBy", "username email avatar")
    .populate("lastMovedBy", "username email avatar");

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

    const signedTask = await signTaskAvatars(updatedTask);

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: currentUserId.toString(),
        }
    );

  return signedTask;
};

module.exports = {
    getAvailableAssignees,
    removeAssignee,
    assignUser
};
