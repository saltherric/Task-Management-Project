const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const calculateSmartPriority = require("../utils/calculateSmartPriority");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const Column = require("../models/Column");
const { emitToWorkspace } = require("../socket/socketGateway");
const { getProjectForUser } = require("./projectAccessService");
const { logActivity } = require("./activityService");
const { generateSignedUrl } = require("./signedUrl");

const signTaskAvatars = async (task) => {
    if (!task) return task;
    const taskObj = typeof task.toObject === 'function' ? task.toObject() : task;

    const signUserAvatar = async (user) => {
        if (user && user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
            try {
                user.avatar = await generateSignedUrl(user.avatar);
            } catch (err) {
                console.error("Failed to sign user avatar in task:", err);
            }
        }
    };

    if (taskObj.createdBy) await signUserAvatar(taskObj.createdBy);
    if (taskObj.completedBy) await signUserAvatar(taskObj.completedBy);
    if (taskObj.updatedBy) await signUserAvatar(taskObj.updatedBy);
    if (taskObj.lastMovedBy) await signUserAvatar(taskObj.lastMovedBy);

    if (taskObj.assignedTo && taskObj.assignedTo.length > 0) {
        for (let user of taskObj.assignedTo) {
            await signUserAvatar(user);
        }
    }

    return taskObj;
};

const canAccessProject = (project, userId) =>
    project.visibility === "workspace" ||
    project.createdBy.toString() === userId.toString() ||
    (project.members || []).some((member) => member.user.toString() === userId.toString());

const mapColumnNameToStatus = (columnName) => {
    const name = columnName?.trim().toLowerCase();
    if (name === "done") return "done";
    if (name === "review") return "review";
    if (name === "in progress") return "inprogress";
    return "todo";
};

const mapStatusToColumnName = (status) => {
    switch (status) {
        case "todo":
            return "to do";
        case "inprogress":
            return "in progress";
        case "review":
            return "review";
        case "done":
            return "done";
        default:
            return "to do";
    }
};

const createTask = async ({ taskData, user, project, column }) => {
    const smartPriorityScore = calculateSmartPriority(taskData.priority, taskData.dueDate);
    // get last task position
    const lastTask = await Task.findOne({
        column: column._id
    })
        .sort('-position')
        .select('position');

    // calculate next position
    const position = lastTask
        ? lastTask.position + 1
        : 1;

    // validate member in workspace 
    if (taskData.assignedTo && taskData.assignedTo.length > 0) {
        // get workspace from project
        const workspace = await Workspace.findById(project.workspace);

        const member = workspace.members.find(
            (m) => m.user.toString() === user._id.toString()
        );
        const isAdmin = (member && member.role === "admin");
        if (!isAdmin) {
            throw new Error("Access Denied: Only admins can assign users to tasks");
        }
        for (const userId of taskData.assignedTo) {
            // validate user exists
            const user = await User.findById(userId);
            if (!user) {
                throw new Error(
                    'Assigned user not found'
                );
            }

            // validate workspace membership
            const isMember = workspace.members.some(
                member => member.user.toString() === userId.toString()
            );

            if (!isMember) {
                throw new Error('Assigned user is not workspace member');
            }
            if (!canAccessProject(project, userId)) {
                throw new Error('Assigned user does not have access to this private project');
            }
        }
    }

    const calculatedStatus = taskData.status || mapColumnNameToStatus(column.name);
    const completedAt = calculatedStatus === "done" ? new Date() : null;

    const task = await Task.create({
        title: taskData.title,
        description: taskData.description,
        project: taskData.project,
        column: taskData.column,
        createdBy: user._id,
        assignedTo: taskData.assignedTo,
        status: calculatedStatus,
        completedAt,
        priority: taskData.priority,
        smartPriorityScore,
        tags: taskData.tags,
        dueDate: taskData.dueDate,
        position,
    });

    await task.populate([
        { path: "project", select: "name" },
        { path: "column", select: "name" },
        { path: "createdBy", select: "username email avatar" },
        { path: "assignedTo", select: "username email avatar" },
    ]);

    try {
        await logActivity({
            actor: user._id,
            type: "task_created",
            targetType: "Task",
            targetId: task._id,
            targetTitle: task.title,
            workspace: project.workspace,
            project: project._id,
        });
    } catch (activityError) {
        console.error("Failed to log task_created activity:", activityError);
    }

    const signedTask = await signTaskAvatars(task);

    emitToWorkspace(
        project.workspace.toString(),
        "task:created",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: user._id.toString(),
        }
    );

    return signedTask;
};

const getTasks = async (projectId, user) => {

    await getProjectForUser({ projectId, userId: user._id });

    const tasks = await Task.find({
        project: projectId,
        isArchived: false,
    })
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar")
        .sort({ position: 1 });

    return Promise.all(tasks.map(signTaskAvatars));
};

const updateTask = async ({ taskId, taskData, user }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId: user._id });
    const workspace = await Workspace.findById(project.workspace);

    const oldTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        status: task.status,
        tags: task.tags,
    };
    if (taskData.assignedTo) {
        const member = workspace.members.find(
            (m) => m.user.toString() === user._id.toString()
        );
        const isAdmin = (member && member.role === "admin");
        if (!isAdmin) {
            throw new Error("Access Denied: Only admins can assign or reassign users");
        }
        const workspaceMemberIds =
            workspace.members.map(
                member => member.user.toString()
            );

        for (const userId of taskData.assignedTo) {
            const assignedUser = await User.findById(userId);
            if (!assignedUser) {
                throw new Error(
                    "Assigned user not found"
                );
            }
            if (
                !workspaceMemberIds.includes(
                    userId.toString()
                )
            ) {
                throw new Error(
                    "Assigned user is not workspace member"
                );
            }
            if (!canAccessProject(project, userId)) {
                throw new Error("Assigned user does not have access to this private project");
            }
        }
    }

    const priority = taskData.priority || task.priority;
    const dueDate = taskData.dueDate || task.dueDate;
    task.smartPriorityScore = calculateSmartPriority(
        priority,
        dueDate
    );

    const oldStatus = task.status;

    task.title = taskData.title ?? task.title;
    task.description = taskData.description ?? task.description;
    task.priority = taskData.priority ?? task.priority;
    const oldAssignees = [...(task.assignedTo || [])];
    task.assignedTo = taskData.assignedTo ?? task.assignedTo;
    task.tags = taskData.tags ?? task.tags;
    task.dueDate = taskData.dueDate ?? task.dueDate;

    if (taskData.status && taskData.status !== oldStatus) {
        task.status = taskData.status;

        // Sync column
        const projectColumns = await Column.find({ project: task.project });
        const targetColName = mapStatusToColumnName(taskData.status);
        const matchingCol = projectColumns.find(
            col => col.name.trim().toLowerCase() === targetColName
        );
        if (matchingCol) {
            task.column = matchingCol._id;
        }

        // Sync completedAt and completedBy
        if (taskData.status === "done") {
            task.completedAt = new Date();
            task.completedBy = user._id;
        } else if (oldStatus === "done") {
            task.completedAt = null;
            task.completedBy = null;
        }

        // Sync startedAt
        if (taskData.status === "inprogress" && !task.startedAt) {
            task.startedAt = new Date();
        }
    }

    task.updatedBy = user._id;

    await task.save();

    const changes = [];

    const oldDueDate = oldTask.dueDate?.getTime() ?? null;
    const newDueDate = task.dueDate?.getTime() ?? null;

    if (oldTask.title !== task.title) changes.push("title");
    if (oldTask.description !== task.description) changes.push("description");
    if (oldTask.priority !== task.priority) changes.push("priority");
    if (
        JSON.stringify(oldTask.tags) !== JSON.stringify(task.tags)
    ) {
        changes.push("tags");
    }
    if (oldDueDate !== newDueDate) changes.push("due date");

    try {
        const isCompleted = taskData.status === "done" && oldStatus !== "done";
        const isAssignmentChanged = taskData.assignedTo && (
            oldAssignees.length !== task.assignedTo.length ||
            !oldAssignees.every(id => task.assignedTo.some(newId => newId.toString() === id.toString()))
        );

        if (isCompleted) {
            await logActivity({
                actor: user._id,
                type: "task_completed",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                workspace: workspace._id,
                project: project._id,
            });
        } else if (isAssignmentChanged && task.assignedTo.length > 0) {
            const addedAssignees = task.assignedTo.filter(id => !oldAssignees.some(oldId => oldId.toString() === id.toString()));
            const recipientId = addedAssignees.length > 0 ? addedAssignees[0] : task.assignedTo[0];
            await logActivity({
                actor: user._id,
                type: "task_assigned",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                recipient: recipientId,
                workspace: workspace._id,
                project: project._id,
            });
        } else if (taskData.status && taskData.status !== oldStatus) {
            await logActivity({
                actor: user._id,
                type: "status_changed",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                workspace: workspace._id,
                project: project._id,
                metadata: {
                    oldStatus,
                    newStatus: task.status,
                }
            });
        } else if (changes.length > 0) {
            await logActivity({
                actor: user._id,
                type: "task_updated",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                workspace: workspace._id,
                project: project._id,
                metadata: { changes }
            });
        }
    } catch (activityError) {
        console.error("Failed to log activity in updateTask:", activityError);
    }

    const sender = await User.findById(user._id)
        .select("username");

    if (changes.length > 0) {
        for (const assignee of task.assignedTo) {
            // Don't notify yourself
            if (assignee.toString() === user._id.toString()) {
                continue;
            }

            await createNotification({
                recipient: assignee,
                sender: user._id,
                workspace: workspace._id,
                project: project._id,
                task: task._id,

                type: "TASK_UPDATED",

                title: "Task Updated",

                message: `${sender.username} updated the ${changes.join(", ")} of "${task.title}".`,

                actionUrl: `/tasks/${task._id}`,
            });
        }
    }

    const populateTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar");

    const signedTask = await signTaskAvatars(populateTask);

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );
    return signedTask;
};

const deleteTask = async ({ taskId, user }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId: user._id });
    const workspace = await Workspace.findById(project.workspace);

    const member = workspace.members.find(
        member =>
            member.user.toString() === user._id.toString()
    );
    if (!member) {
        throw new Error("Access Denied");
    }

    if (
        member.role !== "admin" &&
        task.createdBy.toString() !== user._id.toString()
    ) {
        throw new Error("You do not have permission to delete this task");
    }

    await Task.findByIdAndDelete(taskId);
    emitToWorkspace(
        workspace._id.toString(),
        "task:deleted",
        {
            taskId: task._id.toString(),
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );

    return task;
};

const archiveTask = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId });

    task.isArchived = true;
    task.archivedAt = new Date();
    task.archivedBy = userId;

    await task.save();

    try {
        await logActivity({
            actor: userId,
            type: "task_updated",
            targetType: "Task",
            targetId: task._id,
            targetTitle: task.title,
            workspace: project.workspace,
            project: project._id,
            metadata: { archived: true }
        });
    } catch (activityError) {
        console.error("Failed to log task archive activity:", activityError);
    }

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar")
        .populate("archivedBy", "username email avatar");

    const signedTask = await signTaskAvatars(populatedTask);

    emitToWorkspace(
        project.workspace.toString(),
        "task:archived",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: userId.toString(),
        }
    );

    return signedTask;
};

const unarchiveTask = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId });

    task.isArchived = false;
    task.archivedAt = null;
    task.archivedBy = null;

    await task.save();

    try {
        await logActivity({
            actor: userId,
            type: "task_updated",
            targetType: "Task",
            targetId: task._id,
            targetTitle: task.title,
            workspace: project.workspace,
            project: project._id,
            metadata: { archived: false }
        });
    } catch (activityError) {
        console.error("Failed to log task unarchive activity:", activityError);
    }

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar")
        .populate("archivedBy", "username email avatar");

    const signedTask = await signTaskAvatars(populatedTask);

    emitToWorkspace(
        project.workspace.toString(),
        "task:unarchived",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: userId.toString(),
        }
    );

    return signedTask;
};

const getArchivedTasks = async (projectId, userId) => {
    await getProjectForUser({ projectId, userId });
    return await Task.find({
        project: projectId,
        isArchived: true,
    })
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar")
        .populate("archivedBy", "username email avatar")
        .sort({ archivedAt: -1 });
}

const moveTask = async ({ taskId, columnId, user }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await getProjectForUser({ projectId: task.project, userId: user._id });

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === user._id.toString()
    );
    const isAdmin = (member && member.role === "admin");

    const isAssigned = (task.assignedTo || []).some(
        (assigneeId) => assigneeId.toString() === user._id.toString()
    );

    if (!isAdmin && !isAssigned) {
        throw new Error("Access Denied: Only admins and assigned users can move tasks");
    }

    const oldColumnId = task.column.toString();

    const oldColumn = await Column.findById(task.column).select("name");
    const newColumn = await Column.findById(columnId).select("name");

    const isMovingToDone =
        newColumn?.name?.trim().toLowerCase() === "done";
    const wasInDone =
        oldColumn?.name?.trim().toLowerCase() === "done";

    task.column = columnId;
    if (newColumn) {
        task.status = mapColumnNameToStatus(newColumn.name);
    }
    task.completedAt = isMovingToDone
        ? new Date()
        : (wasInDone ? null : task.completedAt);
    task.completedBy = isMovingToDone
        ? user._id
        : (wasInDone ? null : task.completedBy);

    if (task.status === "inprogress" && !task.startedAt) {
        task.startedAt = new Date();
    }

    task.lastMovedBy = user._id;

    await task.save();

    try {
        if (isMovingToDone) {
            await logActivity({
                actor: user._id,
                type: "task_completed",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                workspace: workspace._id,
                project: project._id,
            });
        } else if (oldColumnId !== columnId.toString()) {
            await logActivity({
                actor: user._id,
                type: "status_changed",
                targetType: "Task",
                targetId: task._id,
                targetTitle: task.title,
                workspace: workspace._id,
                project: project._id,
                metadata: {
                    oldStatus: mapColumnNameToStatus(oldColumn.name),
                    newStatus: task.status,
                }
            });
        }
    } catch (activityError) {
        console.error("Failed to log activity in moveTask:", activityError);
    }

    const sender = await User.findById(user._id)
        .select("username");

    if (oldColumnId !== columnId.toString()) {
        for (const assignee of task.assignedTo) {
            if (assignee.toString() === user._id.toString()) {
                continue;
            }

            await createNotification({
                recipient: assignee,
                sender: user._id,
                workspace: workspace._id,
                project: project._id,
                task: task._id,
                type: "TASK_MOVED",
                title: "Task Moved",
                message: `${sender.username} moved task "${task.title}" from "${oldColumn.name}" to "${newColumn.name}".`,
                actionUrl: `/tasks/${task._id}`,
                metadata: {
                    fromColumn: oldColumn.name,
                    toColumn: newColumn.name
                }
            });
        }
    }

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name")
        .populate("completedBy", "username email avatar")
        .populate("updatedBy", "username email avatar")
        .populate("lastMovedBy", "username email avatar");

    const signedTask = await signTaskAvatars(populatedTask);

    emitToWorkspace(
        workspace._id.toString(),
        "task:moved",
        {
            task: signedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );

    return signedTask;
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    getArchivedTasks,
    moveTask
};
